var INTERVAL = 50;

function Game(socket, canvasId, w, h) {
    this.socket = socket;

    this.canvas = $(canvasId);
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas[0].getContext('2d');

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
        console.log('init', wind, ships);
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

    addShip: function(id, pos, isPlayer) {
        var t = new Ship(id, this.canvas, pos);
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
            that.ctx.translate(ship.pos.x, ship.pos.y);
            that.ctx.rotate(ship.angle);
            that.ctx.drawImage(ship.image, ship.image.width / -2, ship.image.height / -2, ship.image.width, ship.image.height);
            that.ctx.restore();
        });

    },

    mainLoop: function() {
        this.drawShips();
        if (this.playerShip) {
            this.playerShip.rotate();
            this.playerShip.move(this.wind);
            this.sendData();
        }
    },

    sendData: function() {
        //Send local data to server
        var gameData = {};
        //Send ship data
        var t = {
            id: this.playerShip.id,
            pos: this.playerShip.pos,
            angle: this.playerShip.angle
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

        //TODO make a better update system
        //Update ship information
        serverData.ships.forEach(function(serverShip) {
            var shipFound = false;
            game.ships.forEach(function(clientShip) {
                if (serverShip.id === clientShip.id) {
                    clientShip.pos = serverShip.pos;
                    clientShip.angle = serverShip.angle;
                    shipFound = true;
                }
            });
            if (!shipFound) game.addShip(serverShip.id, serverShip.pos, false);
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
function Ship(id, canvas, pos) {
    this.id = id;
    this.ctx = canvas[0].getContext('2d');
    var src = './images/ships/ship_pattern0.png';
    this.image = new Image();
    this.image.src = src;
    this.image.width = this.image.width / 10;
    this.image.height = this.image.height / 10;
    this.speed = 2;

    // this.pos.x = x;
    // this.pos.y = y;
    // this.dir = 0;

    this.pos = pos;
    this.dir = {
        x: 0,
        y: 0
    };
    this.rotateDir = 0;
    this.angle = 0.0;
    this.deltaA = Math.PI / 100;

    console.log('Ship created!');

    this.materialize();
}

Ship.prototype = {
    materialize: function() {
        // this.canvas.append('<div id="' + this.id + '" class="tank tank' + this.type + '"></div>');

        this.draw(); //Draw once?
    },
    draw: function() {
        this.ctx.save();
        this.ctx.translate(this.pos.x, this.pos.y);
        this.ctx.rotate(this.angle);
        this.ctx.drawImage(this.image, this.image.width / -2, this.image.height / -2, this.image.width, this.image.height);
        this.ctx.restore();
    },

    /**
     * Set the controls for the ship
     */
    setControls: function() {
        var t = this;
        $(document).keypress(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                // case 119: //W
                //     t.dir.y = -1;
                //     break;
                case 100: //D
                    t.rotateDir = 1;
                    break;
                    // case 115: //S
                    //     t.dir.y = 1;
                    //     break;
                case 97: //A
                    t.rotateDir = -1;
                    break;
            }

        }).keyup(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                // case 87: //W
                //     t.dir.x = 0;
                //     break;
                case 68: //D
                    t.rotateDir = 0;
                    break;
                    // case 83: //S
                    //     t.dir.x = 0;
                    //     break;
                case 65: //A
                    t.rotateDir = 0;
                    break;
            }
        });

    },

    rotate: function() {
        this.angle += this.rotateDir * this.deltaA;
        if (this.angle > Math.PI * 2) {
            this.angle -= this.rotateDir * Math.PI * 2;
        }
        //Rotate direction
        this.dir.x = Math.cos(this.angle);
        this.dir.y = Math.sin(this.angle);
        this.dir = normalize(this.dir.x, this.dir.y);
    },

    move: function(wind) {
        if (this.dead) {
            return;
        }
        //Wind calculations
        var windDirection = normalize(wind[0], wind[1]);
        var windMagnitude = lengthVec(wind[0], wind[1]);
        var cosOfAngle = dotVec(windDirection, this.dir);
        var wSpeed = windMagnitude * cosOfAngle; //If the wind is parallell to the boat then the speed becomes equal to the magnitue of the wind, if it is perpendicular then it becomes 0

        var moveX = (this.speed * this.dir.x) + (wSpeed * this.dir.x);
        var moveY = (this.speed * this.dir.y) + (wSpeed * this.dir.y);

        this.pos.x += moveX;
        this.pos.y += moveY;

        //boundary control
        // if (this.pos.x + moveX > (0 + ARENA_MARGIN) && (this.pos.x + moveX) < (this.canvas.width() - ARENA_MARGIN)) {
        //     this.pos.x += moveX;
        // }
        // if (this.pos.y + moveY > (0 + ARENA_MARGIN) && (this.pos.y + moveY) < (this.canvas.height() - ARENA_MARGIN)) {
        //     this.pos.y += moveY;
        // }
    }
}
