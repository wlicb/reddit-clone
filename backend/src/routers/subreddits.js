const express = require('express')
const { query } = require('../db')
const auth = require('../middleware/auth')()
const adminAuth = require('../middleware/admin_auth')()
const subredditAuth = require('../utils/subreddit_auth')


const { logAction } = require('../db/utils')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const selectSubredditsStatement = `select * from subreddits`
    const { rows } = await query(selectSubredditsStatement)
    let results = []
    for (const row of rows) {
      let auth = null;
      let subreddit = row.name
      if (subreddit) {
        try {
          auth = await subredditAuth(req, subreddit);
        } catch (err) {
          continue
        }

      }
      results.push(row)
    }
    res.send(results)
  } catch (e) {
    console.log(e)
    res.status(500).send({ error: e.message })
  }
})

router.get('/:name', auth, async (req, res) => {
  try {
    const { name } = req.params
    const selectSubredditStatement = `select * from subreddits where name = $1`
    const {
      rows: [subreddit],
    } = await query(selectSubredditStatement, [name])

    if (!subreddit) {
      res.status(404).send({ error: 'Could not find subreddit with that name' })
    }
    let auth = null;
    if (subreddit) {
      try {
        auth = await subredditAuth(req, subreddit.name);
      } catch (err) {
        return res.status(401).send({ error: err.message });
      }

    }

    res.send(subreddit)
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body

    // const nameRegex = new RegExp('^[a-z0-9]+$', 'i')

    // if (!nameRegex.test(name)) {
    //   throw new Error(
    //     'Subreddit name must consist only of alphanumeric characters, and must have length at least 1'
    //   )
    // }

    const insertSubredditStatement = `
      insert into subreddits(name, description)
      values($1, $2)
      returning *
    `

    let subreddit
    try {
      ;({
        rows: [subreddit],
      } = await query(insertSubredditStatement, [name, description]))
    } catch (e) {
      res
        .status(409)
        .send({ error: 'A subreddit with that name already exists' })
    }

    const insertModeratorStatement = `
      insert into moderators(user_id, subreddit_id)
      values($1, $2)
    `

    await query(insertModeratorStatement, [req.user.id, subreddit.id])

    await logAction({ userId: req.user.id, action: 'add_subreddit', targetId: subreddit.id, targetType: "subreddit", metadata: { name: name, description: description } });

    res.send(subreddit)
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

router.get('/:name/users', auth, async (req, res) => {
  try {
    const { name } = req.params
    
    // First verify the subreddit exists
    const selectSubredditStatement = `select * from subreddits where name = $1`
    const {
      rows: [subreddit],
    } = await query(selectSubredditStatement, [name])

    if (!subreddit) {
      return res.status(404).send({ error: 'Could not find subreddit with that name' })
    }

    // Check if user has access to this subreddit
    try {
      await subredditAuth(req, subreddit.name);
    } catch (err) {
      return res.status(401).send({ error: err.message });
    }

    // Get only user IDs and usernames for users with selectedsubreddit === this subreddit's name and all admin users, excluding current user
    const selectUsersStatement = `
      SELECT id, username FROM users 
      WHERE (selectedsubreddit = $1 OR isadmin = 'true') AND id != $2
      ORDER BY username
    `
    
    const { rows: users } = await query(selectUsersStatement, [name, req.user.id])
    
    res.send(users)
  } catch (e) {
    console.log(e)
    res.status(500).send({ error: e.message })
  }
})

module.exports = router
