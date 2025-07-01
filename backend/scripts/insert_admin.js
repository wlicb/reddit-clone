const bcrypt = require('bcrypt');
const { query } = require('../src/db');
require('dotenv').config({ path: './config/dev.env' });

(async () => {
  const username = 'admin';
  const plainPassword = 'admin';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const isAdmin = 'true';
  const isBot = 'false';
  const selectedSubreddit = '';

  const insertUser = `
    INSERT INTO users (username, password, isAdmin, isBot, selectedSubreddit)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    const { rows } = await query(insertUser, [
      username,
      hashedPassword,
      isAdmin,
      isBot,
      selectedSubreddit
    ]);
    console.log('Inserted admin user:', rows[0]);
  } catch (err) {
    console.error('Failed to insert admin user:', err.message);
  } finally {
    process.exit();
  }
})();
