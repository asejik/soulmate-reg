package services

import (
	"fmt"
	"os"

	"github.com/resend/resend-go/v2"
)

// --- SOULMATE (RFASM) STRUCTURES ---

type EmailData struct {
	Name         string
	Email        string
	ClanName     string
	WhatsAppLink string
}

// SendConfirmationEmail sends the RFASM confirmation email
func SendConfirmationEmail(data EmailData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: RESEND_API_KEY is missing")
		return nil
	}

	client := resend.NewClient(apiKey)

	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; }
			.container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
			.header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
			.content { padding: 20px; background-color: #fafafa; }
			.button { display: inline-block; padding: 10px 20px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
			.footer { font-size: 12px; text-align: center; color: #888; margin-top: 20px; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h1>You're In!</h1>
				<p>Welcome to Ready for a Soulmate (Cohort 3)</p>
			</div>
			<div class="content">
				<p>Dear <strong>%s</strong>,</p>
				<p>Congratulations! Your registration for the upcoming Ready for a Soulmate cohort is officially confirmed.</p>
				<p>We are thrilled to have you join this journey. This isn't just another meeting; it is a consecrated time for those who are ready to be positioned, refined, and settled by God's word.</p>

				<h3>1. Your Clan Assignment</h3>
				<p>You have been successfully assigned to: <strong>%s</strong></p>
				<p>This is your primary community for the duration of this cohort.</p>
				<p><a href="%s" class="button">Join WhatsApp Group</a></p>
				<p><strong>Clan Conduct:</strong> Please stay active, stay prayerful, and honor and obey the administrators on your Clan page.</p>

				<h3>2. The Feedback Commitment</h3>
				<p>As you agreed during registration, your participation is tied to your feedback. This helps us document the wonders of God and improve the experience for future brothers and sisters.</p>

				<h3>3. Preparation Checklist</h3>
				<ul>
					<li>Follow us on Instagram: <strong>@readyforasoulmate</strong></li>
					<li>Heart Check: Come with a heart of thanksgiving and a notebook.</li>
					<li>Privacy: Ensure you are in a quiet, distraction-free environment for our scheduled classes.</li>
				</ul>

				<p><em>"He makes all things beautiful in His time." You are not here by accident. Trust the process, abide in the Word, and expect your testimony.</em></p>
			</div>
			<div class="footer">
				<p>© 2026 Temitope Ayenigba Initiative</p>
			</div>
		</div>
	</body>
	</html>
	`, data.Name, data.ClanName, data.WhatsAppLink)

	params := &resend.SendEmailRequest{
		From:    "Ready for a Soulmate <admin@temitopeayenigba.com>",
		To:      []string{data.Email},
		Subject: "Welcome to Ready for a Soulmate (Cohort 3)",
		Html:    htmlContent,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		fmt.Println("Error sending email:", err)
		return err
	}

	fmt.Println("Email sent successfully:", sent.Id)
	return nil
}

// --- LAUNCHPAD (COUPLES) STRUCTURES ---

type LaunchpadEmailData struct {
	Name         string
	Email        string
	WhatsAppLink string
	TelegramLink string
}

// SendLaunchpadEmail sends the Couples' Launchpad specific email
func SendLaunchpadEmail(data LaunchpadEmailData) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: RESEND_API_KEY is missing")
		return nil
	}

	client := resend.NewClient(apiKey)

	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; }
			.container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
			.header { background-color: #ec4899; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
			.content { padding: 20px; background-color: #fafafa; }
			.button { display: inline-block; padding: 12px 24px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
			.button-tg { background-color: #0088cc; }
			.footer { font-size: 12px; text-align: center; color: #888; margin-top: 20px; }
			.highlight { background-color: #fce7f3; padding: 15px; border-left: 4px solid #ec4899; margin: 15px 0; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h1>You're In! 🚀</h1>
				<p>Couples' Launchpad 5.0</p>
			</div>
			<div class="content">
				<p>Dear <strong>%s</strong>,</p>

				<p>Congratulations! Your registration for <strong>Couples' Launchpad 5.0</strong> is officially confirmed.</p>

				<p>We are thrilled to journey with you and your partner. This is a consecrated time specifically for couples preparing to build a solid foundation.</p>

				<div class="highlight">
					<h3>📅 Important Schedule</h3>
					<p>Remember your commitment to attend classes on:</p>
					<p><strong>Tuesdays & Thursdays @ 8:00 PM</strong></p>
				</div>

				<h3>🚀 Next Steps (Compulsory)</h3>
				<p>To receive meeting details, instructions, and prayer updates, you must join BOTH groups below:</p>

				<p>
					<a href="%s" class="button">1. Join WhatsApp Group (Conversations)</a>
				</p>
				<p>
					<a href="%s" class="button button-tg">2. Join Telegram Group (Prayers)</a>
				</p>

				<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

				<h3>💡 The Feedback Commitment</h3>
				<p>As you agreed during registration, your participation is tied to your feedback. This helps us document the wonders of God and improve the experience for future couples.</p>

				<p><em>"He makes all things beautiful in His time." Trust the process.</em></p>
			</div>
			<div class="footer">
				<p>© 2026 Temitope Ayenigba Initiative</p>
			</div>
		</div>
	</body>
	</html>
	`, data.Name, data.WhatsAppLink, data.TelegramLink)

	params := &resend.SendEmailRequest{
		From:    "Couples' Launchpad <admin@temitopeayenigba.com>",
		To:      []string{data.Email},
		Subject: "Welcome to Couples' Launchpad 5.0! 🚀",
		Html:    htmlContent,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		fmt.Println("Error sending email:", err)
		return err
	}

	fmt.Println("Launchpad Email sent successfully:", sent.Id)
	return nil
}