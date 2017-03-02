var socket = io.connect('http://localhost:8082');
socket.on( 'connect', function(e) {
  console.log('You connected to the server!');
});

socket.on( 'disconnect', function() {
  console.log('You disconnected to the server!');

});

socket.on( 'connect_failed', function() {
  console.log('Connection failed');

});

socket.on( 'error', function() {
  console.log('error connecting');

});

var game = new Game(socket, '#arena');

socket.on('sync', function(serverData){
  game.recieveData(serverData);
});

socket.on('addShip', function(ship){
    game.addShip(ship.id, ship.x, ship.y, ship.isPlayer);
});

$(document).ready( function(){

  //Add onclick to join button
	$('#join_button').click( function(){
		player_name = $('#player_name').val();
		joinGame(player_name, socket);
	});


});

$(window).on('beforeunload', function(){
	//socket.emit('leaveGame', tankName);
});

//tells the server the name of the player
function joinGame(name, socket){
  console.log('joinGame');
	if(name == '') name = "Buddy";
	socket.emit('joinGame', {id: name});
}
