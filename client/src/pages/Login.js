import { useState } from "react"
import { useLogin } from "../hooks/useLogin"

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, error, isLoading } = useLogin()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        
        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          className="primary-button auth-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}

export default Login