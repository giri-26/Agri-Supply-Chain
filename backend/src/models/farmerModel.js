const { query, getClient } = require('../config/db');

const FARMER_BASE_SELECT = `
  SELECT f.id, f.user_id, f.id_proof, f.bank_details, f.created_at,
         u.full_name, u.email, u.phone, u.profile_photo, u.is_active, u.is_approved
  FROM farmers f
  JOIN users u ON u.id = f.user_id
`;

async function createFarmerWithUser({ fullName, email, phone, passwordHash, roleId }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (role_id, full_name, email, phone, password_hash, is_approved)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, full_name, email, phone`,
      [roleId, fullName, email, phone, passwordHash]
    );
    const user = userResult.rows[0];

    const farmerResult = await client.query(
      `INSERT INTO farmers (user_id) VALUES ($1) RETURNING *`,
      [user.id]
    );

    await client.query('COMMIT');
    return { ...farmerResult.rows[0], full_name: user.full_name, email: user.email, phone: user.phone };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findFarmerByUserId(userId) {
  const result = await query(`${FARMER_BASE_SELECT} WHERE f.user_id = $1`, [userId]);
  return result.rows[0] || null;
}

async function findFarmerById(id) {
  const result = await query(`${FARMER_BASE_SELECT} WHERE f.id = $1`, [id]);
  return result.rows[0] || null;
}

async function listFarmers({ search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `${FARMER_BASE_SELECT} ${where} ORDER BY f.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM farmers f JOIN users u ON u.id = f.user_id ${where}`,
    params
  );

  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function updateFarmer(id, { fullName, phone, idProof, bankDetails }) {
  const farmer = await findFarmerById(id);
  if (!farmer) return null;

  await query(`UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE id = $3`, [
    fullName,
    phone,
    farmer.user_id,
  ]);
  const result = await query(
    `UPDATE farmers SET id_proof = COALESCE($1, id_proof), bank_details = COALESCE($2, bank_details)
     WHERE id = $3 RETURNING *`,
    [idProof, bankDetails, id]
  );
  return { ...result.rows[0] };
}

async function deleteFarmer(id) {
  const farmer = await findFarmerById(id);
  if (!farmer) return null;
  // Deleting the user cascades to the farmers row (FK ON DELETE CASCADE)
  await query(`DELETE FROM users WHERE id = $1`, [farmer.user_id]);
  return farmer;
}

async function setProfilePhoto(userId, filePath) {
  await query(`UPDATE users SET profile_photo = $1 WHERE id = $2`, [filePath, userId]);
}

// ---- Farms ----

async function createFarm(farmerId, farm) {
  const result = await query(
    `INSERT INTO farms (farmer_id, farm_name, address, gps_lat, gps_lng, soil_type, size_acres, is_organic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [farmerId, farm.farmName, farm.address, farm.gpsLat, farm.gpsLng, farm.soilType, farm.sizeAcres, !!farm.isOrganic]
  );
  return result.rows[0];
}

async function listFarmsByFarmer(farmerId) {
  const result = await query(`SELECT * FROM farms WHERE farmer_id = $1 ORDER BY created_at DESC`, [farmerId]);
  return result.rows;
}

async function findFarmById(farmId) {
  const result = await query(`SELECT * FROM farms WHERE id = $1`, [farmId]);
  return result.rows[0] || null;
}

async function updateFarm(farmId, farm) {
  const result = await query(
    `UPDATE farms SET
       farm_name = COALESCE($1, farm_name),
       address = COALESCE($2, address),
       gps_lat = COALESCE($3, gps_lat),
       gps_lng = COALESCE($4, gps_lng),
       soil_type = COALESCE($5, soil_type),
       size_acres = COALESCE($6, size_acres),
       is_organic = COALESCE($7, is_organic)
     WHERE id = $8 RETURNING *`,
    [farm.farmName, farm.address, farm.gpsLat, farm.gpsLng, farm.soilType, farm.sizeAcres, farm.isOrganic, farmId]
  );
  return result.rows[0] || null;
}

async function deleteFarm(farmId) {
  const result = await query(`DELETE FROM farms WHERE id = $1 RETURNING id`, [farmId]);
  return result.rows[0] || null;
}

module.exports = {
  createFarmerWithUser,
  findFarmerByUserId,
  findFarmerById,
  listFarmers,
  updateFarmer,
  deleteFarmer,
  setProfilePhoto,
  createFarm,
  listFarmsByFarmer,
  findFarmById,
  updateFarm,
  deleteFarm,
};
