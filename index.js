var express = require('express');
var app = express();

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 8082, function () {
    var port = server.address().port;
    console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

/**
 * To keep track of the game
 * @constructor
 */
function GameServer() {
    var that = this;
    that.projs_created = 0;

    that.ships = [];
    that.projectiles = [];
    that.wind = [1, 1];

    var wind_interval = 5000;
    setInterval(function () {
        that.updateWind();
    }, wind_interval);
}

GameServer.prototype = {
    addShip: function (ship) {
        this.ships.push(ship);
    },
    removeShip: function (shipId) {
        this.ships = this.ships.filter(function (t) {
            return t.id != shipId
        });
    },
    updateShip: function (ship) {
        for (var i = 0; i < this.ships.length; i++) {
            if (this.ships[i].id === ship.id) {
                this.ships[i].pos = ship.pos;
                this.ships[i].angle = ship.angle;
                this.ships[i].dir = ship.dir;
            }
        }
    },
    addProjectile: function (projectile) {
        this.projectiles.push(projectile);
    },
    removeProjectile: function (projId) {
        this.projectiles = this.projectiles.filter(function (t) {
            return t.id != projId
        });
    },
    detectCollision: function () {
        var that = this;
        //For each ship, check if it collides with any projectile
        that.ships.forEach(function (ship) {
            that.projectiles.forEach(function (proj) {
                //TODO this only works if x is center, is it center? testing
                if (Math.abs(proj.pos.x - ship.pos.x) <= proj.r &&
                    Math.abs(proj.pos.y - ship.pos.y) <= proj.r &&
                    proj.ownerId !== ship.id) {
                    ship.dead = true;
                    proj.dead = true;
                }
            });
        });
    },
    getData: function () {
        var t = {
            ships: this.ships,
            projectiles: this.projectiles,
            wind: this.wind
        };
        return t;
    },
    updateWind: function () {
        this.wind = [getRandomInt(-3, 3), getRandomInt(-3, 3)];
    }
}

var game = new GameServer();

io.on('connection', function (client) {
    console.log('User connected');

    client.on('joinGame', function (player) {
        //Check if id is unique, otherwise make it so
        game.ships.forEach(function (ship) {
            if (ship.id === player.id) {
                player.id = player.id + getRandomInt(1, 999);
            }
        });
        console.log(player.id + ' joined the game');

        var initX = 700;
        var initY = 450;

        var gData = {};
        gData.ship = {
            id: player.id,
            pos: {
                x: initX,
                y: initY
            },
            isPlayer: true
        };
        gData.wind = game.wind;
        gData.ships = game.ships;
        gData.projectiles = game.projectiles;
        //Tell client to add ship and init variables
        client.emit('initGame', gData);

        //Tell all other clients to add the ship
        client.broadcast.emit('addShip', {
            id: player.id,
            pos: {
                x: initX,
                y: initY
            },
            isPlayer: false
        });

        //Add the ship to the game
        game.addShip({
            id: player.id,
            pos: {
                x: initX,
                y: initY
            },
            angle: 0.0,
            dir: {
                x: 0,
                y: 0
            }
        });

        //TODO remove all dead tanks and projectiles
    });

    client.on('clientSync', function (data) {
        //Receive data from clients
        game.updateShip(data.ship);

        //Broadcast data to clients
        client.emit('serverSync', game.getData());
        client.broadcast.emit('serverSync', game.getData());

    });

    client.on('shoot', function (proj) {
        var projectile = new Projectile('proj' + game.projs_created, proj.ownerId, proj.pos, proj.angle);
        game.addBall(projectile);
        game.projs_created++;
    });

    client.on('leaveGame', function (shipId) {
        console.log(shipId + ' has left the game');
        game.removeShip(shipId);
        client.broadcast.emit('removeShip', shipId);
    });

});

function Projectile(id, ownerId, pos, angle) {
    this.id = id;
    this.ball_speed = 10;
    this.r = 5;
    this.pos = pos;
    this.ownerId = ownerId;
    this.dead = false;
    this.init(angle);
}

Projectile.prototype = {
    /**
     * Set initial variables for the projectile
     */
    init: function (angle) {
        this.speed = {
            x: this.ball_speed * Math.sin(angle),
            y: -this.ball_speed * Math.cos(angle)
        };
    },

    move: function (wind) {
        //TODO
        //   //Wind calculations
        //   var windDirection = normalize(wind[0], wind[1]);
        //   var windMagnitude = lengthVec(wind[0], wind[1]);
        //   //Update projectile position
        //   var wSpeed = {
        //     x: windDirection[0] * windMagnitude,
        //     y: windDirection[1] * windMagnitude
        //   };
        //   projectile.speed += projectile.speed + wSpeed;
        //   projectile.pos += projectile.speed;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}