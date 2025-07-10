import { useState } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import moment from 'moment';
import {
  Box,
  Flex,
  HStack,
  VStack,
  IconButton,
  Text,
  Tooltip,
  useColorMode,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import EditIcon from '@mui/icons-material/Edit';
import ReplyIcon from '@mui/icons-material/Reply';
import ThemedBox from './ThemedBox';
import WriteCommentBoxWithMentions from './WriteCommentBoxWithMentions';
import EditBoxWithMentions from './EditBoxWithMentions';
import DeleteButton from './DeleteButton';
import ChakraMarkdown from './ChakraMarkdown';
import { userSelector } from '../selectors';

const ChatComment = ({
  id,
  body,
  postId,
  createdAt,
  author,
  user,
  parentComment,
  onHighlightComment,
  subredditName,
}) => {
  const { colorMode } = useColorMode();
  const [showWriteReply, setShowWriteReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const deletedText = '[deleted]';
  const isOwnMessage = user && user.username === author;

  return (
    <Box mb={3} data-comment-id={id}>
      <Flex gap={3} align="flex-start">
        {/* Avatar */}
        <Avatar 
          size="sm" 
          name={author || 'Anonymous'} 
          src=""
          bg={colorMode === 'light' ? 'blue.100' : 'blue.700'}
        />
        
        {/* Message Content */}
        <Box flexGrow={1} maxW="80%">
          {/* Citation if this is a reply */}
          {parentComment && (
            <Box 
              mb={2} 
              p={2} 
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
              borderRadius="md" 
              borderLeft="3px solid"
              borderColor={colorMode === 'dark' ? 'blue.300' : 'blue.400'}
              fontSize="xs"
              color={colorMode === 'dark' ? 'gray.200' : 'gray.600'}
              cursor="pointer"
              _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.100' }}
              onClick={(event) => {
                // Add a brief click effect
                const target = event.currentTarget;
                target.style.transform = 'scale(0.98)';
                target.style.transition = 'transform 0.1s ease';
                setTimeout(() => {
                  target.style.transform = '';
                  target.style.transition = '';
                }, 100);
                
                // Use the parent's highlight function if available
                if (onHighlightComment) {
                  onHighlightComment(parentComment.id);
                } else {
                  // Fallback to direct DOM manipulation
                  const parentElement = document.querySelector(`[data-comment-id="${parentComment.id}"]`);
                  if (parentElement) {
                    parentElement.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                    
                  // Add highlight effect
                  parentElement.style.backgroundColor = '#f0f8ff';
                  parentElement.style.setProperty('background-color', '#f0f8ff', 'important');
                  parentElement.style.border = '1px solid #3182ce';
                  parentElement.style.borderRadius = '6px';
                  parentElement.style.boxShadow = '0 2px 8px rgba(49, 130, 206, 0.15)';
                  parentElement.style.padding = '8px';
                  parentElement.style.margin = '-8px';
                  parentElement.style.transition = 'all 0.3s ease';
                  
                  // Remove highlight after 3 seconds
                  setTimeout(() => {
                    parentElement.style.backgroundColor = '';
                    parentElement.style.border = '';
                    parentElement.style.borderRadius = '';
                    parentElement.style.boxShadow = '';
                    parentElement.style.transform = '';
                    parentElement.style.padding = '';
                    parentElement.style.margin = '';
                    parentElement.style.transition = '';
                  }, 3000);
                  }
                }
              }}
              transition="background-color 0.2s"
            >
              <Text fontSize="xs" fontWeight="medium" mb={1}>
                Replying to {parentComment.author_name || '[deleted]'}
              </Text>
              {parentComment.body ? (
                <Text fontSize="xs" fontStyle="italic" noOfLines={1}>
                  "{parentComment.body.length > 80 
                    ? parentComment.body.substring(0, 80) + '...' 
                    : parentComment.body}"
                </Text>
              ) : (
                <Text fontSize="xs" fontStyle="italic" color="gray.400">
                  [deleted message]
                </Text>
              )}
            </Box>
          )}

          {/* Message Header */}
          <HStack spacing={2} mb={1} align="center">
            <Text fontSize="sm" fontWeight="bold" color="blue.500">
              {author || deletedText}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {moment(createdAt).fromNow()}
            </Text>
            {isOwnMessage && (
              <Badge size="xs" colorScheme="blue" variant="subtle">
                You
              </Badge>
            )}
          </HStack>

          {/* Message Body */}
          <ThemedBox
            p={3}
            borderRadius="lg"
            width="fit-content"
            maxW="100%"
            light={isOwnMessage ? "blue.50" : "white"}
            dark={isOwnMessage ? "blue.900" : "gray.700"}
            border="1px solid"
            borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
            position="relative"
          >
            {isEditing ? (
              <EditBoxWithMentions
                type="comment"
                id={id}
                onClose={() => setIsEditing(false)}
                initialText={body}
                subredditName={subredditName}
              />
            ) : (
              <Box>
                {body === null ? (
                  <Text color="gray.400" fontStyle="italic">
                    {deletedText}
                  </Text>
                ) : (
                  <ChakraMarkdown>{body}</ChakraMarkdown>
                )}
              </Box>
            )}
          </ThemedBox>

          {/* Message Actions */}
          <HStack spacing={2} mt={2} ml={1}>
            
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ReplyIcon />}
              onClick={() => {
                if (user) {
                  setShowWriteReply(!showWriteReply);
                } else {
                  history.push({
                    pathname: '/login',
                    state: {
                      requireAuth: 'Log in to reply to messages',
                      prevPathname: location.pathname,
                    },
                  });
                }
              }}
              aria-label="Reply"
            />

            {user && ((user.username && user.username === author) || user.isadmin === "true") && (
              <HStack spacing={1}>
                {!isEditing && user.username === author && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    icon={<EditIcon />}
                    aria-label="Edit message"
                  />
                )}
                <DeleteButton type="comment" id={id} />
              </HStack>
            )}
          </HStack>

          {/* Reply Box */}
          {showWriteReply && (
            <Box mt={3} ml={4}>
              <Box mb={2}>
                <Text fontSize="xs" color="gray.500">
                  Replying to {author}
                </Text>
              </Box>
              <WriteCommentBoxWithMentions
                type="reply"
                postId={postId}
                parentCommentId={id}
                onClose={() => setShowWriteReply(false)}
                subredditName={subredditName}
              />
            </Box>
          )}


        </Box>
      </Flex>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  user: userSelector(state),
});

export default connect(mapStateToProps)(ChatComment); 