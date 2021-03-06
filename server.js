const express = require('express'),
      app = express(),
      assert = require('assert'),
      bodyParser = require('body-parser'),
      formidable = require('formidable'),
      fs = require('fs'),
      session = require('express-session'),
      mongoose = require('mongoose'),
      http = require('http').createServer(app),
      io = require('socket.io')(http),
      nodemailer = require('nodemailer')

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
    Admin = require('./models/admin'),
    Setting = require('./models/setting')

app.post('/do-delete', (req, res) => {
  if (req.session.admin) {
    fs.unlink(req.body.image.replace('/', ''), err => {
      Post.deleteOne({
        _id: req.body._id
      }, (err, doc) => {
        res.send("Deleted")
      })
    })
  } else {
    res.redirect("/admin")
  }
})

app.get('/', (req, res) => {
  Setting.findOne({}, (err, setting) => {
    const postLimit = parseInt(setting.post_limit)

    Post.find().sort({
      _id: -1
    }).limit(postLimit).exec((err, posts) => {
      res.render("user/home", {
        posts: posts,
        postLimit: postLimit
      })
    })
  })
})

app.get('/get-posts/:start/:limit', (req, res) => {
  Post.find().sort({
    _id: -1
  }).skip(parseInt(req.params.start)).limit(parseInt(req.params.limit)).exec((err, posts) => {
    res.send(posts)
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
    Post.find((err, posts) => {
      res.render("admin/posts", {posts: posts})
    })
  } else {
    res.redirect("/admin")
  }
})

app.get("/post/edit/:id", (req, res) => {
  if (req.session.admin) {
    Post.findById(req.params.id, (err, post) => {
      res.render("admin/edit_post", {post: post})
    })
  } else {
    res.redirect()
  }
})

app.post('/do-edit-post', (req, res) => {
  Post.updateOne({_id: req.body._id}, {
    $set: {
      title: req.body.title,
      content: req.body.content,
      image: req.body.image
    }
  }, (err, docs) => {
    res.send("Update successfully!")
  })
})

app.post('/do-admin-login', (req, res) => {
  Admin.findOne({
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
        _id: mongoose.Types.ObjectId(),
        username: req.body.username,
        comment: req.body.comment,
        email: req.body.email
      }
    }
  }, (err, docs) => {
    res.send({
      text: "post comment successfully",
      _id: docs.id
    })
  })
})

app.post("/do-reply", (req, res) => {
  const replyId = mongoose.Types.ObjectId()
  Post.updateOne({
    _id: req.body.post_id,
    "comments._id": req.body.comment_id
  }, {
    $push: {
      "comments.$.replies": {
        _id: replyId,
        name: req.body.name,
        reply: req.body.reply
      }
    }
  }, (err, docs) => {
    // const transporter = nodemailer.createTransport({
    //   "service": "gmail",
    //   "auth": {
    //     "user": "technopreneur37",
    //     "pass": "qweasd098"
    //   }
    // })
    //
    // const mailOption = {
    //   "from": "My blog",
    //   "to": req.body.comment_email,
    //   "subject": "New Reply",
    //   "text": `${req.body.name} has replied on your comment http://localhost:3100/post/${req.body.post_id}`
    // }
    //
    // transporter.sendMail(mailOption, (err, info) => {
      res.send({
        text: "Replied successfully",
        _id: replyId
      })
    // })
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

app.post("/do-update-image", (req, res) => {
  let formData = new formidable.IncomingForm()

  formData.parse(req, (err, fields, files) => {
    fs.unlink(fields.imageOld.replace("/", ""), err => {
      let oldPath = files.file.path
      let newPath = "static/images/" + files.file.name

      fs.rename(oldPath, newPath, err => {
        res.send("/" + newPath)
      })
    })
  })
})

app.get("/admin/settings", (req, res) => {
  Setting.findOne({}, (err, setting) => {
    res.render("admin/settings", {
      post_limit: setting.post_limit
    })
  })
})

app.post("/admin/save_settings", (req, res) => {
  Setting.updateOne({}, {
    post_limit: req.body.post_limit
  }, {upsert: true}, (err, doc) => {
    res.redirect('/admin/settings')
  })
})

io.on('connection', socket => {
  socket.on("new_post", (formData) => {
    socket.broadcast.emit("new_post", formData)
  })

  socket.on("new_comment", (formData) => {
    io.emit("new_comment", formData)
  })

  socket.on('new_reply', formData => {
    io.emit('new_reply', formData)
  })

  socket.on('delete_post', postId => {
    socket.broadcast.emit('delete_post', postId)
  })
})

http.listen(3100, () => {
  console.log("server run on port 3100");
})
