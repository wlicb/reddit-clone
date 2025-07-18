import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Heading,
  Alert,
  AlertIcon,
  CircularProgress,
} from '@chakra-ui/react';
import Post from './Post';
import FlattenedComments from './FlattenedComments';
import WriteCommentBox from './WriteCommentBox';
import LoginButton from './LoginButton';
import {
  createLoadingAndErrorSelector,
  postSelector,
  commentsSelector,
  userSelector,
} from '../selectors';
import { getPostAndComments } from '../actions';
import { HStack } from '@chakra-ui/react';
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

const CommentsPage = ({
  isLoading,
  error,
  post,
  comments,
  getPostAndComments,
  user,
  markPostAsViewed,
}) => {
  const { id } = useParams();
  
  // Initialize WebSocket connection for real-time comments
  useWebSocket(id, false);
  
  useEffect(() => {
    getPostAndComments(id);
  }, [getPostAndComments, id]);

  useEffect(() => {
    if (post && post.id && user) {
      markPostAsViewed(post.id);
    }
  }, [post, user, markPostAsViewed]);

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
    <Box>
      <Post
        id={post_id}
        type={type}
        subreddit={subreddit_name}
        author={author_name}
        createdAt={created_at}
        title={title}
        body={body}
        numComments={numComments}
      />
      <br />
      {user ? (
        <Box>
          <Box m={2}>
            <Text as="span" color="gray.500">
              {'Comment as '}
            </Text>
            <Text as="span">{user.username}</Text>
          </Box>
          <WriteCommentBox postId={post_id} parentCommentId={null} />
        </Box>
      ) : (
        <Flex
          p={5}
          border="1px"
          borderRadius={5}
          borderColor="gray.500"
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="md" color="gray.500">
            Log in to leave a comment
          </Heading>
          <HStack>
            <LoginButton />
          </HStack>
        </Flex>
      )}
      <br />
      <FlattenedComments comments={rootComments} />
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
});

const mapDispatchToProps = (dispatch) => ({
  getPostAndComments: (id) => dispatch(getPostAndComments(id)),
  markPostAsViewed: (id) => dispatch(markPostAsViewed(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CommentsPage);
