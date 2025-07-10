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
    case 'CLEAR_NEW_COMMENT_ID':
      return { ...state, newCommentId: null };
    default:
      return state;
  }
};

export default commentsReducer;
