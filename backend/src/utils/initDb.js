/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const DATABASE_ROOT = path.join(__dirname, '../../../database');
const SCHEMA_FILE = path.join(DATABASE_ROOT, 'schema.sql');
const MIGRATIONS_DIR = path.join(DATABASE_ROOT, 'migrations');

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function isApplied(client, id) {
  const result = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function markApplied(client, id) {
  await client.query('INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [id]);
}

async function applySqlFile(client, filePath, id) {
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) return;

  console.log(`Applying ${id}...`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await markApplied(client, id);
    await client.query('COMMIT');
    console.log(`Applied ${id}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function initDb() {
  const client = await pool.connect();
  try {
    await ensureMigrationTable(client);

    // schema.sql predates the migration system and creates the base tables.
    // Apply it only when the base `roles` table does not exist, so running
    // db:init again will not try to recreate existing tables.
    const baseSchemaExists = await tableExists(client, 'roles');
    if (!baseSchemaExists) {
      await applySqlFile(client, SCHEMA_FILE, '000_schema.sql');
    } else if (!(await isApplied(client, '000_schema.sql'))) {
      await markApplied(client, '000_schema.sql');
    }

    if (fs.existsSync(MIGRATIONS_DIR)) {
      const migrations = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of migrations) {
        const id = file;
        if (!(await isApplied(client, id))) {
          await applySqlFile(client, path.join(MIGRATIONS_DIR, file), id);
        }
      }
    }

    console.log('Database initialization/migrations completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

initDb().catch((err) => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
