package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// SupabaseUserResponse maps the response from the Admin API
type SupabaseUserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

// CreateAuthUser calls the Supabase Admin API to create a new user silently
func CreateAuthUser(email string, password string) (string, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || serviceKey == "" {
		return "", fmt.Errorf("missing Supabase environment variables in server")
	}

	endpoint := fmt.Sprintf("%s/auth/v1/admin/users", supabaseURL)

	// We set email_confirm to true so they don't have to click a verification link
	payload := map[string]interface{}{
		"email":         email,
		"password":      password,
		"email_confirm": true,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal auth payload: %v", err)
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	// Add the mandatory Supabase Admin headers
	req.Header.Set("apikey", serviceKey)
	req.Header.Set("Authorization", "Bearer "+serviceKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute request: %v", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	// Check if Supabase rejected the creation (e.g., user already exists)
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("supabase admin auth error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var userResp SupabaseUserResponse
	if err := json.Unmarshal(bodyBytes, &userResp); err != nil {
		return "", fmt.Errorf("failed to parse supabase response: %v", err)
	}

	return userResp.ID, nil
}
