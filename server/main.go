package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/asejik/soulmate-reg/server/handlers" // Import handlers
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("Info: No ../.env file found, assuming system variables are set.")
	}

	db.Connect()
	defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// FIX: Permissive CORS for Development
	r.Use(cors.Handler(cors.Options{
		// Allow ALL origins for now to prevent "Network Error"
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Soulmate Backend is Ready!"))
	})

	// --- NEW ROUTE ---
	r.Post("/api/register", handlers.RegisterUser)
	r.Get("/api/admin/stats", handlers.AdminAuth(handlers.GetDashboardStats))

	// -----------------

	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
