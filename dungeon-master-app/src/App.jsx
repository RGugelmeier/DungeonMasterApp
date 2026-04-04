import './App.css'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/admin-dashboard" element={<AdminDashboard/>}/>
        <Route path="/user-dashboard" element={<UserDashboard/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App