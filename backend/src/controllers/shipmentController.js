const asyncHandler = require('../utils/asyncHandler');
const shipmentModel = require('../models/shipmentModel');
const ApiError = require('../utils/ApiError');
const { generateShipmentTrackingId } = require('../utils/idGenerator');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');
const { emitBroadcast } = require('../sockets');

const VALID_STATUSES = ['pending', 'pickup', 'dispatched', 'in_transit', 'delivered', 'cancelled'];

// ---- Vehicles ----
const createVehicle = asyncHandler(async (req, res) => {
  const transporterId = req.body.transporterId || req.user.id;
  const vehicle = await shipmentModel.createVehicle({ ...req.body, transporterId });
  res.status(201).json({ success: true, message: 'Vehicle registered', data: vehicle });
});

const listVehicles = asyncHandler(async (req, res) => {
  const transporterId = req.user.role === 'transporter' ? req.user.id : req.query.transporterId;
  const data = await shipmentModel.listVehicles({ transporterId });
  res.status(200).json({ success: true, data });
});

// ---- Drivers ----
const upsertDriver = asyncHandler(async (req, res) => {
  const userId = req.body.userId || req.user.id;
  const driver = await shipmentModel.upsertDriverProfile({ ...req.body, userId });
  res.status(201).json({ success: true, message: 'Driver profile saved', data: driver });
});

const listDrivers = asyncHandler(async (req, res) => {
  const data = await shipmentModel.listDrivers();
  res.status(200).json({ success: true, data });
});

// ---- Shipments ----
const create = asyncHandler(async (req, res) => {
  const trackingId = generateShipmentTrackingId();
  const shipment = await shipmentModel.create({ ...req.body, trackingId });
  await logActivity({ userId: req.user.id, action: 'shipment_created', entityType: 'shipment', entityId: shipment.id });
  await notify({ role: 'retailer', type: 'shipment_created', title: 'New shipment dispatched to you', message: `Shipment ${shipment.tracking_id} created.` });
  res.status(201).json({ success: true, message: 'Shipment created', data: shipment });
});

const list = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const driverId = req.user.role === 'transporter' ? undefined : req.query.driverId;
  const result = await shipmentModel.list({ status, search, driverId, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const shipment = await shipmentModel.findById(req.params.id);
  if (!shipment) throw ApiError.notFound('Shipment not found');
  const route = await shipmentModel.routeLog(req.params.id);
  res.status(200).json({ success: true, data: { ...shipment, route } });
});

const updateStatus = asyncHandler(async (req, res) => {
  if (!VALID_STATUSES.includes(req.body.status)) {
    throw ApiError.badRequest(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  const shipment = await shipmentModel.updateStatus(req.params.id, req.body);
  if (!shipment) throw ApiError.notFound('Shipment not found');

  await logActivity({ userId: req.user.id, action: 'shipment_status_updated', entityType: 'shipment', entityId: shipment.id });
  await notify({
    role: 'admin',
    type: 'shipment_status_changed',
    title: `Shipment ${shipment.status}`,
    message: `Shipment ${shipment.tracking_id} is now "${shipment.status}".`,
  });
  emitBroadcast('shipment:status', { shipmentId: shipment.id, status: shipment.status });

  res.status(200).json({ success: true, message: 'Shipment status updated', data: shipment });
});

const updateLocation = asyncHandler(async (req, res) => {
  const log = await shipmentModel.pushLocation(req.params.id, req.body);
  emitBroadcast('shipment:location', { shipmentId: req.params.id, ...req.body });
  res.status(201).json({ success: true, message: 'Location updated', data: log });
});

const getRoute = asyncHandler(async (req, res) => {
  const data = await shipmentModel.routeLog(req.params.id);
  res.status(200).json({ success: true, data });
});

module.exports = {
  createVehicle,
  listVehicles,
  upsertDriver,
  listDrivers,
  create,
  list,
  getOne,
  updateStatus,
  updateLocation,
  getRoute,
};
