var INTERVAL = 20;
var WIDTH;
var HEIGHT;

function Game(socket, ctx, w, h) {
    console.log('Game constructor');
    this.socket = socket;
    this.ctx = ctx;

    WIDTH = w;
    HEIGHT = h;

    this.spawns = [{x: w/10, y: h / 2}, {x: w-w/10, y: h/2}];
    this.angles = [0.0, Math.PI];

    this.roomId;
    this.ships = [];
    this.projectiles = [];
    // this.feeds = [];
    this.oldFeeds = [];
    this.playerShip;

    this.wind = [1, 1];

    this.serverups;
    this.lastCalledTime_server;
    this.fps;
    this.lastCalledTime;
    this.netgraph = new Netgraph();
    this.windcompass = new WindCompass();

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
        var timer = new Timer();
        this.mainInterval = setInterval(function () {
            if(timer.finished){
                g.mainLoop();
            }
        }, INTERVAL);
    },

    reset: function() {
        clearInterval(this.mainInterval);

        delete this.fps;
        delete this.lastCalledTime;
        delete this.lastCalledTime_server;
        delete this.mainInterval;
        delete this.name;
        delete this.playerShip;
        delete this.serverups;
        delete this.spawnPos;
        delete this.team;
        $(document).off("keypress");

        //Remove all watersplashes
        var node = document.getElementsByClassName('projectiles')[0];
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }

        this.roomId;
        this.ships = [];
        this.projectiles = [];
        // this.feeds = [];
        this.oldFeeds = [];
        this.playerShip;

        this.wind = [1, 1];

        this.serverups;
        this.lastCalledTime_server;
        this.fps;
        this.lastCalledTime;


        this.clearMap();
    },

    mainLoop: function () {
        var delta = (Date.now() - this.lastCalledTime) / 1000;
        this.updateAllObjects(delta);
        if (this.playerShip) {
            this.playerShip.rotate(delta);
            this.playerShip.move(this.wind, delta);
            this.sendData();
        }
        this.clearMap();
        this.drawShips();
        this.drawProjectiles();
        this.windcompass.draw(this.wind); //draw the new wind

        this.fps = this.requestAnimFrame(this.lastCalledTime);
        this.netgraph.update(this.fps, this.serverups);
    },

    addShip: function (id, pos, isPlayer = false) {
        var t;
        
        if (isPlayer) {
            t = new Ship(id, this.ctx,this.spawns[this.spawnPos], this.angles[this.spawnPos]);
            this.playerShip = t;
            this.playerShip.roomId = this.roomId;
            this.playerShip.setControls();
            this.playerShip.setSocket(this.socket);
            
        }else{
            t = new Ship(id, this.ctx, pos, 0.0);
        }
        this.ships.push(t);
        
        return t;
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

            //Draw ship
            that.ctx.save();
            that.ctx.translate(ship.pos.x, ship.pos.y);
            that.ctx.rotate(ship.angle);

            that.ctx.drawImage(ship.image, ship.image.width / -2, ship.image.height / -2, ship.image.width, ship.image.height);
            that.ctx.restore();

            if(ship.id === that.playerShip.id){
                //Draw circle around ship
                that.ctx.beginPath();
                that.ctx.arc(ship.pos.x, ship.pos.y, ship.image.width / 2, 0, 2 * Math.PI); //good visual
                //that.ctx.arc(ship.pos.x, ship.pos.y, ship.image.height / 2, 0, 2 * Math.PI); //hit detection
                that.ctx.stroke();
                that.ctx.closePath();
            }
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
    // drawFeeds: function () {
    //     this.feeds.forEach(function (feed) {
    //         var kf = new Killfeed(feed.playerId, feed.targetId);
    //         kf.draw();
    //     });
    //     this.feeds = [];
    // },
    updateAllObjects: function (deltaTime) {
        
        //Wind calculations
        var windDirection = normalize(this.wind[0], this.wind[1]);
        var windMagnitude = lengthVec(this.wind[0], this.wind[1]);

        this.updateShips(windDirection, windMagnitude, deltaTime);
        this.updateProjectiles(windDirection, windMagnitude, deltaTime);
    },
    /**
     * Update the movement of the projectiles locally to reduce lag
     * @param {Vector} windDirection - direction of the wind 2D
     * @param {Double} windMagnitude - Magnitude of the wind
     */
    updateProjectiles: function (windDirection, windMagnitude, deltaTime) {
        var that = this;
        this.projectiles.forEach(function (proj) {
            //Update projectile position
            var wSpeed = {
                x: windDirection.x * windMagnitude,
                y: windDirection.y * windMagnitude
            };
            proj.speed.x += wSpeed.x;
            proj.speed.y += wSpeed.y;
            proj.pos.x += proj.speed.x * deltaTime;
            proj.pos.y += proj.speed.y * deltaTime;
        });

    },
    /**
     * Make a guess of the ships moevments and update them locally
     */
    updateShips: function (windDirection, windMagnitude, deltaTime) {
        
        var that = this;
        this.ships.forEach(function (ship) {
            if (!that.playerShip || ship.id !== that.playerShip.id) {
                //Ship calc based on wind
                var cosOfAngle = dotVec(windDirection, ship.dir);
                //If the wind is parallell to the boat then the speed becomes equal to the magnitue of the wind, if it is perpendicular then it becomes 0
                var wSpeed = windMagnitude * cosOfAngle;
                var moveX = (ship.speed * ship.dir.x) + (wSpeed * ship.dir.x);
                var moveY = (ship.speed * ship.dir.y) + (wSpeed * ship.dir.y);
                var newX = ship.pos.x + moveX * deltaTime;
                var newY = ship.pos.y + moveY * deltaTime;

                //boundary control
                if (newX > (0 + ship.image.width / 2) && (newX) < (WIDTH - ship.image.width / 2)) {
                    ship.pos.x = newX;
                }
                if (newY > (0 + ship.image.height / 2) && (newY) < (HEIGHT - ship.image.height / 2)) {
                    ship.pos.y = newY;
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
            team: this.team
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
            }else if(game.playerShip && serverShip.id == game.playerShip.id){
                game.playerShip.dead = serverShip.dead;
                if(isNaN(game.playerShip.angle))
                    game.playerShip.angle = serverShip.angle;
                
            }
            else {
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

        serverData.projfeed.forEach( function( feed ){
            if(!inArray(feed.id, game.oldFeeds)){
                game.oldFeeds.push(feed.id);
                document.getElementsByClassName('projectiles')[0].innerHTML += feed.elem;
            }
        });

        serverData.killfeed.forEach(function (feed) {
            if(!inArray(feed.feedId, game.oldFeeds)){
                game.oldFeeds.push(feed.feedId);
                var kf = new Killfeed(feed.feedId, feed.playerId, feed.targetId);
                kf.draw();
            }
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