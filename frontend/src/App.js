import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import theme from './theme';
import PublicRoute from './components/PublicRoute';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import ChatCommentsPage from './components/ChatCommentsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CreatePostPage from './components/CreatePostPage';
import DiscussionPostList from './components/DiscussionPostList';
import NotificationsPage from './components/NotificationsPage';
import ThemedBox from './components/ThemedBox';
import CreateSubredditPage from './components/CreateSubredditPage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ThemedBox minHeight="100vh" light="gray.300" dark="gray.800">
          <Navbar />
          <Flex justifyContent="center" pt="80px">
            <Box width={['95%', '80%', '70%', '60%']} mb={10}>
              <Switch>
                <PrivateRoute path="/r/:subreddit/comments/:id"
                check={(u) => {
                    const path = window.location.pathname;
                    const match = path.match(/^\/r\/([^/]+)/);
                    return (match && u.selectedsubreddit === match[1]) || u.isadmin === 'true';
                  }}>
                  <ChatCommentsPage />
                </PrivateRoute>
                <PublicRoute path="/login" >
                  <LoginPage />
                </PublicRoute>
                <PrivateRoute path="/register" 
                  check={(u) => u.isadmin === 'true'}>
                  <RegisterPage />
                </PrivateRoute>
                <PrivateRoute path="/submit"
                  check={(u) => u.isadmin === 'true'}>
                  <CreatePostPage />
                </PrivateRoute>
                <PrivateRoute path="/subreddits/create"
                  check={(u) => u.isadmin === 'true'}>
                  <CreateSubredditPage />
                </PrivateRoute>
                <PrivateRoute path="/notifications">
                  <NotificationsPage />
                </PrivateRoute>
                <PrivateRoute path="/r/:subreddit"
                  check={(u) => {
                    const path = window.location.pathname;
                    const match = path.match(/^\/r\/([^/]+)/);
                    return (match && u.selectedsubreddit === match[1]) || u.isadmin === 'true';
                  }}>
                  <DiscussionPostList />
                </PrivateRoute>
                <Route path="/">
                  <DiscussionPostList />
                </Route>
              </Switch>
            </Box>
          </Flex>
        </ThemedBox>
      </Router>
    </ChakraProvider>
  );
}

export default App;
