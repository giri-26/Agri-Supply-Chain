const { query } = require('../config/db');
const { emitToUser, emitToRole, emitBroadcast } = require('../sockets');

/**
 * Persists a notification and pushes it in real time.
 * Pass either userId (direct), role (broadcast to a role), or neither (global).
 */
async function notify({ userId = null, role = null, type, title, message }) {
  let roleId = null;
  if (role) {
    const roleResult = await query(`SELECT id FROM roles WHERE name = $1`, [role]);
    roleId = roleResult.rows[0]?.id || null;
  }

  const result = await query(
    `INSERT INTO notifications (user_id, role_id, type, title, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, roleId, type, title, message]
  );

  const notification = result.rows[0];

  if (userId) emitToUser(userId, 'notification', notification);
  else if (role) emitToRole(role, 'notification', notification);
  else emitBroadcast('notification', notification);

  return notification;
}

async function listForUser(userId, { page = 1, limit = 30 } = {}) {
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT n.* FROM notifications n
     LEFT JOIN users u ON u.id = $1
     WHERE n.user_id = $1 OR n.role_id = u.role_id OR (n.user_id IS NULL AND n.role_id IS NULL)
     ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

async function markRead(notificationId, userId) {
  await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`, [
    notificationId,
    userId,
  ]);
}

module.exports = { notify, listForUser, markRead };
