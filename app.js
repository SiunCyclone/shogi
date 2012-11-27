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

/*
var express = require('express') //expressモジュールのロード
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

io.sockets.on('connection', function (socket) {
  socket.on('msg send', function (msg, fn) {
    fn(msg + ' was successfully sent');
    socket.emit('msg push', msg, function(data) {
      console.log(data);
    });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/

/*
var express = require('express') //expressモジュールのロード
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var app = express();

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
*/

/*
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(3000);

function handler (req, res) {
  fs.readFile('./public/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
 
    res.writeHead(200);
    res.end(data);
  });
}
 
io.sockets.on('connection', function (socket) {
  socket.on('msg send', function (msg, fn) {
    fn(msg + ' was successfully sent');
    socket.emit('msg push', msg, function(data) {
      console.log(data);
    });
  });
*/

/*
  console.log('クライアントとconnected');
  socket.on('msg send', function (msg) { // 4
    socket.emit('msg push', msg); // 5
    socket.broadcast.emit('msg push', msg); // 6
  });
  socket.on('disconnect', function() { // 9
    console.log('disconnected');
  });
*/
/*
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
*/
