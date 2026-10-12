const express = require('express');
const router = express.Router();

const shipmentController = require('../controllers/shipmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createShipmentValidation, locationValidation } = require('../validations/shipmentValidation');

router.use(authenticate);

const writeAccess = authorize('transporter', 'admin');
const readAccess = authorize('transporter', 'admin', 'retailer');

// Vehicles
router.get('/vehicles', writeAccess, shipmentController.listVehicles);
router.post('/vehicles', writeAccess, shipmentController.createVehicle);

// Drivers
router.get('/drivers', writeAccess, shipmentController.listDrivers);
router.post('/drivers', writeAccess, shipmentController.upsertDriver);

// Shipments
router.get('/shipments', readAccess, shipmentController.list);
router.post('/shipments', writeAccess, createShipmentValidation, validate, shipmentController.create);
router.get('/shipments/:id', readAccess, shipmentController.getOne);
router.patch('/shipments/:id/status', writeAccess, shipmentController.updateStatus);
router.patch('/shipments/:id/location', writeAccess, locationValidation, validate, shipmentController.updateLocation);
router.get('/shipments/:id/route', readAccess, shipmentController.getRoute);

module.exports = router;
