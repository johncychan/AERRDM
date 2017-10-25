app.controller('facilityCtrl', function(NgMap, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog){
	var facilityVm = this;

	var accessData = window.localStorage['selectedFacility'];
    var resourceNum;
    var resourceMarkers = [];
	facilityVm.selectedFacility = angular.fromJson(accessData);
    var eventLocation = angular.fromJson(localStorage["eventLocation"]);
    // event information
    facilityVm.eventStatis = angular.fromJson(localStorage['eventStatis']);
    // simulatoin information
    facilityVm.simStatis = angular.fromJson(localStorage['simulationStatis']);
    // resources information
    facilityVm.resource = angular.fromJson(localStorage['resources']);

    resourceNum = facilityVm.resource.length;

    var loc = facilityVm.selectedFacility.Location;

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

        marker.setMap(facilityVm.map);
        facilityVm.map.setCenter(loc);

        for(var i = 0; i < resourceNum; ++i){
            console.log("create marker");
            resourceMarkers[i] = new google.maps.Marker({
                position: loc,
                map: facilityVm.map,
                icon: "./img/ambulance.svg"
            });
        }

        $interval(function updateGPS(){            
        // console.log(facilityVm.selectedFacility.id);
        $http({
            method  : 'POST',
            url     : '/singleEvent/UpdatedGPS',
            headers : { 'Content-Type': 'application/json' },
            data    : {
                        sim_id: facilityVm.simStatis.data.sim_id
                      }
        }).then(function success(response){
            

            // update mobile resource real time location
            for(var i = 0; i < resourceNum; ++i){
                resourceMarkers[i].setPosition(response.data[0].location);
            }
        })
    }, 2000);
    });

});
