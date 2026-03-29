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

// --- Structs for the Curriculum List ---
type DashLesson struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	EstimatedTime string `json:"estimated_time"`
	IsCompleted   bool   `json:"is_completed"`
}

type DashModule struct {
	ID      string       `json:"id"`
	Title   string       `json:"title"`
	Lessons []DashLesson `json:"lessons"`
}

// GetDashboard Handler
func GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	// 1. Determine User's Program
	var programName string
	err := db.Pool.QueryRow(r.Context(), `
		SELECT CASE
			WHEN cl.email IS NOT NULL THEN 'launchpad'
			WHEN p.email IS NOT NULL THEN 'Ready for a Soulmate'
			ELSE 'launchpad'
		END
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&programName)

	if err != nil {
		programName = "launchpad"
	}

	displayCohortName := programName
	if programName == "launchpad" {
		displayCohortName = "Couples' Launchpad 5.0"
	}

	// 2. Count Total Lessons
	var totalLessons int
	db.Pool.QueryRow(r.Context(), `
		SELECT COUNT(l.id) FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id WHERE m.program_name = $1
	`, programName).Scan(&totalLessons)
	if totalLessons == 0 { totalLessons = 1 }

	// 3. Count Completed Lessons
	var completedLessons int
	db.Pool.QueryRow(r.Context(), `
		SELECT COUNT(lp.lesson_id) FROM public.lesson_progress lp
		JOIN public.lessons l ON lp.lesson_id = l.id
		JOIN public.modules m ON l.module_id = m.id
		WHERE lp.user_id = $1 AND lp.is_completed = true AND m.program_name = $2
	`, userID, programName).Scan(&completedLessons)

	// 3.5 NEW: Check if the user has completed the final review
	var hasCompletedFinalReview bool
	db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS(
			SELECT 1 FROM public.program_reviews
			WHERE user_id = $1 AND program_name = $2
		)
	`, userID, programName).Scan(&hasCompletedFinalReview)

	// NEW: Check if the user has completed the mid-cohort review
	var hasCompletedMidReview bool
	db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS(
			SELECT 1 FROM public.program_reviews
			WHERE user_id = $1 AND program_name = $2 AND review_type = 'mid_cohort'
		)
	`, userID, programName).Scan(&hasCompletedMidReview)

	// 4. Smart Next Lesson
	var lessonID, lessonTitle, estimatedTime string
	err = db.Pool.QueryRow(r.Context(), `
		SELECT l.id, l.title, l.estimated_time FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id
		WHERE m.program_name = $1 AND l.id NOT IN (
			SELECT lesson_id FROM public.lesson_progress WHERE user_id = $2 AND is_completed = true
		)
		ORDER BY m.sort_order ASC, l.sort_order ASC LIMIT 1
	`, programName, userID).Scan(&lessonID, &lessonTitle, &estimatedTime)

	if err != nil {
		lessonID = ""
		lessonTitle = "Course Completed"
		estimatedTime = "0 mins"
	}

	// 5. NEW: Fetch the Full Curriculum for Rewatching
	rows, err := db.Pool.Query(r.Context(), `
		SELECT m.id, m.title, l.id, l.title, l.estimated_time, COALESCE(lp.is_completed, false)
		FROM public.modules m
		JOIN public.lessons l ON m.id = l.module_id
		LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $2
		WHERE m.program_name = $1
		ORDER BY m.sort_order ASC, l.sort_order ASC
	`, programName, userID)

	var modules []DashModule
	var currentModule *DashModule

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var mID, mTitle, lID, lTitle, lEstTime string
			var lCompleted bool

			if err := rows.Scan(&mID, &mTitle, &lID, &lTitle, &lEstTime, &lCompleted); err == nil {
				// Group lessons into their modules
				if currentModule == nil || currentModule.ID != mID {
					if currentModule != nil {
						modules = append(modules, *currentModule)
					}
					currentModule = &DashModule{ID: mID, Title: mTitle, Lessons: []DashLesson{}}
				}
				currentModule.Lessons = append(currentModule.Lessons, DashLesson{
					ID: lID, Title: lTitle, EstimatedTime: lEstTime, IsCompleted: lCompleted,
				})
			}
		}
		if currentModule != nil {
			modules = append(modules, *currentModule)
		}
	}

	// 6. Return Data
	response := map[string]interface{}{
		"user_id": userID,
		"has_completed_final_review": hasCompletedFinalReview,
		"has_completed_mid_review": hasCompletedMidReview,
		"cohort": map[string]interface{}{
			"name":              displayCohortName,
			"total_lessons":     totalLessons,
			"completed_lessons": completedLessons,
		},
		"next_lesson": map[string]interface{}{
			"id":             lessonID,
			"title":          lessonTitle,
			"estimated_time": estimatedTime,
		},
		"curriculum": modules, // Send the full list to React!
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetLesson fetches data for a single lesson and checks if the user has already completed it
func GetLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var lesson struct {
		ID               string `json:"id"`
		Title            string `json:"title"`
		Description      string `json:"description"`
		VideoID          string `json:"videoId"`
		EstimatedTime    string `json:"estimatedTime"`
		AssignmentPrompt string `json:"assignmentPrompt"`
		IsCompleted      bool   `json:"is_completed"` // <-- NEW FLAG
	}

	// 1. Fetch the lesson details
	err := db.Pool.QueryRow(r.Context(), `
		SELECT id, title, description, video_id, estimated_time, assignment_prompt
		FROM public.lessons WHERE id = $1
	`, lessonID).Scan(&lesson.ID, &lesson.Title, &lesson.Description, &lesson.VideoID, &lesson.EstimatedTime, &lesson.AssignmentPrompt)

	if err != nil {
		http.Error(w, "Lesson not found", http.StatusNotFound)
		return
	}

	// 2. Check if the user has already completed this lesson
	db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS(
			SELECT 1 FROM public.lesson_progress
			WHERE user_id = $1 AND lesson_id = $2 AND is_completed = true
		)
	`, userID, lessonID).Scan(&lesson.IsCompleted)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lesson)
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

