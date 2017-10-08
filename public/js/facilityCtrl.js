app.controller('facilityCtrl', function(NgMap, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog){
	var facilityVm = this;

	var accessData = window.localStorage['selectedFacility'];

	facilityVm.selectedFacility = angular.fromJson(accessData);

	console.log(facilityVm.selectedFacility);
});
