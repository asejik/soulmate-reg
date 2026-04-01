# Temitope Ayenigba Platform (Registration + LMS)

A high-concurrency, full-stack registration system and Learning Management System (LMS) built for the "Ready for a Soulmate" (RFASM) and "Couples' Launchpad" (CLP) cohorts. This application handles user eligibility, complex form data, secure account claiming, sequential video learning, and automated certificate generation.

![Project Status](https://img.shields.io/badge/status-production--ready-green)
![Tech Stack](https://img.shields.io/badge/stack-React_Go_Supabase-blue)

## 🚀 Key Features

### **1. Advanced LMS Engine**
- **Sequential Learning:** Lessons are strictly locked until previous assignments are submitted.
- **Backend "Bouncer":** Go API intercepts and blocks direct URL attempts to bypass locked lessons.
- **Simulated Live Premieres:** Pre-recorded videos premiere globally in real-time with a custom timezone-aware scheduler, locked seekbars, and dynamic "NOW LIVE" UI badges.
- **Video Resume Engine:** Custom YouTube hook auto-saves progress every 5 seconds, allowing seamless resuming across devices.
- **Multi-Program Switcher:** Dual-enrolled students can toggle between curriculums seamlessly via a centralized dashboard.
- **Progress Interceptors:** Mandatory review checkpoints at 50% (Mid-Cohort) and 100% (Final) before unlocking subsequent content or certificates.

### **2. Dynamic Assets & Community**
- **Automated PDF Certificates:** Geometrically bordered certificates generated on the fly via the Go backend, complete with dynamic name injection and logo stamping.
- **Global Discussions:** Real-time lesson-specific Q&A tabs and a global forum view.
- **Student Transcript:** A dedicated Grades page dynamically tracking watched percentages and assignment completion.

### **3. Smart Registration & Admin**
- **Gatekeeper Logic:** Strict eligibility checks (Gender, Marital Status) and atomic database locking to prevent overbooking.
- **Whitelist Onboarding:** Secure "Claim Account" flow mapping Supabase Auth to pre-registered participant emails.
- **Master Admin Portal:** Secure "Mission Control" to manage users, track LMS progress, and execute Curriculum CRUD operations.
- **Shadow Database:** Real-time backup of participant data to Google Sheets via Webhook.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React + Vite (TypeScript)
- **Routing**: React Router v6 (Role-based Protected Routes)
- **Styling**: Tailwind CSS + Framer Motion (Professional Dark Mode)
- **Video**: Custom `useYouTubePlayer` hook (IFrame API integration)
- **Icons**: Lucide React
- **Hosting**: Vercel

### **Backend**
- **Language**: Go (Golang) 1.25+
- **Architecture**: Micro-service handler pattern (`lms_lessons.go`, `lms_dashboard.go`, etc.)
- **Framework**: Chi (Lightweight router)
- **PDF Engine**: `go-pdf/fpdf`
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth)
- **Drivers**: pgxpool (High-performance connection pooling)
- **Email**: Resend Go SDK

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory with the following keys:

# Database (Supabase Transaction Mode Connection String)
DATABASE_URL="postgres://postgres:[USER]:[PASSWORD]@[HOST]:6543/postgres?default_query_exec_mode=simple_protocol"

# Supabase Auth Integration
SUPABASE_URL="[https://your-project.supabase.co](https://your-project.supabase.co)"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# Admin Security (Password for standalone Dashboard)
ADMIN_SECRET="YourStrongSecretPassword!"

# Email Service (Resend.com)
RESEND_API_KEY="re_12345678..."

# Server Port
PORT=8080

# Google Sheets Backup (Apps Script Webhook URL)
GOOGLE_SHEETS_WEBHOOK_URL="[https://script.google.com/macros/s/](https://script.google.com/macros/s/)..."

---

## 🏃‍♂️ Local Development Setup

### **1. Backend Setup**

Navigate to the server directory and start the Go API.

```bash
cd server
go mod download
go run main.go
```
*The server will start on `http://localhost:8080`*

### **2. Frontend Setup**

Open a new terminal, navigate to the client directory, and start the React app.

```bash
cd client
npm install
npm run dev
```
*The app will be available at `http://localhost:5173`*

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
   * `VITE_SUPABASE_URL`: Your Supabase URL
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Deploy.

---

## 🛡️ Admin Access

To access the Master Admin Portal:
1. Ensure your registered email matches the master admin email established in the backend whitelisting.
2. Log in through the standard portal.
3. Access the hidden `/admin` route to manage Curriculum, Users, and Progress tracking.

*(For legacy standalone registration stats, append `?mode=admin` to the root URL and provide the `ADMIN_SECRET`).*

---

## 📄 License

This project is proprietary software developed for the "Temitope Ayenigba Initiative".