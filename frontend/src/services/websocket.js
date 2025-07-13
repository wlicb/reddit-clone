import { io } from 'socket.io-client';
import { getToken } from '../localStorage';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners = new Map();
  }

  connect() {
    // Only connect if not already connected
    if (this.socket && (this.isConnected || this.isConnecting)) {
      console.log('WebSocket already connected, skipping connection');
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    console.log('Connecting to WebSocket...');
    this.isConnecting = true;
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
      this.isConnecting = false;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
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

  onUnreadRepliesUpdate(callback) {
    if (this.socket) {
      this.socket.on('unread-replies-update', (data) => {
        // console.log('Received unread replies update:', data);
        callback(data);
      });
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new-notification', (data) => {
        console.log('Received new notification:', data);
        callback(data.notification);
      });
    }
  }

  onNotificationUpdate(callback) {
    if (this.socket) {
      this.socket.on('notification-update', (data) => {
        console.log('Received notification update:', data);
        callback(data);
      });
    }
  }

  onUnreadNotificationCount(callback) {
    if (this.socket) {
      this.socket.on('unread-notification-count', (data) => {
        console.log('Received unread notification count:', data);
        callback(data.count);
      });
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.off('new-comment');
      this.socket.off('comment-update');
      this.socket.off('comment-delete');
      this.socket.off('unread-replies-update');
      this.socket.off('new-notification');
      this.socket.off('notification-update');
      this.socket.off('unread-notification-count');
    }
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 