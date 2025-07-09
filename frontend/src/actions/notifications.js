import axios from '../axios-config';

// Action types
export const FETCH_NOTIFICATIONS_REQUEST = 'FETCH_NOTIFICATIONS_REQUEST';
export const FETCH_NOTIFICATIONS_SUCCESS = 'FETCH_NOTIFICATIONS_SUCCESS';
export const FETCH_NOTIFICATIONS_FAILURE = 'FETCH_NOTIFICATIONS_FAILURE';

export const MARK_NOTIFICATION_READ_REQUEST = 'MARK_NOTIFICATION_READ_REQUEST';
export const MARK_NOTIFICATION_READ_SUCCESS = 'MARK_NOTIFICATION_READ_SUCCESS';
export const MARK_NOTIFICATION_READ_FAILURE = 'MARK_NOTIFICATION_READ_FAILURE';

// Action creators
export const fetchNotifications = () => async (dispatch) => {
  dispatch({ type: FETCH_NOTIFICATIONS_REQUEST });
  
  try {
    const response = await axios.get('/notifications');
    dispatch({
      type: FETCH_NOTIFICATIONS_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_NOTIFICATIONS_FAILURE,
      payload: error.response?.data?.error || 'Failed to fetch notifications'
    });
  }
};

export const markNotificationAsRead = (notificationId) => async (dispatch) => {
  dispatch({ type: MARK_NOTIFICATION_READ_REQUEST });
  
  try {
    const response = await axios.post(`/notifications/read`, { ids: [notificationId] });
    dispatch({
      type: MARK_NOTIFICATION_READ_SUCCESS,
      payload: notificationId
    });
  } catch (error) {
    dispatch({
      type: MARK_NOTIFICATION_READ_FAILURE,
      payload: error.response?.data?.error || 'Failed to mark notification as read'
    });
    throw error;
  }
};

export const getUnreadCount = () => async (dispatch) => {
  try {
    const response = await axios.get('/notifications/unread_count');
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}; 