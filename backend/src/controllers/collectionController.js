const asyncHandler = require('../utils/asyncHandler');
const collectionModel = require('../models/collectionModel');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');

const create = asyncHandler(async (req, res) => {
  const userId = req.body.userId || req.user.id;
  const center = await collectionModel.create({ ...req.body, userId });
  await logActivity({ userId: req.user.id, action: 'collection_center_created', entityType: 'collection_center', entityId: center.id });
  res.status(201).json({ success: true, message: 'Collection center created', data: center });
});

const list = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const result = await collectionModel.list({ search, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const center = await collectionModel.findById(req.params.id);
  if (!center) throw ApiError.notFound('Collection center not found');
  const farmers = await collectionModel.listAssignedFarmers(req.params.id);
  res.status(200).json({ success: true, data: { ...center, assignedFarmers: farmers } });
});

const update = asyncHandler(async (req, res) => {
  const center = await collectionModel.update(req.params.id, req.body);
  if (!center) throw ApiError.notFound('Collection center not found');
  await logActivity({ userId: req.user.id, action: 'collection_center_updated', entityType: 'collection_center', entityId: center.id });
  res.status(200).json({ success: true, message: 'Collection center updated', data: center });
});

const remove = asyncHandler(async (req, res) => {
  const center = await collectionModel.remove(req.params.id);
  if (!center) throw ApiError.notFound('Collection center not found');
  res.status(200).json({ success: true, message: 'Collection center deleted' });
});

const assignFarmer = asyncHandler(async (req, res) => {
  const assignment = await collectionModel.assignFarmer(req.params.id, req.body.farmerId);
  res.status(201).json({ success: true, message: 'Farmer assigned to center', data: assignment });
});

const unassignFarmer = asyncHandler(async (req, res) => {
  await collectionModel.unassignFarmer(req.params.id, req.params.farmerId);
  res.status(200).json({ success: true, message: 'Farmer unassigned' });
});

const listAssignedFarmers = asyncHandler(async (req, res) => {
  const data = await collectionModel.listAssignedFarmers(req.params.id);
  res.status(200).json({ success: true, data });
});

// ---- Collection records (accept/reject a product delivery) ----
const createRecord = asyncHandler(async (req, res) => {
  if (!['accepted', 'rejected'].includes(req.body.decision)) {
    throw ApiError.badRequest('decision must be "accepted" or "rejected"');
  }
  const record = await collectionModel.createRecord(req.body);
  await logActivity({ userId: req.user.id, action: 'product_collection_decision', entityType: 'product', entityId: req.body.productId });
  await notify({
    role: 'warehouse_manager',
    type: 'product_collected',
    title: `Product ${req.body.decision}`,
    message: `A product delivery was ${req.body.decision} at the collection center.`,
  });
  res.status(201).json({ success: true, message: `Product ${req.body.decision}`, data: record });
});

const listRecords = asyncHandler(async (req, res) => {
  const { collectionCenterId, decision, page = 1, limit = 20 } = req.query;
  const result = await collectionModel.listRecords({ collectionCenterId, decision, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  assignFarmer,
  unassignFarmer,
  listAssignedFarmers,
  createRecord,
  listRecords,
};
