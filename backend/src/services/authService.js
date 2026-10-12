const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const userModel = require('../models/userModel');
const { query, getClient } = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

// Roles that require admin approval before they can log in.
const ROLES_REQUIRING_APPROVAL = [
  'collection_center',
  'warehouse_manager',
  'transporter',
  'retailer',
];

async function register({ fullName, email, phone, password, role }) {
  const existing = await userModel.findByEmail(email);

  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const roleId = await userModel.findRoleIdByName(role);

  if (!roleId) {
    throw ApiError.badRequest('Invalid role specified');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);

  const autoApprove =
    role === 'customer' ||
    role === 'farmer' ||
    !ROLES_REQUIRING_APPROVAL.includes(role);

  /*
   * Farmer registration needs two related records:
   *
   * 1. users
   * 2. farmers
   *
   * We use one database transaction so that either both records
   * are created or neither record is created.
   */
  if (role === 'farmer') {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users
          (role_id, full_name, email, phone, password_hash, is_approved)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, email, phone, is_approved, is_active, created_at`,
        [
          roleId,
          fullName,
          email,
          phone,
          passwordHash,
          autoApprove,
        ]
      );

      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO farmers (user_id)
         VALUES ($1)`,
        [user.id]
      );

      await client.query('COMMIT');

      return {
        ...user,
        role,
        requiresApproval: false,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /*
   * Normal registration for non-farmer roles.
   */
  const user = await userModel.create({
    fullName,
    email,
    phone,
    passwordHash,
    roleId,
    autoApprove,
  });

  return {
    ...user,
    role,
    requiresApproval: !autoApprove,
  };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw ApiError.forbidden(
      'Your account has been deactivated. Contact an administrator.'
    );
  }

  if (!user.is_approved) {
    throw ApiError.forbidden(
      'Your account is pending admin approval.'
    );
  }

  const tokenPayload = {
    sub: user.id,
    role: user.role,
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await query(
    `INSERT INTO refresh_tokens
      (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [
      uuidv4(),
      user.id,
      refreshToken,
      expiresAt,
    ]
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profile_photo,
    },
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token missing');
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized(
      'Invalid or expired refresh token'
    );
  }

  const result = await query(
    `SELECT *
     FROM refresh_tokens
     WHERE token = $1
       AND user_id = $2
       AND expires_at > NOW()`,
    [
      refreshToken,
      decoded.sub,
    ]
  );

  if (!result.rows[0]) {
    throw ApiError.unauthorized(
      'Refresh token not recognized or expired'
    );
  }

  const accessToken = signAccessToken({
    sub: decoded.sub,
    role: decoded.role,
  });

  return {
    accessToken,
  };
}

async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }

  await query(
    `DELETE FROM refresh_tokens
     WHERE token = $1`,
    [refreshToken]
  );
}

async function forgotPassword(email) {
  const user = await userModel.findByEmail(email);

  // Always respond successfully even if the user isn't found,
  // to avoid leaking which emails are registered.
  if (!user) {
    return {
      resetToken: null,
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  const expiresAt = new Date(
    Date.now() + 30 * 60 * 1000
  );

  await userModel.setResetToken(
    user.id,
    resetToken,
    expiresAt
  );

  // LAN-only deployment: reset token is returned for development/internal use.
  return {
    resetToken,
  };
}

async function resetPassword(token, newPassword) {
  const user = await userModel.findByResetToken(token);

  if (!user) {
    throw ApiError.badRequest(
      'Invalid or expired reset token'
    );
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    env.bcryptSaltRounds
  );

  await userModel.updatePassword(
    user.id,
    passwordHash
  );

  await userModel.clearResetToken(user.id);
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
};