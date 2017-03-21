//gameserver.js
// var User = require('./user.js');
// var user = new User();

module.exports = function GameServer(roomId) {
	var that = this;
	that.projs_created = 0; //projectiles created, for unique id's
	that.roomId = roomId;
	that.ships = [];
	that.projectiles = [];
	that.killfeed = [];
	that.wind = [1, 1];

	/*that.scoreboard = new Scoreboard();*/

	var wind_interval = 5000;
	setInterval(function () {
		//that.updateWind(); FIXME: temprorarily shut off wind for easier testing
	}, wind_interval);

	this.addShip = function (ship) {
		this.ships.push(ship);
	};

	this.removeShip = function (shipId) {
		this.ships = this.ships.filter(function (t) {
			return t.id != shipId
		});
	};

	this.updateShip = function (ship) {
		for (var i = 0; i < this.ships.length; i++) {
			if (this.ships[i].id === ship.id) {
				this.ships[i].pos = ship.pos;
				this.ships[i].angle = ship.angle;
				this.ships[i].dir = ship.dir;
				this.ships[i].collision = ship.collision;
			}
		}
	};
	this.addProjectile = function (projectile) {
		this.projectiles.push(projectile);
	};
	this.removeProjectile = function (projId) {
		this.projectiles = this.projectiles.filter(function (t) {
			return t.id != projId
		});
	};
	this.updateProjectiles = function () {
		if(!this.lastCalledTime){
			this.lastCalledTime = Date.now();
		}
		var deltaTime = (Date.now() - this.lastCalledTime) / 1000;
		this.lastCalledTime = Date.now();
		var that = this;
		this.projectiles.forEach(function (proj) {
			proj.move(that.wind, deltaTime);
		});
	};
	//FIXME: The hitbox seems to be quite off.
	this.detectCollision = function () {
		var that = this;
		//For each ship, check if it collides with any projectile
		that.ships.forEach(function (ship) {
			if (!ship.dead) {
				that.projectiles.forEach(function (proj) {
					//TODO this only works if x is center, is it center? testing
					if (Math.abs(proj.pos.x - ship.pos.x) <= (proj.r + ship.collision / 2) &&
						Math.abs(proj.pos.y - ship.pos.y) <= (proj.r + ship.collision / 2) &&
						proj.ownerId !== ship.id) {
						ship.dead = true;
						proj.dead = true;
						that.killfeed.push({
							feedId: 'feed' + that.projs_created,
							playerId: proj.ownerId,
							targetId: ship.id
						});
					}
				});
			}
		});
	};
	this.getData = function (isInitial) {

		var t = {
			ships: this.ships,
			projectiles: this.projectiles,
			killfeed: this.killfeed,
			wind: this.wind,
			roomId: this.roomId
		};

		if (isInitial) {
			var initX = 700;
			var initY = 450;

			t.ship = {
				pos: {
					x: initX,
					y: initY
				},
				angle: 0.0,
				dir: {
					x: 0,
					y: 0
				},
				collision: 0,
				isPlayer: true
			};
		}

		/*if(that.scoreboard.updated){
			t.scores = that.scoreboard.scores;
			that.scoreboard.setUpdated(False);
		}*/

		return t;
	};
	this.clearFeed = function () {
		this.killfeed = [];
	};
	this.updateWind = function () {
		this.wind = [getRandomInt(-3, 3), getRandomInt(-3, 3)];
	};
}

// module.exports = {
//     /**
//      * To keep track of the game
//      * @constructor
//      */
//     init: function() {
//         var that = this;
//         that.projs_created = 0; //projectiles created, for unique id's

//         that.ships = [];
//         that.projectiles = [];
//         that.killfeed = [];
//         that.wind = [1, 1];

//         /*that.scoreboard = new Scoreboard();*/

