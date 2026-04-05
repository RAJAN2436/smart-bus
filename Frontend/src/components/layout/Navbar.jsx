import { Link, useLocation, useNavigate } from "react-router-dom"

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isDashboard = ["/admin", "/driver", "/user"].includes(location.pathname)

  if (isDashboard) return null

  const isPublicPage = ["/", "/login", "/register"].includes(location.pathname)

  const handleLogout = () => {
    navigate("/login")
  }

  return (
    <nav className="glass-panel sticky top-0 z-50 p-4 flex justify-between items-center">
      <Link to="/" className="text-3xl font-black text-red-600 tracking-wider text-glow flex gap-2">
        <span className="text-white">Smart</span>Bus
      </Link>

      <div className="space-x-8 font-medium">
        {isPublicPage ? (
          <>
            <Link className="text-gray-300 hover:text-red-400 transition-colors duration-300" to="/">Home</Link>
            <Link className="text-gray-300 hover:text-red-400 transition-colors duration-300" to="/login">Login</Link>
            <Link className="text-red-500 hover:text-red-300 transition-colors duration-300" to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link className="text-gray-300 hover:text-red-400 transition-colors duration-300" to={location.pathname}>Dashboard</Link>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-300 transition-colors duration-300 font-medium">Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar