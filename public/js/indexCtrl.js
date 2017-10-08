app.controller('indexCtrl', function(NgMap, $q, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog, localStorageService, $window, facilitySelected){
	var indexVm = this;

	indexVm.listFacility = function(){
		indexVm.facility = facilitySelected.getFacility();
		console.log(indexVm.facility);
	}
});