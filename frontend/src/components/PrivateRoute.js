import { connect } from 'react-redux';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { tokenSelector, userSelector } from '../selectors';

const PrivateRoute = ({ user, token, check = () => true, children, ...rest }) => {
  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (!token) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: {
                  requireAuth: 'You must be logged in to do that',
                  prevPathname: location.pathname,
                },
              }}
            />
          );
        }

        if (!check(user)) {
          return <Redirect to="/" />;
        }

        return children;
      }}
    />
  );
};



const mapStateToProps = (state) => ({
  token: tokenSelector(state),
  user: userSelector(state)
});

export default connect(mapStateToProps)(PrivateRoute);
