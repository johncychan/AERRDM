// Dependencies
var Promise 	= require('promise');
var request 	= require('request');
var dbquery	= require('./dbquery.js');

var google_map_api = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyBG-2Ttf9Y_t-S08QN-wrOiqLdun2GfzWY&libraries=places';
var google_direction_api = 'https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyBG-2Ttf9Y_t-S08QN-wrOiqLdun2GfzWY&libraries=places';

// Place Object
function Place(p, type, rnum, rcost, destination, mode) {
	this.name = p.name;
	this.location = p.geometry.location;
	this.distance = Distance(p.geometry.location, destination);
	this.type = type;
	this.resourceNum = Math.floor(Math.random() * (rnum.max-rnum.min+1) + rnum.min);
	this.resourceCost = Math.floor(Math.random() * (rcost.max-rcost.min+1) + rcost.min);
}

function PlaceQuery (location, radius, type, name) {
	var url = google_map_api;
	url = url.concat("&location=", location.lat, ",",location.lng);
	url = url.concat("&radius=", radius);
	url = url.concat("&type=", type);
	url = url.concat("&name=", name);

	return url;
}

function FilterResults(rtval, type, rnum, rcost, destination, dbr, db, mode)
{
	var facility = [];
	var name = "";
	var icon = "";
	var f_icon = "";
	var counter = 0;
	var create = false;

	for(var j=0; j <rtval.results.length; j++)
	{
		name = rtval.results[j].name.toLowerCase();
		icon = rtval.results[j].icon;

		if(type == "fire_station")	//name contains Fire Station or Fire Brigade
		{

			if(name.includes("fire station") || name.includes("fire brigade"))
			{ 
				facility.push(new Place(rtval.results[j], type, rnum, rcost, destination, mode));
				create = true;
			}
		}

		else if(type == "hospital")	//name contains Hospital not Service or Carpark
		{
			f_icon = 'https://maps.gstatic.com/mapfiles/place_api/icons/doctor-71.png';

			if(name.includes(type) && icon == f_icon && !(name.includes("service") || name.includes("carpark")))
			{ 
				facility.push(new Place(rtval.results[j], type, rnum, rcost, destination, mode));
				create = true;
			}
		}

		else if(type == "police") //name contains police
		{
			f_icon = 'https://maps.gstatic.com/mapfiles/place_api/icons/police-71.png';

			if(name.includes(type) && icon == f_icon)
			{ 
				facility.push(new Place(rtval.results[j], type, rnum, rcost, destination, mode));					
				create = true;
			}
		}

		if(create == true && mode == "Single")
		{
			dbquery.InsertFacility(db, dbr, facility[counter]);
			counter++;
		}

		create = false;
	}

	return facility;
}

function FacilitiesSearch(url, type, rnum, rcost, destination, dbr, db, mode)
{
	console.log("Facility Search for " + type);
	return new Promise(function(resolve, reject) {	
		request(url, function(error, response, body) {
			if(error)
			{
				console.log(error);
				return reject(error);
			}
			var rtval = JSON.parse(body);
			var filterFacilities = FilterResults(rtval, type, rnum, rcost, destination, dbr, db, mode);

			return resolve(filterFacilities);
		});
	});
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

	return (radius*c);
}

function DirectionsURL(start_location, end_location)
{
	var url = google_direction_api.concat("&origin=", start_location.lat,",",start_location.lng);
	url = url.concat("&destination=", end_location.lat,",",end_location.lng);
	var date = new Date()+5*60000;
	url = url.concat("&departure_time=", parseInt(date.valueOf()));
	return url;
}

function Directions(start_location, end_location)
{
	var url = DirectionsURL(start_location, end_location);
	var t = 0;
	var d = 0;

	return new Promise(function(resolve, reject) {
		request(url, function(error, response, body) {
			if(error)
			{
				console.log(error);
				return reject(error);
			}

			var rtval = JSON.parse(body);

			if(rtval.routes[0] != undefined)
			{
				t = rtval.routes[0].legs[0].duration_in_traffic.value;
				d = rtval.routes[0].legs[0].distance.value;
			}
			else
			{
				var speed = Math.floor(Math.random() * 51 + 60);
				d = Distance(start_location, end_location);
				t = ((d/1000)/speed)*60;
			}

			var directions = {time: t, distance: d};

			return resolve(directions);
		});
	});
}

module.exports.PlaceQuery = PlaceQuery;
module.exports.FacilitiesSearch = FacilitiesSearch;
module.exports.Directions = Directions;
