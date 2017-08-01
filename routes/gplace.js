// Dependencies
var Promise 	= require('promise');
var request 	= require('request');

// Place Object
function Place(p, type) {
	this.name = p.name;
	this.icon = p.icon;
	this.location = p.geometry.location;
	this.type = type;
}

// Request Places from Google Places API
function RequestPlace(place_request, type) {
	return new Promise(function(resolve, reject) {
		place_request = place_request.replace('_TYPE',type);
		type = type.replace('_', ' ');
		request(place_request, function(error, response, body) {
			if(error) {
				return reject(error);
			}

			rtval = JSON.parse(body);
			facility = [];
			for(var j=0;j<rtval.results.length; j++)
			{
				var name = rtval.results[j].name.toLowerCase();
				if(name.includes(type)) {
					console.log(name);
					facility.push(new Place(rtval.results[j], type));
				}
			}

			return resolve(facility);
		});
	});
}

module.exports.RequestPlace = RequestPlace;
module.exports.Test = "TEST";
