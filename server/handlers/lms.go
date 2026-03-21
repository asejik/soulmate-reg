package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-chi/chi/v5"
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

	// 1. Fetch the Cohort Name from the database
	var cohortName string
	err := db.Pool.QueryRow(r.Context(), `SELECT title FROM public.modules WHERE id = '11111111-1111-1111-1111-111111111111'`).Scan(&cohortName)
	if err != nil {
		http.Error(w, "Failed to load cohort data", http.StatusInternalServerError)
		return
	}

	// 2. Fetch the Next Lesson from the database
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
			"total_lessons":     12,
			"completed_lessons": 2, // We will calculate this dynamically in the future
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
