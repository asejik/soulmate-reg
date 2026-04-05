package handlers

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/asejik/soulmate-reg/server/db"
	"github.com/go-pdf/fpdf"
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

	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	// 1. Subtle Texture Background (Cream/Off-white with very faint grain)
	pdf.SetFillColor(254, 253, 250)
	pdf.Rect(0, 0, 297, 210, "F")
	
	// Add "texture" dots (made slightly darker for visibility)
	pdf.SetDrawColor(220, 215, 200)
	for i := 5; i < 290; i += 6 {
		for j := 5; j < 205; j += 6 {
			pdf.Circle(float64(i), float64(j), 0.15, "D")
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

	// 3. Logo (logo2.png is black, smaller and centered)
	logoPath := "client/public/logo2.png"
	if _, err := os.Stat(logoPath); err != nil {
		log.Printf("Logo not found at %s: %v", logoPath, err)
		logoPath = "../client/public/logo2.png" // Try fallback
	}
	pdf.ImageOptions(logoPath, 136, 20, 25, 0, false, fpdf.ImageOptions{ReadDpi: true}, 0, "")

	pdf.SetFont("Arial", "B", 36); pdf.SetTextColor(15, 23, 42); pdf.SetY(65)
	pdf.CellFormat(277, 20, "CERTIFICATE OF COMPLETION", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "I", 16); pdf.SetTextColor(100, 116, 139); pdf.SetY(90)
	pdf.CellFormat(277, 10, "This proudly certifies that", "", 1, "C", false, 0, "")

	// 4. Student Name (Handwritten & Gold)
	fontPath := "server/fonts/DancingScript-Bold.ttf"
	if _, err := os.Stat(fontPath); err != nil {
		log.Printf("Font not found at %s: %v", fontPath, err)
		fontPath = "fonts/DancingScript-Bold.ttf" // Try fallback
	}
	
	pdf.AddUTF8Font("DancingScript", "", fontPath)
	if pdf.Error() != nil {
		log.Printf("PDF Error after AddUTF8Font: %v", pdf.Error())
	}
	pdf.SetFont("DancingScript", "", 48); pdf.SetTextColor(212, 175, 55); pdf.SetY(105)
	pdf.CellFormat(277, 25, userName, "", 1, "C", false, 0, "")

	if pdf.Error() != nil {
		log.Printf("Final PDF processing error: %v", pdf.Error())
		http.Error(w, "Failed to generate certificate: " + pdf.Error().Error(), http.StatusInternalServerError)
		return
	}

	pdf.SetFont("Arial", "I", 16); pdf.SetTextColor(100, 116, 139); pdf.SetY(135)
	pdf.CellFormat(277, 10, "has successfully completed the curriculum for", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "B", 24); pdf.SetTextColor(15, 23, 42); pdf.SetY(150)
	pdf.CellFormat(277, 10, displayProgramName, "", 1, "C", false, 0, "")

	// 4. Footer Section
	pdf.SetY(175); pdf.SetX(30); pdf.SetFont("Arial", "B", 12); pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(15, 8, "Date:", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "", 12)
	pdf.CellFormat(60, 8, time.Now().Format("January 2, 2006"), "", 0, "L", false, 0, "")

	// Shared X for Signature block to ensure center alignment relative to each other
	sigX := 195.0
	pdf.SetY(175); pdf.SetX(sigX)
	pdf.SetFont("Arial", "B", 14); pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(70, 8, "Temitope Ayenigba", "", 1, "C", false, 0, "")
	
	pdf.SetX(sigX)
	pdf.SetFont("Arial", "I", 12); pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(70, 6, "Convener", "", 1, "C", false, 0, "")


	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=TAI_Certificate.pdf")
	pdf.Output(w)
}