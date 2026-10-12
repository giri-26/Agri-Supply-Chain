require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const { initSockets } = require('./src/sockets');
const { pool } = require('./src/config/db');

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.corsOrigins,
    credentials: true,
  },
});
initSockets(io);

async function start() {
  try {
    // Fail fast if the database is unreachable rather than starting a broken server.
    await pool.query('SELECT 1');
    logger.info('Database connection verified.');

    // Bind to 0.0.0.0 so other devices on the LAN can reach this server
    // via http://SERVER_LOCAL_IP:PORT
    httpServer.listen(env.port, '0.0.0.0', () => {
      logger.info(`Server running on port ${env.port}`);
      logger.info(`Local:   http://localhost:${env.port}`);
      logger.info(`LAN:     http://${env.serverLocalIp}:${env.port}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await pool.end();
  httpServer.close(() => process.exit(0));
});

start();
