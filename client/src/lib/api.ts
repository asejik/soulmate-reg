import { supabase } from '../config'; // Adjust this import path if your supabase client is located elsewhere

// Use the local Go server in development, and a live URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export async function fetchLMS(endpoint: string) {
  // 1. Get the current logged-in user's session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('No active session found. Please log in.');
  }

  // 2. Make the request to the Go backend with the secure token
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}` // This is what LMSAuth intercepts!
    }
  });

  if (!response.ok) {
    throw new Error(`Backend rejected the request: ${response.statusText}`);
  }

  // 3. Return the JSON data
  return response.json();
}