package handlers

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userIDKey contextKey = "user_id"

// LMSAuth Middleware verifies the Supabase Bearer Token locally (no network call).
// It uses the SUPABASE_JWT_SECRET to cryptographically validate the JWT,
// eliminating the HTTP round-trip to Supabase's auth API that was generating egress.
func LMSAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
			return
		}

		jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
		if jwtSecret == "" {
			http.Error(w, "Server configuration error: JWT secret not set", http.StatusInternalServerError)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			// Supabase uses HMAC-SHA256 (HS256) to sign JWTs
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "LMS Session Expired or Unauthorized. Please log in again.", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
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