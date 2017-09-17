// Dependencies
var express 	= require('express');
var router 		= express.Router();
var path 		= require('path');
var assert 		= require('assert');
var Promise 	= require('promise');
var gplace		= require('./gplace.js');
var dbquery		= require('./dbquery.js');
var simulation	= require('./simulation.js');


// Variables
var google_map_api = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=_LOCATION&radius=_RADIUS&type=_TYPE&key=AIzaSyCHtY3X8alDlbzNilleVSNS9ba5rhbpIh0';

var public_dir = __dirname.replace("/routes", "/public");

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET index page. */
	router.get('/', function(req, res) {
		res.sendFile(path.join(public_dir + '/index.html'));
	});

	/* GET login page. */
	router.get('/login', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/login',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user, });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/login');
	});

	router.get('/index.html', function(req, res, next) {
		res.sendFile(path.join(public_dir + '/index.html'));
	});

	// GET map page.
	router.get('/map.html', function(req, res, next) {
		res.sendFile(path.join(public_dir + '/map.html'));
	});

	// Single Event Initiate
	router.post('/singleEvent', function(req, res, next) {
		console.log(req.body);
		var radius = 5000;

		dbquery.RequiredResources(req.db, req.body.Category, req.body.Severity, function (err, resources_list) {
			if(err)
				throw err;
			
			dbquery.InsertSimulation(req, resources_list, radius, function(err, r) {
		
				var resource_names = Object.keys(resources_list);
				console.log(resource_names);	
				var promises = [];

				for(var i = 0; i < resource_names.length; i++)
				{
					var url = gplace.PlaceQuery(req.body.Location, 5000, resource_names[i]);
					promises.push(gplace.FacilitiesSearch(url, resource_names[i], req.body.ResourceNum, req.body.Expenditure, r, req.db));
				}

				Promise.all(promises).then(function(allData) {
					var rtval = {resources: resources_list, sim_id: r.insertedId, facilities: []};

					for(var i = 0; i < resource_names.length; i++)
					{
						rtval.facilities = rtval.facilities.concat(allData[i]);
					}

					res.writeHead(200, {'Content-Type': 'application/json'});
					res.write(JSON.stringify(rtval));
					return res.end();
				});
			});
		});
	});

	router.post('/assignResource', function(req, res, next) {
		
		dbquery.SimulationDetails(req.db, req.body.sim_id, function(err, sim_details) {
			var resource_names = Object.keys(sim_details.RequiredResources);
			var promises = [];

			for(var i = 0; i < resource_names.length; i++)
			{
				promises.push(simulation.FindMobileResources(sim_details, resource_names[i], req.db));
			}

			Promise.all(promises).then(function(allData) {
				console.log("after");
				console.log(allData.length);
				var rtval = [];
				for(var i = 0; i < allData.length; i++)
				{
					rtval = rtval.concat(allData[i]);
				}
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(rtval));
				return res.end();
			});
		}); 
	});

	router.post('/test', function(req, res, next) {
		var Test = {response: "hello"};
		console.log("Mobile");
		console.log(req.body);
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(Test));
		return res.end();
	});

	router.post('/currentLocation', isAuthenticated, function(req, res, next) {
		dbquery.UpdateLocation(req);
	});

	// Change to search based on mobile location
	router.post('/activeSims', function(req, res, next) {
		var rtval = [];

		dbquery.ActiveSims(req, function(err, sims) {
			if(err)
				throw err
			
			console.log(sims);
			res.writeHead(200, {'Content-Type': 'application/json'});
			
			for(var i = 0; i < sims.length; i++)
			{
				var simEvent = {'_id': sims[i]._id, 'Category': sims[i].Category,
					'Severity': sims[i].Severity, 'Location': sims[i].Location,
					'Deadline': sims[i].Deadline};
				rtval.push(simEvent);
			}

			res.write(JSON.stringify(rtval));
			return res.end();
		});
	});

	router.post('/singleEvent/UpdatedGPS', function(req, res, next) {
		dbquery.UpdatedGPS(db, req.sim_id, function(err, mobileResources) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(mobileResources));
			return res.end();
		});
	});

	return router;
}

