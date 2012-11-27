(function() {
	console.log("server 起動");
	var data = { host: new Array,
				 komaList: null,
				 turn: null }

	global.io.sockets.on('connection', function(socket) {
		data.host = Object.keys(socket.manager.roomClients)
		console.log("メンバー増える",Object.keys(socket.manager.roomClients));

		if (data.host.length < 2) {
			socket.emit('search');
		} else if (data.host.length == 2) {
			socket.broadcast.emit('start', data.host); //新しく来た人以外
			socket.emit('start', data.host); //新しく来た人
		}

		socket.on('koma', function(list) {
			data.komaList = list;
		});

		socket.on('viewData', function() {
			console.log(data);
		});

		socket.on('disconnect', function() {
			socket.broadcast.emit('quit'); //新しく来た人以外
		});

	});


}).call(this);
