// Dependencies
var express 	= require('express');
var router 	= express.Router();
var path 	= require('path');
var mongo 	= require('mongodb').MongoClient;
var assert 	= require('assert');
var Promise 	= require('promise');
var gplace	= require('./gplace.js');

// Variables
var url = 'mongodb://localhost:27017/dbname';
var google_map_api = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=_LOCATION&radius=_RADIUS&type=_TYPE&key=AIzaSyCHtY3X8alDlbzNilleVSNS9ba5rhbpIh0';
var public_dir = __dirname.replace("/routes", "/public")

/* GET home page. */
router.get('/index.html', function(req, res, next) {
    res.sendFile(path.join(public_dir + '/index.html'));
});

/* GET map page. */
router.get('/map.html', function(req, res, next) {
    res.sendFile(path.join(public_dir + '/map.html'));
});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendFile(path.join(public_dir + '/Prototype.html'));
});

/* POST Google Places. */
router.post('/Simulate', function(req, res, next) {

	console.log(req.body);
	console.log(gplace.Test);
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
		promises.push(gplace.RequestPlace(place_request, types[i]));
	}

	Promise.all(promises).then(function(allData) {
		var rtval = allData[0].concat(allData[1], allData[2]);
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(JSON.stringify(rtval));
		return res.end();
	});	
});

module.exports = router;
