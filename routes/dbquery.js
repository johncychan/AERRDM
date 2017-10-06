//Dependencies
var mongodb = require('mongodb');

url = 'mongodb://localhost:27017/passport';

// Required resources for event type and severity
function RequiredResources(db, category, severity, callback)
{
	//var resources = { };

	db.collection("EventTypeInfo").findOne({Category:category, Severity: severity}, {"Resources":1}, function(err, doc) {
		callback(err, doc.Resources);
	});	
}

function UpdateLocation(db, req)
{
	var user = req.user;

	db.collection("users").updateOne({ "_id" : mongodb.ObjectId(user._id)}, 
		{
			$set: {			
			"Sim_id" : req.body.sim_id,
			"Location" : {lat: req.body.lat, lng: req.body.lng},
			"Timestamp" : new Date()
			}
		}
	);
}

function FindAvaliableUser(db, sim_details, resource, callback)
{
	db.collection("users").findOneAndUpdate({facility: resource.Facility, active:{$exists: false}}, 
		{$set: {active: { sim_id: sim_details._id, Category: sim_details.category,
				StartPoint: resource.Location, EndPoint: sim_details.location, Deadline: sim_details.Deadline}}}, 
		function(err, doc) {
			callback(err, doc._id);
		}
	);
}

function CheckJobRequest(db, user_id, callback)
{
	db.collection("users").findOne({_id: mongodb.ObjectId(user_id), active: {$exists: true}}, {active:1}, function (err, doc) {
		callback(err, doc);
	});
}

function InsertSimulation(db, req, resources_list, radius, callback)
{
	var content = req.body;

	db.collection("Simulations").insertOne({Category: content.Category, Severity: content.Severity, 
		Location: content.Location, Expenditure: content.Expenditure, Velocity: content.Velocity,
		ResourceNum: content.ResourceNum, Deadline: content.Deadline, RequiredResources: resources_list, 
		Radius: radius, start: new Date(), Initiator: req.connection.remoteAddress, ResRequired: 0, ResCompleted: 0},
		function (err, r) {
			callback(err, r);
		}); 
}

function SetSimResouceCount(db, sim_id, req_count, callback)
{
	db.collection("Simulations").updateOne({_id: mongodb.ObjectId(sim_id)}, {$set: {ResRequired: req_count}}, function (err, r)
	{
		callback(err, r);
	});
}

function InsertFacility(db, dbr, place)
{
	db.collection("Facilities").insertOne({Sim_id: mongodb.ObjectId(dbr.insertedId), Place: place});
}

function FindFacilities(db, id, type, callback)
{
	db.collection("Facilities").find({Sim_id: mongodb.ObjectId(id), 'Place.type': type}, {Place: 1}).toArray(function (err, places) {
	//	console.log("p: " + JSON.stringify(places));
		callback(err, places);
	});   

}

function ActiveSims(db, req, callback)
{	
	db.collection("Simulations").find({active: 1}).toArray(function(err, docs) {
		callback(err, docs);
	});
}

function UpdatedGPS(db, sim_id, callback)
{
	db.collection("users").find({sim_id: sim_id}, {_id: 1, Location: 1}).toArray(function(err, docs) {
		if(err)
			throw err;
	
		var resources = [];

		for(var i = 0; i < docs.length; i++)
		{
			resources[docs[i]._id] = docs[i].Location;
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

function SetPlan(db, sim_id, plan, callback)
{

	db.collection("Simulations").updateOne({_id: mongodb.ObjectId(sim_id)}, {$set:{"Plan":plan}}, function(err, results) {
		console.log("Plan saved.");
		callback(err, results);
	});
}

function GetPlan(db, sim_id, callback)
{
	db.collection("Simulations").findOne({_id: mongodb.ObjectId(sim_id)}, {"Plan": 1}, 
	function (err, results)
	{
		if(err)
			throw err;

		callback(err, results.Plan);
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
module.exports.FindAvaliableUser = FindAvaliableUser;
module.exports.SetSimResouceCount = SetSimResouceCount;
module.exports.CheckJobRequest = CheckJobRequest;
module.exports.SetPlan = SetPlan;
module.exports.GetPlan = GetPlan;
