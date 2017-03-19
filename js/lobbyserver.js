//lobbyserver.js
module.exports = {
    /**
     * To keep track of the game
     * @constructor
     */
    init: function() {
        this.players = [];
    },
    addPlayer: function (player) {
		this.players.push(player);
	},
	removePlayer: function (playerId) {
		this.players = this.players.filter(function (t) {
			return t.id != playerId
		});
	},
	getData: function () {

		var t = {
			players: this.players,
		};

		return t;
	}
};