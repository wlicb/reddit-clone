const express = require('express')
const { query } = require('../db')
const { updateTableRow, userIsModerator, logAction } = require('../db/utils')
const auth = require('../middleware/auth')()
const optionalAuth = require('../middleware/auth')(true)
const adminAuth = require('../middleware/admin_auth')()
const subredditAuth = require('../utils/subreddit_auth')
const { emitNewComment, emitCommentUpdate, emitCommentDelete, emitUnreadRepliesUpdate, emitNewNotification, emitUnreadNotificationCount } = require('../websocket')

const router = express.Router()

const selectCommentStatement = `
  select c.id, c.author_id, c.post_id, c.parent_comment_id, sr.name subreddit_name,
         u.username author_name, u.isBot author_isBot
  from comments c
  inner join posts p on c.post_id = p.id
  inner join subreddits sr on p.subreddit_id = sr.id
  left join users u on c.author_id = u.id
  where c.id = $1
`

const selectAllCommentsStatement = `
  select
  c.id, c.body, c.post_id, c.parent_comment_id, c.created_at, c.updated_at,
  max(u.username) author_name,
  max(u.isBot) author_isBot
  from comments c
  left join users u on c.author_id = u.id
  group by c.id
`

const selectPostStatement = `
  select
    p.id, p.type, p.title, p.body, p.created_at, p.updated_at,
    max(u.username) author_name,
    max(sr.name) subreddit_name
  from posts p
  left join users u on p.author_id = u.id
  inner join subreddits sr on p.subreddit_id = sr.id
  group by p.id
  having p.id = $1
`


router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const selectCommentsStatement = `select * from comments`
    const { rows } = await query(selectCommentsStatement)
    res.send(rows)
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

