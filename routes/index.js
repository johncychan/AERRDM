var express = require('express');
var router = express.Router();
var path = require('path');
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var request = require('request');
var Promise = require('promise');

var url = 'mongodb://localhost:27017/dbname';
var google_map_api = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=_LOCATION&radius=_RADIUS&type=_TYPE&key=AIzaSyCHtY3X8alDlbzNilleVSNS9ba5rhbpIh0';

// Move function locations
function Place(p, type) {
	this.name = p.name;
	this.icon = p.icon;
	this.location = p.geometry.location;
	this.type = type;
}

function requestPlace(place_request, type) {
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

/* GET home page. */
router.get('/', function(req, res, next) {
    var location = __dirname.replace("/routes", "/public");
    res.sendFile(path.join(location + '/Prototype.html'));
});

/* POST Google Places. */
router.post('/Simulate', function(req, res, next) {

	console.log(req.body);
	var lat = req.body.lat;
	var lng = req.body.lng;
	var radius = req.body.radius;
	var place_request = google_map_api.replace('_LOCATION', lat + "," + lng);
	place_request = place_request.replace('_RADIUS', radius);
	console.log(place_request);
	var types = ["police", "hospital", "fire_station"];
	var promises = [];
	for(var i = 0; i < types.length; i++)
	{
		promises.push(requestPlace(place_request, types[i]));
	}

	Promise.all(promises).then(function(allData) {
		var rtval = allData[0].concat(allData[1], allData[2]);
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(JSON.stringify(rtval));
		return res.end();
	});	
});

module.exports = router;
