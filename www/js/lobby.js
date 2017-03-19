var INTERVAL = 30;
var WIDTH;
var HEIGHT;

function Lobby(socket, ctx, w, h) {
    this.socket = socket;
    this.ctx = ctx;

    WIDTH = w;
    HEIGHT = h;
    this.inited = false;
    this.players = [];
    this.player;

}

Lobby.prototype = {

    init: function (lobbyData) {
        console.log('init');
        this.inited = true;
        var that = this;
        lobbyData.players.forEach(function(player){
            that.addPlayer(player);
        });
    },
    
    drawPlayer: function(player) {
        var str = '<div class="lobbyelement" id="'+player.id+'" onclick=lobby.clickPlayer('+player.id+')>';
        str += '<h3>'+ player.id +'</h3>'
        str += '<h3>'+ player.score +'</h3>'
        str += '</div><br>';
        document.getElementsByClassName('lobby')[0].innerHTML += str;
    },
    undrawPlayer: function(playerId) {
        var elem = document.getElementById(playerId);
        if(elem) elem.parentElement.removeChild(elem);
    },
    clickPlayer: function(playerElement) {
        console.log(this.player.id +' challenged ' + playerElement.id);
        //TODO: challenge player
    },

    addPlayer: function (player, isPlayer) {
        if(!this.inited) return;
        console.log('addPlayer');
        this.players.push(player);
        this.drawPlayer(player);

        if(isPlayer) this.player = player;
    },

    removePlayer: function (playerId) {
        this.undrawPlayer(playerId);
        this.players = this.players.filter(function (t) {
            return t.id != playerId
        });
    }
}