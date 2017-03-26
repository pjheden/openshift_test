function Timer() {
    str = '<canvas id="milliseconds" width="80" height="80"></canvas>';
    document.getElementById('timer').innerHTML += str;

    this.radius = 27;

    this.counter = 0;
    this.total = 200;
    this.first = true;
    var that = this;
    this.set(that);
}

Timer.prototype = {
    // The background circle
    setTrack: function (that, ctx) {
        ctx.strokeStyle = 'hsla(2, 8%, 46%, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(that.msCanvas.width / 2, that.msCanvas.height / 2, that.radius, 0, Math.PI * 2);
        ctx.stroke();
    },
    setTime: function (that, ctx, counter, total) {
        ctx.strokeStyle = 'hsl(2, 8%, 46%)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(
            that.msCanvas.width / 2, that.msCanvas.height / 2,
            that.radius,
            Math.PI / -2,
            (Math.PI * 2) * (counter / total) + (Math.PI / -2)
        );
        ctx.stroke();
        ctx.fillText(4 - Math.ceil((counter / total) * 3), that.msCanvas.width / 2 - that.msCanvas.width / 11, that.msCanvas.height / 2 + that.msCanvas.width / 18);
    },
    set: function (that) {

        if(!that.msCanvas){
            that.msCanvas = document.getElementById('milliseconds');
            that.ms = that.msCanvas.getContext('2d');
        }

        that.clear(that, that.ms);
        that.setTrack(that, that.ms);
        that.setTime(that, that.ms, that.counter, that.total);

        if (that.counter < that.total) {
            if (that.first) {
                that.first = false;
                setTimeout(function () {
                    that.set(that);
                }, 2000);
            } else {
                setTimeout(function () {
                    that.set(that);
                }, 10);
            }
        } else {
            that.msCanvas.parentNode.removeChild(this.msCanvas);
        }
        that.counter++;
    },
    clear: function (that, ctx) {
        ctx.clearRect(0, 0, that.msCanvas.width, that.msCanvas.height);
    }

}