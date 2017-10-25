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
				if(a.Cost > b.Cost)
					return 1;
				else
					return -1;
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
	this.Duration = directions.time;
	this.Distance = directions.distance;
	this.User_id = "";
	this.Cost = Cost(sim_details, this);
}

function CreateMobileResourceMulti(sim_details, facility, directions, expenditure, e_id)
{
	var mobile = {};
	mobile['id'] = "";
	mobile['Location'] = facility.location;
	mobile['Facility'] = facility.name;
	mobile['Type'] = facility.type;
	mobile['Expenditure'] = expenditure;
	mobile['Duration'] = directions.time;
	mobile['Distance'] = directions.distance;
	var details = {Severity: sim_details.Events[e_id].Severity, Radius: sim_details.Radius, Expenditure: sim_details.Expenditure, Deadline: sim_details.Events[e_id].Deadline}; 
	mobile['Cost'] = Cost(details, mobile);
	mobile['Events'] = facility.events;
	mobile['Severity'] = sim_details.Events[e_id].Severity;
	return mobile;
}

function Cost(sim_details, resource)
{
	var w_t = sim_details.Severity / 5;
	var w_m = 1 - w_t;
	var distance = resource.Distance;
	var E_t = Normalisation(distance, 0, sim_details.Radius);
	var E_m = Normalisation(resource.Expenditure, sim_details.Expenditure.min, sim_details.Expenditure.max);
	var dline = Deadline(resource.Duration, sim_details.Deadline);
	var cost = parseFloat(w_t)*parseFloat(E_t)+parseFloat(w_m)*parseFloat(E_m)*parseInt(dline);

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

function MultiGenerateResources(Events, Facilities, sim_details, callback)
{
	var EventHeaps = {};
	var EventDetails = [];
	var details = [];

	// Generate Heaps
	for(var e_id = 0; e_id < Events.length; e_id++)
	{
		var ReqRes = Events[e_id]["RequireResources"];
		var ReqType = Object.keys(ReqRes);
		
		for(var t_id = 0; t_id < ReqType.length; t_id++)
		{
			console.log(e_id + " " + ReqType[t_id]); 
			if(EventHeaps[e_id] == undefined)
				EventHeaps[e_id] = {};

			EventHeaps[e_id][ReqType[t_id]] = new Heap(function(a, b) {
											return a.Cost - b.Cost;
										}); 	
		}
	}

	console.log("setup Complete");
	var directionPromise = [];
	var AvaliabilityPromise = [];

	for(var f_id = 0; f_id < Facilities.length; f_id++)
	{
		var f_events = Facilities[f_id].events;

		for(var fe_id = 0; fe_id < f_events.length; fe_id++)
		{
			directionPromise.push(gplace.Directions(Facilities[f_id].location, Events[f_events[fe_id]].Location));
		}
	}

	Promise.all(directionPromise).then(function(directions) {
		console.log("Directions Promise Complete");
		var dpcount = 0;

		for(var f_id = 0; f_id < Facilities.length; f_id++)
		{
			var f_events = Facilities[f_id].events;
			var numRes = Facilities[f_id].resourceNum;
			var resType = Facilities[f_id].type;
			var expenditure = Math.random() * (sim_details.Expenditure.max-sim_details.Expenditure.min+1) + sim_details.Expenditure.min;
			expenditure = parseFloat(expenditure.toFixed(2));
			
			for(var rnum = 0; rnum < numRes; rnum++)
			{
				r_id = new Mongodb.ObjectId();

				for(var fe_id = 0; fe_id < f_events.length; fe_id++)
				{
					var e_id = f_events[fe_id];
					var temp_res = CreateMobileResourceMulti(sim_details, Facilities[f_id], directions[dpcount], expenditure, e_id);
					temp_res.id = r_id;
					EventHeaps[e_id][resType].push(temp_res);
					dpcount++;
				}
				if(rnum < numRes)
					dpcount = dpcount - f_events.length;
			}
		}

		console.log("Finish Generation");
		callback(EventHeaps);
	});
}

function MultiSelection(EventHeaps, Events)
{
	var mobileRes = {};
	var keyedRes = {};
	var insufficient = {};

	var insufficient_flag = false; 

	for(var e_id = 0; e_id < Events.length; e_id++)
	{
		var curEvent = Events[e_id];
		var resources = curEvent.RequireResources;		
		var types = Object.keys(resources);

		insufficient[e_id] = [];
		keyedRes[e_id] = new Map();

		for(var t_id = 0; t_id < types.length; t_id++)
		{
			var curType = types[t_id];
			for(var res = 0; res < resources[curType].num && insufficient_flag == false; res++)
			{
				if(EventHeaps[e_id][curType].size() > 0)
				{
					var temp = EventHeaps[e_id][curType].pop()
					keyedRes[e_id].set(temp.id, temp);
				}

				else
				{
					console.log("insufficient");
					insufficient_flag = true;
					insufficient[e_id].push(curType);
				}
			}

			insufficient_flag = false;		
		}
	}

	var Selection = {KeyedResources: keyedRes, Insufficient: insufficient, Heaps: EventHeaps};

	return Selection;
}

function MultiRemoveDuplicates(Selection)
{
	var events = Object.keys(Selection.KeyedResources);

	do 
	{ 
		changed = false;
		for(var e_id = 0; e_id < events.length; e_id++)
		{
			for(var [key, value] of Selection.KeyedResources[e_id])
			{
				for(var e_id2 = e_id+1; e_id2 < events.length; e_id2++)
				{
					if(Selection.KeyedResources[e_id2].has(key))
					{
						changed = true;

						var cmp = SeverityCompare(value, Selection.KeyedResources[e_id2].get(key), Selection.Insufficient[e_id], Selection.Insufficient[e_id2]);
			
						if(cmp == 1)
						{
							Selection.KeyedResources[e_id2].delete(key);

							if(Selection.Heaps[e_id2][value.Type].size() > 0)
							{
								var res = Selection.Heaps[e_id2][value.Type].pop();
								Selection.KeyedResources[e_id2].set(res.id, res);
							}

							else
							{
								Selection.Insufficient[e_id2].push(value.type);
							}
						}

						else if(cmp == -1)
						{
							Selection.KeyedResources[e_id].delete(key);

							if(Selection.Heaps[e_id][value.Type].size() > 0)
							{
								var res = Selection.Heaps[e_id][value.Type].pop();
								Selection.KeyedResources[e_id].set(res.id, res);
							}

							else
							{
								Selection.Insufficient[e_id].push(value.type);
							}

							e_id2 = events.length;
						}
					}
				}
			}
		}
	}while(changed == true);

	return Selection;
}

function SeverityCompare(a,b,i1,i2)
{
	if(a.Severity >= b.Severity && !(i1.includes(a.Type) && i2.includes(b.Type)))
	{
		if(!i1.includes(a.Type))
			return 1;
		else
			return -1;
	}

	else
	{
		if(a.Severity < b.Severity && !(i1.includes(a.Type) && i2.includes(b.Type)))
		{
			if(!i2.includes(b.Type))
				return -1;
			else
				return 1;
		}

		else
			return 0;
	}
}

module.exports.FindMobileResources = FindMobileResources;
module.exports.MultiGenerateResources = MultiGenerateResources;
module.exports.MultiSelection = MultiSelection;
module.exports.MultiRemoveDuplicates = MultiRemoveDuplicates;
