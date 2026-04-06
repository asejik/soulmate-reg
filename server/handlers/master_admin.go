package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"fmt"

	"github.com/asejik/soulmate-reg/server/db"
)

// isAdminEmail checks if the provided email belongs to one of the master administrators
func isAdminEmail(email string) bool {
	allowedAdmins := []string{
		"asejik@gmail.com",
		"temitopeayenigba@gmail.com",
		"winneridigbe@gmail.com",
	}
	for _, admin := range allowedAdmins {
		if email == admin {
			return true
		}
	}
	return false
}

type MasterAdminUser struct {
	ID                   string    `json:"id"`
	FullName             string    `json:"full_name"`
	Email                string    `json:"email"`
	WhatsAppNumber       string    `json:"whatsapp_number"`
	Gender               string    `json:"gender"`
	Location             string    `json:"location"`
	Religion             string    `json:"religion"`
	InstagramHandle      string    `json:"instagram_handle"`
	Source               string    `json:"source"`
	CreatedAt            time.Time `json:"created_at"`

	// RFASM Specific
	State              string `json:"state"`
	AgeGroup           string `json:"age_group"`
	ChurchName         string `json:"church_name"`
	RelationshipStatus string `json:"relationship_status"`
	ClanID             string `json:"clan_id"`

	// CLP Specific
	Denomination       string `json:"denomination"`
	ReferralSource     string `json:"referral_source"`
	WeddingDate        string `json:"wedding_date"`
	PartnerRegistered  string `json:"partner_registered"`
	SpouseName         string `json:"spouse_name"`
	SpouseWhatsApp     string `json:"spouse_whatsapp"`
	AttendedBefore     bool   `json:"attended_before"`
	AgreedToFeedback   bool   `json:"agreed_to_feedback"`
	AgreedToParticipation bool `json:"agreed_to_participation"`
	IsActivated         bool   `json:"is_activated"`
}

// GetMasterAdminUsers fetches all registered users across both programs
func GetMasterAdminUsers(w http.ResponseWriter, r *http.Request) {
	// 1. Double-Lock Security: Verify the requester is actually the admin via JWT
	userID := r.Context().Value(userIDKey).(string)

	var email string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&email)
	if err != nil || !isAdminEmail(email) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Query BOTH tables with all fields mapped correctly (using COALESCE to handle legacy NULLs)
	rows, err := db.Pool.Query(r.Context(), `
		SELECT 
			p.id::text, p.full_name, p.email, COALESCE(p.whatsapp_number, ''), COALESCE(p.gender, ''), COALESCE(p.country, ''), 
			COALESCE(p.religion, ''), COALESCE(p.instagram_handle, ''), 'Ready for a Soulmate' as source, p.created_at,
			COALESCE(p.state, ''), COALESCE(p.age_group, ''), COALESCE(p.church_name, ''), COALESCE(p.relationship_status, ''), COALESCE(p.clan_id::text, ''),
			'' as denomination, '' as referral_source, '' as wedding_date, '' as partner_registered,
			'' as spouse_name, '' as spouse_whatsapp, false as attended_before, false as agreed_to_feedback, false as agreed_to_participation,
			EXISTS (SELECT 1 FROM auth.users u WHERE u.email = p.email) as is_activated
		FROM public.participants p
		UNION ALL
		SELECT 
			c.id::text, c.full_name, c.email, COALESCE(c.whatsapp_number, ''), COALESCE(c.gender, ''), COALESCE(c.country_city, ''),
			COALESCE(c.religion, ''), COALESCE(c.instagram_handle, ''), 'Couples Launchpad' as source, c.created_at,
			'' as state, '' as age_group, '' as church_name, '' as relationship_status, '' as clan_id,
			COALESCE(c.denomination, ''), COALESCE(referral_source, ''), COALESCE(c.wedding_date::text, ''), COALESCE(c.partner_registered, ''),
			COALESCE(c.spouse_name, ''), COALESCE(c.spouse_whatsapp, ''), COALESCE(c.attended_before, false), COALESCE(c.agreed_to_feedback, false), COALESCE(c.agreed_to_participation, false),
			EXISTS (SELECT 1 FROM auth.users u WHERE u.email = c.email) as is_activated
		FROM public.couples_launchpad c
		ORDER BY created_at DESC
	`)

	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []MasterAdminUser
	for rows.Next() {
		var u MasterAdminUser
		err := rows.Scan(
			&u.ID, &u.FullName, &u.Email, &u.WhatsAppNumber, &u.Gender, &u.Location,
			&u.Religion, &u.InstagramHandle, &u.Source, &u.CreatedAt,
			&u.State, &u.AgeGroup, &u.ChurchName, &u.RelationshipStatus, &u.ClanID,
			&u.Denomination, &u.ReferralSource, &u.WeddingDate, &u.PartnerRegistered,
			&u.SpouseName, &u.SpouseWhatsApp, &u.AttendedBefore, &u.AgreedToFeedback, &u.AgreedToParticipation,
			&u.IsActivated,
		)
		if err != nil {
			fmt.Println("Scaning error:", err)
			continue
		}
		users = append(users, u)
	}

	// 3. Return the data to the React frontend
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

