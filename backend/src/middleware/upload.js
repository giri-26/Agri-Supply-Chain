const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function makeStorage(subfolder) {
  const dest = path.join(__dirname, '../../', env.upload.dir, subfolder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(ApiError.badRequest('Only JPEG, PNG, and WEBP images are allowed'));
  }
  cb(null, true);
}

function uploadFor(subfolder) {
  return multer({
    storage: makeStorage(subfolder),
    fileFilter,
    limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  });
}

module.exports = {
  uploadFarmImages: uploadFor('farmers'),
  uploadProductImages: uploadFor('products'),
  uploadProfilePhoto: uploadFor('profiles'),
};