router.get('/:post_id', auth, async (req, res) => {
  try {
    const { post_id } = req.params

    const selectCommentsStatement = `
      ${selectAllCommentsStatement}
      having c.post_id = $1
    `
    const { rows: [post] } = await query(selectPostStatement, [post_id])
    const { rows: comments } = await query(selectCommentsStatement, [post_id])


    if (!post) {
      return res.status(404).send({ error: 'Could not find post with that id' })
    }

    let auth = null;
    let subreddit = post.subreddit_name
    if (subreddit) {
      try {
        auth = await subredditAuth(req, subreddit);
      } catch (err) {
        return res.status(401).send({ error: err.message });
      }

    }

    res.send({ post, comments })
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { body, post_id, parent_comment_id } = req.body
    if (!body) {
      throw new Error('Must specify comment body')
    }
    if (!post_id) {
      throw new Error('Must specify post to comment on')
    }

    const { rows: [post] } = await query(selectPostStatement, [post_id])
    if (!post) {
      return res.status(404).send({ error: 'Could not find post with that id' })
    }

    let auth = null;
    let subreddit = post.subreddit_name
    if (subreddit) {
      try {
        auth = await subredditAuth(req, subreddit);
      } catch (err) {
        return res.status(401).send({ error: err.message });
      }

    }

    const insertCommentStatement = `
      insert into comments(body, author_id, post_id, parent_comment_id)
      values($1, $2, $3, $4)
      returning *
    `
    const { rows: [{ id }] } = await query(insertCommentStatement, [
      body,
      req.user.id,
      post_id,
      parent_comment_id
    ])

    // Record mentions and create notifications
    const mentionUsernames = (body.match(/@([a-zA-Z0-9_]+)/g) || []).map(m => m.slice(1));
    if (mentionUsernames.length > 0) {
      // Look up user IDs for mentioned usernames
      const { rows: mentionedUsers } = await query(
        `SELECT id, username FROM users WHERE username = ANY($1)`,
        [mentionUsernames]
      );
      for (const user of mentionedUsers) {
        // Don't notify the comment author about their own mentions
        if (user.id !== req.user.id) {
          await query(
            `INSERT INTO comment_mentions (comment_id, mentioned_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, user.id]
          );
          
          // Create mention notification
          const { rows: [notification] } = await query(
            `INSERT INTO notifications (user_id, type, comment_id, post_id, created_at) 
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [
              user.id,
              'mention',
              id,
              post_id
            ]
          );
          
          // Emit real-time notification
          emitNewNotification(user.id, notification);
          
          // Update unread count for the user
          const { rows: [{ count }] } = await query(
            `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE`,
            [user.id]
          );
          emitUnreadNotificationCount(user.id, count);
        }
      }
    }

    // Create reply notification if this is a reply to another comment
    if (parent_comment_id) {
      const { rows: [parentComment] } = await query(
        `SELECT author_id FROM comments WHERE id = $1`,
        [parent_comment_id]
      );
      
      if (parentComment && parentComment.author_id !== req.user.id) {
        const { rows: [notification] } = await query(
          `INSERT INTO notifications (user_id, type, comment_id, post_id, created_at) 
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING *`,
          [
            parentComment.author_id,
            'reply',
            id,
            post_id
          ]
        );
        
        // Emit real-time notification
        emitNewNotification(parentComment.author_id, notification);
        
        // Update unread count for the user
        const { rows: [{ count }] } = await query(
          `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE`,
          [parentComment.author_id]
        );
        emitUnreadNotificationCount(parentComment.author_id, count);
      }
    }

    // Automatically upvote own comment
    // const createVoteStatement = `insert into comment_votes values ($1, $2, $3)`
    // await query(createVoteStatement, [req.user.id, id, 1])

    const selectInsertedCommentStatement = `
      ${selectAllCommentsStatement}
      having c.id = $1
    `

    await logAction({ userId: req.user.id, action: 'add_comment', targetId: id, targetType: "comment", metadata: { body: body, post_id: post_id, parent_comment_id: parent_comment_id } });
    const { rows: [comment] } = await query(selectInsertedCommentStatement, [id])
    
    // Mark the post as viewed for the comment author (they just wrote a comment, so they've "seen" it)
    await query(
      `INSERT INTO post_views (user_id, post_id, last_viewed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, post_id)
       DO UPDATE SET last_viewed_at = NOW()`,
      [req.user.id, post_id]
    );

    // Emit WebSocket event for new comment
    emitNewComment(post_id, comment)
    
    // Emit unread replies update to all users except the comment author
    // Get the current unread count for all users except the comment author
    const { rows: users } = await query(
      `SELECT DISTINCT u.id 
       FROM users u 
       WHERE u.id != $1`, // Exclude the comment author
      [req.user.id]
    );
    
    for (const user of users) {
      const { rows: [unreadCount] } = await query(
        `SELECT COALESCE(
          (SELECT cast(count(*) as int) 
           FROM comments c 
           LEFT JOIN post_views pv ON pv.post_id = c.post_id AND pv.user_id = $1
           WHERE c.post_id = $2 
             AND c.body IS NOT NULL 
             AND c.created_at > COALESCE(pv.last_viewed_at, '1970-01-01'::timestamptz)
          ), 0
        ) as unread_count`,
        [user.id, post_id]
      );
      
      if (unreadCount && unreadCount.unread_count > 0) {
        emitUnreadRepliesUpdate(user.id, post_id, unreadCount.unread_count);
      }
    }
    
    res.status(201).send(comment)
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    

    const { rows: [comment] } = await query(selectCommentStatement, [id])
    if (!comment) {
      return res.status(404).send({ error: 'Could not find comment with that id' })
    }

    const post_id = comment.post_id
    const user_id = req.user ? req.user.id : -1
    const { rows: [post] } = await query(selectPostStatement, [post_id])
    if (!post) {
      return res.status(404).send({ error: 'Could not find post with that id' })
    }

    let auth = null;
    let subreddit = post.subreddit_name
    if (subreddit) {
      try {
        auth = await subredditAuth(req, subreddit);
      } catch (err) {
        return res.status(401).send({ error: err.message });
      }

    }


    if ((comment.author_id !== req.user.id)
        && (await userIsModerator(req.user.username, comment.subreddit_name) === false)) {
      return res.status(403).send({ error: 'You must be the comment author to edit it' })
    }

    // Get the old comment body to compare mentions
    const { rows: [oldComment] } = await query(
      `SELECT body FROM comments WHERE id = $1`,
      [id]
    );

    const oldBody = oldComment ? oldComment.body : '';
    const newBody = req.body.body;

    // Extract mentions from old and new body
    const oldMentions = (oldBody.match(/@([a-zA-Z0-9_]+)/g) || []).map(m => m.slice(1));
    const newMentions = (newBody.match(/@([a-zA-Z0-9_]+)/g) || []).map(m => m.slice(1));

    // Remove old mentions and their notifications
    if (oldMentions.length > 0) {
      // Get user IDs for old mentions
      const { rows: oldMentionedUsers } = await query(
        `SELECT id, username FROM users WHERE username = ANY($1)`,
        [oldMentions]
      );

      for (const user of oldMentionedUsers) {
        // Remove mention record
        await query(
          `DELETE FROM comment_mentions WHERE comment_id = $1 AND mentioned_user_id = $2`,
          [id, user.id]
        );

      }
    }

    // Add new mentions and create notifications
    if (newMentions.length > 0) {
      // Look up user IDs for mentioned usernames
      const { rows: mentionedUsers } = await query(
        `SELECT id, username FROM users WHERE username = ANY($1)`,
        [newMentions]
      );
      
      for (const user of mentionedUsers) {
        // Don't notify the comment author about their own mentions
        if (user.id !== req.user.id) {
          await query(
            `INSERT INTO comment_mentions (comment_id, mentioned_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, user.id]
          );
          
          // Create mention notification
          const { rows: [notification] } = await query(
            `INSERT INTO notifications (user_id, type, comment_id, post_id, created_at) 
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [
              user.id,
              'mention',
              id,
              post_id
            ]
          );
          
          // Emit real-time notification
          emitNewNotification(user.id, notification);
          
          // Update unread count for the user
          const { rows: [{ count }] } = await query(
            `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE`,
            [user.id]
          );
          emitUnreadNotificationCount(user.id, count);
        }
      }
    }

    const updatedComment = await updateTableRow('comments', id, ['body'], req.body)

    await logAction({ userId: req.user.id, action: 'edit_comment', targetId: id, targetType: "comment", metadata: { body: req.body.body } });

    // Emit WebSocket event for comment update
    emitCommentUpdate(post_id, updatedComment)

    res.send(updatedComment)
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { rows: [comment] } = await query(selectCommentStatement, [id])
    if (!comment) {
      return res.status(404).send({ error: 'Could not find comment with that id' })
    }

    const post_id = comment.post_id
    const user_id = req.user ? req.user.id : -1
    const { rows: [post] } = await query(selectPostStatement, [post_id])
    if (!post) {
      return res.status(404).send({ error: 'Could not find post with that id' })
    }

    let auth = null;
    let subreddit = post.subreddit_name
    if (subreddit) {
      try {
        auth = await subredditAuth(req, subreddit);
      } catch (err) {
        return res.status(401).send({ error: err.message });
      }

    }


    if ((comment.author_id !== req.user.id && req.user.isadmin !== "true")
        && (await userIsModerator(req.user.username, comment.subreddit_name) === false)) {
      return res.status(403).send({ error: 'You must be the comment author to delete it' })
    }

    // Remove all mentions and notifications for this comment
    await query(
      `DELETE FROM comment_mentions WHERE comment_id = $1`,
      [id]
    );

    // const deleteCommentStatement = `delete from comments where id = $1 returning *`
    // const { rows: [deletedComment] } = await query(deleteCommentStatement, [id])
    
    
    const setFieldsToNullStatement = `
      update comments
      set body = null,
          author_id = null
      where id = $1
      returning *
    `

    const { rows: [deletedComment] } = await query(setFieldsToNullStatement, [id])

    await logAction({ userId: req.user.id, action: 'delete_comment', targetId: id, targetType: "comment", metadata: { } });

    // Emit WebSocket event for comment deletion
    emitCommentDelete(post_id, id)

    res.send(deletedComment)
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

module.exports = router