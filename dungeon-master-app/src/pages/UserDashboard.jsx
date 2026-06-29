import {
  Box,
  Flex,
  Text
} from "@chakra-ui/react";
import GameSelectionCard from '../components/GameSelectionCard'
import LogoutButton from "../components/LogoutButton";
import logo from '../assets/scrawler-logo.png';

function Dashboard(){
    return (
    <Flex
        minH="100vh"
        bg="#CBBD93"
        align="center"
        justify="center"
        position="relative"
    >
        <GameSelectionCard/>
        <Box position="absolute" top="20px" right="20px">
            <LogoutButton/>
        </Box>
        {/* Logo (top-left) */}
        <Box position="absolute" top="20px" left="20px" w={40} h={40}>
            <img src={logo} alt="Scrawler Logo"/>
        </Box>
    </Flex>
    )
}

export default Dashboard