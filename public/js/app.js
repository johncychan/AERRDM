// Declares the initial angular module "meanMapApp". Module grabs other controllers and services.
var app = angular.module('meanMapApp', ['ngMap']);
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


app.controller('mainContrl', function(NgMap, $compile, $scope){

	//map initialization
	var vm = this;
	NgMap.getMap("map").then(function(map){
		vm.map = map;
	});

	//put a marker by clicking mouse
	vm.placeMarker = function(e){
		if(vm.marker){
			vm.marker.setMap(null);
		}else{
			vm.marker = new google.maps.Marker({
				position: e.latLng,
				map: vm.map
			});
		}
		//display the marker info
		var htmlElement = "<div><h1><button ng-click=\"vm.setDataField()\">" + "Start simulation" + "</button></h1></div>"
		//need to compile 
		var compiled = $compile(htmlElement)($scope)
		vm.marker.infoWin = new google.maps.InfoWindow({
			// content: "<div><h1><button id=\"singleEvent\" ng-click=\"vm.startSingleEvent()\">" + "Start simulation" + "</button></h1></div>"
			content: compiled[0]
		});
		//show the infomation window
		vm.marker.addListener('click', function($scope){
			vm.marker.infoWin.open(vm.map, vm.marker);
		});
	}

	vm.setDataField() = function(){
		//change center view
		vm.map.setZoom(18);
		vm.map.setCenter(vm.marker.position);
		$scope.open = function(){
			
		}
		//pop a form ask user set the input field

	}

	// now start the simulation
	vm.startSingleEvent = function(){

		vm.map.setZoom(16);
		vm.map.setCenter(vm.marker.position);
	} 

});

