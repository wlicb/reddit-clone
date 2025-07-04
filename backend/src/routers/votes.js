const express = require('express')
const { query } = require('../db')
const auth = require('../middleware/auth')()
const adminAuth = require('../middleware/admin_auth')()
const subredditAuth = require('../utils/subreddit_auth')

const { logAction } = require('../db/utils')

const router = express.Router()

const selectPostStatement = `
  select
  p.id, p.type, p.title, p.body, p.created_at, p.updated_at,
  cast(coalesce(sum(pv.vote_value), 0) as int) votes,
  max(upv.vote_value) has_voted,
  (select cast(count(*) as int) from comments c where p.id = c.post_id and c.body is not null) number_of_comments,
  max(u.username) author_name,
  max(sr.name) subreddit_name
  from posts p
  left join users u on p.author_id = u.id
  inner join subreddits sr on p.subreddit_id = sr.id
  left join post_votes pv on p.id = pv.post_id
  left join post_votes upv on p.id = upv.post_id and upv.user_id = $1
  group by p.id
`

const selectCommentStatement = `
  select c.id, c.author_id, c.post_id, c.parent_comment_id, sr.name subreddit_name
  from comments c
  inner join posts p on c.post_id = p.id
  inner join subreddits sr on p.subreddit_id = sr.id
  where c.id = $1
`

const checkVoteType = (voteType) => {
  const types = ['post', 'comment']
  let error
  if (!types.includes(voteType)) {
    error = 'Invalid vote type'
  }
  return { voteType, error }
}

const checkVoteValid = async (item_id, vote_value, vote_type) => {
  let status
  let error
  if (!/^\d+$/.test(item_id)) {
    status = 400
    error = `Invalid ${vote_type} id`
  } else if (![-1, 0, 1].includes(parseInt(vote_value))) {
    status = 400
    error = 'Invalid vote value'
  } else {
    const { rows: [item] } = await query(`select * from ${vote_type}s where id = $1`, [item_id])
    if (!item) {
      status = 404
      error = `Could not find ${vote_type} with that id`
    }
  }

  return { status, error }
}

router.get('/:voteType', auth, adminAuth, async (req, res) => {
  try {
    const { voteType, error } = checkVoteType(req.params.voteType)
    if (error) {
      return res.status(400).send({ error })
    }
    const selectPostVotes = `select * from ${voteType}_votes`
    const { rows } = await query(selectPostVotes)
    res.send(rows)
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

router.post('/:voteType', auth, async (req, res) => {
  try {
    const { voteType, error: voteTypeError } = checkVoteType(req.params.voteType)
    if (voteTypeError) {
      return res.status(400).send({ error: voteTypeError })
    }
    const { item_id, vote_value } = req.body

    console.log(voteType, item_id)

    const user_id = req.user ? req.user.id : -1
    if (voteType === "comment") {
      const { rows: [comment] } = await query(selectCommentStatement, [id])
      const user_id = req.user ? req.user.id : -1
      const post_id = comment.post_id
      const { rows: [post] } = await query(selectPostStatement, [user_id, post_id])
      if (!post) {
        return res.status(404).send({ error: 'Could not find post with that id' })
      }

      let auth = null;
      let { subreddit } = post.subreddit_name
      if (subreddit) {
        try {
          auth = await subredditAuth(req, subreddit);
        } catch (err) {
          return res.status(401).send({ error: err.message });
        }

      }
    }

    const { status, error } = await checkVoteValid(item_id, vote_value, voteType)
    if (error) {
      return res.status(status).send({ error })
    }

    const insertItemVoteStatement = `
      insert into ${voteType}_votes
      values($1, $2, $3) returning *
    `
    let item_vote
    try {
      const { rows: [vote] } = await query(insertItemVoteStatement, [
        req.user.id,
        item_id,
        vote_value
      ])
      item_vote = vote
    } catch (e) {
      const updateItemVoteStatement = `
        update ${voteType}_votes
        set vote_value = $1
        where user_id = $2 and ${voteType}_id = $3
        returning *
      `

      const { rows: [vote] } = await query(updateItemVoteStatement, [
        vote_value,
        req.user.id,
        item_id
      ])
      item_vote = vote
    }

    res.status(201).send(item_vote)
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

// PUT route is no longer needed, as the POST route
// now also updates if it runs into a conflict

// router.put('/:voteType/:item_id', auth, async (req, res) => {
//   try {
//     const { voteType, error: voteTypeError } = checkVoteType(req.params.voteType)
//     if (voteTypeError) {
//       return res.status(400).send({ error: voteTypeError })
//     }
//     const { item_id } = req.params
//     const { vote_value } = req.body

//     const { status, error } = await checkVoteValid(item_id, vote_value, voteType)
//     if (error) {
//       return res.status(status).send({ error })
//     }

//     const updateItemVoteStatement = `
//       update ${voteType}_votes
//       set vote_value = $1
//       where user_id = $2 and ${voteType}_id = $3
//       returning *
//     `

//     const { rows: [item_vote] } = await query(updateItemVoteStatement, [
//       vote_value,
//       req.user.id,
//       item_id
//     ])

//     res.send(item_vote)
//   } catch (e) {
//     res.status(500).send({ error: e.message })
//   }
// })

module.exports = router