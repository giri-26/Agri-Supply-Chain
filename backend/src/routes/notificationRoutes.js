const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
