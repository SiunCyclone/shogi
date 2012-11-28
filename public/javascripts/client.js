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
var CENTER = { x: 4, y: 4 }; //なんかきもい

var manager = new ObjectModel();
var board = new ObjectModel();
var finger = new ObjectModel();
var komaList = new ObjectModel();
var motiGoma = new ObjectModel();

manager.init = function() {
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
		motiGoma.update("myKoma");
		motiGoma.update("enemyKoma");
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
	this.size = { x: this.canvas.width, y: this.canvas.height};
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

	$("#myKoma").mousemove( function(e) {
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

				// #TODO 飛車とか特別なのは未実装
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
			if ( containObj(finger.pos, neiMasu()) ) {
				//取れるなら敵駒取る
				for (var i=0; i<komaList.list.length; ++i) {
					if ( (ME != komaList.list[i].host) && 
						 (finger.pos.x == komaList.list[i].pos.x) &&
						 (finger.pos.y == komaList.list[i].pos.y) ) {
						finger.rotate();
						socket.emit('update', { koma: finger.koma,
												moveTo: finger.pos,
												getKoma: true,
												me: ME });
						finger.haveKoma = false;
						return;
					}
				}
				finger.rotate();
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
		}

		function neiMasu() {
			var name = finger.koma.name;
			var moveToX, moveToY;
			var neiAry = new Array;
			for (var i=0; i<KOMA.name[name].length; ++i) {
				moveToX = (finger.koma.pos.x + KOMA.name[name][i].x);
				moveToY = (finger.koma.pos.y + KOMA.name[name][i].y);
				if ( myKomaExist(moveToX, moveToY) )
					continue;
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

	$("#myKoma").on("click", function() {
		//もし持ち駒の上なら持つ
		//持ち駒を戻すなら戻す
	});
}

finger.rotate = function() {
	if (ME == DATA.host[0]) {
		this.pos.x = mirrorX(this.pos.x, this.pos.y);
		this.pos.y = mirrorY(this.pos.x, this.pos.y);
		this.koma.pos.x = mirrorX(this.koma.pos.x, this.koma.pos.y);
		this.koma.pos.y = mirrorY(this.koma.pos.x, this.koma.pos.y);
	}
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

function mirrorX(x, y) {
	return Math.round( (x - CENTER.x) * Math.cos(Math.PI) - 
		   (y - CENTER.y) * Math.sin(Math.PI) + CENTER.x );
}

function mirrorY(x, y) {
	return Math.round( (x - CENTER.x) * Math.sin(Math.PI) +
		   (y - CENTER.y) * Math.cos(Math.PI) + CENTER.y );
}

komaList.init = function(target) {
	this.initialize(target);
	this.list = DATA.komaList;
}

komaList.update = function() {
	this.list = DATA.komaList;
	this.rotate();
	this.draw();
}

komaList.rotate = function() {
	if (ME == DATA.host[0]) {
		for (var i=0; i<this.list.length; ++i) {
			this.list[i].pos.x = mirrorX(this.list[i].pos.x, this.list[i].pos.y);
			this.list[i].pos.y = mirrorY(this.list[i].pos.x, this.list[i].pos.y);
		}
	}
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
		var x = komaList.list[i].pos.x;
		var y = komaList.list[i].pos.y;
		komaList.context.save();
		if (ME != komaList.list[i].host) {
			komaList.context.translate((komaList.list[i].pos.x+1) * MASU_SIZE,
									   (komaList.list[i].pos.y+1) * MASU_SIZE);
			komaList.context.rotate(Math.PI);
			x = 0;
			y = 0;
		}
		komaList.context.drawImage(KOMA.img, sx, sy, sw, sh,
								   x * MASU_SIZE + gosaX,
								   y * MASU_SIZE + gosaY,
								   dw, dh);
		komaList.context.restore();
	}
}

//==================================================

motiGoma.init = function(target) {
	this.initialize(target);
	this.size = { x: this.canvas.width, y: this.canvas.height };
}

motiGoma.update = function(target) {
	this.init(target)
	this.clear();
	this.draw(target);
}

motiGoma.clear = function() {
	this.context.clearRect(0, 0, this.size.x, this.size.y);
}

motiGoma.draw = function(target) {
	this.context.fillStyle = "#BD6600";
	this.context.fillRect(0, 0, this.size.x, this.size.y);

	var myKoma = new Array;
	for (var i=0; i<DATA.motiGoma.length; ++i) {
		if ( (target == "myKoma") && (ME == DATA.motiGoma[i].host) )
			myKoma.push(DATA.motiGoma[i]);
		else if ( (target == "enemyKoma") && (ME != DATA.motiGoma[i].host) )
			myKoma.push(DATA.motiGoma[i]);
	}
	for (var i=0; i<DATA.motiGoma.length; ++i)
		drawFunc(DATA.motiGoma[i].name, i);

	function drawFunc(name, i) {
		switch (name) {
		case "ou": f(50, 0, 135, 158, 0, -2, 55, 62, i); break;
		case "kin": f(435, 0, 130, 170, 6, -6, 50, 70, i); break;
		case "gin": f(50,310, 130, 145, 2, -2, 50, 60, i); break;
		case "uma": f(190, 310, 120, 148, 6, -4, 47, 62, i); break;
		case "yari": f(320, 310, 115, 150, 6, -4, 47, 62, i); break;
		case "hisha": f(190, 2, 120, 160, 5, -4, 50, 66, i); break;
		case "kaku": f(315, 2, 120, 160, 5, -4, 50, 66, i); break;
		case "hu": f(435, 310, 120, 155, 3, -6, 50, 66, i); break;
		}

		function f(sx, sy, sw, sh, gosaX, gosaY, dw, dh, i) {
			var size = MASU_SIZE;
			if (myKoma.length>10) {
				dw = dw/2;
				dh = dh/2;
				size = MASU_SIZE/2;
			}
			motiGoma.context.drawImage(KOMA.img, sx, sy, sw, sh,
									   DATA.motiGoma[i].pos.x * size + gosaX,
									   DATA.motiGoma[i].pos.y * size + gosaY,
									   dw, dh);
		}
	}

}

//==================================================

/*
 a = { x: 0, y: 0 };
 b = { x: 0, y: 0 };
 console.log( equalObj(a, b) ); //#=> true
 a = { x: 0, y: 0 };
 b = { y: 0, x: 0 };
 console.log( equalObj(a, b) ); //#=> true 
 a = { pos: {x: 0, y: 0}, t: 0 };
 b = { pos: {x: 0, y: 0}, t: 0 };
 console.log( equalObj(a, b) ); //#=> true 
 a = { x: 0, y: 0 };
 b = { x: 0 };
 console.log( equalObj(a, b) ); //#=> false
 a = { x: 0, y: 0 };
 b = { x: 0, y: 1 };
 console.log( equalObj(a, b) ); //#=> false
 a = { s: 0, y: 0 };
 b = { x: 0, y: 0 };
 console.log( equalObj(a, b) ); //#=> false
 a = { x: 0, y: 0 };
 b = { x: 0, y: 0, z: 0};
 console.log( equalObj(a, b) ); //#=> false
 a = { pos: {x: 0, y: 0}, t: 0 };
 b = { pos: {x: 0, y: 1}, t: 0 };
 console.log( equalObj(a, b) ); //#=> false 
*/
function equalObj(a, b) {
	var flag = true;
	if (Object.keys(a).length != Object.keys(b).length)
		return false 
	Object.keys(a).forEach( function(key) {
		if ( (typeof(a[key]) == "object") &&
		     (typeof(b[key]) == "object") ){
			flag = equalObj(a[key], b[key]);
			return;
		}
		if (a[key] != b[key]) {
			flag = false;
			return;
		}
	});
	return flag;
}

/*
 a = [1, 2, 3];
 b = [1, 2, 3];
 console.log( equalAry(a, b) ); //#=> true
 a = [1, 2, 3];
 b = [1, 2];
 console.log( equalAry(a, b) ); //#=> false
 a = [1, 2, 3];
 b = [1, 5, 3];
 console.log( equalAry(a, b) ); //#=> false
 a = [1, 2, 3];
 b = [3, 2, 1];
 console.log( equalAry(a, b) ) //#=> false
*/
function equalAry(a, b) {
	if (a.length != b.length) return false;
	for (var i=0; i<a.length; ++i) {
		if (a[i] != b[i])
			return false;
	}
	return true;
}

function containObj(elem, objAry) {
	for each (var obj in objAry) {
		if ( equalObj(elem, obj) )
			return true;
	}
	return false;
}


/*
 a = [ {x:0, y:0}, {x:0, y:0}, {x:0, y:0} ];
 console.log( uniqObjAry(a) ) //#=> [ {x:0, y:0} ];
 a = [ {x:0, y:0}, {y:0, x:0}, {y:0, x:0} ];
 console.log( uniqObjAry(a) ) //#=> [ {x:0, y:0} ];
 a = [ {x:0, y:0, z:0}, {x:0, y:0}, {x:0, y:0} ];
 console.log( uniqObjAry(a) ) //#=> [ {x:0, y:0, z:0}, {x:0, y:0} ];
 a = [ {x:0, y:0}, {x:0, y:1}, {x:0, y:0} ];
 console.log( uniqObjAry(a) ) //#=> [ {x:0, y:0}, {x:0, y:1} ];
 a = [ {pos: {x:0, y:1}, t:0}, {x:0, y:1}, {x:0, y:0}, {pos: {x:0, y:0}, t:0} ];
 console.log( uniqObjAry(a) ) //#=> [ {pos: {x:0, y:0}, t:0}, {x:0, y:0}, {x:0, y:1} ];
*/
function uniqObjAry(ary) {
	var list = new Array;
	var flag = false;
	for (var i=0; i<ary.length; ++i) {
		for (var o=0; o<ary.length; ++o) {
			if ( (o == ary.length-1) && !containObj(ary[i], list) ) {
				list.push(ary[i]);
				flag = true
				break;
			}
			if ( equalObj(ary[i], ary[o])  ||
				 !equalAry(Object.keys(ary[i]), Object.keys(ary[o])) )
				continue;
			flag = true;
		}
		if (flag)
			continue;
		list.push(ary[i]);
	}
	return list;
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
			socket.emit('message', 'quit');
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
		motiGoma.update("myKoma");
		motiGoma.update("enemyKoma");
		debug(ME);
	});
});

//盤上をひっくり返す
//駒を取る
//手持ち駒リスト
//駒成る
//王をとったら終わり


//どっちのターンか表示

