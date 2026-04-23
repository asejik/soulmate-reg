package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
)

func GetLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var lesson struct {
		ID                  string     `json:"id"`
		Title               string     `json:"title"`
		Description         string     `json:"description"`
		VideoID             string     `json:"videoId"`
		EstimatedTime       string     `json:"estimatedTime"`
		AssignmentPrompt    string     `json:"assignmentPrompt"`
		IsCompleted         bool       `json:"is_completed"`
		IsLocked            bool       `json:"is_locked"`
		ScheduledStartTime  *time.Time `json:"scheduled_start_time"`
		LastWatchedSeconds  float64    `json:"last_watched_seconds"`
		Progress            int        `json:"progress"`
		DurationMinutes     *int       `json:"-"`          // server-side only; drives 48h locking
		ClosingAt           *time.Time `json:"closing_at"` // non-nil during the 48h rewatch window
	}

	var programName string
	err := db.Pool.QueryRow(r.Context(), `
		SELECT l.id, l.title, COALESCE(l.description, ''), l.video_id, COALESCE(l.estimated_time, ''), COALESCE(l.assignment_prompt, ''),
			   m.program_name, l.scheduled_start_time, COALESCE(lp.is_completed, false), COALESCE(lp.last_watched_seconds, 0.0)::float,
			   COALESCE(lp.highest_watched_pct, 0)::int,
			   l.live_duration_minutes
		FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id
		LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $2
		WHERE l.id = $1
	`, lessonID, userID).Scan(
		&lesson.ID, &lesson.Title, &lesson.Description, &lesson.VideoID, &lesson.EstimatedTime,
		&lesson.AssignmentPrompt, &programName, &lesson.ScheduledStartTime, &lesson.IsCompleted,
		&lesson.LastWatchedSeconds, &lesson.Progress,
		&lesson.DurationMinutes,
	)

	if err != nil {
		fmt.Println("CRITICAL SCAN ERROR in GetLesson:", err)
		http.Error(w, "Lesson not found", http.StatusNotFound)
		return
	}

	// Mid-Program Checkpoint Enforcement
	var totalLessons, lessonPosition int
	db.Pool.QueryRow(r.Context(), `
		WITH AllLessons AS (
			SELECT l.id, ROW_NUMBER() OVER (ORDER BY m.sort_order ASC, l.sort_order ASC) as pos
			FROM public.lessons l
			JOIN public.modules m ON l.module_id = m.id
			WHERE m.program_name = $1
		)
		SELECT (SELECT count(*) FROM AllLessons), pos
		FROM AllLessons WHERE id = $2
	`, programName, lessonID).Scan(&totalLessons, &lessonPosition)

	if lessonPosition > (totalLessons+1)/2 {
		// Post-checkpoint lesson: Check if review is submitted
		var hasReviewed bool
		db.Pool.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM public.program_reviews WHERE user_id = $1 AND program_name = $2 AND review_type IN ('mid_cohort', 'mid_video', 'mid_google'))", userID, programName).Scan(&hasReviewed)
		if !hasReviewed {
			http.Error(w, "Checkpoint Required. Please complete your Mid-Program Review to unlock the second half of the curriculum.", http.StatusForbidden)
			return
		}
	}

	// All valid lessons are now unlocked to allow access to waitrooms and countdowns
	lesson.IsLocked = false

	// Post-live 48h access window: lock lesson after 48 hours from live session end.
	// Only applies to lessons that have both a scheduled start time AND a duration set.
	if lesson.ScheduledStartTime != nil && lesson.DurationMinutes != nil && *lesson.DurationMinutes > 0 {
		liveEnd := lesson.ScheduledStartTime.Add(time.Duration(*lesson.DurationMinutes) * time.Minute)
		lockAt := liveEnd.Add(48 * time.Hour)
		now := time.Now().UTC()
		if now.After(lockAt) {
			// 48h window has expired — deny access
			lesson.IsLocked = true
		} else if now.After(liveEnd) {
			// Session ended but still within 48h — show countdown to closure
			lesson.ClosingAt = &lockAt
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lesson)
}

