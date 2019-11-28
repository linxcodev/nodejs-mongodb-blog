const mongoose = require('mongoose')
const Schema = mongoose.Schema

const postSchema = new Schema({
  title: String,
  content: String,
  comments: Array,
  image: String
})

module.exports = mongoose.model('Post', postSchema)
