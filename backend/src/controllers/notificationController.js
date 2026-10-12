const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const data = await notificationService.listForUser(req.user.id, { page: Number(page), limit: Number(limit) });
  res.status(200).json({ success: true, data });
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Notification marked as read' });
});

module.exports = { list, markRead };
