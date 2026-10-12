const express = require('express');
const router = express.Router();

const collectionController = require('../controllers/collectionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('collection_center', 'admin'));

// Centers
router.get('/', collectionController.list);
router.post('/', collectionController.create);
router.get('/:id', collectionController.getOne);
router.put('/:id', collectionController.update);
router.delete('/:id', authorize('admin'), collectionController.remove);

// Farmer assignment
router.get('/:id/farmers', collectionController.listAssignedFarmers);
router.post('/:id/farmers', collectionController.assignFarmer);
router.delete('/:id/farmers/:farmerId', collectionController.unassignFarmer);

// Accept/reject product deliveries
router.get('/records', collectionController.listRecords);
router.post('/records', collectionController.createRecord);

module.exports = router;
