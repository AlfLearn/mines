
function Cell(sBomb, sState) // делаю ячейку объектом на случай привязки к ней иных способов отображения, например, div-ами
{
	this.bomb = sBomb; // true если в этой клетке есть бомба
	this.state = sState; // F - если тут флажок, число 1-8 если это пустая клетка, соседняя с бомбой, 0 - если это открытое чистое поле
	// " " - пробел означает, что поле просто скрыто и на нём нет даже флажков, "B" - открытая бомба (при окончании игры)
}

var Desk = {  // объект доски
	l:10,  // длина доски
	h:10,  // высота доски
	map: [], //карта размером l*h
	
	// записать что-то в клетку доски:
	mapset: function(b,x,y) 
	{ 	if((x<0)||(x>=this.l)||(y<0)||(y>=this.h)) return false;
		this.map[y*this.l+x]= b; 
	},
	
	// получить содержимое клетки доски:
	mapget: function(x,y) 
	{	if((x<0)||(x>=this.l)||(y<0)||(y>=this.h)) return undefined; 
		return this.map[y*this.l+x]; 
	},
	
	bombCount: 0, // к-во бомб всего
	flagCount: 0, // к-во поставленных флажок (чисто для удобства игрока)
	cellsOpened: 0, //к-во открытых клеток (чтобы было понятно, сколько до победы)
	nowGame: false // призак завершения игры
}

// создаёт новую доску размером sl на sh и расставляет на ней bombCount бомб в случайных местах
Desk.Create = function(sl, sh, bombCount) 
{
	if(bombCount>=(sl*sh)) {
		alert("Столько бомб на доске не поместится");
		return false;
	};
	
	this.l = sl;
	this.h = sh;
	for(var yp=0; yp<sh; yp++) for(var xp=0; xp<sl; xp++) this.mapset( new Cell(false, " "), xp, yp);
	
	var b, sx, sy;
	for(var i=0; i<bombCount; i++) 
	{
		sx = sl*Math.random()^0; // xor 0 эквивалентен округлению
		sy = sh*Math.random()^0; // xor 0 эквивалентен округлению
		b = this.mapget(sx,sy);
		if(b.bomb) i--; // если бомба тут уже есть - попробуем ещё раз
		else b.bomb = true; // если нету - поставим
	};
	
	this.bombCount = bombCount;
	this.flagCount = 0;
	this.cellsOpened = 0;
	this.t = 0;
	
	if(this.drawInit) this.drawInit();
	
	return true;
}

// проверяет, есть ли тут бомба, если да - то заканчивает игру, если нет - считает число бомб рядом и открывает остальное:
Desk.Check = function(x,y)
{
	var c = this.mapget(x,y);
	if(c==undefined) return true;
	if(c.bomb) 
	{	alert("Бум!")
		for(var y=0; y<this.h; y++) for(var x=0; x<this.l; x++)
		{	c = this.mapget(x,y);
			if(c.bomb) c.state = "B";
		};
		Desk.nowGame = false;
		return false;
	};
	
	Desk.Open(x,y); 
	
	return true;
}

// рекурсивно открывает все неоткрытые клетки, имеющие ноль соседей
Desk.Open = function(x,y)
{
	var cell = Desk.mapget(x,y);
	if(cell==undefined) return;
	//if((cell.state!=" ")&&(cell.state!="F")) return;
	if(cell.state!=" ") return; // в виндовом сапёре флажок означает что тут не проверять
	var c;
	var count = 0;
	for(var dy=-1; dy<2; dy+=1)
	for(var dx=-1; dx<2; dx+=1)
	{
		if((dx==0)&&(dy==0)) continue;
		c = Desk.mapget(x+dx, y+dy);
		if(c==undefined) continue;
		if(c.bomb) count++;
	};
	cell.state = count.toString();
	this.cellsOpened++;
	if(this.cellsOpened>= (this.h*this.l - this.bombCount))
	{
		alert("Ура!");
		Desk.nowGame = false;
	};
	
	if(count==0)
	for(var dy=-1; dy<2; dy+=1)
	for(var dx=-1; dx<2; dx+=1)
	{
		if((dx==0)&&(dy==0)) continue;
		c = Desk.mapget(x+dx, y+dy);
		if(c==undefined) continue;
		Desk.Open(x+dx, y+dy);
	};
}

