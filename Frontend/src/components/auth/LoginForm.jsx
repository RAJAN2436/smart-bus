import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginUser } from "../../services/api"

function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await loginUser({ email, password })
      if (data.token) {
        localStorage.setItem("token", data.token)
        // Ensure user data exists before proceeding
        if (!data.user) {
          setError("SECURITY ALERT: User Profile Metadata Incomplete. Contact Sysadmin.");
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }

        localStorage.setItem("user", JSON.stringify(data.user))

       // Redirection based on role with safe fallback
        const role = data.user.role || "user";
        if (role === "admin") {
          navigate("/admin")
        } else if (role === "driver") {
          navigate("/driver")
        } else {
          navigate("/user")
        }
      } else {
        setError(data.error || "Invalid credentials")
      }
    } catch (err) {
      console.error("Authentication Protocol Failure:", err);
      setError(err.message || "Connection failure. Verify backend telemetry link.");
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-10 w-full max-w-md animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-red-500 text-glow mb-2">
          Welcome Back
        </h2>
        <p className="text-gray-400">Sign in to your account</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
          {error}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            className="glass-input w-full p-3"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            type="password"
            className="glass-input w-full p-3"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className={`btn-primary w-full py-3 mt-4 text-lg tracking-wide ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-400 text-sm">
        Don't have an account? <Link to="/register" className="text-red-400 hover:text-red-300 underline underline-offset-4">Register here</Link>
      </p>
    </div>
  )
}

export default LoginForm
