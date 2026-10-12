const asyncHandler = require('../utils/asyncHandler');
const orderModel = require('../models/orderModel');
const buyerModel = require('../models/buyerModel');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');

const VALID_TRANSITIONS = {
  placed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['fulfilled', 'cancelled'],
  rejected: [],
  fulfilled: [],
  cancelled: [],
};

const create = asyncHandler(async (req, res) => {
  let buyerId = req.body.buyerId || null;
  if (req.user.role === 'buyer') {
    const buyer = await buyerModel.findByUserId(req.user.id);
    if (!buyer) throw ApiError.forbidden('No buyer profile associated with this account');
    buyerId = buyer.id;
  }

  const order = await orderModel.create({ ...req.body, buyerId });
  await logActivity({ userId: req.user.id, action: 'order_created', entityType: 'order', entityId: order.id });
  await notify({ role: 'retailer', type: 'new_order', title: 'New order received', message: `A new order was placed for ${order.quantity} units.` });
  res.status(201).json({ success: true, message: 'Order placed', data: order });
});

const list = asyncHandler(async (req, res) => {
  const { retailerId, buyerId, status, page = 1, limit = 20 } = req.query;
  const result = await orderModel.list({ retailerId, buyerId, status, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await orderModel.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const statusHistory = await orderModel.history(req.params.id);
  res.status(200).json({ success: true, data: { ...order, history: statusHistory } });
});

async function transition(req, res, targetStatus) {
  const order = await orderModel.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(`Cannot move an order from "${order.status}" to "${targetStatus}"`);
  }

  const updated = await orderModel.updateStatus(req.params.id, targetStatus, req.user.id, req.body.notes);
  await logActivity({ userId: req.user.id, action: `order_${targetStatus}`, entityType: 'order', entityId: order.id });
  await notify({
    role: 'admin',
    type: 'order_status_changed',
    title: `Order ${targetStatus}`,
    message: `Order for ${order.crop_name} is now "${targetStatus}".`,
  });
  res.status(200).json({ success: true, message: `Order ${targetStatus}`, data: updated });
}

const accept = asyncHandler((req, res) => transition(req, res, 'accepted'));
const reject = asyncHandler((req, res) => transition(req, res, 'rejected'));
const cancel = asyncHandler((req, res) => transition(req, res, 'cancelled'));
const fulfill = asyncHandler((req, res) => transition(req, res, 'fulfilled'));

const getHistory = asyncHandler(async (req, res) => {
  const data = await orderModel.history(req.params.id);
  res.status(200).json({ success: true, data });
});

module.exports = { create, list, getOne, accept, reject, cancel, fulfill, getHistory };
