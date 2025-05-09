const express = require('express')
const {
  createItem,
  getItems,
  deleteItem
} = require('../controllers/itemController')
const requireAuth = require('../middleware/requireAuth')
const upload = require('../middleware/upload')
const Item = require('../models/itemModel')

const router = express.Router()

// require auth for all item routes
router.use(requireAuth)

// GET all items
router.get('/', getItems)

// POST a new item
router.post('/', upload.single('file'), createItem)

// DELETE an item
router.delete('/:id', deleteItem)

// Add this route
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { recipients } = req.body

  try {
    const item = await Item.findOneAndUpdate(
      { _id: id, user_id: req.user._id },
      { recipients },
      { new: true }
    )

    if (!item) {
      return res.status(404).json({ error: 'No such item' })
    }

    res.status(200).json(item)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

module.exports = router