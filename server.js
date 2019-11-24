const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

app.use("/static", express.static("static"))
app.set("view engine", "ejs")

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'blog';
let client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

// Use connect method to connect to the server
client.connect(err => {
  assert.equal(null, err);
  console.log("Connected successfully to server")

  const db = client.db(dbName);

  app.get('/', (req, res) => {
    res.send('hello world')
  })

  app.get('/admin/dashboard', (req, res) => {
    res.render("admin/dashboard")
  })

  client.close()
})

app.listen(3100, () => {
  console.log("server run on port 310");
})
