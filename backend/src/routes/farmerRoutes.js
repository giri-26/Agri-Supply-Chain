const express = require('express');
const router = express.Router();

const farmerController = require('../controllers/farmerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { uploadFarmImages } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createFarmerValidation, updateFarmerValidation, farmValidation } = require('../validations/farmerValidation');

router.use(authenticate);

// Self-service: a logged-in farmer viewing their own profile
router.get('/me', authorize('farmer'), farmerController.getMe);

// Listing / creation - admin and collection centers manage farmer records
router.get('/', authorize('admin', 'collection_center', 'warehouse_manager'), farmerController.list);
router.post('/', authorize('admin'), createFarmerValidation, validate, farmerController.create);

// Single farmer - admin/collection_center can view any, a farmer only their own
router.get('/:id', authorize('admin', 'collection_center', 'farmer'), farmerController.getOne);
router.put('/:id', authorize('admin', 'farmer'), updateFarmerValidation, validate, farmerController.update);
router.delete('/:id', authorize('admin'), farmerController.remove);
router.post('/:id/image', authorize('admin', 'farmer'), uploadFarmImages.single('photo'), farmerController.uploadPhoto);

// Farms
router.get('/:id/farms', authorize('admin', 'collection_center', 'farmer'), farmerController.listFarms);
router.post('/:id/farms', authorize('admin', 'farmer'), farmValidation, validate, farmerController.addFarm);
router.put('/farms/:farmId', authorize('admin', 'farmer'), farmValidation, validate, farmerController.updateFarm);
router.delete('/farms/:farmId', authorize('admin', 'farmer'), farmerController.removeFarm);

module.exports = router;
