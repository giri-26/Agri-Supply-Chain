const { body } = require('express-validator');

const createOrderValidation = [
  body('retailerId').isUUID().withMessage('A valid retailerId is required'),
  body('productId').isUUID().withMessage('A valid productId is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('customerName').optional().isString(),
  body('notes').optional().isString(),
];

module.exports = { createOrderValidation };
