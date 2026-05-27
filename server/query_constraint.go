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

rows, err := db.Pool.Query(context.Background(), `
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'quizzes'
`)
if err != nil {
fmt.Println("Error:", err)
return
}
defer rows.Close()
fmt.Println("Constraints for quizzes:")
for rows.Next() {
var name, ctype string
rows.Scan(&name, &ctype)
fmt.Printf("%s: %s\n", name, ctype)
}
}
