package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
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
		var valid bool
		err := db.Pool.QueryRow(r.Context(), `
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
