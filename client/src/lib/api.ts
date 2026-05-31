import { supabase, API_BASE_URL } from '../config';

// ─── Centralized Session Cache ─────────────────────────────────────────────────
// Instead of every component calling supabase.auth.getSession() independently
// (each of which can trigger a network round-trip to Supabase's auth API),
// we cache the session in memory for up to 4 minutes. This significantly
// reduces egress to Supabase. The cache is cleared if the token is near expiry.

let _cachedSession: any = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes

export async function getAuthSession() {
  const now = Date.now();

  // Return cached session if still fresh AND the underlying JWT isn't about to expire
  if (_cachedSession && now < _cacheExpiry) {
    const tokenExpiry = (_cachedSession.expires_at ?? 0) * 1000;
    if (tokenExpiry - now > 60_000) { // still >60s until JWT expires
      return _cachedSession;
    }
  }

  // Otherwise, fetch fresh from Supabase (reads localStorage first, only hits
  // the network if the token is actually expired and needs a refresh)
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;

  _cachedSession = session;
  _cacheExpiry = now + CACHE_TTL_MS;
  return session;
}

// Call this on logout so stale tokens are never reused
export function clearSessionCache() {
  _cachedSession = null;
  _cacheExpiry = 0;
}

// ─── API Helpers ───────────────────────────────────────────────────────────────

const _requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>();
const REQUEST_CACHE_TTL = 2000; // 2 seconds TTL to prevent double-fetches on component mount

export async function fetchLMS(endpoint: string) {
  const now = Date.now();
  const cached = _requestCache.get(endpoint);

  if (cached && (now - cached.timestamp < REQUEST_CACHE_TTL)) {
    return cached.promise;
  }

  const session = await getAuthSession();

  if (!session) {
    throw new Error('No active session found. Please log in.');
  }

  const promise = fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Backend rejected the request: ${response.statusText}`);
    }
    return response.json();
  }).catch(err => {
    _requestCache.delete(endpoint);
    throw err;
  });

  _requestCache.set(endpoint, { promise, timestamp: now });
  return promise;
}

export async function postLMS(endpoint: string, body: any) {
  // Clear cache on any mutation to ensure subsequent GETs are fresh
  _requestCache.clear();

  const session = await getAuthSession();

  if (!session) {
    throw new Error('No active session found. Please log in.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend rejected the request: ${errorText}`);
  }

  // Some endpoints (e.g. PostLessonComment) return 201 with no body.
  // Trying to parse an empty body as JSON throws a SyntaxError, so
  // we check content-length / content-type before calling .json().
  const contentType = response.headers.get('Content-Type') || '';
  const contentLength = response.headers.get('Content-Length');
  const hasBody = contentType.includes('application/json') ||
                  (contentLength !== null && contentLength !== '0');

  return hasBody ? response.json() : null;
}