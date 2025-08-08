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

export const likeComment = (commentId) => async (dispatch) => {
  try {
    dispatch({ type: 'LIKE_COMMENT_REQUEST', commentId });
    const response = await axios.post(`/comments/${commentId}/like`);
    dispatch({ 
      type: 'LIKE_COMMENT_SUCCESS', 
      commentId, 
      likeCount: response.data.like_count,
      isLiked: response.data.is_liked 
    });
    return response.data;
  } catch (e) {
    dispatch({
      type: 'LIKE_COMMENT_FAILURE',
      commentId,
      message: e.message,
      response: e.response,
    });
    throw e;
  }
};

export const unlikeComment = (commentId) => async (dispatch) => {
  try {
    dispatch({ type: 'UNLIKE_COMMENT_REQUEST', commentId });
    const response = await axios.delete(`/comments/${commentId}/like`);
    dispatch({ 
      type: 'UNLIKE_COMMENT_SUCCESS', 
      commentId, 
      likeCount: response.data.like_count,
      isLiked: response.data.is_liked 
    });
    return response.data;
  } catch (e) {
    dispatch({
      type: 'UNLIKE_COMMENT_FAILURE',
      commentId,
      message: e.message,
      response: e.response,
    });
    throw e;
  }
};

export const updateCommentLike = (commentId, likeCount, isLiked) => ({
  type: 'UPDATE_COMMENT_LIKE',
  commentId,
  likeCount,
  isLiked,
});
