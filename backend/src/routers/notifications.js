const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth')();
const adminAuth = require('../middleware/admin_auth')();

const router = express.Router();

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT n.*, c.body AS comment_body
       FROM notifications n
       JOIN comments c ON n.comment_id = c.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.send(rows);
  } catch (e) {
    console.log(e)
    res.status(500).send({ error: e.message });
  }
});

// Mark notifications as read
router.post('/read', auth, async (req, res) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ error: 'Must provide an array of notification ids' });
    }
    await query(
      `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND id = ANY($2)`,
      [req.user.id, ids]
    );
    res.send({ success: true });
  } catch (e) {
    console.log(e)
    res.status(500).send({ error: e.message });
  }
});

// Get unread notification count
router.get('/unread_count', auth, async (req, res) => {
  try {
    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [req.user.id]
    );
    res.send({ count });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// (Optional) Delete a notification
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    res.send({ success: true });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// (Optional) Get a single notification
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: [notification] } = await query(
      `SELECT n.*, c.body AS comment_body
       FROM notifications n
       JOIN comments c ON n.comment_id = c.id
       WHERE n.user_id = $1 AND n.id = $2`,
      [req.user.id, id]
    );
    if (!notification) {
      return res.status(404).send({ error: 'Notification not found' });
    }
    res.send(notification);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = router; 