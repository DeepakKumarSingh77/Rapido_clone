import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserAuth from './components/UserAuth'
import CaptainAuth from './components/CaptainAuth'
import ProtectedRoute from './components/ProtectedRoute'
import RideOptions from './pages/RideOptions'
import { initSocket } from "./services/socket";

// Example pages
import UserHome from './pages/UserHome'
import DriverHome from './pages/DriverHome'
import FindUser from './pages/FindUser'
import SearchingDriver from './pages/SearchingDriver'
import RideLive from './pages/UserRideLive'
import UserRideLive from './pages/UserRideLive'
import CaptainRideLive from './pages/CaptainRideLive'
import { useEffect } from 'react'
import LivePage from './pages/LivePage';
// import { UserRide } from './pages/UserRide'
// import Unauthorized from './pages/Unauthorized'

function App() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log(user);
    if (user) initSocket("user", user._id);
  }, []);
  useEffect(() => {
  const captain = JSON.parse(localStorage.getItem("captain"));
  console.log(captain);
  if (captain) {
    initSocket("captain", captain._id);
  }
}, []);
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login-user" element={<UserAuth />} />
        <Route path="/driver-login" element={<CaptainAuth />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/" element={<UserHome />} />
          <Route path="/ride-options" element={<RideOptions />} />
          <Route path="/searching-driver" element={<SearchingDriver />} />
          <Route path="/user-ride-live" element={<UserRideLive />} />
          <Route path="/live-user" element={<LivePage />} />
        </Route>

        {/* Protected Driver Routes */}
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver-home" element={<DriverHome />} />
          <Route path="/find-users"  element={<FindUser/>}/>
          <Route path="/captain-ride-live" element={<CaptainRideLive />} />
           <Route path="/live-driver" element={<LivePage />} />
        </Route>

        {/* Unauthorized Fallback */}
        {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}

      </Routes>
    </BrowserRouter>
  )
}

export default App
