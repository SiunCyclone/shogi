function ObjectModel() {}

ObjectModel.prototype.init = function(target) {
	this.canvas = document.getElementById(target);
	if (!this.canvas || !this.canvas.getContext) {
		alert("No Canvas support in your browser...");
		return;
	}
	this.context = this.canvas.getContext("2d");
}

function debug(data) {
	$("#debug").html(data);
}

var socket = io.connect('http://localhost')
var NAME = "NAME";
var MASU_SIZE = 60;
var MASU_NUM = 9;
var HOST, TURN, ME, KOMA;
var DATA;

var manager = new ObjectModel();
var board = new ObjectModel();
var finger = new ObjectModel();
var komaList = new ObjectModel();

manager.init = function() {
	console.log(KOMA);
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

manager.clear = function() {
	this.init();
	board.clear();
	$("#NAME").unbind();
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
	this.pos = { x: 4, y: 4 };
	this.koma = false;
	this.haveKoma = false;
}

finger.run = function() {
	$("#NAME").mousemove( function(e) {
		finger.move(e);
	});

	$("#NAME").on("click", function() {
		console.log(DATA.turn,"のターンだよん");
		if (ME != DATA.turn)
			return;
		console.log("君のターンだ!!!!");
		
		if (finger.haveKoma)
			putDown();
		else
			getKoma();

		function getKoma() {
			for (var i=0; i<komaList.list.length; ++i) {
				if (ME != komaList.list[i].host) continue;
				if ( (finger.pos.x == komaList.list[i].pos.x) &&
					 (finger.pos.y == komaList.list[i].pos.y) ) {
					finger.koma = komaList.list[i];
					finger.haveKoma = true;
					console.log("駒を持った!");
				}
			}
		}

		function putDown() {
			//もし動ける範囲なら置く
			if ( contain(finger.pos, neiMasu()) ) {
				move();
				return;
			}
			//if(駒の上) 戻す

			function move() {
				console.log("おいた");
				socket.emit('update', finger.koma, finger.pos);
			}

			function neiMasu() {
				var name = finger.koma.name;
				var moveToX, moveToY;
				var neiAry = new Array;
				for (var i=0; i<KOMA.name[name].length; ++i) {
					moveToX = (finger.koma.pos.x + KOMA.name[name][i].x);
					moveToY = (finger.koma.pos.y + KOMA.name[name][i].y);
					if ( myKomaExist(moveToX, moveToY) )
						continue; //もっといい仕組みに変えて
						//これじゃ敵の駒座標わからん
					neiAry.push({ x: moveToX, y: moveToY });
				}
				return neiAry;

				function myKomaExist(x, y) {
					for (var i=0; i<komaList.list.length; ++i) {
						if ( (ME == komaList.list[i].host) && 
							 (x == komaList.list[i].pos.x) &&
							 (y == komaList.list[i].pos.y) )
							return true;
					}
					return false;
				}
			}
			
			function contain(elem, objAry) {
				for each (var obj in objAry) {
					if ( equal(elem, obj) )
						return true;
				}
				return false;

				function equal(a, b) {
					var flag = true;
					Object.keys(a).forEach(function(key) {
						if (a[key] != b[key]) {
							flag = false;
							return;
						}
					});
					return flag;
				}
			}
		}
	});
}


finger.move = function(e) {
	this.pos.x = Math.floor( (e.pageX - $("#NAME").offset()["left"]) / MASU_SIZE );
	this.pos.y = Math.floor( (e.pageY - $("#NAME").offset()["top"]) / MASU_SIZE );
	if (this.pos.x > 8)
		this.pos.x = 8
	if (this.pos.y > 8)
		this.pos.y = 8
}

//==================================================

komaList.init = function(target) {
	ObjectModel.prototype.init(target);
	this.list = DATA.komaList;
}

komaList.update = function() {
	this.list = DATA.komaList;
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
	//debug
/*
	$("#NAME").on("click", function() {
		socket.emit('viewData');
	});
*/

	socket.on('init', function(who) {
		ME = who;
	});

	socket.on('message', function(msg) {
		switch (msg) {
		case "search":
			$("#message").html("<h1>対戦相手を探しています...</h1>");
			break;
		case "quit":
			$("#message").css({display: "block"})
						 .html("<h1>相手が対戦をやめました</1>")
						 .append("<h1>新しい対戦相手を探しています...</h1>");
			manager.clear();
			break;
		}
	})

	socket.on('start', function(data, koma) {
		DATA = data;
		KOMA = koma;
		KOMA.img = new Image();
		KOMA.img.src = "../images/koma.png";
		$("#message").css({display: "none"});
		manager.run();
		debug(ME);
	});

	socket.on('update', function(data) {
		DATA = data;
		board.update();
		komaList.update();
		finger.haveKoma = false;
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
