var express = require('express');
var app = express();

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 8082, function() {
    var port = server.address().port;
    console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

//Too keep track of the game
function GameServer() {
    this.ships = [];
}

GameServer.prototype = {
    addShip: function(ship) {
        //TODO check that ship id is unique, if not make it so
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
            ships: this.ships
        };
        return t;
    }
}

var game = new GameServer();

io.on('connection', function(client) {
    console.log('User connected');

    client.on('joinGame', function(player) {
        console.log(player.id + ' joined the game');

        var initX = getRandomInt(300, 900);
        var initY = getRandomInt(200, 600);

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
						y: initY
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
