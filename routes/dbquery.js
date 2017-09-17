//Dependencies
var mongodb = require('mongodb');

url = 'mongodb://localhost:27017/passport';

// Required resources for event type and severity
function RequiredResources(db, category, severity, callback)
{
	var resources = { };

	db.collection("EventTypeInfo").findOne({Category:category, Severity: severity}, {"Resources":1}, function(err, doc) {
		callback(err, doc.Resources);
	});	
}

function UpdateLocation(req)
{
	var user = req.session.user;
	var db = req.db;

	db.collection("usersLocation").save({ "_id" : mongodb.ObjectId(user._id),
		"Username" : user.username, 
		"Sim_id" : req.body.sim_id,
		"Location" : req.body.location,
		"Facility:" : user.facility,
		"Timestamp" : new Date()
	});
}

function InsertSimulation(req, resources_list, radius, callback)
{
	var db = req.db;
	var content = req.body;

	db.collection("Simulations").insertOne({Category: content.Category, Severity: content.Severity, 
		Location: content.Location, Expenditure: content.Expenditure, Velocity: content.Velocity,
		ResourceNum: content.ResourceNum, Deadline: content.Deadline, RequiredResources: resources_list, 
		Radius: radius, start: new Date(), active: "Search"},
		function (err, r) {
			callback(err, r);
		}); 
}

function InsertFacility(dbr, place, db)
{
	console.log("Inserted:" + place.name);
	console.log("simid: " + dbr.insertedId);
	db.collection("Facilities").insertOne({Sim_id: mongodb.ObjectId(dbr.insertedId), Place: place});

}

function FindFacilities(db, id, type, callback)
{
	db.collection("Facilities").find({Sim_id: mongodb.ObjectId(id), 'Place.type': type}, {Place: 1}).toArray(function (err, places) {
	//	console.log("p: " + JSON.stringify(places));
		callback(err, places);
	});   

}

function ActiveSims(req, callback)
{
	var db = req.db;
	
	db.collection("Simulations").find({active: 1}).toArray(function(err, docs) {
		callback(err, docs);
	});
}

function UpdatedGPS(db, sim_id, callback)
{
	db.collection("usersLocation").find({sim_id: sim_id}, {sim_id: 0, timestamp: 0}).toArray(function(err, docs) {
		if(err)
			throw err;
	
		var resources = [];

		for(var i = 0; i < docs.length; i++)
		{
			resources[docs[i]._id] = docs[i].location;
		}

		callback(resources);
	});
}

function SimulationDetails(db, sim_id, callback)
{
	db.collection("Simulations").findOne({_id: mongodb.ObjectId(sim_id)}, function(err, details) {
		if(err)
			throw err;

		callback(err, details);
	});
}

module.exports.RequiredResources = RequiredResources;
module.exports.UpdateLocation = UpdateLocation;
module.exports.InsertSimulation = InsertSimulation;
module.exports.InsertFacility = InsertFacility;
module.exports.ActiveSims = ActiveSims;
module.exports.UpdatedGPS = UpdatedGPS;
module.exports.SimulationDetails = SimulationDetails;
module.exports.FindFacilities = FindFacilities;
