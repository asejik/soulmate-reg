package handlers

import (
	"net/http"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/jung-kurt/gofpdf"
)

func GenerateCertificate(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	requestedProgram := r.URL.Query().Get("program")
	programName, _, _ := resolveActiveProgram(r.Context(), userID, requestedProgram)

	displayProgramName := "Ready for a Soulmate"
	if programName == "launchpad" { displayProgramName = "Couples' Launchpad 5.0" }

	var userName string
	db.Pool.QueryRow(r.Context(), `
		SELECT COALESCE(cl.full_name, p.full_name, 'Participant') FROM auth.users au
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email LEFT JOIN public.participants p ON au.email = p.email
		WHERE au.id = $1 LIMIT 1
	`, userID).Scan(&userName)

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	// 1. Subtle Texture Background (Cream/Off-white with very faint grain)
	pdf.SetFillColor(254, 253, 250)
	pdf.Rect(0, 0, 297, 210, "F")
	
	// Add very faint "texture" dots
	pdf.SetDrawColor(240, 235, 220)
	for i := 5; i < 290; i += 8 {
		for j := 5; j < 205; j += 8 {
			pdf.Circle(float64(i), float64(j), 0.1, "D")
		}
	}

	// 2. Borders
	pdf.SetDrawColor(15, 23, 42); pdf.SetLineWidth(2.0); pdf.Rect(10, 10, 277, 190, "D")
	pdf.SetDrawColor(212, 175, 55); pdf.SetLineWidth(0.5); pdf.Rect(14, 14, 269, 182, "D")

	// Corners
	pdf.SetLineWidth(1.0)
	pdf.Line(18, 18, 30, 18); pdf.Line(18, 18, 18, 30)
	pdf.Line(279, 18, 267, 18); pdf.Line(279, 18, 279, 30)
	pdf.Line(18, 192, 30, 192); pdf.Line(18, 192, 18, 180)
	pdf.Line(279, 192, 267, 192); pdf.Line(279, 192, 279, 180)

	// 3. Logo Background Plate (To make white logo visible)
	pdf.SetFillColor(15, 23, 42) // Dark Navy
	pdf.RoundedRect(128, 18, 41, 20, 3, "1234", "F")
	pdf.ImageOptions("../client/public/logo.png", 130, 20, 37, 0, false, gofpdf.ImageOptions{ReadDpi: true}, 0, "")

	pdf.SetFont("Arial", "B", 36); pdf.SetTextColor(15, 23, 42); pdf.SetY(65)
	pdf.CellFormat(277, 20, "CERTIFICATE OF COMPLETION", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "I", 16); pdf.SetTextColor(100, 116, 139); pdf.SetY(90)
	pdf.CellFormat(277, 10, "This proudly certifies that", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "B", 36); pdf.SetTextColor(59, 130, 246); pdf.SetY(110)
	pdf.CellFormat(277, 15, userName, "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "I", 16); pdf.SetTextColor(100, 116, 139); pdf.SetY(135)
	pdf.CellFormat(277, 10, "has successfully completed the curriculum for", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "B", 24); pdf.SetTextColor(15, 23, 42); pdf.SetY(150)
	pdf.CellFormat(277, 10, displayProgramName, "", 1, "C", false, 0, "")

	// 4. Footer Section - Fixed Alignment
	pdf.SetY(175); pdf.SetX(30); pdf.SetFont("Arial", "B", 12); pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(15, 8, "Date:", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(60, 8, time.Now().Format("January 2, 2006"), "", 0, "L", false, 0, "")

	// Move X for Signature
	pdf.SetX(187)
	pdf.SetFont("Arial", "B", 14); pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(80, 8, "Temitope Ayenigba", "", 1, "R", false, 0, "") // ln=1 to move down
	
	pdf.SetX(187) // Reset X for the next row
	pdf.SetFont("Arial", "I", 12); pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(80, 6, "Convener", "", 1, "R", false, 0, "")

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=TAI_Certificate.pdf")
	pdf.Output(w)
}