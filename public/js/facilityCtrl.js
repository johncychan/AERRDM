app.controller('facilityCtrl', function(NgMap, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog){
	var facilityVm = this;

	var accessData = window.localStorage['selectedFacility'];

	facilityVm.selectedFacility = angular.fromJson(accessData);

	console.log(facilityVm.selectedFacility);

	NgMap.getMap("map").then(function(map){
    facilityVm.map = map;
    facilityVm.map.setZoom(14);
    // show search box as defualt
    // facilityVm.searchExtend();

    });

    //
    // updateGPS = function(){
    // 	$http({
    // 		method	: 'POST',
	   //  	url		: '',
	   //  	headers	: { 'Content-Type': 'application/json' },
	   //  	data 	: {
	   //  				sim_id: facilityVm.selectedFacility.sim_id
	   //  	}
    // 	}).then(function success(response)){

    // 	}
   
});
