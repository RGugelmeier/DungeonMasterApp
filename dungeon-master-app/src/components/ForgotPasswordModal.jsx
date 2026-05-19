import { useState } from 'react'
import { apiFetch } from '../API/apiClient'
import {
    Button,
    Dialog,
    Input,
    Portal,
    Text,
    VStack,
} from '@chakra-ui/react'

function ForgotPasswordModal() {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState(null)  // 'success' | 'error'
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    function handleOpenChange(details) {
        setOpen(details.open)
        if (!details.open) {
            setEmail('')
            setStatus(null)
            setMessage('')
        }
    }

    function handleSubmit(event) {
        event.preventDefault()
        if (!email.trim()) return
        setLoading(true)
        setStatus(null)

        apiFetch('/auth/forgot-password', {
            method: 'POST',
            data: { email: email.trim().toLowerCase() }
        })
        .then(() => {
            setStatus('success')
            setMessage('If that email is registered, a reset link has been sent. Check your inbox.')
        })
        .catch(() => {
            setStatus('error')
            setMessage('Something went wrong. Please try again.')
        })
        .finally(() => setLoading(false))
    }

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
                <Button variant="link" size="sm" color="inherit">
                    Forgot password
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg="#FAE8B4">
                        <Dialog.Header>
                            <Dialog.Title>Reset Password</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            {status === 'success' ? (
                                <Text fontSize="sm">{message}</Text>
                            ) : (
                                <VStack spacing={3} align="stretch">
                                    <Text fontSize="sm">
                                        Enter your account email and we'll send you a reset link.
                                    </Text>
                                    <Text fontSize="sm">Email</Text>
                                    <Input
                                        bg="white"
                                        placeholder="Email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    {status === 'error' && (
                                        <Text fontSize="sm" color="red.500">{message}</Text>
                                    )}
                                </VStack>
                            )}
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button bg="white" variant="outline">Close</Button>
                            </Dialog.ActionTrigger>
                            {status !== 'success' && (
                                <Button
                                    bg="#80775C"
                                    color="white"
                                    onClick={handleSubmit}
                                    loading={loading}
                                >
                                    Send Reset Link
                                </Button>
                            )}
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}

export default ForgotPasswordModal
