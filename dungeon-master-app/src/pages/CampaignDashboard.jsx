import {
    Text,
    Box,
    Button,
    Flex
} from "@chakra-ui/react";
import LogoutButton from "../components/LogoutButton";
import AIConversation from "../components/AIConversation";
import MainWindow from "../components/CampaignDashboardMainWindow";
import { useParams } from "react-router-dom";

function Dashboard(){
    const { campaignId } = useParams()
    return (
    <Flex
        minH="100vh"
        bg="#CBBD93"
        align="flex-start"
        justify="center"
        position="relative"
    >
        <Box position="absolute" top="20px" right="20px">
            <LogoutButton/>
        </Box>
        {/* Logo (top-left) */}
        <Box position="absolute" top="20px" left="20px">
            <Text bg="gray.200" p={2} borderRadius="md">
            Logo
            </Text>
        </Box>
        <Flex pt="7vh" align="flex-start" justify="center" w="full">
            <AIConversation campaignId={campaignId}/>
            <MainWindow campaignId={campaignId}/>
        </Flex>
    </Flex>
    )
}

export default Dashboard