const { query } = require('../config/db');

const PRODUCT_BASE_SELECT = `
  SELECT p.*, c.name AS category_name, f.farm_name, fm.id AS farmer_id, u.full_name AS farmer_name
  FROM products p
  JOIN farms f ON f.id = p.farm_id
  JOIN farmers fm ON fm.id = f.farmer_id
  JOIN users u ON u.id = fm.user_id
  LEFT JOIN product_categories c ON c.id = p.category_id
`;

async function listCategories() {
  const result = await query(`SELECT * FROM product_categories ORDER BY name ASC`);
  return result.rows;
}

async function create({ farmId, categoryId, cropName, variety, harvestDate, expectedQuantity, unit, isOrganic, trackingId }) {
  const result = await query(
    `INSERT INTO products (farm_id, category_id, crop_name, variety, harvest_date, expected_quantity, unit, is_organic, tracking_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [farmId, categoryId || null, cropName, variety, harvestDate, expectedQuantity, unit || 'kg', !!isOrganic, trackingId]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query(`${PRODUCT_BASE_SELECT} WHERE p.id = $1`, [id]);
  return result.rows[0] || null;
}

async function list({ search, categoryId, status, farmerId, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(p.crop_name ILIKE $${idx} OR p.variety ILIKE $${idx} OR p.tracking_id ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (categoryId) {
    conditions.push(`p.category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (status) {
    conditions.push(`p.status = $${idx++}`);
    params.push(status);
  }
  if (farmerId) {
    conditions.push(`fm.id = $${idx++}`);
    params.push(farmerId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const result = await query(
    `${PRODUCT_BASE_SELECT} ${where} ORDER BY p.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM products p
     JOIN farms f ON f.id = p.farm_id JOIN farmers fm ON fm.id = f.farmer_id ${where}`,
    params
  );

  return { data: result.rows, total: countResult.rows[0].total, page, limit };
}

async function update(id, fields) {
  const result = await query(
    `UPDATE products SET
       category_id = COALESCE($1, category_id),
       crop_name = COALESCE($2, crop_name),
       variety = COALESCE($3, variety),
       harvest_date = COALESCE($4, harvest_date),
       expected_quantity = COALESCE($5, expected_quantity),
       actual_quantity = COALESCE($6, actual_quantity),
       unit = COALESCE($7, unit),
       is_organic = COALESCE($8, is_organic),
       status = COALESCE($9, status)
     WHERE id = $10 RETURNING *`,
    [
      fields.categoryId,
      fields.cropName,
      fields.variety,
      fields.harvestDate,
      fields.expectedQuantity,
      fields.actualQuantity,
      fields.unit,
      fields.isOrganic,
      fields.status,
      id,
    ]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0] || null;
}

async function addImage(productId, filePath, caption) {
  const result = await query(
    `INSERT INTO images (entity_type, entity_id, file_path, caption) VALUES ('product', $1, $2, $3) RETURNING *`,
    [productId, filePath, caption || null]
  );
  return result.rows[0];
}

async function listImages(productId) {
  const result = await query(
    `SELECT * FROM images WHERE entity_type = 'product' AND entity_id = $1 ORDER BY uploaded_at DESC`,
    [productId]
  );
  return result.rows;
}

async function ownerUserIdForProduct(productId) {
  const result = await query(
    `SELECT u.id AS user_id FROM products p
     JOIN farms f ON f.id = p.farm_id
     JOIN farmers fm ON fm.id = f.farmer_id
     JOIN users u ON u.id = fm.user_id
     WHERE p.id = $1`,
    [productId]
  );
  return result.rows[0]?.user_id || null;
}

module.exports = { listCategories, create, findById, list, update, remove, addImage, listImages, ownerUserIdForProduct };
