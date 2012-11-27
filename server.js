(function() {
	console.log("server 起動");
	var koma = new Array;

	global.io.sockets.on('connection', function(socket) {
		socket.emit('news', { hellow: 'world' });
		socket.on('tx', function(data) {
			koma.push(data);
			console.log(koma);
			socket.emit('koma', koma);
		});
	});
}).call(this);
