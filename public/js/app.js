// // Declares the initial angular module "meanMapApp". Module grabs other controllers and services.

// var app = angular.module('meanMapApp', ['ngMap', 'ngMaterial']);



// app.controller('mainContrl', function(NgMap, $compile, $scope, $mdDialog){

// 	//map initialization
// 	var vm = this;
// 	NgMap.getMap("map").then(function(map){
// 		vm.map = map;
// 	});

// 	//put a marker by clicking mouse
// 	vm.placeMarker = function(e){
// 		if(vm.marker){
// 			vm.marker.setMap(null);
// 		}else{
// 			vm.marker = new google.maps.Marker({
// 				position: e.latLng,
// 				map: vm.map,
// 				draggable: true
// 			});
// 		}
// 		//display the marker info
// 		var htmlElement = "<div><h1><button ng-click=\"vm.open()\" >" + "Start simulation" + "</button></h1></div>"
// 		//need to compile 
// 		var compiled = $compile(htmlElement)($scope)
// 		vm.marker.infoWin = new google.maps.InfoWindow({
// 			// content: "<div><h1><button id=\"singleEvent\" ng-click=\"vm.startSingleEvent()\">" + "Start simulation" + "</button></h1></div>"
// 			content: compiled[0]
// 		});
// 		//show the infomation window
// 		vm.marker.addListener('click', function($scope){
// 			vm.marker.infoWin.open(vm.map, vm.marker);
// 		});
// 		google.maps.event.clearListeners(vm.map, 'click');
// 	}

// 	$scope.setDataField = function(){
// 		//close dialog
// 		$mdDialog.cancel();

// 		// console.log($scope.factor);

// 		//change center view
// 		vm.map.setZoom(18);
// 		vm.map.setCenter(vm.marker.position);


// 	}

// 	//open factor dialog
// 	vm.open = function(){
// 		// generate function () ......

// 		$scope.factor = {
// 			'ID': '#001',
// 			'Severity Level': 6,
// 			'Category': "Medical Help",
// 			'Resource avg. expenditure': 1000,
// 			'Resource avg. velocity': "5 mins",
// 			'Deadline': "4 mins"
// 		}
// 		$mdDialog.show(
// 			{
// 				templateUrl: "factorDialog.html",
// 				clickOutsideToClose: true,
// 		        scope: $scope,
// 		        preserveScope: true,
// 		        controller: function($scope) {
// 			},
// 		});
// 	};

// 	// reset factor
// 	$scope.reset = function () {
			
// 	};

// 	// close dialog
// 	$scope.close = function () {
//     	$mdDialog.cancel();
//   	};
	
// 	// now start the simulation
// 	vm.startSingleEvent = function(){

// 		// vm.map.setZoom(16);
// 		// vm.map.setCenter(vm.marker.position);
// 		/***********
// 		bug existed
// 		***********/
// 		// var circle = new google.maps.Circle({
// 		// 	center: vm.marker,
// 		// 	radius: 1000,
// 		// 	stroerColor: "#E16D65",
// 		// 	strokeOpacity: 1,
// 		// 	strokeWeight: 3,
// 		// 	fillColor: "#E16D65",
// 		// 	fillOpacity: 0
// 		// })
// 		// circle.setMap(vm.map);
// 		// var direction = 1;
//   //       var rMin = 150, rMax = 300;
//   //       setInterval(function() {
//   //           var radius = circle.getRadius();
//   //           if ((radius > rMax) || (radius < rMin)) {
//   //               direction *= -1;
//   //           }
//   //           circle.setRadius(radius + direction * 10);
//   //       }, 50);

// 		var pyrmont = {lat: vm.marker.position.lat(), lng: vm.marker.position.lng()};
// 		vm.service = new google.maps.places.PlacesService(vm.map);
// 		vm.service.nearbySearch({
// 			location: pyrmont,
// 			radius: 1000,
// 			type: ['hospital']
// 		}, callback);

// 		function callback(results, status){
// 			if(status === google.maps.places.PlacesServiceStatus.OK){
// 				for(var i = 0; i < results.length; i++){
// 					createMarker(results[i]);
// 				}
// 			}
// 		}
// 		function createMarker(place){
// 			var placeLoc = place.geometry.location;
// 			var marker = new google.maps.Marker({
// 				map: vm.map,
// 				position: place.geometry.location
// 			});
// 		}
// 	} 

// });

// // angular.module('meanMapApp').controller('modalController', ['$scope', function($scope) {
    
// // }]);



// app.controller('AppCtrl', function ($scope, $timeout, $mdSidenav) {
//     $scope.toggleLeft = buildToggler('left');
//     $scope.toggleRight = buildToggler('right');

//     function buildToggler(componentId) {
//       return function() {
//         $mdSidenav(componentId).toggle();
//       };
//     }
//   });

// // angular.module('meanMapApp').controller('modalController', ['$scope', function($scope) {
    
// // }]);

// app.controller('AppCtrl', ['$interval',
//     function($interval) {
//       var self = this;

//       self.activated = true;
//       self.determinateValue = 30;

//       // Iterate every 100ms, non-stop and increment
//       // the Determinate loader.
//       $interval(function() {

//         self.determinateValue += 1;
//         if (self.determinateValue > 100) {
//           self.determinateValue = 30;
//         }

//       }, 100);
//     }
//   ]);



