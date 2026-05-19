import { useState } from 'react'
import { apiFetch } from '../API/apiClient'
import {
    Button,
    Dialog,
    Input,
    Portal,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'

function NewCampaignModal({ onCreated }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    function handleOpenChange(details) {
        setOpen(details.open)
        if (!details.open) {
            setName('')
            setDescription('')
            setError('')
        }
    }

    function handleSubmit(event) {
        event.preventDefault()
        if (!name.trim()) {
            setError('Campaign name is required.')
            return
        }
        setError('')
        setLoading(true)
        apiFetch('/notes/add_campaign', {
            method: 'POST',
            data: { campaign_name: name.trim(), campaign_description: description.trim() }
        })
        .then(response => {
            setOpen(false)
            if (onCreated) onCreated(response.data)
        })
        .catch(e => setError(e.response?.data?.error || 'Failed to create campaign.'))
        .finally(() => setLoading(false))
    }

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
                <Button bg="#574A24" height="80px" borderRadius="md" color="white">
                    Create New Campaign
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg="#FAE8B4">
                        <Dialog.Header>
                            <Dialog.Title>New Campaign</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <form id="new-campaign-form" onSubmit={handleSubmit}>
                                <VStack spacing={3} align="stretch">
                                    <Text fontSize="sm">Campaign Name <Text as="span" color="red.500">*</Text></Text>
                                    <Input
                                        bg="white"
                                        placeholder="Enter campaign name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        autoFocus
                                    />
                                    <Text fontSize="sm">Description <Text as="span" color="gray.500">(optional)</Text></Text>
                                    <Textarea
                                        bg="white"
                                        placeholder="Enter a description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                    {error && (
                                        <Text fontSize="sm" color="red.500">{error}</Text>
                                    )}
                                </VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button bg="white" variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                bg="#80775C"
                                color="white"
                                type="submit"
                                form="new-campaign-form"
                                loading={loading}
                            >
                                Create
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}

export default NewCampaignModal
