const express = require('express')
const cors = require('cors')
const http = require('http')

const usersRouter = require('./routers/users')
const postsRouter = require('./routers/posts')
const subredditsRouter = require('./routers/subreddits')
const moderatorsRouter = require('./routers/moderators')
const commentsRouter = require('./routers/comments')
const notificationsRouter = require('./routers/notifications')
const { initializeWebSocket } = require('./websocket')

const port = process.env.PORT

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json())

app.use('/users', usersRouter)
app.use('/posts', postsRouter)
app.use('/subreddits', subredditsRouter)
app.use('/moderators', moderatorsRouter)
app.use('/comments', commentsRouter)
app.use('/notifications', notificationsRouter)

// Initialize WebSocket server
initializeWebSocket(server)

server.listen(port, '0.0.0.0', () => {
  console.log(`App is listening on port ${port}`)
})