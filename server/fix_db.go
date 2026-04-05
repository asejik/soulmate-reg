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

	_, err = pool.Exec(context.Background(), "UPDATE public.program_settings SET mid_checkpoint_video_id = 'dQw4w9WgXcQ'")
	if err != nil { log.Fatalf("Update err: %v", err) }
	fmt.Println("✅ All programs updated to test video dQw4w9WgXcQ!")
}
