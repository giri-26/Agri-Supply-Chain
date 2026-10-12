const { query, getClient } = require('../config/db');

const ORDER_BASE_SELECT = `
  SELECT o.*, p.crop_name, p.unit, r.store_name, b.business_name AS buyer_business_name
  FROM orders o
  JOIN products p ON p.id = o.product_id
  JOIN retailers r ON r.id = o.retailer_id
  LEFT JOIN buyers b ON b.id = o.buyer_id
`;

async function create({ retailerId, buyerId, customerName, productId, quantity, totalAmount, notes }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO orders (retailer_id, buyer_id, customer_name, product_id, quantity, total_amount, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'placed') RETURNING *`,
      [retailerId, buyerId || null, customerName || null, productId, quantity, totalAmount, notes || null]
    );
    const order = result.rows[0];
    await client.query(
      `INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, 'placed', 'Order created')`,
      [order.id]
    );
    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findById(id) {
  const result = await query(`${ORDER_BASE_SELECT} WHERE o.id = $1`, [id]);
  return result.rows[0] || null;
}

async function list({ retailerId, buyerId, status, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (retailerId) {
    conditions.push(`o.retailer_id = $${idx++}`);
    params.push(retailerId);
  }
  if (buyerId) {
    conditions.push(`o.buyer_id = $${idx++}`);
    params.push(buyerId);
  }
  if (status) {
    conditions.push(`o.status = $${idx++}`);
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `${ORDER_BASE_SELECT} ${where} ORDER BY o.order_date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM orders o ${where}`, params);
  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function updateStatus(id, status, changedBy, notes) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
    await client.query(
      `INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)`,
      [id, status, notes || null, changedBy || null]
    );
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function history(orderId) {
  const result = await query(
    `SELECT osh.*, u.full_name AS changed_by_name
     FROM order_status_history osh LEFT JOIN users u ON u.id = osh.changed_by
     WHERE osh.order_id = $1 ORDER BY osh.changed_at ASC`,
    [orderId]
  );
  return result.rows;
}

module.exports = { create, findById, list, updateStatus, history };
