const asyncHandler = require('../utils/asyncHandler');
const retailerModel = require('../models/retailerModel');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');

async function resolveRetailerId(req) {
  if (req.user.role === 'admin' && req.params.id) return req.params.id;
  const own = await retailerModel.findByUserId(req.user.id);
  if (!own) throw ApiError.notFound('No retailer profile found for this account');
  return own.id;
}

const register = asyncHandler(async (req, res) => {
  const existing = await retailerModel.findByUserId(req.user.id);
  if (existing) throw ApiError.conflict('Retailer profile already exists for this account');
  const retailer = await retailerModel.create({ ...req.body, userId: req.user.id });
  await logActivity({ userId: req.user.id, action: 'retailer_registered', entityType: 'retailer', entityId: retailer.id });
  res.status(201).json({ success: true, message: 'Retailer profile created', data: retailer });
});

const getMe = asyncHandler(async (req, res) => {
  const retailer = await retailerModel.findByUserId(req.user.id);
  if (!retailer) throw ApiError.notFound('No retailer profile found. Register one first.');
  res.status(200).json({ success: true, data: retailer });
});

const update = asyncHandler(async (req, res) => {
  const id = await resolveRetailerId(req);
  const retailer = await retailerModel.update(id, req.body);
  res.status(200).json({ success: true, message: 'Retailer profile updated', data: retailer });
});

const receive = asyncHandler(async (req, res) => {
  const retailerId = await resolveRetailerId(req);
  const stock = await retailerModel.receiveShipment({ ...req.body, retailerId });
  await logActivity({ userId: req.user.id, action: 'shipment_received', entityType: 'shipment', entityId: req.body.shipmentId });
  await notify({ role: 'admin', type: 'shipment_delivered', title: 'Shipment delivered', message: 'A shipment was received and verified at a retail store.' });
  res.status(201).json({ success: true, message: 'Shipment received and stock updated', data: stock });
});

const stock = asyncHandler(async (req, res) => {
  const retailerId = await resolveRetailerId(req);
  const { search, page = 1, limit = 20 } = req.query;
  const result = await retailerModel.listStock({ retailerId, search, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

module.exports = { register, getMe, update, receive, stock };
