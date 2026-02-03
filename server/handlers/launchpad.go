package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/asejik/soulmate-reg/server/services"
)

// Data structure matching the Launchpad Form
type LaunchpadRequest struct {
	FullName           string `json:"full_name"`
	Gender             string `json:"gender"`
	Email              string `json:"email"`
	WhatsAppNumber     string `json:"whatsapp_number"`
	CountryCity        string `json:"country_city"`
	Religion           string `json:"religion"`
	Denomination       string `json:"denomination"`
	ReferralSource     string `json:"referral_source"`
	InstagramHandle    string `json:"instagram_handle"`

	WeddingDate        string `json:"wedding_date"` // YYYY-MM-DD
	PartnerRegistered  string `json:"partner_registered"`
	SpouseName         string `json:"spouse_name"`
	SpouseWhatsApp     string `json:"spouse_whatsapp"`

	AttendedBefore     bool   `json:"attended_before"`
	AgreedToFeedback   bool   `json:"agreed_to_feedback"`
	AgreedToParticipation bool `json:"agreed_to_participation"`
}

func RegisterLaunchpad(w http.ResponseWriter, r *http.Request) {
	var req LaunchpadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// 1. Logic Check: Rejection Criteria
	// If they have attended before OR refuse to commit, we reject (though frontend should catch this too)
	if req.AttendedBefore || !req.AgreedToFeedback || !req.AgreedToParticipation {
		http.Error(w, "Eligibility criteria not met", http.StatusForbidden)
		return
	}

	// 2. Save to Database
	query := `
		INSERT INTO couples_launchpad (
			full_name, gender, email, whatsapp_number, country_city,
			religion, denomination, referral_source, instagram_handle,
			wedding_date, partner_registered, spouse_name, spouse_whatsapp,
			attended_before, agreed_to_feedback, agreed_to_participation
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`

	_, err := db.Pool.Exec(r.Context(), query,
		req.FullName, req.Gender, req.Email, req.WhatsAppNumber, req.CountryCity,
		req.Religion, req.Denomination, req.ReferralSource, req.InstagramHandle,
		req.WeddingDate, req.PartnerRegistered, req.SpouseName, req.SpouseWhatsApp,
		req.AttendedBefore, req.AgreedToFeedback, req.AgreedToParticipation,
	)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// 3. Send Email (Async)
	// We reuse the existing email service but arguably should make a specific template later.
	// For now, we send a generic confirmation.
	go services.SendConfirmationEmail(services.EmailData{
		Name:         req.FullName,
		Email:        req.Email,
		ClanName:     "Couples' Launchpad 5.0",
		WhatsAppLink: "https://chat.whatsapp.com/JpuFSjuo8lBHRSUtDtDwsT?mode=gi_t",
	})

	// 4. Success Response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"whatsapp_link": "https://chat.whatsapp.com/JpuFSjuo8lBHRSUtDtDwsT?mode=gi_t",
		"telegram_link": "https://t.me/+Ybj-HVY5KLw5MzY0",
	})
}