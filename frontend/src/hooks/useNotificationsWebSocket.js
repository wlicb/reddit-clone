import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import webSocketService from '../services/websocket';
import { 
  addRealTimeNotification, 
  updateRealTimeNotification, 
  updateUnreadNotificationCount 
} from '../actions/notifications';

export const useNotificationsWebSocket = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to WebSocket
    webSocketService.connect();

    // Set up event listeners for real-time notifications
    webSocketService.onNewNotification((notification) => {
      console.log('Received real-time notification:', notification);
      dispatch(addRealTimeNotification(notification));
    });

    webSocketService.onNotificationUpdate((data) => {
      console.log('Received notification update:', data);
      dispatch(updateRealTimeNotification(data.notificationId, data.updates));
    });

    webSocketService.onUnreadNotificationCount((count) => {
      console.log('Received unread notification count update:', count);
      dispatch(updateUnreadNotificationCount(count));
    });

    // Cleanup function
    return () => {
      webSocketService.removeAllListeners();
    };
  }, [dispatch]);

  return webSocketService;
}; 