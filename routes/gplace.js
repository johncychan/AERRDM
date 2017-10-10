// Dependencies
var Promise 	= require('promise');
var request 	= require('request');
var dbquery	= require('./dbquery.js');

var google_map_api = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyCHtY3X8alDlbzNilleVSNS9ba5rhbpIh0';
var google_direction_api = 'https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyCHtY3X8alDlbzNilleVSNS9ba5rhbpIh0';

// Place Object
function Place(p, type, rnum, rcost) {
	this.name = p.name;
	this.location = p.geometry.location;
	this.type = type;
	this.resourceNum = Math.floor(Math.random() * (rnum.max-rnum.min+1) + rnum.min);
	this.resourceCost = Math.floor(Math.random() * (rcost.max-rcost.min+1) + rcost.min);
}

function PlaceQuery (location, radius, type, name) {
	var url = google_map_api;
	url = url.concat("&location=", location);
	url = url.concat("&radius=", radius);
	url = url.concat("&type=", type);
	url = url.concat("&name=", name);

	return url;
}

function FilterResults(rtval, type, rnum, rcost, dbr, db)
{
	var facility = [];
	var name = "";
	var icon = "";
	var f_icon = "";
	var counter = 0;

	if(type == "fire_station")	//name contains Fire Station or Fire Brigade
	{
		for(var j=0;j<rtval.results.length; j++)
		{
			name = rtval.results[j].name.toLowerCase();
			if(name.includes("fire station") || name.includes("fire brigade"))
			{ 
				facility.push(new Place(rtval.results[j], type, rnum, rcost));
				dbquery.InsertFacility(db, dbr, facility[counter]);
				counter++;
			}
		}
	}

	else if(type == "hospital")	//name contains Hospital not Service or Carpark
	{
		f_icon = 'https://maps.gstatic.com/mapfiles/place_api/icons/doctor-71.png';

		for(var j=0;j<rtval.results.length; j++)
		{
			name = rtval.results[j].name.toLowerCase();
			icon = rtval.results[j].icon;

			if(name.includes(type) && icon == f_icon && !(name.includes("service") || name.includes("carpark")))
			{ 
				facility.push(new Place(rtval.results[j], type, rnum, rcost));
				dbquery.InsertFacility(db, dbr, facility[counter]);
				counter++;
			}
		}
	}

	else if(type == "police") //name contains police
	{
		f_icon = 'https://maps.gstatic.com/mapfiles/place_api/icons/police-71.png';
		for(var j=0;j<rtval.results.length; j++)
		{
			name = rtval.results[j].name.toLowerCase();
			icon = rtval.results[j].icon;
			if(name.includes(type) && icon == f_icon)
			{ 
				facility.push(new Place(rtval.results[j], type, rnum, rcost));
				dbquery.InsertFacility(db, dbr, facility[counter]);
				counter++;
			}
		}
	}

	return facility;
}

function FacilitiesSearch(url, type, rnum, rcost, dbr, db)
{
	return new Promise(function(resolve, reject) {
		request(url, function(error, response, body) {
			if(error)
			{
				console.log(error);
				return reject(error);
			}
			var rtval = JSON.parse(body);
			var filterFacilities = FilterResults(rtval, type, rnum, rcost, dbr, db);
			return resolve(filterFacilities);
		});
	});
}

function DirectionsURL(start_location, end_location)
{
	var url = google_direction_api.concat("&origin=", start_location.lat,",",start_location.lng);
	url = url.concat("&destination=", end_location);
	url = url.concat("&departure_time=", parseInt(new Date().valueOf()/1000));
	
	return url;
}

function Directions(start_location, end_location)
{
	var url = DirectionsURL(start_location, end_location);
	var promise = [];

	promise.push(DirectionsRequest(url));

	Promise.all(promise).then(function(duration) {
		return duration[0];
	});

}

function DirectionsRequest(url)
{
	return new Promise(function(resolve, reject) {
		request(url, function(error, response, body) {
			if(error)
			{
				console.log(error);
				return reject(error);
			}
			var rtval = JSON.parse(body);
			//console.log(rtval.routes[0].legs[0].duration_in_traffic.value);


			var t = rtval.routes[0].legs[0].duration_in_traffic.value;
			return resolve(t);
		});
	});
}

module.exports.PlaceQuery = PlaceQuery;
module.exports.FacilitiesSearch = FacilitiesSearch;
module.exports.Directions = Directions;