func UpdateProgress(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req struct {
		Seconds float64 `json:"seconds"`
		Percent int     `json:"percent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.lesson_progress (user_id, lesson_id, last_watched_seconds, highest_watched_pct, updated_at)
		VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id, lesson_id)
		DO UPDATE SET 
			last_watched_seconds = $3, 
			highest_watched_pct = GREATEST(lesson_progress.highest_watched_pct, $4),
			updated_at = NOW()
	`, userID, lessonID, req.Seconds, req.Percent)

	if err != nil {
		fmt.Println("💥 PROGRESS SAVE ERROR:", err)
		http.Error(w, "Failed to save progress", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func SubmitAssignment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req struct {
		SubmissionType string `json:"submissionType"`
		Content        string `json:"content"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	db.Pool.Exec(r.Context(), "INSERT INTO public.assignment_submissions (user_id, lesson_id, submission_type, content) VALUES ($1, $2, $3, $4)", userID, lessonID, req.SubmissionType, req.Content)
	db.Pool.Exec(r.Context(), "INSERT INTO public.lesson_progress (user_id, lesson_id, is_completed, is_unlocked, highest_watched_pct) VALUES ($1, $2, true, true, 100) ON CONFLICT (user_id, lesson_id) DO UPDATE SET is_completed = true, highest_watched_pct = GREATEST(lesson_progress.highest_watched_pct, 100)", userID, lessonID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Assignment submitted!"})
}
func ResetUserProgress(w http.ResponseWriter, r *http.Request) {
	// 0. Double-Lock Security: Verify the requester is actually the admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 1. Inputs: This ID is from public.participants or couples_launchpad
	targetParticipantID := r.URL.Query().Get("user_id") 
	lessonID := r.URL.Query().Get("lesson_id")
	moduleID := r.URL.Query().Get("module_id")

	if targetParticipantID == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	// 2. IMPORTANT: We MUST find the corresponding Auth User ID (UUID) 
	// This ensures we clean up the tables linked to the actual login identity.
	var authID string
	err = db.Pool.QueryRow(r.Context(), `
		SELECT id FROM auth.users WHERE email IN (
			SELECT email FROM public.participants WHERE id::text = $1
			UNION
			SELECT email FROM public.couples_launchpad WHERE id::text = $1
		)
	`, targetParticipantID).Scan(&authID)

	if err != nil {
		fmt.Printf("⚠️  Admin Reset Attempt: User ID %s not found in auth.users. Reset aborted.\n", targetParticipantID)
		http.Error(w, "No active login found for this user to reset.", http.StatusNotFound)
		return
	}

	// 3. Selective Deletions
	if lessonID != "" {
		// Reset a single lesson
		db.Pool.Exec(r.Context(), "DELETE FROM public.lesson_progress WHERE user_id = $1 AND lesson_id = $2", authID, lessonID)
		db.Pool.Exec(r.Context(), "DELETE FROM public.assignment_submissions WHERE user_id = $1 AND lesson_id = $2", authID, lessonID)
	} else if moduleID != "" {
		// Reset a whole module
		db.Pool.Exec(r.Context(), `
			DELETE FROM public.lesson_progress 
			WHERE user_id = $1 AND lesson_id IN (SELECT id FROM public.lessons WHERE module_id = $2)
		`, authID, moduleID)
		db.Pool.Exec(r.Context(), `
			DELETE FROM public.assignment_submissions
			WHERE user_id = $1 AND lesson_id IN (SELECT id FROM public.lessons WHERE module_id = $2)
		`, authID, moduleID)
	} else {
		// FULL RESET: Clear EVERYTHING to give a blank slate
		db.Pool.Exec(r.Context(), "DELETE FROM public.lesson_progress WHERE user_id = $1", authID)
		db.Pool.Exec(r.Context(), "DELETE FROM public.program_reviews WHERE user_id = $1", authID)
		db.Pool.Exec(r.Context(), "DELETE FROM public.assignment_submissions WHERE user_id = $1", authID)
	}

	w.WriteHeader(http.StatusOK)
}

var (
	activityCache   = make(map[string][]byte)
	activityCacheTs = make(map[string]time.Time)
	activityMutex   sync.Mutex
)

func GetLessonActivity(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

	activityMutex.Lock()
	if ts, ok := activityCacheTs[lessonID]; ok && time.Since(ts) < 5*time.Second {
		w.Header().Set("Content-Type", "application/json")
		w.Write(activityCache[lessonID])
		activityMutex.Unlock()
		return
	}
	activityMutex.Unlock()

	rows, err := db.Pool.Query(r.Context(), `
		SELECT DISTINCT COALESCE(cl.full_name, p.full_name, 'Participant') as name
		FROM public.lesson_progress lp
		JOIN auth.users au ON lp.user_id = au.id
		LEFT JOIN public.couples_launchpad cl ON lower(au.email) = lower(cl.email)
		LEFT JOIN public.participants p ON lower(au.email) = lower(p.email)
		WHERE lp.lesson_id = $1 AND lp.updated_at > NOW() - INTERVAL '1 minute'
		ORDER BY name ASC
	`, lessonID)

	if err != nil {
		fmt.Printf("⚠️  Activity Fetch Failed: %v\n", err)
		http.Error(w, "Failed to fetch activity", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	names := []string{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			names = append(names, name)
		}
	}

	responseBytes, _ := json.Marshal(map[string]interface{}{
		"count":        len(names),
		"participants": names,
	})

	activityMutex.Lock()
	activityCache[lessonID] = responseBytes
	activityCacheTs[lessonID] = time.Now()
	activityMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.Write(responseBytes)
}

// GetMySubmission returns the current user's submission for a lesson, including any admin feedback.
func GetMySubmission(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var result struct {
		Content        string     `json:"content"`
		SubmissionType string     `json:"submission_type"`
		AdminFeedback  *string    `json:"admin_feedback"`
		FeedbackAt     *time.Time `json:"feedback_at"`
		SubmittedAt    time.Time  `json:"submitted_at"`
	}

	err := db.Pool.QueryRow(r.Context(), `
		SELECT content, COALESCE(submission_type, 'text'), admin_feedback, feedback_at, submitted_at
		FROM public.assignment_submissions
		WHERE user_id = $1 AND lesson_id = $2
		ORDER BY submitted_at DESC LIMIT 1
	`, userID, lessonID).Scan(
		&result.Content, &result.SubmissionType, &result.AdminFeedback, &result.FeedbackAt, &result.SubmittedAt,
	)

	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		// No submission found — return null so the frontend can handle gracefully
		json.NewEncoder(w).Encode(nil)
		return
	}
	json.NewEncoder(w).Encode(result)
}

