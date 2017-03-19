//scoreboard.js
module.exports = {
	init: function() {
		this.mlength = 10;
		this.updated = false;
		this.scores = [];
	},
	//Add if list is less than 10 or higher than the lowest one
	add: function(value, name) {
		if(this.scores.length < this.mlength || value > this.scores(this.scores.length-1).value ){
			this.scores.push({
				value: value,
				name: name
			});
			this.setUpdated(true);
		}
	},
	setUpdated: function(isUptaded){
		this.updated = isUptaded;
	},
	resize: function(){
		if(this.score.length > this.mlength){
			this.scores = this.scores.slice(0, this.mlength);
		}
	},
	sortArr: function() {
		this.scores.sort(function(a, b){
			return a.value < b.value;
		});
	}
};