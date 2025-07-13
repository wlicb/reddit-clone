const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for WebSocket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join a post room to receive real-time updates for that post
    socket.on('join-post', (postId) => {
      socket.join(`post-${postId}`);
      console.log(`User ${socket.userId} joined post ${postId}`);
    });

    // Leave a post room
    socket.on('leave-post', (postId) => {
      socket.leave(`post-${postId}`);
      console.log(`User ${socket.userId} left post ${postId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

// Function to emit new comment to all users viewing that post
const emitNewComment = (postId, comment) => {
  if (io) {
    io.to(`post-${postId}`).emit('new-comment', {
      type: 'new-comment',
      comment: comment
    });
  }
};

// Function to emit comment update to all users viewing that post
const emitCommentUpdate = (postId, comment) => {
  if (io) {
    io.to(`post-${postId}`).emit('comment-update', {
      type: 'comment-update',
      comment: comment
    });
  }
};

// Function to emit comment deletion to all users viewing that post
const emitCommentDelete = (postId, commentId) => {
  if (io) {
    io.to(`post-${postId}`).emit('comment-delete', {
      type: 'comment-delete',
      commentId: commentId
    });
  }
};

// Function to emit unread replies update to all users
const emitUnreadRepliesUpdate = (postId, unreadCount) => {
  if (io) {
    io.emit('unread-replies-update', {
      type: 'unread-replies-update',
      postId: postId,
      unreadCount: unreadCount
    });
  }
};

module.exports = {
  initializeWebSocket,
  emitNewComment,
  emitCommentUpdate,
  emitCommentDelete,
  emitUnreadRepliesUpdate
}; 