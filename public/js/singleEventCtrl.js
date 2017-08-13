var app = angular.module('meanMapApp', ['ngRoute', 'ngMap', 'ngMaterial']);


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
		var htmlElement = "	<div><div><p id=\"event-setting-header\">Single Event Setting</p></div><div><button class=\"button continue-btn ripple\" ng-click=\"vm.setDataField()\">" + "Set event data" + "</button></div></div>"
		// var htmlElement = "<showTag></showTag>"
		//need to compile 
		var compiled = $compile(htmlElement)($scope)
		vm.marker.infoWin = new google.maps.InfoWindow({
			// content: "<showTag></showTag>"
			content: compiled[0]
		});
		//show the infomation window
		vm.marker.addListener('click', function($scope){
			vm.marker.infoWin.open(vm.map, vm.marker);
		});
		google.maps.event.clearListeners(vm.map, 'click');
	}

	vm.setDataField = function(){
		//change center view
		vm.map.setZoom(18);
		vm.map.setCenter(vm.marker.position);
		// $scope.open = function(){
			
		// }
		//pop a form ask user set the input field

	}

	var category_list = ["Medical Help", "Urban Fire", "Chemical Leakage"];

	vm.levelGenerator = function(){
		return Math.floor((Math.random()*5)+1);
	}
	vm.categoryGenerator = function(){
		var size = category_list.length;
		return Math.floor((Math.random()*size));
	}
	vm.expenditureGenerator = function(){
		var max = 70; 
		var min = 30
		return Math.floor((Math.random()*(max-min+1))+min);
	}
	vm.velocityGenerator = function(){
		var max = 65;
		var min = 30;
		return Math.floor((Math.random()*(max-min+1))+min);
	}
	vm.deadlineGenerator = function(){
		var max = 15;
		var min = 5;
		return Math.floor((Math.random()*(max-min+1))+min);
	}

	vm.factorGenerate = function(){
  		var level = vm.levelGenerator();
		var category = vm.categoryGenerator();
		var expenditure = vm.expenditureGenerator();
		var velocity = vm.velocityGenerator();
		var deadline = vm.deadlineGenerator();

		$scope.factor = {
			'ID': 001,
			'Severity Level': level,
			'Category': category_list[category],
			'Resource avg. expenditure': expenditure,
			'Resource avg. velocity': velocity+" km/h",
			'Deadline': deadline+" mins"
		}
  	}

	// now start the simulation
	vm.startSingleEvent = function(){
		// close factor menu
		$mdDialog.cancel();

		console.log($scope.factor);
		vm.map.setZoom(16);
		vm.map.setCenter(vm.marker.position);
	} 

	vm.setDataField = function(){
		// generate factor
		vm.factorGenerate();

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
	vm.reset = function () {
		vm.factorGenerate();
	}

	// close dialog
	vm.close = function () {
    	$mdDialog.cancel();
  	}

  	

});

app.controller('AppCtrl', function ($scope, $timeout, $mdSidenav) {
    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      };
    }
  });

app.directive("showForm", function(){
	return {
		restrict: 'E',
		templateUrl: 'setDataForm.html'
	}
});

app.directive("showTag", function(){
	return{
		template: "<div><h1><button ng-click=vm.setDataField()>" + "Start simulation" + "</button></h1></div>"
		// template: "<p><p>"
	};
});

