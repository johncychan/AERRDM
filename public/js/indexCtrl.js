app.controller('indexCtrl', function(NgMap, $q, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog, localStorageService, $window, facilitySelected){
	var indexVm = this;
	indexVm.isExist = false;

	indexVm.listFacility = function(){
		indexVm.facility = facilitySelected.getFacility();
		if(indexVm.facility.length > 0){
			indexVm.isExist = true;
		}
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