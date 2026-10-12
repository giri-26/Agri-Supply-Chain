const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('warehouse_manager', 'admin'));

// Warehouses
router.get('/warehouses', inventoryController.listWarehouses);
router.post('/warehouses', inventoryController.createWarehouse);

// Shelves
router.get('/warehouses/:warehouseId/shelves', inventoryController.listShelves);
router.post('/warehouses/:warehouseId/shelves', inventoryController.createShelf);

// Environment logs (temperature/humidity)
router.get('/warehouses/:warehouseId/environment-logs', inventoryController.getEnvironmentLogs);
router.post('/warehouses/:warehouseId/environment-logs', inventoryController.logEnvironment);

// Batches (receiving stock into the warehouse = "Incoming Stock")
router.post('/batches', inventoryController.receiveBatch);

// Inventory = "Available Stock" with search/filters
router.get('/inventory', inventoryController.listInventory);

// Stock movements = "Incoming Stock" / "Outgoing Stock" ledger, plus manual adjustments
router.get('/stock-movements', inventoryController.listMovements);
router.post('/stock-movements', inventoryController.adjustStock);

module.exports = router;
