const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createProductValidation, updateProductValidation } = require('../validations/productValidation');

router.use(authenticate);

router.get('/categories', productController.categories);

router.get('/', productController.list);
router.post('/', authorize('farmer', 'admin'), createProductValidation, validate, productController.create);

router.get('/:id', productController.getOne);
router.put('/:id', authorize('farmer', 'admin'), updateProductValidation, validate, productController.update);
router.delete('/:id', authorize('farmer', 'admin'), productController.remove);
router.post(
  '/:id/images',
  authorize('farmer', 'admin'),
  uploadProductImages.array('images', 10),
  productController.uploadImages
);

module.exports = router;
