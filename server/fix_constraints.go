package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbUrl := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil { log.Fatalf("Pool err: %v", err) }
	defer pool.Close()

	fmt.Println("--- UPDATING PROGRAM_REVIEWS CONSTRAINTS ---")
	
	// 1. Drop the old constraint
	_, err = pool.Exec(context.Background(), "ALTER TABLE public.program_reviews DROP CONSTRAINT IF EXISTS program_reviews_user_id_program_name_key")
	if err != nil { log.Fatalf("Drop err: %v", err) }
	fmt.Println("✅ Dropped old constraint.")

	// 2. Add the new robust constraint including review_type
	_, err = pool.Exec(context.Background(), "ALTER TABLE public.program_reviews ADD CONSTRAINT program_reviews_user_id_program_name_review_type_key UNIQUE (user_id, program_name, review_type)")
	if err != nil { 
		// If it already exists for some reason, just log it
		fmt.Printf("⚠️  Add err (might already exist): %v\n", err) 
	} else {
		fmt.Println("✅ Added new unique constraint (user_id, program_name, review_type).")
	}
}
