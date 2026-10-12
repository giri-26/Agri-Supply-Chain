const { query } = require('../config/db');
const logger = require('./logger');

/**
 * Records an auditable action into activity_logs.
 * Failures here are logged but never thrown, so audit logging
 * can never break the primary request flow.
 */
async function logActivity({ userId = null, action, entityType = null, entityId = null, ipAddress = null, metadata = null }) {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, ipAddress, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    logger.error(`Failed to write activity log for action "${action}": ${err.message}`);
  }
}

module.exports = { logActivity };
