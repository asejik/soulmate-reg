package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
)

type DashLesson struct {
	ID                 string     `json:"id"`
	Title              string     `json:"title"`
	EstimatedTime      string     `json:"estimated_time"`
	IsCompleted        bool       `json:"is_completed"`
	ScheduledStartTime *time.Time `json:"scheduled_start_time"`
	Progress           int        `json:"progress"`
	LastWatchedSeconds float64    `json:"last_watched_seconds"`
}

type DashModule struct {
	ID      string       `json:"id"`
	Title   string       `json:"title"`
	Lessons []DashLesson `json:"lessons"`
}

func GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)

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

	var totalLessons, completedLessons int
	db.Pool.QueryRow(r.Context(), "SELECT COUNT(l.id) FROM public.lessons l JOIN public.modules m ON l.module_id = m.id WHERE m.program_name = $1", programName).Scan(&totalLessons)
	db.Pool.QueryRow(r.Context(), "SELECT COUNT(lp.lesson_id) FROM public.lesson_progress lp JOIN public.lessons l ON lp.lesson_id = l.id JOIN public.modules m ON l.module_id = m.id WHERE lp.user_id = $1 AND lp.is_completed = true AND m.program_name = $2", userID, programName).Scan(&completedLessons)

	var hasCompletedFinalReview, hasCompletedMidReview bool
	db.Pool.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM public.program_reviews WHERE user_id = $1 AND program_name = $2)", userID, programName).Scan(&hasCompletedFinalReview)
	db.Pool.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM public.program_reviews WHERE user_id = $1 AND program_name = $2 AND review_type = 'mid_cohort')", userID, programName).Scan(&hasCompletedMidReview)

	rows, err := db.Pool.Query(r.Context(), `
		SELECT
			m.id, m.title, l.id, l.title,
			COALESCE(l.estimated_time, ''), COALESCE(lp.is_completed, false), l.scheduled_start_time,
			COALESCE(lp.highest_watched_pct, 0)::int, COALESCE(lp.last_watched_seconds, 0.0)::float
		FROM public.modules m
		JOIN public.lessons l ON m.id = l.module_id
		LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = $2
		WHERE m.program_name = $1
		ORDER BY m.sort_order ASC, l.sort_order ASC
	`, programName, userID)

	modules := []DashModule{}
	var currentModule *DashModule
	var nextLessonID string

	if err != nil {
		fmt.Println("CRITICAL SQL ERROR in GetDashboard:", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var mID, mTitle, lID, lTitle, lEstTime string
			var lCompleted bool
			var lScheduled *time.Time
			var lPct int
			var lSecs float64

			if err := rows.Scan(&mID, &mTitle, &lID, &lTitle, &lEstTime, &lCompleted, &lScheduled, &lPct, &lSecs); err == nil {
				if currentModule == nil || currentModule.ID != mID {
					if currentModule != nil { modules = append(modules, *currentModule) }
					currentModule = &DashModule{ID: mID, Title: mTitle, Lessons: []DashLesson{}}
				}
				currentModule.Lessons = append(currentModule.Lessons, DashLesson{
					ID: lID, Title: lTitle, EstimatedTime: lEstTime, IsCompleted: lCompleted,
					ScheduledStartTime: lScheduled, Progress: lPct, LastWatchedSeconds: lSecs,
				})
				if !lCompleted && nextLessonID == "" { nextLessonID = lID }
			}
		}
		if currentModule != nil { modules = append(modules, *currentModule) }
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id": userID, "has_completed_final_review": hasCompletedFinalReview, "has_completed_mid_review": hasCompletedMidReview,
		"active_program": programName, "enrolled_programs": enrolledPrograms,
		"cohort": map[string]interface{}{"name": programNameDisplay, "total_lessons": totalLessons, "completed_lessons": completedLessons},
		"curriculum": modules, "next_lesson": map[string]interface{}{"id": nextLessonID},
	})
}