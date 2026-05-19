import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { apiFetch } from "../API/apiClient";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Heading,
  VStack,
} from "@chakra-ui/react";
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';

function LoginCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  function TryLogin(event){
    event.preventDefault();
    setLoginError('');

    apiFetch('/auth/login', {
      method: 'POST',
      data: {
        email: email,
        password: password
      }
    }).then(response => {
      if (response.data.user_type === 'admin') {
        navigate('/admin-dashboard')
      }
      else {
        navigate('/user-dashboard')
      }
    })
    .catch(e => {
      setLoginError(e.response?.data?.error || 'Login failed. Please try again.')
    })
  }

    return (
        <Box
            bg="#FAE8B4"
            p={10}
            borderRadius="md"
            width="400px"
            boxShadow="md"
        >
          <form>
            <VStack spacing={6}>
            {/* Welcome Message */}
            <Box textAlign="center" p={4} bg="#80775C" color="white" borderRadius="md">
                <Heading size="md">Welcome</Heading>
                <Text fontSize="sm">Login or register to continue</Text>
            </Box>

            {/* Email Field */}
            <Box width="100%">
                <Text mb={1}>Enter email</Text>
                <Input placeholder="Email" bg={'white'} value={email} onChange={e => setEmail(e.target.value)} />
            </Box>

            {/* Password Field */}
            <Box width="100%">
                <Text mb={1}>Enter password</Text>
                <Input type="password" placeholder="Password" bg={'white'} value={password} onChange={e => setPassword(e.target.value)} />
            </Box>

            {/* Login Button */}
            <Button bg={"#574A24"} color={"white"} width="100%" onClick={TryLogin} type='submit'>
                Login
            </Button>

            {loginError && (
                <Text color="red.500" fontSize="sm" textAlign="center">{loginError}</Text>
            )}

            {/* Actions */}
            <Flex width="100%" justify="space-between">
                <ForgotPasswordModal />
              <RegisterModal />
            </Flex>
            </VStack>
          </form>
        </Box>
    );
}

export default LoginCard