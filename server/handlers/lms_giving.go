package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/asejik/soulmate-reg/server/db"
)

func SubmitGivingCommitment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	var req struct {
		ProgramName    string `json:"programName"`
		CommitmentText string `json:"commitmentText"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.CommitmentText == "" {
		http.Error(w, "Commitment text is required", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.giving_commitments (user_id, program_name, commitment_text)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, program_name) DO UPDATE SET commitment_text = $3, created_at = NOW()
	`, userID, req.ProgramName, req.CommitmentText)

	if err != nil {
		fmt.Printf("💥 GIVING COMMITMENT SAVE ERROR: %v\n", err)
		http.Error(w, "Failed to save commitment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Commitment submitted!"})
}

func GetGivingCommitment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	programName := r.URL.Query().Get("program")

	if programName == "" {
		http.Error(w, "Program name is required", http.StatusBadRequest)
		return
	}

	var commitment string
	err := db.Pool.QueryRow(r.Context(), "SELECT commitment_text FROM public.giving_commitments WHERE user_id = $1 AND program_name = $2", userID, programName).Scan(&commitment)

	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		json.NewEncoder(w).Encode(nil)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"commitment": commitment})
}

func GetAdminGivingCommitments(w http.ResponseWriter, r *http.Request) {
	// Security check: verify admin email
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT gc.commitment_text, gc.created_at, gc.program_name, 
			   COALESCE(cl.full_name, p.full_name, 'Participant') as user_name,
			   au.email
		FROM public.giving_commitments gc
		JOIN auth.users au ON gc.user_id = au.id
		LEFT JOIN public.couples_launchpad cl ON lower(au.email) = lower(cl.email)
		LEFT JOIN public.participants p ON lower(au.email) = lower(p.email)
		ORDER BY gc.created_at DESC
	`)

	if err != nil {
		fmt.Printf("⚠️  Admin Giving Fetch Failed: %v\n", err)
		http.Error(w, "Failed to fetch commitments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type CommitmentRecord struct {
		CommitmentText string `json:"commitment_text"`
		CreatedAt      string `json:"created_at"`
		ProgramName    string `json:"program_name"`
		UserName       string `json:"user_name"`
		UserEmail      string `json:"user_email"`
	}

	results := []CommitmentRecord{}
	for rows.Next() {
		var c CommitmentRecord
		var createdAt interface{}
		if err := rows.Scan(&c.CommitmentText, &createdAt, &c.ProgramName, &c.UserName, &c.UserEmail); err == nil {
			c.CreatedAt = fmt.Sprintf("%v", createdAt)
			results = append(results, c)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
