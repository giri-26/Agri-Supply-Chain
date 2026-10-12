const { query } = require('../config/db');

async function overviewCards() {
  const [revenue, farmers, products, activeShipments, pendingOrders] = await Promise.all([
    query(`SELECT COALESCE(SUM(total_amount), 0)::float AS revenue FROM orders WHERE status = 'fulfilled'`),
    query(`SELECT COUNT(*)::int AS count FROM farmers`),
    query(`SELECT COUNT(*)::int AS count FROM products`),
    query(`SELECT COUNT(*)::int AS count FROM shipments WHERE status IN ('pickup', 'dispatched', 'in_transit')`),
    query(`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'placed'`),
  ]);

  return {
    revenue: revenue.rows[0].revenue,
    totalFarmers: farmers.rows[0].count,
    totalProducts: products.rows[0].count,
    activeShipments: activeShipments.rows[0].count,
    pendingOrders: pendingOrders.rows[0].count,
  };
}

async function ordersOverTime(days = 14) {
  const result = await query(
    `SELECT date_trunc('day', order_date) AS day, COUNT(*)::int AS orders,
            COALESCE(SUM(total_amount), 0)::float AS revenue
     FROM orders
     WHERE order_date >= NOW() - ($1 || ' days')::interval
     GROUP BY day ORDER BY day ASC`,
    [days]
  );
  return result.rows;
}

async function shipmentStatusBreakdown() {
  const result = await query(`SELECT status, COUNT(*)::int AS count FROM shipments GROUP BY status`);
  return result.rows;
}

async function productStatusBreakdown() {
  const result = await query(`SELECT status, COUNT(*)::int AS count FROM products GROUP BY status`);
  return result.rows;
}

module.exports = { overviewCards, ordersOverTime, shipmentStatusBreakdown, productStatusBreakdown };
