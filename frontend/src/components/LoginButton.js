import { Link, useLocation } from 'react-router-dom';
import { HStack, Button } from '@chakra-ui/react';

const LoginButton = () => {
  const location = useLocation();
  return (
      <Button
        as={Link}
        to={{
          pathname: '/login',
          state: {
            prevPathname: location.pathname,
          },
        }}
      >
        Login
      </Button>
  );
};

export default LoginButton;
