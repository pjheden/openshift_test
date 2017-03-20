var INTERVAL = 30;
var WIDTH;
var HEIGHT;

function Game(socket, ctx, w, h) {
    console.log('Game constructor');
    this.socket = socket;
    this.ctx = ctx;
    this.roomId;

    WIDTH = w;
    HEIGHT = h;

    this.ships = [];
    this.projectiles = [];
    this.feeds = [];
    this.playerShip;

    this.wind = [1, 1];

    this.serverups;
    this.lastCalledTime_server;
    this.fps;
    this.lastCalledTime;
    this.netgraph = new Netgraph();

}

Game.prototype = {

    init: function (wind, ships, roomId) {
        this.roomId = roomId;
        
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

        var g = this;
        setInterval(function () {
            g.mainLoop();
        }, INTERVAL);
    },

    mainLoop: function () {
        this.updateAllObjects();
        if (this.playerShip) {
            this.playerShip.rotate();
            this.playerShip.move(this.wind);
            this.sendData();
        }
        this.clearMap();
        this.drawShips();
        this.drawProjectiles();

        this.fps = this.requestAnimFrame(this.lastCalledTime);
        this.netgraph.update(this.fps, this.serverups);
    },

    addShip: function (id, pos, isPlayer) {
        var t = new Ship(id, this.ctx, pos);
        this.ships.push(t);
        if (isPlayer) {
            this.playerShip = t;
            t.setControls();
            t.setSocket(this.socket);
        }
    },

    removeShip: function (shipId) {
        this.ships = this.ships.filter(function (t) {
            return t.id != shipId
        });
    },
    /**
     * Clears the canvas
     */
    clearMap: function () {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
    /**
     * Draws all the ships on the map
     */
    drawShips: function () {
        var that = this;
        this.ships.forEach(function (ship) {

            //Draw wind arrow udnder ship
            //that.ctx.rotate( Math.atan( that.wind[1]/ that.wind[0] ) );
            var windAngle = Math.atan(that.wind[1] / that.wind[0]);
            that.ctx.beginPath();
            that.ctx.moveTo(ship.pos.x, ship.pos.y);
            that.ctx.lineTo(ship.pos.x + (ship.image.width / 2) * Math.sin(windAngle), ship.pos.y + (ship.image.width / 2) * Math.cos(windAngle));
            that.ctx.stroke();
            that.ctx.closePath();

            //Draw ship
            that.ctx.save();
            that.ctx.translate(ship.pos.x, ship.pos.y);
            that.ctx.rotate(ship.angle);

            that.ctx.drawImage(ship.image, ship.image.width / -2, ship.image.height / -2, ship.image.width, ship.image.height);
            that.ctx.restore();

            //Draw circle around ship
            that.ctx.beginPath();
            that.ctx.arc(ship.pos.x, ship.pos.y, ship.image.width / 2, 0, 2 * Math.PI); //good visual
            //that.ctx.arc(ship.pos.x, ship.pos.y, ship.image.height / 2, 0, 2 * Math.PI); //hit detection
            that.ctx.stroke();
            that.ctx.closePath();
        });

    },

    /**
     * Draws all the projectiles of the map
     */
    drawProjectiles: function () {
        var that = this;
        this.projectiles.forEach(function (proj) {
            that.ctx.beginPath();
            that.ctx.arc(proj.pos.x, proj.pos.y, proj.r, 0, 2 * Math.PI);
            that.ctx.stroke();
        });
    },
    drawFeeds: function () {
        this.feeds.forEach(function (feed) {
            var kf = new Killfeed(feed.playerId, feed.targetId);
            kf.draw();
        });
        this.feeds = [];
    },
    updateAllObjects: function () {
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
    updateProjectiles: function (windDirection, windMagnitude) {
        var that = this;
        this.projectiles.forEach(function (proj) {
            //Update projectile position
            var wSpeed = {
                x: windDirection.x * windMagnitude,
                y: windDirection.y * windMagnitude
            };
            proj.speed.x += wSpeed.x;
            proj.speed.y += wSpeed.y;
            proj.pos.x += proj.speed.x;
            proj.pos.y += proj.speed.y;
        });

    },
    /**
     * Make a guess of the ships moevments and update them locally
     */
    updateShips: function (windDirection, windMagnitude) {
        var that = this;
        this.ships.forEach(function (ship) {
            if (!that.playerShip || ship.id !== that.playerShip.id) {
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
    requestAnimFrame: function () {
        if (!this.lastCalledTime) {
            this.lastCalledTime = Date.now();
            return 0;
        }
        var delta = (Date.now() - this.lastCalledTime) / 1000;
        this.lastCalledTime = Date.now();
        return 1 / delta;
    },
    serverResponseTime: function () {
        if (!this.lastCalledTime_server) {
            this.lastCalledTime_server = Date.now();
            return 0;
        }
        delta = (Date.now() - this.lastCalledTime_server) / 1000;
        this.lastCalledTime_server = Date.now();
        return delta;
    },
    /**
     * Send data to the server about your ship properties
     */
    sendData: function () {
        //Send local data to server
        var gameData = {};
        //Send ship data
        var t = {
            id: this.playerShip.id,
            pos: this.playerShip.pos,
            angle: this.playerShip.angle,
            dir: this.playerShip.dir,
            collision: this.playerShip.collision,
        };
        gameData.ship = t;
        gameData.roomId = this.roomId;

        //Client game does not send any info about projectiles,
        //the server controls that part
        this.socket.emit('clientSync', gameData);
    },

    /**
     * Recieves data from the server and update the local game accordingly
     * @param {Object} serverData - The servers data of the game
     */
    recieveData: function (serverData) {
        var game = this;
        game.serverups = game.serverResponseTime(game.lastCalledTime_server);

        game.wind = serverData.wind;


        //Update ship information
        serverData.ships.forEach(function (serverShip) {
            if (serverShip.dead) {
                game.removeShip(serverShip.id);
            } else {
                var shipFound = false;
                game.ships.forEach(function (clientShip) {
                    if (serverShip.id === clientShip.id) {
                        clientShip.pos = serverShip.pos;
                        clientShip.angle = serverShip.angle;
                        clientShip.dir = serverShip.dir;
                        clientShip.dead = serverShip.dead;
                        shipFound = true;
                    }
                });
                if (!shipFound) game.addShip(serverShip.id, serverShip.pos, false);
            }
        });

        game.projectiles = serverData.projectiles;

        serverData.killfeed.forEach(function (feed) {
            var kf = new Killfeed(feed.playerId, feed.targetId);
            kf.draw();
        });
    }
}

//TODO: put these classes in seperate files
function Netgraph() {
    this.updateCD = 20;
    this.counter = 0;
}

Netgraph.prototype = {
    update: function (fps, time) {
        if (this.counter >= this.updateCD) {
            this.drawFPS(fps);
            this.drawResponseTime(time);
            this.counter = 0;
        }
        this.counter++;
    },
    drawFPS: function (fps) {
        document.getElementById('fps').innerHTML = 'FPS: ' + Math.round(fps);
    },
    drawResponseTime: function (time) {
        document.getElementById('time').innerHTML = 'Server response time: ' + time;
    }
}

function Scoreboard() {

}

Scoreboard.prototype = {

};

//FIXME: Seems like only some players gets a feed
function Killfeed(playerId, targetId) {
    this.playerId = playerId;
    this.targetId = targetId;
    this.elemId = playerId + targetId;
    this.elem;

    this.intv;
    this.intvT = 1000;
}

Killfeed.prototype = {
    draw: function () {
        var str = '<div style="opacity:0.8;" id = ' + this.elemId + '>';
        str += '<span style="color:#80ff80;">' + this.playerId + '</span>';
        str += '<span class="circle"></span>';
        str += '<span style="color:#80d0d0;"> ' + this.targetId + '</span>';
        str += '<br></div>';
        document.getElementsByClassName('killfeed')[0].innerHTML += str;

        this.intv = setInterval(this.animation, this.intvT);
    },
    remove: function () {
        this.elem.parentNode.removeChild(this.elem);
    },
    //FIXME: Animation not working
    animation: function () {
        if (!this.elem) {
            this.elem = document.getElementById(this.elemId);
            return;
        }

        if (parseInt(this.elem.style.opacity) <= 0) {
            this.remove();
            clearInterval(this.intv);
        } else {
            this.elem.style.opacity = parseInt(this.elem.style.opacity) - 0.01;
        }
    }

};