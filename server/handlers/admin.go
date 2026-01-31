package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/asejik/soulmate-reg/server/db"
)

type ClanStat struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	CurrentCount int    `json:"current_count"`
	MaxCapacity  int    `json:"max_capacity"`
}

// AdminAuth Middleware: Protects the route
func AdminAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		secret := r.Header.Get("X-Admin-Secret")
		expected := os.Getenv("ADMIN_SECRET")

		// Secure comparison: If env is empty or secret is wrong, deny.
		if expected == "" || secret != expected {
			http.Error(w, "Unauthorized Access", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// GetDashboardStats: Fetches the data
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	// Query to get all clan details
	rows, err := db.Pool.Query(context.Background(), "SELECT id, name, current_count, max_capacity FROM clans ORDER BY id ASC")
	if err != nil {
		http.Error(w, "Database query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var stats []ClanStat
	for rows.Next() {
		var s ClanStat
		if err := rows.Scan(&s.ID, &s.Name, &s.CurrentCount, &s.MaxCapacity); err != nil {
			continue
		}
		stats = append(stats, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
