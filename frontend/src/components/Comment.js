import { useState } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import moment from 'moment';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Tooltip,
  useColorMode,
  Badge,
} from '@chakra-ui/react';
import { ChatIcon, EditIcon } from '@chakra-ui/icons';
import ThemedBox from './ThemedBox';
import WriteCommentBox from './WriteCommentBox';
import EditBoxWithMentions from './EditBoxWithMentions';
import DeleteButton from './DeleteButton';
import ChakraMarkdown from './ChakraMarkdown';
import { userSelector } from '../selectors';

const Comment = ({
  id,
  body,
  postId,
  createdAt,
  author,
  author_isBot,
  user,
  subredditName,
}) => {
  const { colorMode } = useColorMode();
  const commentDetailColor = 'gray.500';
  const commentDetailBgColor = colorMode === 'light' ? 'gray.100' : 'gray.600';

  const [showWriteReply, setShowWriteReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const deletedText = '[deleted]';
  return (
    <ThemedBox
      p={4}
      borderRadius="md"
      width="100%"
      light="gray.50"
      dark="gray.700"
    >
      <Flex>
        <Box flexGrow={1}>
          <HStack spacing={2} align="center">
            <Text as="span" isTruncated>
              {author === null ? deletedText : author}
            </Text>
            <Text as="span" color="gray.500">
              <Tooltip label={moment(createdAt).format('LLLL')}>
                {moment(createdAt).fromNow()}
              </Tooltip>
            </Text>
            {author_isBot === "true" && (
              <Badge size="xs" colorScheme="purple" variant="subtle">
                BOT
              </Badge>
            )}
          </HStack>
          {isEditing ? (
            <Box mt={7}>
                          <EditBoxWithMentions
              type="comment"
              id={id}
              onClose={() => setIsEditing(false)}
              initialText={body}
              subredditName={subredditName}
            />
            </Box>
          ) : (
            <Text>
              {body === null ? (
                deletedText
              ) : (
                <Box listStylePosition="inside">
                  <ChakraMarkdown>{body}</ChakraMarkdown>
                </Box>
              )}
            </Text>
          )}
          <Flex
            mt={3}
            alignItems="center"
            color={commentDetailColor}
            fontWeight="bold"
          >
            <Box
              p={2}
              borderRadius="sm"
              _hover={{
                backgroundColor: commentDetailBgColor,
                cursor: 'pointer',
              }}
              onClick={() => {
                if (user) {
                  setShowWriteReply(!showWriteReply);
                } else {
                  history.push({
                    pathname: '/login',
                    state: {
                      requireAuth: 'Log in to reply to comments',
                      prevPathname: location.pathname,
                    },
                  });
                }
              }}
            >
              <ChatIcon mr={2} />
              Reply
            </Box>
          </Flex>
        </Box>
        {user && ((user.username && user.username === author) || user.isadmin === "true") && (
          <HStack alignItems="flex-start">
            {!isEditing && user.username === author && (
              <IconButton
                backgroundColor="inherit"
                onClick={() => setIsEditing(true)}
                icon={<EditIcon />}
              />
            )}
            <DeleteButton type="comment" id={id} />
          </HStack>
        )}
      </Flex>
      {showWriteReply && (
        <Box mt={2}>
          <Box m={2}>
            <Text as="span" color="gray.500">
              {'Reply to '}
            </Text>
            {author}
            <Text as="span" color="gray.500">
              {' as '}
            </Text>
            {user.username}
          </Box>
          <WriteCommentBox
            type="reply"
            postId={postId}
            parentCommentId={id}
            onClose={() => setShowWriteReply(false)}
          />
        </Box>
      )}
    </ThemedBox>
  );
};

const mapStateToProps = (state) => ({
  user: userSelector(state),
});

export default connect(mapStateToProps)(Comment);
