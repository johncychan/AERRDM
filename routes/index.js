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
	res.redirect('/mobile/login/fail');
}

module.exports = function(passport, clients, db){

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

		dbquery.RequiredResources(db, req.body.Category, req.body.Severity, function (err, resources_list) {
			if(err)
				throw err;

			if(resources_list)
			{
				dbquery.InsertSimulation(db, req, resources_list, radius, function(err, r) {
		
					var resource_names = Object.keys(resources_list);
					console.log(resource_names);	
					var promises = [];

					for(var i = 0; i < resource_names.length; i++)
					{
						var url = gplace.PlaceQuery(req.body.Location, 5000, resource_names[i], resources_list[resource_names[i]].gname);
						promises.push(gplace.FacilitiesSearch(url, resource_names[i], req.body.ResourceNum, req.body.Expenditure, req.body.Location, r, db, "Single"));
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
			}

			else
			{
				res.writeHead(200, {'Content-Type': 'application/json'});
				return res.end();
			}
		});
	});

	router.post('/singleEvent/assignResource', function(req, res, next) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		console.log(req.body.sim_id);
		dbquery.SimulationDetails(db, req.body.sim_id, function(err, sim_details) {
			var resource_names = Object.keys(sim_details.RequiredResources);
			var promises = [];

			for(var i = 0; i < resource_names.length; i++)
			{
				promises.push(simulation.FindMobileResources(sim_details, resource_names[i], db));
			}

			Promise.all(promises).then(function(allData) {
				var rtval = [];
				var stats = []; 
				var count = 0;
				var planGenerated = true; 
				for(var i = 0; i < allData.length; i++)
				{
					count = count + allData[i].actualCount;
					if(allData[i].res != true)
					{
						rtval = rtval.concat(allData[i].res);
						stats.push(allData[i].statistics);
					}
					else
					{
						planGenerated = false;
					}
				}

				if(planGenerated == true)
				{
					console.log("setPlan");
					dbquery.SetPlan(db, req.body.sim_id, rtval, stats, count, function (err, results) {
						if(count == 0)
						{
							var response = "Plan is now available,";
							response = response.concat(req.body.sim_id);
							res.write(JSON.stringify(response));
							clients[req.connection.remoteAddress].emit("sim update", response);
							console.log("socket");
							return res.end();
						}
						else
						{
							//update database
							dbquery.SetSimResouceCount(db, req.sim_id, count, function (err, results) {
								var response = "Waiting for mobile response";
								res.write(JSON.stringify(response));
								console.log("wait");
								return res.end();
							});
						}
					});
				}
				
				else
				{
						var response = "Unable to generate plan";
						res.write(JSON.stringify(response));
						console.log("failed to generate plan");	
						return res.end();
				}
			});
		});
	});

	router.post('/mobile/requestResponse', isAuthenticated, function(req, res){
		console.log(req.body.response + " " + req.body.sim_id);
		var response = "Plan is now available,";
		response = response.concat(req.body.sim_id);						

		dbquery.Response(db, req.user._id, req.body.sim_id, req.body.response, function (err, flag) {
			console.log(flag);
			if(flag == 0) // job accept
			{
				dbquery.UpdateSimResponses(db, req.body.sim_id, -1, function (err, results) {
					if(results.ResWaitOn == 0)
						clients[results.Initiator].emit("sim update", response);	

					var rtval = "Job has been assigned";
				});
			}

			else if(flag == 1) // no job requested to user
			{
				var rtval = "No job has been assigned to you";				
			}

			else if(flag == 2) // job declined !!!!!!!!!!!!!!!!!!!!!!!!!!!! Need to remove username from resource
			{
				dbquery.UpdateSimResponses(db, req.body.sim_id, -1, function (err, results) {
					if(results.ResWaitOn == 0)
						clients[results.Initiator].emit("sim update", response);

					var rtval = "Job has been reassigned";				
				});	
			}
		});
		
	});

	router.get('/mobile/jobRequest', isAuthenticated, function(req, res) {
		console.log(req.user);
		dbquery.CheckJobRequest(db, req.user._id, function(err, doc) {
			if(err)
				throw err;

			res.writeHead(200, {'Content-Type': 'application/json'});
			var job = true;

			if(doc != false)
				res.write(JSON.stringify({Response: job, Job: doc.active}));
			else
			{
				job = false;
				res.write(JSON.stringify({Response: job}));
			}
			return res.end();						
		});
	});

	router.post('/mobile/login', passport.authenticate('login', {
		successRedirect: '/mobile/login/success',
		failureRedirect: '/mobile/login/fail',
		failureFlash : false  
	}));

	router.get('/mobile/login/success', isAuthenticated, function(req, res){
		var rtval = "success";
		var user = {firstName: req.user.firstName, lastName: req.user.lastName, email: req.user.email}; 
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify({request: rtval, 'user': user}));
		return res.end();
	});

	router.get('/mobile/login/fail', function(req, res, next) {
		var rtval = "fail";
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify({request: rtval}));
		return res.end();
	});

	router.post('/test', function(req, res, next) {
		var Test = {response: "hello"};
		console.log("Mobile");
		console.log(req.body);
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(Test));
		return res.end();
	});

	router.post('/mobile/currentLocation', isAuthenticated, function(req, res, next) {
		dbquery.UpdateLocation(db, req);
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write("OK");
		return res.end();
	});

	router.post('/mobile/finished', isAuthenticated, function(req, res, next) {
		var complete = req.body.Complete;
		
		if(complete == true)
		{
			dbquery.FinishedJob(db, req.user._id, function(doc) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write("OK");
				return res.end();
			});
		}
	});

	// Change to search based on mobile location
