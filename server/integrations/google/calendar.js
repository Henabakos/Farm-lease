// ============================================================================
// Google Calendar & Meet adapter
//
// Provides OAuth2 token management and Google Calendar API interactions
// for scheduling meetings and generating Google Meet links.
// ============================================================================
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../shared/errors.js';

const GOOGLE_OAUTH_BASE = 'https://oauth2.googleapis.com';
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const TOKEN_CACHE = { access_token: null, refresh_token: null, expires_at: 0 };

/**
 * Exchange authorization code for access and refresh tokens (OAuth2 callback).
 */
export async function exchangeCodeForTokens(code) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new ExternalServiceError('google', 'Google OAuth credentials not configured');
  }

  const res = await fetch(`${GOOGLE_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'Google token exchange failed');
    throw new ExternalServiceError('google', `token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  TOKEN_CACHE.access_token = data.access_token;
  TOKEN_CACHE.refresh_token = data.refresh_token;
  TOKEN_CACHE.expires_at = Date.now() + (data.expires_in * 1000);

  logger.info('Google OAuth tokens exchanged and cached');
  return data;
}

/**
 * Refresh access token using the stored refresh token.
 */
async function refreshAccessToken() {
  if (!TOKEN_CACHE.refresh_token) {
    throw new ExternalServiceError('google', 'No refresh token available');
  }

  const res = await fetch(`${GOOGLE_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: TOKEN_CACHE.refresh_token,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'Google token refresh failed');
    throw new ExternalServiceError('google', `token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  TOKEN_CACHE.access_token = data.access_token;
  TOKEN_CACHE.expires_at = Date.now() + (data.expires_in * 1000);

  logger.info('Google access token refreshed');
  return data.access_token;
}

/**
 * Get a valid access token, refreshing if necessary.
 */
async function getAccessToken() {
  const now = Date.now();
  if (TOKEN_CACHE.access_token && TOKEN_CACHE.expires_at > now + 60000) {
    return TOKEN_CACHE.access_token;
  }

  if (TOKEN_CACHE.refresh_token) {
    return refreshAccessToken();
  }

  throw new ExternalServiceError('google', 'No valid access token and no refresh token');
}

/**
 * Set tokens from a stored user configuration (e.g., from database).
 */
export function setTokens({ access_token, refresh_token, expires_in }) {
  TOKEN_CACHE.access_token = access_token;
  TOKEN_CACHE.refresh_token = refresh_token;
  TOKEN_CACHE.expires_at = Date.now() + (expires_in * 1000);
}

/**
 * Make an authenticated request to the Google Calendar API.
 */
async function request(endpoint, options = {}) {
  const token = await getAccessToken();
  const url = `${GOOGLE_CALENDAR_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Token expired, try refresh once
    await refreshAccessToken();
    const retryRes = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${TOKEN_CACHE.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!retryRes.ok) {
      const text = await retryRes.text();
      throw new ExternalServiceError('google', `API request failed after refresh: ${retryRes.status} ${text}`);
    }
    return retryRes.json();
  }

  if (!res.ok) {
    const text = await res.text();
    logger.error({ endpoint, status: res.status, body: text }, 'Google Calendar API request failed');
    throw new ExternalServiceError('google', `API request failed: ${res.status} ${text}`);
  }

  return res.json();
}

// --- Calendar Event Management ------------------------------------------------

/**
 * Create a calendar event with optional Google Meet conference.
 */
export async function createEvent({
  summary,
  description,
  startTime,
  endTime,
  attendees = [],
  location,
  createMeet = true,
}) {
  const event = {
    summary: summary || 'Farm Lease Meeting',
    description: description || '',
    start: {
      dateTime: new Date(startTime).toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
      timeZone: 'UTC',
    },
    attendees: attendees.map(email => ({ email })),
    location: location || '',
    conferenceData: createMeet ? {
      createRequest: {
        requestId: `${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    } : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  return request('/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/**
 * Get an event by ID.
 */
export async function getEvent(eventId) {
  return request(`/calendars/primary/events/${eventId}`);
}

/**
 * Update an existing event.
 */
export async function updateEvent(eventId, updates) {
  return request(`/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete (cancel) an event.
 */
export async function deleteEvent(eventId) {
  await request(`/calendars/primary/events/${eventId}`, { method: 'DELETE' });
  return { success: true };
}

/**
 * List events in a time range.
 */
export async function listEvents({ timeMin, timeMax, maxResults = 50 } = {}) {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  if (timeMin) params.append('timeMin', new Date(timeMin).toISOString());
  if (timeMax) params.append('timeMax', new Date(timeMax).toISOString());

  return request(`/calendars/primary/events?${params.toString()}`);
}

/**
 * Get the Google Meet link from an event.
 */
export function extractMeetLink(event) {
  return event?.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || null;
}

// --- OAuth Authorization URL --------------------------------------------------

/**
 * Generate the OAuth authorization URL for user consent.
 */
export function getAuthorizationUrl(state = null) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) params.append('state', state);

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// --- Health Check ------------------------------------------------------------

export async function healthCheck() {
  try {
    await getAccessToken();
    return { status: 'ok', provider: 'google-calendar' };
  } catch (err) {
    return { status: 'error', provider: 'google-calendar', error: err.message };
  }
}
