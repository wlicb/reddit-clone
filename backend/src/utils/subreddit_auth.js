const jwt = require('jsonwebtoken');
const { query } = require('../db');

async function subredditAuth(req, subreddit, optional = false) {
  try {
    const token = req.get('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token');

    const { id } = await jwt.verify(token, process.env.JWT_SECRET);

    const { rows: [user] } = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (!user || !user.tokens.includes(token) || (user.selectedsubreddit !== subreddit && user.isadmin !== "true")) {
      throw new Error('You are only allowed to access your assigned subreddit');
    }

    return { user, token };
  } catch (e) {
    if (optional) return null;
    throw e;
  }
}

module.exports = subredditAuth;
