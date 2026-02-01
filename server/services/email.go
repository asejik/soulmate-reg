package services

import (
	"fmt"
	"log"
	"os"

	"github.com/resend/resend-go/v2"
)

type EmailData struct {
	Name         string
	Email        string
	ClanName     string
	WhatsAppLink string
}

func SendConfirmationEmail(data EmailData) {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		log.Println("⚠️ RESEND_API_KEY is missing. Skipping email.")
		return
	}

	client := resend.NewClient(apiKey)

	// HTML Template using the text from your source document
	htmlContent := fmt.Sprintf(`
	<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
		<div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
			<h1 style="color: #4F46E5;">You’re In!</h1>
			<p>Welcome to Ready for a Soulmate (Cohort 3)</p>
		</div>

		<div style="padding: 20px 0;">
			<p>Dear <strong>%s</strong>,</p>

			<p>Congratulations! Your registration for the upcoming <strong>Ready for a Soulmate</strong> cohort is officially confirmed.</p>

			<p>We are thrilled to have you join this journey. This isn’t just another meeting; it is a consecrated time for those who are ready to be positioned, refined, and settled by God’s word.</p>

			<div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0; color: #4338ca;">1. Your Clan Assignment</h3>
				<p>You have been successfully assigned to: <strong>%s</strong></p>
				<p>This is your primary community for the duration of this cohort.</p>
				<p><a href="%s" style="background-color: #25D366; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join WhatsApp Group</a></p>
				<p style="font-size: 12px; color: #666;">Clan Conduct: Please stay active, stay prayerful, and honor and obey the administrators on your Clan page.</p>
			</div>

			<h3>2. The Feedback Commitment</h3>
			<p>As you agreed during registration, your participation is tied to your feedback. This helps us document the wonders of God and improve the experience for future brothers and sisters.</p>

			<h3>3. Preparation Checklist</h3>
			<ul>
				<li><strong>Follow us on Instagram:</strong> <a href="https://instagram.com/readyforasoulmate">@readyforasoulmate</a></li>
				<li><strong>Heart Check:</strong> Come with a heart of thanksgiving and a notebook.</li>
				<li><strong>Privacy:</strong> Ensure you are in a quiet, distraction-free environment for our scheduled classes.</li>
			</ul>

			<div style="border-left: 4px solid #4F46E5; padding-left: 15px; font-style: italic; color: #555;">
				"He makes all things beautiful in His time." You are not here by accident. Trust the process, abide in the Word, and expect your testimony.
			</div>
		</div>

		<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 14px; color: #888;">
			With Love,<br>
			<strong>Mrs Temitope Ayenigba</strong><br>
			Ready for a Soulmate
		</div>
	</div>
	`, data.Name, data.ClanName, data.WhatsAppLink)

	params := &resend.SendEmailRequest{
		From:    "Ready for a Soulmate <info@temitopeayenigba.com>", // NOTE: Change this if you have a custom domain on Resend
		To:      []string{data.Email},
		Subject: "You’re In! Welcome to Ready for a Soulmate (Cohort 3)",
		Html:    htmlContent,
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		log.Printf("❌ Failed to send email to %s: %v", data.Email, err)
		return
	}

	log.Printf("📧 Email sent successfully to %s", data.Email)
}
