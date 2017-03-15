/**
 * @constructor
 * @param {string} id - Id for the Ship
 * @param {html} canvas - The canvas to draw in
 * @param {integer} x - The x coordinate of the ship
 * @param {integer} y - The y coordinate of the ship
 */
function Ship(id, ctx, pos) {
  console.log('Ship constructor');
    this.id = id;
    this.dead = false;
    this.ctx = ctx;
    var src = './images/ships/ship_pattern0.png';
    this.image = new Image();
    this.image.src = src;
    this.image.width = this.image.width / 10;
    this.image.height = this.image.height / 10;
    this.speed = 2;

    // this.pos.x = x;
    // this.pos.y = y;
    // this.dir = 0;

    this.pos = pos;
    this.dir = {
        x: 0,
        y: 0
    };
    this.rotateDir = 0;
    this.angle = 0.0;
    this.deltaA = Math.PI / 100;

    this.collision = this.image.height / 2;

    this.draw();
}

Ship.prototype = {
    draw: function() {
        this.ctx.save();
        this.ctx.translate(this.pos.x, this.pos.y);
        this.ctx.rotate(this.angle);
        this.ctx.drawImage(this.image, this.image.width / -2, this.image.height / -2, this.image.width, this.image.height);
        this.ctx.restore();
    },

    /**
     * Stores the socket in a variable so the player can emit in shoot()
     * @param {Socket} socket - Client socket
     */
    setSocket: function(socket) {
      this.socket = socket;
    },

    /**
     * Set the controls for the ship
     */
    setControls: function() {
        var t = this;
        $(document).keypress(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {
                case 119: //W
                    t.shoot();
                    break;
                case 32: //space
                    t.shoot();
                    break;
                case 100: //D
                    t.rotateDir = 1;
                    break;
                    // case 115: //S
                    //     t.dir.y = 1;
                    //     break;
                case 97: //A
                    t.rotateDir = -1;
                    break;
            }

        }).keyup(function(e) {
            var k = e.keyCode || e.which;
            switch (k) {

                case 68: //D
                    t.rotateDir = 0;
                    break;
                    // case 83: //S
                    //     t.dir.x = 0;
                    //     break;
                case 65: //A
                    t.rotateDir = 0;
                    break;

            }
        });

    },

    rotate: function() {
        this.angle += this.rotateDir * this.deltaA;
        if (this.angle > Math.PI * 2) {
            this.angle -= this.rotateDir * Math.PI * 2;
        }
        //Rotate direction
        this.dir.x = Math.cos(this.angle);
        this.dir.y = Math.sin(this.angle);
        this.dir = normalize(this.dir.x, this.dir.y);
    },

    move: function(wind) {
        if (this.dead) return;
        //Wind calculations
        var windDirection = normalize(wind[0], wind[1]);
        var windMagnitude = lengthVec(wind[0], wind[1]);
        var cosOfAngle = dotVec(windDirection, this.dir);
        var wSpeed = windMagnitude * cosOfAngle; //If the wind is parallell to the boat then the speed becomes equal to the magnitue of the wind, if it is perpendicular then it becomes 0

        var moveX = (this.speed * this.dir.x) + (wSpeed * this.dir.x);
        var moveY = (this.speed * this.dir.y) + (wSpeed * this.dir.y);

        //boundary control
        if (this.pos.x + moveX > (0 + this.image.width / 2) && (this.pos.x + moveX) < (WIDTH - this.image.width / 2)) {
            this.pos.x += moveX;
        }
        if (this.pos.y + moveY > (0 + this.image.height / 2) && (this.pos.y + moveY) < (HEIGHT - this.image.height / 2)) {
            this.pos.y += moveY;
        }
    },

    /**
     * Emits to the server to shoot and sends all the required information
     * TODO: add cooldown
     */
    shoot: function() {
      if (this.dead || !this.socket) return;

      var projectile = {
          ownerId: this.id,
          pos: this.pos,
          angle: this.angle
      };
      this.socket.emit('shoot', projectile);
    }
}
