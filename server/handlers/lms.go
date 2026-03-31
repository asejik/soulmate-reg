package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
	"github.com/jung-kurt/gofpdf"
)

// =====================================================================
// 1. ENGINE, AUTH & HELPERS
// =====================================================================

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

// resolveActiveProgram detects if a user is in RFASM, CLP, or both
func resolveActiveProgram(ctx context.Context, userID string, requestedProgram string) (string, []string, error) {
	var isLaunchpad, isSoulmate bool
	err := db.Pool.QueryRow(ctx, `
		SELECT cl.email IS NOT NULL, p.email IS NOT NULL
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&isLaunchpad, &isSoulmate)

	if err != nil {
		return "", nil, err
	}

	var enrolled []string
	if isLaunchpad {
		enrolled = append(enrolled, "launchpad")
	}
	if isSoulmate {
		enrolled = append(enrolled, "Ready for a Soulmate")
	}

	if len(enrolled) == 0 {
		return "", nil, nil
	}

	active := enrolled[0]
	if requestedProgram != "" {
		for _, p := range enrolled {
			if p == requestedProgram {
				active = p
				break
			}
		}
	}
	return active, enrolled, nil
}

// =====================================================================
// 2. DASHBOARD ENGINE
// =====================================================================

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

func GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	// 1. Determine Active Program
	requestedProgram := r.URL.Query().Get("program")
	programName, enrolledPrograms, err := resolveActiveProgram(r.Context(), userID, requestedProgram)
	if err != nil || programName == "" {
		http.Error(w, "Program access denied", http.StatusForbidden)
		return
	}

	programNameDisplay := "Ready for a Soulmate"
	if programName == "launchpad" {
		programNameDisplay = "Couples' Launchpad 5.0"
	}

	// 2. Count Total Lessons
	var totalLessons int
	db.Pool.QueryRow(r.Context(), `
		SELECT COUNT(l.id) FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id WHERE m.program_name = $1
	`, programName).Scan(&totalLessons)
	if totalLessons == 0 {
		totalLessons = 1
	}

	// 3. Count Completed Lessons
	var completedLessons int
	db.Pool.QueryRow(r.Context(), `
		SELECT COUNT(lp.lesson_id) FROM public.lesson_progress lp
		JOIN public.lessons l ON lp.lesson_id = l.id
		JOIN public.modules m ON l.module_id = m.id
		WHERE lp.user_id = $1 AND lp.is_completed = true AND m.program_name = $2
	`, userID, programName).Scan(&completedLessons)

	// 4. Check Gateways
	var hasCompletedFinalReview bool
	db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS(
			SELECT 1 FROM public.program_reviews
			WHERE user_id = $1 AND program_name = $2 AND review_type IN ('video', 'text')
		)
	`, userID, programName).Scan(&hasCompletedFinalReview)

	var hasCompletedMidReview bool
	db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS(
			SELECT 1 FROM public.program_reviews
			WHERE user_id = $1 AND program_name = $2 AND review_type = 'mid_cohort'
		)
	`, userID, programName).Scan(&hasCompletedMidReview)

	// 5. Smart Next Lesson
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

	// 6. Fetch Full Curriculum
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

	// 7. Send Response
	response := map[string]interface{}{
		"user_id":                    userID,
		"has_completed_final_review": hasCompletedFinalReview,
		"has_completed_mid_review":   hasCompletedMidReview,
		"active_program":             programName,
		"enrolled_programs":          enrolledPrograms,
		"cohort": map[string]interface{}{
			"name":              programNameDisplay,
			"total_lessons":     totalLessons,
			"completed_lessons": completedLessons,
		},
		"next_lesson": map[string]interface{}{
			"id":             lessonID,
			"title":          lessonTitle,
			"estimated_time": estimatedTime,
		},
		"curriculum": modules,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// =====================================================================
// 3. LESSON & SUBMISSION ENGINE
// =====================================================================

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
		IsCompleted      bool   `json:"is_completed"`
		IsLocked         bool   `json:"is_locked"` // <-- NEW BOUNCER FLAG
	}

	// 1. Fetch lesson details AND its parent program
	var programName string
	err := db.Pool.QueryRow(r.Context(), `
		SELECT l.id, l.title, l.description, l.video_id, l.estimated_time, l.assignment_prompt, m.program_name
		FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id
		WHERE l.id = $1
	`, lessonID).Scan(&lesson.ID, &lesson.Title, &lesson.Description, &lesson.VideoID, &lesson.EstimatedTime, &lesson.AssignmentPrompt, &programName)

	if err != nil {
		http.Error(w, "Lesson not found", http.StatusNotFound)
		return
	}

	// 2. Check if already completed
	db.Pool.QueryRow(r.Context(), `
		SELECT EXISTS(
			SELECT 1 FROM public.lesson_progress
			WHERE user_id = $1 AND lesson_id = $2 AND is_completed = true
		)
	`, userID, lessonID).Scan(&lesson.IsCompleted)

	// 3. THE BOUNCER LOGIC: Determine if it should be locked
	if lesson.IsCompleted {
		lesson.IsLocked = false
	} else {
		// Find the exact next lesson they are supposed to be on
		var nextLessonID string
		err = db.Pool.QueryRow(r.Context(), `
			SELECT l.id FROM public.lessons l
			JOIN public.modules m ON l.module_id = m.id
			WHERE m.program_name = $1 AND l.id NOT IN (
				SELECT lesson_id FROM public.lesson_progress WHERE user_id = $2 AND is_completed = true
			)
			ORDER BY m.sort_order ASC, l.sort_order ASC LIMIT 1
		`, programName, userID).Scan(&nextLessonID)

		// If the requested lesson IS the next lesson, unlock it. Otherwise, lock it!
		if err == nil && nextLessonID == lessonID {
			lesson.IsLocked = false
		} else {
			lesson.IsLocked = true
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lesson)
}

type AssignmentSubmissionRequest struct {
	SubmissionType string `json:"submissionType"`
	Content        string `json:"content"`
}

func SubmitAssignment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req AssignmentSubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.assignment_submissions (user_id, lesson_id, submission_type, content)
		VALUES ($1, $2, $3, $4)
	`, userID, lessonID, req.SubmissionType, req.Content)

	if err != nil {
		http.Error(w, "Failed to save submission to database", http.StatusInternalServerError)
		return
	}

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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Assignment successfully submitted!"})
}

