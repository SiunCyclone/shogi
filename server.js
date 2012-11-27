(function() {
	var data = { host: new Array,
				 komaList: new Array,
				 turn: null }
	var CENTER = { x: 4, y: 4 };
	var KOMA = new function() {
		this.name = {
			ou: [ { x: -1, y: -1 }, { x: 0, y: -1 },
				  { x: 1, y: -1 }, { x: -1, y: 0 },
				  { x: 1, y: 0 }, { x: -1, y: 1 },
				  { x: 0, y: 1 }, { x: 1, y: 1 } ],
			kin: [ { x: -1, y: -1 }, { x: 0, y: -1 },
				   { x: 1, y: -1 }, { x: -1, y: 0 },
				   { x: 1, y: 0 }, { x: 0, y: 1 } ],
			gin: [ { x: -1, y: -1 }, { x: 0, y: -1 },
				   { x: 1, y: -1 }, { x: -1, y: 1 },
				   { x: 1, y: 1 } ],
			uma: [ { x: -1, y: -2 }, { x: 1, y: -2 } ],
			yari: [ { x: 100, y: 0 } ],
			hisha: [ { x: 200, y: 200 } ],
			kaku: [ { x: 300, y: 300 } ],
			hu: [ { x: 0, y: -1 } ]
		}
		this.initialPosition = function() {
			var ary = new Array;
			hu(ary);
			kin(ary);
			gin(ary);
			uma(ary);
			yari(ary);
			hisha(ary);
			kaku(ary);
			ou(ary);

			//まだ短くできる
			function hu(ary) {
				var name = "hu";
				for (var i=0; i<9; ++i)
					add(ary, name, i, 2);
			}

			function kin(ary) {
				var X = 3;
				var Y = 0;
				var name = "kin";
				add(ary, name, X, Y);
				
				X = 5;
				Y = 0;
				add(ary, name, X, Y);
			}

			function gin(ary) {
				var X = 2;
				var Y = 0;
				var name = "gin";
				add(ary, name, X, Y);
				
				X = 6;
				Y = 0;
				add(ary, name, X, Y);
			}

			function uma(ary) {
				var X = 1;
				var Y = 0;
				var name = "uma";
				add(ary, name, X, Y);
				
				X = 7;
				Y = 0;
				add(ary, name, X, Y);
			}

			function yari(ary) {
				var X = 0;
				var Y = 0;
				var name = "yari";
				add(ary, name, X, Y);
				
				X = 8;
				Y = 0;
				add(ary, name, X, Y);
			}
			function hisha(ary) {
				var X = 1;
				var Y = 1;
				var name = "hisha";
				add(ary, name, X, Y);
			}

			function kaku(ary) {
				var X = 7;
				var Y = 1;
				var name = "kaku";
				add(ary, name, X, Y);
			}

			function ou(ary) {
				var X = 4;
				var Y = 0;
				var name = "ou";
				add(ary, name, X, Y);
			}
			
			function mirrorX(x, y) {
				return Math.round( (x - CENTER.x) * Math.cos(Math.PI) - 
					   (y - CENTER.y) * Math.sin(Math.PI) + CENTER.x );
			}

			function mirrorY(x, y) {
				return Math.round( (x - CENTER.x) * Math.sin(Math.PI) +
					   (y - CENTER.y) * Math.cos(Math.PI) + CENTER.y );
			}
			
			function makeData(Name, man, X, Y) {
				return { name: Name , pos: { x: X, y: Y }, host: man };
			}

			function add(ary, name, X, Y) {
				ary.push( makeData(name, data.host[0], X, Y) );
				ary.push( makeData(name, data.host[1], mirrorX(X, Y), mirrorY(X, Y)) );
			}
			return ary;
		}
	}

	global.io.sockets.on('connection', function(socket) {
		var me = socket.store.id;
		data.host = Object.keys(socket.manager.roomClients)
		console.log("メンバー増える",Object.keys(socket.manager.roomClients));
		
		socket.emit('init', me);

		if (data.host.length < 2) {
			socket.emit('message', 'search');
		} else if (data.host.length == 2) {
			data.turn = data.host[(Math.random() * 2 | 0)];
			data.komaList = KOMA.initialPosition();
			socket.broadcast.emit('start', data, KOMA);
			socket.emit('start', data, KOMA);
			console.log(data.turn,"のターン");
		}

		socket.on('update', function(koma, moveTo) {
			//ターンを変える
			if (data.turn == data.host[0])
				data.turn = data.host[1];
			else if (data.turn == data.host[1])
				data.turn = data.host[0];
			//駒を更新する
			for (var i=0; i<data.komaList.length; ++i) {
				if ( (data.komaList[i].pos.x == koma.pos.x) &&
					 (data.komaList[i].pos.y == koma.pos.y) ) {
					data.komaList[i].pos.x = moveTo.x;
					data.komaList[i].pos.y = moveTo.y;
					break;
				}
			}
			//クライアントに更新を伝える
			socket.broadcast.emit('update', data);
			socket.emit('update', data);
		})

		//駒の初期化しろ

/*
		socket.on('viewData', function() {
			console.log(data);
		});
*/

		socket.on('disconnect', function() {
			socket.broadcast.emit('message', 'quit'); //新しく来た人以外
		});

	});


}).call(this);
