const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { logActivity } = require('../utils/activityLogger');

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userModel.updateProfileFields(req.user.id, req.body);
  await logActivity({ userId: req.user.id, action: 'profile_updated', entityType: 'user', entityId: req.user.id });
  res.status(200).json({ success: true, message: 'Profile updated', data: user });
});

const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');
  const relativePath = `/uploads/profiles/${req.file.filename}`;
  const user = await userModel.updateProfilePhoto(req.user.id, relativePath);
  res.status(200).json({ success: true, message: 'Profile photo updated', data: user });
});

// Distinct from the forgot/reset-password flow: this is for an already-authenticated
// user changing their password from their profile page, verifying their current one first.
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await userModel.findByIdWithPassword(req.user.id);
  if (!user) throw ApiError.notFound('User not found');

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) throw ApiError.unauthorized('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
  await userModel.updatePassword(req.user.id, passwordHash);
  await logActivity({ userId: req.user.id, action: 'password_changed', entityType: 'user', entityId: req.user.id });

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

module.exports = { updateProfile, uploadPhoto, changePassword };
