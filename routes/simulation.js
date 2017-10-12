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

			Promise.all(durations).then(function(duration) {
				for(var i = 0; i < facilities.length; i++)
				{
					for(var j = 0; j < facilities[i].Place.resourceNum; j++)
					{
						var temp = new CreateMobileResource(sim_details, facilities[i], duration[i]);

						if(temp.Cost != Infinity)
						{
							heap.push(temp);
						}
					}
				}

				var promises = [];
				var insufficient_res = false;
				console.log("size: " + heap.size());
				for(var i = 0; i <  sim_details.RequiredResources[type].num && insufficient_res == false; i++)
				{
					if(heap.size() != 0)
					{
						var mobileRes = heap.pop();
						promises.push(CheckAvailability(db, sim_details, mobileRes));
					}
				
					else
					{
						insufficient_res = true;
						console.log("insufficient");
					}
				}
			
				if(insufficient_res == false)
				{
					Promise.all(promises).then(function(mobileResources) {
						var count = ActualMobile(mobileResources);
						console.log("end " + type + " " + count);
						return resolve({res: mobileResources, actualCount: count});
					});
				}

				else
					resolve({res: insufficient_res});
			});
		});
	});
}

function ActualMobile(mobileResources)
{
	var count = 0;

	for(var i = 0; i < mobileResources.length; i++)
	{
		if(mobileResources.User_id)
			count++;
	}

	return count;
}

function CheckAvailability (db, sim_details, mobileRes)
{
	console.log("check");
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
 
function CreateMobileResource(sim_details, facility, duration)
{
	this.id = new Mongodb.ObjectId();
	this.Location = facility.Place.location;
	this.Facility = facility.Place.name;
	this.Type = facility.Place.type;
	this.Expenditure = Math.random() * (sim_details.Expenditure.max-sim_details.Expenditure.min+1) + sim_details.Expenditure.min;
	this.Expenditure = this.Expenditure.toFixed(2);
	this.Velocity = Math.random() * (sim_details.Velocity.max-sim_details.Velocity.min+1) + sim_details.Velocity.min;
	this.User_id = "";	
	this.Cost = Cost(sim_details, this, duration);
	//Insert into database
//	//console.log(this);
}

function Cost(sim_details, resource, duration)
{
	var w_t = sim_details.Severity / 5;
	var w_m = 1 - w_t;
	var Lsplit = sim_details.Location.split(",");
	var distance = Distance({lat:Lsplit[0], lng:Lsplit[1]}, resource.Location);
	var E_t = Normalisation(distance, 0, sim_details.Radius);
	var E_m = Normalisation(resource.Expenditure, sim_details.Expenditure.min, sim_details.Expenditure.max);
	var dline = Deadline(duration, sim_details.Deadline);
	var cost = w_t*E_t+w_m*E_m*dline;

	return cost; 
}

function Normalisation(x, min, max)
{
	return (x-min)/(max-min);
}

function Distance(loc1, loc2)
{
	var radius = 6371e3;	
	var lat1 = loc1.lat * Math.PI / 180;
	var lat2 = loc2.lat * Math.PI / 180; 
	var latdiff = (loc2.lat - loc1.lat) * Math.PI / 180;
	var lngdiff = (loc2.lng - loc1.lng) * Math.PI / 180; 

	var a = Math.sin(latdiff/2) * Math.sin(latdiff/2) + Math.cos(lat1) * Math.cos(lat2) *
			Math.sin(lngdiff/2) * Math.sin(lngdiff/2);

	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return radius*c;
}

function Deadline(duration, deadline)
{
	var t = duration/60;

	if (t <= deadline)
		return 1;

	else
		return Infinity;
}

module.exports.FindMobileResources = FindMobileResources;
