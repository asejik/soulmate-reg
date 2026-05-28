package main

import (
"context"
"fmt"
"github.com/asejik/soulmate-reg/server/db"
"log"
"github.com/joho/godotenv"
)

func main() {
    godotenv.Load("../.env")
db.Connect()
var hasQuiz bool
var scheduledStartTime *string
var title string
err := db.Pool.QueryRow(context.Background(), "SELECT title, has_quiz, scheduled_start_time FROM lessons WHERE id = '41a1ab7e-9f09-4928-8879-e3591c8ddc29'").Scan(&title, &hasQuiz, &scheduledStartTime)
if err != nil {
log.Fatal(err)
}
if scheduledStartTime != nil {
fmt.Printf("title: %s\nhas_quiz: %v\nscheduled_start_time: %v\n", title, hasQuiz, *scheduledStartTime)
} else {
fmt.Printf("title: %s\nhas_quiz: %v\nscheduled_start_time: nil\n", title, hasQuiz)
}
}
