const asyncHandler = require('../utils/asyncHandler');
const buyerModel = require('../models/buyerModel');
const orderModel = require('../models/orderModel');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

// A buyer registers their business profile once, right after signing up with role=buyer.
const register = asyncHandler(async (req, res) => {
  const existing = await buyerModel.findByUserId(req.user.id);
  if (existing) throw ApiError.conflict('Buyer profile already exists for this account');

  const buyer = await buyerModel.create({ ...req.body, userId: req.user.id });
  await logActivity({ userId: req.user.id, action: 'buyer_registered', entityType: 'buyer', entityId: buyer.id });
  res.status(201).json({ success: true, message: 'Buyer profile created', data: buyer });
});

const getMe = asyncHandler(async (req, res) => {
  const buyer = await buyerModel.findByUserId(req.user.id);
  if (!buyer) throw ApiError.notFound('No buyer profile found for this account. Register one first.');
  res.status(200).json({ success: true, data: buyer });
});

const list = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const result = await buyerModel.list({ search, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const buyer = await buyerModel.findById(req.params.id);
  if (!buyer) throw ApiError.notFound('Buyer not found');
  res.status(200).json({ success: true, data: buyer });
});

const update = asyncHandler(async (req, res) => {
  const existing = req.user.role === 'admin' ? await buyerModel.findById(req.params.id) : await buyerModel.findByUserId(req.user.id);
  if (!existing) throw ApiError.notFound('Buyer not found');
  const buyer = await buyerModel.update(existing.id, req.body);
  res.status(200).json({ success: true, message: 'Buyer profile updated', data: buyer });
});

// Purchase history = all orders this buyer has placed, any status
const purchaseHistory = asyncHandler(async (req, res) => {
  const buyer = req.user.role === 'admin' ? await buyerModel.findById(req.params.id) : await buyerModel.findByUserId(req.user.id);
  if (!buyer) throw ApiError.notFound('Buyer not found');
  const { page = 1, limit = 20 } = req.query;
  const result = await orderModel.list({ buyerId: buyer.id, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

// Active orders = placed/accepted orders not yet fulfilled/cancelled/rejected
const activeOrders = asyncHandler(async (req, res) => {
  const buyer = req.user.role === 'admin' ? await buyerModel.findById(req.params.id) : await buyerModel.findByUserId(req.user.id);
  if (!buyer) throw ApiError.notFound('Buyer not found');

  const placed = await orderModel.list({ buyerId: buyer.id, status: 'placed', limit: 100 });
  const accepted = await orderModel.list({ buyerId: buyer.id, status: 'accepted', limit: 100 });

  res.status(200).json({ success: true, data: [...placed.data, ...accepted.data] });
});

module.exports = { register, getMe, list, getOne, update, purchaseHistory, activeOrders };
