require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const itemRoutes = require('./routes/items')
const userRoutes = require('./routes/user')
const path = require('path')
const fs = require('fs')
const cloudinary = require('./config/cloudinary')

// express app
const app = express()

// CORS middleware configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://storybeyondio.onrender.com' 
    : 'http://localhost:3000'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      body: "OK"
    });
  }
  
  next();
});

// Regular middleware
app.use(express.json())

app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
})

// routes
app.use('/api/items', itemRoutes)
app.use('/api/user', userRoutes)
app.use('/uploads', express.static('uploads'))

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads')
}

// error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(400).json({ error: err.message })
})

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to database')
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log('listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log(error)
  })