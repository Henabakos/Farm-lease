// Zod input schemas for the auth endpoints. Strict parsing; unknown keys
// are stripped silently (Zod default). Refinements that depend on business
// state (e.g. "email not already taken") live in the service, not here.
import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(255);
// 8-128 chars, at least one letter and one digit. Stricter rules can be
// layered on later; this baseline already blocks the most common weak picks.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: 'Password must contain letters and digits',
  });

export const registerSchema = z.object({
  email,
  password,
  // Accept fullName (canonical) and full_name (legacy frontend payload).
  fullName: z.string().trim().min(2).max(120).optional(),
  full_name: z.string().trim().min(2).max(120).optional(),
  role: z.string().min(1), // normalized + validated against enum in service
}).refine((v) => v.fullName || v.full_name, {
  message: 'fullName is required',
  path: ['fullName'],
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(20),
});

export const requestPasswordResetSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});