// --- NEW: Testimonial Gateway Engine ---

type ReviewSubmissionRequest struct {
	ReviewType string `json:"reviewType"`
	Content    string `json:"content"`
}

func SubmitReview(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	var req ReviewSubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Figure out which program they belong to
	var programName string
	db.Pool.QueryRow(r.Context(), `
		SELECT CASE
			WHEN cl.email IS NOT NULL THEN 'launchpad'
			WHEN p.email IS NOT NULL THEN 'Ready for a Soulmate'
			ELSE 'launchpad'
		END
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&programName)

	// Save the review to the database
	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.program_reviews (user_id, program_name, review_type, content)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, program_name) DO NOTHING
	`, userID, programName, req.ReviewType, req.Content)

	if err != nil {
		http.Error(w, "Failed to save review", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Review submitted successfully!"})
}

// --- NEW: Discussion Forum Engine ---

type CommentResponse struct {
	ID          string `json:"id"`
	LessonID    string `json:"lesson_id"`
	LessonTitle string `json:"lesson_title"`
	UserName    string `json:"user_name"`
	Content     string `json:"content"`
	CreatedAt   string `json:"created_at"`
}

type PostCommentRequest struct {
	Content string `json:"content"`
}

// PostLessonComment saves a new comment to the database
func PostLessonComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req PostCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.lesson_comments (lesson_id, user_id, content)
		VALUES ($1, $2, $3)
	`, lessonID, userID, req.Content)

	if err != nil {
		http.Error(w, "Failed to post comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment posted!"})
}

// GetLessonComments fetches comments for ONE specific video
func GetLessonComments(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

	// We join the auth table with your registration tables to get their real name!
	rows, err := db.Pool.Query(r.Context(), `
		SELECT c.id, c.lesson_id, l.title, c.content, c.created_at,
		       COALESCE(cl.full_name, p.full_name, 'Participant') AS user_name
		FROM public.lesson_comments c
		JOIN public.lessons l ON c.lesson_id = l.id
		JOIN auth.users au ON c.user_id = au.id
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE c.lesson_id = $1
		ORDER BY c.created_at DESC
	`, lessonID)

	if err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []CommentResponse
	for rows.Next() {
		var c CommentResponse
		if err := rows.Scan(&c.ID, &c.LessonID, &c.LessonTitle, &c.Content, &c.CreatedAt, &c.UserName); err == nil {
			comments = append(comments, c)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// GetGlobalDiscussions fetches ALL comments for the user's specific cohort
func GetGlobalDiscussions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	// 1. Determine User's Program so we don't mix RFASM and Launchpad comments!
	var programName string
	db.Pool.QueryRow(r.Context(), `
		SELECT CASE
			WHEN cl.email IS NOT NULL THEN 'launchpad'
			WHEN p.email IS NOT NULL THEN 'Ready for a Soulmate'
			ELSE 'launchpad'
		END
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&programName)

	// 2. Fetch all comments for that program, ordered by module/lesson flow
	rows, err := db.Pool.Query(r.Context(), `
		SELECT c.id, c.lesson_id, l.title, c.content, c.created_at,
		       COALESCE(cl.full_name, p.full_name, 'Participant') AS user_name
		FROM public.lesson_comments c
		JOIN public.lessons l ON c.lesson_id = l.id
		JOIN public.modules m ON l.module_id = m.id
		JOIN auth.users au ON c.user_id = au.id
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE m.program_name = $1
		ORDER BY m.sort_order ASC, l.sort_order ASC, c.created_at DESC
	`, programName)

	if err != nil {
		http.Error(w, "Failed to fetch global discussions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []CommentResponse
	for rows.Next() {
		var c CommentResponse
		if err := rows.Scan(&c.ID, &c.LessonID, &c.LessonTitle, &c.Content, &c.CreatedAt, &c.UserName); err == nil {
			comments = append(comments, c)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}