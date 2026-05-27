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

	lessonID := "a0983905-0a4b-4b2c-9de0-a372b9089bdc"

	var quizID, quizTitle string
	var sch *string
	err := db.Pool.QueryRow(context.Background(), `
		SELECT q.id, q.title, l.scheduled_start_time
		FROM public.quizzes q
		JOIN public.lessons l ON q.lesson_id = l.id
		WHERE q.lesson_id = $1
	`, lessonID).Scan(&quizID, &quizTitle, &sch)

	if err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Quiz ID: %s, Title: %s, Scheduled: %v\n", quizID, quizTitle, sch)
	}

	// Just select all quizzes to see what's there
	rows, _ := db.Pool.Query(context.Background(), "SELECT lesson_id, title FROM public.quizzes")
	defer rows.Close()
	fmt.Println("All quizzes in DB:")
	for rows.Next() {
		var lID, t string
		rows.Scan(&lID, &t)
		fmt.Printf("- Lesson: %s, Title: %s\n", lID, t)
	}
}
