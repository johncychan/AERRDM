app.controller('indexCtrl', function(NgMap, $q, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog, localStorageService, $window, facilitySelected){
	var indexVm = this;
	indexVm.isExist = false;

	indexVm.listFacility = function(){
		indexVm.facility = facilitySelected.getFacility();
		console.log(indexVm.facility);
		indexVm.resource = angular.fromJson(localStorage["allocatedResource"]);
		console.log(indexVm.resource);
		if(indexVm.facility.length > 0){
			indexVm.isExist = true;
		}
	}

	indexVm.directToFacility = function(name){
		var resourceList = [];
		for(var i = 0; i < indexVm.facility.length; i++){
			if(name == indexVm.facility[i].Facility)
				window.localStorage['selectedFacility'] = angular.toJson(indexVm.facility[i]);
			if(name == indexVm.resource[i].Facility){
				var resource = indexVm.resource[i];
				resourceList.push(resource);
			}
		}
		console.log(resourceList);
		window.localStorage['resources'] = JSON.stringify(resourceList);
		window.open("/facilityWindow.html",'_blank');
	}
});

app.filter('unique', function(){
	return function(collection, keyname){
		var output = [];
		var keys = [];

		angular.forEach(collection, function(item){
			var key = item[keyname];
			if(keys.indexOf(key) === -1){
				keys.push(key);
				output.push(item);
			}
		});
		return output;
	};
});