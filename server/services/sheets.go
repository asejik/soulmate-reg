package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// Data structure matching the JSON expected by Apps Script
type SheetPayload struct {
	FullName          string `json:"full_name"`
	Gender            string `json:"gender"`
	Email             string `json:"email"`
	WhatsAppNumber    string `json:"whatsapp_number"`
	CountryCity       string `json:"country_city"`
	Religion          string `json:"religion"`
	Denomination      string `json:"denomination"`
	InstagramHandle   string `json:"instagram_handle"`
	WeddingDate       string `json:"wedding_date"`
	PartnerRegistered string `json:"partner_registered"`
	SpouseName        string `json:"spouse_name"`
	SpouseWhatsApp    string `json:"spouse_whatsapp"`
	ReferralSource    string `json:"referral_source"`
}

func SendToLaunchpadSheet(data SheetPayload) {
	webhookURL := os.Getenv("LAUNCHPAD_SHEETS_WEBHOOK_URL")
	if webhookURL == "" {
		fmt.Println("Warning: LAUNCHPAD_SHEETS_WEBHOOK_URL is not set")
		return
	}

	jsonData, _ := json.Marshal(data)
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))

	if err != nil {
		fmt.Println("Error sending to Google Sheets (Network):", err)
		return
	}
	defer resp.Body.Close()

	// NEW: Read the actual response body
	var bodyBytes bytes.Buffer
	bodyBytes.ReadFrom(resp.Body)
	responseString := bodyBytes.String()

	fmt.Printf("Google Sheets Response: %s\n", responseString)
}