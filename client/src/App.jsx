import './App.css'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import UserAuth from './components/UserAuth'
import CaptainAuth from './components/CaptainAuth'


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login-user" element={<UserAuth/>} />
          <Route path="/driver-login" element={<CaptainAuth />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
