var socket = io.connect('https://last-ship-standing-mp.herokuapp.com/');
// var socket = io.connect('http://localhost:8082');
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

var game = new Game(socket, '#arena', 1400, 800);

socket.on('serverSync', function(serverData){
  game.recieveData(serverData);
});

socket.on('addShip', function(ship){
    game.addShip(ship.id, ship.x, ship.y, ship.isPlayer);
});

socket.on('removeShip', function(shipId){
    game.removeShip(shipId);
});

var player_name;
$(document).ready( function(){
  //Add onclick to join button
	$('#join_button').click( function(){
		player_name = $('#player_name').val();
    if(player_name == '') player_name = "Buddy";
		joinGame(player_name, socket);
    $(this).attr('disabled',true);
	});


});

$(window).on('beforeunload', function(){
	socket.emit('leaveGame', player_name);
});

//tells the server the name of the player
function joinGame(name, socket){
  console.log('joinGame');
	socket.emit('joinGame', {id: name});
}
