// Declares the initial angular module "meanMapApp". Module grabs other controllers and services.

var app = angular.module('meanMapApp', ['ngMap', 'ngMaterial']);


app.controller('mainContrl', function(NgMap, $compile, $scope, $mdDialog){

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
		var htmlElement = "<div><h1><button ng-click=\"vm.open()\" >" + "Start simulation" + "</button></h1></div>"
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
		google.maps.event.clearListeners(vm.map, 'click');
	}

	$scope.setDataField = function(){
		//close dialog
		$mdDialog.cancel();

		// console.log($scope.factor);

		//change center view
		vm.map.setZoom(18);
		vm.map.setCenter(vm.marker.position);

		// $scope.open = function(){
			
		// }
		//pop a form ask user set the input field

	}

	// now start the simulation
	vm.startSingleEvent = function(){

		vm.map.setZoom(16);
		vm.map.setCenter(vm.marker.position);
	} 


	//open factor dialog
	vm.open = function(){
		// generate function () ......

		$scope.factor = {
			'ID': '#001',
			'Severity Level': 6,
			'Category': "Medical Help",
			'Resource avg. expenditure': 1000,
			'Resource avg. velocity': "5 mins",
			'Deadline': "4 mins"
		}
		$mdDialog.show(
			{
				templateUrl: "factorDialog.html",
				clickOutsideToClose: true,
		        scope: $scope,
		        preserveScope: true,
		        controller: function($scope) {
			},
		});
	};

	// reset factor
	$scope.reset = function () {
		// generate function ().....

		// $scope.factor = {
		// 		.....
		// }
	}

	// close dialog
	$scope.close = function () {
    	$mdDialog.cancel();
  	}

});

// angular.module('meanMapApp').controller('modalController', ['$scope', function($scope) {
    
// }]);


app.controller('AppCtrl', function ($scope, $timeout, $mdSidenav) {
    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      };
    }
  });

