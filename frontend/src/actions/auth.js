import axios from '../axios-config';
import { editPost } from './post';
import { setPostList } from './postList';
import { setComments } from './comments';
import { commentsSelector, postListSelector, userSelector } from '../selectors';

export const login = (user, token) => ({
  type: 'LOGIN',
  user,
  token,
});

export const logout = () => ({ type: 'LOGOUT' });

export const startLogin = (username, password) => async (dispatch) => {
  try {
    dispatch({ type: 'LOGIN_REQUEST' });
    const response = await axios.post('/users/login', {
      username,
      password,
    });
    const { user, token } = response.data;
    console.log(user)
    dispatch(login(user, token));
    dispatch({ type: 'LOGIN_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'LOGIN_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};

export const startLogout = () => async (dispatch) => {
  try {
    dispatch({ type: 'LOGOUT_REQUEST' });
    await axios.post('/users/logout');
    dispatch(logout());
    dispatch({ type: 'LOGOUT_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'LOGOUT_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};

export const startRegister = (username, password, isAdmin, isBot, selectedSubreddit) => async (dispatch, getState) => {
  try {
    dispatch({ type: 'REGISTER_REQUEST' });
    console.log({
      username,
      password,
      isAdmin, 
      isBot, 
      selectedSubreddit
    })
    const registeredBy = userSelector(getState()).id
    const response = await axios.post('/users', {
      username,
      password,
      isAdmin, 
      isBot, 
      selectedSubreddit,
      registeredBy
    });
    const { user, token } = response.data;
    dispatch(login(user, token));
    dispatch({ type: 'REGISTER_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'REGISTER_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};
