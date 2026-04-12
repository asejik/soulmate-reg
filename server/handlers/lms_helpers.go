package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/asejik/soulmate-reg/server/db"
)

type contextKey string

const userIDKey contextKey = "user_id"

// LMSAuth Middleware verifies the Supabase Bearer Token
func LMSAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}

		supabaseURL := strings.TrimSuffix(os.Getenv("SUPABASE_URL"), "/")
		serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

		if supabaseURL == "" || serviceKey == "" {
			http.Error(w, "Background Configuration Error: Supabase credentials missing on server", http.StatusInternalServerError)
			return
		}

		userURL := supabaseURL + "/auth/v1/user"
		req, err := http.NewRequest("GET", userURL, nil)
		if err != nil {
			http.Error(w, "Server error creating auth request", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Authorization", authHeader)
		req.Header.Set("apikey", serviceKey)

		client := &http.Client{}
		resp, err := client.Do(req)

		if err != nil {
			http.Error(w, "Failed to reach Auth Provider", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			http.Error(w, "LMS Session Expired or Unauthorized. Please log in again.", http.StatusUnauthorized)
			return
		}

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)

		userID, ok := result["id"].(string)
		if !ok {
			http.Error(w, "User ID not found in token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// resolveActiveProgram detects if a user is in RFASM, CLP, or both
func resolveActiveProgram(ctx context.Context, userID string, requestedProgram string) (string, []string, error) {
	var isLaunchpad, isSoulmate bool
	err := db.Pool.QueryRow(ctx, `
		SELECT cl.email IS NOT NULL, p.email IS NOT NULL
		FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON lower(au.email) = lower(cl.email)
		LEFT JOIN public.participants p ON lower(au.email) = lower(p.email)
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&isLaunchpad, &isSoulmate)

	if err != nil {
		return "", nil, err
	}

	var enrolled []string
	if isLaunchpad {
		enrolled = append(enrolled, "launchpad")
	}
	if isSoulmate {
		enrolled = append(enrolled, "Ready for a Soulmate")
	}

	if len(enrolled) == 0 {
		return "", nil, nil
	}

	active := enrolled[0]
	if requestedProgram != "" {
		for _, p := range enrolled {
			if p == requestedProgram {
				active = p
				break
			}
		}
	}
	return active, enrolled, nil
}