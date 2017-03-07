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
        this.updateShips(); //Guess where they are going and update their x and y locally, might reduce lag?
        this.drawShips();
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
     * Draws all the ships on the map
     */
    drawShips: function() {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
        var that = this;
        this.ships.forEach(function(ship) {
            that.ctx.save();
            that.ctx.translate(ship.pos.x, ship.pos.y);
            that.ctx.rotate(ship.angle);
            that.ctx.drawImage(ship.image, ship.image.width / -2, ship.image.height / -2, ship.image.width, ship.image.height);
            that.ctx.restore();
        });

    },

    updateShips: function() {
      var that = this;
      this.ships.forEach( function(ship) {
        if(!that.playerShip || ship.id !== that.playerShip.id){
          //Wind calculations
          var windDirection = normalize(that.wind[0], that.wind[1]);
          var windMagnitude = lengthVec(that.wind[0], that.wind[1]);
          var cosOfAngle = dotVec(windDirection, ship.dir);
          var wSpeed = windMagnitude * cosOfAngle; //If the wind is parallell to the boat then the speed becomes equal to the magnitue of the wind, if it is perpendicular then it becomes 0

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
        game.wind = serverData.wind;

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



    }
}
