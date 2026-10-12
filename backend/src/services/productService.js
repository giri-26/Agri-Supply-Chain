const productModel = require('../models/productModel');
const farmerModel = require('../models/farmerModel');
const ApiError = require('../utils/ApiError');
const { generateTrackingId } = require('../utils/idGenerator');

const VALID_STATUSES = ['registered', 'collected', 'in_warehouse', 'in_transit', 'at_retailer', 'sold'];

async function getCategories() {
  return productModel.listCategories();
}

async function createProduct(farmId, payload) {
  const farm = await farmerModel.findFarmById(farmId);
  if (!farm) throw ApiError.notFound('Farm not found');

  const trackingId = generateTrackingId('PRD');
  return productModel.create({ farmId, trackingId, ...payload });
}

async function getProduct(id) {
  const product = await productModel.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  const images = await productModel.listImages(id);
  return { ...product, images };
}

async function listProducts(params) {
  return productModel.list(params);
}

async function updateProduct(id, payload) {
  if (payload.status && !VALID_STATUSES.includes(payload.status)) {
    throw ApiError.badRequest(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  const updated = await productModel.update(id, payload);
  if (!updated) throw ApiError.notFound('Product not found');
  return updated;
}

async function deleteProduct(id) {
  const deleted = await productModel.remove(id);
  if (!deleted) throw ApiError.notFound('Product not found');
  return deleted;
}

async function addProductImage(productId, filePath, caption) {
  const product = await productModel.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  return productModel.addImage(productId, filePath, caption);
}

module.exports = {
  getCategories,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  addProductImage,
  VALID_STATUSES,
};
