const inventoryModel = require('../models/inventoryModel');
const ApiError = require('../utils/ApiError');
const { generateBatchNumber } = require('../utils/idGenerator');

async function getWarehouses(params) {
  return inventoryModel.listWarehouses(params);
}

async function createWarehouse(payload) {
  return inventoryModel.createWarehouse(payload);
}

async function getShelves(warehouseId) {
  const warehouse = await inventoryModel.findWarehouseById(warehouseId);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  return inventoryModel.listShelves(warehouseId);
}

async function createShelf(warehouseId, payload) {
  const warehouse = await inventoryModel.findWarehouseById(warehouseId);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  return inventoryModel.createShelf(warehouseId, payload);
}

async function receiveBatch(payload) {
  const warehouse = await inventoryModel.findWarehouseById(payload.warehouseId);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  const batchNumber = generateBatchNumber();
  return inventoryModel.createBatchWithInventory({ ...payload, batchNumber });
}

async function getInventory(params) {
  return inventoryModel.listInventory(params);
}

async function adjustStock(payload) {
  if (!['in', 'out'].includes(payload.movementType)) {
    throw ApiError.badRequest('movementType must be "in" or "out"');
  }
  await inventoryModel.recordMovement(payload);
  return { message: 'Stock movement recorded' };
}

async function getMovements(params) {
  return inventoryModel.listMovements(params);
}

async function logEnvironment(warehouseId, payload) {
  const warehouse = await inventoryModel.findWarehouseById(warehouseId);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  return inventoryModel.environmentLog(warehouseId, payload);
}

async function getEnvironmentLogs(warehouseId) {
  return inventoryModel.listEnvironmentLogs(warehouseId);
}

module.exports = {
  getWarehouses,
  createWarehouse,
  getShelves,
  createShelf,
  receiveBatch,
  getInventory,
  adjustStock,
  getMovements,
  logEnvironment,
  getEnvironmentLogs,
};
