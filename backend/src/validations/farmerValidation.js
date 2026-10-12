const { body } = require('express-validator');

const createFarmerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
];

const updateFarmerValidation = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  body('idProof').optional().isString(),
  body('bankDetails').optional().isString(),
];

const farmValidation = [
  body('farmName').trim().notEmpty().withMessage('Farm name is required'),
  body('address').optional().isString(),
  body('gpsLat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('gpsLng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('soilType').optional().isString(),
  body('sizeAcres').optional().isFloat({ min: 0 }).withMessage('Size must be a positive number'),
  body('isOrganic').optional().isBoolean(),
];

module.exports = { createFarmerValidation, updateFarmerValidation, farmValidation };
