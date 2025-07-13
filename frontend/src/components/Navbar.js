import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Spacer,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Alert,
  AlertIcon,
  CircularProgress,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { ChevronDownIcon, BellIcon } from '@chakra-ui/icons';
import { ColorModeSwitcher } from '../ColorModeSwitcher';
import ThemedBox from './ThemedBox';
import {
  userSelector,
  subredditsSelector,
  createLoadingAndErrorSelector,
} from '../selectors';
import { startLogout } from '../actions/auth';
import { getSubreddits } from '../actions/subreddits';
import { getUnreadCount } from '../actions/notifications';
import RegisterButton from './RegisterButton';
import LoginButton from './LoginButton';

const Navbar = ({
  user,
  subreddits,
  isLoading,
  error,
  startLogout,
  getSubreddits,
  getUnreadCount,
}) => {
  const location = useLocation();
  const subredditName = location.pathname.match(/r\/[^\/]+/);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      getSubreddits();
      // Fetch unread count
      const fetchUnreadCount = async () => {
        const count = await getUnreadCount();
        setUnreadCount(count);
      };
      fetchUnreadCount();
      
      // Set up interval to check for new notifications
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, getUnreadCount]);

  return (
    <ThemedBox
      py={2}
      px={[0, 0, 10, 10]}
      display="flex"
      justifyContent="flex-start"
      alignItems="center"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      borderBottom="1px solid"
      borderColor="gray.200"
      _dark={{
        borderColor: "gray.700"
      }}
    >
      <Heading
        ml={[2, 4]}
        display={user ? 'block' : ['none', 'block']}
        fontSize={['1.3rem', '2.25rem']}
      >
        weddit
      </Heading>
      {user && (
        <HStack>
          <Menu>
            <MenuButton mx={2} as={Button} rightIcon={<ChevronDownIcon />}>
              {subredditName || 'Home'}
            </MenuButton>
            <MenuList>
              <MenuItem as={Link} to="/">
                Home
              </MenuItem>
              <MenuDivider />
              {subreddits.map(({ name }) => (
                (name === user.selectedsubreddit || user.isadmin === "true") && (
                  <MenuItem
                    key={name}
                    as={Link}
                    to={`/r/${name}`}
                  >
                    {`r/${name}`}
                  </MenuItem>
                )
              ))}
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {String(error)}
                </Alert>
              )}
              {isLoading && (
                <Flex justifyContent="center">
                  <CircularProgress isIndeterminate />
                </Flex>
              )}
            </MenuList>
          </Menu>
            {(user.isadmin === "true") && (
              <Button display={['none', 'flex']} as={Link} to="/submit">
                Submit
              </Button>)
            }
        </HStack>
      )}
      <Spacer />

      {user ? (
        <HStack>
          <IconButton
            as={Link}
            to="/notifications"
            aria-label="Notifications"
            icon={<BellIcon />}
            variant="ghost"
            position="relative"
          >
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                variant="solid"
                position="absolute"
                top="-1"
                right="-1"
                borderRadius="full"
                fontSize="xs"
                minW="20px"
                h="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </IconButton>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {user.username}
            </MenuButton>
            <MenuList>
              {(user.isadmin === "true") && (<MenuItem as={Link} to="/subreddits/create">
                Create subreddit
              </MenuItem>)}
              <MenuItem
                onClick={async () => {
                  await startLogout();
                }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
          {(user.isadmin === "true") && (
          <RegisterButton />)}
        </HStack>
      ) : (
        <HStack>
          <LoginButton />
        </HStack>
      )}
      <ColorModeSwitcher />
    </ThemedBox>
  );
};

const { loadingSelector, errorSelector } = createLoadingAndErrorSelector([
  'GET_SUBREDDITS',
]);

const mapStateToProps = (state) => ({
  isLoading: loadingSelector(state),
  error: errorSelector(state),
  subreddits: subredditsSelector(state),
  user: userSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
  startLogout: () => dispatch(startLogout()),
  getSubreddits: () => dispatch(getSubreddits()),
  getUnreadCount: () => dispatch(getUnreadCount()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
