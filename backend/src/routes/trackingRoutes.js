const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Public - no authentication. Anyone with a tracking ID or QR code can view the journey.
router.get('/:trackingId', trackingController.trackByTrackingId);

module.exports = router;
