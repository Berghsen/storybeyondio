const mongoose = require('mongoose')

const Schema = mongoose.Schema

const itemSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  recipients: [{
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  }],
  imageUrl: String,
  videoUrl: String,
  audioUrl: String,
  user_id: {
    type: String,
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Item', itemSchema)