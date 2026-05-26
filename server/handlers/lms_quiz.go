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
	
	// Load WAT Timezone
	loc, err := time.LoadLocation("Africa/Lagos")
	if err != nil {
		loc = time.FixedZone("WAT", 3600) // Fallback to GMT+1
	}
	now := time.Now().In(loc)

	// Check if we are between 20:00 and 20:10
	if now.Hour() != 20 || now.Minute() > 10 {
		http.Error(w, "Quiz is only available between 8:00 PM and 8:10 PM WAT.", http.StatusForbidden)
		return
	}

	var quiz struct {
		ID       string `json:"id"`
		LessonID string `json:"lesson_id"`
		Title    string `json:"title"`
	}

	err = db.Pool.QueryRow(r.Context(), `
		SELECT id, lesson_id, title 
		FROM public.quizzes 
		WHERE lesson_id = $1
	`, lessonID).Scan(&quiz.ID, &quiz.LessonID, &quiz.Title)

	if err != nil {
		http.Error(w, "No active quiz for this lesson.", http.StatusNotFound)
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
