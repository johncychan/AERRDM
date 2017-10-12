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
			"Location" : {lat: req.body.lat, lng: req.body.lng},
			"Timestamp" : new Date()
			}
		}
	);
}

function FindAvaliableUser(db, sim_details, resource, callback)
{
	var date = new Date(new Date()-5*60000);
	var start = resource.Location.lat.toString();
	start = start.concat(",");
	start = start.concat(resource.Location.lng);
	db.collection("users").findOneAndUpdate({facility: resource.Facility, active:{$exists: false}, Timestamp: {$gt: date}}, 
		{$set: {active: { sim_id: sim_details._id, Severity: sim_details.Severity, Category: sim_details.Category,
				StartPoint: start, EndPoint: sim_details.Location, Deadline: sim_details.Deadline, Responded: false}
				}
		}, 
		function(err, doc) {
			callback(err, doc._id);
		}
	);
}

function CheckJobRequest(db, user_id, callback)
{
	db.collection("users").update({_id: mongodb.ObjectId(user_id)}, {$set: {Timestamp: new Date()}}, function() {
		console.log("update done");
		db.collection("users").find({_id: mongodb.ObjectId(user_id), active: {$exists: true}}, {active:1}).toArray(function (err, docs) {
			if(docs.length == 1)
				callback(err, docs[0]);
			else
				callback(err, false);
		});
	});
}

function InsertSimulation(db, req, resources_list, radius, callback)
{
	var content = req.body;

	db.collection("Simulations").insertOne({Category: content.Category, Severity: content.Severity, 
		Location: content.Location, Expenditure: content.Expenditure, Velocity: content.Velocity,
		ResourceNum: content.ResourceNum, Deadline: content.Deadline, RequiredResources: resources_list, 
		Radius: radius, start: new Date(), Initiator: req.connection.remoteAddress, ResRequired: 0, ResWaitOn: 0},
		function (err, r) {
			callback(err, r);
		}); 
}

function SetSimResouceCount(db, sim_id, req_count, callback)
{
	db.collection("Simulations").updateOne({_id: mongodb.ObjectId(sim_id)}, {$set: {ResRequired: req_count, ResWaitOn: req_count}}, function (err, r)
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
	db.collection("users").find({"active.sim_id": sim_id}, {_id: 1, Location: 1}).toArray(function(err, docs) {
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

function Response(db, user_id, sim_id, response, callback)
{
	console.log(response);

	if(response == "Accept")
	{
		db.collection("users").find({_id: mongodb.ObjectId(user_id), "active.sim_id": mongodb.ObjectId(sim_id), "active.Responded": false})
		.toArray(function (err, results)   
			{
				if(results.length == 1)
				{
					db.collection("users").updateOne({_id: mongodb.ObjectId(user_id)}, {$set: {"active.Responded": true}},
					function (err, update_results)
					{		
						callback(err, 0)
					});
				}

				else
				{
					callback(err, 1);
				}
			});
	}

	else
	{
		db.collection("users").updateOne({_id: mongodb.ObjectId(user_id)}, {$unset: {active:""}}, function (err, update_results)
		{
			callback(err, 2);
		});
	}
}

function UpdateSimResponses(db, sim_id, update_value, callback)
{
	db.findOneAndUpdate({_id: mongodb.ObjectId(sim_id)}, {$inc: {ResWaitOn: update_value}}, 
		{returnOriginal: false}, function (err, results) {
			callback(err, results);
		}
	);
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

function ResetUserBySimId(db, sim_id)
{
	db.collection("users").updateMany({"active.sim_id": mongodb.ObjectId(sim_id)}, {$unset: {active: ""}});
}

function ResetUserByInitiator(db, initiator)
{
	db.collection("Simulations").find({Initiator: initiator},{_id:1}).forEach(function(doc) {
		ResetUserBySimId(db, doc._id);
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
module.exports.ResetUserByInitiator = ResetUserByInitiator;
module.exports.ResetUserBySimId = ResetUserBySimId;
module.exports.Response = Response;
module.exports.UpdateSimResponses = UpdateSimResponses;
