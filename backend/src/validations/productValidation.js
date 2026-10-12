const { body } = require('express-validator');

const createProductValidation = [
  body('farmId').isUUID().withMessage('A valid farmId is required'),
  body('cropName').trim().notEmpty().withMessage('Crop name is required'),
  body('variety').optional().isString(),
  body('categoryId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid category'),
  body('harvestDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid harvest date'),
  body('expectedQuantity').optional().isFloat({ min: 0 }).withMessage('Expected quantity must be a positive number'),
  body('unit').optional().isIn(['kg', 'g', 'ton', 'lb', 'quintal', 'piece', 'dozen']).withMessage('Invalid unit'),
  body('isOrganic').optional().isBoolean(),
];

const updateProductValidation = [
  body('categoryId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid category'),
  body('cropName').optional().trim().notEmpty(),
  body('actualQuantity').optional().isFloat({ min: 0 }).withMessage('Actual quantity must be a positive number'),
  body('status').optional().isIn(['registered', 'collected', 'in_warehouse', 'in_transit', 'at_retailer', 'sold']),
];

module.exports = { createProductValidation, updateProductValidation };
