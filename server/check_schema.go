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

	fmt.Println("--- CHECKING PROGRAM_REVIEWS TABLE ---")
	var exists bool
	err = pool.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'program_reviews')").Scan(&exists)
	if err != nil { log.Fatalf("Check err: %v", err) }
	fmt.Printf("Table exists: %v\n", exists)

	if exists {
		rows, _ := pool.Query(context.Background(), "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'program_reviews'")
		for rows.Next() {
			var cn, dt string
			rows.Scan(&cn, &dt)
			fmt.Printf("Col: %s (%s)\n", cn, dt)
		}
		rows.Close()

		fmt.Println("\n--- UNIQUE CONSTRAINTS ---")
		cRows, _ := pool.Query(context.Background(), `
			SELECT conname
			FROM pg_constraint
			WHERE conrelid = 'public.program_reviews'::regclass
			AND contype = 'u'
		`)
		for cRows.Next() {
			var name string
			cRows.Scan(&name)
			fmt.Printf("Unique Constraint: %s\n", name)
		}
		cRows.Close()
	}
}
