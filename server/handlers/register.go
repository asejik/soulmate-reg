package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/asejik/soulmate-reg/server/services"
)

// Request Struct (Matches your Frontend Form)
type RegistrationRequest struct {
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
}

// Response Struct
type RegistrationResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	ClanName     string `json:"clan_name,omitempty"`
	WhatsAppLink string `json:"whatsapp_link,omitempty"`
}

// NEW: Helper struct for Google Sheets payload
type GoogleSheetPayload struct {
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
	ClanName           string `json:"clan_name"`
}

func RegisterUser(w http.ResponseWriter, r *http.Request) {
	// 1. Parse JSON Body
	var req RegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 2. Start a Transaction (Critical for Concurrency)
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Tx Begin Error: %v", err)
		return
	}
	defer tx.Rollback(ctx) // Rollback if not committed

	// 3. Find the first available Clan and LOCK it (FOR UPDATE)
	// This prevents two people from grabbing the 20th slot at the same time.
	var clanID int64
	var clanName, whatsappLink string

	err = tx.QueryRow(ctx, `
		SELECT id, name, whatsapp_link
		FROM clans
		WHERE current_count < max_capacity
		ORDER BY id ASC
		LIMIT 1
		FOR UPDATE
	`).Scan(&clanID, &clanName, &whatsappLink)

	if err != nil {
		// If no rows found, it means ALL clans are full
		json.NewEncoder(w).Encode(RegistrationResponse{
			Success: false,
			Message: "All cohorts are currently full. Please join the waitlist.",
		})
		return
	}

	// 4. Register the Participant
	_, err = tx.Exec(ctx, `
		INSERT INTO participants (
			full_name, email, whatsapp_number, gender, country, state,
			age_group, religion, church_name, instagram_handle, relationship_status, clan_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, req.FullName, req.Email, req.WhatsAppNumber, req.Gender, req.Country, req.State,
		req.AgeGroup, req.Religion, req.ChurchName, req.InstagramHandle, req.RelationshipStatus, clanID)

	if err != nil {
		// Handle duplicate email/phone error
		log.Printf("Insert Error: %v", err)
		json.NewEncoder(w).Encode(RegistrationResponse{
			Success: false,
			Message: "This email or phone number is already registered.",
		})
		return
	}

	// 5. Increment the Clan Count
	_, err = tx.Exec(ctx, `UPDATE clans SET current_count = current_count + 1 WHERE id = $1`, clanID)
	if err != nil {
		http.Error(w, "Failed to update clan count", http.StatusInternalServerError)
		return
	}

	// 6. Commit Transaction
	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Transaction commit failed", http.StatusInternalServerError)
		return
	}

	// 7. Send Confirmation Email (Async)
	// We run this in a goroutine so it doesn't block the API response time
	go services.SendConfirmationEmail(services.EmailData{
		Name:         req.FullName,
		Email:        req.Email,
		ClanName:     clanName,
		WhatsAppLink: whatsappLink,
	})

	// --- NEW: Sync to Google Sheets (Async) ---
	go func() {
		webhookURL := os.Getenv("GOOGLE_SHEETS_WEBHOOK_URL")
		if webhookURL == "" {
			return
		}

		payload := GoogleSheetPayload{
			FullName:           req.FullName,
			Email:              req.Email,
			WhatsAppNumber:     req.WhatsAppNumber,
			Gender:             req.Gender,
			Country:            req.Country,
			State:              req.State,
			AgeGroup:           req.AgeGroup,
			Religion:           req.Religion,
			ChurchName:         req.ChurchName,
			InstagramHandle:    req.InstagramHandle,
			RelationshipStatus: req.RelationshipStatus,
			ClanName:           clanName,
		}

		jsonData, _ := json.Marshal(payload)
		http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	}()
	// ------------------------------------------

	// 8. Success Response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RegistrationResponse{
		Success:      true,
		Message:      "Registration successful!",
		ClanName:     clanName,
		WhatsAppLink: whatsappLink,
	})
}
