package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
)

type Question struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	UserName     string     `json:"user_name,omitempty"`
	ProgramName  string     `json:"program_name"`
	QuestionText string     `json:"question_text"`
	AnswerText   *string    `json:"answer_text"`
	IsAnswered   bool       `json:"is_answered"`
	AnsweredAt   *time.Time `json:"answered_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// GetUserQuestions returns all questions asked by the current user
func GetUserQuestions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")
	programName, _, _ := resolveActiveProgram(r.Context(), userID, requestedProgram)

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, user_id, program_name, question_text, answer_text, is_answered, answered_at, created_at
		FROM public.questions
		WHERE user_id = $1 AND program_name = $2
		ORDER BY created_at DESC
	`, userID, programName)

	if err != nil {
		http.Error(w, "Failed to fetch questions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	questions := []Question{}
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.ID, &q.UserID, &q.ProgramName, &q.QuestionText, &q.AnswerText, &q.IsAnswered, &q.AnsweredAt, &q.CreatedAt)
		if err == nil {
			questions = append(questions, q)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

// AskQuestion allows a student to submit a new question
func AskQuestion(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")
	programName, _, _ := resolveActiveProgram(r.Context(), userID, requestedProgram)

	var req struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Text == "" {
		http.Error(w, "Invalid question content", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.questions (user_id, program_name, question_text)
		VALUES ($1, $2, $3)
	`, userID, programName, req.Text)

	if err != nil {
		http.Error(w, "Failed to submit question", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// GetAllQuestionsForAdmin returns all questions for all users (Admin only)
func GetAllQuestionsForAdmin(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT q.id, q.user_id, q.program_name, q.question_text, q.answer_text, q.is_answered, q.answered_at, q.created_at,
		       COALESCE(cl.full_name, p.full_name, 'Unknown Student') as user_name
		FROM public.questions q
		LEFT JOIN auth.users au ON q.user_id = au.id
		LEFT JOIN public.couples_launchpad cl ON lower(au.email) = lower(cl.email)
		LEFT JOIN public.participants p ON lower(au.email) = lower(p.email)
		ORDER BY q.is_answered ASC, q.created_at DESC
	`)

	if err != nil {
		http.Error(w, "Failed to fetch questions for admin", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	questions := []Question{}
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.ID, &q.UserID, &q.ProgramName, &q.QuestionText, &q.AnswerText, &q.IsAnswered, &q.AnsweredAt, &q.CreatedAt, &q.UserName)
		if err == nil {
			questions = append(questions, q)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

// AnswerQuestion allows admin to reply to a question
func AnswerQuestion(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	var req struct {
		QuestionID string `json:"question_id"`
		Answer     string `json:"answer"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.QuestionID == "" || req.Answer == "" {
		http.Error(w, "Invalid answer content", http.StatusBadRequest)
		return
	}

	_, err = db.Pool.Exec(r.Context(), `
		UPDATE public.questions
		SET answer_text = $1, is_answered = true, answered_at = NOW()
		WHERE id = $2
	`, req.Answer, req.QuestionID)

	if err != nil {
		http.Error(w, "Failed to submit answer", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
