import { 
    Box,
    Button,
    Flex,
}
from "@chakra-ui/react";
import { useState } from "react";
import NotesDashboard from "./NotesDashboard";
import CharactersDashboard from "./CharactersDashboard";

function MainWindow ({ campaignId }) {
    const [displayMode, setDisplayMode] = useState("notebooks")
    const [pageNavTarget, setPageNavTarget] = useState(null)

    const navigateToPage = (pageId) => {
        setDisplayMode("notebooks")
        setPageNavTarget({ pageId, ts: Date.now() })
    }

    return(
        <Flex direction="column" mx="25px">
            <Flex justifyContent={"center"} mb="3px">
                <Button mr="10vw" onClick={() => setDisplayMode("notebooks")}>Notebooks</Button>
                <Button ml="10vw" onClick={() => setDisplayMode("characters")}>Characters</Button>
            </Flex>
            <Box bg="#FAE8B4" h="85vh" w="75vw">
                {displayMode === "notebooks" && <NotesDashboard campaignId={campaignId} pageNavTarget={pageNavTarget} onPageNavConsumed={() => setPageNavTarget(null)}/>}
                {displayMode === "characters" && <CharactersDashboard campaignId={campaignId} onNavigateToPage={navigateToPage}/>}
            </Box>
        </Flex>
    )
}

export default MainWindow