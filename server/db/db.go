package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

// Connect initializes the database connection pool
func Connect() {
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}

	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	// Create the connection pool
	Pool, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}

	// Test the connection
	if err := Pool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}

	fmt.Println("✅ Successfully connected to Supabase PostgreSQL!")
	InitTables()
}

func InitTables() {
	_, err := Pool.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS public.program_settings (
			program_name TEXT PRIMARY KEY,
			mid_checkpoint_video_id TEXT
		);
		INSERT INTO public.program_settings (program_name) 
		VALUES ('Ready for a Soulmate'), ('Couples Launchpad')
		ON CONFLICT (program_name) DO NOTHING;

		-- Ensure updated_at exists in lesson_progress
		ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
	`)
	if err != nil {
		fmt.Printf("⚠️  Table Init Failed: %v\n", err)
	} else {
		fmt.Println("✅ Database tables initialized!")
	}
}

// Close closes the pool (used on shutdown)
func Close() {
	if Pool != nil {
		Pool.Close()
	}
}
