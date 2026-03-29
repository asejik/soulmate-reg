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
	r.Post("/api/launchpad/register", handlers.RegisterLaunchpad)
	r.Post("/api/auth/claim", handlers.ClaimAccount)

	// Admin Routes
	r.Get("/api/admin/stats", handlers.AdminAuth(handlers.GetDashboardStats))
	r.Get("/api/admin/participants", handlers.AdminAuth(handlers.GetClanParticipants))

	// NEW: Protected LMS Routes
	r.Group(func(r chi.Router) {
		// Anything inside this group strictly requires a valid Supabase Auth Token
		r.Use(handlers.LMSAuth)

		r.Get("/api/lms/dashboard", handlers.GetDashboard)
		r.Get("/api/lms/lessons/{id}", handlers.GetLesson)
		r.Post("/api/lms/lessons/{id}/submit", handlers.SubmitAssignment)
		r.Get("/api/lms/certificate", handlers.GenerateCertificate)
		r.Get("/api/admin/users", handlers.GetMasterAdminUsers)
		r.Delete("/api/admin/users", handlers.DeleteAdminUser)
		r.Get("/api/admin/submissions", handlers.GetAdminSubmissions)
		r.Get("/api/admin/modules", handlers.GetAdminModules)
		r.Post("/api/admin/modules", handlers.CreateAdminModule)
		r.Post("/api/admin/lessons", handlers.CreateAdminLesson)
		r.Post("/api/lms/reviews", handlers.SubmitReview)
		r.Get("/api/lms/discussions", handlers.GetGlobalDiscussions)
		r.Get("/api/lms/lessons/{id}/comments", handlers.GetLessonComments)
		r.Post("/api/lms/lessons/{id}/comments", handlers.PostLessonComment)

	})

	// 5. Start Server
	fmt.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
