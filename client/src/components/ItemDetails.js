import { useState } from 'react'
import { useItemsContext } from '../hooks/useItemsContext'
import { useAuthContext } from '../hooks/useAuthContext'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import Lightbox from 'yet-another-react-lightbox'
import "yet-another-react-lightbox/styles.css"
import API_URL from '../config/api.js'

const ItemDetails = ({ item }) => {
  const { dispatch } = useItemsContext()
  const { user } = useAuthContext()
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleDelete = async () => {
    if (!user) return

    const response = await fetch(`${API_URL}/api/items/${item._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({type: 'DELETE_ITEM', payload: json})
    }
  }

  const recipientSummary = item.recipients.length > 1 
    ? `To: ${item.recipients[0].name} + ${item.recipients.length - 1} other${item.recipients.length > 2 ? 's' : ''}`
    : `To: ${item.recipients[0].name}`

  return (
    <div className="item-details">
      {item.type === 'image' && (
        <div className="item-image-container">
          <img 
            src={item.imageUrl} 
            alt="Uploaded content" 
            onClick={() => setIsLightboxOpen(true)}
          />
        </div>
      )}

      {item.type === 'video' && (
        <div className="item-video-container">
          <video 
            controls
            src={item.videoUrl}
          />
        </div>
      )}

      {item.type === 'speech' && (
        <div className="item-audio-container">
          <div className="audio-player">
            <div className="audio-info">
              <span className="material-symbols-outlined">mic</span>
              <audio 
                controls
                src={item.audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="item-info">
        <div className="item-metadata">
          <p className="item-recipient">{recipientSummary}</p>
          <p className="item-date">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
        </div>
        <button 
          className="delete-button"
          onClick={handleDelete}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {item.type === 'image' && isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: item.imageUrl }]}
        />
      )}
    </div>
  )
}

export default ItemDetails