// Dependencies
var Promise 	= require('promise');
var dbquery		= require('./dbquery.js');
var Heap		= require('heap');
var Mongodb		= require('mongodb');
var gplace		= require('./gplace.js');

function FindMobileResources(sim_details, type, db)
{
	return new Promise(function(resolve, reject) {
		console.log("start " + type);
		dbquery.FindFacilities(db, sim_details._id, type, function (err, facilities) {
			if(err)
				return reject(err);

			var heap = new Heap(function(a, b) {
				return a.Cost - b.Cost;
			});		

			var durations = [];
			for(var i = 0; i < facilities.length; i++)
			{
				durations.push(gplace.Directions(facilities[i].Place.location, sim_details.Location));
			}

			Promise.all(durations).then(function(directions) {
				heap = ResourceGeneration(sim_details, facilities, directions, type, heap);
				var selection = ResourceSelection(sim_details, heap, db, type);
				if(selection.insufficient_res == false)
				{
					Promise.all(selection.promises).then(function(mobileResources) {
						var count = ActualMobile(mobileResources);
						console.log("end " + type + " " + count + " " + mobileResources.length);
						return resolve({res: mobileResources, actualCount: count, statistics: selection.stats});
					});
				}

				else
				{
					console.log("failed");
					resolve({res: insufficient_res, actualCount: null, statistics: null});
				}
			});
		});
	});
}

function ResourceGeneration(sim_details, facilities, directions, type, heap)
{
	for(var i = 0; i < facilities.length; i++)
	{
		var expenditure = Math.random() * (sim_details.Expenditure.max-sim_details.Expenditure.min+1) + sim_details.Expenditure.min;
		expenditure = parseFloat(expenditure.toFixed(2));

		for(var j = 0; j < facilities[i].Place.resourceNum; j++)
		{
			var temp = new CreateMobileResource(sim_details, facilities[i].Place, directions[i], expenditure, type);
			if(temp.Cost != Infinity)
			{
				heap.push(temp);
			}
		}
	}

	console.log("heap size " + heap.size());

	return heap;
}

function ResourceSelection(sim_details, heap, db, type)
{
	var promises = [];
	var stats = {"type": type, total_time: 0, total_distance: 0, total_expenditure: 0, num_resources: 0, completion_time: 0};
	stats.num_resources = sim_details.RequiredResources[type].num;

	for(var i = 0; i < stats.num_resources; i++)
	{
		if(heap.size() != 0)
		{
			var mobileRes = heap.pop();

			if(mobileRes.Duration > stats.completion_time)
				stats.completion_time = mobileRes.Duration;

			stats.total_time += mobileRes.Duration;
			stats.total_distance += mobileRes.Distance;
			stats.total_expenditure += mobileRes.Expenditure;
			promises.push(CheckAvailability(db, sim_details, mobileRes));
		}
	
		else
		{
			console.log("insufficient");
			return {insufficient_res: true, 'promises':null, 'stats': null};
		}
	}

	console.log("sufficient");
	return {insufficient_res: false, 'promises':promises, 'stats':stats};
}

function ActualMobile(mobileResources)
{
	var count = 0;

	for(var i = 0; i < mobileResources.length; i++)
	{
		if(mobileResources[0].User_id)
			count++;
	}

	return count;
}

function CheckAvailability (db, sim_details, mobileRes)
{
	return new Promise(function(resolve, reject) {
		dbquery.FindAvaliableUser(db, sim_details, mobileRes, function (err, user_id) {
			if(err)
				return reject(err);

			if(user_id != null)
			{
				console.log("User: "+ user_id);
				mobileRes.User_id = user_id;
			}
			return resolve(mobileRes);
		});
	});
}
 
function CreateMobileResource(sim_details, facility, directions, expenditure, type)
{
	this.id = new Mongodb.ObjectId();
	this.Location = facility.location;
	this.Facility = facility.name;
	this.Type = type;
	this.Expenditure = expenditure;
	this.Duration = directions.time / 60;
	this.Distance = directions.distance / 1000;
	this.User_id = "";
	this.Cost = Cost(sim_details, this);
}

function CreateMobileResourceMulti(sim_details, facility, directions, expenditure, type)
{
	this.id = new Mongodb.ObjectId();
	this.Location = facility.location;
	this.Facility = facility.name;
	this.Type = type;
	this.Expenditure = expenditure;
	this.Duration = directions.time / 60;
	this.Distance = directions.distance / 1000;
	this.User_id = "";
	this.Cost = [];
	for(var i = 0; i < sim_details.Events.length; i++)
	{
		var details = {Location: sim_details.Events[i].Location, Severity: sim_details.Events[i].Severity, 
			Category: sim_details.Events[i].Category, Deadline: sim_details.Events[i].Deadline, Radius: sim_details.Radius,
			Expenditure: sim_details.Expenditure};
		this.Cost.push(Cost(details, this));	
	} 
}

