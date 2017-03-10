var INTERVAL = 50;
var WIDTH;
var HEIGHT;

function Game(socket, ctx, w, h) {
  console.log('Game constructor');
    this.socket = socket;
    this.ctx = ctx;

    WIDTH = w; HEIGHT = h;

    this.ships = [];
    this.playerShip;

    this.wind = [1, 1];
    var g = this;

    setInterval(function() {
        g.mainLoop();
    }, INTERVAL);
}

Game.prototype = {

    init: function(wind, ships) {
        this.wind = wind;
        for (var i = 0; i < ships.length; i++) {
            if (!ships[i].image) {
                var src = './images/ships/ship_pattern0.png';
                ships[i].image = new Image();
                ships[i].image.src = src;
                ships[i].image.width = ships[i].image.width / 10;
                ships[i].image.height = ships[i].image.height / 10;
            }
            this.ships.push(ships[i]);
        }
    },

    mainLoop: function() {
        this.updateAllObjects();
        this.clearMap();
        this.drawShips();
        this.drawProjectile();
        if (this.playerShip) {
            this.playerShip.rotate();
            this.playerShip.move(this.wind);
            this.sendData();
        }
    },

    addShip: function(id, pos, isPlayer) {
        var t = new Ship(id, this.ctx, pos);
        this.ships.push(t);
        if (isPlayer) {
            this.playerShip = t;
            t.setControls();
            t.setSocket(this.socket);
        }
    },

    removeShip: function(shipId) {
        this.ships = this.ships.filter(function(t) {
            return t.id != shipId
        });
    },
    /**
     * Clears the canvas
     */
    clearMap: function() {
      this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
    /**
     * Draws all the ships on the map
     */
    drawShips: function() {
        var that = this;
        this.ships.forEach(function(ship) {
          that.ctx.save();
          that.ctx.translate(ship.pos.x, ship.pos.y);
          that.ctx.rotate(ship.angle);
          that.ctx.drawImage(ship.image, ship.image.width / -2, ship.image.height / -2, ship.image.width, ship.image.height);
          that.ctx.restore();
        });

    },

    /**
     * Draws all the projectiles of the map
     */
    drawProjectile: function() {
      var that = this;
      this.projectiles.forEach( function(proj) {
        that.ctx.beginPath();
        that.ctx.arc(proj.pos.x, proj.pos.y, proj.r, 0, 2*Math.PI);
        that.ctx.stroke();
      });
    },
    updateAllObjects: function() {
      //Wind calculations
      var windDirection = normalize(this.wind[0], this.wind[1]);
      var windMagnitude = lengthVec(this.wind[0], this.wind[1]);

      this.updateShips(windDirection, windMagnitude);
      this.updateProjectiles(windDirection, windMagnitude);
    },
    /**
     * Update the movement of the projectiles locally to reduce lag
     * @param {Vector} windDirection - direction of the wind 2D
     * @param {Double} windMagnitude - Magnitude of the wind
     */
    updateProjectiles: function(windDirection, windMagnitude) {
      var that = this;
      this.projectiles.forEach( function(projectile) {
        //Update projectile position
        var wSpeed = {
          x: windDirection[0] * windMagnitude,
          y: windDirection[1] * windMagnitude
        };
        projectile.speed += projectile.speed + wSpeed;
        projectile.pos += projectile.speed;
      });

    },
    /**
     * Make a guess of the ships moevments and update them locally
     */
    updateShips: function(windDirection, windMagnitude) {
      var that = this;
      this.ships.forEach( function(ship) {
        if(!that.playerShip || ship.id !== that.playerShip.id){
          //Ship calc based on wind
          var cosOfAngle = dotVec(windDirection, ship.dir);
          //If the wind is parallell to the boat then the speed becomes equal to the magnitue of the wind, if it is perpendicular then it becomes 0
          var wSpeed = windMagnitude * cosOfAngle;
          var moveX = (ship.speed * ship.dir.x) + (wSpeed * ship.dir.x);
          var moveY = (ship.speed * ship.dir.y) + (wSpeed * ship.dir.y);

          //boundary control
          if (ship.pos.x + moveX > (0 + ship.image.width / 2) && (ship.pos.x + moveX) < (WIDTH - ship.image.width / 2)) {
              ship.pos.x += moveX;
          }
          if (ship.pos.y + moveY > (0 + ship.image.height / 2) && (ship.pos.y + moveY) < (HEIGHT - ship.image.height / 2)) {
              ship.pos.y += moveY;
          }
        }
      });
    },
    /**
     * Send data to the server about your ship properties
     */
    sendData: function() {
        //Send local data to server
        var gameData = {};
        //Send ship data
        var t = {
            id: this.playerShip.id,
            pos: this.playerShip.pos,
            angle: this.playerShip.angle,
            dir: this.playerShip.dir
        };
        gameData.ship = t;

        //Client game does not send any info about projectiles,
        //the server controls that part
        this.socket.emit('clientSync', gameData);
    },

    /**
     * Recieves data from the server and update the local game accordingly
     * @param {Object} serverData - The servers data of the game
     */
    recieveData: function(serverData) {
        var game = this;
        //TODO Add control if proj or ship is alive and if not remove it
        
        game.wind = serverData.wind;

        serverData.shipsToRemove.forEach( function(shipId){

        });
        serverData.projToRemove.forEach( function(projId){

        });

        //TODO make a better update system
        //Update ship information
        serverData.ships.forEach(function(serverShip) {
            var shipFound = false;
            game.ships.forEach(function(clientShip) {
                if (serverShip.id === clientShip.id) {
                    clientShip.pos = serverShip.pos;
                    clientShip.angle = serverShip.angle;
                    clientShip.dir = serverShip.dir;
                    shipFound = true;
                }
            });
            if (!shipFound) game.addShip(serverShip.id, serverShip.pos, false);
        });

        //TODO recieve projectile data
    }
}
