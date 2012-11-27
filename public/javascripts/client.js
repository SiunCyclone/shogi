function ObjectModel() {}

ObjectModel.prototype.initialize = function(target) {
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
var ME, KOMA, DATA;

var manager = new ObjectModel();
var board = new ObjectModel();
var finger = new ObjectModel();
var komaList = new ObjectModel();
var motiGoma = new ObjectModel();

manager.init = function() {
	console.log(KOMA);
	board.init(NAME);
	finger.init(NAME);
	komaList.init(NAME);
	motiGoma.init("myKoma");
	motiGoma.draw();
	motiGoma.init("enemyKoma");	
	motiGoma.draw();
}

manager.run = function() {
	this.init();
	run();

	function run() {
		board.update();
		komaList.update();
		motiGoma.update();
		finger.run();
	};
}

manager.clear = function() {
	this.init();
	board.clear();
	motiGoma.init("myKoma");
	motiGoma.clear()
	motiGoma.init("enemyKoma");
	motiGoma.clear()
}

//==================================================

board.init = function(target) {
	this.initialize(target);
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
	this.initialize(target);
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
					draw();
				}
			}

			function draw() {
				current();
				neighbor();
				komaList.draw();

				// 飛車とか特別なのは未実装
				function current() {
					finger.context.fillStyle = "#FFD2FF";
					finger.context.fillRect( (finger.koma.pos.x * MASU_SIZE) + 1,
											 (finger.koma.pos.y * MASU_SIZE) + 1,
											 MASU_SIZE - 2, MASU_SIZE - 2);
					finger.context.fill();
				}
				
				function neighbor() {
					var neiAry = neiMasu();
					for (var i=0; i<neiAry.length; ++i) {
						finger.context.fillStyle = "#C0C0C0";
						finger.context.fillRect(neiAry[i].x * MASU_SIZE + 1,
												neiAry[i].y * MASU_SIZE + 1,
												MASU_SIZE - 2, MASU_SIZE - 2);
						finger.context.fill();
					}
				}
			}
		}

		function putDown() {
			//動ける範囲なら置く
			if ( contain(finger.pos, neiMasu()) ) {
				//取れるなら敵駒取る
				for (var i=0; i<komaList.list.length; ++i) {
					if ( (ME != komaList.list[i].host) && 
						 (finger.pos.x == komaList.list[i].pos.x) &&
						 (finger.pos.y == komaList.list[i].pos.y) ) {
						socket.emit('update', { koma: finger.koma,
												moveTo: finger.pos,
												getKoma: true,
												me: ME });
						finger.haveKoma = false;
						return;
					}
				}
				socket.emit('update', { koma: finger.koma,
										moveTo: finger.pos,
										getKoma: false,
										me: ME });
				finger.haveKoma = false;
				return;
			}
			//元にもどす
			if ( (finger.pos.x == finger.koma.pos.x) &&
				 (finger.pos.y == finger.koma.pos.y) ) {
				finger.haveKoma = false;
				finger.koma = false;

				board.update();
				komaList.draw();
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
	this.initialize(target);
	this.list = DATA.komaList;
}

komaList.update = function() {
	this.list = DATA.komaList;
	this.draw();
	console.log(this);
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
		case "ou": drawFunc(50, 0, 135, 158, 0, -2, 55, 62, i); break;
		case "kin": drawFunc(435, 0, 130, 170, 6, -6, 50, 70, i); break;
		case "gin": drawFunc(50,310, 130, 145, 2, -2, 50, 60, i); break;
		case "uma": drawFunc(190, 310, 120, 148, 6, -4, 47, 62, i); break;
		case "yari": drawFunc(320, 310, 115, 150, 6, -4, 47, 62, i); break;
		case "hisha": drawFunc(190, 2, 120, 160, 5, -4, 50, 66, i); break;
		case "kaku": drawFunc(315, 2, 120, 160, 5, -4, 50, 66, i); break;
		case "hu": drawFunc(435, 310, 120, 155, 3, -6, 50, 66, i); break;
		}
	}

	function drawFunc(sx, sy, sw, sh, gosaX, gosaY, dw, dh, i) {
		komaList.context.drawImage(KOMA.img, sx, sy, sw, sh,
								   komaList.list[i].pos.x * MASU_SIZE + gosaX,
								   komaList.list[i].pos.y * MASU_SIZE + gosaY,
								   dw, dh);
	}
}

//==================================================

motiGoma.init = function(target) {
	this.initialize(target);
	this.size = { x: 140, y: 290 };
}

motiGoma.update = function() {
	this.clear();
	this.draw();
}

motiGoma.clear = function() {
	this.context.clearRect(0, 0, this.size.x, this.size.y);
}

motiGoma.draw = function() {
	this.context.fillStyle = "#BD6600";
	this.context.fillRect(0, 0, this.size.x, this.size.y);
}


//==================================================

$(function() {
	socket.on('init', function(who) {
		ME = who;
	});

	socket.on('message', function(msg) {
		switch (msg) {
		case "search":
			$("#message").html("<h1>対戦相手を探しています...</h1>");
			$("#NAME").css({display: "none"});
			$("#myKoma").css({display: "none"});
			$("#enemyKoma").css({display: "none"});
			break;
		case "quit":
			$("#message").css({display: "block"})
						 .html("<h1>相手が対戦をやめました</1>")
						 .append("<h1>新しい対戦相手を探しています...</h1>");
			$("#NAME").css({display: "none"})
					  .unbind();
			$("#myKoma").css({display: "none"})
						.unbind();
			$("#enemyKoma").css({display: "none"})
						   .unbind();
			manager.clear();
			break;
		}
	})

	socket.on('start', function(data, koma) {
		DATA = data;
		KOMA = koma;
		KOMA.img = new Image();
		KOMA.img.src = "../images/koma.png";
		$("#NAME").css({display: "block"});
		$("#myKoma").css({display: "block"});
		$("#enemyKoma").css({display: "block"});
		$("#message").css({display: "none"});
		manager.run();
		debug(ME);
	});

	socket.on('update', function(data) {
		DATA = data;
		board.update();
		komaList.update();
	});
});

//盤上をひっくり返す
//駒を取る
//手持ち駒リスト
//駒成る
//王をとったら終わり


//どっちのターンか表示

