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

rows, err := db.Pool.Query(context.Background(), "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quizzes'")
if err != nil {
fmt.Println(err)
return
}
defer rows.Close()
for rows.Next() {
var colName, dataType string
rows.Scan(&colName, &dataType)
fmt.Printf("%s: %s\n", colName, dataType)
}
}
