app.controller('facilityCtrl', function(NgMap, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog){
	var facilityVm = this;

	var accessData = window.localStorage['selectedFacility'];

	facilityVm.selectedFacility = angular.fromJson(accessData);
    var eventLocation = angular.fromJson(localStorage["eventLocation"]);
    facilityVm.eventStatis = angular.fromJson(localStorage['eventStatis']);
    facilityVm.simStatis = angular.fromJson(localStorage['simulationStatis']);
    facilityVm.resource = angular.fromJson(localStorage['resources']);

    var loc = facilityVm.selectedFacility.Location;
    console.log(loc);

	NgMap.getMap("map").then(function(map){
        facilityVm.map = map;
        facilityVm.map.setZoom(14);
        var marker = new google.maps.Marker({
            position: loc,
            map: facilityVm.map,
            icon: "./img/hospital.svg",
            animation: google.maps.Animation.DROP
        });

        var eventLoc = new google.maps.Marker({
            position: eventLocation,
            map: facilityVm.map,
            icon: "./img/placeholder.svg",
            animation: google.maps.Animation.DROP
        });
        // console.log(marker);
        marker.setMap(facilityVm.map);
        facilityVm.map.setCenter(loc);
        

        console.log(facilityVm.selectedFacility);

        $interval(function updateGPS(){
            
        // console.log(facilityVm.selectedFacility.id);
        $http({
            method  : 'POST',
            url     : '/singleEvent/UpdatedGPS',
            headers : { 'Content-Type': 'application/json' },
            data    : {
                        sim_id: facilityVm.selectedFacility.id
                      }
        }).then(function success(response){
            console.log(response.data);
        })
    }, 2000);
    });

});