function Cost(sim_details, resource)
{
	var w_t = sim_details.Severity / 5;
	var w_m = 1 - w_t;
	var distance = resource.Distance;
	var E_t = Normalisation(distance, 0, sim_details.Radius);
	var E_m = Normalisation(resource.Expenditure, sim_details.Expenditure.min, sim_details.Expenditure.max);
	var dline = Deadline(resource.Duration, sim_details.Deadline);
	var cost = w_t*E_t+w_m*E_m*dline;
	return cost; 
}

function Normalisation(x, min, max)
{
	return (x-min)/(max-min);
}

function Deadline(duration, deadline)
{
	if (duration <= deadline)
		return 1;

	else
		return Infinity;
}

/*				events[i]["RequireResources"] = eventsRequiredResources[i];
				var resource_names = Object.keys(eventsRequiredResources[i]);*/

function MultiGenerateResources(Events, Facilities, sim_details, callback)
{
	var EventHeaps = {};
	var EventDetails = [];
	var details = [];

	// Generate Heaps and Details
	for(var i = 0; i < Events.length; i++)
	{
		var ReqRes = Events[i]["RequireResources"];
		var ReqType = Object.keys(ReqRes);
		
		for(var j = 0; j < ReqType.length; j++)
		{
			EventHeaps[i] = {};
			EventHeaps[i][ReqType[j]] = new Heap(function(a, b) {
											return a[0].Cost - b[0].Cost;
										}); 
		}

		details[i] = {Location: Events[i].location, "_id": sim_details._id, Severity: Events[i].severity, 
			Category: Events[i].Category, Deadline: Events[i].Deadline};		
	}

	console.log("setup Complete");
	var directionPromise = [];
	var AvaliabilityPromise = [];

	for(var i = 0; i < Facilities.length; i++)
	{
		for(var j = 0; j < Facilities[i].events.length; j++)
		{
			directionPromise.push(gplace.Directions(Facilities[i].location, Events[j].Location));
		}
	}

	Promise.all(directionPromise).then(function(directions) {
		console.log("Directions complete");
		for(var i = 0; i < Facilities.length; i++)
		{
			console.log(Facilities[i].name);
			var numRes = Facilities[i].resourceNum;
			var resType = Facilities[i].type;
			var eventsReq = Facilities[i].events;
			var expenditure = Math.random() * (sim_details.Expenditure.max-sim_details.Expenditure.min+1) + sim_details.Expenditure.min;
			expenditure = parseFloat(expenditure.toFixed(2));

			var newRes = [];
			newRes[0] = new CreateMobileResourceMulti(sim_details, Facilities[i], directions[i], expenditure, resType);
			newRes[1] = eventsReq;

			for(var j = 0; j < newRes[1].length; j++)
			{
				EventHeaps[newRes[1][j]][resType].push(newRes);
			}
		}

		callback(EventHeaps);
	});
}

function CheckAvailabilityCallback (db, sim_details, mobileRes, callback)
{
	dbquery.FindAvaliableUser(db, sim_details, mobileRes, function (err, user_id) {
		if(err)
			return reject(err);

		if(user_id != null)
		{
			console.log("User: "+ user_id);
			mobileRes.User_id = user_id;
		}
		return resolve(mobileRes);
	});
}

function MultiSelection(EventHeaps, Events)
{
	var mobileRes = {};
	var insufficient = false; 
	for(var i = 0; i < Events.length; i++)
	{
		console.log("event " + i);
		var ReqRes = Events[i]["RequireResources"];
		var ReqType = Object.keys(ReqRes);

		for(var j = 0; j < ReqType.length; j++)
		{	
			console.log(ReqType[j]);
			var ReqResNum = ReqRes[ReqType[j]].num;
			console.log(ReqResNum);
			mobileRes[i] = {};
			mobileRes[i][ReqType[j]] = [];

			for(var k = 0; k < ReqResNum && insufficient == false; k++)
			{
				if(EventHeaps[i][ReqType[j]].size() != 0)
				{
					mobileRes[i][ReqType[j]].push(EventHeaps[i][ReqType[j]].pop());
				}
	
				else
				{
					mobileRes[i][ReqType[j]] = false;
					insufficient = true;
					console.log("insufficient");
				}

//				console.log(EventHeaps[i][ReqType[j]].size() + " " + insufficient + " " + k + " " + ReqResNum);
			}	
	
			insufficient = false;
		}
	}

	console.log("....");
	var Selection = {Resources: mobileRes, Heaps: EventHeaps};
	return Selection;
}


module.exports.FindMobileResources = FindMobileResources;
module.exports.MultiGenerateResources = MultiGenerateResources;
module.exports.MultiSelection = MultiSelection;
