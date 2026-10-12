const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('admin', 'warehouse_manager', 'transporter', 'retailer'));

router.get('/overview', analyticsController.overview);
router.get('/charts/orders', analyticsController.ordersChart);
router.get('/charts/shipments', analyticsController.shipmentsChart);
router.get('/charts/products', analyticsController.productsChart);

module.exports = router;
