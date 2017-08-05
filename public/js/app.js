// Declares the initial angular module "meanMapApp". Module grabs other controllers and services.
var app = angular.module('meanMapApp', ['addCtrl', 'geolocation', 'gservice', 'ngMap']);
	app.service('mapService', function(){
		var map;
		this.setMap = function (myMap){
			map = myMap;
		};
		this.getMap = function(){
			if(map) return map;
			throw new Error("Map not defined");
		};
		this.getLatLng = function(){
			var center = map.getCenter();
		
			return{
				lat: center.lat(),
				lng: center.lng()
			};
		};

	});



angular.module('meanMapApp', ['ngMap']).controller('mainContrl', function(NgMap){

	//map initialization
	var vm = this;
	NgMap.getMap("map").then(function(map){
		vm.map = map;
	});

	//array store markers
	var markers = [];
	var id;

	//put a marker by clicking mouse
	vm.placeMarker = function(e){
		var marker = new google.maps.Marker({position: e.latLng, map:vm.map});
		vm.map.panTo(e.latLng);	
		id = marker.__gm_id
		markers[id] = marker;
	
		google.maps.event.addListener(marker, "rightclick", function(point){
			id = this.__gm_id;
			delMarker(id)
		});
	}

	var delMarker = function(id){
		marker = markers[id];
		marker.setMap(null);
	}

});



