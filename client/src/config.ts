import { createClient } from '@supabase/supabase-js';

// Existing API URL for your Go Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// NEW: Initialize Supabase Client for Frontend Auth
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);