import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Box, Text, Flex, Badge } from '@chakra-ui/react';
import Comment from './Comment';

const FlattenedComments = forwardRef(({ comments, subredditName }, ref) => {
  // Create refs for scrolling to comments
  const commentRefs = useRef(new Map());
  // Track currently highlighted comment
  const highlightedCommentRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  
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
      element.style.transition = '';
      highlightedCommentRef.current = null;
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  };

  // Function to scroll to a specific comment
  const scrollToComment = (commentId) => {
    const commentElement = commentRefs.current.get(commentId);
    if (commentElement) {
      // Remove highlight from previously highlighted comment
      removeHighlight();
      
      commentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add multiple visual effects
      commentElement.style.backgroundColor = '#fef3c7';
      commentElement.style.border = '2px solid #f59e0b';
      commentElement.style.borderRadius = '8px';
      commentElement.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
      commentElement.style.transform = 'scale(1.02)';
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
        <Box key={`${comment.id}-${index}`} mb={4}>
          {/* Show citation if this is a reply */}
          {comment.parentComment && (
            <Box 
              mb={2} 
              p={3} 
              bg="gray.50" 
              borderRadius="md" 
              borderLeft="4px solid"
              borderColor="blue.400"
              fontSize="sm"
              color="gray.600"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              onClick={(event) => {
                // Add a brief click effect
                const target = event.currentTarget;
                target.style.transform = 'scale(0.98)';
                target.style.transition = 'transform 0.1s ease';
                setTimeout(() => {
                  target.style.transform = '';
                  target.style.transition = '';
                }, 100);
                
                scrollToComment(comment.parentComment.id);
              }}
              transition="background-color 0.2s"
            >
              <Flex alignItems="center" mb={1}>
                <Badge size="sm" colorScheme="blue" mr={2}>
                  Reply to
                </Badge>
                <Text fontWeight="bold" fontSize="xs">
                  {comment.parentComment.author_name || '[deleted]'}
                </Text>
              </Flex>
              {comment.parentComment.body ? (
                <Text fontSize="xs" fontStyle="italic">
                  "{comment.parentComment.body.length > 100 
                    ? comment.parentComment.body.substring(0, 100) + '...' 
                    : comment.parentComment.body}"
                </Text>
              ) : (
                <Text fontSize="xs" fontStyle="italic" color="gray.400">
                  [deleted comment]
                </Text>
              )}
            </Box>
          )}
          
          {/* Render the comment without hierarchy */}
          <Box
            ref={(el) => {
              if (el) {
                commentRefs.current.set(comment.id, el);
              }
            }}
          >
            <Comment
              id={comment.id}
              body={comment.body}
              postId={comment.post_id}
              createdAt={comment.created_at}
              author={comment.author_name}
              author_isBot={comment.author_isBot}
              subredditName={subredditName}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
});

export default FlattenedComments; 