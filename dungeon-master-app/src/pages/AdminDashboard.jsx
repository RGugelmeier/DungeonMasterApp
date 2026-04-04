import { apiFetch } from "../API/apiClient";
import { useNavigate } from 'react-router-dom';

function Dashboard(){
    const navigate = useNavigate();
    
    function TryPromote(event){
        event.preventDefault()

        const user_id = document.getElementById('user_id_to_promote').value;

        apiFetch('/users/promote', {
            method: 'PATCH',
            data: {
                user_id: user_id
            }
        }).then(response => {
            console.log('success', response.data)
        }).catch(e => {
            console.error('Error when promoting user:', e);
        })
    }

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
        <h1>Promote User</h1>
        <form onSubmit={TryPromote}>
            <label htmlFor="user_id_to_promote">user_id to promote</label>
            <br/>
            <input type="text" id="user_id_to_promote" name="user_id_to_promote"/>
            <br/>
            <input type="submit" value="Promote"/>
        </form>
        <br/>
        <button onClick={TryLogout}>Logout</button>
    </div>
    )
}

export default Dashboard