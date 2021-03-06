'use strict'

var conf = require('./server/config')
var apm = require('elastic-apm-node').start(conf.apm)
var path = require('path')
var express = require('express')

// start background worker to generate custom transactions
require('./worker')

var app = express()

var onHeroku = process.env.NODE_HOME && process.env.NODE_HOME.indexOf('heroku') !== -1

if (!onHeroku) {
  app.use(function (req, res, next) {
    console.log(req.method, req.url)
    next()
  })
}

app.use(require('body-parser').json())
app.use(express.static('client/build'))
app.use(function (req, res, next) {
  apm.setTag('foo', 'bar')
  apm.setTag('lorem', 'ipsum dolor sit amet, consectetur adipiscing elit. Nulla finibus, ipsum id scelerisque consequat, enim leo vulputate massa, vel ultricies ante neque ac risus. Curabitur tincidunt vitae sapien id pulvinar. Mauris eu vestibulum tortor. Integer sit amet lorem fringilla, egestas tellus vitae, vulputate purus. Nulla feugiat blandit nunc et semper. Morbi purus libero, mattis sed mauris non, euismod iaculis lacus. Curabitur eleifend ante eros, non faucibus velit lacinia id. Duis posuere libero augue, at dignissim urna consectetur eget. Praesent eu congue est, iaculis finibus augue.')
  apm.setTag('this-is-a-very-long-tag-name-without-any-spaces', 'test')
  apm.setTag('multi-line', 'foo\nbar\nbaz')

  // mimic logged in user
  apm.setUserContext({
    id: 42,
    username: 'kimchy',
    email: 'kimchy@elastic.co'
  })

  // mimic custom context
  apm.setCustomContext({
    containerId: Math.floor(Math.random() * 10000)
  })

  next()
})

app.use(require('./server/coffee'))
app.use('/api', require('./server/routes'))
app.get('*', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'client/build', 'index.html'))
})

var server = app.listen(conf.server.port, function () {
  var port = server.address().port
  console.log('server is listening on port', port)
})
