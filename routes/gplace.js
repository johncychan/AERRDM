// Dependencies
var Promise 	= require('promise');
var request 	= require('request');

var google_map_api = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=_LOCATION&radius=_RADIUS&type=_TYPE&key=AIzaSyCHtY3X8alDlbzNilleVSNS9ba5rhbpIh0';

// Place Object
function Place(p, type) {
	this.name = p.name;
//	this.icon = p.icon;
	this.location = p.geometry.location;
	this.type = type;
}

// Request Places from Google Places API
function RequestPlace(place_request, type) {
	return new Promise(function(resolve, reject) {
		place_request = place_request.replace('_TYPE',type);
		type = type.replace('_', ' ');
		console.log(place_request);
		request(place_request, function(error, response, body) {
			if(error) {
				return reject(error);
			}

			rtval = JSON.parse(body);
			facility = [];
			for(var j=0;j<rtval.results.length; j++)
			{
				var name = rtval.results[j].name.toLowerCase();
				if(name.includes(type)) {
					console.log(name);
					facility.push(new Place(rtval.results[j], type));
				}
			}

			return resolve(facility);
		});
	});
}

function PlaceQuery (location, radius, type) {
	url = google_map_api;
	url = url.replace('_LOCATION', location);
	url = url.replace('_TYPE', type);
	url = url.replace('_RADIUS', radius);

	return url;
}

function FilterResults(rtval, type)
{
	var	facility = [];
	var name = "";
	var icon = "";
	var f_icon = "";

	if(type == "fire_station")
	{
		for(var j=0;j<rtval.results.length; j++)
		{
			name = rtval.results[j].name.toLowerCase();
			icon = rtval.results[j].icon; 
			if(name.includes(type)) 
			{
				console.log(name);
				facility.push(new Place(rtval.results[j], type));
			}
		}
	}

	else
	{
		if(type == "hospital")
			f_icon = 'https://maps.gstatic.com/mapfiles/place_api/icons/doctor-71.png';
		if(type == "police")
			f_icon = 'https://maps.gstatic.com/mapfiles/place_api/icons/police-71.png';

		console.log(f_icon);
		for(var j=0;j<rtval.results.length; j++)
		{
			name = rtval.results[j].name.toLowerCase();
			icon = rtval.results[j].icon;
			if(name.includes(type) && icon == f_icon) 
			{
				console.log(name);
				facility.push(new Place(rtval.results[j], type));
			}
		}
	}

	return facility;
}

function FacilitiesSearch(url, type)
{
	return new Promise(function(resolve, reject) {
		console.log(url);
		request(url, function(error, response, body) {
			if(error) {
				return reject(error);
			}
//			console.log("search finish");
			var rtval = JSON.parse(body);
			var filterFacilities = FilterResults(rtval, type);
//			console.log("filter complete");
			console.log("filter: " + filterFacilities);
			return resolve(filterFacilities);
		});
	});
}

module.exports.RequestPlace = RequestPlace;
module.exports.PlaceQuery = PlaceQuery;
module.exports.FacilitiesSearch = FacilitiesSearch;
