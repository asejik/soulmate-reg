package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load .env from the root directory (../.env) because we are in /server
	// We try loading local .env first, then fallback to system env (for production)
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("Info: No ../.env file found, assuming system variables are set.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 2. Setup Router
	r := chi.NewRouter()

	// 3. Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 4. CORS (Allow Frontend to talk to Backend)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Vite default port
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 5. Basic Health Check Route
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Soulmate Backend is Ready!"))
	})

	// 6. Start Server
	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}