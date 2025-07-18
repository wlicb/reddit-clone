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
} from '@chakra-ui/react';
import Post from './Post';
import { createLoadingAndErrorSelector, postListSelector, userSelector } from '../selectors';
import { getPostList } from '../actions/postList';

const PostList = ({ user, isLoading, error, postList, getPostList }) => {
  const { subreddit } = useParams();

  useEffect(() => {
    if (user) {
      getPostList({ subreddit });

    }
  }, [getPostList, subreddit, user]);

  if (isLoading && user) {
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
  return (
    <Box>
      <Heading>{subreddit ? `r/${subreddit}` : 'Home'}</Heading>
      {postList.length > 0 && user ? (
        postList.map(
          ({
            id,
            type,
            title,
            body,
            created_at,
            number_of_comments,
            author_name,
            subreddit_name,
            unread_replies,
          }) => (
            (subreddit_name === user.selectedsubreddit || user.isadmin === 'true') && <Box key={`${id}-${title}`} my={4}>
              <Post
                id={id}
                type={type}
                subreddit={subreddit_name}
                author={author_name}
                createdAt={created_at}
                title={title}
                body={body}
                numComments={number_of_comments}
                unreadReplies={unread_replies}
              />
            </Box>
          )
        )
      ) : user ? (
        <Text m={5}>There are no posts to display.</Text>
      ) : null}
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

export default connect(mapStateToProps, mapDispatchToProps)(PostList);
