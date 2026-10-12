const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createOrderValidation } = require('../validations/orderValidation');

router.use(authenticate);

router.get('/', authorize('admin', 'retailer', 'buyer'), orderController.list);
router.post('/', authorize('admin', 'retailer', 'buyer'), createOrderValidation, validate, orderController.create);
router.get('/:id', authorize('admin', 'retailer', 'buyer'), orderController.getOne);
router.get('/:id/history', authorize('admin', 'retailer', 'buyer'), orderController.getHistory);

router.patch('/:id/accept', authorize('admin', 'retailer'), orderController.accept);
router.patch('/:id/reject', authorize('admin', 'retailer'), orderController.reject);
router.patch('/:id/cancel', authorize('admin', 'retailer', 'buyer'), orderController.cancel);
router.patch('/:id/fulfill', authorize('admin', 'retailer'), orderController.fulfill);

module.exports = router;
