import {
  Container,
  Text,
  SimpleGrid,
  Button,
  Dialog,
  Flex,
  Heading,
  GridItem,
  IconButton,
  Portal,
  Box,
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { apiFetch } from "../API/apiClient";
import { useState } from "react";
import { useEffect } from "react";
import NewCampaignModal from './NewCampaignModal';
import { LuTrash2 } from 'react-icons/lu';

function GameSelectionCard() {
    const [campaigns, setCampaigns] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [hoveredId, setHoveredId] = useState(null)
    const navigate = useNavigate();

    function GetUserCampaigns() {
        apiFetch('notes/get_campaigns').then(response => {
            setCampaigns(response.data)
        }).catch(e => {
            console.error('Error when fetching user campaigns:', e);
        })
    }

    function handleDeleteConfirm() {
        if (!confirmDelete) return
        apiFetch('/notes/delete_campaign', {
            method: 'DELETE',
            data: { campaign_id: confirmDelete.campaign_id }
        }).then(() => {
            setCampaigns(prev => prev.filter(c => c.campaign_id !== confirmDelete.campaign_id))
            setConfirmDelete(null)
        }).catch(e => console.error('Failed to delete campaign:', e))
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
                    <NewCampaignModal onCreated={campaign => setCampaigns(prev => [...prev, campaign])} />
                </GridItem>
            </SimpleGrid>
            <SimpleGrid pt={"50px"} columns={2} gap={"50px"} mx={"auto"} w={"fit-content"}>
                {campaigns.map((campaign) => (
                    <Box key={campaign.campaign_id} position="relative"
                        onMouseEnter={() => setHoveredId(campaign.campaign_id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <Button w="150px" h="150px" bg="#574A24" borderRadius={"2xl"} onClick={() => navigate(`/campaign-dashboard/${campaign.campaign_id}`)}>
                            <Flex direction="column" align="center" gap={1}>
                                <Text fontWeight="bold" truncate>{campaign.campaign_name}</Text>
                                <Text fontSize="xs" lineClamp={4}>{campaign.campaign_description}</Text>
                            </Flex>
                        </Button>
                        <IconButton
                            aria-label="Delete campaign"
                            size="xs"
                            bg="red.600"
                            color="white"
                            borderRadius="full"
                            position="absolute"
                            top="-8px"
                            right="-8px"
                            display={hoveredId === campaign.campaign_id ? 'flex' : 'none'}
                            onClick={e => { e.stopPropagation(); setConfirmDelete(campaign) }}
                        >
                            <LuTrash2 />
                        </IconButton>
                    </Box>
                ))}
            </SimpleGrid>

            {/* Delete confirmation dialog */}
            <Dialog.Root open={!!confirmDelete} onOpenChange={d => { if (!d.open) setConfirmDelete(null) }}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content bg="#FAE8B4">
                            <Dialog.Header>
                                <Dialog.Title>Delete Campaign</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text>
                                    Are you sure you want to delete <strong>{confirmDelete?.campaign_name}</strong>?
                                    This will permanently delete all notebooks, chapters, pages, characters, and tags in this campaign and cannot be undone.
                                </Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button bg="white" variant="outline">Cancel</Button>
                                </Dialog.ActionTrigger>
                                <Button bg="red.600" color="white" onClick={handleDeleteConfirm}>
                                    Delete
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger />
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Container>
    )
}

export default GameSelectionCard