//         var wind_interval = 5000;
//         setInterval(function () {
//             //that.updateWind(); FIXME: temprorarily shut off wind for easier testing
//         }, wind_interval);
//     },
//     addShip: function (ship) {
// 		this.ships.push(ship);
// 	},
// 	removeShip: function (shipId) {
// 		this.ships = this.ships.filter(function (t) {
// 			return t.id != shipId
// 		});
// 	},
// 	updateShip: function (ship) {
// 		for (var i = 0; i < this.ships.length; i++) {
// 			if (this.ships[i].id === ship.id) {
// 				this.ships[i].pos = ship.pos;
// 				this.ships[i].angle = ship.angle;
// 				this.ships[i].dir = ship.dir;
// 				this.ships[i].collision = ship.collision;
// 			}
// 		}
// 	},
// 	addProjectile: function (projectile) {
// 		this.projectiles.push(projectile);
// 	},
// 	removeProjectile: function (projId) {
// 		this.projectiles = this.projectiles.filter(function (t) {
// 			return t.id != projId
// 		});
// 	},
// 	updateProjectiles: function () {
// 		var that = this;
// 		this.projectiles.forEach(function (proj) {
// 			proj.move(that.wind);
// 		});
// 	},
// 	//FIXME: The hitbox seems to be quite off.
// 	detectCollision: function () {
// 		var that = this;
// 		//For each ship, check if it collides with any projectile
// 		that.ships.forEach(function (ship) {
// 			if (!ship.dead) {
// 				that.projectiles.forEach(function (proj) {
// 					//TODO this only works if x is center, is it center? testing
// 					if (Math.abs(proj.pos.x - ship.pos.x) <= (proj.r + ship.collision / 2) &&
// 						Math.abs(proj.pos.y - ship.pos.y) <= (proj.r + ship.collision / 2) &&
// 						proj.ownerId !== ship.id) {
// 						ship.dead = true;
// 						proj.dead = true;
// 						that.killfeed.push({
// 							playerId: proj.ownerId,
// 							targetId: ship.id
// 						});
// 						console.log('collision found!');
// 					}
// 				});
// 			}
// 		});
// 	},
// 	getData: function () {

// 		var t = {
// 			ships: this.ships,
// 			projectiles: this.projectiles,
// 			killfeed: this.killfeed,
// 			wind: this.wind
// 		};

// 		/*if(that.scoreboard.updated){
// 			t.scores = that.scoreboard.scores;
// 			that.scoreboard.setUpdated(False);
// 		}*/

// 		return t;
// 	},
// 	clearFeed: function () {
// 		this.killfeed = [];
// 	},
// 	updateWind: function () {
// 		this.wind = [getRandomInt(-3, 3), getRandomInt(-3, 3)];
// 	}
// };



// /**
//  * To keep track of the game
//  * @constructor
//  */
// function GameServer() {
// 	var that = this;
// 	that.projs_created = 0; //projectiles created, for unique id's

// 	that.ships = [];
// 	that.projectiles = [];
// 	that.killfeed = [];
// 	that.wind = [1, 1];

// 	/*that.scoreboard = new Scoreboard();*/

// 	var wind_interval = 5000;
// 	setInterval(function () {
// 		//that.updateWind(); FIXME: temprorarily shut off wind for easier testing
// 	}, wind_interval);
// }

// GameServer.prototype = {
// 	addShip: function (ship) {
// 		this.ships.push(ship);
// 	},
// 	removeShip: function (shipId) {
// 		this.ships = this.ships.filter(function (t) {
// 			return t.id != shipId
// 		});
// 	},
// 	updateShip: function (ship) {
// 		for (var i = 0; i < this.ships.length; i++) {
// 			if (this.ships[i].id === ship.id) {
// 				this.ships[i].pos = ship.pos;
// 				this.ships[i].angle = ship.angle;
// 				this.ships[i].dir = ship.dir;
// 				this.ships[i].collision = ship.collision;
// 			}
// 		}
// 	},
// 	addProjectile: function (projectile) {
// 		this.projectiles.push(projectile);
// 	},
// 	removeProjectile: function (projId) {
// 		this.projectiles = this.projectiles.filter(function (t) {
// 			return t.id != projId
// 		});
// 	},
// 	updateProjectiles: function () {
// 		var that = this;
// 		this.projectiles.forEach(function (proj) {
// 			proj.move(that.wind);
// 		});
// 	},
// 	//FIXME: The hitbox seems to be quite off.
// 	detectCollision: function () {
// 		var that = this;
// 		//For each ship, check if it collides with any projectile
// 		that.ships.forEach(function (ship) {
// 			if (!ship.dead) {
// 				that.projectiles.forEach(function (proj) {
// 					//TODO this only works if x is center, is it center? testing
// 					if (Math.abs(proj.pos.x - ship.pos.x) <= (proj.r + ship.collision / 2) &&
// 						Math.abs(proj.pos.y - ship.pos.y) <= (proj.r + ship.collision / 2) &&
// 						proj.ownerId !== ship.id) {
// 						ship.dead = true;
// 						proj.dead = true;
// 						that.killfeed.push({
// 							playerId: proj.ownerId,
// 							targetId: ship.id
// 						});
// 						console.log('collision found!');
// 					}
// 				});
// 			}
// 		});
// 	},
// 	getData: function () {

// 		var t = {
// 			ships: this.ships,
// 			projectiles: this.projectiles,
// 			killfeed: this.killfeed,
// 			wind: this.wind
// 		};

// 		/*if(that.scoreboard.updated){
// 			t.scores = that.scoreboard.scores;
// 			that.scoreboard.setUpdated(False);
// 		}*/

// 		return t;
// 	},
// 	clearFeed: function () {
// 		this.killfeed = [];
// 	},
// 	updateWind: function () {
// 		this.wind = [getRandomInt(-3, 3), getRandomInt(-3, 3)];
// 	}
// }