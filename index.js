var express = require('express');
var app = express();

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 8082, function() {
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

    that.ships = [];
		that.wind = [0, 0];

		var wind_interval = 5000;
		setInterval(function() {
        that.updateWind();
    }, wind_interval);
}

GameServer.prototype = {
    addShip: function(ship) {
        this.ships.push(ship);
    },
    removeShip: function(shipId) {
        this.ships = this.ships.filter(function(t) {
            return t.id != shipId
        });
    },
    updateShip: function(ship) {
        for (var i = 0; i < this.ships.length; i++) {
            if (this.ships[i].id === ship.id) {
                this.ships[i].x = ship.x;
                this.ships[i].y = ship.y;
								this.ships[i].angle = ship.angle;
            }
        }
    },
    addProjectile: function() {
        //TODO
    },
    removeProjectile: function() {
        //TODO
    },
    detectCollision: function() {
        //TODO
    },
    getData: function() {
        var t = {
            ships: this.ships,
						wind: this.wind
        };
        return t;
    },
		updateWind: function() {
			this.wind = [getRandomInt(-3,3), getRandomInt(-3,3)];
		}
}

var game = new GameServer();

io.on('connection', function(client) {
    console.log('User connected');

    client.on('joinGame', function(player) {
				//Check if id is unique, otherwise make it so
				game.ships.forEach(function(ship){
					if(ship.id === player.id){
						player.id = player.id + getRandomInt(1,999);
					}
				});
				console.log(player.id + ' joined the game');

        var initX = 700;
        var initY = 450;

        //Tell client to add ship
        client.emit('addShip', {
            id: player.id,
            x: initX,
            y: initY,
            isPlayer: true
        });

        //Tell all other clients to add ship
        client.broadcast.emit('addShip', {
            id: player.id,
            x: initX,
            y: initY,
            isPlayer: false
        });

        //Add ship to the game
        game.addShip({
            id: player.id,
						x: initX,
						y: initY,
						angle: 0.0
        });
    });

    client.on('clientSync', function(data) {
        //Receive data from clients
        game.updateShip(data.ship);

        //Broadcast data to clients
        client.emit('serverSync', game.getData());
        client.broadcast.emit('serverSync', game.getData());

    });

    client.on('shoot', function(ball) {
        // var ball = new Ball(ball.ownerId, ball.alpha, ball.x, ball.y );
        // game.addBall(ball);
    });

    client.on('leaveGame', function(shipId) {
        console.log(shipId + ' has left the game');
        game.removeShip(shipId);
        client.broadcast.emit('removeShip', shipId);
    });

});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
