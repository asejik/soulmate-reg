package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/asejik/soulmate-reg/server/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("Info: No ../.env file found, assuming system variables are set.")
	}

	// 2. Connect to Database
	db.Connect()
	defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 3. Setup Router
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 4. CORS (Permissive for Development)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allow All
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Admin-Secret"}, // Added X-Admin-Secret
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Soulmate Backend is Ready!"))
	})

	// --- ROUTES ---
	r.Post("/api/register", handlers.RegisterUser)
	r.Post("/launchpad/register", handlers.RegisterLaunchpad)

	// NEW: Admin Route
	r.Get("/api/admin/stats", handlers.AdminAuth(handlers.GetDashboardStats))
	r.Get("/api/admin/participants", handlers.AdminAuth(handlers.GetClanParticipants))
	// --------------

	// 5. Start Server
	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
