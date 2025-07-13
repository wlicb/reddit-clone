import { io } from 'socket.io-client';
import { getToken } from '../localStorage';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    // Always try to connect, even if already connected (handles reconnection)
    const token = getToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001', {
      auth: {
        token: token
      },
      // Enable reconnection
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinPost(postId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-post', postId);
      console.log(`Joined post room: ${postId}`);
    }
  }

  leavePost(postId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-post', postId);
      console.log(`Left post room: ${postId}`);
    }
  }

  onNewComment(callback) {
    if (this.socket) {
      this.socket.on('new-comment', (data) => {
        console.log('Received new comment:', data);
        callback(data.comment);
      });
    }
  }

  onCommentUpdate(callback) {
    if (this.socket) {
      this.socket.on('comment-update', (data) => {
        console.log('Received comment update:', data);
        callback(data.comment);
      });
    }
  }

  onCommentDelete(callback) {
    if (this.socket) {
      this.socket.on('comment-delete', (data) => {
        console.log('Received comment delete:', data);
        callback(data.commentId);
      });
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.off('new-comment');
      this.socket.off('comment-update');
      this.socket.off('comment-delete');
    }
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 