Desk.drawInit = function()
{
	this.sz = 32; // размер клетки
	var canvas = document.getElementById("canv");
	canvas.width = this.l * this.sz;
	canvas.height = this.h * this.sz;
	
	this.mapdraw();
}

Desk.mapdraw = function()
{
	var canvas = document.getElementById("canv");
	var cc = canvas.getContext("2d");
	
	var sz = this.sz; // просто для сокращения
	var chit = document.getElementById("chit").checked;
	
	cc.font = (sz-4)+'px "Tahoma"';
	
	cc.fillStyle = "rgb(0, 0, 0)";
	cc.fillRect(0, 0, this.l*sz, this.h*sz); // закрасим поле чёрным
	
	var cell, s;
	for(var y=0; y<this.h; y++) for(var x=0; x<this.l; x++)
	{
		// фоновые клетки всё жёлтые:
		cc.fillStyle = "yellow";
		cc.fillRect(x*sz, y*sz, sz-1, sz-1);
		
		cell = this.mapget(x,y);
		
		if(chit) if(cell.bomb)
		{	// для подсказки при отладке можно подкрасить заминированные клетки:
			cc.fillStyle = "rgb(128, 0, 0)";
			cc.fillRect(x*sz, y*sz, sz-1, sz-1);
		};
		
		s = cell.state;
		if(s!=" ")
		{
			if(s=="F") cc.fillStyle="rgb(255,0,0)"; else
			if(s=="B") cc.fillStyle="rgb(255,0,0)"; else
			if(s=="0") cc.fillStyle="gray"; else
			cc.fillStyle = "rgb(0, 0, 232)";
			cc.fillText(s, x*sz + sz/4, y*sz +sz*3/4);
		}
	};
	
};

function NewGame()
{
	// создаём модель - доску и расстановку бомб:
	var sl = parseInt(document.getElementById("inpWidth").value) || 10;
	var sh = parseInt(document.getElementById("inpHeight").value) || 10;
	var sc = parseInt(document.getElementById("inpBombCount").value) || 10;
	Desk.Create(sl, sh, sc);
	
	var canvas = document.getElementById("canv"); // два раза понадобится
	
	//навешиваем единственное событие нажатие кнопки мышкой на канве:
	canvas.onmouseup = function (e) {
		// получаем координаты в пределах канвы:
		var x = e.pageX - this.offsetLeft;
		var y = e.pageY - this.offsetTop;
		// узнаем, на какую именно клетку был клик:
		x = (x/Desk.sz) ^0;
		y = (y/Desk.sz) ^0;
		
		var cell = Desk.mapget(x,y);
		if(Desk.nowGame) // по ячейкам можно кликать только если игра не закончена
		if(cell) // что-то делаем только если клик попал по клетке, а не вне доски:
		{
			if(e.which==3) // правая кнопка - ставим флажок
			{
				if(cell.state=="F") { cell.state = " "; Desk.flagCount--; } else
				if(cell.state==" ") { cell.state = "F"; Desk.flagCount++; }; 
				// для клеток с ноликами или бомбами уже ничего не нужно делать
			};
			
			if(e.which==1) // левая кнопка - "взрываем"
			{
				Desk.Check(x,y);
			}
			
			// раз мы что-то сделали, то что-то изменилось и доску надо перерисовать:
			Desk.mapdraw();
		};
		
		var div = document.getElementById("infoPanel");
		div.innerHTML = "x: " + x + " y: " + y + " Открыто: " + Desk.cellsOpened + " Флагов: " + Desk.flagCount + " из "+Desk.bombCount + " бомб";
	};

	// запретим контекстное меню, оно мешает нам ставить бомбы правой кнопкой:
	canvas.oncontextmenu = function(e) { return false; };
	
	document.getElementById("infoPanel").innerHTML = "Сапёр. Правой кнопкой ставим флажки, левой - открываем клетки";
	Desk.nowGame = true;
}

// при загрузке страницы не только навесим обработчик на кнопку "новая игра", но и сразу такую игру запустим:
document.getElementById("ButtonNewGame").onclick = NewGame;
NewGame();