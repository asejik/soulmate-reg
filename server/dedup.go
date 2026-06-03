package main

import (
"context"
"fmt"
"log"
"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
dbURL := "postgresql://postgres.rbvdzvzkwelpsrstrkbf:SoulmateProject2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres?default_query_exec_mode=simple_protocol"
pool, err := pgxpool.New(context.Background(), dbURL)
if err != nil {
log.Fatal(err)
}
defer pool.Close()

// Find duplicate emails
rows, err := pool.Query(context.Background(), `
SELECT email, COUNT(*) 
FROM public.couples_launchpad 
GROUP BY email 
HAVING COUNT(*) > 1
`)
if err != nil {
log.Fatal(err)
}
defer rows.Close()

var duplicates []string
for rows.Next() {
var email string
var count int
rows.Scan(&email, &count)
duplicates = append(duplicates, email)
fmt.Printf("Duplicate email: %s (Count: %d)\n", email, count)
}

fmt.Printf("Found %d duplicated emails.\n", len(duplicates))

// Delete duplicates by keeping the one with the earliest created_at or id
// Since we don't know the primary key name (usually id), we can use ctid for postgres.
res, err := pool.Exec(context.Background(), `
DELETE FROM public.couples_launchpad
WHERE ctid NOT IN (
SELECT min(ctid)
FROM public.couples_launchpad
GROUP BY email
)
`)
if err != nil {
log.Fatal(err)
}
fmt.Printf("Deleted %d duplicate rows.\n", res.RowsAffected())
}
