//var socket = io.connect('https://last-ship-standing-mp.herokuapp.com/');
var socket = io.connect('http://localhost:8082');

// -------------- General -----------------

socket.on('connect', function (e) {
  console.log('You connected to the server!');
});

socket.on('disconnect', function () {
  console.log('You disconnected to the server!');

});

socket.on('connect_failed', function () {
  console.log('Connection failed');

});

socket.on('error', function () {
  console.log('error connecting');
});

var canvas = $('#arena');
var ctx = canvas[0].getContext('2d');
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;


$(document).ready(function () {
  //Add onclick to join button
  $('#join_button').click(function () {
    var player_name = $('#player_name').val();
    if (player_name == '') player_name = "Buddy";
    //joinGame(player_name, socket);
    joinLobby(player_name, socket);
    $('.join_section').attr('hidden', true);
  });

});

$(window).on('beforeunload', function () {
  //socket.emit('leaveGame', game.name);
  socket.emit('leaveGame', lobby.name);
});

// ------------- Game --------------

var game = new Game(socket, ctx, window.innerWidth, window.innerHeight);

socket.on('serverSync', function (serverData) {
  game.recieveData(serverData);
});

socket.on('addShip', function (ship) {
  game.addShip(ship.id, ship.pos, ship.isPlayer);
});

socket.on('initGame', function (data) {
  console.log('initGame', data);
  game.name = lobby.name;
  game.init(data.wind, data.ships, data.roomId);
  var ship = game.addShip(lobby.name, data.ship.pos, data.ship.isPlayer);
  socket.emit('addShip', {
    roomId: game.roomId,
    id: ship.id,
    pos: ship.pos,
    angle: ship.angle,
    dir: ship.dir,
    collision: ship.collision

  });
});

socket.on('removeShip', function (shipId) {
  game.removeShip(shipId);
});




//tells the server the name of the player
function joinGame(name, socket) {
  socket.emit('joinGame', {
    id: name
  });
}



//------------Lobby--------------
function joinLobby(name, socket) {
  socket.emit('joinLobby', {
    id: name,
    score: 0
  });
}

var lobby = new Lobby(socket, ctx, window.innerWidth, window.innerHeight);

socket.on('initLobby', function (lobbyData) {
  lobby.name = lobbyData.player.id;
  lobby.init(lobbyData);
  lobby.addPlayer(lobbyData.player, true);
});

socket.on('addPlayer', function (player) {
  lobby.addPlayer(player, false);
});

socket.on('removePlayer', function (playerId) {
  lobby.removePlayer(playerId);
});

socket.on('challenge', function (ch) {
  lobby.challenged(ch.challengerId, ch.message);
});

socket.on('joinRoom', function (roomId) {
  document.getElementsByClassName('lobby')[0].style.visibility = 'hidden';
  game.roomId = roomId;
  //TODO: Start the game
  socket.emit('joinRoom', roomId);
});