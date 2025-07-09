import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Heading
} from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotifications, markNotificationAsRead } from '../actions/notifications';
import { useHistory } from 'react-router-dom';
import { getPost } from '../actions/post';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { notifications, loading, error } = useSelector(state => state.notifications);
  const { user } = useSelector(state => state.auth);
  const [navigating, setNavigating] = useState(null);

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');
  const readBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('blue.100', 'blue.800');

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'mention':
        return 'Someone mentioned you in a comment';
      case 'reply':
        return 'Someone replied to your comment';
      default:
        return 'You have a new notification';
    }
  };

  const handleNotificationClick = async (notification) => {
    setNavigating(notification.id);
    try {
      // Mark as read
      if (!notification.read) {
        await dispatch(markNotificationAsRead(notification.id));
      }
      // Navigate to the post's comment page and scroll to the comment
      let postId = notification.post_id;
      if (!postId) {
        console.log("Cannot find post id for notification: " + notification)
      }
      const post = await dispatch(getPost(postId));
      console.log(post)
      history.push(`/r/${post.subreddit_name}/comments/${postId}#comment-${notification.comment_id}`);
    } finally {
      setNavigating(null);
    }
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading notifications...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          Error loading notifications: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <Heading size="lg" mb={6}>Notifications</Heading>
      {notifications.length === 0 ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="gray.500">
            No notifications yet
          </Text>
          <Text color="gray.400" mt={2}>
            You'll see notifications here when someone mentions you or replies to your comments
          </Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {notifications.map((notification) => (
            <Box
              key={notification.id}
              bg={notification.read ? readBg : unreadBg}
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
              p={4}
              position="relative"
              cursor="pointer"
              opacity={navigating === notification.id ? 0.6 : 1}
              _hover={{ boxShadow: 'md', bg: hoverBg }}
              onClick={() => handleNotificationClick(notification)}
            >
              <Flex justify="space-between" align="start">
                <Box flex="1">
                  <HStack spacing={3} mb={2}>
                    <Badge
                      colorScheme={notification.type === 'mention' ? 'blue' : 'green'}
                      variant="subtle"
                    >
                      {notification.type}
                    </Badge>
                    {!notification.read && (
                      <Badge colorScheme="red" variant="solid" size="sm">
                        New
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="md" fontWeight="medium">
                    {getNotificationMessage(notification)}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {formatTime(notification.created_at)}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationsPage; 