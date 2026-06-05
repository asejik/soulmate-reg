package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/asejik/soulmate-reg/server/services"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

type ClaimAccountRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	SpouseEmail string `json:"spouseEmail,omitempty"`
	Code        string `json:"code,omitempty"`
}

type RequestOTPRequest struct {
	SpouseEmail string `json:"spouseEmail"`
}

func RequestOTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req RequestOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request format"})
		return
	}

	var exists bool
	err := db.Pool.QueryRow(r.Context(), `SELECT EXISTS (SELECT 1 FROM public.couples_launchpad WHERE lower(email) = lower($1))`, req.SpouseEmail).Scan(&exists)
	if err != nil || !exists {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Spouse email not found in registration."})
		return
	}

	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	_, err = db.Pool.Exec(r.Context(), `
		INSERT INTO public.verification_codes (spouse_email, code, expires_at)
		VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
	`, req.SpouseEmail, code)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to generate code."})
		return
	}

	// Send email
	go services.SendOTPEmail(req.SpouseEmail, code)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Code sent to spouse's email."})
}

// ClaimAccount verifies the email against registrations and creates the Auth user
func ClaimAccount(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req ClaimAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request format"})
		return
	}

	if req.Email == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Email and password are required"})
		return
	}

	var isLaunchpad, isRFASM bool
	err := db.Pool.QueryRow(r.Context(), `
		SELECT 
			EXISTS(SELECT 1 FROM public.couples_launchpad WHERE lower(email) = lower($1)),
			EXISTS(SELECT 1 FROM public.participants WHERE lower(email) = lower($1))
	`, req.Email).Scan(&isLaunchpad, &isRFASM)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Database verification failed"})
		return
	}

	if !isLaunchpad && !isRFASM {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "We couldn't find a registration for this email. Please check your spelling or contact support.",
		})
		return
	}

	// For Launchpad, enforce the Spouse OTP Flow
	if isLaunchpad && req.Code == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Launchpad users must use the OTP verification flow."})
		return
	}

	if isLaunchpad && req.Code != "" {
		// Enforce that they didn't input their own email as spouseEmail
		if strings.EqualFold(req.Email, req.SpouseEmail) {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "You cannot use your own email to verify your account."})
			return
		}

		// Enforce that spouseEmail is actually linked to req.Email in couples_launchpad
		connected, err := verifySpouseConnection(r.Context(), req.Email, req.SpouseEmail)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Database verification failed during spouse connection check"})
			return
		}
		if !connected {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "The provided spouse email is not registered as your partner."})
			return
		}

		var valid bool
		err = db.Pool.QueryRow(r.Context(), `
			SELECT EXISTS(
				SELECT 1 FROM public.verification_codes 
				WHERE lower(spouse_email) = lower($1) AND code = $2 AND used = false AND expires_at > NOW()
			)
		`, req.SpouseEmail, req.Code).Scan(&valid)

		if err != nil || !valid {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid or expired verification code."})
			return
		}

		// Mark code as used
		db.Pool.Exec(r.Context(), "UPDATE public.verification_codes SET used = true WHERE lower(spouse_email) = lower($1) AND code = $2", req.SpouseEmail, req.Code)
	}

	// 3. CREATE: The email is valid. Create the user via Supabase Admin API.
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	adminReqBody, _ := json.Marshal(map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
	})

	httpReq, err := http.NewRequest("POST", supabaseURL+"/auth/v1/admin/users", bytes.NewBuffer(adminReqBody))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to build auth request"})
		return
	}

	httpReq.Header.Set("apikey", serviceKey)
	httpReq.Header.Set("Authorization", "Bearer "+serviceKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)

	if err != nil || resp.StatusCode >= 400 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Failed to create account. You may have already claimed it, or your password is too weak (min 6 characters).",
		})
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Account successfully claimed! You can now log in.",
	})
}

// verifySpouseConnection checks if two emails are registered as spouses in public.couples_launchpad
func verifySpouseConnection(ctx context.Context, email, spouseEmail string) (bool, error) {
	if strings.EqualFold(email, spouseEmail) {
		return false, nil
	}

	var wa1, swa1, name1, sname1 string
	err := db.Pool.QueryRow(ctx, `
		SELECT COALESCE(whatsapp_number, ''), COALESCE(spouse_whatsapp, ''), COALESCE(full_name, ''), COALESCE(spouse_name, '') 
		FROM public.couples_launchpad 
		WHERE lower(email) = lower($1)
	`, email).Scan(&wa1, &swa1, &name1, &sname1)
	if err != nil {
		return false, err
	}

	var wa2, swa2, name2, sname2 string
	err = db.Pool.QueryRow(ctx, `
		SELECT COALESCE(whatsapp_number, ''), COALESCE(spouse_whatsapp, ''), COALESCE(full_name, ''), COALESCE(spouse_name, '') 
		FROM public.couples_launchpad 
		WHERE lower(email) = lower($1)
	`, spouseEmail).Scan(&wa2, &swa2, &name2, &sname2)
	if err != nil {
		return false, err
	}

	// 1. Phone match check
	if isPhoneMatch(swa1, wa2) || isPhoneMatch(wa1, swa2) {
		return true, nil
	}

	// 2. Name match fallback (check if spouse name contains any word of full name)
	if checkNameMatch(sname1, name2) || checkNameMatch(sname2, name1) {
		return true, nil
	}

	return false, nil
}

func cleanPhone(p string) string {
	var digits []rune
	for _, r := range p {
		if r >= '0' && r <= '9' {
			digits = append(digits, r)
		}
	}
	s := string(digits)
	if len(s) > 10 {
		return s[len(s)-10:]
	}
	return s
}

func isPhoneMatch(p1, p2 string) bool {
	c1 := cleanPhone(p1)
	c2 := cleanPhone(p2)
	return c1 != "" && c1 == c2
}

func checkNameMatch(spouseName, fullName string) bool {
	sName := strings.ToLower(strings.TrimSpace(spouseName))
	fName := strings.ToLower(strings.TrimSpace(fullName))
	if sName == "" || fName == "" {
		return false
	}

	sWords := strings.Fields(sName)
	fWords := strings.Fields(fName)

	for _, sw := range sWords {
		if len(sw) < 3 {
			continue
		}
		for _, fw := range fWords {
			if len(fw) < 3 {
				continue
			}
			if sw == fw {
				return true
			}
		}
	}
	return false
}
