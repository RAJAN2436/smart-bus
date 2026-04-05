import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import Navbar from "../components/layout/Navbar"
import Landing from "../pages/LandingPage"
import Login from "../pages/Login"
import Register from "../pages/Register"
import UserDashboard from "../pages/UserDashboard"
import AdminDashboard from "../pages/AdminDashboard"
import DriverDashboard from "../pages/DriverDashboard"

function App() {
  return (

    <Router>

      <Navbar />

      <Routes>

        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />

      </Routes>

    </Router>

  )
}

export default App