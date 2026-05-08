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

function RegisterModal(){
        const [showErrorMessage, setShowErrorMessage] = useState(false)
        const errorMessage = "Error registering account. Please make sure:\n- Email is valid\n- Password is at least 8 characters long\n- Password contains at least one number, at least one letter, and at least one special character"
        const [open, setOpen] = useState(false)
        const [email, setEmail] = useState('')
        const [username, setUsername] = useState('')
        const [password, setPassword] = useState('')

    function TryRegister(event){
        event.preventDefault();

        apiFetch('/auth/register', {
            method: 'POST',
            data: {
            email: email,
            username: username,
            password: password
            }
        })
        .then(response => {
            console.log(response.data)
            setOpen(false)
        })
        .catch(e => {
            console.error('Error when registering:', e);
            setShowErrorMessage(true)
        })
    }

    return(
        <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
            <Dialog.Trigger asChild>
                <Button variant="link" size="sm" color="inherit">
                    Register New User
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={"#FAE8B4"}>
                        <Dialog.Header>
                            <Dialog.Title>Register New Account</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body >
                            <VStack spacing={3} align="stretch">
                                <Text fontSize="sm">Email</Text>
                                <Input bg={"white"}
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <Text fontSize="sm">Username</Text>
                                <Input bg={"white"}
                                    placeholder="Username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                                <Text fontSize="sm">Password</Text>
                                <Input bg={"white"}
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            {showErrorMessage && <Text whiteSpace="pre-line">{errorMessage}</Text>}
                            <Dialog.ActionTrigger asChild>
                                <Button bg={"white"} variant="outline">Close</Button>
                            </Dialog.ActionTrigger>
                            <Button bg="#80775C" color="white" onClick={TryRegister}>
                                Register
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger />
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}

export default RegisterModal