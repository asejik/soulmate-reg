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
	if dbUrl == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	rows, err := pool.Query(context.Background(), "SELECT program_name, mid_checkpoint_video_id FROM public.program_settings")
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("--- PROGRAM SETTINGS ---")
	for rows.Next() {
		var pName, vID string
		rows.Scan(&pName, &vID)
		fmt.Printf("[%s] -> [%s]\n", pName, vID)
	}
}
