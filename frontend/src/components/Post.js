import { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  Text,
  Heading,
  Box,
  Flex,
  HStack,
  Tooltip,
  IconButton,
  useColorMode,
} from '@chakra-ui/react';
import { ChatIcon, EditIcon } from '@chakra-ui/icons';
import ThemedBox from './ThemedBox';
import EditBoxWithMentions from './EditBoxWithMentions';
import DeleteButton from './DeleteButton';
import ChakraMarkdown from './ChakraMarkdown';
import { userSelector } from '../selectors';

const Post = ({
  id,
  type,
  subreddit,
  author,
  createdAt,
  title,
  body,
  numComments,
  user,
}) => {
  const { colorMode } = useColorMode();
  const postDetailColor = 'gray.500';
  const postDetailBgColor = colorMode === 'light' ? 'gray.100' : 'gray.600';
  const isTextPost = type === 'text';

  const [isEditing, setIsEditing] = useState(false);
  const deletedText = '[deleted]';
  return (
    <ThemedBox
      p={[3, 4]}
      borderRadius="md"
      width="100%"
      light="gray.50"
      dark="gray.700"
    >
      <Flex direction={['column', 'row']} gap={[2, 0]}>
        <Box flexGrow={1} minW={0}>
          <Text
            as={Link}
            to={`/r/${subreddit}`}
            color={postDetailColor}
            fontWeight="bold"
          >
            {`r/${subreddit}`}
          </Text>{' '}
          <Text as="span" color={postDetailColor}>
            {`Posted by `}
          </Text>
          <Text as="span">{author ? `u/${author}` : deletedText}</Text>
          <Text as="span" color={postDetailColor}>
            {' '}
            <Tooltip label={moment(createdAt).format('LLLL')}>
              {moment(createdAt).fromNow()}
            </Tooltip>
          </Text>
          <Heading
            as={isTextPost ? Link : 'a'}
            display="block"
            to={isTextPost ? `/r/${subreddit}/comments/${id}` : null}
            href={isTextPost ? null : body}
            target={isTextPost ? null : '_blank'}
            mt={2}
            mb={4}
            fontSize="1.5em"
            fontWeight="500"
            wordBreak="break-word"
            lineHeight="1.4"
            minH="auto"
          >
            {title || deletedText}
          </Heading>
          {isTextPost ? (
            isEditing ? (
              <EditBoxWithMentions
                type="post"
                id={id}
                initialText={body}
                onClose={() => setIsEditing(false)}
                subredditName={subreddit}
              />
            ) : (
              <Box listStylePosition="inside" wordBreak="break-word" lineHeight="1.6">
                <ChakraMarkdown>{body}</ChakraMarkdown>
              </Box>
            )
          ) : null}
          <Flex
            mt={3}
            alignItems="center"
            color={postDetailColor}
            fontWeight="bold"
          >
            <Box
              as={Link}
              to={`/r/${subreddit}/comments/${id}`}
              p={2}
              borderRadius="sm"
              _hover={{ backgroundColor: postDetailBgColor }}
            >
              <ChatIcon mr={2} />
              {numComments} {numComments === 1 ? 'comment' : 'comments'}
            </Box>
          </Flex>
        </Box>
        {user && (user.username === author || user.isadmin === "true") && (
          <HStack alignItems="flex-start" justifySelf="flex-end">
            {isTextPost && !isEditing && user.username === author && (
              <IconButton
                onClick={() => setIsEditing(true)}
                backgroundColor="inherit"
                icon={<EditIcon />}
              />
            )}
            <DeleteButton type="post" id={id} />
          </HStack>
        )}
      </Flex>
    </ThemedBox>
  );
};

const mapStateToProps = (state) => ({
  user: userSelector(state),
});

export default connect(mapStateToProps)(Post);
