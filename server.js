const express = require('express'),
      app = express(),
      assert = require('assert'),
      bodyParser = require('body-parser'),
      formidable = require('formidable'),
      fs = require('fs'),
      session = require('express-session'),
      mongoose = require('mongoose'),
      http = require('http').createServer(app),
      io = require('socket.io')(http)

app.use(session({
  key: 'admin',
  secret: 'any random string',
  proxy: true,
  resave: true,
  saveUninitialized: true
}))

app.use("/static", express.static('static'))
app.set("view engine", "ejs")

// conf bodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

mongoose.set('useUnifiedTopology', true)
mongoose.connect('mongodb://localhost:27017/blog', {useNewUrlParser: true})

let Post = require('./models/post'),
    admin = require('./models/admin')

app.get('/', (req, res) => {
  Post.find((err, posts) => {
    res.render("user/home", {posts: posts.reverse()})
  })
})

app.get('/do-logout', (req, res) => {
  req.session.destroy()

  res.redirect("/admin")
})

app.get('/admin/dashboard', (req, res) => {
  if (req.session.admin) {
    res.render("admin/dashboard")
  } else {
    res.redirect("/admin")
  }
})

app.get('/admin/posts', (req, res) => {
  if (req.session.admin) {
    res.render("admin/posts")
  } else {
    res.redirect("/admin")
  }
})

app.post('/do-admin-login', (req, res) => {
  admin.findOne({
    'email': req.body.email,
    'password': req.body.password
  }, (err, admin) => {
    if (admin != '') req.session.admin = admin

    res.send(admin)
  })
})

app.get('/admin', (req, res) => {
  res.render("admin/login")
})

app.post('/do-post', (req, res) => {
  let post = new Post()

  post.title = req.body.title
  post.content = req.body.content
  post.image = req.body.image

  post.save((err, doc) => {
    res.send({
      text: "posted successfully",
      _id: doc.id
    })
  })
})

app.get("/posts/:id", (req, res) => {
  Post.findById(req.params.id, (err, post) => {
    res.render("user/post", {post: post})
  })
})

app.post("/do-comment", (req, res) => {
  Post.updateOne({_id: req.body.post_id}, {
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

io.on('connection', socket => {
  socket.on("new_post", (formData) => {
    socket.broadcast.emit("new_post", formData)
  })
})

http.listen(3100, () => {
  console.log("server run on port 3100");
})
