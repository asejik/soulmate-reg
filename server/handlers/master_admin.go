package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"fmt"

	"github.com/asejik/soulmate-reg/server/db"
)

type MasterAdminUser struct {
	ID        string    `json:"id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
}

// GetMasterAdminUsers fetches all registered users across both programs
func GetMasterAdminUsers(w http.ResponseWriter, r *http.Request) {
	// 1. Double-Lock Security: Verify the requester is actually the admin via JWT
	userID := r.Context().Value(userIDKey).(string)

	var email string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&email)
	if err != nil || email != "asejik@gmail.com" {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Query BOTH tables and combine them into one list using UNION ALL
	rows, err := db.Pool.Query(r.Context(), `
		SELECT id::text, full_name, email, 'Ready for a Soulmate' as source, created_at
		FROM public.participants
		UNION ALL
		SELECT id::text, full_name, email, 'Couples Launchpad' as source, created_at
		FROM public.couples_launchpad
		ORDER BY created_at DESC
	`)

	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []MasterAdminUser
	for rows.Next() {
		var u MasterAdminUser
		if err := rows.Scan(&u.ID, &u.FullName, &u.Email, &u.Source, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}

	// 3. Return the data to the React frontend
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

type AdminSubmission struct {
	ID            string    `json:"id"`
	StudentName   string    `json:"student_name"`
	Email         string    `json:"email"`
	LessonTitle   string    `json:"lesson_title"`
	SubmissionURL string    `json:"submission_url"`
	SubmittedAt   time.Time `json:"submitted_at"`
}

// GetAdminSubmissions fetches all assignment submissions for review
func GetAdminSubmissions(w http.ResponseWriter, r *http.Request) {
	// 1. Double-Lock Security
	userID := r.Context().Value(userIDKey).(string)

	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || adminEmail != "asejik@gmail.com" {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Fetch submissions using the EXACT column names
	rows, err := db.Pool.Query(r.Context(), `
		SELECT
			sub.id::text,
			COALESCE(cl.full_name, p.full_name, 'Unknown User') AS student_name,
			au.email,
			l.title AS lesson_title,
			sub.content,
			sub.submitted_at
		FROM public.assignment_submissions sub
		JOIN auth.users au ON sub.user_id = au.id
		JOIN public.lessons l ON sub.lesson_id = l.id
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		ORDER BY sub.submitted_at DESC
	`)

	if err != nil {
		fmt.Println("💥 DB QUERY ERROR:", err)
		http.Error(w, "Failed to fetch submissions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var submissions []AdminSubmission
	for rows.Next() {
		var s AdminSubmission
		// Scan directly into the SubmissionURL and SubmittedAt fields of our Go struct
		if err := rows.Scan(&s.ID, &s.StudentName, &s.Email, &s.LessonTitle, &s.SubmissionURL, &s.SubmittedAt); err != nil {
			fmt.Println("💥 DB SCAN ERROR:", err)
			continue
		}
		submissions = append(submissions, s)
	}

	// 3. Return the data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}

// DeleteAdminUser removes a user from either the CLP or RFASM tables based on the provided source
func DeleteAdminUser(w http.ResponseWriter, r *http.Request) {
	// 1. Verify Admin JWT
	userID := r.Context().Value(userIDKey).(string)

	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || adminEmail != "asejik@gmail.com" {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Grab the query parameters sent by React
	targetID := r.URL.Query().Get("id")
	source := r.URL.Query().Get("source")

	if targetID == "" || source == "" {
		http.Error(w, "Missing id or source parameter", http.StatusBadRequest)
		return
	}

	// 3. Determine which table to delete from based on the source
	var query string
	if source == "Ready for a Soulmate" {
		query = "DELETE FROM public.participants WHERE id = $1"
	} else if source == "Couples Launchpad" {
		query = "DELETE FROM public.couples_launchpad WHERE id = $1"
	} else {
		http.Error(w, "Invalid source", http.StatusBadRequest)
		return
	}

	// 4. Execute the deletion
	_, err = db.Pool.Exec(r.Context(), query, targetID)
	if err != nil {
		fmt.Println("💥 DB DELETE ERROR:", err)
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	// 5. Return success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User successfully deleted"})
}

// --- CURRICULUM MANAGER DATA STRUCTURES ---
type CurriculumModule struct {
	ID          string `json:"id"`
	ProgramName string `json:"program_name"`
	Title       string `json:"title"`
	SortOrder   int    `json:"sort_order"`
}

type CurriculumLesson struct {
	ModuleID         string `json:"module_id"`
	Title            string `json:"title"`
	Description      string `json:"description"`
	VideoID          string `json:"video_id"`
	EstimatedTime    string `json:"estimated_time"`
	AssignmentPrompt string `json:"assignment_prompt"`
	SortOrder        int    `json:"sort_order"`
}

// GetAdminModules fetches modules for the dropdown in the UI
func GetAdminModules(w http.ResponseWriter, r *http.Request) {
	// Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if adminEmail != "asejik@gmail.com" {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	rows, err := db.Pool.Query(r.Context(), "SELECT id::text, program_name, title, sort_order FROM public.modules ORDER BY program_name, sort_order ASC")
	if err != nil {
		http.Error(w, "Failed to fetch modules", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var modules []CurriculumModule
	for rows.Next() {
		var m CurriculumModule
		if err := rows.Scan(&m.ID, &m.ProgramName, &m.Title, &m.SortOrder); err == nil {
			modules = append(modules, m)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(modules)
}

// CreateAdminModule injects a new module into the database
func CreateAdminModule(w http.ResponseWriter, r *http.Request) {
	// Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if adminEmail != "asejik@gmail.com" {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	var m CurriculumModule
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.modules (program_name, title, sort_order)
		VALUES ($1, $2, $3)`,
		m.ProgramName, m.Title, m.SortOrder)

	if err != nil {
		fmt.Println("💥 DB INSERT ERROR (Module):", err)
		http.Error(w, "Failed to create module", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Module created successfully!"})
}

// CreateAdminLesson injects a new lesson into the database
func CreateAdminLesson(w http.ResponseWriter, r *http.Request) {
	// Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if adminEmail != "asejik@gmail.com" {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	var l CurriculumLesson
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.lessons (module_id, title, description, video_id, estimated_time, assignment_prompt, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		l.ModuleID, l.Title, l.Description, l.VideoID, l.EstimatedTime, l.AssignmentPrompt, l.SortOrder)

	if err != nil {
		fmt.Println("💥 DB INSERT ERROR (Lesson):", err)
		http.Error(w, "Failed to create lesson", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Lesson created successfully!"})
}