// =====================================================================
// 4. COMMUNITY, FORUMS & REVIEWS
// =====================================================================

type CommentResponse struct {
	ID          string `json:"id"`
	LessonID    string `json:"lesson_id"`
	LessonTitle string `json:"lesson_title"`
	UserName    string `json:"user_name"`
	Content     string `json:"content"`
	CreatedAt   string `json:"created_at"`
}

func PostLessonComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req struct {
		Content string `json:"content"`
	}
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

func GetLessonComments(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

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

func GetGlobalDiscussions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")

	// Uses the active program resolver instead of raw SQL
	programName, _, err := resolveActiveProgram(r.Context(), userID, requestedProgram)
	if err != nil || programName == "" {
		http.Error(w, "Program access denied", http.StatusForbidden)
		return
	}

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
		ORDER BY c.created_at DESC
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

type ReviewSubmissionRequest struct {
	ReviewType string `json:"reviewType"`
	Content    string `json:"content"`
}

func SubmitReview(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")

	// Uses the active program resolver
	programName, _, err := resolveActiveProgram(r.Context(), userID, requestedProgram)
	if err != nil || programName == "" {
		http.Error(w, "Program access denied", http.StatusForbidden)
		return
	}

	var req ReviewSubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	_, err = db.Pool.Exec(r.Context(), `
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

// =====================================================================
// 5. CERTIFICATE GENERATOR
// =====================================================================

func GenerateCertificate(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

	// Fetch active program
	requestedProgram := r.URL.Query().Get("program")
	programName, _, err := resolveActiveProgram(r.Context(), userID, requestedProgram)
	if err != nil || programName == "" {
		http.Error(w, "Program access denied", http.StatusForbidden)
		return
	}

	displayProgramName := "Ready for a Soulmate"
	if programName == "launchpad" {
		displayProgramName = "Couples' Launchpad 5.0"
	}

	var userName string
	err = db.Pool.QueryRow(r.Context(), `
		SELECT COALESCE(cl.full_name, p.full_name, 'Participant')
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&userName)

	if err != nil {
		http.Error(w, "Failed to fetch user data", http.StatusInternalServerError)
		return
	}

	// Generate PDF
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	// Outer thick border (Dark Navy)
	pdf.SetDrawColor(15, 23, 42)
	pdf.SetLineWidth(2.0)
	pdf.Rect(10, 10, 277, 190, "D")

	// Inner elegant border (Gold)
	pdf.SetDrawColor(212, 175, 55)
	pdf.SetLineWidth(0.5)
	pdf.Rect(14, 14, 269, 182, "D")

	// Elegant Corner Accents
	pdf.SetLineWidth(1.0)
	pdf.Line(18, 18, 30, 18)
	pdf.Line(18, 18, 18, 30)
	pdf.Line(279, 18, 267, 18)
	pdf.Line(279, 18, 279, 30)
	pdf.Line(18, 192, 30, 192)
	pdf.Line(18, 192, 18, 180)
	pdf.Line(279, 192, 267, 192)
	pdf.Line(279, 192, 279, 180)

	/// Stamp the Logo
	logoPath := "../client/public/logo.png"
	pdf.ImageOptions(logoPath, 130, 22, 37, 0, false, gofpdf.ImageOptions{ReadDpi: true}, 0, "")

	// Main Certificate Body
	pdf.SetFont("Arial", "B", 36)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetY(65)
	pdf.CellFormat(277, 20, "CERTIFICATE OF COMPLETION", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "I", 16)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetY(90)
	pdf.CellFormat(277, 10, "This proudly certifies that", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "B", 36)
	pdf.SetTextColor(59, 130, 246)
	pdf.SetY(110)
	pdf.CellFormat(277, 15, userName, "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "I", 16)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetY(135)
	pdf.CellFormat(277, 10, "has successfully completed the curriculum for", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "B", 24)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetY(150)
	pdf.CellFormat(277, 10, displayProgramName, "", 1, "C", false, 0, "")

	// Bottom Validation Section
	pdf.SetY(175)
	pdf.SetX(30)
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(80, 8, "Date:", "", 2, "L", false, 0, "")
	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(80, 8, time.Now().Format("January 2, 2006"), "", 0, "L", false, 0, "")

	pdf.SetY(175)
	pdf.SetX(187)
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(80, 8, "Name and Signature:", "", 2, "R", false, 0, "")

	pdf.SetFont("Arial", "I", 22)
	pdf.SetTextColor(59, 130, 246)
	pdf.CellFormat(80, 12, "T. Ayenigba", "", 2, "R", false, 0, "")

	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(80, 6, "Temitope Ayenigba", "", 2, "R", false, 0, "")
	pdf.SetFont("Arial", "", 11)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(80, 6, "Lead Instructor", "", 0, "R", false, 0, "")

	// Output
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=TAI_Certificate.pdf")
	err = pdf.Output(w)
	if err != nil {
		http.Error(w, "Failed to generate certificate", http.StatusInternalServerError)
	}
}
