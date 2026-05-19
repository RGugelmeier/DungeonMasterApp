import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../API/apiClient';
import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
} from '@chakra-ui/react';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        apiFetch('/auth/reset-password', {
            method: 'POST',
            data: { token, password }
        })
        .then(() => setSuccess(true))
        .catch(e => setError(e.response?.data?.error || 'Something went wrong. Your link may have expired.'))
        .finally(() => setLoading(false));
    }

    return (
        <Flex minH="100vh" bg="#CBBD93" align="center" justify="center">
            <Box bg="#FAE8B4" p={10} borderRadius="md" width="400px" boxShadow="md">
                {success ? (
                    <VStack spacing={4}>
                        <Heading size="md">Password Updated</Heading>
                        <Text fontSize="sm" textAlign="center">
                            Your password has been reset successfully.
                        </Text>
                        <Button bg="#574A24" color="white" width="100%" onClick={() => navigate('/')}>
                            Back to Login
                        </Button>
                    </VStack>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={5}>
                            <Box textAlign="center" p={4} bg="#80775C" color="white" borderRadius="md" width="100%">
                                <Heading size="md">Reset Password</Heading>
                                <Text fontSize="sm">Enter your new password below</Text>
                            </Box>

                            <Box width="100%">
                                <Text mb={1}>New password</Text>
                                <Input
                                    type="password"
                                    placeholder="New password"
                                    bg="white"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </Box>

                            <Box width="100%">
                                <Text mb={1}>Confirm password</Text>
                                <Input
                                    type="password"
                                    placeholder="Confirm password"
                                    bg="white"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                />
                            </Box>

                            {error && (
                                <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>
                            )}

                            <Button
                                bg="#574A24"
                                color="white"
                                width="100%"
                                type="submit"
                                loading={loading}
                            >
                                Reset Password
                            </Button>
                        </VStack>
                    </form>
                )}
            </Box>
        </Flex>
    );
}

export default ResetPassword;
