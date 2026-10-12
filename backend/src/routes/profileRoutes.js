const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadProfilePhoto } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { updateProfileValidation, changePasswordValidation } = require('../validations/profileValidation');

router.use(authenticate);

router.put('/', updateProfileValidation, validate, profileController.updateProfile);
router.post('/photo', uploadProfilePhoto.single('photo'), profileController.uploadPhoto);
router.post('/change-password', changePasswordValidation, validate, profileController.changePassword);

module.exports = router;
