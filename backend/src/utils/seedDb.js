/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function seedDb() {
  const seedPath = path.join(__dirname, '../../../database/seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  console.log('Applying seed.sql...');
  await pool.query(seedSql);
  console.log('Seed data inserted successfully.');
  console.log('Default admin login -> email: admin@agrichain.local | password: Admin@12345');
  console.log('IMPORTANT: change this password immediately after first login.');
  await pool.end();
}

seedDb().catch((err) => {
  console.error('Failed to seed database:', err.message);
  process.exit(1);
});
