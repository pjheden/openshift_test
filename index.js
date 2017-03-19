var express = require('express');
var app = express();

//var gameserver = require('./js/gameserver.js');
var lobbyserver = require('./js/lobbyserver.js');
// var projectile = require('./js/projectile.js');
// var scoreboard = require('./js/scoreboard.js');
var tools = require('./js/tools.js');

lobbyserver.init();

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 8082, function () {
	var port = server.address().port;
	console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

io.on('connection', function (client) {
	console.log('User connected:', client.client.conn.id);

    client.on('joinLobby', function(player) {
        //Check if id is unique, otherwise make it so
		lobbyserver.players.forEach(function (pl) {
			if (pl.id === player.id) {
				player.id = player.id + tools.getRandomInt(1, 999);
			}
		});
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

    client.on('challenge', function(challenge){
        console.log(challenge.challenger + ' challenged ' + challenge.challenged);
        client.to(lobbyserver.getSocketId(challenge.challenged))
            .emit('challenge', {
                challengerId: challenge.challenger,

                message: 'I challenge you!'
            });
    });

	client.on('acceptChallenge', function(challenge){
		//create unique room id
		var roomId = '9a9aa9a';
		client.emit('joinRoom', roomId);
		client.to(lobbyserver.getSocketId(challenge.challenger)).emit('joinRoom', roomId);
    });

	client.on('joinRoom', function(roomId){
		client.join(roomId);
	});

});