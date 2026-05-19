// Mailer adapter. SMTP (incl. Mailhog in dev) is the default; switch to
// Resend by setting MAIL_DRIVER=resend.
//
// Templates are intentionally plain JS strings here. For production-grade
// templating, swap to MJML compiled at build time or to a templating engine
// behind this interface — the call sites won't change.
import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../shared/errors.js';

let transport = null;
function smtpTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST ?? 'localhost',
      port: env.SMTP_PORT ?? 1025,
      secure: false,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

async function sendViaSmtp({ to, subject, html, text }) {
  await smtpTransport().sendMail({ from: env.MAIL_FROM, to, subject, html, text });
}

async function sendViaResend({ to, subject, html, text }) {
  if (!env.RESEND_API_KEY) throw new ExternalServiceError('resend', 'RESEND_API_KEY not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ExternalServiceError('resend', `send failed: ${res.status} ${body}`);
  }
}

export async function send(payload) {
  try {
    if (env.MAIL_DRIVER === 'resend') return await sendViaResend(payload);
    return await sendViaSmtp(payload);
  } catch (err) {
    logger.error({ err, to: payload.to }, 'email send failed');
    throw err;
  }
}

// --- Templates ---------------------------------------------------------------
export function renderVerification({ verifyUrl, fullName }) {
  return {
    subject: 'Verify your Farm Lease account',
    html: `<p>Hi ${escape(fullName ?? '')},</p>
      <p>Please verify your email by clicking the link below.</p>
      <p><a href="${escape(verifyUrl)}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>`,
    text: `Verify your email: ${verifyUrl}`,
  };
}

export function renderPasswordReset({ resetUrl }) {
  return {
    subject: 'Reset your Farm Lease password',
    html: `<p>We received a request to reset your password.</p>
      <p><a href="${escape(resetUrl)}">Reset your password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>`,
    text: `Reset your password: ${resetUrl}`,
  };
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[m]);
}
