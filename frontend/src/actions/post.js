import axios from '../axios-config';

export const setPost = (post) => ({
  type: 'SET_POST',
  post,
});

export const editPost = (id, updates) => ({
  type: 'EDIT_POST',
  id,
  updates,
});

export const deletePost = (id) => ({
  type: 'DELETE_POST',
  id,
});

export const getPost = (postId) => async (dispatch) => {
  try {
    dispatch({ type: 'GET_POST_REQUEST' });
    const response = await axios.get(`/posts/${postId}`);
    dispatch({ 
      type: 'GET_POST_SUCCESS', 
      payload: response.data 
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: 'GET_POST_FAILURE',
      payload: error.response?.data?.error || 'Failed to fetch post'
    });
    throw error;
  }
};

export const submitPost = (postDetails) => async (dispatch) => {
  const { type, title, body, subreddit } = postDetails;
  try {
    dispatch({ type: 'SUBMIT_POST_REQUEST' });
    const response = await axios.post('/posts', {
      type,
      title,
      body,
      subreddit,
    });
    dispatch({ type: 'SUBMIT_POST_SUCCESS' });
    return response.data;
  } catch (e) {
    dispatch({
      type: 'SUBMIT_POST_FAILURE',
      message: e.message,
      respones: e.response,
    });
  }
};

export const markPostAsViewed = (postId) => async (dispatch) => {
  try {
    console.log(`Marking post ${postId} as viewed`);
    await axios.post(`/posts/${postId}/view`);
    // Optionally dispatch an action to update the post list
    dispatch({ type: 'MARK_POST_VIEWED', postId });
  } catch (error) {
    console.error('Failed to mark post as viewed:', error);
  }
};
