var express = require('express')

var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

server.listen(3000)

app.configure(function() {
  //app.get時のurlを__dirname+'public'まで補完。
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res) { // URL「/」にアクセスがあれば実行
  res.sendfile('index.html');
});

global.io = io;
require('./server.js');

