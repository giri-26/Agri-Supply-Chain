const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/register', authorize('buyer'), buyerController.register);
router.get('/me', authorize('buyer'), buyerController.getMe);
router.put('/me', authorize('buyer'), buyerController.update);
router.get('/me/purchase-history', authorize('buyer'), buyerController.purchaseHistory);
router.get('/me/active-orders', authorize('buyer'), buyerController.activeOrders);

router.get('/', authorize('admin', 'retailer'), buyerController.list);
router.get('/:id', authorize('admin', 'retailer'), buyerController.getOne);
router.put('/:id', authorize('admin'), buyerController.update);
router.get('/:id/purchase-history', authorize('admin'), buyerController.purchaseHistory);
router.get('/:id/active-orders', authorize('admin'), buyerController.activeOrders);

module.exports = router;
