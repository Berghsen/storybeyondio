import { useState } from "react"
import { useSignup } from "../hooks/useSignup"

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signup, error, isLoading } = useSignup()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await signup(email, password)
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign up</h2>
        
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
            placeholder="Choose a strong password"
          />
        </div>

        <button 
          type="submit" 
          className="primary-button auth-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing up...' : 'Sign up'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  )
}

export default Signup