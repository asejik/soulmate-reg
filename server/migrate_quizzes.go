package main

import (
"context"
"fmt"
"github.com/asejik/soulmate-reg/server/db"
"github.com/joho/godotenv"
)

func main() {
godotenv.Load("../.env")
db.Connect()
defer db.Close()

// 1. Add Unique constraint
_, err := db.Pool.Exec(context.Background(), `
ALTER TABLE public.quizzes 
ADD CONSTRAINT unique_lesson_id UNIQUE (lesson_id);
`)
if err != nil {
fmt.Println("Warning/Error adding unique constraint:", err)
} else {
fmt.Println("Added unique constraint on lesson_id.")
}

// 2. Add question column
_, err = db.Pool.Exec(context.Background(), `
ALTER TABLE public.quizzes 
ADD COLUMN question text;
`)
if err != nil {
fmt.Println("Warning/Error adding question column:", err)
} else {
fmt.Println("Added question column.")
}
}
