import {
  Box,
  Flex,
  Text,
} from "@chakra-ui/react";
import LoginCard from '../components/LoginCard';
import logo from '../assets/scrawler-logo.png';

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
      <Box position="absolute" top="20px" left="20px" w={40} h={40}>
        <img src={logo} alt="Scrawler Logo"/>
      </Box>
      <LoginCard/>
    </Flex>
  );
}

export default Login