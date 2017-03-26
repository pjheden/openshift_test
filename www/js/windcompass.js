function WindCompass() {
    var size = 80;
    var str = '<canvas id="windcanvas" width="'+size+'" height="'+size+'"></canvas>';
    document.getElementById('windcompass').innerHTML += str;

    this.needle = new Image();
    this.needle.src = './images/needle.png';
    this.needle.width = size;
    this.needle.height = size;
    this.compass = new Image();
    this.compass.src = './images/compass.png';
    this.compass.width = size;
    this.compass.height = size;

}

WindCompass.prototype = {

    draw: function (wind) {
        if(!this.msCanvas){
            this.msCanvas = document.getElementById('windcanvas');
            this.ms = this.msCanvas.getContext('2d');
        }
        var windAngle = Math.atan(wind[1] / wind[0]);

        this.clear(this.ms);
        this.ms.drawImage(this.compass, 0, 0, this.compass.width, this.compass.height);
        
        this.ms.save();
        this.ms.translate(this.msCanvas.width / 2, this.msCanvas.height / 2);
        this.ms.rotate(windAngle);
        this.ms.drawImage(this.needle, -this.msCanvas.width / 2, -this.msCanvas.height / 2, this.needle.width, this.needle.height);
        this.ms.restore();
    },
    clear: function (ctx) {
        ctx.clearRect(0, 0, this.msCanvas.width, this.msCanvas.height);
    },
    remove: function(){ 
        this.msCanvas.parentNode.removeChild(this.msCanvas);
    }

}