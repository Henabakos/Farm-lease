// ============================================================================
// Zoom Server-to-Server OAuth adapter
//
// Provides token management and basic Zoom API interactions using the
// Server-to-Server OAuth flow (account-level access without user consent).
// ============================================================================
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../shared/errors.js';

const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const TOKEN_CACHE = { access_token: null, expires_at: 0 };

/**
 * Exchange server credentials for an access token using Server-to-Server OAuth.
 * Tokens are cached in-memory and refreshed automatically when expired.
 */
async function getAccessToken() {
  const now = Date.now();
  if (TOKEN_CACHE.access_token && TOKEN_CACHE.expires_at > now + 60000) {
    return TOKEN_CACHE.access_token;
  }

  if (!env.ZOOM_ACCOUNT_ID || !env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    throw new ExternalServiceError('zoom', 'Zoom credentials not configured');
  }

  const auth = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');

  const res = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=account_credentials&account_id=' + encodeURIComponent(env.ZOOM_ACCOUNT_ID),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'Zoom token fetch failed');
    throw new ExternalServiceError('zoom', `token fetch failed: ${res.status}`);
  }

  const data = await res.json();
  TOKEN_CACHE.access_token = data.access_token;
  TOKEN_CACHE.expires_at = now + (data.expires_in * 1000);

  logger.info({ expires_in: data.expires_in }, 'Zoom access token refreshed');
  return data.access_token;
}

/**
 * Make an authenticated request to the Zoom API.
 */
async function request(endpoint, options = {}) {
  const token = await getAccessToken();
  const url = `${ZOOM_API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ endpoint, status: res.status, body: text }, 'Zoom API request failed');
    throw new ExternalServiceError('zoom', `API request failed: ${res.status} ${text}`);
  }

  return res.json();
}

// --- Meeting Management ------------------------------------------------------

/**
 * Create a Zoom meeting for a given topic and time.
 */
export async function createMeeting({ topic, startTime, durationMinutes = 60, agenda }) {
  const payload = {
    topic: topic || 'Farm Lease Meeting',
    type: startTime ? 2 : 1, // 2 = scheduled, 1 = instant
    start_time: startTime,
    duration: durationMinutes,
    agenda: agenda || '',
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: false,
      watermark: false,
      use_pmi: false,
      approval_type: 2, // No approval required
      audio: 'both',
      auto_recording: 'none',
    },
  };

  return request('/users/me/meetings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get meeting details by ID.
 */
export async function getMeeting(meetingId) {
  return request(`/meetings/${meetingId}`);
}

/**
 * Update an existing meeting.
 */
export async function updateMeeting(meetingId, updates) {
  return request(`/meetings/${meetingId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete (cancel) a meeting.
 */
export async function deleteMeeting(meetingId) {
  await request(`/meetings/${meetingId}`, { method: 'DELETE' });
  return { success: true };
}

/**
 * List meetings for the authenticated user.
 */
export async function listMeetings({ type = 'scheduled', page_size = 30 } = {}) {
  return request(`/users/me/meetings?type=${type}&page_size=${page_size}`);
}

// --- Meeting Participants ----------------------------------------------------

/**
 * Get participants for a past meeting (requires meeting UUID).
 */
export async function getMeetingParticipants(meetingId) {
  return request(`/past_meetings/${meetingId}/participants`);
}

// --- Webhook Verification ----------------------------------------------------

/**
 * Verify that a webhook event came from Zoom using the verification token.
 */
export function verifyWebhookEvent(event, signature) {
  if (!env.ZOOM_WEBHOOK_SECRET) {
    logger.warn('ZOOM_WEBHOOK_SECRET not configured, skipping verification');
    return true;
  }

  // Zoom sends a plain token in the event payload; we compare it to our secret
  // In production, implement proper HMAC-SHA256 verification
  const receivedToken = event?.plainToken;
  if (receivedToken && receivedToken === env.ZOOM_WEBHOOK_SECRET) {
    return true;
  }

  logger.warn({ event }, 'Webhook verification failed');
  return false;
}

// --- Health Check ------------------------------------------------------------

export async function healthCheck() {
  try {
    await getAccessToken();
    return { status: 'ok', provider: 'zoom' };
  } catch (err) {
    return { status: 'error', provider: 'zoom', error: err.message };
  }
}
