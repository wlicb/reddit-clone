import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  Box,
  Stack,
  Checkbox,
  Select,
  FormControl,
  FormErrorMessage,
  Input,
  Button,
  Alert,
  AlertIcon,
  FormLabel
} from '@chakra-ui/react';
import { startRegister } from '../actions/auth';
import { createLoadingAndErrorSelector } from '../selectors';
import { getSubreddits } from '../actions/subreddits'

class RegisterPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      confirmPassword: '',
      doNotMatchError: '',
      isAdmin: false,
      isBot: false,
      selectedSubreddit: '',
      availableSubreddits: []
    };

    
  }




  async componentDidMount() {
    const subreddits = await this.props.getSubreddits();
    this.setState({ availableSubreddits: subreddits });
  }
  

  componentDidUpdate(prevProps, prevState) {
    const { password, confirmPassword } = this.state;
    if (
      prevState.password !== password ||
      prevState.confirmPassword !== confirmPassword
    ) {
      this.setState({ doNotMatchError: '' });
    }
  }

  handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const { username, password, confirmPassword, isAdmin, isBot, selectedSubreddit } = this.state;
      const { startRegister, history, location } = this.props;
      if (password !== confirmPassword) {
        return this.setState({ doNotMatchError: 'Passwords do not match' });
      }
      await startRegister(username, password, isAdmin.toString(), isBot.toString(), selectedSubreddit, this.state);
      const { error } = this.props;
      if (!error) {
        history.push(
          '/'
        );
      }
    } catch (e) {}
  };

  render() {
    const { username, password, confirmPassword, doNotMatchError, isAdmin, isBot, selectedSubreddit, availableSubreddits } = this.state;
    const { isLoading, error } = this.props;
    return (
      <Box w={300} m="auto">
        {error && (
          <Alert status="error" mb={2}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        <form onSubmit={this.handleSubmit}>
          <Stack spacing={3}>
            <FormControl>
              <Input
                value={username}
                onChange={(e) => this.setState({ username: e.target.value })}
                id="username-input"
                variant="filled"
                type="text"
                placeholder="username"
                size="md"
                isRequired
              />
            </FormControl>
            <FormControl>
              <Input
                value={password}
                onChange={(e) => this.setState({ password: e.target.value })}
                id="password-input"
                variant="filled"
                type="password"
                placeholder="password"
                size="md"
                isRequired
              />
            </FormControl>
            <FormControl isInvalid={doNotMatchError}>
              <Input
                value={confirmPassword}
                onChange={(e) =>
                  this.setState({ confirmPassword: e.target.value })
                }
                id="confirm-password-input"
                variant="filled"
                type="password"
                placeholder="confirm password"
                size="md"
                isRequired
              />
              <FormErrorMessage>{doNotMatchError}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <Checkbox
                isChecked={isAdmin}
                onChange={(e) => this.setState({ isAdmin: e.target.checked })}
              >
                Admin User
              </Checkbox>
            </FormControl>

            <FormControl>
              <Checkbox
                isChecked={isBot}
                onChange={(e) => this.setState({ isBot: e.target.checked })}
              >
                Bot User
              </Checkbox>
            </FormControl>

            {!isAdmin && (
              <FormControl>
                <FormLabel htmlFor="subreddit-select">Subreddit to access</FormLabel>
                <Select
                  id="subreddit-select"
                  placeholder="Select subreddit"
                  variant="filled"
                  size="md"
                  value={selectedSubreddit}
                  onChange={(e) => this.setState({ selectedSubreddit: parseInt(e.target.value) })}
                  isRequired
                >
                  {availableSubreddits.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button type="submit" isLoading={isLoading}>
              Register
            </Button>
          </Stack>
        </form>
      </Box>
    );
  }
}

const { loadingSelector, errorSelector } = createLoadingAndErrorSelector(
  ['REGISTER'],
  false
);

const mapStateToProps = (state) => ({
  isLoading: loadingSelector(state),
  error: errorSelector(state),
  subreddits: getSubreddits(state),
});

const mapDispatchToProps = (dispatch) => ({
  startRegister: (username, password, isAdmin, isBot, selectedSubreddit) =>
    dispatch(startRegister(username, password, isAdmin, isBot, selectedSubreddit)),
  getSubreddits: () => dispatch(getSubreddits()),
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(RegisterPage)
);
