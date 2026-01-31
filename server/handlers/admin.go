package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"github.com/asejik/soulmate-reg/server/db"
)

// --- Structs ---

type ClanStat struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	CurrentCount int    `json:"current_count"`
	MaxCapacity  int    `json:"max_capacity"`
}

type Participant struct {
	ID                 string `json:"id"`
	FullName           string `json:"full_name"`
	Email              string `json:"email"`
	WhatsAppNumber     string `json:"whatsapp_number"`
	Gender             string `json:"gender"`
	Country            string `json:"country"`
	State              string `json:"state"`
	AgeGroup           string `json:"age_group"`
	Religion           string `json:"religion"`
	ChurchName         string `json:"church_name"`
	InstagramHandle    string `json:"instagram_handle"`
	RelationshipStatus string `json:"relationship_status"`
	ClanID             int64  `json:"clan_id"`
}

// --- Middleware ---

// AdminAuth protects routes by checking the X-Admin-Secret header
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

// --- Handlers ---

// GetDashboardStats returns the live count of all clans (Overview Mode)
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
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

	// Ensure we return an empty array [] instead of null if no clans exist
	if stats == nil {
		stats = []ClanStat{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// GetClanParticipants returns all users in a specific clan (Detail Mode)
func GetClanParticipants(w http.ResponseWriter, r *http.Request) {
	// 1. Get clan_id from query params (e.g., ?clan_id=1)
	clanIDStr := r.URL.Query().Get("clan_id")
	if clanIDStr == "" {
		http.Error(w, "Missing clan_id parameter", http.StatusBadRequest)
		return
	}

	clanID, err := strconv.Atoi(clanIDStr)
	if err != nil {
		http.Error(w, "Invalid clan_id", http.StatusBadRequest)
		return
	}

	// 2. Query the database
	rows, err := db.Pool.Query(context.Background(), `
		SELECT id, full_name, email, whatsapp_number, gender, country, state,
		       age_group, religion, church_name, instagram_handle, relationship_status, clan_id
		FROM participants
		WHERE clan_id = $1
		ORDER BY created_at DESC
	`, clanID)

	if err != nil {
		http.Error(w, "Database query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// 3. Scan results
	var participants []Participant
	for rows.Next() {
		var p Participant
		var churchName *string // Handle optional field

		err := rows.Scan(
			&p.ID, &p.FullName, &p.Email, &p.WhatsAppNumber, &p.Gender,
			&p.Country, &p.State, &p.AgeGroup, &p.Religion, &churchName,
			&p.InstagramHandle, &p.RelationshipStatus, &p.ClanID,
		)
		if err != nil {
			continue
		}

		if churchName != nil {
			p.ChurchName = *churchName
		}

		participants = append(participants, p)
	}

	// 4. Return JSON (empty array [] if no results, not null)
	if participants == nil {
		participants = []Participant{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(participants)
}
