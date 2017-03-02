var INTERVAL = 50;

function Game(socket, canvasId) {
    this.socket = socket;
    this.$arena = $(canvasId);
    var g = this;

    //TODO temoporarily removed interval
    setInterval(function() {
    g.mainLoop();
    }, INTERVAL);
}

Game.prototype = {

    addShip: function(id, x, y, isPlayer) {
        var t = new Ship(id, this.$arena, x, y);
        if (isPlayer){
          this.playerShip = t;
          t.setControls();
        }
    },

    mainLoop: function() {
        console.log('mainLoop');
        this.sendData();
        if(this.playerShip){
          this.playerShip.move();
          this.playerShip.draw();
        }
    },

    sendData: function() {
        //Send local data to server
        var gameData = {};
        console.log('sendData');
        // //Send tank data
        // var t = {
        //     id: this.localTank.id,
        //     x: this.localTank.x,
        //     y: this.localTank.y,
        //     baseAngle: this.localTank.baseAngle,
        //     cannonAngle: this.localTank.cannonAngle
        // };
        // gameData.tank = t;

        //Client game does not send any info about projectiles,
        //the server controls that part
        this.socket.emit('sync', gameData);
    },

    receiveData: function(serverData) {
        var game = this;
        console.log('recieveData', serverData);
        // serverData.tanks.forEach(function(serverTank) {
        //
        //     // //Update local tank stats
        //     // if (game.localTank !== undefined && serverTank.id == game.localTank.id) {
        //     //     game.localTank.hp = serverTank.hp;
        //     //     if (game.localTank.hp <= 0) {
        //     //         game.killTank(game.localTank);
        //     //     }
        //     // }
        //     //
        //     // //Update foreign tanks
        //     // var found = false;
        //     // game.tanks.forEach(function(clientTank) {
        //     //     //update foreign tanks
        //     //     if (clientTank.id == serverTank.id) {
        //     //         clientTank.x = serverTank.x;
        //     //         clientTank.y = serverTank.y;
        //     //         clientTank.baseAngle = serverTank.baseAngle;
        //     //         clientTank.cannonAngle = serverTank.cannonAngle;
        //     //         clientTank.hp = serverTank.hp;
        //     //         if (clientTank.hp <= 0) {
        //     //             game.killTank(clientTank);
        //     //         }
        //     //         clientTank.refresh();
        //     //         found = true;
        //     //     }
        //     // });
        //
        //     // if (!found &&
        //     //     (game.localTank == undefined || serverTank.id != game.localTank.id)) {
        //     //     //I need to create it
        //     //     game.addTank(serverTank.id, serverTank.type, false, serverTank.x, serverTank.y, serverTank.hp);
        //     // }
        //
        // });

    }
}

function Ship(id, $arena, x, y) {
    this.id = id;
    this.canvas = $arena;
    this.canvas.width = 1400;
    this.canvas.height = 800;
    this.ctx = this.canvas[0].getContext('2d');
    this.src = './images/ships/ship_pattern0.png';
    this.image = new Image();
    this.image.src = this.src;
    this.x = x;
    this.y = y;
    this.dead = false;
    this.dir = [0, 0, 0, 0];
    this.speed = 5;
    console.log('Ship created!');

    this.materialize();
}

Ship.prototype = {
    materialize: function() {
        // this.$arena.append('<div id="' + this.id + '" class="tank tank' + this.type + '"></div>');

        this.draw();
    },
    draw: function() {
        console.log('draw ship!');
        this.ctx.save();
        this.ctx.translate(this.x, this.x);
        // this.ctx.rotate(player.getAngle());
        this.ctx.drawImage(this.image, this.image.width / -2, this.image.height / -2, this.image.width / 10, this.image.height / 10);
        this.ctx.restore();

    },

    setControls: function() {
        var t = this;
        $(document).keypress(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                case 119: //W
                    t.dir[1] = -1;
                    break;
                case 100: //D
                    t.dir[0] = 1;
                    break;
                case 115: //S
                    t.dir[1] = 1;
                    break;
                case 97: //A
                    t.dir[0] = -1;
                    break;
            }

        }).keyup(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                case 87: //W
                    t.dir[1] = 0;
                    break;
                case 68: //D
                    t.dir[0] = 0;
                    break;
                case 83: //S
                    t.dir[1] = 0;
                    break;
                case 65: //A
                    t.dir[0] = 0;
                    break;
            }
        });

    },

    move: function() {
        if (this.dead) {
            return;
        }

        var moveX = this.speed * this.dir[0];
        var moveY = this.speed * this.dir[1];
        this.x += moveX;
        this.y += moveY;
        // if (this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (this.$arena.width() - ARENA_MARGIN)) {
        //     this.x += moveX;
        // }
        // if (this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < (this.$arena.height() - ARENA_MARGIN)) {
        //     this.y += moveY;
        // }
    }
}
