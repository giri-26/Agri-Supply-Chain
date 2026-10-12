const { query, getClient } = require('../config/db');

async function create({ userId, centerName, address, gpsLat, gpsLng, capacityKg, contactPhone, contactEmail }) {
  const result = await query(
    `INSERT INTO collection_centers (user_id, center_name, address, gps_lat, gps_lng, capacity_kg, contact_phone, contact_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, centerName, address, gpsLat, gpsLng, capacityKg, contactPhone, contactEmail]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query(`SELECT * FROM collection_centers WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findByUserId(userId) {
  const result = await query(`SELECT * FROM collection_centers WHERE user_id = $1`, [userId]);
  return result.rows[0] || null;
}

async function list({ search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (search) {
    conditions.push(`(center_name ILIKE $${idx} OR address ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT * FROM collection_centers ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM collection_centers ${where}`, params);
  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function update(id, fields) {
  const result = await query(
    `UPDATE collection_centers SET
       center_name = COALESCE($1, center_name),
       address = COALESCE($2, address),
       gps_lat = COALESCE($3, gps_lat),
       gps_lng = COALESCE($4, gps_lng),
       capacity_kg = COALESCE($5, capacity_kg),
       contact_phone = COALESCE($6, contact_phone),
       contact_email = COALESCE($7, contact_email)
     WHERE id = $8 RETURNING *`,
    [fields.centerName, fields.address, fields.gpsLat, fields.gpsLng, fields.capacityKg, fields.contactPhone, fields.contactEmail, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await query(`DELETE FROM collection_centers WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0] || null;
}

// ---- Farmer assignment ----
async function assignFarmer(centerId, farmerId) {
  const result = await query(
    `INSERT INTO center_farmer_assignments (collection_center_id, farmer_id)
     VALUES ($1, $2) ON CONFLICT (collection_center_id, farmer_id) DO NOTHING RETURNING *`,
    [centerId, farmerId]
  );
  return result.rows[0] || null;
}

async function unassignFarmer(centerId, farmerId) {
  const result = await query(
    `DELETE FROM center_farmer_assignments WHERE collection_center_id = $1 AND farmer_id = $2 RETURNING id`,
    [centerId, farmerId]
  );
  return result.rows[0] || null;
}

async function listAssignedFarmers(centerId) {
  const result = await query(
    `SELECT fm.id, u.full_name, u.email, u.phone, cfa.assigned_at
     FROM center_farmer_assignments cfa
     JOIN farmers fm ON fm.id = cfa.farmer_id
     JOIN users u ON u.id = fm.user_id
     WHERE cfa.collection_center_id = $1
     ORDER BY cfa.assigned_at DESC`,
    [centerId]
  );
  return result.rows;
}

// ---- Collection records (accept/reject) ----
async function createRecord({ productId, collectionCenterId, decision, qualityNotes, verifiedWeight, rejectionReason }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const recordResult = await client.query(
      `INSERT INTO collection_records (product_id, collection_center_id, decision, quality_notes, verified_weight, rejection_reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [productId, collectionCenterId, decision, qualityNotes, verifiedWeight, rejectionReason]
    );

    if (decision === 'accepted') {
      await client.query(`UPDATE products SET status = 'collected', actual_quantity = COALESCE($1, actual_quantity) WHERE id = $2`, [
        verifiedWeight,
        productId,
      ]);
    }

    const centerResult = await client.query(`SELECT address FROM collection_centers WHERE id = $1`, [collectionCenterId]);

    await client.query(
      `INSERT INTO tracking_history (product_id, stage, status, location, notes)
       VALUES ($1, 'collection_center', $2, $3, $4)`,
      [productId, decision, centerResult.rows[0]?.address || null, qualityNotes || rejectionReason || null]
    );

    await client.query('COMMIT');
    return recordResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listRecords({ collectionCenterId, decision, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (collectionCenterId) {
    conditions.push(`cr.collection_center_id = $${idx++}`);
    params.push(collectionCenterId);
  }
  if (decision) {
    conditions.push(`cr.decision = $${idx++}`);
    params.push(decision);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT cr.*, p.crop_name, p.tracking_id
     FROM collection_records cr JOIN products p ON p.id = cr.product_id
     ${where} ORDER BY cr.received_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM collection_records cr ${where}`,
    params
  );
  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

module.exports = {
  create,
  findById,
  findByUserId,
  list,
  update,
  remove,
  assignFarmer,
  unassignFarmer,
  listAssignedFarmers,
  createRecord,
  listRecords,
};
