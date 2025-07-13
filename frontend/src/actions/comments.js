import axios from '../axios-config';
import { commentsSelector } from '../selectors';

export const setComments = (comments) => ({
  type: 'SET_COMMENTS',
  comments,
});

export const updateComment = (id, updates) => ({
  type: 'UPDATE_COMMENT',
  id,
  updates,
});

export const deleteComment = (id) => ({
  type: 'DELETE_COMMENT',
  id,
});

export const clearNewCommentId = () => ({
  type: 'CLEAR_NEW_COMMENT_ID',
});

export const addRealTimeComment = (comment) => ({
  type: 'ADD_REALTIME_COMMENT',
  comment,
});

export const updateRealTimeComment = (comment) => ({
  type: 'UPDATE_REALTIME_COMMENT',
  comment,
});

export const deleteRealTimeComment = (commentId) => ({
  type: 'DELETE_REALTIME_COMMENT',
  commentId,
});

export const submitComment = (commentDetails) => async (dispatch, getState) => {
  try {
    const { body, post_id, parent_comment_id } = commentDetails;
    dispatch({ type: 'SUBMIT_COMMENT_REQUEST' });
    const response = await axios.post('/comments', {
      body,
      post_id,
      parent_comment_id,
    });
    dispatch({ type: 'SUBMIT_COMMENT_SUCCESS', newCommentId: response.data.id, newComment: response.data });
    return { payload: response.data };
  } catch (e) {
    dispatch({
      type: 'SUBMIT_COMMENT_FAILURE',
      message: e.message,
      response: e.response,
    });
    throw e;
  }
};
