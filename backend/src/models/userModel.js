const { query } = require('../config/db');

const BASE_SELECT = `
  SELECT u.id, u.full_name, u.email, u.phone, u.profile_photo,
         u.is_approved, u.is_active, u.created_at, r.name AS role, r.id AS role_id
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

async function findByEmail(email) {
  const result = await query(
    `SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findByIdWithPassword(id) {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(`${BASE_SELECT} WHERE u.id = $1`, [id]);
  return result.rows[0] || null;
}

async function findRoleIdByName(roleName) {
  const result = await query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
  return result.rows[0]?.id || null;
}

async function create({ fullName, email, phone, passwordHash, roleId, autoApprove = false }) {
  const result = await query(
    `INSERT INTO users (role_id, full_name, email, phone, password_hash, is_approved)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, full_name, email, phone, is_approved, is_active, created_at`,
    [roleId, fullName, email, phone, passwordHash, autoApprove]
  );
  return result.rows[0];
}

async function updateProfileFields(userId, { fullName, phone }) {
  const result = await query(
    `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE id = $3
     RETURNING id, full_name, email, phone, profile_photo`,
    [fullName, phone, userId]
  );
  return result.rows[0] || null;
}

async function updateProfilePhoto(userId, filePath) {
  const result = await query(`UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, profile_photo`, [
    filePath,
    userId,
  ]);
  return result.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
}

async function setResetToken(userId, token, expiresAt) {
  await query(`UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`, [
    token,
    expiresAt,
    userId,
  ]);
}

async function findByResetToken(token) {
  const result = await query(
    `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
    [token]
  );
  return result.rows[0] || null;
}

async function clearResetToken(userId) {
  await query(`UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1`, [
    userId,
  ]);
}

async function setApproval(userId, isApproved) {
  const result = await query(
    `UPDATE users SET is_approved = $1 WHERE id = $2 RETURNING id, full_name, email, is_approved`,
    [isApproved, userId]
  );
  return result.rows[0];
}

async function setActive(userId, isActive) {
  const result = await query(
    `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, email, is_active`,
    [isActive, userId]
  );
  return result.rows[0];
}

async function listAll({ role, search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (role) {
    conditions.push(`r.name = $${idx++}`);
    params.push(role);
  }
  if (search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `${BASE_SELECT} ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
    params
  );

  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

module.exports = {
  findByEmail,
  findById,
  findByIdWithPassword,
  findRoleIdByName,
  create,
  updateProfileFields,
  updateProfilePhoto,
  updatePassword,
  setResetToken,
  findByResetToken,
  clearResetToken,
  setApproval,
  setActive,
  listAll,
};
