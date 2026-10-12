const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const farmerModel = require('../models/farmerModel');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

async function addFarmer({ fullName, email, phone }) {
  const existing = await userModel.findByEmail(email);
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const roleId = await userModel.findRoleIdByName('farmer');
  if (!roleId) throw ApiError.internal('Farmer role is not configured');

  // Admin-created farmers get a random temporary password; they can reset it via
  // the existing forgot-password flow (which is left untouched by this module).
  const tempPassword = crypto.randomBytes(6).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, env.bcryptSaltRounds);

  const farmer = await farmerModel.createFarmerWithUser({ fullName, email, phone, passwordHash, roleId });
  return { ...farmer, tempPassword };
}

async function getFarmer(id) {
  const farmer = await farmerModel.findFarmerById(id);
  if (!farmer) throw ApiError.notFound('Farmer not found');
  const farms = await farmerModel.listFarmsByFarmer(id);
  return { ...farmer, farms };
}

async function listFarmers(params) {
  return farmerModel.listFarmers(params);
}

async function editFarmer(id, payload) {
  const updated = await farmerModel.updateFarmer(id, payload);
  if (!updated) throw ApiError.notFound('Farmer not found');
  return updated;
}

async function removeFarmer(id) {
  const deleted = await farmerModel.deleteFarmer(id);
  if (!deleted) throw ApiError.notFound('Farmer not found');
  return deleted;
}

async function uploadFarmerPhoto(id, filePath) {
  const farmer = await farmerModel.findFarmerById(id);
  if (!farmer) throw ApiError.notFound('Farmer not found');
  await farmerModel.setProfilePhoto(farmer.user_id, filePath);
  return { profilePhoto: filePath };
}

async function addFarm(farmerId, payload) {
  const farmer = await farmerModel.findFarmerById(farmerId);
  if (!farmer) throw ApiError.notFound('Farmer not found');
  return farmerModel.createFarm(farmerId, payload);
}

async function editFarm(farmId, payload) {
  const farm = await farmerModel.updateFarm(farmId, payload);
  if (!farm) throw ApiError.notFound('Farm not found');
  return farm;
}

async function removeFarm(farmId) {
  const deleted = await farmerModel.deleteFarm(farmId);
  if (!deleted) throw ApiError.notFound('Farm not found');
  return deleted;
}

module.exports = { addFarmer, getFarmer, listFarmers, editFarmer, removeFarmer, uploadFarmerPhoto, addFarm, editFarm, removeFarm };
