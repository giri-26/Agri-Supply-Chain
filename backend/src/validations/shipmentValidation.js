const { body } = require('express-validator');

const createShipmentValidation = [
  body('productId').isUUID().withMessage('A valid productId is required'),
  body('vehicleId').isUUID().withMessage('A valid vehicleId is required'),
  body('driverId').isUUID().withMessage('A valid driverId is required'),
  body('originType').isIn(['warehouse', 'collection_center']).withMessage('Invalid origin type'),
  body('originId').isUUID().withMessage('A valid originId is required'),
  body('destinationType').isIn(['retailer', 'warehouse']).withMessage('Invalid destination type'),
  body('destinationId').isUUID().withMessage('A valid destinationId is required'),
  body('estimatedArrival').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid estimated arrival date'),
];

const locationValidation = [
  body('gpsLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('gpsLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

module.exports = { createShipmentValidation, locationValidation };
