import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Flex,
  Alert,
  AlertIcon,
  Heading,
  Text,
  CircularProgress,
  VStack,
  HStack,
  Badge,
  useColorMode,
  Divider,
} from '@chakra-ui/react';
import DiscussionPost from './DiscussionPost';
import { createLoadingAndErrorSelector, postListSelector, userSelector } from '../selectors';
import { getPostList } from '../actions/postList';

const DiscussionPostList = ({ user, isLoading, error, postList, getPostList }) => {
  const { subreddit } = useParams();
  const { colorMode } = useColorMode();

  useEffect(() => {
    getPostList({ subreddit });
  }, [getPostList, subreddit]);

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

  const filteredPosts = postList.filter(post => 
    user && (post.subreddit_name === user.selectedsubreddit || user.isadmin === 'true')
  );

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      {/* Discussion Group Header */}
      <Box mb={8} textAlign="center">
        <Heading size="lg" mb={2} color={colorMode === 'light' ? 'gray.800' : 'white'}>
          {subreddit ? `${subreddit} Discussion Group` : 'Home Discussions'}
        </Heading>
        <Text color="gray.500" fontSize="md">
          {subreddit ? `Join the conversation in ${subreddit}` : 'Explore discussions from all groups'}
        </Text>
        
        {/* Stats */}
        <HStack justify="center" mt={4} spacing={6}>
          <VStack spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
              {filteredPosts.length}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Topics
            </Text>
          </VStack>
          <VStack spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {filteredPosts.reduce((sum, post) => sum + post.number_of_comments, 0)}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Replies
            </Text>
          </VStack>

        </HStack>
      </Box>

      {/* Discussion Topics */}
      {filteredPosts.length > 0 ? (
        <VStack spacing={6} align="stretch">
          {filteredPosts.map(
            ({
              id,
              type,
              title,
              body,
              created_at,
              number_of_comments,
              author_name,
              subreddit_name,
            }) => (
              <DiscussionPost
                key={`${id}-${title}`}
                id={id}
                type={type}
                subreddit={subreddit_name}
                author={author_name}
                createdAt={created_at}
                title={title}
                body={body}
                numComments={number_of_comments}
              />
            )
          )}
        </VStack>
      ) : user ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="gray.500" mb={4}>
            No discussions yet
          </Text>
          <Text color="gray.400">
            {subreddit 
              ? `Be the first to start a discussion in ${subreddit}!`
              : 'Join a group to see discussions here.'
            }
          </Text>
        </Box>
      ) : (
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="gray.500">
            Please log in to view discussions
          </Text>
        </Box>
      )}
    </Box>
  );
};

const { loadingSelector, errorSelector } = createLoadingAndErrorSelector([
  'GET_POST_LIST',
]);

const mapStateToProps = (state) => ({
  isLoading: loadingSelector(state),
  error: errorSelector(state),
  postList: postListSelector(state),
  user: userSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
  getPostList: (filters) => dispatch(getPostList(filters)),
});

export default connect(mapStateToProps, mapDispatchToProps)(DiscussionPostList); 