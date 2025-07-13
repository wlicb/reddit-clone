import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Box, Text, Flex, Badge } from '@chakra-ui/react';
import ChatComment from './ChatComment';

const ChatFlattenedComments = forwardRef(({ comments, subredditName }, ref) => {
  // First, create a map of all comments for easy lookup
  const createCommentMap = (commentList) => {
    const commentMap = new Map();
    
    const addToMap = (comments) => {
      comments.forEach(comment => {
        commentMap.set(comment.id, comment);
        if (comment.children && comment.children.length > 0) {
          addToMap(comment.children);
        }
      });
    };
    
    addToMap(commentList);
    return commentMap;
  };

  const commentMap = createCommentMap(comments);
  
  // Flatten the tree structure into a single array and sort by creation time
  const flattenComments = (commentList) => {
    let flattened = [];
    
    commentList.forEach(comment => {
      // Add the current comment with parent info
      flattened.push({
        ...comment,
        parentComment: comment.parent_comment_id ? 
          commentMap.get(comment.parent_comment_id) : null
      });
      
      // Recursively flatten children
      if (comment.children && comment.children.length > 0) {
        flattened = flattened.concat(flattenComments(comment.children));
      }
    });
    
    return flattened;
  };

  const flattenedComments = flattenComments(comments);
  
  // Sort by creation time (oldest first)
  const sortedComments = flattenedComments.sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  // Function to remove highlight from currently highlighted comment
  const removeHighlight = () => {
    if (highlightedCommentRef.current) {
      const element = highlightedCommentRef.current;
      element.style.backgroundColor = '';
      element.style.border = '';
      element.style.borderRadius = '';
      element.style.boxShadow = '';
      element.style.transform = '';
      element.style.padding = '';
      element.style.margin = '';
      element.style.transition = '';
      highlightedCommentRef.current = null;
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  };

  // Create refs for highlighting
  const highlightedCommentRef = useRef(null);
  const highlightTimeoutRef = useRef(null);

  // Update highlight color on color mode change
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      if (highlightedCommentRef.current) {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const highlightColor = isDarkMode ? '#22304a' : '#e3f2fd';
        highlightedCommentRef.current.style.setProperty('background-color', highlightColor, 'important');
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Function to scroll to a specific comment
  const scrollToComment = (commentId) => {
    // Find the comment element using data-comment-id attribute
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    
    console.log('scrollToComment called with:', commentId);
    console.log('Found element:', commentElement);
    
    if (commentElement) {
      // Remove highlight from previously highlighted comment
      removeHighlight();
      
      // Scroll to the comment first
      commentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add subtle highlight effect
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      const highlightColor = isDarkMode ? '#22304a' : '#e3f2fd';
      commentElement.style.setProperty('background-color', highlightColor, 'important');
      commentElement.style.border = '1px solid #3182ce';
      commentElement.style.borderRadius = '6px';
      commentElement.style.boxShadow = '0 2px 8px rgba(49, 130, 206, 0.15)';
      commentElement.style.padding = '8px';
      commentElement.style.margin = '-8px';
      commentElement.style.transition = 'all 0.3s ease';
      
      console.log('Applied styles to element:', commentElement);
      console.log('Background color set to:', commentElement.style.backgroundColor);
      
      // Track this as the currently highlighted comment
      highlightedCommentRef.current = commentElement;
      
      // Remove effects after 3 seconds
      highlightTimeoutRef.current = setTimeout(() => {
        removeHighlight();
      }, 3000);
    } else {
      console.log('Element not found for comment ID:', commentId);
    }
  };

  // Function to highlight a comment (used by citation clicks)
  const highlightComment = (commentId) => {
    // Find the comment element using data-comment-id attribute
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      // Remove highlight from previously highlighted comment
      removeHighlight();
      
      // Scroll to the comment first
      commentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add subtle highlight effect
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      const highlightColor = isDarkMode ? '#22304a' : '#e3f2fd';
      commentElement.style.setProperty('background-color', highlightColor, 'important');
      commentElement.style.border = '1px solid #3182ce';
      commentElement.style.borderRadius = '6px';
      commentElement.style.boxShadow = '0 2px 8px rgba(49, 130, 206, 0.15)';
      commentElement.style.padding = '8px';
      commentElement.style.margin = '-8px';
      commentElement.style.transition = 'all 0.3s ease';
      
      // Track this as the currently highlighted comment
      highlightedCommentRef.current = commentElement;
      
      // Remove effects after 3 seconds
      highlightTimeoutRef.current = setTimeout(() => {
        removeHighlight();
      }, 3000);
    }
  };

  // Expose scrollToNewComment method to parent component
  useImperativeHandle(ref, () => ({
    scrollToNewComment: (commentId) => {
      scrollToComment(commentId);
    }
  }));

  return (
    <Box>
      {sortedComments.map((comment, index) => (
        <Box key={`${comment.id}-${index}`} mb={3}>
                      <ChatComment
              id={comment.id}
              body={comment.body}
              postId={comment.post_id}
              createdAt={comment.created_at}
              author={comment.author_name}
              author_isBot={comment.author_isbot}
              parentComment={comment.parentComment}
              onHighlightComment={highlightComment}
              subredditName={subredditName}
            />
        </Box>
      ))}
    </Box>
  );
});

export default ChatFlattenedComments; 