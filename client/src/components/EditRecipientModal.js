import React, { useState } from 'react'
import { useItemsContext } from '../hooks/useItemsContext'
import { useAuthContext } from '../hooks/useAuthContext'

const EditRecipientModal = ({ isOpen, onClose, item }) => {
  const { dispatch } = useItemsContext()
  const { user } = useAuthContext()
  const [recipients, setRecipients] = useState(item.recipients)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSave = async () => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const recipient of recipients) {
        if (!emailRegex.test(recipient.email)) {
          throw new Error('Please enter valid email addresses')
        }
        if (!recipient.name.trim()) {
          throw new Error('Please enter names for all recipients')
        }
      }

      const response = await fetch('/api/items/' + item._id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ recipients })
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || 'Update failed')
      }

      dispatch({ type: 'UPDATE_ITEM', payload: json })
      onClose()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleRecipientChange = (index, field, value) => {
    const newRecipients = [...recipients]
    newRecipients[index][field] = value
    setRecipients(newRecipients)
  }

  const addRecipient = () => {
    setRecipients([...recipients, { name: '', email: '' }])
  }

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Recipients</h2>
        </div>
        
        <div className="recipients-list">
          {recipients.map((recipient, index) => (
            <div key={index} className="recipient-card">
              <div className="recipient-inputs">
                <input
                  type="text"
                  placeholder="Name"
                  value={recipient.name}
                  onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={recipient.email}
                  onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                />
                {recipients.length > 1 && (
                  <button 
                    className="remove-recipient"
                    onClick={() => removeRecipient(index)}
                  >
                    <span className="material-symbols-outlined">remove_circle</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="add-recipient" onClick={addRecipient}>
          <span className="material-symbols-outlined">add_circle</span>
          Add Recipient
        </button>

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button className="return-button" onClick={onClose}>Return</button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default EditRecipientModal 