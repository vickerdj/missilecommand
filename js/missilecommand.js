$('document').ready(function(){	
	
	//Create bombing waves
	function BombWave(numBombs, bombingDelay){
		this.numBombs = numBombs;
		this.bombingDelay = bombingDelay;
	};
	var bWaves = [];
	bWaves[0] = new BombWave(4, 0);
	bWaves[1] = new BombWave(3, 2000);
	bWaves[2] = new BombWave(2, 8000);
	bWaves[3] = new BombWave(3, 13000);
	
	//Create game levels
	function Level(active, bSpeed, bWaves, bColor){
		this.active = active;
		this.bSpeed = bSpeed;
		this.bWaves = bWaves;
		this.bColor = bColor;
	};
	var levels = [];
	levels[0] = new Level(true, 16, 3, "lime");
	levels[1] = new Level(false, 6, 3, "lime");
	levels[2] = new Level(false, 8, 4, "red");
	levels[3] = new Level(false, 16, 4, "red");

	//get a reference to the canvas 
	var canvas = document.getElementById('canvas'); 
	//get a reference to the drawing context 
	var c = canvas.getContext('2d');
	//Data for drawing land, bases and missiles
	var landData = [[20,50],[24,50],[28,46,"missile"],[56,46],[60,50],[80,30,"city"],[108,30],[114,36],[118,36],[126,28,"city"],[154,28],[158,32],
	[168,32],[174,26,"city"],[202,26],[226,50],[230,50],[234,46,"missile"],[262,46],[266,50],[270,50],[290,30,"city"],[318,30],[324,24],
	[328,24],[330,22,"city"],[358,22],[368,32],[370,32],[372,30,"city"],[400,30],[404,34],[424,34],[440,50],[444,50],[448,46,"missile"],
	[476,46],[480,50],[482,50],[500,32]];
	var cityData = [1,3,2,1,3,2,3,5,4,2,1,3,2,1];	
	var missileData = [[0,0],[6,6],[12,12],[18,18],[12,0],[18,6],[24,12],[24,0],[30,6],[36,0]];
	var explodeColors = ["white","#ffcccc","#ff8080","#ffffcc"];
	//create bases----------------------------------------------------------------------------------------------------------------
	function Base(xPos, yPos, baseType){
		this.xPos = xPos;
		this.yPos = yPos;
		this.baseType = baseType;
		this.missilesLeft = 10;
		this.alive = true;
	};
	var bases = [];	
	for (var i in landData){
		if(landData[i][2] === "city" || landData[i][2] === "missile"){
			var newBase = new Base(landData[i][0],landData[i][1],landData[i][2]);	
			bases.push(newBase);
		};
	};
	//Initialize game variables-----------------------------------------------------------------------------------------------------
	var currLevel = 0;
	var citiesLeft = 6;
	var gameOver = false;
	var endLevel = false;
	var score = 0;
	var framesPerSecond = 10;
	var step = 2;
	//Initialize level variables-----------------------------------------------------------------------------------------------------------
	var init = function(){	
		mSpeed = 16;
		bombs = [];
		missiles = [];
		explosions = [];
		readyToFire = true;
		bombRadius = 36;	
		bombsAlive = true;
		totalMissilesLeft = 0;
		basesLeft = 0;
		for (var i in bases){
			base = bases[i];			
			if(base.baseType === "missile"){
				base.missilesLeft = 10;
				base.alive = true;
			};
		};		
		aliveBases = [];
		for(var j=0; j<bases.length; j++){
			base = bases[j];
			if(base.alive === true){
				aliveBases.push(j);
			};
		};
	};

	//Function to draw static images-------------------------------------------------------------------------------------------------
	var render = function(){
		//draw screen--------------------------------------
		c.fillStyle = "black";
		c.globalAlpha = 100/100; 
		c.fillRect(0,0,500,500); 
		//draw land----------------------------------------
		drawLand();
		//draw cities--------------------------------------
		for(var i in bases){
			base = bases[i];
			if(base.baseType === "city" && base.alive === true){
				endX = base.xPos;
				endY = base.yPos;
				drawCity(endX,endY);
			};
		};
		//draw silo missiles-------------------------------	
		var xInitial = 0;
		var yInitial = 0;
		for(var i in bases){
			base = bases[i];
			if(base.baseType === "missile" && base.alive === true){
				xInitial = base.xPos - 8;
				yInitial = base.yPos - 24;
				for(j=0; j<base.missilesLeft; j++){
					var xStart = xInitial + missileData[j][0];
					var yStart = yInitial + missileData[j][1];
					drawSiloMissile(xStart,yStart);
				};	
			};
		};
		//If end of level display bonus points------------------------------------------
		if(endLevel){
			//Draw remaining missiles--------------------------------------------------
			var xStart = 180;
			for(var i in bases){
				base = bases[i];
				if(base.baseType === "missile" && base.alive === true){
					for(j=1; j<=base.missilesLeft; j++){
						drawSiloMissile(xStart, 250);
						totalMissilesLeft += 1;
						xStart += 8;
					};
				};
			};
			//Draw remaining cities
			var xStart = 180;
			for(var i in bases){
				if(base.baseType === "city" && base.alive === true){
					drawCity(xStart, 260);
					xStart += 28;
					basesLeft += 1;
				};
			};
			var missPoints = totalMissilesLeft * 5;
			var basePoints = basesLeft * 100;
			score += (missPoints + basePoints) * (currLevel + 1);
			$('.missPoints').removeClass("hide");
			$('.missPoints').text(missPoints);
			$('.basePoints').removeClass("hide");
			$('.basePoints').text(basePoints);
		} else {
			$('.mult').addClass("hide");
			$('.missPoints').addClass("hide");
			$('.basePoints').addClass("hide");
		};
		//Add scoreboard	
		$('.score2').text(score);
		//Add/remove points multiplier
		$('.multiplier').text(currLevel + 1);
	};
	//Function to draw a city------------------------------------------------
	var drawCity = function(endX,endY){
		c.fillStyle = "#33ccff";
		c.globalAlpha = 100/100;
		var cityX = endX;
		for (j=0; j<cityData.length; j++){
			var cityY = cityData[j] * step;
			c.fillRect(cityX, (500 - endY - cityY), step, cityY); 	
			cityX += step;
		};
	};
	//function to draw the land---------------------------------------------
	var drawLand = function(){
		var curX = 0;
		var curY = 30;
		var endX = 0;
		var endY = 0;
		var direction = 0;
		var width = 0;
		for(var i in landData){			
			endX = landData[i][0];
			endY = landData[i][1];
			direction = Math.sign(endY - curY);
			width = endX - curX;
			for(j=1; j<=width; j++){
				c.fillStyle = "yellow"; 
				c.globalAlpha = 100/100;
				c.fillRect(curX, (500-curY), 1, curY); 			
				curX += 1;
				curY += (direction * 1);
			};
			curX = landData[i][0];
			curY = landData[i][1];
		};
	};
	//Function to draw a missile--------------------------------------------
	var drawSiloMissile = function(xStart,yStart){		
		c.fillStyle = "blue"; 
		c.globalAlpha = 100/100;
		c.fillRect(xStart, (500-yStart), step, step * 2);
		c.fillRect(xStart + step, (500-(yStart + (step * 3))), step, step * 4);
		c.fillRect(xStart + (step * 2), (500-yStart), step, step * 2);
	};
	//Function to run game--------------------------------------------------------------------------------------------
	var game = function(currLevel){
		init();
		render();	
		var level = levels[currLevel];
		endLevel = false;
		setTimeout(function(){	
			//Create bombs in waves	
			for (var waveNum=0; waveNum<level.bWaves; waveNum++) {
				(function(arg1, arg2){
					setTimeout(function(){
						createBombs(arg1, arg2);
					},bWaves[waveNum].bombingDelay);
				})(waveNum, currLevel);
			};	
			var gameLoop = function(){
				setTimeout(function(){	
					
					render();
					//Bombs
					drawBombs(currLevel);
					updateBombs(currLevel);
					//Missiles
					createMissile();
					drawMissile();
					updateMissile();
					//Explosions
					drawExplosions();
					updateExplosions();
					if(gameOver){
						endGame();
					} else {
						if(bombs.length != 0 || explosions.length != 0){
							gameLoop();
						} else {
							endLevel = true;
							//Render without init to show bonus points earned-------------------
							render();
							currLevel += 1;
							game(currLevel);
						};
					};
				},1000/framesPerSecond);
			};
			gameLoop();
		},3000);
	};
	
	//Function to create bombs and push into bombs array, ready for drawing-----------------
	var createBombs = function(waveNum, currLevel){	
		for (i=1; i<=bWaves[waveNum].numBombs; i++){
			//Choose targets from alive bases
			var target = parseInt(Math.random() * aliveBases.length);
			var targetIndex = aliveBases[target];
			var bSpeed = levels[currLevel].bSpeed;
			var xStart = parseInt(Math.random() * 500); //between 0 and canvas width
			var xEnd = bases[targetIndex].xPos + parseInt(Math.random() * 28); //between start and end of base
			var yEnd = 500 - bases[targetIndex].yPos; //base
			var gradient = (yEnd - 0)/(xEnd - xStart);
			var xNext = (bSpeed/gradient) + xStart;
			bombs.push({
				xStart: xStart, 
				yStart: 0, //top of canvas
				xEnd: xEnd,
				yEnd: yEnd, 
				xNext: xNext,
				yNext: bSpeed,
				target: targetIndex,
				waveNum: waveNum,
				aCollision: false
			});
		};	
	};

	//Function to draw bombs---------------------------------------------------------	
	var drawBombs = function(currLevel){
		c.globalAlpha = 100/100;
		var bColor = levels[currLevel].bColor;
		for(var i in bombs){
			//Draw bomb trail
			var bomb = bombs[i];
			c.lineWidth = 1;
			c.strokeStyle = bColor; 
			c.beginPath();
			c.moveTo(bomb.xStart,bomb.yStart); 
			c.lineTo(bomb.xNext,bomb.yNext); 
			c.stroke(); 
			//Draw bomb
			c.beginPath(); 
	        c.arc(bomb.xNext,bomb.yNext, 1, 0, 2*Math.PI); 
	        c.closePath(); 
	        c.fillStyle = "yellow";  
	        c.fill(); 
		};	
	};

	//Function to update bombs-----------------------------------------------------------		
	var updateBombs = function(currLevel){
		for(var i in bombs){
			var bomb = bombs[i];
			var bSpeed = levels[currLevel].bSpeed;
			//Update next x and y coords
			if(bomb.yNext < bomb.yEnd && bomb.aCollision === false){
				var gradient = (bomb.yEnd - bomb.yStart)/(bomb.xEnd - bomb.xStart);
				bomb.xNext += (bSpeed/gradient);
				bomb.yNext += bSpeed;
			};
			//Missile or bomb collides with Bomb------------------------------------------
			if(bomb.yNext < bomb.yEnd && bomb.aCollision === true){
				score += 25;
				explosions.push({
					xCoord: bomb.xNext,
					yCoord: bomb.yNext,
					radius: 6,
					colorNum: 0,
					explodeOut: true	
				});
				bombs.splice(i,1);
			};
			//Bomb hits target
			if(bomb.yNext >= bomb.yEnd){
				explosions.push({
					xCoord: bomb.xEnd,
					yCoord: bomb.yEnd,
					radius: 6,
					colorNum: 0,
					explodeOut: true	
				});	
				//Reduce count of cities left-------------------------------------------
				var targetBase = bases[bomb.target];
				if(targetBase.baseType === "city" && targetBase.alive === true){
					citiesLeft -= 1;
				};
				if(targetBase.baseType === "missile"){
					targetBase.missilesLeft = 0;
				};
				targetBase.alive = false;
				//If no cities left alive then game is over-----------------------------
				if(citiesLeft === 0){
					gameOver = true;
				};
				bombs.splice(i,1);	
			};
		};
	};

	var createMissile = function(){
		$('#canvas').click(function(){
			var xEnd = event.clientX - 410 - 2;
	    	var yEnd = event.clientY - 150 + 6;
	    	//Determine nearest base with missiles left
			var xBasePrev = 0;
	    	for(i in bases){
	    		base = bases[i];
	    		if(base.baseType === "missile" && base.alive === true && xEnd > xBasePrev && xEnd <= 500){
	    			var baseFired = i;	
	    			xBasePrev = bases[i].xPos + 119;
	    		};
	    	};
	    	//Create missile and add it to missiles array
			var base = bases[baseFired];
			var xStart = base.xPos + 14;
			var yStart = 500- base.yPos; 
			var gradient = (yEnd - yStart)/(xEnd - xStart);
			var xNext = xStart - (mSpeed/gradient);
			var yNext = yStart - mSpeed;
			if(gradient > 0 && xNext > xEnd || gradient < 0 && xNext < xEnd){
				xNext = xEnd;
				yNext = yEnd;
			};
			if(readyToFire){
				missiles.push({
					xStart: xStart,
					yStart: yStart,
					xEnd: xEnd,
					yEnd: yEnd,
					xNext: xNext,
					yNext: yNext,
				});
				base.missilesLeft -= 1;
				//If no missiles left then set base to dead
				if(base.missilesLeft === 0){
					base.alive = false;
				};
				readyToFire = false;
			};
		});
	};

	var drawMissile = function(){
		c.strokeStyle = "#33ccff"; 
		c.lineWidth = 1; 
		c.globalAlpha = 100/100;
		for(var i in missiles){
			var missile = missiles[i];
			c.beginPath();
			c.moveTo(missile.xStart,missile.yStart); 
			c.lineTo(missile.xNext,missile.yNext); 
			c.stroke(); 
		};	
	};

	var updateMissile = function(){
		for(var i in missiles){
			var missile = missiles[i];
			//Update next x and y coords
			if(missile.yNext > missile.yEnd){
				var gradient = (missile.yEnd - missile.yStart)/(missile.xEnd - missile.xStart);
				missile.xNext -= (mSpeed/gradient);
				missile.yNext -= (mSpeed);
			} 
			else {
				readyToFire = true;
				explosions.push({
					xCoord: missile.xEnd,
					yCoord: missile.yEnd,
					radius: 6,
					colorNum: 0,
					explodeOut: true	
				});			
				missiles.splice(i,1);	
			};
		};
	};

	var drawExplosions = function(){
		for(var i in explosions){
			var explode = explosions[i];
	        c.beginPath(); 
	        c.arc(explode.xCoord,explode.yCoord, explode.radius, 0, 2*Math.PI); 
	        c.closePath(); 
	        c.fillStyle = explodeColors[explode.colorNum]; 
	        c.globalAlpha = 50/100; 
	        c.fill(); 
	      	//Detect any collision with bombs
	      	for(var j in bombs){
	      		var bomb = bombs[j];
	      		var aCollision = c.isPointInPath(bomb.xNext, bomb.yNext);	
	      		bomb.aCollision = aCollision;
	      	};
	    };
	};

	var updateExplosions = function(){
		for(var i in explosions){
			var explode = explosions[i];
	        if(explode.radius < bombRadius && explode.explodeOut === true){
	        	explode.radius += 2;
	        };
	        if(explode.radius === bombRadius){
	        	explode.explodeOut = false;
	        	explode.radius -= 2;
	        };
	        if(explode.radius < bombRadius && explode.explodeOut === false){
	        	explode.radius -= 2;
	        };
	        if(explode.radius === 2){
	        	explosions.splice(i,1);
	        };
	        if(explode.radius % 4 === 0){
	        	if(explode.colorNum < 3){
	        		explode.colorNum += 1;	
	        	} else {
	        		explode.colorNum = 0;	
	        	};
	        };
	    }; 
	};

	var endGame = function(){
		alert("Game over!");
	};

	game(currLevel);

});