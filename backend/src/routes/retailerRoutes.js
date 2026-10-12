const express = require('express');
const router = express.Router();

const retailerController = require('../controllers/retailerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('retailer', 'admin'));

router.post('/register', retailerController.register);
router.get('/me', retailerController.getMe);
router.put('/me', retailerController.update);
router.put('/:id', authorize('admin'), retailerController.update);

router.post('/receive', retailerController.receive);
router.get('/stock', retailerController.stock);

module.exports = router;
