import { useState, useRef, useEffect } from "react"
import { useItemsContext } from "../hooks/useItemsContext"
import { useAuthContext } from '../hooks/useAuthContext'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import API_URL from '../config/api.js'

export const ItemForm = ({ type, onBack }) => {
  const { dispatch } = useItemsContext()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  
  const [mediaFile, setMediaFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [recipients, setRecipients] = useState([{ name: '', email: '' }])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const mediaRecorder = useRef(null)
  const mediaStream = useRef(null)
  const videoPreviewRef = useRef(null)
  const mediaChunks = useRef([])
  const timerInterval = useRef(null)

  // Check for media device availability
  const [hasWebcam, setHasWebcam] = useState(false)
  const [hasMicrophone, setHasMicrophone] = useState(false)
  
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false)
  
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)

  // Add new state variables
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [facingMode, setFacingMode] = useState('user')

  useEffect(() => {
    const checkDevices = async () => {
      try {
        // First check permissions API
        if (navigator.permissions && navigator.permissions.query) {
          const cameraResult = type === 'video' ? 
            await navigator.permissions.query({ name: 'camera' }) : null;
          const microphoneResult = await navigator.permissions.query({ name: 'microphone' });

          if (cameraResult) {
            cameraResult.addEventListener('change', () => {
              setHasWebcam(cameraResult.state === 'granted');
              setPermissionDenied(cameraResult.state === 'denied');
            });
          }

          microphoneResult.addEventListener('change', () => {
            setHasMicrophone(microphoneResult.state === 'granted');
            setPermissionDenied(microphoneResult.state === 'denied');
          });
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        setHasWebcam(devices.some(device => device.kind === 'videoinput'));
        setHasMicrophone(devices.some(device => device.kind === 'audioinput'));
      } catch (err) {
        console.error('Error checking media devices:', err);
        setHasWebcam(false);
        setHasMicrophone(false);
      }
    };
    
    checkDevices();
  }, [type]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size
      const maxSize = type === 'image' ? 5 * 1024 * 1024 : 100 * 1024 * 1024
      if (file.size > maxSize) {
        setError(`File size too large. Please choose a ${type} under ${type === 'image' ? '5MB' : '100MB'}.`)
        return
      }

      // Create a new file with proper type
      const newFile = new File([file], file.name, {
        type: file.type,
        lastModified: Date.now()
      })

      setMediaFile(newFile)
      setPreviewUrl(URL.createObjectURL(file))
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

  const getSupportedMimeTypes = (type) => {
    const codecs = type === 'video' ? 
      [
        ['video/webm;codecs=vp9,opus'],
        ['video/webm;codecs=vp8,opus'],
        ['video/webm;codecs=h264,opus'],
        ['video/webm'],
        ['video/mp4']
      ] :
      [
        ['audio/webm;codecs=opus'],
        ['audio/webm'],
        ['audio/ogg;codecs=opus'],
        ['audio/mp3']
      ];

    return codecs.filter(codec => MediaRecorder.isTypeSupported(codec[0]));
  }

  useEffect(() => {
    const videoCodecs = getSupportedMimeTypes('video');
    const audioCodecs = getSupportedMimeTypes('audio');
    console.log('Supported video codecs:', videoCodecs);
    console.log('Supported audio codecs:', audioCodecs);
  }, []);

  const startRecording = async () => {
    try {
      // Request permissions immediately when starting recording
      const constraints = {
        audio: true,
        video: type === 'video' ? {
          facingMode: facingMode,
          width: { ideal: window.innerWidth < 768 ? 720 : 1280 },
          height: { ideal: window.innerWidth < 768 ? 1280 : 720 }
        } : false
      };

      // First try to get permissions
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStream.current = stream;
      setPermissionDenied(false); // Reset permission denied state if successful

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.playsInline = true;
        try {
          await videoPreviewRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
        }
      }
      
      mediaChunks.current = []
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm'
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      })
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(mediaChunks.current, { type: mimeType })
        const file = new File([blob], 'recording.webm', { 
          type: mimeType,
          lastModified: Date.now()
        })
        setRecordedVideo({
          file,
          url: URL.createObjectURL(blob)
        })
        
        // Stop the camera stream after recording
        if (mediaStream.current) {
          mediaStream.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.current.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Recording error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Please allow access to your camera and microphone in your browser settings.');
      } else {
        setError(`Could not start recording: ${error.message}`);
      }
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop()
      setIsRecording(false)
      clearInterval(timerInterval.current)
    }
  }

  const handleAcceptRecording = () => {
    setMediaFile(recordedVideo.file)
    setPreviewUrl(recordedVideo.url)
    setIsRecordingModalOpen(false)
    setRecordedVideo(null)
  }

  const handleRecordAgain = async () => {
    setRecordedVideo(null)
    await startRecording()
  }

  const handleCloseRecordingModal = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop())
    }
    setIsRecordingModalOpen(false)
    setIsRecording(false)
    setRecordedVideo(null)
    clearInterval(timerInterval.current)
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream
      mediaChunks.current = []
      
      const mimeType = 'audio/webm;codecs=opus'
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      })
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(mediaChunks.current, { type: mimeType })
        const file = new File([blob], 'recording.webm', { 
          type: mimeType,
          lastModified: Date.now()
        })
        setRecordedAudio({
          file,
          url: URL.createObjectURL(blob)
        })
        
        if (mediaStream.current) {
          mediaStream.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.current.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Recording error:', error)
      setError(`Could not access microphone: ${error.message}`)
    }
  }

  const handleAcceptAudioRecording = () => {
    setMediaFile(recordedAudio.file)
    setPreviewUrl(recordedAudio.url)
    setIsAudioModalOpen(false)
    setRecordedAudio(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      if (!user) {
        throw new Error('You must be logged in')
      }
      
      if (!mediaFile) {
        throw new Error('Please provide a file')
      }
      
      // Validate all recipient emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const recipient of recipients) {
        if (!emailRegex.test(recipient.email)) {
          throw new Error('Please enter valid email addresses')
        }
        if (!recipient.name.trim()) {
          throw new Error('Please enter names for all recipients')
        }
      }
      
      const formData = new FormData()
      
      // If it's a recorded file, ensure proper extension and type
      if (mediaFile instanceof File) {
        formData.append('file', mediaFile)
      } else {
        // This shouldn't happen, but just in case
        throw new Error('Invalid file format')
      }
      
      formData.append('type', type)
      formData.append('recipients', JSON.stringify(recipients))
      
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      
      const json = await response.json()
      
      if (!response.ok) {
        throw new Error(json.error || 'Upload failed')
      }
      
      // Reset form
      setMediaFile(null)
      setPreviewUrl(null)
      setRecipients([{ name: '', email: '' }])
      
      // Update context and navigate
      dispatch({type: 'CREATE_ITEM', payload: json})
      navigate('/')
      
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop())
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Add this useEffect to check supported codecs on mount
  useEffect(() => {
    const codecs = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4',
      'video/x-matroska'
    ]
    
    console.log('Supported codecs:')
    codecs.forEach(codec => {
      console.log(`${codec}: ${MediaRecorder.isTypeSupported(codec)}`)
    })
  }, [])

  // Add permission request function
  const requestPermissions = async () => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      setPermissionDenied(false);
      startRecording();
    } catch (error) {
      console.error('Permission request error:', error);
      setPermissionDenied(true);
      setError('Could not access your camera/microphone. Please check your browser settings.');
    }
  };

  // Add camera toggle function
  const toggleCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: newFacingMode,
          width: { ideal: window.innerWidth < 768 ? 720 : 1280 },
          height: { ideal: window.innerWidth < 768 ? 1280 : 720 }
        }
      });
      
      mediaStream.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
      setError('Failed to switch camera. Please try again.');
    }
  };

  const styles = {
    videoPreview: {
      width: '100%',
      maxWidth: '640px',
      height: '360px',
      backgroundColor: '#000',
      borderRadius: '8px',
      objectFit: 'cover',
      transform: 'scaleX(-1)' // Mirror the preview
    }
  }

  // Update the JSX for the video recording modal
  const renderVideoRecordingModal = () => (
    <Modal
      isOpen={isRecordingModalOpen}
      onClose={handleCloseRecordingModal}
      title="Record Video"
    >
      <div className="recording-modal-content">
        {!recordedVideo ? (
          <>
            <div className="video-preview-container">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="recording-preview-video"
              />
              {!permissionDenied && (
                <button 
                  className="camera-toggle-button"
                  onClick={toggleCamera}
                  type="button"
                >
                  <span className="material-symbols-outlined">flip_camera_ios</span>
                </button>
              )}
            </div>
            <div className="recording-controls">
              <button
                className={`primary-button ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? handleStopRecording : startRecording}
                type="button"
              >
                <span className="material-symbols-outlined">
                  {isRecording ? 'stop' : 'videocam'}
                </span>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              {isRecording && (
                <div className="recording-status">
                  <div className="recording-indicator"></div>
                  <span>Recording: {formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
            {permissionDenied && (
              <div className="permission-denied-message">
                <p>Camera access was denied. Please check your browser settings to enable camera access.</p>
                <button
                  className="secondary-button"
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="recording-preview">
            <video 
              src={recordedVideo.url}
              controls
              playsInline
              className="recording-preview-video"
            />
            <div className="recording-actions">
              <button 
                className="primary-button"
                onClick={handleAcceptRecording}
              >
                <span className="material-symbols-outlined">check</span>
                Use This Recording
              </button>
              <button 
                className="secondary-button"
                onClick={handleRecordAgain}
              >
                <span className="material-symbols-outlined">refresh</span>
                Record Again
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="recipients-container">
        {recipients.map((recipient, index) => (
          <div key={index} className="recipient-group">
            <div className="recipient-fields">
              <div className="form-group">
                <label>Name:</label>
                <input 
                  type="text"
                  placeholder="John Doe"
                  value={recipient.name}
                  onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input 
                  type="email"
                  placeholder="john@example.com"
                  value={recipient.email}
                  onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                  required
                />
              </div>
            </div>
            {recipients.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeRecipient(index)}
                className="remove-recipient-button"
              >
                <span className="material-symbols-outlined">remove_circle</span>
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          onClick={addRecipient}
          className="add-recipient-button"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Another Recipient
        </button>
      </div>

      <div className="media-upload">
        {type === 'image' && (
          <>
            <div className="upload-info">
              <span className="material-symbols-outlined">image</span>
              <p>Add a new image</p>
            </div>
            
            <label className="primary-button" htmlFor="media-file">
              <span className="material-symbols-outlined">upload_file</span>
              Select Image
            </label>
            
            <input
              id="media-file"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            {previewUrl && (
              <div className="media-preview">
                <div className="image-preview-container">
                  <img src={previewUrl} alt="Preview" />
                </div>
                <label 
                  className="primary-button"
                  htmlFor="media-file"
                >
                  <span className="material-symbols-outlined">photo_library</span>
                  Choose Different Image
                </label>
              </div>
            )}
          </>
        )}

        {type === 'video' && (
          <>
            <div className="upload-info">
              <span className="material-symbols-outlined">videocam</span>
              <p>{hasWebcam ? 'Record or upload a video' : 'Upload a video'}</p>
            </div>
            
            <div className="upload-options">
              <label className="primary-button" htmlFor="media-file">
                <span className="material-symbols-outlined">upload_file</span>
                Upload Video
              </label>
              
              {hasWebcam && (
                <button
                  className="primary-button"
                  onClick={() => setIsRecordingModalOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined">videocam</span>
                  Record Video
                </button>
              )}
            </div>
            
            <input
              id="media-file"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            {renderVideoRecordingModal()}
            
            {previewUrl && !isRecordingModalOpen && (
              <div className="media-preview">
                <video 
                  src={previewUrl}
                  controls
                  className="video-preview"
                />
                <button 
                  type="button"
                  onClick={() => setIsRecordingModalOpen(true)}
                  className="primary-button"
                >
                  <span className="material-symbols-outlined">videocam</span>
                  Record New Video
                </button>
              </div>
            )}
          </>
        )}

        {type === 'speech' && (
          <>
            <div className="upload-info">
              <span className="material-symbols-outlined">mic</span>
              <p>Add new audio</p>
            </div>
            
            {hasMicrophone && (
              <button
                className="primary-button"
                onClick={() => setIsAudioModalOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined">mic</span>
                Record Audio
              </button>
            )}
            
            <Modal
              isOpen={isAudioModalOpen}
              onClose={() => {
                if (mediaStream.current) {
                  mediaStream.current.getTracks().forEach(track => track.stop())
                }
                setIsAudioModalOpen(false)
                setIsRecording(false)
                setRecordedAudio(null)
                clearInterval(timerInterval.current)
              }}
              title="Record Audio"
            >
              <div className="recording-modal-content">
                {!recordedAudio ? (
                  <div className="audio-recording-controls">
                    <button
                      className={`primary-button ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? handleStopRecording : startAudioRecording}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        {isRecording ? 'stop' : 'mic'}
                      </span>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    {isRecording && (
                      <div className="recording-status">
                        <div className="recording-indicator"></div>
                        <span>Recording: {formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="recording-preview">
                    <audio 
                      src={recordedAudio.url}
                      controls
                      className="audio-preview"
                    />
                    <div className="recording-actions">
                      <button 
                        className="primary-button"
                        onClick={handleAcceptAudioRecording}
                      >
                        <span className="material-symbols-outlined">check</span>
                        Use This Recording
                      </button>
                      <button 
                        className="secondary-button"
                        onClick={() => {
                          setRecordedAudio(null)
                          startAudioRecording()
                        }}
                      >
                        <span className="material-symbols-outlined">refresh</span>
                        Record Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Modal>
            
            {previewUrl && !isAudioModalOpen && (
              <div className="media-preview">
                <audio src={previewUrl} controls className="audio-preview" />
                <button 
                  type="button"
                  onClick={() => setIsAudioModalOpen(true)}
                  className="primary-button"
                >
                  <span className="material-symbols-outlined">mic</span>
                  Record New Audio
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {mediaFile && (
        <button 
          type="submit" 
          disabled={isLoading}
          className="submit-button primary-button"
        >
          {isLoading ? 'Uploading...' : 'Share Story'}
        </button>
      )}
      
      {error && <div className="error">{error}</div>}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Uploading your story...</p>
        </div>
      )}
    </form>
  )
}