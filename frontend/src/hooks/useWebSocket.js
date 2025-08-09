import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@chakra-ui/react';
import webSocketService from '../services/websocket';
import { addRealTimeComment, updateRealTimeComment, deleteRealTimeComment, updateCommentLike } from '../actions/comments';
import { 
  addRealTimeNotification, 
  updateRealTimeNotification, 
  updateUnreadNotificationCount 
} from '../actions/notifications';
import { updateUnreadReplies } from '../actions/postList';
import { userSelector } from '../selectors';

// Global flag to track if any component is showing toasts
let globalToastShown = false;
let lastNotificationId = null;

export const useWebSocket = (postId, showToasts = false) => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector);
  const toast = useToast();
  const isConnected = useRef(false);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      return;
    }

    // Always connect to WebSocket immediately when component mounts
    webSocketService.connect();
    isConnected.current = true;

    // Join the post room immediately if postId is available
    if (postId) {
      // Small delay to ensure connection is established
      setTimeout(() => {
        webSocketService.joinPost(postId);
      }, 100);
    }

    // --- NEW COMMENT LISTENER (add/remove only this callback) ---
    const handleNewComment = (data) => {
      const comment = data.comment ? data.comment : data; // support both callback signatures
      // Don't add the comment if it's from the current user (to avoid duplication)
      if (!user || comment.author_name !== user.username) {
        dispatch(addRealTimeComment(comment));
      }
    };
    webSocketService.onNewComment(handleNewComment);

    // Other listeners (not yet refactored)
    webSocketService.onCommentUpdate((comment) => {
      console.log('Updating real-time comment:', comment);
      dispatch(updateRealTimeComment(comment));
    });

    webSocketService.onCommentDelete((commentId) => {
      console.log('Deleting real-time comment:', commentId);
      dispatch(deleteRealTimeComment(commentId));
    });

    const handleCommentLikeUpdate = (data) => {
      // console.log('Received comment like update:', data);
      // Only update the like count, keep the current user's like status unchanged
      dispatch(updateCommentLike(data.commentId, data.likeCount, null));
    };  
    webSocketService.onCommentLikeUpdate(handleCommentLikeUpdate);

    // Set up notification event listeners
    webSocketService.onNewNotification((notification) => {
      console.log('Received real-time notification:', notification);
      dispatch(addRealTimeNotification(notification));
      // Show toast only if showToasts is true and we haven't shown this notification yet
      if (showToasts && lastNotificationId !== notification.id && !globalToastShown) {
        lastNotificationId = notification.id;
        globalToastShown = true;
        let description = 'You have a new notification';
        if (notification.type === 'mention') {
          description = 'Someone mentioned you in a comment';
        } else if (notification.type === 'reply') {
          description = 'Someone replied to your comment';
        }
        toast({
          title: 'New Notification',
          description,
          status: 'info',
          duration: 2000,
          isClosable: true,
          position: 'top-right',
        });
        
        // Reset the flag after a short delay
        setTimeout(() => {
          globalToastShown = false;
        }, 100);
      }
    });

    webSocketService.onNotificationUpdate((data) => {
      console.log('Received notification update:', data);
      dispatch(updateRealTimeNotification(data.notificationId, data.updates));
    });

    webSocketService.onUnreadNotificationCount((count) => {
      console.log('Received unread notification count update:', count);
      dispatch(updateUnreadNotificationCount(count));
    });

    // Set up unread replies event listeners
    webSocketService.onUnreadRepliesUpdate((data) => {
      console.log('Received unread replies update:', data);
      dispatch(updateUnreadReplies(data.postId, data.unreadCount));
    });

    // Cleanup function
    return () => {
      if (postId) {
        webSocketService.leavePost(postId);
      }
      // Don't remove all listeners since they might be needed by other components
      // webSocketService.removeAllListeners();
      webSocketService.offNewComment(handleNewComment);
      webSocketService.offCommentLikeUpdate(handleCommentLikeUpdate);
    };
  }, [dispatch, postId, user, toast]);

  return webSocketService;
}; 