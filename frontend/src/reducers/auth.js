import { loadState, saveState } from '../localStorage';

const initialState = loadState('authState') || {};

const authReducer = (state = initialState, action) => {
  let newState;
  
  switch (action.type) {
    case 'LOGIN':
      const { user, token } = action;
      newState = { user, token };
      break;
    case 'LOGOUT':
      newState = {};
      break;
    default:
      newState = state;
  }
  
  // Save state to localStorage after each action
  saveState(newState, 'authState');
  
  return newState;
};

export default authReducer;
