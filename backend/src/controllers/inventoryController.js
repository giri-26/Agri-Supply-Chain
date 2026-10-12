const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventoryService');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');

const listWarehouses = asyncHandler(async (req, res) => {
  const managerId = req.user.role === 'warehouse_manager' ? req.user.id : req.query.managerId;
  const data = await inventoryService.getWarehouses({ managerId });
  res.status(200).json({ success: true, data });
});

const createWarehouse = asyncHandler(async (req, res) => {
  const managerId = req.body.managerId || req.user.id;
  const warehouse = await inventoryService.createWarehouse({ ...req.body, managerId });
  await logActivity({ userId: req.user.id, action: 'warehouse_created', entityType: 'warehouse', entityId: warehouse.id });
  res.status(201).json({ success: true, message: 'Warehouse created', data: warehouse });
});

const listShelves = asyncHandler(async (req, res) => {
  const data = await inventoryService.getShelves(req.params.warehouseId);
  res.status(200).json({ success: true, data });
});

const createShelf = asyncHandler(async (req, res) => {
  const shelf = await inventoryService.createShelf(req.params.warehouseId, req.body);
  res.status(201).json({ success: true, message: 'Shelf created', data: shelf });
});

const receiveBatch = asyncHandler(async (req, res) => {
  const result = await inventoryService.receiveBatch(req.body);
  await logActivity({ userId: req.user.id, action: 'batch_received', entityType: 'batch', entityId: result.batch.id });
  await notify({ role: 'admin', type: 'batch_received', title: 'Stock received', message: `Batch ${result.batch.batch_number} received into warehouse.` });
  res.status(201).json({ success: true, message: 'Batch received into warehouse', data: result });
});

const listInventory = asyncHandler(async (req, res) => {
  const { warehouseId, search, status, page = 1, limit = 20 } = req.query;
  const result = await inventoryService.getInventory({ warehouseId, search, status, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const adjustStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.adjustStock(req.body);
  await logActivity({ userId: req.user.id, action: 'stock_movement', entityType: 'warehouse', entityId: req.body.warehouseId });
  res.status(201).json({ success: true, ...result });
});

const listMovements = asyncHandler(async (req, res) => {
  const { warehouseId, movementType, search, page = 1, limit = 20 } = req.query;
  const result = await inventoryService.getMovements({ warehouseId, movementType, search, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const logEnvironment = asyncHandler(async (req, res) => {
  const log = await inventoryService.logEnvironment(req.params.warehouseId, req.body);
  res.status(201).json({ success: true, message: 'Environment reading recorded', data: log });
});

const getEnvironmentLogs = asyncHandler(async (req, res) => {
  const data = await inventoryService.getEnvironmentLogs(req.params.warehouseId);
  res.status(200).json({ success: true, data });
});

module.exports = {
  listWarehouses,
  createWarehouse,
  listShelves,
  createShelf,
  receiveBatch,
  listInventory,
  adjustStock,
  listMovements,
  logEnvironment,
  getEnvironmentLogs,
};
