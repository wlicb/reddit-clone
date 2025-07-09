import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  useColorMode,
} from '@chakra-ui/react';
import axios from '../axios-config';

const MentionAutocomplete = ({ 
  value, 
  onChange, 
  onMentionSelect, 
  subredditName,
  isVisible,
  position,
  onClose,
  mentionQuery,
  placement
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (isVisible && subredditName) {
      fetchUsers();
    }
  }, [isVisible, subredditName]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // console.log('Fetching users for subreddit:', subredditName);
      const response = await axios.get(`/subreddits/${subredditName}/users`);
      // console.log('Received users:', response.data);
      setUsers(response.data);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === -1 ? 0 : (prev + 1) % filteredUsers.length
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === -1 ? filteredUsers.length - 1 : (prev - 1 + filteredUsers.length) % filteredUsers.length
        );
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, users]);

  // console.log('MentionAutocomplete render:', { isVisible, users: users.length, position });
  let filteredUsers = users;
  if (mentionQuery && mentionQuery.length > 0) {
    filteredUsers = users.filter(user => user.username.toLowerCase().startsWith(mentionQuery.toLowerCase()));
    // console.log(filteredUsers)
  }

  // Reset selectedIndex to -1 when filteredUsers or mentionQuery changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [mentionQuery, users]);

  if (!isVisible) return null;

  return (
    <Box
      position="absolute"
      left={position?.left || 0}
      {...(placement === 'above'
        ? { bottom: `calc(100% + 4px)` }
        : { top: position?.top || '100%' })}
      zIndex={9999}
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      border="1px solid"
      borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
      borderRadius="md"
      boxShadow="lg"
      maxH="200px"
      overflowY="auto"
      minW="250px"
    >
      <VStack spacing={0} align="stretch">
        {loading ? (
          <Box p={3} textAlign="center">
            <Text fontSize="sm" color="gray.500">Loading users...</Text>
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box p={3} textAlign="center">
            <Text fontSize="sm" color="gray.500">No users found</Text>
          </Box>
        ) : (
          filteredUsers.map((user, index) => (
            <Box
              key={user.id}
              p={2}
              cursor="pointer"
              bg={index === selectedIndex ? (colorMode === 'light' ? 'blue.50' : 'blue.900') : 'transparent'}
              _hover={{ bg: colorMode === 'light' ? 'blue.50' : 'blue.900' }}
              onClick={() => onMentionSelect(user)}
            >
              <HStack spacing={2}>
                <Avatar size="xs" name={user.username} />
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    {user.username}
                  </Text>
                </Box>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default MentionAutocomplete; 