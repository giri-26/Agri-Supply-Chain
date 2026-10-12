const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

let ioInstance = null;

/**
 * Initializes Socket.IO on the given HTTP server, authenticates
 * connections via the same JWT used for REST calls, and joins each
 * socket to a room named after its role and one named after its user id
 * so events can be targeted precisely (broadcast-to-role or direct).
 */
function initSockets(io) {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.sub;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.role}`);
    logger.info(`Socket connected: user=${socket.userId} role=${socket.role}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user=${socket.userId}`);
    });
  });

  return io;
}

/** Emit an event to a specific user. */
function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

/** Emit an event to every connected user of a given role. */
function emitToRole(role, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`role:${role}`).emit(event, payload);
}

/** Emit an event to everyone connected. */
function emitBroadcast(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}

module.exports = { initSockets, emitToUser, emitToRole, emitBroadcast };
