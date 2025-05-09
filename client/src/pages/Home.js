import { useEffect } from 'react'
import { useItemsContext } from "../hooks/useItemsContext"
import { useAuthContext } from "../hooks/useAuthContext"
import { Link } from 'react-router-dom'
import ItemDetails from '../components/ItemDetails'
import API_URL from '../config/api.js'

const Home = () => {
  const {items, dispatch} = useItemsContext()
  const {user} = useAuthContext()

  useEffect(() => {
    const fetchItems = async () => {
      const response = await fetch(`${API_URL}/api/items`, {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      const json = await response.json()

      if (response.ok) {
        dispatch({type: 'SET_ITEMS', payload: json})
      }
    }

    if (user) {
      fetchItems()
    }
  }, [dispatch, user])

  // Group items by type
  const imageItems = items?.filter(item => item.type === 'image') || []
  const videoItems = items?.filter(item => item.type === 'video') || []
  const audioItems = items?.filter(item => item.type === 'speech') || []

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <Link to="/create" className="create-button">
          <span className="material-symbols-outlined">add</span>
          Create New Story
        </Link>
      </div>

      {(!items || items.length === 0) ? (
        <div className="empty-dashboard">
          <p>You haven't created any stories yet.</p>
          <Link to="/create" className="create-button">Create Your First Story</Link>
        </div>
      ) : (
        <div className="dashboard-content">
          {imageItems.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">Images</h2>
              <div className="items-grid">
                {imageItems.map(item => (
                  <ItemDetails key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {videoItems.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">Videos</h2>
              <div className="items-grid">
                {videoItems.map(item => (
                  <ItemDetails key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {audioItems.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">Audio Recordings</h2>
              <div className="items-list">
                {audioItems.map(item => (
                  <ItemDetails key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Home