const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const bodyParser = require('body-parser');

app.use("/static", express.static("static"))
app.set("view engine", "ejs")

// conf bodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'blog';
let client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

// Use connect method to connect to the server
client.connect(err => {
  assert.equal(null, err);
  console.log("Connected successfully to dbserver")

  const db = client.db(dbName);

  app.get('/', (req, res) => {
    db.collection("posts").find().sort({_id: -1}).toArray((err, posts) => {
      res.render("user/home", {posts: posts})
    })
  })

  app.get('/admin/dashboard', (req, res) => {
    res.render("admin/dashboard")
  })

  app.get('/admin/posts', (req, res) => {
    res.render("admin/posts")
  })

  app.post('/do-post', (req, res) => {
    db.collection("posts").insertOne(req.body, (err, docs) => {
      res.send("posted successfully")
    })
  })

  client.close()
})

app.listen(3100, () => {
  console.log("server run on port 3100");
})
