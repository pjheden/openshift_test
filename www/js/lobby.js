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
            that.addPlayer(player, false);
        });
    },
    
    drawPlayer: function(player, isPlayer = false) {
        var str = '<div class="lobbyelement" id="'+player.id+'" onclick=lobby.challengePlayer('+player.id+')>';
        str += '<div><h3>'+ player.id +'</h3>'
        str += '<h3>'+ player.score +'</h3></div>'
        str += '</div>';
        if(!isPlayer){
            str += '<div id="'+player.id+'btndiv"><button id="'+player.id+'accbtn" style="width:50%;" disabled onclick=lobby.acceptChallenge('+player.id+')>Y</button>';
            str += '<button id="'+player.id+'decbtn" style="width:50%;" disabled onclick=lobby.declineChallenge('+player.id+')>N</button></div>';
        }
        str += '<br>';
        document.getElementsByClassName('lobby')[0].innerHTML += str;
    },
    undrawPlayer: function(playerId) {
        var elem = document.getElementById(playerId);
        if(elem) elem.parentElement.removeChild(elem);
        var elem2 = document.getElementById(playerId + 'btndiv');
        if(elem2) elem2.parentElement.removeChild(elem2);
    },
    challengePlayer: function(playerElement) {
        if(this.player.id === playerElement.id) return;
        socket.emit('challenge', {
            challenger: this.player.id,
            challenged: playerElement.id
        });
    },
    challenged: function(challengerId, message){
        this.setButton(true, challengerId);
    },
    acceptChallenge: function(playerElement){
        socket.emit('acceptChallenge', {challenger: playerElement.id, challenged: this.player.id});
    },
    declineChallenge: function(challengerId){
        this.setButton(false, challengerId);
        //TODO: emit decline
    },
    setButton: function(active, challengerId){
        var accButton = document.getElementById(challengerId+'accbtn');
        var decButton = document.getElementById(challengerId+'decbtn');
        if(active){
            accButton.disabled = false;
            decButton.disabled = false;
            accButton.style.background = 'green';
            decButton.style.background = 'red';

        }else{
            accButton.disabled = true;
            decButton.disabled = true;
            accButton.style.background = 'none';
            decButton.style.background = 'none';

        }
    },
    addPlayer: function (player, isPlayer) {
        if(!this.inited) return;
        if(isPlayer) this.player = player;
        console.log('addPlayer');
        this.players.push(player);
        this.drawPlayer(player, isPlayer);

    },

    removePlayer: function (playerId) {
        this.undrawPlayer(playerId);
        this.players = this.players.filter(function (t) {
            return t.id != playerId
        });
    }
}