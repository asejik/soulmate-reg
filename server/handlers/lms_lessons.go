package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
)

func GetLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var lesson struct {
		ID                 string     `json:"id"`
		Title              string     `json:"title"`
		Description        string     `json:"description"`
		VideoID            string     `json:"videoId"`
		EstimatedTime      string     `json:"estimatedTime"`
		AssignmentPrompt   string     `json:"assignmentPrompt"`
		IsCompleted        bool       `json:"is_completed"`
		IsLocked           bool       `json:"is_locked"`
		ScheduledStartTime *time.Time `json:"scheduled_start_time"`
		LastWatchedSeconds float64    `json:"last_watched_seconds"`
		Progress           int        `json:"progress"` // <-- ADDED THIS
	}

	var programName string
	err := db.Pool.QueryRow(r.Context(), `
		SELECT l.id, l.title, COALESCE(l.description, ''), l.video_id, COALESCE(l.estimated_time, ''), COALESCE(l.assignment_prompt, ''),
			   m.program_name, l.scheduled_start_time, COALESCE(lp.is_completed, false), COALESCE(lp.last_watched_seconds, 0.0)::float,
			   COALESCE(lp.highest_watched_pct, 0)::int -- <-- ADDED THIS
		FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id
		LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $2
		WHERE l.id = $1
	`, lessonID, userID).Scan(
		&lesson.ID, &lesson.Title, &lesson.Description, &lesson.VideoID, &lesson.EstimatedTime,
		&lesson.AssignmentPrompt, &programName, &lesson.ScheduledStartTime, &lesson.IsCompleted,
		&lesson.LastWatchedSeconds, &lesson.Progress, // <-- ADDED THIS
	)

	if err != nil {
		fmt.Println("CRITICAL SCAN ERROR in GetLesson:", err)
		http.Error(w, "Lesson not found", http.StatusNotFound)
		return
	}

	// All valid lessons are now unlocked to allow access to waitrooms and countdowns
	lesson.IsLocked = false

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

	// Automate completion if watched over 85%
	isCompleted := req.Percent >= 85

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.lesson_progress (user_id, lesson_id, last_watched_seconds, highest_watched_pct, is_completed)
		VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, lesson_id)
		DO UPDATE SET 
			last_watched_seconds = $3, 
			highest_watched_pct = GREATEST(lesson_progress.highest_watched_pct, $4),
			is_completed = (lesson_progress.is_completed OR $5)
	`, userID, lessonID, req.Seconds, req.Percent, isCompleted)

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
	targetID := r.URL.Query().Get("user_id")
	lessonID := r.URL.Query().Get("lesson_id")
	moduleID := r.URL.Query().Get("module_id")

	if targetID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}

	// 1. Map the Participant/Launchpad ID to the Auth User ID
	var authID string
	err := db.Pool.QueryRow(r.Context(), `
		SELECT id FROM auth.users WHERE email IN (
			SELECT email FROM public.participants WHERE id::text = $1
			UNION
			SELECT email FROM public.couples_launchpad WHERE id::text = $1
		)
	`, targetID).Scan(&authID)

	if err != nil {
		fmt.Println("💥 RESET ERROR (User Mapping Failed):", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// 2. Perform deletions using the correct Auth ID
	if lessonID != "" {
		db.Pool.Exec(r.Context(), "DELETE FROM public.lesson_progress WHERE user_id = $1 AND lesson_id = $2", authID, lessonID)
	} else if moduleID != "" {
		db.Pool.Exec(r.Context(), `
			DELETE FROM public.lesson_progress 
			WHERE user_id = $1 AND lesson_id IN (SELECT id FROM public.lessons WHERE module_id = $2)
		`, authID, moduleID)
	} else {
		// Complete Reset
		db.Pool.Exec(r.Context(), "DELETE FROM public.lesson_progress WHERE user_id = $1", authID)
		db.Pool.Exec(r.Context(), "DELETE FROM public.program_reviews WHERE user_id = $1", authID)
		db.Pool.Exec(r.Context(), "DELETE FROM public.assignment_submissions WHERE user_id = $1", authID)
	}

	w.WriteHeader(http.StatusOK)
}
