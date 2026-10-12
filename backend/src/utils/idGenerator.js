const { v4: uuidv4 } = require('uuid');

/**
 * Generates a short, human-readable, unique tracking ID.
 * Format: PREFIX-YYMMDD-XXXXXX  e.g. PRD-260712-4F9A2C
 */
function generateTrackingId(prefix = 'PRD') {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = uuidv4().split('-')[0].toUpperCase();
  return `${prefix}-${yy}${mm}${dd}-${random}`;
}

function generateBatchNumber() {
  return generateTrackingId('BATCH');
}

function generateShipmentTrackingId() {
  return generateTrackingId('SHIP');
}

module.exports = { generateTrackingId, generateBatchNumber, generateShipmentTrackingId };
