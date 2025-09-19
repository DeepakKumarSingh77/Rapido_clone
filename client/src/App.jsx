import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserAuth from './components/UserAuth'
import CaptainAuth from './components/CaptainAuth'
import ProtectedRoute from './components/ProtectedRoute'
import RideOptions from './pages/RideOptions'

// Example pages
import UserHome from './pages/UserHome'
import DriverHome from './pages/DriverHome'
import FindUser from './pages/FindUser'
import SearchingDriver from './pages/SearchingDriver'
import RideLive from './pages/RideLive'
// import Unauthorized from './pages/Unauthorized'

function App() {
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
          <Route path="/ride-live/:rideId" element={<RideLive />} />
        </Route>

        {/* Protected Driver Routes */}
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver-home" element={<DriverHome />} />
          <Route path="/find-users"  element={<FindUser/>}/>
        </Route>

        {/* Unauthorized Fallback */}
        {/* <Route path="/unauthorized" element={<Unauthorized />} /> */}

      </Routes>
    </BrowserRouter>
  )
}

export default App
