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
)

// WaitlistRequest matches the Cohort 4 waitlist form fields
type WaitlistRequest struct {
	FullName    string `json:"full_name"`
	Nationality string `json:"nationality"`
	WhatsApp    string `json:"whatsapp_number"`
	Email       string `json:"email"`
	Religion    string `json:"religion"`
	Denomination string `json:"denomination"`
}

// WaitlistResponse is the JSON response sent back to the client
type WaitlistResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// WaitlistSheetPayload is used when syncing to Google Sheets
type WaitlistSheetPayload struct {
	FullName    string `json:"full_name"`
	Nationality string `json:"nationality"`
	WhatsApp    string `json:"whatsapp_number"`
	Email       string `json:"email"`
	Religion    string `json:"religion"`
	Denomination string `json:"denomination"`
}

// RegisterWaitlist handles POST /api/cohort4/waitlist
func RegisterWaitlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req WaitlistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(WaitlistResponse{Success: false, Message: "Invalid request body."})
		return
	}

	// Basic validation
	if req.FullName == "" || req.Email == "" || req.WhatsApp == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(WaitlistResponse{Success: false, Message: "Full name, email, and WhatsApp number are required."})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO public.cohort4_waitlist (full_name, nationality, whatsapp_number, email, religion, denomination)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, req.FullName, req.Nationality, req.WhatsApp, req.Email, req.Religion, req.Denomination)

	if err != nil {
		log.Printf("Waitlist Insert Error: %v", err)
		// Check for duplicate email
		json.NewEncoder(w).Encode(WaitlistResponse{
			Success: false,
			Message: "This email address is already on the waitlist.",
		})
		return
	}

	// Sync to Google Sheets asynchronously
	go func() {
		webhookURL := os.Getenv("COHORT4_WAITLIST_WEBHOOK_URL")
		if webhookURL == "" {
			return
		}

		payload := WaitlistSheetPayload{
			FullName:    req.FullName,
			Nationality: req.Nationality,
			WhatsApp:    req.WhatsApp,
			Email:       req.Email,
			Religion:    req.Religion,
			Denomination: req.Denomination,
		}

		jsonData, _ := json.Marshal(payload)
		_, postErr := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
		if postErr != nil {
			log.Printf("Waitlist Sheets Webhook Error: %v", postErr)
		}
	}()

	json.NewEncoder(w).Encode(WaitlistResponse{
		Success: true,
		Message: "You've been added to the waitlist!",
	})
}
