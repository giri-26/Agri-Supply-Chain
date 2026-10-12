const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) throw ApiError.badRequest('Query parameter "q" is required');
  const like = `%${q}%`;

  const [farmers, products, vehicles, warehouses] = await Promise.all([
    query(
      `SELECT fm.id, u.full_name, u.email, 'farmer' AS type
       FROM farmers fm JOIN users u ON u.id = fm.user_id
       WHERE u.full_name ILIKE $1 OR u.email ILIKE $1 LIMIT 10`,
      [like]
    ),
    query(
      `SELECT id, crop_name AS name, tracking_id, status, 'product' AS type
       FROM products WHERE crop_name ILIKE $1 OR tracking_id ILIKE $1 LIMIT 10`,
      [like]
    ),
    query(
      `SELECT id, vehicle_number AS name, vehicle_type, 'vehicle' AS type
       FROM vehicles WHERE vehicle_number ILIKE $1 LIMIT 10`,
      [like]
    ),
    query(
      `SELECT id, name, address, 'warehouse' AS type
       FROM warehouses WHERE name ILIKE $1 OR address ILIKE $1 LIMIT 10`,
      [like]
    ),
  ]);

  res.status(200).json({
    success: true,
    data: {
      farmers: farmers.rows,
      products: products.rows,
      vehicles: vehicles.rows,
      warehouses: warehouses.rows,
    },
  });
});

module.exports = { search };
