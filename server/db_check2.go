package main

import (
"context"
"fmt"
"log"
"os"
"github.com/jackc/pgx/v5/pgxpool"
"github.com/joho/godotenv"
)

func main() {
    err := godotenv.Load("../.env")
    if err != nil {
        fmt.Println("No .env file found in parent directory")
    }
dbUrl := os.Getenv("DATABASE_URL")
    if dbUrl == "" {
        log.Fatal("DATABASE_URL is empty")
    }
pool, err := pgxpool.New(context.Background(), dbUrl)
if err != nil {
log.Fatal(err)
}
defer pool.Close()

var hasQuiz bool
var scheduledStartTime *string
err = pool.QueryRow(context.Background(), "SELECT has_quiz, scheduled_start_time FROM lessons WHERE id = '41a1ab7e-9f09-4928-8879-e3591c8ddc29'").Scan(&hasQuiz, &scheduledStartTime)
if err != nil {
log.Fatal(err)
}
if scheduledStartTime != nil {
fmt.Printf("has_quiz: %v\nscheduled_start_time: %v\n", hasQuiz, *scheduledStartTime)
} else {
fmt.Printf("has_quiz: %v\nscheduled_start_time: nil\n", hasQuiz)
}
}
