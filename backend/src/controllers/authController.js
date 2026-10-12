const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../utils/activityLogger');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false, // LAN-only HTTP deployment; set true only if served over HTTPS
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  await logActivity({ action: 'user_registered', entityType: 'user', entityId: user.id, ipAddress: req.ip });

  res.status(201).json({
    success: true,
    message: user.requiresApproval
      ? 'Registration successful. Your account is pending admin approval.'
      : 'Registration successful. You can now log in.',
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  await logActivity({ userId: user.id, action: 'user_login', entityType: 'user', entityId: user.id, ipAddress: req.ip });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { accessToken, user },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken } = await authService.refreshAccessToken(token);
  res.status(200).json({ success: true, data: { accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  await authService.logout(token);
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, password reset instructions have been generated.',
    // Exposed only because this is a LAN deployment with no outbound email service.
    // In production behind email delivery, remove this field.
    ...(resetToken ? { devResetToken: resetToken } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Password has been reset. You can now log in.' });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, me };
