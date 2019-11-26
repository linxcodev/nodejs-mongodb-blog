const express = require('express'),
      app = express(),
      MongoClient = require('mongodb').MongoClient,
      assert = require('assert'),
      bodyParser = require('body-parser'),
      ObjectId = require('mongodb').ObjectId,
      formidable = require('formidable'),
      fs = require('fs')

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

  app.get("/posts/:id", (req, res) => {
    db.collection("posts").findOne({_id: ObjectId(req.params.id)}, (err, post) => {
      res.render("user/post", {post: post})
    })
  })

  app.post("/do-comment", (req, res) => {
    db.collection("posts").updateOne({_id: ObjectId(req.body.post_id)}, {
      $push: {
        "comments": {
          username: req.body.username,
          comment: req.body.comment
        }
      }
    }, (err, docs) => {
      res.send("post comment successfully")
    })
  })

  app.post("/do-upload-image", (req, res) => {
    let formData = new formidable.IncomingForm()

    formData.parse(req, (err, fields, files) => {
      let oldPath = files.file.path
      let newPath = "static/images/" + files.file.name

      fs.rename(oldPath, newPath, err => {
        res.send("/" + newPath)
      })
    })
  })

  app.listen(3100, () => {
    console.log("server run on port 3100");
  })

  client.close()
})
