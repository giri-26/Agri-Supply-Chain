const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('admin', 'warehouse_manager', 'transporter', 'retailer'));

// ?period=daily|weekly|monthly covers Daily/Weekly/Monthly reports with one endpoint
router.get('/sales', reportController.sales);
router.get('/farmers', reportController.farmers);
router.get('/products', reportController.products);
router.get('/shipments', reportController.shipments);
router.get('/inventory', reportController.inventory);

module.exports = router;
