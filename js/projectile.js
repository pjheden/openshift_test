//projectile.js
module.exports = function Projectile(id, ownerId, pos, angle, tools, isLeft) {
	/**
	 * Set initial variables for the projectile
	 */
	// FIXME: Ball need to move slower and be less effected by wind
	this.id = id;
	this.ball_speed = 200;
	this.r = 7;

	this.wind_factor = 1.5;
	this.steps = 0;
	this.max_steps = 130;

	this.pos = {
		x: pos.x,
		y: pos.y
	};
	this.ownerId = ownerId;
	this.dead = false;
	this.speed = {
		x: this.ball_speed * Math.sin(angle) * isLeft,
		y: -this.ball_speed * Math.cos(angle) * isLeft
	};

	this.tools = tools;

	this.move = function (wind, deltaTime) {
		if (this.steps >= this.max_steps) { //FIXME: Change from number of steps to out of boundary
			this.dead = true;
			return;
		}

		//Wind calculations
		var windDirection = this.tools.normalize(wind[0], wind[1]);
		var windMagnitude = this.tools.lengthVec(wind[0], wind[1]);

		//Update projectile position
		var wSpeed = {
			x: windDirection.x * windMagnitude,
			y: windDirection.y * windMagnitude
		};

		this.speed.x += wSpeed.x * this.wind_factor;
		this.speed.y += wSpeed.y * this.wind_factor;
		this.pos.x += this.speed.x * deltaTime;
		this.pos.y += this.speed.y * deltaTime;

		this.steps += 1;
	};

	this.animateDeath = function(){
		//Add a html img of splah and remove it after some time
		str = '<img id="'+this.id+'img" src="./images/splash.png" alt="splash"';
		str += 'style="position:fixed; left:'+parseInt(this.pos.x)+'px; top:'+parseInt(this.pos.y)+'px;"'
		str += '>';
		return {elem: str, id: this.id };
	}
};



// /**
//  * Constructor for Projectile class
//  * @param {String} id - Unique id
//  * @param {String} ownerId - Id of the owner for projectile
//  * @param {Object} pos - Start position for the projectile
//  * @param {Int} angle - Start angle for the projectile
//  */
// function Projectile(id, ownerId, pos, angle) {
// 	// FIXME: Ball need to move slower and be less effected by wind
// 	this.id = id;
// 	this.ball_speed = 10;
// 	this.r = 7;

// 	this.wind_factor = 0.1;
// 	this.steps = 0;
// 	this.max_steps = 100;

// 	this.pos = {
// 		x: pos.x,
// 		y: pos.y
// 	};
// 	this.ownerId = ownerId;
// 	this.dead = false;
// 	this.speed = {
// 		x: 0,
// 		y: 0
// 	};
// 	this.init(angle);
// }


// Projectile.prototype = {
// 	/**
// 	 * Set initial variables for the projectile
// 	 */
// 	init: function (angle) {
// 		this.speed.x = this.ball_speed * Math.sin(angle);
// 		this.speed.y = -this.ball_speed * Math.cos(angle);
// 	},

// 	move: function (wind) {
// 		if (this.steps >= this.max_steps) { //FIXME: Change from number of steps to out of boundary
// 			this.dead = true;
// 			return;
// 		}

// 		//Wind calculations
// 		var windDirection = normalize(wind[0], wind[1]);
// 		var windMagnitude = lengthVec(wind[0], wind[1]);

// 		//Update projectile position
// 		var wSpeed = {
// 			x: windDirection.x * windMagnitude,
// 			y: windDirection.y * windMagnitude
// 		};

// 		this.speed.x += wSpeed.x * this.wind_factor;
// 		this.speed.y += wSpeed.y * this.wind_factor;
// 		this.pos.x += this.speed.x;
// 		this.pos.y += this.speed.y;

// 		this.steps += 1;
// 	}
// };