import { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  Text,
  Box,
  Flex,
  HStack,
  VStack,
  Tooltip,
  IconButton,
  Avatar,
  Badge,
  useColorMode,
  Divider,
} from '@chakra-ui/react';
import { ChatIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import ThemedBox from './ThemedBox';
import EditBoxWithMentions from './EditBoxWithMentions';
import DeleteButton from './DeleteButton';
import ChakraMarkdown from './ChakraMarkdown';
import { userSelector } from '../selectors';

const DiscussionPost = ({
  id,
  type,
  subreddit,
  author,
  createdAt,
  title,
  body,
  numComments,
  user,
  unreadReplies = 0,
}) => {
  const { colorMode } = useColorMode();
  const isTextPost = type === 'text';
  const [isEditing, setIsEditing] = useState(false);
  const deletedText = '[deleted]';

  return (
    <ThemedBox
      p={[4, 6]}
      borderRadius="lg"
      width="100%"
      light={unreadReplies > 0 ? '#f0f8ff' : 'white'}
      dark={unreadReplies > 0 ? '#253048' : 'gray.800'}
      border="1px solid"
      borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
      _hover={{
        borderColor: colorMode === 'light' ? 'blue.300' : 'blue.500',
        boxShadow: 'md',
      }}
      transition="all 0.2s"
    >
      <Flex gap={[2, 4]} direction={['column', 'row']}>
        {/* Author Avatar and Info */}
        <VStack spacing={2} align="center" minW={['auto', '60px']}>
          <Avatar 
            size="md" 
            name={author || 'Anonymous'} 
            src=""
            bg={colorMode === 'light' ? 'blue.100' : 'blue.700'}
          />
          <VStack spacing={1} align="center">
            <Text fontSize="xs" fontWeight="bold" color="blue.500">
              {author || deletedText}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {moment(createdAt).fromNow()}
            </Text>
          </VStack>
        </VStack>

        {/* Main Content */}
        <Box flexGrow={1} minW={0}>
          {/* Topic Badge */}
          <HStack mb={3} spacing={2}>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              {subreddit}
            </Badge>
            {!isTextPost && (
              <Badge colorScheme="green" variant="subtle" fontSize="xs">
                Link
              </Badge>
            )}
          </HStack>

          {/* Title */}
          <Text
            as={isTextPost ? Link : 'a'}
            to={isTextPost ? `/r/${subreddit}/comments/${id}` : null}
            href={isTextPost ? null : body}
            target={isTextPost ? null : '_blank'}
            fontSize="lg"
            fontWeight="600"
            color={colorMode === 'light' ? 'gray.800' : 'white'}
            _hover={{ color: 'blue.500' }}
            mb={3}
            display="block"
            wordBreak="break-word"
            lineHeight="1.4"
            minH="auto"
          >
            {title || deletedText}
            {!isTextPost && <ExternalLinkIcon ml={2} boxSize={3} />}
            {unreadReplies > 0 && (
              <Box as="span" ml={3}>
                <Badge colorScheme="yellow" variant="solid" fontSize="xs">
                  New Replies
                </Badge>
              </Box>
            )}
          </Text>

          {/* Content */}
          {isTextPost && (
            <Box mb={4}>
                          {isEditing ? (
              <EditBoxWithMentions
                type="post"
                id={id}
                initialText={body}
                onClose={() => setIsEditing(false)}
                subredditName={subreddit}
              />
            ) : (
                <Box wordBreak="break-word" lineHeight="1.6">
                  <ChakraMarkdown>{body}</ChakraMarkdown>
                </Box>
              )}
            </Box>
          )}

          {/* Discussion Stats */}
          <Flex justify="space-between" align="center" mt={4} direction={['column', 'row']} gap={[3, 0]}>
            <HStack spacing={4}>
              <HStack spacing={1} color="gray.500">
                <ChatIcon boxSize={4} />
                <Text fontSize="sm">
                  {numComments} {numComments === 1 ? 'reply' : 'replies'}
                </Text>
              </HStack>
              

            </HStack>

            {/* Action Buttons */}
            <HStack spacing={2} justifySelf="flex-end">
              <Box
                as={Link}
                to={`/r/${subreddit}/comments/${id}`}
                px={3}
                py={1}
                borderRadius="full"
                bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                color="blue.600"
                fontSize="sm"
                fontWeight="medium"
                _hover={{
                  bg: colorMode === 'light' ? 'blue.100' : 'blue.800',
                }}
                transition="background-color 0.2s"
              >
                Join Discussion
              </Box>

              {user && (user.username === author || user.isadmin === "true") && (
                <HStack spacing={1}>
                  {isTextPost && !isEditing && user.username === author && (
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      icon={<EditIcon />}
                      aria-label="Edit post"
                    />
                  )}
                  <DeleteButton type="post" id={id} />
                </HStack>
              )}
            </HStack>
          </Flex>
        </Box>


      </Flex>
    </ThemedBox>
  );
};

const mapStateToProps = (state) => ({
  user: userSelector(state),
});

export default connect(mapStateToProps)(DiscussionPost); 