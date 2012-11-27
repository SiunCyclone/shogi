$(function() {
	var socket = io.connect('http://localhost')

	var pos = new Object;

	$("#NAME").mousemove( function(e) {
		pos.x = Math.floor( (e.pageX - $("#NAME").offset()["left"]) );
		pos.y = Math.floor( (e.pageY - $("#NAME").offset()["top"]) );
	});

	$("#NAME").on("click", function() {
		socket.emit('tx', { my: pos});
		console.log("押された");
	});

	socket.on('koma', function(data) {
		console.log(data);
	});
});

/*
var socket = io.connect('http://localhost'); // 1

socket.on('connect', function() {
	socket.emit('msg send', 'data', function(data) {
	log(data);
	});
	socket.on('msg push', function (msg, fn) {
		fn(msg + ' was successfully pushed');
	});
});
*/
/*
	socket.on('connect', function() { // 2
	  console.log('サーバーとconnected');
	  socket.emit('msg send', 'data'); // 3
	  socket.on('msg push', function (msg) { // 7
		console.log(msg); // 8
	  });
	});
*/
/*
  var socket = io.connect('http://localhost');
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });
*/
