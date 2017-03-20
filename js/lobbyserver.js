//lobbyserver.js
module.exports = {
    /**
     * To keep track of the game
     * @constructor
     */
    init: function() {
        this.players = [];
		this.rooms = {};
    },
    addPlayer: function (player) {
		this.players.push(player);
	},
	removePlayer: function (playerId) {
		this.players = this.players.filter(function (t) {
			return t.id != playerId
		});
	},
	getSocketId: function(playerId) {
		var socketId;
		this.players.forEach( function(player) {
			if(player.id === playerId){
				socketId = player.socketId;
				return;
			}
		});
		return socketId;
	},
	getData: function () {

		var t = {
			players: this.players,
		};

		return t;
	}
};