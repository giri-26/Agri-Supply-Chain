const asyncHandler = require('../utils/asyncHandler');
const analyticsModel = require('../models/analyticsModel');

const overview = asyncHandler(async (req, res) => {
  const data = await analyticsModel.overviewCards();
  res.status(200).json({ success: true, data });
});

const ordersChart = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 14;
  const data = await analyticsModel.ordersOverTime(days);
  res.status(200).json({ success: true, data });
});

const shipmentsChart = asyncHandler(async (req, res) => {
  const data = await analyticsModel.shipmentStatusBreakdown();
  res.status(200).json({ success: true, data });
});

const productsChart = asyncHandler(async (req, res) => {
  const data = await analyticsModel.productStatusBreakdown();
  res.status(200).json({ success: true, data });
});

module.exports = { overview, ordersChart, shipmentsChart, productsChart };
