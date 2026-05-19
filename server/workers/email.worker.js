// Email worker. Consumes jobs from either the `email` queue directly OR
// from outbox-dispatched events whose names match `email.*` (see the
// dispatcher's routing rules).
//
// Job payload shapes (one per supported event):
//   email.verification.send    { to, userId, verifyUrl }
//   email.password_reset.send  { to, userId, resetUrl }
//   email.generic              { to, subject, html, text }
import { send, renderVerification, renderPasswordReset } from '../integrations/mailer/mailer.js';
import { logger } from '../utils/logger.js';

export async function processEmail(job) {
  const eventType = job.data?.eventType ?? job.name;
  const payload = job.data?.payload ?? job.data ?? {};

  switch (eventType) {
    case 'email.verification.send': {
      const rendered = renderVerification({ verifyUrl: payload.verifyUrl, fullName: payload.fullName });
      await send({ to: payload.to, ...rendered });
      return { ok: true };
    }
    case 'email.password_reset.send': {
      const rendered = renderPasswordReset({ resetUrl: payload.resetUrl });
      await send({ to: payload.to, ...rendered });
      return { ok: true };
    }
    case 'email.generic':
    case 'send': {
      const { to, subject, html, text } = payload;
      if (!to || !subject) throw new Error('email payload missing to/subject');
      await send({ to, subject, html, text });
      return { ok: true };
    }
    default:
      logger.warn({ eventType }, 'email worker received unknown event type');
      return { skipped: true };
  }
}
