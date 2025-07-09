import {
  FETCH_NOTIFICATIONS_REQUEST,
  FETCH_NOTIFICATIONS_SUCCESS,
  FETCH_NOTIFICATIONS_FAILURE,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE
} from '../actions/notifications';

const initialState = {
  notifications: [],
  loading: false,
  error: null,
  markingRead: null
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
    
    default:
      return state;
  }
};

export default notificationsReducer; 