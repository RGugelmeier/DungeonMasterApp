import {
  Container,
  Box,
  Text,
  SimpleGrid,
  Button,
  Flex,
  Heading,
  Center,
  GridItem
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { apiFetch } from "../API/apiClient";
import { useState } from "react";
import { useEffect } from "react";

function GameSelectionCard() {
    // Used to store the campaigns the user has on their account
    const [campaigns, setCampaigns] = useState([]);
    const navigate = useNavigate();
    function GetUserCampaigns()
    {
        apiFetch('notes/get_campaigns').then(response => {
            setCampaigns(response.data)
        }).catch(e => {
            console.error('Error when fetching user campaigns:', e);
        })
    }

    useEffect(() => {
        GetUserCampaigns()
    }, []);

    return(
        <Container 
        bg="#FAE8B4"
        p={10}
        maxW={"3xl"}
        minH={"3xl"}
        borderRadius="md"
        boxShadow="md"
        >
            <SimpleGrid columns ={3} gap="20px" pl="20px" pr="20px">
                <GridItem colSpan={2}>
                    <Heading size="3xl" color="white" bg="#80775C" borderRadius="md" height="100px" display="flex" alignItems="center" justifyContent="center">Select a campaign</Heading>
                </GridItem>
                <GridItem colSpan={1} pt="10px">
                    <Button bg="#574A24" height="80px" borderRadius="md">
                        Create New Campaign
                    </Button>
                </GridItem>
            </SimpleGrid>
            <SimpleGrid pt={"50px"} columns={2} gap={"50px"} mx={"auto"} w={"fit-content"}>
                {campaigns.map((campaign) => (
                    <Button key={campaign.campaign_id} w="150px" h="150px" bg="#574A24" borderRadius={"2xl"} onClick={() => navigate(`/campaign-dashboard/${campaign.campaign_id}`)}>  
                        <Flex direction="column" align="center" gap={1}>
                            <Text fontWeight="bold" truncate>{campaign.campaign_name}</Text>
                            <Text fontSize="xs" lineClamp={4}>{campaign.campaign_description}</Text>
                        </Flex>
                    </Button>
                ))}
            </SimpleGrid>
        </Container>
    )
}

export default GameSelectionCard