const Item = require('../models/itemModel')
const mongoose = require('mongoose')
const cloudinary = require('../config/cloudinary')
const streamifier = require('streamifier')

// get all items
const getItems = async (req, res) => {
  try {
    const items = await Item.find({ user_id: req.user._id }).sort({ createdAt: -1 })
    res.status(200).json(items)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// get a single item
const getItem = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'No such item'})
  }

  const item = await Item.findById(id)

  if (!item) {
    return res.status(404).json({error: 'No such item'})
  }
  
  res.status(200).json(item)
}

// create new item
const createItem = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please add a file' })
    }

    const { type } = req.body
    let recipients
    try {
      recipients = JSON.parse(req.body.recipients)
    } catch (e) {
      return res.status(400).json({ error: 'Invalid recipients data' })
    }

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Please add at least one recipient' })
    }

    // Upload to Cloudinary using buffer
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: type === 'speech' ? 'video' : type,
          folder: type
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
    })

    const uploadResult = await uploadPromise

    // Create item
    const item = await Item.create({
      type,
      recipients,
      [type === 'image' ? 'imageUrl' : type === 'video' ? 'videoUrl' : 'audioUrl']: uploadResult.secure_url,
      user_id: req.user._id
    })

    res.status(200).json(item)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(400).json({ error: error.message || 'Upload failed' })
  }
}

// delete an item
const deleteItem = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such item' })
  }

  const item = await Item.findOneAndDelete({ _id: id, user_id: req.user._id })

  if (!item) {
    return res.status(400).json({ error: 'No such item' })
  }

  res.status(200).json(item)
}

// update an item
const updateItem = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'No such item'})
  }

  const item = await Item.findOneAndUpdate({_id: id}, {
    ...req.body
  })

  if (!item) {
    return res.status(400).json({error: 'No such item'})
  }

  res.status(200).json(item)
}

module.exports = {
  getItems,
  getItem,
  createItem,
  deleteItem,
  updateItem
}