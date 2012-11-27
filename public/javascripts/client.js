function ObjectModel() {}

ObjectModel.prototype.init = function(target) {
	this.canvas = document.getElementById(target);
	if (!this.canvas || !this.canvas.getContext) {
		alert("No Canvas support in your browser...");
		return;
	}
	this.context = this.canvas.getContext("2d");
}

var socket = io.connect('http://localhost')
var NAME = "NAME";
var MASU_SIZE = 60;
var MASU_NUM = 9;
var CENTER = { x: 4, y: 4 };
var HOST = null;
var KOMA = new function() {
	this.init = function() {
		KOMA.img = new Image();
		KOMA.img.src = "../images/koma.png";
		KOMA.name = {
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
		KOMA.initialPosition = function() {
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
			
			function data(Name, man, X, Y) {
				return { name: Name , pos: { x: X, y: Y }, host: man };
			}

			function add(ary, name, X, Y) {
				ary.push( data(name, HOST[0], X, Y) );
				ary.push( data(name, HOST[1], mirrorX(X, Y), mirrorY(X, Y)) );
			}
			return ary;
		}
	}
}

var manager = new ObjectModel();
var board = new ObjectModel();
var finger = new ObjectModel();
var komaList = new ObjectModel();

manager.init = function() {
	KOMA.init();
	board.init(NAME);
	finger.init(NAME);
	komaList.init(NAME);
}

manager.run = function() {
	this.init();
	run();

	function run() {
		board.update();
		komaList.update();
		finger.run();
	};
}

manager.update = function() {

}

manager.clear = function() {
	this.init();
	board.clear();
}

//==================================================

board.init = function(target) {
	ObjectModel.prototype.init(target);
	this.size = { x: 540, y: 540 };
}

board.update = function() {
	this.clear();
	this.draw();
}

board.clear = function() {
	this.context.clearRect(0, 0, this.size.x, this.size.y);
}

board.draw = function() {
	this.context.fillStyle = "#BD6600";
	this.context.fillRect(0, 0, this.size.x, this.size.y);
	this.context.strokeStyle= "#000000";
	for (var i=0; i<MASU_NUM; ++i) { //横
		this.context.beginPath();
		this.context.moveTo(0, i*MASU_SIZE);
		this.context.lineTo(board.size.x, i*MASU_SIZE);
		this.context.stroke();
	}
	for (var i=0; i<MASU_NUM; ++i) { //縦
		this.context.beginPath();
		this.context.moveTo(i*MASU_SIZE, 0);
		this.context.lineTo(i*MASU_SIZE, board.size.y);
		this.context.stroke();
	}
}

//==================================================

finger.init = function(target) {
	ObjectModel.prototype.init(target);
	this.host = false;
	this.pos = { x: 4, y: 4 };
	this.koma = false;
	this.haveKoma = false;
}

finger.run = function() {
	$("#NAME").mousemove( function(e) {
		finger.move(e);
	});
}

finger.move = function(e) {
	this.pos.x = Math.floor( (e.pageX - $("#NAME").offset()["left"]) / MASU_SIZE );
	this.pos.y = Math.floor( (e.pageY - $("#NAME").offset()["top"]) / MASU_SIZE );
	if (this.pos.x > 8)
		this.pos.x = 8
	if (this.pos.y > 8)
		this.pos.y = 8
	$("#debug").html("x: "+this.pos.x+" y: "+ this.pos.y);
}

//==================================================

komaList.init = function(target) {
	ObjectModel.prototype.init(target);
	this.list = $.extend(true, [], KOMA.initialPosition());
	socket.emit('koma', this.list);

	console.log(this.list);
	console.log(this.list.length);
}

komaList.update = function() {
	this.draw();
}

komaList.move = function(koma, moveTo) {
	for (var i=0; i<this.list.length; ++i) {
		if ( (this.list[i].pos.x == koma.pos.x) &&
		  	 (this.list[i].pos.y == koma.pos.y) ) {
			this.list[i].pos.x = moveTo.x;
			this.list[i].pos.y = moveTo.y;
			return;
		}
	}
}

komaList.draw = function() {
	//敵は反転させて。
	for (var i=0; i<this.list.length; ++i) {
		switch (this.list[i].name) {
		case "ou":
			drawFunc(50, 0, 135, 158, 0, -2, 55, 62, i);
			break;
		case "kin":
			drawFunc(435, 0, 130, 170, 6, -6, 50, 70, i);
			break;
		case "gin":
			drawFunc(50,310, 130, 145, 2, -2, 50, 60, i);
			break;
		case "uma":
			drawFunc(190, 310, 120, 148, 6, -4, 47, 62, i);
			break;
		case "yari":
			drawFunc(320, 310, 115, 150, 6, -4, 47, 62, i);
			break;
		case "hisha":
			drawFunc(190, 2, 120, 160, 5, -4, 50, 66, i);
			break;
		case "kaku":
			drawFunc(315, 2, 120, 160, 5, -4, 50, 66, i);
			break;
		case "hu":
			drawFunc(435, 310, 120, 155, 3, -6, 50, 66, i);
			break;
		}
	}

	function drawFunc(sx, sy, sw, sh, gosaX, gosaY, dw, dh, i) {
		komaList.context.drawImage(KOMA.img, sx, sy, sw, sh,
								   komaList.list[i].pos.x * MASU_SIZE + gosaX,
								   komaList.list[i].pos.y * MASU_SIZE + gosaY,
								   dw, dh);
	}
}

$(function() {
	$("#NAME").on("click", function() {
		socket.emit('viewData');
	});

	socket.on('search', function() {
		$("#message").html("<h1>対戦相手を探しています...</h1>");
	});

	socket.on('start', function(data) {
		HOST = data;
		$("#message").css({display: "none"});
		manager.run();
	});

	socket.on('quit', function() {
		$("#message").css({display: "block"})
					 .html("<h1>相手が対戦をやめました</1>")
					 .append("<h1>新しい対戦相手を探しています...</h1>");
		manager.clear();
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
