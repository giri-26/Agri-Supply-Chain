const { query, getClient } = require('../config/db');

// ---- Warehouses ----
async function listWarehouses({ managerId } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (managerId) {
    conditions.push(`manager_id = $${idx++}`);
    params.push(managerId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(`SELECT * FROM warehouses ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}

async function createWarehouse({ managerId, name, address, gpsLat, gpsLng }) {
  const result = await query(
    `INSERT INTO warehouses (manager_id, name, address, gps_lat, gps_lng) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [managerId, name, address, gpsLat, gpsLng]
  );
  return result.rows[0];
}

async function findWarehouseById(id) {
  const result = await query(`SELECT * FROM warehouses WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// ---- Shelves ----
async function listShelves(warehouseId) {
  const result = await query(`SELECT * FROM warehouse_shelves WHERE warehouse_id = $1 ORDER BY shelf_number`, [warehouseId]);
  return result.rows;
}

async function createShelf(warehouseId, { shelfNumber, capacity }) {
  const result = await query(
    `INSERT INTO warehouse_shelves (warehouse_id, shelf_number, capacity) VALUES ($1, $2, $3) RETURNING *`,
    [warehouseId, shelfNumber, capacity]
  );
  return result.rows[0];
}

// ---- Batches + Inventory (creating a batch = stock arriving) ----
async function createBatchWithInventory({ batchNumber, productId, warehouseId, shelfId, quantity, expiryDate }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const batchResult = await client.query(
      `INSERT INTO batches (batch_number, product_id, warehouse_id, shelf_id, quantity, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [batchNumber, productId, warehouseId, shelfId || null, quantity, expiryDate || null]
    );
    const batch = batchResult.rows[0];

    const inventoryResult = await client.query(
      `INSERT INTO inventory (warehouse_id, batch_id, product_id, quantity, status)
       VALUES ($1, $2, $3, $4, 'in_stock') RETURNING *`,
      [warehouseId, batch.id, productId, quantity]
    );

    await client.query(
      `INSERT INTO stock_movements (warehouse_id, product_id, batch_id, movement_type, quantity, reference_type, reference_id)
       VALUES ($1, $2, $3, 'in', $4, 'batch_received', $5)`,
      [warehouseId, productId, batch.id, quantity, batch.id]
    );

    await client.query(`UPDATE products SET status = 'in_warehouse', actual_quantity = COALESCE(actual_quantity, $1) WHERE id = $2`, [
      quantity,
      productId,
    ]);

    await client.query('COMMIT');
    return { batch, inventory: inventoryResult.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listInventory({ warehouseId, search, status, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (warehouseId) {
    conditions.push(`i.warehouse_id = $${idx++}`);
    params.push(warehouseId);
  }
  if (status) {
    conditions.push(`i.status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(p.crop_name ILIKE $${idx} OR b.batch_number ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT i.*, p.crop_name, p.unit, b.batch_number, b.expiry_date, w.name AS warehouse_name
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     JOIN batches b ON b.id = i.batch_id
     JOIN warehouses w ON w.id = i.warehouse_id
     ${where}
     ORDER BY i.last_updated DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM inventory i JOIN products p ON p.id = i.product_id JOIN batches b ON b.id = i.batch_id ${where}`,
    params
  );

  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function recordMovement({ warehouseId, productId, batchId, movementType, quantity, referenceType, notes }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO stock_movements (warehouse_id, product_id, batch_id, movement_type, quantity, reference_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [warehouseId, productId, batchId || null, movementType, quantity, referenceType || 'adjustment', notes || null]
    );

    if (batchId) {
      const delta = movementType === 'in' ? quantity : -quantity;
      await client.query(
        `UPDATE inventory SET quantity = GREATEST(quantity + $1, 0), last_updated = NOW() WHERE batch_id = $2`,
        [delta, batchId]
      );
      await client.query(
        `UPDATE inventory SET status = CASE
           WHEN quantity <= 0 THEN 'out_of_stock'
           WHEN quantity <= reorder_level THEN 'low_stock'
           ELSE 'in_stock' END
         WHERE batch_id = $1`,
        [batchId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listMovements({ warehouseId, movementType, search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (warehouseId) {
    conditions.push(`sm.warehouse_id = $${idx++}`);
    params.push(warehouseId);
  }
  if (movementType) {
    conditions.push(`sm.movement_type = $${idx++}`);
    params.push(movementType);
  }
  if (search) {
    conditions.push(`p.crop_name ILIKE $${idx}`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT sm.*, p.crop_name, w.name AS warehouse_name
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN warehouses w ON w.id = sm.warehouse_id
     ${where}
     ORDER BY sm.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM stock_movements sm JOIN products p ON p.id = sm.product_id ${where}`,
    params
  );

  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function environmentLog(warehouseId, { temperatureC, humidityPct }) {
  const result = await query(
    `INSERT INTO environment_logs (warehouse_id, temperature_c, humidity_pct) VALUES ($1, $2, $3) RETURNING *`,
    [warehouseId, temperatureC, humidityPct]
  );
  return result.rows[0];
}

async function listEnvironmentLogs(warehouseId, limit = 50) {
  const result = await query(
    `SELECT * FROM environment_logs WHERE warehouse_id = $1 ORDER BY recorded_at DESC LIMIT $2`,
    [warehouseId, limit]
  );
  return result.rows;
}

module.exports = {
  listWarehouses,
  createWarehouse,
  findWarehouseById,
  listShelves,
  createShelf,
  createBatchWithInventory,
  listInventory,
  recordMovement,
  listMovements,
  environmentLog,
  listEnvironmentLogs,
};
