const { query, getClient } = require('../config/db');

async function findByUserId(userId) {
  const result = await query(
    `SELECT r.*, u.full_name, u.email, u.phone FROM retailers r JOIN users u ON u.id = r.user_id WHERE r.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `SELECT r.*, u.full_name, u.email, u.phone FROM retailers r JOIN users u ON u.id = r.user_id WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function create({ userId, storeName, address, gpsLat, gpsLng }) {
  const result = await query(
    `INSERT INTO retailers (user_id, store_name, address, gps_lat, gps_lng) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, storeName, address, gpsLat, gpsLng]
  );
  return result.rows[0];
}

async function update(id, { storeName, address, gpsLat, gpsLng }) {
  const result = await query(
    `UPDATE retailers SET
       store_name = COALESCE($1, store_name),
       address = COALESCE($2, address),
       gps_lat = COALESCE($3, gps_lat),
       gps_lng = COALESCE($4, gps_lng)
     WHERE id = $5 RETURNING *`,
    [storeName, address, gpsLat, gpsLng, id]
  );
  return result.rows[0] || null;
}

// Receiving a shipment = mark it delivered + add to retailer_stock in one transaction
async function receiveShipment({ retailerId, shipmentId, productId, quantity }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE shipments SET status = 'delivered', delivered_at = NOW() WHERE id = $1`,
      [shipmentId]
    );

    const stockResult = await client.query(
      `INSERT INTO retailer_stock (retailer_id, product_id, shipment_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *`,
      [retailerId, productId, shipmentId, quantity]
    );

    await client.query(`UPDATE products SET status = 'at_retailer' WHERE id = $1`, [productId]);

    await client.query(
      `INSERT INTO tracking_history (product_id, stage, status, notes) VALUES ($1, 'retailer', 'received', 'Received and verified at retail store')`,
      [productId]
    );

    await client.query('COMMIT');
    return stockResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listStock({ retailerId, search, page = 1, limit = 20 }) {
  const conditions = [`rs.retailer_id = $1`];
  const params = [retailerId];
  let idx = 2;

  if (search) {
    conditions.push(`p.crop_name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT rs.*, p.crop_name, p.unit
     FROM retailer_stock rs JOIN products p ON p.id = rs.product_id
     ${where} ORDER BY rs.received_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM retailer_stock rs JOIN products p ON p.id = rs.product_id ${where}`,
    params
  );
  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

module.exports = { findByUserId, findById, create, update, receiveShipment, listStock };
