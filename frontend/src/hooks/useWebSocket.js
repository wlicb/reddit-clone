import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import webSocketService from '../services/websocket';
import { addRealTimeComment, updateRealTimeComment, deleteRealTimeComment } from '../actions/comments';
import { userSelector } from '../selectors';

export const useWebSocket = (postId) => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector);
  const isConnected = useRef(false);

  useEffect(() => {
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

    // Set up event listeners
    webSocketService.onNewComment((comment) => {
      console.log('Adding real-time comment:', comment);
      // Don't add the comment if it's from the current user (to avoid duplication)
      if (!user || comment.author_name !== user.username) {
        dispatch(addRealTimeComment(comment));
      }
    });

    webSocketService.onCommentUpdate((comment) => {
      console.log('Updating real-time comment:', comment);
      dispatch(updateRealTimeComment(comment));
    });

    webSocketService.onCommentDelete((commentId) => {
      console.log('Deleting real-time comment:', commentId);
      dispatch(deleteRealTimeComment(commentId));
    });

    // Cleanup function
    return () => {
      if (postId) {
        webSocketService.leavePost(postId);
      }
      webSocketService.removeAllListeners();
    };
  }, [dispatch, postId, user]);

  return webSocketService;
}; 