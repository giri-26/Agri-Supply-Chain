/* eslint-disable no-console */
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script)], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

(async () => {
  try {
    await run('initDb.js');
    await run('seedDb.js');
    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
})();
