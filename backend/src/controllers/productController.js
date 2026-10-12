const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');
const productModel = require('../models/productModel');
const farmerModel = require('../models/farmerModel');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('../services/notificationService');

async function assertFarmOwnership(req, farmId) {
  if (req.user.role === 'admin') return;
  const own = await farmerModel.findFarmerByUserId(req.user.id);
  if (!own) throw ApiError.forbidden('No farmer profile associated with this account');
  const farm = await farmerModel.findFarmById(farmId);
  if (!farm || farm.farmer_id !== own.id) throw ApiError.forbidden('You do not own this farm');
}

const categories = asyncHandler(async (req, res) => {
  const data = await productService.getCategories();
  res.status(200).json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const { farmId, ...payload } = req.body;
  await assertFarmOwnership(req, farmId);
  const product = await productService.createProduct(farmId, payload);
  await logActivity({ userId: req.user.id, action: 'product_created', entityType: 'product', entityId: product.id });
  await notify({ role: 'admin', type: 'product_added', title: 'New product registered', message: `${product.crop_name} added.` });
  res.status(201).json({ success: true, message: 'Product registered', data: product });
});

const list = asyncHandler(async (req, res) => {
  const { search, categoryId, status, farmerId, page = 1, limit = 20 } = req.query;
  const result = await productService.listProducts({ search, categoryId, status, farmerId, page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  res.status(200).json({ success: true, data: product });
});

const update = asyncHandler(async (req, res) => {
  const previous = await productModel.findById(req.params.id);
  if (!previous) throw ApiError.notFound('Product not found');
  if (req.user.role === 'farmer') await assertFarmOwnership(req, previous.farm_id);

  const product = await productService.updateProduct(req.params.id, req.body);
  await logActivity({ userId: req.user.id, action: 'product_updated', entityType: 'product', entityId: product.id });

  if (req.body.status && req.body.status !== previous.status) {
    await notify({
      role: 'admin',
      type: 'product_status_changed',
      title: 'Product status updated',
      message: `${product.crop_name} is now "${product.status}".`,
    });
  }

  res.status(200).json({ success: true, message: 'Product updated', data: product });
});

const remove = asyncHandler(async (req, res) => {
  const previous = await productModel.findById(req.params.id);
  if (!previous) throw ApiError.notFound('Product not found');
  if (req.user.role === 'farmer') await assertFarmOwnership(req, previous.farm_id);

  await productService.deleteProduct(req.params.id);
  await logActivity({ userId: req.user.id, action: 'product_deleted', entityType: 'product', entityId: req.params.id });
  res.status(200).json({ success: true, message: 'Product deleted' });
});

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw ApiError.badRequest('No image files provided');
  const saved = [];
  for (const file of req.files) {
    const relativePath = `/uploads/products/${file.filename}`;
    // eslint-disable-next-line no-await-in-loop
    saved.push(await productService.addProductImage(req.params.id, relativePath, req.body.caption));
  }
  res.status(201).json({ success: true, message: 'Images uploaded', data: saved });
});

module.exports = { categories, create, list, getOne, update, remove, uploadImages };