/*	router.post('/activeSims', function(req, res, next) {
		var rtval = [];

		dbquery.UpdatedGPS(db, req, function(err, sims) {
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
*/
	router.post('/singleEvent/UpdatedGPS', function(req, res, next) {
		dbquery.UpdatedGPS(db, req.body.sim_id, function(mobileResources) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(mobileResources));
			return res.end();
		});
	});

	router.post('/singleEvent/GetPlan', function(req, res, next) {
		console.log(req.body.sim_id);
		dbquery.GetPlan(db, req.body.sim_id, function(err, plan) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			if(plan != null)
			{
				res.write(JSON.stringify(plan));
				console.log("Sending Plan");
			}
			else
				console.log("NULL plan");
			res.end();
		});
	});

	router.post('/singleEvent/GetStats', function(req, res, next) {
		dbquery.GetStats(db, req.body.sim_id, function(err, stats) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			if(stats != null)
			{
				res.write(JSON.stringify(stats));
				console.log("Sending Plan");
			}
			else
				console.log("NULL stats");
			res.end();
		});
	});

	// Multi Event Initiate
	router.post('/multiEvent', function(req, res, next) {
		console.log(req.body);
		var radius = 5000;
		eventsRequired = [];
		events = req.body.Events;
		eventInfoPromise = [];

		for(var i = 0; i < events.length; i++)
		{
			eventInfoPromise.push(dbquery.PromiseRequiredResources(db, events[i].Category, events[i].Severity, null));
		}

		Promise.all(eventInfoPromise).then(function(eventsRequiredResources) {
			var EventFaciltiesSearch = [];

			for(var i = 0; i < events.length; i++)
			{
				events[i]["RequireResources"] = eventsRequiredResources[i];
				var resource_names = Object.keys(eventsRequiredResources[i]);

				for(var j = 0; j < resource_names.length; j++)
				{
					var url = gplace.PlaceQuery(events[i].Location, 5000, resource_names[j], eventsRequiredResources[i][resource_names[j]].gname);
					EventFaciltiesSearch.push(gplace.FacilitiesSearch(url, resource_names[j], req.body.ResourceNum, req.body.Expenditure, events[i].Location, null, db, "Multi"));
				}
			}

			Promise.all(EventFaciltiesSearch).then(function(eventFacilities) {		
				var count = 0;
				var facilities = [];
				for(var i = 0; i < events.length; i++)
				{
					event_type_count = Object.keys(eventsRequiredResources[i]).length;
					var pos = count + event_type_count;
					for(var j = count; j < pos; j++)
					{
						for(var k = 0; k < eventFacilities[j].length; k++)
						{
							var fname = eventFacilities[j][k].name;
							if(facilities[fname] == undefined)
							{
								rnummax = req.body.ResourceNum.max;
								rnummin = req.body.ResourceNum.min;
								rcostmax = req.body.Expenditure.max;
								rcostmin = req.body.Expenditure.min;
								
								eventFacilities[j][k]["resourceNum"] = Math.floor(Math.random() * (rnummax-rnummin+1) + rnummin);
								eventFacilities[j][k]["resouceCost"] = Math.floor(Math.random() * (rcostmax-rcostmin+1) + rcostmin);
								eventFacilities[j][k]["events"] = [i]; 
								facilities[fname] = eventFacilities[j][k]; 
							}

							else
							{
								facilities[fname].events.push(i);
							}
						}
					}
				}

				var key = Object.keys(facilities);
				FinalFacilities = [];

				for(var i = 0; i < key.length; i++)
				{
					FinalFacilities[i] = facilities[key[i]];
				}

				dbquery.InsertMultiSimulation(db, req, radius, events, FinalFacilities, function(r) {
					console.log(r.insertedId);
					res.writeHead(200, {'Content-Type': 'application/json'});
					res.write(JSON.stringify({sim_id: r.insertedId, facilities: FinalFacilities}));
					return res.end();
				});			
			});			
		});		
	});

/*
	db.collection("Simulations").insertOne({Expenditure: content.Expenditure, ResourceNum: content.ResourceNum, 
		Radius: radius, start: new Date(), Initiator: req.connection.remoteAddress, Events: events} ,

	generate facility resources
	assign users
	
*/

	router.post('/multiEvent/assignResources', function(req, res, next) {
		res.writeHead(200, {'Content-Type': 'application/json'});
		console.log(req.body.sim_id);
		dbquery.SimulationDetails(db, req.body.sim_id, function(err, sim_details) {
			var Events = sim_details.Events;
			var Facilities = sim_details.Facilities;
			console.log("Generate Start");
			simulation.MultiGenerateResources(Events, Facilities, sim_details, function(EventHeaps) {
				console.log("Generate Done");
				var Selection = simulation.MultiSelection(EventHeaps, Events);
				console.log("Selection Complete");
				console.log(JSON.stringify(Selection.Resources));
				console.log("test");
				res.write(JSON.stringify(Selection.Resources));
console.log("test2");
				return res.end();
			});
		});		
	});

	return router;
}

