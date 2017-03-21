function Killfeed(feedId, playerId, targetId) {
    this.feedId = feedId;
    this.playerId = playerId;
    this.targetId = targetId;
    this.elem;

    this.intv;
    this.intvT = 700;
}

Killfeed.prototype = {
    draw: function () {
        //Check if it's already drawn
        // if(document.getElementById(this.feedId)){
        //     return;
        // }
        var str = '<div style="opacity:0.8;" id = ' + this.feedId + '>';
        str += '<span style="color:#80ff80;">' + this.playerId + '</span>';
        str += '<span class="circle"></span>';
        str += '<span style="color:#80d0d0;"> ' + this.targetId + '</span>';
        str += '<br></div>';
        document.getElementsByClassName('killfeed')[0].innerHTML += str;
        var that = this;
        this.intv = setInterval(function(){that.animation(that)}, this.intvT);
    },
    remove: function () {
        this.elem = document.getElementById(this.feedId);
        this.elem.parentNode.removeChild(this.elem);
    },
    /**
     * Slowly remove the killfeed
     */
    animation: function (that) {
        if (!that.elem) {
            that.elem = document.getElementById(that.feedId);
            return;
        }
        
        if (parseFloat(that.elem.style.opacity) <= 0) {
            that.remove();
            clearInterval(that.intv);
        } else {
            that.elem.style.opacity = parseFloat(that.elem.style.opacity) - 0.04;
        }
    }

};