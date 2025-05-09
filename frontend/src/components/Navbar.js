import { Link } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout'
import { useAuthContext } from '../hooks/useAuthContext'

const Navbar = () => {
  const { logout } = useLogout()
  const { user } = useAuthContext()

  const handleClick = () => {
    logout()
  }

  return (
    <header>
      <div className="container">
        <nav>
          <Link to="/" className="nav-brand">
            <span className="material-symbols-outlined">share_reviews</span>
            Story Beyond
          </Link>
          {user && (
            <div className="user-section">
              <span>{user.email}</span>
              <button onClick={handleClick} className="logout-button">
                <span className="material-symbols-outlined">logout</span>
                Log out
              </button>
            </div>
          )}
          {!user && (
            <div className="nav-links">
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar