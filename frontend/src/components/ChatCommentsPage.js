import { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import {
  Box,
  Flex,
  Text,
  Heading,
  Alert,
  AlertIcon,
  CircularProgress,
  VStack,
  HStack,
  Avatar,
  Badge,
  useColorMode,
  Divider,
} from '@chakra-ui/react';
import Post from './Post';
import ChatFlattenedComments from './ChatFlattenedComments';
import WriteCommentBoxWithMentions from './WriteCommentBoxWithMentions';
import LoginButton from './LoginButton';
import {
  createLoadingAndErrorSelector,
  postSelector,
  commentsSelector,
  userSelector,
  newCommentIdSelector,
} from '../selectors';
import { getPostAndComments } from '../actions';
import { clearNewCommentId } from '../actions/comments';
import { HStack as ChakraHStack } from '@chakra-ui/react';
import { useWebSocket } from '../hooks/useWebSocket';
import { markPostAsViewed } from '../actions/post';

const getCommentsWithChildren = (comments) => {
  const commentsWithChildren = comments.map((comment) => ({
    ...comment,
    children: [],
  }));
  commentsWithChildren.forEach((childComment) => {
    const { parent_comment_id } = childComment;
    if (parent_comment_id) {
      const parent = commentsWithChildren.find(
        (comment) => parent_comment_id === comment.id
      );
      parent.children = parent.children.concat(childComment);
    }
  });
  return commentsWithChildren.filter(
    ({ parent_comment_id, body, children }) =>
      parent_comment_id === null && (body !== null || children.length > 0)
  );
};

const ChatCommentsPage = ({
  isLoading,
  error,
  post,
  comments,
  getPostAndComments,
  user,
  newCommentId,
  clearNewCommentId,
  markPostAsViewed,
}) => {
  const { id } = useParams();
  const { colorMode } = useColorMode();
  const chatCommentsRef = useRef();
  const processedHashRef = useRef(null);
  
  // Helper function to safely scroll to a comment with retry mechanism
  const safeScrollToComment = (commentId, retryCount = 0) => {
    try {
      if (chatCommentsRef.current && chatCommentsRef.current.scrollToNewComment) {
        console.log('Scrolling to comment:', commentId);
        chatCommentsRef.current.scrollToNewComment(commentId);
        return true;
      } else if (retryCount < 5) {
        console.log(`Ref not available, retrying... (attempt ${retryCount + 1})`);
        // Retry after a short delay if ref is not available yet
        setTimeout(() => {
          safeScrollToComment(commentId, retryCount + 1);
        }, 50);
      } else {
        console.warn('Failed to scroll to comment after 5 retries:', commentId);
      }
    } catch (error) {
      console.warn('Failed to scroll to comment:', error);
    }
    return false;
  };
  
  // Initialize WebSocket connection for real-time comments
  useWebSocket(id, false);
  
  useEffect(() => {
    getPostAndComments(id);
  }, [getPostAndComments, id]);

  // Ensure ref is properly initialized
  useEffect(() => {
    // Reset processed hash when component mounts to allow re-processing
    processedHashRef.current = null;
  }, []);

  // Debug ref availability
  useEffect(() => {
    if (chatCommentsRef.current) {
      console.log('ChatCommentsRef is now available');
    }
  }, [chatCommentsRef.current]);

  useEffect(() => {
    if (post && post.id && user) {
      markPostAsViewed(post.id);
    }
  }, [post, user, markPostAsViewed]);

  // Handle new comment highlighting and scrolling
  useEffect(() => {
    if (newCommentId && !isLoading && comments.length > 0) {
      // Wait a bit for the comment to be rendered
      setTimeout(() => {
        if (safeScrollToComment(newCommentId)) {
          // Clear the newCommentId after using it
          clearNewCommentId();
        }
      }, 100);
    }
  }, [newCommentId, clearNewCommentId, isLoading, comments]);

  // Handle notification-based scrolling and highlighting using URL hash
  useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#comment-') && !isLoading && comments.length > 0) {
      const currentHash = window.location.hash;
      const commentId = parseInt(currentHash.replace('#comment-', ''));
      
      // Only process if this is a new hash we haven't processed yet
      if (commentId && processedHashRef.current !== currentHash) {
        processedHashRef.current = currentHash;
        setTimeout(() => {
          safeScrollToComment(commentId);
        }, 200);
      }
    }
  }, [comments, isLoading]); // Re-run when comments change to ensure they're loaded

  if (isLoading) {
    return (
      <Flex m={10} justifyContent="center" alignItems="center">
        <CircularProgress isIndeterminate />
      </Flex>
    );
  } else if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  const {
    id: post_id,
    type,
    subreddit_name,
    author_name,
    created_at,
    title,
    body,
  } = post;
  const numComments = comments.filter(({ body }) => body !== null).length;

  const rootComments = getCommentsWithChildren(comments);

  return (
    <Box maxW="4xl" mx="auto" p={4}>
      {/* Chat Header */}
      <Box 
        mb={6} 
        p={4} 
        borderRadius="lg" 
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        border="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
      >
        <Flex align="center" gap={3} mb={3}>
          <Avatar 
            size="md" 
            name={author_name || 'Anonymous'} 
            bg={colorMode === 'light' ? 'blue.100' : 'blue.700'}
          />
          <Box flexGrow={1}>
            <HStack spacing={2} align="center">
              <Heading size="md" maxW={["60%", "60%", "100%"]} color={colorMode === 'light' ? 'gray.800' : 'white'}>
                {title}
              </Heading>
              <Badge colorScheme="blue" variant="subtle">
                {subreddit_name}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Started by {author_name} • {moment(created_at).fromNow()}
            </Text>
          </Box>
        </Flex>
        
        {type === 'text' && (
          <Box 
            p={3} 
            bg={colorMode === 'light' ? 'gray.50' : 'gray.700'} 
            borderRadius="md"
            mt={3}
          >
            <Text>{body}</Text>
          </Box>
        )}
      </Box>

      {/* Chat Messages */}
      <Box 
        borderRadius="lg" 
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        border="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
        p={4}
        mb={4}
      >
        <ChatFlattenedComments 
          ref={chatCommentsRef}
          comments={rootComments} 
          subredditName={subreddit_name}
        />
      </Box>

      {/* Message Input */}
      {user ? (
        <Box 
          p={4} 
          borderRadius="lg" 
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          border="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
        >
          <Flex gap={3} align="flex-start">
            <Avatar 
              size="sm" 
              name={user.username} 
              bg={colorMode === 'light' ? 'blue.100' : 'blue.700'}
            />
            <Box flexGrow={1}>
              <Text fontSize="sm" color="gray.500" mb={2}>
                Reply as {user.username}
              </Text>
              <WriteCommentBoxWithMentions 
                postId={post_id} 
                parentCommentId={null} 
                subredditName={subreddit_name}
              />
            </Box>
          </Flex>
        </Box>
      ) : (
        <Box 
          p={4} 
          borderRadius="lg" 
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          border="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
          textAlign="center"
        >
          <Text color="gray.500" mb={3}>
            Join the conversation
          </Text>
          <LoginButton />
        </Box>
      )}
    </Box>
  );
};

const { loadingSelector, errorSelector } = createLoadingAndErrorSelector([
  'GET_POST_AND_COMMENTS',
]);

const mapStateToProps = (state) => ({
  isLoading: loadingSelector(state),
  error: errorSelector(state),
  post: postSelector(state),
  comments: commentsSelector(state),
  user: userSelector(state),
  newCommentId: newCommentIdSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
  getPostAndComments: (id) => dispatch(getPostAndComments(id)),
  clearNewCommentId: () => dispatch(clearNewCommentId()),
  markPostAsViewed: (id) => dispatch(markPostAsViewed(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatCommentsPage); 