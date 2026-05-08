import { apiFetch } from "../API/apiClient";
import { useNavigate } from 'react-router-dom';
import { Button } from "@chakra-ui/react";

function LogoutButton(){
    const navigate = useNavigate();
    
    function TryLogout(){
        apiFetch('/auth/logout', {
            method: 'POST',
        }).then(() => {
            console.log('Logout success')
            navigate('/')
        }).catch(e => {
            console.error('Error when logging out', e);
        })
    }

    return(
        <Button onClick={TryLogout} bg="#574A24">
            Logout
        </Button>
    )
}

export default LogoutButton