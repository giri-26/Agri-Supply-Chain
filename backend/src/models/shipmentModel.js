const { query, getClient } = require('../config/db');

// ---- Vehicles ----
async function createVehicle({ transporterId, vehicleNumber, vehicleType, capacityKg }) {
  const result = await query(
    `INSERT INTO vehicles (transporter_id, vehicle_number, vehicle_type, capacity_kg)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [transporterId, vehicleNumber, vehicleType, capacityKg]
  );
  return result.rows[0];
}

async function listVehicles({ transporterId } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (transporterId) {
    conditions.push(`transporter_id = $${idx++}`);
    params.push(transporterId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(`SELECT * FROM vehicles ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}

// ---- Driver profiles ----
async function upsertDriverProfile({ userId, licenseNumber, defaultVehicleId }) {
  const result = await query(
    `INSERT INTO driver_profiles (user_id, license_number, default_vehicle_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET license_number = EXCLUDED.license_number, default_vehicle_id = EXCLUDED.default_vehicle_id
     RETURNING *`,
    [userId, licenseNumber, defaultVehicleId || null]
  );
  return result.rows[0];
}

async function listDrivers() {
  const result = await query(
    `SELECT dp.*, u.full_name, u.email, u.phone, v.vehicle_number
     FROM driver_profiles dp JOIN users u ON u.id = dp.user_id
     LEFT JOIN vehicles v ON v.id = dp.default_vehicle_id
     ORDER BY u.full_name ASC`
  );
  return result.rows;
}

// ---- Shipments ----
async function create({ trackingId, batchId, productId, vehicleId, driverId, originType, originId, destinationType, destinationId, estimatedArrival }) {
  const result = await query(
    `INSERT INTO shipments (tracking_id, batch_id, product_id, vehicle_id, driver_id, origin_type, origin_id, destination_type, destination_id, estimated_arrival, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING *`,
    [trackingId, batchId || null, productId, vehicleId, driverId, originType, originId, destinationType, destinationId, estimatedArrival || null]
  );
  return result.rows[0];
}

const SHIPMENT_BASE_SELECT = `
  SELECT s.*, p.crop_name, p.tracking_id AS product_tracking_id,
         v.vehicle_number, v.vehicle_type, u.full_name AS driver_name
  FROM shipments s
  JOIN products p ON p.id = s.product_id
  LEFT JOIN vehicles v ON v.id = s.vehicle_id
  LEFT JOIN users u ON u.id = s.driver_id
`;

async function findById(id) {
  const result = await query(`${SHIPMENT_BASE_SELECT} WHERE s.id = $1`, [id]);
  return result.rows[0] || null;
}

async function list({ status, search, driverId, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`s.status = $${idx++}`);
    params.push(status);
  }
  if (driverId) {
    conditions.push(`s.driver_id = $${idx++}`);
    params.push(driverId);
  }
  if (search) {
    conditions.push(`(s.tracking_id ILIKE $${idx} OR p.crop_name ILIKE $${idx} OR v.vehicle_number ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `${SHIPMENT_BASE_SELECT} ${where} ORDER BY s.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM shipments s LEFT JOIN vehicles v ON v.id = s.vehicle_id JOIN products p ON p.id = s.product_id ${where}`,
    params
  );
  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function updateStatus(id, { status, delayReason }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    let result;
    if (status === 'dispatched') {
      result = await client.query(
        `UPDATE shipments SET status = $1, delay_reason = $2, dispatched_at = NOW() WHERE id = $3 RETURNING *`,
        [status, delayReason || null, id]
      );
    } else if (status === 'delivered') {
      result = await client.query(
        `UPDATE shipments SET status = $1, delay_reason = $2, delivered_at = NOW() WHERE id = $3 RETURNING *`,
        [status, delayReason || null, id]
      );
    } else {
      result = await client.query(
        `UPDATE shipments SET status = $1, delay_reason = $2 WHERE id = $3 RETURNING *`,
        [status, delayReason || null, id]
      );
    }
    const shipment = result.rows[0];

    if (shipment) {
      await client.query(
        `INSERT INTO tracking_history (product_id, stage, status, notes) VALUES ($1, 'transport', $2, $3)`,
        [shipment.product_id, status, delayReason || null]
      );

      if (status === 'delivered') {
        await client.query(`UPDATE products SET status = 'at_retailer' WHERE id = $1`, [shipment.product_id]);
      } else if (status === 'dispatched' || status === 'in_transit') {
        await client.query(`UPDATE products SET status = 'in_transit' WHERE id = $1`, [shipment.product_id]);
      }
    }

    await client.query('COMMIT');
    return shipment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function pushLocation(id, { gpsLat, gpsLng, note }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE shipments SET current_lat = $1, current_lng = $2 WHERE id = $3`,
      [gpsLat, gpsLng, id]
    );
    const logResult = await client.query(
      `INSERT INTO shipment_tracking_logs (shipment_id, gps_lat, gps_lng, note) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, gpsLat, gpsLng, note || null]
    );
    await client.query('COMMIT');
    return logResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function routeLog(id) {
  const result = await query(
    `SELECT * FROM shipment_tracking_logs WHERE shipment_id = $1 ORDER BY recorded_at ASC`,
    [id]
  );
  return result.rows;
}

module.exports = {
  createVehicle,
  listVehicles,
  upsertDriverProfile,
  listDrivers,
  create,
  findById,
  list,
  updateStatus,
  pushLocation,
  routeLog,
};
