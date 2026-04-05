import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerUser } from "../../services/api"

function RegisterForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await registerUser(formData)
      if (data.token) {
        // Security Check: If driver/admin, block auto-login and require vetting
        if (data.user?.role !== 'user') {
          setError("REGISTRATION SUCCESSFUL: Awaiting Administrative Authorization before first access.");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Navigate based on role (standard users only here)
        navigate("/user")
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (err) {
      console.error("Registration Protocol Failure:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-10 w-full max-w-md animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-red-500 text-glow mb-2">
          Create Account
        </h2>
        <p className="text-gray-400">Join the SmartBus Network</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
          {error}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleRegister}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            className="glass-input w-full p-3"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            className="glass-input w-full p-3"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            type="password"
            name="password"
            className="glass-input w-full p-3"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="glass-input w-full p-3 bg-black/30 text-white outline-none appearance-none"
          >
            <option value="user" className="bg-[#1a0000] text-white">Passenger</option>
            <option value="driver" className="bg-[#1a0000] text-white">Driver</option>
            <option value="admin" className="bg-[#1a0000] text-white">Administrator</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className={`btn-primary w-full py-3 mt-4 text-lg tracking-wide ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register Now'}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-400 text-sm">
        Already have an account? <Link to="/login" className="text-red-400 hover:text-red-300 underline underline-offset-4">Log in here</Link>
      </p>
    </div>
  )
}

export default RegisterForm
