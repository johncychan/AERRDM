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
				heap = ResourceGeneration(sim_details, facilities, directions, heap);
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

function ResourceGeneration(sim_details, facilities, directions, heap)
{
	for(var i = 0; i < facilities.length; i++)
	{
		var expenditure = Math.random() * (sim_details.Expenditure.max-sim_details.Expenditure.min+1) + sim_details.Expenditure.min;
		expenditure = parseFloat(expenditure.toFixed(2));

		for(var j = 0; j < facilities[i].Place.resourceNum; j++)
		{
			var temp = new CreateMobileResource(sim_details, facilities[i], directions[i], expenditure);
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
 
function CreateMobileResource(sim_details, facility, directions, expenditure)
{
	this.id = new Mongodb.ObjectId();
	this.Location = facility.Place.location;
	this.Facility = facility.Place.name;
	this.Type = facility.Place.type;
	this.Expenditure = expenditure;
	this.Duration = directions.time / 60;
	this.Distance = directions.distance / 1000;
	this.User_id = "";
	this.Cost = Cost(sim_details, this);
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

module.exports.FindMobileResources = FindMobileResources;
