import {
  Box,
  Flex,
  Text,
} from "@chakra-ui/react";
import LoginCard from '../components/LoginCard';

function Login() {
  return (
    <Flex
      minH="100vh"
      bg="#CBBD93"
      align="center"
      justify="center"
      position="relative"
    >
      {/* Logo (top-left) */}
      <Box position="absolute" top="20px" left="20px">
        <Text bg="gray.200" p={2} borderRadius="md">
          Logo
        </Text>
      </Box>
      <LoginCard/>
    </Flex>
  );
}

export default Login