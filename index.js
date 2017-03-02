var express = require('express');
var app = express();

//Static resources server
app.use(express.static(__dirname + '/www'));

var server = app.listen(process.env.PORT || 8082, function () {
	var port = server.address().port;
	console.log('Server running at port %s', port);
});

var io = require('socket.io')(server);

//Too keep track of the game
function GameServer(){
	this.ships = [];
}

GameServer.prototype = {
	addShip: function(){
		//TODO
	},
	removeShip: function(){
		//TODO
	},
	addProjectile: function(){
		//TODO
	},
	removeProjectile: function(){
		//TODO
	},
	detectCollision: function(){
		//TODO
	}
}

var game = new GameServer();

io.on('connection', function(client) {
	console.log('User connected');

	client.on('joinGame', function(player){
		console.log(player.id + ' joined the game');

		var initX = getRandomInt(300, 900);
		var initY = getRandomInt(200, 600);

		//Tell client to add ship
		client.emit('addShip', { id: player.id, x:initX, y:initY, isPlayer:true });

		//Tell all other clients to add ship
		client.broadcast.emit('addShip', { id: player.id, x:initX, y:initY, isPlayer:false } );

		//Add ship to the game
		// game.addTank({ id: tank.id, type: tank.type, hp: TANK_INIT_HP});
	});

	client.on('sync', function(data){
		//Receive data from clients
			// game.syncTank(data.tank);

		//Broadcast data to clients
		// client.emit('sync', game.getData());
		// client.broadcast.emit('sync', game.getData());

	});

	client.on('shoot', function(ball){
		// var ball = new Ball(ball.ownerId, ball.alpha, ball.x, ball.y );
		// game.addBall(ball);
	});

	client.on('leaveGame', function(tankId){
		console.log(tankId + ' has left the game');
		// game.removeTank(tankId);
		// client.broadcast.emit('removeTank', tankId);
	});

});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
