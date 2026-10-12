const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Public, read-only endpoint used by the Customer tracking page and
 * the QR-code scan flow. No authentication required by design, since
 * customers scanning a product's QR code are not logged in.
 */
const trackByTrackingId = asyncHandler(async (req, res) => {
  const { trackingId } = req.params;

  const productResult = await query(
    `SELECT p.*, f.farm_name, f.address AS farm_address, f.gps_lat AS farm_lat,
            f.gps_lng AS farm_lng, f.soil_type, f.is_organic AS farm_organic,
            u.full_name AS farmer_name
     FROM products p
     JOIN farms f ON f.id = p.farm_id
     JOIN farmers fm ON fm.id = f.farmer_id
     JOIN users u ON u.id = fm.user_id
     WHERE p.tracking_id = $1`,
    [trackingId]
  );

  const product = productResult.rows[0];
  if (!product) throw ApiError.notFound('No product found for this tracking ID');

  const [images, timeline, collection, batches, shipments] = await Promise.all([
    query(`SELECT file_path, caption, uploaded_at FROM images WHERE entity_type = 'product' AND entity_id = $1`, [product.id]),
    query(
      `SELECT stage, status, location, gps_lat, gps_lng, notes, occurred_at
       FROM tracking_history WHERE product_id = $1 ORDER BY occurred_at ASC`,
      [product.id]
    ),
    query(
      `SELECT cr.decision, cr.quality_notes, cr.verified_weight, cr.received_at, cc.center_name, cc.address
       FROM collection_records cr JOIN collection_centers cc ON cc.id = cr.collection_center_id
       WHERE cr.product_id = $1 ORDER BY cr.received_at DESC`,
      [product.id]
    ),
    query(
      `SELECT b.batch_number, b.quantity, b.expiry_date, b.status, w.name AS warehouse_name, w.address AS warehouse_address
       FROM batches b JOIN warehouses w ON w.id = b.warehouse_id
       WHERE b.product_id = $1 ORDER BY b.created_at DESC`,
      [product.id]
    ),
    query(
      `SELECT s.tracking_id AS shipment_tracking_id, s.status, s.estimated_arrival,
              s.current_lat, s.current_lng, s.dispatched_at, s.delivered_at,
              v.vehicle_number, v.vehicle_type
       FROM shipments s LEFT JOIN vehicles v ON v.id = s.vehicle_id
       WHERE s.product_id = $1 ORDER BY s.created_at DESC`,
      [product.id]
    ),
  ]);

  res.status(200).json({
    success: true,
    data: {
      product: {
        trackingId: product.tracking_id,
        cropName: product.crop_name,
        variety: product.variety,
        harvestDate: product.harvest_date,
        status: product.status,
        isOrganic: product.is_organic,
        quantity: product.actual_quantity || product.expected_quantity,
        unit: product.unit,
      },
      farm: {
        name: product.farm_name,
        farmerName: product.farmer_name,
        address: product.farm_address,
        lat: product.farm_lat,
        lng: product.farm_lng,
        soilType: product.soil_type,
        isOrganic: product.farm_organic,
      },
      images: images.rows,
      collectionHistory: collection.rows,
      warehouseHistory: batches.rows,
      shipments: shipments.rows,
      timeline: timeline.rows,
    },
  });
});

module.exports = { trackByTrackingId };
