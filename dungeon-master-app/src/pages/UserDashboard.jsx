import { apiFetch } from "../API/apiClient";
import { useNavigate } from 'react-router-dom';

function Dashboard(){
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

    return (
    <div>
        <button onClick={TryLogout}>Logout</button>
    </div>
    )
}

export default Dashboard