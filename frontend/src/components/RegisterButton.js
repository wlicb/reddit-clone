import { Link, useLocation } from 'react-router-dom';
import { HStack, Button } from '@chakra-ui/react';

const RegisterButton = () => {
  const location = useLocation();
  return (
      <Button
        as={Link}
        to={{
          pathname: '/register',
          state: {
            prevPathname: location.pathname,
          },
        }}
      >
        Register New Account
      </Button>
  );
};

export default RegisterButton;
