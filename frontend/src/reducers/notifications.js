import {
  FETCH_NOTIFICATIONS_REQUEST,
  FETCH_NOTIFICATIONS_SUCCESS,
  FETCH_NOTIFICATIONS_FAILURE,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE,
  ADD_REAL_TIME_NOTIFICATION,
  UPDATE_REAL_TIME_NOTIFICATION,
  UPDATE_UNREAD_NOTIFICATION_COUNT
} from '../actions/notifications';

const initialState = {
  notifications: [],
  loading: false,
  error: null,
  markingRead: null,
  unreadCount: 0
};

const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_NOTIFICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case FETCH_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: action.payload,
        error: null
      };
    
    case FETCH_NOTIFICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case MARK_NOTIFICATION_READ_REQUEST:
      return {
        ...state,
        markingRead: action.payload
      };
    
    case MARK_NOTIFICATION_READ_SUCCESS:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
        markingRead: null
      };
    
    case MARK_NOTIFICATION_READ_FAILURE:
      return {
        ...state,
        markingRead: null
      };
    
    case ADD_REAL_TIME_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case UPDATE_REAL_TIME_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.notificationId
            ? { ...notification, ...action.payload.updates }
            : notification
        )
      };
    
    case UPDATE_UNREAD_NOTIFICATION_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };
    
    default:
      return state;
  }
};

export default notificationsReducer; 