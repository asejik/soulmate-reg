package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
)

type CommentResponse struct {
	ID          string `json:"id"`
	LessonID    string `json:"lesson_id"`
	LessonTitle string `json:"lesson_title"`
	UserName    string `json:"user_name"`
	Content     string `json:"content"`
	CreatedAt   string `json:"created_at"`
}

var (
	commentsCache   = make(map[string][]byte)
	commentsCacheTs = make(map[string]time.Time)
	commentsMutex   sync.Mutex
)

func PostLessonComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	lessonID := chi.URLParam(r, "id")
	var req struct{ Content string `json:"content"` }
	json.NewDecoder(r.Body).Decode(&req)

	db.Pool.Exec(r.Context(), "INSERT INTO public.lesson_comments (lesson_id, user_id, content) VALUES ($1, $2, $3)", lessonID, userID, req.Content)

	commentsMutex.Lock()
	delete(commentsCacheTs, lessonID)
	commentsMutex.Unlock()

	w.WriteHeader(http.StatusCreated)
}

func GetLessonComments(w http.ResponseWriter, r *http.Request) {
	lessonID := chi.URLParam(r, "id")

	commentsMutex.Lock()
	if ts, ok := commentsCacheTs[lessonID]; ok && time.Since(ts) < 5*time.Second {
		w.Header().Set("Content-Type", "application/json")
		w.Write(commentsCache[lessonID])
		commentsMutex.Unlock()
		return
	}
	commentsMutex.Unlock()

	rows, _ := db.Pool.Query(r.Context(), `
		SELECT c.id, c.lesson_id, l.title, c.content, c.created_at, COALESCE(cl.full_name, p.full_name, 'Participant') AS user_name
		FROM public.lesson_comments c JOIN public.lessons l ON c.lesson_id = l.id JOIN auth.users au ON c.user_id = au.id
		LEFT JOIN public.couples_launchpad cl ON lower(au.email) = lower(cl.email) LEFT JOIN public.participants p ON lower(au.email) = lower(p.email)
		WHERE c.lesson_id = $1 ORDER BY c.created_at DESC
	`, lessonID)
	defer rows.Close()

	var comments []CommentResponse
	for rows.Next() {
		var c CommentResponse
		rows.Scan(&c.ID, &c.LessonID, &c.LessonTitle, &c.Content, &c.CreatedAt, &c.UserName)
		comments = append(comments, c)
	}

	responseBytes, _ := json.Marshal(comments)

	commentsMutex.Lock()
	commentsCache[lessonID] = responseBytes
	commentsCacheTs[lessonID] = time.Now()
	commentsMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.Write(responseBytes)
}

func GetGlobalDiscussions(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")
	programName, _, _ := resolveActiveProgram(r.Context(), userID, requestedProgram)

	rows, _ := db.Pool.Query(r.Context(), `
		WITH LatestComments AS (
			SELECT DISTINCT ON (lesson_id) *
			FROM public.lesson_comments
			ORDER BY lesson_id, created_at DESC
		)
		SELECT lc.id, lc.lesson_id, l.title, lc.content, lc.created_at, 
			   COALESCE(cl.full_name, p.full_name, 'Participant') AS user_name
		FROM LatestComments lc
		JOIN public.lessons l ON lc.lesson_id = l.id
		JOIN public.modules m ON l.module_id = m.id
		JOIN auth.users au ON lc.user_id = au.id 
		LEFT JOIN public.couples_launchpad cl ON lower(au.email) = lower(cl.email) 
		LEFT JOIN public.participants p ON lower(au.email) = lower(p.email)
		WHERE m.program_name = $1
		ORDER BY lc.created_at DESC
	`, programName)
	defer rows.Close()

	var comments []CommentResponse
	for rows.Next() {
		var c CommentResponse
		rows.Scan(&c.ID, &c.LessonID, &c.LessonTitle, &c.Content, &c.CreatedAt, &c.UserName)
		comments = append(comments, c)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

func SubmitReview(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")
	programName, _, _ := resolveActiveProgram(r.Context(), userID, requestedProgram)

	var req struct { 
		ReviewType string `json:"reviewType"`
		Content    string `json:"content"` 
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.ReviewType == "" { req.ReviewType = "final" }

	// Allow multiple reviews if types are different (mid_cohort vs final)
	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.program_reviews (user_id, program_name, review_type, content) 
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, program_name, review_type) 
		DO UPDATE SET content = $4
	`, userID, programName, req.ReviewType, req.Content)

	if err != nil {
		http.Error(w, "Failed to submit review", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func DeleteLessonComment(w http.ResponseWriter, r *http.Request) {
	// Verify Admin JWT
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	if err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail); err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}
	db.Pool.Exec(r.Context(), "DELETE FROM public.lesson_comments WHERE id::text = $1", id)
	w.WriteHeader(http.StatusOK)
}
