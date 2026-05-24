// HTTP transport adapter — extracts inputs from the request, delegates to
// the service, and writes the response. No business logic lives here.
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as service from './auth.service.js';

function reqContext(req) {
  return {
    userAgent: req.get('user-agent') ?? null,
    ipAddress: req.ip,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const fullName = req.body.fullName ?? req.body.full_name;
  const result = await service.register({ email, password, fullName, role }, reqContext(req));
  res.status(201).json({
    message: result.requiresApproval
      ? 'Registration successful. An admin will review your account shortly.'
      : 'Registration successful. Please verify your email.',
    user: result.user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body, reqContext(req));
  res.json(result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await service.refresh({ refreshToken: req.body.refresh_token }, reqContext(req));
  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  // Refresh token is optional — frontend may not always send it, but if it
  // does we use it to revoke the session server-side.
  await service.logout({ refreshToken: req.body?.refresh_token });
  res.json({ message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await service.getMe(req.user.id);
  res.json(user);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await service.verifyEmail({ token: req.body.token });
  res.json(result);
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const result = await service.requestPasswordReset({ email: req.body.email });
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await service.resetPassword(req.body);
  res.json(result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await service.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  res.json(result);
});
