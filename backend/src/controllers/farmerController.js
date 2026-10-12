const asyncHandler = require('../utils/asyncHandler');
const farmerService = require('../services/farmerService');
const farmerModel = require('../models/farmerModel');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');

// Admins and collection centers can act on any farmer; a farmer can only act on themselves.
async function resolveFarmerIdForSelfAccess(req) {
  if (req.user.role === 'admin' || req.user.role === 'collection_center') return req.params.id;
  const own = await farmerModel.findFarmerByUserId(req.user.id);
  if (!own) throw ApiError.forbidden('No farmer profile associated with this account');
  if (own.id !== req.params.id) throw ApiError.forbidden('You can only manage your own farmer profile');
  return req.params.id;
}

const list = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const result = await farmerService.listFarmers({ search, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const create = asyncHandler(async (req, res) => {
  const farmer = await farmerService.addFarmer(req.body);
  await logActivity({ userId: req.user.id, action: 'farmer_created', entityType: 'farmer', entityId: farmer.id });
  res.status(201).json({
    success: true,
    message: 'Farmer created. Share the temporary password so they can log in and reset it.',
    data: farmer,
  });
});

const getOne = asyncHandler(async (req, res) => {
  await resolveFarmerIdForSelfAccess(req);
  const farmer = await farmerService.getFarmer(req.params.id);
  res.status(200).json({ success: true, data: farmer });
});

const getMe = asyncHandler(async (req, res) => {
  const own = await farmerModel.findFarmerByUserId(req.user.id);
  if (!own) throw ApiError.notFound('No farmer profile found for this account');
  const farmer = await farmerService.getFarmer(own.id);
  res.status(200).json({ success: true, data: farmer });
});

const update = asyncHandler(async (req, res) => {
  const id = await resolveFarmerIdForSelfAccess(req);
  const farmer = await farmerService.editFarmer(id, req.body);
  await logActivity({ userId: req.user.id, action: 'farmer_updated', entityType: 'farmer', entityId: id });
  res.status(200).json({ success: true, message: 'Farmer updated', data: farmer });
});

const remove = asyncHandler(async (req, res) => {
  const farmer = await farmerService.removeFarmer(req.params.id);
  await logActivity({ userId: req.user.id, action: 'farmer_deleted', entityType: 'farmer', entityId: req.params.id });
  res.status(200).json({ success: true, message: 'Farmer deleted', data: farmer });
});

const uploadPhoto = asyncHandler(async (req, res) => {
  const id = await resolveFarmerIdForSelfAccess(req);
  if (!req.file) throw ApiError.badRequest('No image file provided');
  const relativePath = `/uploads/farmers/${req.file.filename}`;
  const result = await farmerService.uploadFarmerPhoto(id, relativePath);
  res.status(200).json({ success: true, message: 'Photo uploaded', data: result });
});

const addFarm = asyncHandler(async (req, res) => {
  const id = await resolveFarmerIdForSelfAccess(req);
  const farm = await farmerService.addFarm(id, req.body);
  await notify({ role: 'admin', type: 'farm_registered', title: 'New farm registered', message: `${farm.farm_name} was registered.` });
  res.status(201).json({ success: true, message: 'Farm added', data: farm });
});

const listFarms = asyncHandler(async (req, res) => {
  await resolveFarmerIdForSelfAccess(req);
  const farms = await farmerModel.listFarmsByFarmer(req.params.id);
  res.status(200).json({ success: true, data: farms });
});

const updateFarm = asyncHandler(async (req, res) => {
  const farm = await farmerService.editFarm(req.params.farmId, req.body);
  res.status(200).json({ success: true, message: 'Farm updated', data: farm });
});

const removeFarm = asyncHandler(async (req, res) => {
  await farmerService.removeFarm(req.params.farmId);
  res.status(200).json({ success: true, message: 'Farm deleted' });
});

module.exports = { list, create, getOne, getMe, update, remove, uploadPhoto, addFarm, listFarms, updateFarm, removeFarm };
