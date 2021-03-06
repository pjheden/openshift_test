var express = require('express');
var app = express();
var server = require('http').Server(app)
var io = require('socket.io')(server);

//Static resources server
app.use(express.static('./www'));
server.listen(8080);
// app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);  
// app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");  



var Gameserver = require('./js/gameserver.js');
var lobbyserver = require('./js/lobbyserver.js');
var Projectile = require('./js/projectile.js');
// var scoreboard = require('./js/scoreboard.js');
var tools = require('./js/tools.js');

lobbyserver.init();



io.on('connection', function (client) {
    console.log('User connected:', client.client.conn.id);

    client.on('joinLobby', function (player) {
        //Check if id is unique, otherwise make it so
        lobbyserver.players.forEach(function (pl) {
            if (pl.id === player.id) {
                player.id = player.id + tools.getRandomInt(1, 999);
            }
        });
        client.playerId = player.id;
        console.log('Player ' + player.id + ' joined the lobby');

        var lobbyData = lobbyserver.getData();
        lobbyData.player = {
            id: player.id,
            score: player.score
        };

        client.emit('initLobby', lobbyData);

        client.broadcast.emit('addPlayer', player);

        player.socketId = client.client.conn.id;
        lobbyserver.addPlayer(player);
    });

    client.on('leaveGame', function (playerId) {
        console.log(playerId + ' has left the game');
        lobbyserver.removePlayer(playerId);
        client.broadcast.emit('removePlayer', playerId);
    });

    client.on('challenge', function (challenge) {
        console.log(challenge.challenger + ' challenged ' + challenge.challenged);
        client.to(lobbyserver.getSocketId(challenge.challenged))
            .emit('challenge', {
                challengerId: challenge.challenger,

                message: 'I challenge you!'
            });
    });

    client.on('acceptChallenge', function (challenge) {
        var roomId = tools.makeId(6);
        lobbyserver.rooms[roomId] = {
            playersExpected: challenge.nrOfPlayers,
            nrOfPlayers: 0,
            gameserver: new Gameserver(roomId)
        };

        

        client.emit('joinRoom', roomId, 0, 'team0'); //TODO: give player number here for position
        client.to(lobbyserver.getSocketId(challenge.challenger)).emit('joinRoom', roomId, 1, 'team1');
    });

    client.on('joinRoom', function (roomId) {
        var room = lobbyserver.rooms[roomId];
        room.nrOfPlayers += 1;
        client.join(roomId);
        console.log('client joined', roomId);
        

        if (room.nrOfPlayers == room.playersExpected) {
            var gData = room.gameserver.getData(true);
            gData.ship.id = client.playerId;
            io.to(roomId).emit('initGame', gData);

        }
    });

    client.on('leaveRoom', function (roomId) {
        client.leave(roomId);
        var room = lobbyserver.rooms[roomId];
        room.nrOfPlayers -= 1;

        if (room.nrOfPlayers == 0) {
            delete lobbyserver.rooms[roomId];
        }
    });

    // ----------- Game ----------------

    client.on('addShip', function (data) {
        //Tell clients to addShips
        client.broadcast.to(data.roomId).emit('addShip', {
            id: data.id,
            pos: data.pos,
            isPlayer: false
        });

        var room = lobbyserver.rooms[data.roomId];
        //Add the ship to the game
        room.gameserver.addShip({
            id: data.id,
            pos: data.pos,
            angle: data.angle,
            dir: data.dir,
            collision: data.collision
        });
    });

    client.on('shoot', function (proj) {
        
        var game = lobbyserver.rooms[proj.roomId].gameserver;
		var projectile = new Projectile('proj' + game.projs_created, proj.ownerId, proj.pos, proj.angle, tools, 1);
		game.addProjectile(projectile);
		game.projs_created++;
        var projectile = new Projectile('proj' + game.projs_created, proj.ownerId, proj.pos, proj.angle, tools, -1);
		game.addProjectile(projectile);
		game.projs_created++;
	});

    client.on('clientSync', function (data) {
        if (!lobbyserver.rooms[data.roomId]) return;
        var game = lobbyserver.rooms[data.roomId].gameserver;

        game.updateProjectiles();
        var winner = game.checkWinner();
        if(winner != -1){
            client.emit('leaveRoom', winner, data.roomId);
        }
        //Receive data from clients
        game.updateShip(data.ship);

        //game.scoreboard.add(data.score);

        game.detectCollision();

        //Broadcast data to clients
        client.in(data.roomId).emit('serverSync', game.getData());

        //Remove all dead ships and projectiles
        // game.ships.forEach(function (ship) {
        //     if (ship.dead) game.removeShip(ship.id);
        // });
        game.projectiles.forEach(function (proj) {
            if (proj.dead){
                game.projfeed.push(proj.animateDeath());
                game.removeProjectile(proj.id);
            }
        });

        //game.clearFeed(); //I solved this in Killfeed class instead, by only drawing undrawn feeds
    });

});