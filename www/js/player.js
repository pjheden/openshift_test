var INTERVAL = 50;

function Game(socket, canvasId, w, h) {
    this.socket = socket;

    this.canvas = $(canvasId);
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas[0].getContext('2d');

    this.ships = [];
    this.playerShip;

    this.wind = [0, 0];
    var g = this;

    setInterval(function() {
        g.mainLoop();
    }, INTERVAL);
}

Game.prototype = {

    addShip: function(id, x, y, isPlayer) {
        var t = new Ship(id, this.canvas, x, y);
        this.ships.push(t);
        if (isPlayer) {
            this.playerShip = t;
            t.setControls();
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        var that = this;
        this.ships.forEach(function(ship) {
            that.ctx.save();
            that.ctx.translate(ship.x, ship.y);
            // that.ctx.rotate(ship.getAngle());
            that.ctx.drawImage(ship.image, ship.image.width / -2, ship.image.height / -2, ship.image.width / 10, ship.image.height / 10);
            that.ctx.restore();
        });

    },

    mainLoop: function() {
        console.log('mainLoop');
        this.drawShips();
        if (this.playerShip) {
            this.playerShip.move(this.wind);
            this.sendData();
        }
    },

    sendData: function() {
        //Send local data to server
        var gameData = {};
        console.log('sendData');
        //Send ship data
        var t = {
            id: this.playerShip.id,
            x: this.playerShip.x,
            y: this.playerShip.y
        };
        gameData.ship = t;

        //Client game does not send any info about projectiles,
        //the server controls that part
        this.socket.emit('clientSync', gameData);
    },

    /**
     * Recieves data from the server and update the local game accordingly
     */
    recieveData: function(serverData) {
        var game = this;
        game.wind = serverData.wind;
        console.log('recieveData', serverData);

        //TODO make a better update system
        //Update ship information
        serverData.ships.forEach(function(serverShip) {
          var shipFound = false;
          game.ships.forEach(function(clientShip){
            if(serverShip.id === clientShip.id){
              clientShip.x = serverShip.x;
              clientShip.y = serverShip.y;
              shipFound = true;
            }
          });
          if(!shipFound) game.addShip(serverShip.id, serverShip.x, serverShip.y, false);
        });



    }
}
/**
 * @constructor
 * @param {string} id - Id for the Ship
 * @param {html} canvas - The canvas to draw in
 * @param {integer} x - The x coordinate of the ship
 * @param {integer} y - The y coordinate of the ship
 */
function Ship(id, canvas, x, y) {
    this.id = id;
    this.ctx = canvas[0].getContext('2d');
    this.src = './images/ships/ship_pattern0.png';
    this.image = new Image();
    this.image.src = this.src;
    this.x = x;
    this.y = y;
    this.dead = false;
    this.dir = [0, 0];
    this.speed = 5;
    console.log('Ship created!');

    this.materialize();
}

Ship.prototype = {
    materialize: function() {
        // this.canvas.append('<div id="' + this.id + '" class="tank tank' + this.type + '"></div>');

        this.draw(); //Draw once?
    },
    draw: function() {
        console.log('draw ship!');
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        // this.ctx.rotate(player.getAngle());
        this.ctx.drawImage(this.image, this.image.width / -2, this.image.height / -2, this.image.width / 10, this.image.height / 10);
        this.ctx.restore();

    },

    /**
     * Set the controls for the ship
     * TODO add rotation
     */
    setControls: function() {
        var t = this;
        $(document).keypress(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                case 119: //W
                    t.dir[1] = -1;
                    break;
                case 100: //D
                    t.dir[0] = 1;
                    break;
                case 115: //S
                    t.dir[1] = 1;
                    break;
                case 97: //A
                    t.dir[0] = -1;
                    break;
            }

        }).keyup(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                case 87: //W
                    t.dir[1] = 0;
                    break;
                case 68: //D
                    t.dir[0] = 0;
                    break;
                case 83: //S
                    t.dir[1] = 0;
                    break;
                case 65: //A
                    t.dir[0] = 0;
                    break;
            }
        });

    },

    move: function(wind) {
        if (this.dead) {
            return;
        }

        var moveX = this.speed * this.dir[0] + wind[0];
        var moveY = this.speed * this.dir[1] + wind[1];
        console.log(moveX, moveY);
        this.x += moveX;
        this.y += moveY;
        // if (this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (this.canvas.width() - ARENA_MARGIN)) {
        //     this.x += moveX;
        // }
        // if (this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < (this.canvas.height() - ARENA_MARGIN)) {
        //     this.y += moveY;
        // }
    }
}
