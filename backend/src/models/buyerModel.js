const { query } = require('../config/db');

const BUYER_BASE_SELECT = `
  SELECT b.*, u.full_name, u.email, u.phone, u.profile_photo
  FROM buyers b JOIN users u ON u.id = b.user_id
`;

async function create({ userId, businessName, address, gpsLat, gpsLng }) {
  const result = await query(
    `INSERT INTO buyers (user_id, business_name, address, gps_lat, gps_lng) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, businessName, address, gpsLat, gpsLng]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query(`${BUYER_BASE_SELECT} WHERE b.id = $1`, [id]);
  return result.rows[0] || null;
}

async function findByUserId(userId) {
  const result = await query(`${BUYER_BASE_SELECT} WHERE b.user_id = $1`, [userId]);
  return result.rows[0] || null;
}

async function list({ search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (search) {
    conditions.push(`(b.business_name ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `${BUYER_BASE_SELECT} ${where} ORDER BY b.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM buyers b JOIN users u ON u.id = b.user_id ${where}`, params);
  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function update(id, { businessName, address, gpsLat, gpsLng }) {
  const result = await query(
    `UPDATE buyers SET
       business_name = COALESCE($1, business_name),
       address = COALESCE($2, address),
       gps_lat = COALESCE($3, gps_lat),
       gps_lng = COALESCE($4, gps_lng)
     WHERE id = $5 RETURNING *`,
    [businessName, address, gpsLat, gpsLng, id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findById, findByUserId, list, update };
