const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

/**
 * Verifies the JWT access token sent in the Authorization header
 * (format: "Bearer <token>") and attaches the decoded user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed authorization header');
    }

    const decoded = verifyAccessToken(token);

    // Confirm the user still exists and is active/approved on every request.
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.is_active, u.is_approved, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [decoded.sub]
    );

    const user = result.rows[0];
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.is_active) throw ApiError.forbidden('Account has been deactivated');
    if (!user.is_approved) throw ApiError.forbidden('Account is pending admin approval');

    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(err);
  }
};

/**
 * Restricts a route to one or more roles.
 * Usage: authorize('admin', 'warehouse_manager')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };
