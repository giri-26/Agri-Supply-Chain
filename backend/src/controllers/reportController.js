const ExcelJS = require('exceljs');
const asyncHandler = require('../utils/asyncHandler');
const reportModel = require('../models/reportModel');

async function exportExcel(res, sheetName, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  if (rows.length > 0) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 22 }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${sheetName.replace(/\s+/g, '_')}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

const sales = asyncHandler(async (req, res) => {
  const { period = 'daily', format } = req.query;
  const data = await reportModel.salesSummary(period);
  if (format === 'excel') return exportExcel(res, `Sales Report (${period})`, data);
  res.status(200).json({ success: true, data });
});

const farmers = asyncHandler(async (req, res) => {
  const data = await reportModel.farmerReport();
  if (req.query.format === 'excel') return exportExcel(res, 'Farmer Report', data);
  res.status(200).json({ success: true, data });
});

const products = asyncHandler(async (req, res) => {
  const data = await reportModel.productReport();
  if (req.query.format === 'excel') return exportExcel(res, 'Product Report', data);
  res.status(200).json({ success: true, data });
});

const shipments = asyncHandler(async (req, res) => {
  const data = await reportModel.shipmentReport();
  if (req.query.format === 'excel') return exportExcel(res, 'Shipment Report', data);
  res.status(200).json({ success: true, data });
});

const inventory = asyncHandler(async (req, res) => {
  const data = await reportModel.inventoryReport();
  if (req.query.format === 'excel') return exportExcel(res, 'Inventory Report', data);
  res.status(200).json({ success: true, data });
});

module.exports = { sales, farmers, products, shipments, inventory };
