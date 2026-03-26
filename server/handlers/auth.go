package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"

	"github.com/asejik/soulmate-reg/server/db"
)

type ClaimAccountRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// ClaimAccount verifies the email against registrations and creates the Auth user
func ClaimAccount(w http.ResponseWriter, r *http.Request) {
	// 1. Set the response type to JSON for ALL responses (success or error)
	w.Header().Set("Content-Type", "application/json")

	var req ClaimAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request format"})
		return
	}

	if req.Email == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Email and password are required"})
		return
	}

	// 2. VERIFY: Does this email exist in either registration table?
	var exists bool
	err := db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS (
			SELECT 1 FROM public.couples_launchpad WHERE email = $1
			UNION ALL
			SELECT 1 FROM public.participants WHERE email = $1
		)
	`, req.Email).Scan(&exists)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Database verification failed"})
		return
	}

	if !exists {
		// The Bouncer says NO - Sent as proper JSON!
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "We couldn't find a registration for this email. Please check your spelling or contact support.",
		})
		return
	}

	// 3. CREATE: The email is valid. Create the user via Supabase Admin API.
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	adminReqBody, _ := json.Marshal(map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
	})

	httpReq, err := http.NewRequest("POST", supabaseURL+"/auth/v1/admin/users", bytes.NewBuffer(adminReqBody))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to build auth request"})
		return
	}

	httpReq.Header.Set("apikey", serviceKey)
	httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)

	if err != nil || resp.StatusCode >= 400 {
		// If the user already claimed the account or password is too short
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Failed to create account. You may have already claimed it, or your password is too weak (min 6 characters).",
		})
		return
	}
	defer resp.Body.Close()

	// 4. SUCCESS: Send the green light back to React
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Account successfully claimed! You can now log in.",
	})
}
