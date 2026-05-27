package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
)

// GetActiveQuiz returns the quiz if within the 8:00 PM - 8:10 PM WAT window
func GetActiveQuiz(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")
	
	var quiz struct {
		ID        string    `json:"id"`
		LessonID  string    `json:"lesson_id"`
		Title     string    `json:"title"`
		Question  string    `json:"question"`
		CreatedAt time.Time `json:"created_at"`
	}
	var scheduledStartTime *time.Time

	err := db.Pool.QueryRow(r.Context(), `
		SELECT q.id, q.lesson_id, q.title, COALESCE(q.question, ''), q.created_at, l.scheduled_start_time
		FROM public.quizzes q
		JOIN public.lessons l ON q.lesson_id = l.id
		WHERE q.lesson_id = $1
	`, lessonID).Scan(&quiz.ID, &quiz.LessonID, &quiz.Title, &quiz.Question, &quiz.CreatedAt, &scheduledStartTime)

	if err != nil {
		http.Error(w, "No active quiz for this lesson.", http.StatusNotFound)
		return
	}

	if scheduledStartTime == nil {
		http.Error(w, "Lesson has no scheduled start time.", http.StatusForbidden)
		return
	}

	now := time.Now().UTC()
	start := scheduledStartTime.UTC()
	end := start.Add(10 * time.Minute)

	if now.Before(start) || now.After(end) {
		http.Error(w, "Quiz is only available during the first 10 minutes of the live class.", http.StatusForbidden)
		return
	}

	// Check if user already submitted the quiz
	var submitted bool
	db.Pool.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM quiz_submissions WHERE quiz_id = $1 AND user_id = $2)", quiz.ID, r.Context().Value(userIDKey)).Scan(&submitted)
	if submitted {
		http.Error(w, "Quiz already submitted.", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quiz)
}

func SubmitQuiz(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")

	var req struct {
		Answers map[string]interface{} `json:"answers"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	var quizID string
	err := db.Pool.QueryRow(r.Context(), "SELECT id FROM public.quizzes WHERE lesson_id = $1", lessonID).Scan(&quizID)
	if err != nil {
		http.Error(w, "Quiz not found", http.StatusNotFound)
		return
	}

	answersJSON, _ := json.Marshal(req.Answers)

	_, err = db.Pool.Exec(r.Context(), `
		INSERT INTO public.quiz_submissions (quiz_id, user_id, answers)
		VALUES ($1, $2, $3)
	`, quizID, userID, string(answersJSON))

	if err != nil {
		http.Error(w, "Failed to submit quiz", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Quiz submitted successfully!"})
}
