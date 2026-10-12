const { query } = require('../config/db');

const PERIOD_TRUNC = { daily: 'day', weekly: 'week', monthly: 'month' };

async function salesSummary(period = 'daily', limit = 30) {
  const trunc = PERIOD_TRUNC[period] || 'day';
  const result = await query(
    `SELECT date_trunc('${trunc}', order_date) AS period,
            COUNT(*)::int AS order_count,
            COALESCE(SUM(total_amount), 0)::float AS revenue
     FROM orders
     WHERE status = 'fulfilled'
     GROUP BY period
     ORDER BY period DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function farmerReport() {
  const result = await query(
    `SELECT u.full_name AS farmer_name, u.email, COUNT(p.id)::int AS product_count,
            COALESCE(SUM(p.actual_quantity), 0)::float AS total_quantity
     FROM farmers fm
     JOIN users u ON u.id = fm.user_id
     JOIN farms f ON f.farmer_id = fm.id
     LEFT JOIN products p ON p.farm_id = f.id
     GROUP BY u.full_name, u.email
     ORDER BY product_count DESC`
  );
  return result.rows;
}

async function productReport() {
  const result = await query(
    `SELECT c.name AS category, COUNT(p.id)::int AS product_count,
            COALESCE(SUM(p.actual_quantity), 0)::float AS total_quantity,
            p.status
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     GROUP BY c.name, p.status
     ORDER BY product_count DESC`
  );
  return result.rows;
}

async function shipmentReport() {
  const result = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM shipments GROUP BY status ORDER BY count DESC`
  );
  return result.rows;
}

async function inventoryReport() {
  const result = await query(
    `SELECT w.name AS warehouse_name, i.status, COUNT(*)::int AS batch_count,
            COALESCE(SUM(i.quantity), 0)::float AS total_quantity
     FROM inventory i JOIN warehouses w ON w.id = i.warehouse_id
     GROUP BY w.name, i.status ORDER BY w.name`
  );
  return result.rows;
}

module.exports = { salesSummary, farmerReport, productReport, shipmentReport, inventoryReport };
