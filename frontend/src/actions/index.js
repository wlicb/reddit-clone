import axios from '../axios-config';
import { setPost, editPost, deletePost } from './post';
import { setComments, updateComment, deleteComment } from './comments';
import { postListSelector, commentsSelector, postSelector } from '../selectors';

export const getPostAndComments = (id) => async (dispatch) => {
  try {
    dispatch({ type: 'GET_POST_AND_COMMENTS_REQUEST' });
    const response = await axios.get(`/comments/${id}`);
    dispatch(setPost(response.data.post));
    dispatch(setComments(response.data.comments));
    dispatch({ type: 'GET_POST_AND_COMMENTS_SUCCESS' });
  } catch (e) {
    dispatch({ type: 'GET_POST_AND_COMMENTS_FAILURE', message: e.message });
  }
};

export const startEditPost = ({ id, body }) => async (dispatch) => {
  try {
    dispatch({ type: 'EDIT_POST_REQUEST' });
    await axios.put(`/posts/${id}`, { body });
    dispatch(editPost(id, { body }));

    dispatch({ type: 'EDIT_POST_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'EDIT_POST_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};

export const startDeletePost = (id) => async (dispatch) => {
  try {
    dispatch({ type: 'DELETE_POST_REQUEST' });
    await axios.delete(`/posts/${id}`);
    dispatch(deletePost(id));
    dispatch({ type: 'DELETE_POST_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'DELETE_POST_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};

export const startEditComment = ({ id, body }) => async (dispatch) => {
  try {
    dispatch({ type: 'EDIT_COMMENT_REQUEST' });
    await axios.put(`/comments/${id}`, { body });
    dispatch(updateComment(id, { body }));
    dispatch({ type: 'EDIT_COMMENT_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'EDIT_COMMENT_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};

export const startDeleteComment = (id) => async (dispatch) => {
  try {
    dispatch({ type: 'DELETE_COMMENT_REQUEST' });
    await axios.delete(`/comments/${id}`);
    dispatch(deleteComment(id));
    dispatch({ type: 'DELETE_COMMENT_SUCCESS' });
  } catch (e) {
    dispatch({
      type: 'DELETE_COMMENT_FAILURE',
      message: e.message,
      response: e.response,
    });
  }
};


