const userModel = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { query } = require('../config/db');

const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const result = await userModel.listAll({ role, search, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const approveUser = asyncHandler(async (req, res) => {
  const user = await userModel.setApproval(req.params.id, true);
  if (!user) throw ApiError.notFound('User not found');
  await logActivity({ userId: req.user.id, action: 'user_approved', entityType: 'user', entityId: user.id });
  res.status(200).json({ success: true, message: 'User approved', data: user });
});

const rejectUser = asyncHandler(async (req, res) => {
  const user = await userModel.setApproval(req.params.id, false);
  if (!user) throw ApiError.notFound('User not found');
  await logActivity({ userId: req.user.id, action: 'user_rejected', entityType: 'user', entityId: user.id });
  res.status(200).json({ success: true, message: 'User registration rejected', data: user });
});

const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await userModel.setActive(req.params.id, !!isActive);
  if (!user) throw ApiError.notFound('User not found');
  await logActivity({
    userId: req.user.id,
    action: isActive ? 'user_activated' : 'user_deactivated',
    entityType: 'user',
    entityId: user.id,
  });
  res.status(200).json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}`, data: user });
});

const dashboardStats = asyncHandler(async (req, res) => {
  const [farmers, products, shipmentsToday, lowStock, orders, alerts] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM farmers`),
    query(`SELECT COUNT(*)::int AS count FROM products`),
    query(`SELECT COUNT(*)::int AS count FROM shipments WHERE created_at::date = CURRENT_DATE`),
    query(`SELECT COUNT(*)::int AS count FROM inventory WHERE status = 'low_stock'`),
    query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_date::date = CURRENT_DATE`),
    query(`SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = FALSE`),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalFarmers: farmers.rows[0].count,
      totalProducts: products.rows[0].count,
      todaysShipments: shipmentsToday.rows[0].count,
      lowStockAlerts: lowStock.rows[0].count,
      ordersToday: orders.rows[0].count,
      unreadAlerts: alerts.rows[0].count,
    },
  });
});

const activityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const result = await query(
    `SELECT al.*, u.full_name, u.email
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [Number(limit), offset]
  );
  res.status(200).json({ success: true, data: result.rows });
});

module.exports = { listUsers, approveUser, rejectUser, setUserActive, dashboardStats, activityLogs };
