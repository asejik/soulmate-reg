package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-pdf/fpdf"
)

// Context key for safely passing the user ID through the request lifecycle
type contextKey string

const userIDKey contextKey = "user_id"

// LMSAuth Middleware verifies the Supabase Bearer Token
func LMSAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}

		supabaseURL := os.Getenv("SUPABASE_URL")
		serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

		req, err := http.NewRequest("GET", supabaseURL+"/auth/v1/user", nil)
		if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		req.Header.Set("Authorization", authHeader)
		req.Header.Set("apikey", serviceKey)

		client := &http.Client{}
		resp, err := client.Do(req)

		if err != nil || resp.StatusCode != http.StatusOK {
			http.Error(w, "Unauthorized or Expired Token", http.StatusUnauthorized)
			return
		}
		defer resp.Body.Close()

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)

		userID, ok := result["id"].(string)
		if !ok {
			http.Error(w, "User ID not found in token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetDashboard Handler
func GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	// 1. Fetch the Cohort Name
	var cohortName string
	err := db.Pool.QueryRow(r.Context(), `SELECT title FROM public.modules WHERE id = '11111111-1111-1111-1111-111111111111'`).Scan(&cohortName)
	if err != nil {
		http.Error(w, "Failed to load cohort data", http.StatusInternalServerError)
		return
	}

	// 2. NEW: Dynamically count how many lessons this specific user has completed
	var completedLessons int
	err = db.Pool.QueryRow(r.Context(), `
		SELECT COUNT(*)
		FROM public.lesson_progress
		WHERE user_id = $1 AND is_completed = true
	`, userID).Scan(&completedLessons)

	if err != nil {
		completedLessons = 0 // If they haven't completed any, default to 0
	}

	// 3. NEW: Dynamically count the total lessons in this module
	var totalLessons int
	err = db.Pool.QueryRow(r.Context(), `
		SELECT COUNT(*)
		FROM public.lessons
		WHERE module_id = '11111111-1111-1111-1111-111111111111'
	`).Scan(&totalLessons)

	if err != nil || totalLessons == 0 {
		totalLessons = 1 // Prevent divide-by-zero errors in the frontend
	}

	// 4. Fetch the Next Lesson
	var lessonID, lessonTitle, estimatedTime string
	err = db.Pool.QueryRow(r.Context(), `SELECT id, title, estimated_time FROM public.lessons WHERE id = '22222222-2222-2222-2222-222222222222'`).Scan(&lessonID, &lessonTitle, &estimatedTime)
	if err != nil {
		http.Error(w, "Failed to load next lesson", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"user_id": userID,
		"cohort": map[string]interface{}{
			"name":              cohortName,
			"total_lessons":     totalLessons,     // Now dynamic!
			"completed_lessons": completedLessons, // Now dynamic!
		},
		"next_lesson": map[string]interface{}{
			"id":             lessonID,
			"title":          lessonTitle,
			"estimated_time": estimatedTime,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetLesson Handler
func GetLesson(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

	var id, title, description, videoId, assignmentPrompt string

	// Query the exact lesson the user clicked on using the dynamic ID!
	err := db.Pool.QueryRow(r.Context(), `
		SELECT id, title, description, video_id, assignment_prompt
		FROM public.lessons
		WHERE id = $1
	`, lessonID).Scan(&id, &title, &description, &videoId, &assignmentPrompt)

	if err != nil {
		http.Error(w, "Lesson not found", http.StatusNotFound)
		return
	}

	response := map[string]interface{}{
		"id":               id,
		"title":            title,
		"description":      description,
		"videoId":          videoId,
		"assignmentPrompt": assignmentPrompt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// --- NEW: Assignment Submission Engine ---

// Struct to catch the JSON payload from React
type AssignmentSubmissionRequest struct {
	SubmissionType string `json:"submissionType"`
	Content        string `json:"content"`
}

// SubmitAssignment Handler
func SubmitAssignment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req AssignmentSubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Basic Validation
	if req.SubmissionType == "" || req.Content == "" {
		http.Error(w, "Missing submission type or content", http.StatusBadRequest)
		return
	}

	// 1. Save the actual assignment submission
	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.assignment_submissions (user_id, lesson_id, submission_type, content)
		VALUES ($1, $2, $3, $4)
	`, userID, lessonID, req.SubmissionType, req.Content)

	if err != nil {
		http.Error(w, "Failed to save submission to database", http.StatusInternalServerError)
		return
	}

	// 2. Update the user's progress using an "Upsert"
	// If a progress row doesn't exist, it creates one. If it does exist, it updates it.
	_, err = db.Pool.Exec(r.Context(), `
		INSERT INTO public.lesson_progress (user_id, lesson_id, is_completed, is_unlocked, highest_watched_pct)
		VALUES ($1, $2, true, true, 100)
		ON CONFLICT (user_id, lesson_id)
		DO UPDATE SET is_completed = true, highest_watched_pct = GREATEST(lesson_progress.highest_watched_pct, 100)
	`, userID, lessonID)

	if err != nil {
		http.Error(w, "Failed to update lesson progress", http.StatusInternalServerError)
		return
	}

	// 3. Send success response back to React
	response := map[string]string{
		"status":  "success",
		"message": "Assignment successfully submitted and module unlocked!",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK) // Send 200 OK status
	json.NewEncoder(w).Encode(response)
}

// --- NEW: Certificate Engine ---

// GenerateCertificate Handler (V3: Smart Multi-Table Query)
func GenerateCertificate(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	// 1. Fetch the User's Name by checking BOTH registration tables
	var fullName string
	err := db.Pool.QueryRow(r.Context(), `
		SELECT COALESCE(cl.full_name, p.full_name) AS full_name
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1
		LIMIT 1
	`, userID).Scan(&fullName)

	// If the user's email isn't in EITHER table (e.g., a test account you made manually in Auth)
	if err != nil || fullName == "" {
		fullName = "Valued Participant (No Registration Found)"
	}

	// 2. Fetch the Cohort Name
	var cohortName string
	err = db.Pool.QueryRow(r.Context(), `
		SELECT title
		FROM public.modules
		WHERE id = '11111111-1111-1111-1111-111111111111'
	`).Scan(&cohortName)

	if err != nil {
		cohortName = "Couples' Launchpad"
	}

	// 3. Generate the PDF
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	pdf.SetLineWidth(2.0)
	pdf.SetDrawColor(236, 72, 153)
	pdf.Rect(10, 10, 277, 190, "D")

	pdf.SetFont("Arial", "B", 40)
	pdf.SetTextColor(30, 30, 50)
	pdf.CellFormat(277, 50, "Certificate of Completion", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 20)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(277, 20, "This proudly certifies that", "", 1, "C", false, 0, "")

	// DYNAMIC NAME
	pdf.SetFont("Arial", "B", 35)
	pdf.SetTextColor(236, 72, 153)
	pdf.CellFormat(277, 30, fullName, "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 20)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(277, 20, "has successfully completed the curriculum for", "", 1, "C", false, 0, "")

	// DYNAMIC COHORT
	pdf.SetFont("Arial", "B", 25)
	pdf.SetTextColor(30, 30, 50)
	pdf.CellFormat(277, 30, cohortName, "", 1, "C", false, 0, "")

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="TAI_Certificate.pdf"`)

	pdf.Output(w)
}