type AdminSubmission struct {
	ID            string    `json:"id"`
	StudentName   string    `json:"student_name"`
	Email         string    `json:"email"`
	LessonTitle   string    `json:"lesson_title"`
	SubmissionURL string    `json:"submission_url"`
	SubmittedAt   time.Time `json:"submitted_at"`
}

// GetAdminSubmissions fetches all assignment submissions for review
func GetAdminSubmissions(w http.ResponseWriter, r *http.Request) {
	// 1. Double-Lock Security
	userID := r.Context().Value(userIDKey).(string)

	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Fetch submissions using the EXACT column names
	rows, err := db.Pool.Query(r.Context(), `
		SELECT
			sub.id::text,
			COALESCE(cl.full_name, p.full_name, 'Unknown User') AS student_name,
			au.email,
			l.title AS lesson_title,
			sub.content,
			sub.submitted_at
		FROM public.assignment_submissions sub
		JOIN auth.users au ON sub.user_id = au.id
		JOIN public.lessons l ON sub.lesson_id = l.id
		LEFT JOIN public.couples_launchpad cl ON au.email = cl.email
		LEFT JOIN public.participants p ON au.email = p.email
		ORDER BY sub.submitted_at DESC
	`)

	if err != nil {
		fmt.Println("💥 DB QUERY ERROR:", err)
		http.Error(w, "Failed to fetch submissions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var submissions []AdminSubmission
	for rows.Next() {
		var s AdminSubmission
		// Scan directly into the SubmissionURL and SubmittedAt fields of our Go struct
		if err := rows.Scan(&s.ID, &s.StudentName, &s.Email, &s.LessonTitle, &s.SubmissionURL, &s.SubmittedAt); err != nil {
			fmt.Println("💥 DB SCAN ERROR:", err)
			continue
		}
		submissions = append(submissions, s)
	}

	// 3. Return the data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}

// DeleteAdminUser removes a user from either the CLP or RFASM tables based on the provided source
func DeleteAdminUser(w http.ResponseWriter, r *http.Request) {
	// 1. Verify Admin JWT
	userID := r.Context().Value(userIDKey).(string)

	var adminEmail string
	err := db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if err != nil || !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Grab the query parameters sent by React
	targetID := r.URL.Query().Get("id")
	source := r.URL.Query().Get("source")

	if targetID == "" || source == "" {
		http.Error(w, "Missing id or source parameter", http.StatusBadRequest)
		return
	}

	// 3. Determine which table to delete from based on the source
	var query string
	if source == "Ready for a Soulmate" {
		query = "DELETE FROM public.participants WHERE id = $1"
	} else if source == "Couples Launchpad" {
		query = "DELETE FROM public.couples_launchpad WHERE id = $1"
	} else {
		http.Error(w, "Invalid source", http.StatusBadRequest)
		return
	}

	// 4. Execute the deletion
	_, err = db.Pool.Exec(r.Context(), query, targetID)
	if err != nil {
		fmt.Println("💥 DB DELETE ERROR:", err)
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	// 5. Return success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User successfully deleted"})
}

// CreateAdminUser allows manual insertion of users into specific programs
func CreateAdminUser(w http.ResponseWriter, r *http.Request) {
	// 1. Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized Admin Access", http.StatusForbidden)
		return
	}

	// 2. Parse payload
	var req struct {
		Source             string `json:"source"`
		FullName           string `json:"full_name"`
		Email              string `json:"email"`
		WhatsAppNumber     string `json:"whatsapp_number"`
		Gender             string `json:"gender"`
		CountryCity        string `json:"country_city"`
		State              string `json:"state"`
		AgeGroup           string `json:"age_group"`
		Religion           string `json:"religion"`
		ChurchName         string `json:"church_name"`
		InstagramHandle    string `json:"instagram_handle"`
		RelationshipStatus string `json:"relationship_status"`
		WeddingDate        string `json:"wedding_date"`
		PartnerRegistered  string `json:"partner_registered"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Input", http.StatusBadRequest)
		return
	}

	if req.Source == "Ready for a Soulmate" {
		// Assign to first available clan
		var clanID int64
		err := db.Pool.QueryRow(r.Context(), "SELECT id FROM clans WHERE current_count < max_capacity ORDER BY id ASC LIMIT 1").Scan(&clanID)
		if err != nil {
			http.Error(w, "No available clans/cohorts found", http.StatusInternalServerError)
			return
		}

		_, err = db.Pool.Exec(r.Context(), `
			INSERT INTO public.participants (
				full_name, email, whatsapp_number, gender, country, state, 
				age_group, religion, church_name, instagram_handle, relationship_status, clan_id
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			req.FullName, req.Email, req.WhatsAppNumber, req.Gender, req.CountryCity, req.State,
			req.AgeGroup, req.Religion, req.ChurchName, req.InstagramHandle, req.RelationshipStatus, clanID)
		if err != nil {
			fmt.Println("💥 DB INSERT ERROR (Manual Soulmate):", err)
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
		// Update clan count
		db.Pool.Exec(r.Context(), "UPDATE clans SET current_count = current_count + 1 WHERE id = $1", clanID)

	} else if req.Source == "Couples Launchpad" {
		_, err := db.Pool.Exec(r.Context(), `
			INSERT INTO public.couples_launchpad (full_name, email, whatsapp_number, gender, country_city, religion, instagram_handle, wedding_date, partner_registered)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			req.FullName, req.Email, req.WhatsAppNumber, req.Gender, req.CountryCity, req.Religion, req.InstagramHandle, req.WeddingDate, req.PartnerRegistered)
		if err != nil {
			fmt.Println("💥 DB INSERT ERROR (Manual CLP):", err)
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Invalid source program", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User manually registered successfully!"})
}

// --- CURRICULUM MANAGER DATA STRUCTURES ---
type CurriculumModule struct {
	ID          string `json:"id"`
	ProgramName string `json:"program_name"`
	Title       string `json:"title"`
	SortOrder   int    `json:"sort_order"`
}

type CurriculumLesson struct {
	ModuleID           string     `json:"module_id"`
	Title              string     `json:"title"`
	Description        string     `json:"description"`
	VideoID            string     `json:"video_id"`
	EstimatedTime      string     `json:"estimated_time"`
	AssignmentPrompt   string     `json:"assignment_prompt"`
	SortOrder          int        `json:"sort_order"`
	ScheduledStartTime *time.Time `json:"scheduled_start_time"`
}

// GetAdminModules fetches modules for the dropdown in the UI
func GetAdminModules(w http.ResponseWriter, r *http.Request) {
	// Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	rows, err := db.Pool.Query(r.Context(), "SELECT id::text, program_name, title, sort_order FROM public.modules ORDER BY program_name, sort_order ASC")
	if err != nil {
		http.Error(w, "Failed to fetch modules", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var modules []CurriculumModule
	for rows.Next() {
		var m CurriculumModule
		if err := rows.Scan(&m.ID, &m.ProgramName, &m.Title, &m.SortOrder); err == nil {
			modules = append(modules, m)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(modules)
}

// CreateAdminModule injects a new module into the database
func CreateAdminModule(w http.ResponseWriter, r *http.Request) {
	// Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	var m CurriculumModule
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.modules (program_name, title, sort_order)
		VALUES ($1, $2, $3)`,
		m.ProgramName, m.Title, m.SortOrder)

	if err != nil {
		fmt.Println("💥 DB INSERT ERROR (Module):", err)
		http.Error(w, "Failed to create module", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Module created successfully!"})
}

// CreateAdminLesson injects a new lesson into the database
func CreateAdminLesson(w http.ResponseWriter, r *http.Request) {
	// Verify Admin
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	var l CurriculumLesson
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.lessons (module_id, title, description, video_id, estimated_time, assignment_prompt, sort_order, scheduled_start_time)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		l.ModuleID, l.Title, l.Description, l.VideoID, l.EstimatedTime, l.AssignmentPrompt, l.SortOrder, l.ScheduledStartTime)

	if err != nil {
		fmt.Println("💥 DB INSERT ERROR (Lesson):", err)
		http.Error(w, "Failed to create lesson", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Lesson created successfully!"})
}

// GetAdminLessons fetches all lessons across all modules for the admin curriculum view
func GetAdminLessons(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	type AdminLesson struct {
		ID                 string     `json:"id"`
		ModuleID           string     `json:"module_id"`
		ModuleTitle        string     `json:"module_title"`
		ProgramName        string     `json:"program_name"`
		Title              string     `json:"title"`
		Description        string     `json:"description"`
		VideoID            string     `json:"video_id"`
		EstimatedTime      string     `json:"estimated_time"`
		AssignmentPrompt   string     `json:"assignment_prompt"`
		SortOrder          int        `json:"sort_order"`
		ScheduledStartTime *time.Time `json:"scheduled_start_time"`
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT l.id::text, l.module_id::text, m.title, m.program_name,
			   l.title, COALESCE(l.description,''), COALESCE(l.video_id,''),
			   COALESCE(l.estimated_time,''), COALESCE(l.assignment_prompt,''), l.sort_order,
			   l.scheduled_start_time
		FROM public.lessons l
		JOIN public.modules m ON l.module_id = m.id
		ORDER BY m.program_name, m.sort_order, l.sort_order ASC
	`)
	if err != nil {
		http.Error(w, "Failed to fetch lessons", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var lessons []AdminLesson
	for rows.Next() {
		var l AdminLesson
		if err := rows.Scan(&l.ID, &l.ModuleID, &l.ModuleTitle, &l.ProgramName, &l.Title,
			&l.Description, &l.VideoID, &l.EstimatedTime, &l.AssignmentPrompt, &l.SortOrder,
			&l.ScheduledStartTime); err == nil {
			lessons = append(lessons, l)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lessons)
}

// UpdateAdminModule updates a module's title, program, or sort_order
func UpdateAdminModule(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	id := r.URL.Query().Get("id")
	var m CurriculumModule
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil || id == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(),
		"UPDATE public.modules SET program_name=$1, title=$2, sort_order=$3 WHERE id=$4",
		m.ProgramName, m.Title, m.SortOrder, id)
	if err != nil {
		fmt.Println("💥 UPDATE MODULE ERROR:", err)
		http.Error(w, "Failed to update module", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Module updated"})
}

// DeleteAdminModule deletes a module (and cascades to its lessons via FK if set, else fails)
func DeleteAdminModule(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), "DELETE FROM public.modules WHERE id=$1", id)
	if err != nil {
		fmt.Println("💥 DELETE MODULE ERROR:", err)
		http.Error(w, "Failed to delete module", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Module deleted"})
}

// UpdateAdminLesson updates all editable fields on a lesson
func UpdateAdminLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	id := r.URL.Query().Get("id")
	var l CurriculumLesson
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil || id == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		UPDATE public.lessons
		SET module_id=$1, title=$2, description=$3, video_id=$4,
		    estimated_time=$5, assignment_prompt=$6, sort_order=$7,
		    scheduled_start_time=$8
		WHERE id=$9`,
		l.ModuleID, l.Title, l.Description, l.VideoID,
		l.EstimatedTime, l.AssignmentPrompt, l.SortOrder, l.ScheduledStartTime, id)
	if err != nil {
		fmt.Println("💥 UPDATE LESSON ERROR:", err)
		http.Error(w, "Failed to update lesson", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Lesson updated"})
}

// DeleteAdminLesson removes a single lesson
func DeleteAdminLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), "DELETE FROM public.lessons WHERE id=$1", id)
	if err != nil {
		fmt.Println("💥 DELETE LESSON ERROR:", err)
		http.Error(w, "Failed to delete lesson", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Lesson deleted"})
}
func GetProgramSettings(w http.ResponseWriter, r *http.Request) {
	settings := []map[string]interface{}{}
	rows, _ := db.Pool.Query(r.Context(), "SELECT program_name, COALESCE(mid_checkpoint_video_id, ''), COALESCE(intro_video_id, '') FROM public.program_settings")
	defer rows.Close()
	for rows.Next() {
		var pName, checkpointID, introID string
		rows.Scan(&pName, &checkpointID, &introID)
		settings = append(settings, map[string]interface{}{
			"program_name": pName, 
			"mid_checkpoint_video_id": checkpointID,
			"intro_video_id": introID,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func UpdateProgramSettings(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	var adminEmail string
	db.Pool.QueryRow(r.Context(), "SELECT email FROM auth.users WHERE id = $1", userID).Scan(&adminEmail)
	if !isAdminEmail(adminEmail) {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	var req struct {
		ProgramName           string `json:"program_name"`
		MidCheckpointVideoID string `json:"mid_checkpoint_video_id"`
		IntroVideoID         string `json:"intro_video_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO public.program_settings (program_name, mid_checkpoint_video_id, intro_video_id) 
		VALUES ($1, $2, $3) ON CONFLICT (program_name) 
		DO UPDATE SET 
			mid_checkpoint_video_id = EXCLUDED.mid_checkpoint_video_id,
			intro_video_id = EXCLUDED.intro_video_id
	`, req.ProgramName, req.MidCheckpointVideoID, req.IntroVideoID)

	if err != nil {
		fmt.Printf("💥 PROGRAM SETTINGS SAVE ERROR [%s]: %v\n", req.ProgramName, err)
		http.Error(w, "DB SAVE FAILED: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
