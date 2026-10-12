const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard-stats', adminController.dashboardStats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/approve', adminController.approveUser);
router.patch('/users/:id/reject', adminController.rejectUser);
router.patch('/users/:id/active', adminController.setUserActive);
router.get('/activity-logs', adminController.activityLogs);

module.exports = router;
