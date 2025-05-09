import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ItemForm } from '../components/ItemForm'

const CreateStory = () => {
  const [selectedType, setSelectedType] = useState(null)
  const navigate = useNavigate()

  const handleTypeSelect = (type) => {
    setSelectedType(type)
  }

  return (
    <div className="container">
      <div className="create-story">
        {selectedType ? (
          <button onClick={() => setSelectedType(null)} className="back-button">
            <span className="material-symbols-outlined">arrow_back</span>
            Return to Options
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="back-button">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </button>
        )}

        <h2>{selectedType ? `Add a new ${selectedType}` : 'Create New Story'}</h2>

        {!selectedType ? (
          <div className="type-selection">
            <p>What type of story would you like to create?</p>
            <div className="type-buttons">
              <button 
                onClick={() => handleTypeSelect('image')} 
                className="type-button"
              >
                <span className="material-symbols-outlined type-button-icon">image</span>
                Image
              </button>
              <button 
                onClick={() => handleTypeSelect('video')} 
                className="type-button"
              >
                <span className="material-symbols-outlined type-button-icon">videocam</span>
                Video
              </button>
              <button 
                onClick={() => handleTypeSelect('speech')} 
                className="type-button"
              >
                <span className="material-symbols-outlined type-button-icon">mic</span>
                Speech
              </button>
            </div>
          </div>
        ) : (
          <ItemForm 
            type={selectedType} 
            onBack={() => setSelectedType(null)} 
          />
        )}
      </div>
    </div>
  )
}

export default CreateStory 