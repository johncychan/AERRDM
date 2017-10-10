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