const commentsReducer = (state = { comments: [], newCommentId: null }, action) => {
  switch (action.type) {
    case 'SET_COMMENTS':
      return { ...state, comments: action.comments };
    case 'UPDATE_COMMENT':
      return {
        ...state,
        comments: state.comments.map((comment) =>
        comment.id === action.id ? { ...comment, ...action.updates } : comment
        )
      };
    case 'DELETE_COMMENT':
      const deletedFields = { body: null, author_name: null };
      return {
        ...state,
        comments: state.comments.map((comment) =>
        comment.id === action.id ? { ...comment, ...deletedFields } : comment
        )
      };
    case 'SUBMIT_COMMENT_SUCCESS':
      return { 
        ...state, 
        newCommentId: action.newCommentId,
        comments: action.newComment ? [action.newComment, ...state.comments] : state.comments
      };
    case 'ADD_REALTIME_COMMENT':
      // Only add if the comment doesn't already exist
      const commentExists = state.comments.some(comment => comment.id === action.comment.id);
      if (!commentExists) {
        return {
          ...state,
          comments: [...state.comments, action.comment]
        };
      }
      return state;
    case 'UPDATE_REALTIME_COMMENT':
      return {
        ...state,
        comments: state.comments.map((comment) =>
          comment.id === action.comment.id ? { ...comment, ...action.comment } : comment
        )
      };
    case 'DELETE_REALTIME_COMMENT':
      const realtimeDeletedFields = { body: null, author_name: null };
      const result = {
        ...state,
        comments: state.comments.map((comment) =>
        comment.id === parseInt(action.commentId) ? { ...comment, ...realtimeDeletedFields } : comment
        )
      };
      // console.log('result:', result);
      return result;
    case 'CLEAR_NEW_COMMENT_ID':
      return { ...state, newCommentId: null };
    case 'LIKE_COMMENT_SUCCESS':
      return {
        ...state,
        comments: state.comments.map((comment) =>
          parseInt(comment.id) === parseInt(action.commentId)
            ? { ...comment, like_count: parseInt(action.likeCount) || 0, is_liked: action.isLiked }
            : comment
        )
      };
    case 'UNLIKE_COMMENT_SUCCESS':
      return {
        ...state,
        comments: state.comments.map((comment) =>
          parseInt(comment.id) === parseInt(action.commentId)
            ? { ...comment, like_count: parseInt(action.likeCount) || 0, is_liked: action.isLiked }
            : comment
        )
      };
    case 'UPDATE_COMMENT_LIKE':
      console.log('UPDATE_COMMENT_LIKE reducer called with:', {
        commentId: action.commentId,
        likeCount: action.likeCount,
        isLiked: action.isLiked,
        existingComments: state.comments.map(c => ({ id: c.id, like_count: c.like_count }))
      });
      return {
        ...state,
        comments: state.comments.map((comment) => {
          // Convert both to numbers for comparison to handle string/number mismatch
          if (parseInt(comment.id) === parseInt(action.commentId)) {
            console.log('Found matching comment:', comment.id, 'updating like_count to:', action.likeCount);
            const updates = {
              ...comment,
              like_count: parseInt(action.likeCount) || 0, // Ensure it's a number
            };
            // Only update is_liked if it's not null (preserve current user's status)
            if (action.isLiked !== null) {
              updates.is_liked = action.isLiked;
            }
            return updates;
          }
          return comment;
        })
      };
    default:
      return state;
  }
};

export default commentsReducer;
