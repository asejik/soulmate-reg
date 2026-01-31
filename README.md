# Ready for a Soulmate - Registration Portal

A high-concurrency, full-stack registration system built for the "Ready for a Soulmate" cohort. This application handles user eligibility, complex form data, atomic clan assignment (preventing overbooking), and automated email communication.

![Project Status](https://img.shields.io/badge/status-production--ready-green)
![Tech Stack](https://img.shields.io/badge/stack-Go_React_PostgreSQL-blue)

## 🚀 Features

- **Gatekeeper Logic**: Strict eligibility checks (Gender, Marital Status) before access.
- **Atomic Clan Assignment**: Database locking ensures groups never exceed 20 members, even under high traffic.
- **Social Lock**: Mandatory Instagram follow step before final submission.
- **Smart Emailing**: Asynchronous HTML confirmation emails via Resend.
- **Admin Dashboard**: Secure "Mission Control" to view live stats and download participant data.
- **Shadow Database**: Real-time backup of participant data to Google Sheets via Webhook.
- **State Persistence**: Users don't lose their place in the form if they refresh the page.

---

## 🛠️ Tech Stack

### **Backend**
- **Language**: Go (Golang) 1.25+
- **Framework**: Chi (Lightweight router)
- **Database**: PostgreSQL (via Supabase Connection Pooler)
- **Drivers**: pgx/v5 (High performance)
- **Email**: Resend Go SDK

### **Frontend**
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Icons**: Lucide React
- **Hosting**: Vercel

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory with the following keys:

```env
# Database (Supabase Transaction Mode Connection String)
DATABASE_URL="postgres://postgres:[USER]:[PASSWORD]@[HOST]:6543/postgres?default_query_exec_mode=simple_protocol"

# Admin Security (Password for Dashboard)
ADMIN_SECRET="YourStrongSecretPassword!"

# Email Service (Resend.com)
RESEND_API_KEY="re_12345678..."

# Server Port
PORT=8080

# Google Sheets Backup (Apps Script Webhook URL)
GOOGLE_SHEETS_WEBHOOK_URL="[https://script.google.com/macros/s/](https://script.google.com/macros/s/)..."

```

---

## 🏃‍♂️ Local Development Setup

### **1. Backend Setup**

Navigate to the server directory and start the Go API.

```bash
cd server
go mod download
go run main.go

```

*The server will start on `http://localhost:8080*`

### **2. Frontend Setup**

Open a new terminal, navigate to the client directory, and start the React app.

```bash
cd client
npm install
npm run dev

```

*The app will be available at `http://localhost:5173*`

---

## 📦 Deployment Guide

### **Backend (Render)**

1. Push code to GitHub.
2. Create a **Web Service** on [Render](https://render.com).
3. Connect your repo.
4. **Root Directory**: `server`
5. **Build Command**: `go build -o main .`
6. **Start Command**: `./main`
7. Add Environment Variables from your `.env` file.

### **Frontend (Vercel)**

1. Push code to GitHub.
2. Create a **New Project** on [Vercel](https://vercel.com).
3. **Root Directory**: `client`
4. **Environment Variables**:
* `VITE_API_URL`: `https://your-render-backend-url.onrender.com` (No trailing slash)


5. Deploy.

---

## 🛡️ Admin Access

To access the Mission Control dashboard:

1. Navigate to your deployed URL.
2. Append `?mode=admin` to the URL (e.g., `https://yourapp.com/?mode=admin`).
3. Enter the `ADMIN_SECRET` configured in your environment variables.

---

## 📄 License

This project is proprietary software developed for "Temitope Ayenigba Initiative".