import
{
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Input
} from "@chakra-ui/react";
import { LuSendHorizontal } from "react-icons/lu";
import { useState } from "react";
import { apiFetch } from "../API/apiClient";

function AIConversation({ campaignId }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")

    async function handleSend() {
        if (!input.trim()) return
        const userMessage = { role: "user", text: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")

        try {
            const response = await apiFetch("/ai/ask", {
                method: "POST",
                data: { prompt: input, active_campaign: campaignId }
            })
            setMessages(prev => [...prev, { role: "ai", text: response.data.response }])
        } catch (error) {
            const errText = error.response?.data?.error || "Something went wrong."
            setMessages(prev => [...prev, { role: "ai", text: errText }])
        }
    }

    return (
        <Flex direction="column">
            <Box h="34px" mb="8px" />
            <Box bg="#FAE8B4" h="85vh" w="20vw">
            <VStack h="full" w="full">
                <Box bg="#F0EAD6" w="94%" flex="1" overflowY="auto" p="8px">
                    <VStack align="stretch" spacing={2}>
                        {messages.map((msg, i) => (
                            <HStack key={i} justify={msg.role === "user" ? "flex-end" : "flex-start"}>
                                <Box
                                    bg={msg.role === "user" ? "#C8A96E" : "#DDDBD3"}
                                    px={3}
                                    py={2}
                                    borderRadius="md"
                                    maxW="80%"
                                >
                                    <Text fontSize="sm">{msg.text}</Text>
                                </Box>
                            </HStack>
                        ))}
                    </VStack>
                </Box>
                <Input
                    placeholder="Enter Message"
                    variant="flushed"
                    bg="#F0EAD6"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
            </VStack>
        </Box>
        </Flex>
    )
}

export default AIConversation