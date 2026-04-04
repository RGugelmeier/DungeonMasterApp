import { apiFetch } from "../API/apiClient";
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  function TryLogin(event){
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    apiFetch('/auth/login', {
      method: 'POST',
      data: {
        email: email,
        password: password
      }
    }).then(response => {
      console.log('Success:', response.data)
      if (response.data.user_type === 'admin') {
        navigate('/admin-dashboard')
      }
      else {
        navigate('/user-dashboard')
      }
    })
    .catch(e => {
      console.error('Error when logging in:', e);
    })
  }

  function TryRegister(event){
    event.preventDefault();

    const email = document.getElementById("regEmail").value;
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;

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
      })
      .catch(e => {
        console.error('Error when registering:', e);
      })
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={TryLogin}>
        <label htmlFor="email">Email</label>
        <input type="text" id="email" name="email"/>
        <br/>
        <label htmlFor="password">Password</label>
        <input type="password" id="password" name="password"/>
        <br/>
        <input type="submit" value="Login"/>
      </form>
      <h2>Register</h2>
      <form onSubmit={TryRegister}>
        <label htmlFor="regEmail">Email</label>
        <input type="email" id="regEmail" name="regEmail"/>
        <br/>
        <label htmlFor="regUsername">Username</label>
        <input type="text" id="regUsername" name="regUsername"/>
        <br/>
        <label htmlFor="regPassword">Password</label>
        <input type="password" id="regPassword" name="regPassword"/>
        <br/>
        <input type="submit" value="Register"/>
      </form>
    </div>
  )
}

export default Login