app.controller('indexCtrl', function(NgMap, $q, $compile, $route, $scope, $rootScope, $mdDialog, $http, $timeout, $interval, ngDialog, localStorageService, $window, facilitySelected){
	var indexVm = this;
	indexVm.isExist = false;
	indexVm.hideFacility = true;

	/**
		call from child controller function
	*/
	$rootScope.$on("CallParentMethod", function(){
       indexVm.listFacility();
    });

	indexVm.listFacility = function(){
		$timeout(function(){
			indexVm.hideFacility = false;
		}, 40000);
		/**
			factory function
			vaule set in event controller
		*/
		indexVm.facility = facilitySelected.getFacility();

		for(var i = 0; i < indexVm.facility.length; i++){
			if(indexVm.facility[i].Type == "fire_station")
				indexVm.facility[i].Type = "Fire Station";
			else if(indexVm.facility[i].Type == "hospital")
				indexVm.facility[i].Type = "Hospital";
			else if(indexVm.facility[i].Type == "police")
				indexVm.facility[i].Type = "Police Station";
		}

		indexVm.resource = angular.fromJson(localStorage["allocatedResource"]);



		if(indexVm.facility.length > 0){
			indexVm.isExist = true;
		}
	}

	/**
		redirect to cooresponding facility from header drop down menu
	*/
	indexVm.directToFacility = function(name){
		var resourceList = [];
		/** search for clicked facility */
		for(var i = 0; i < indexVm.facility.length; i++){
			/** get clicked facility */
			if(name == indexVm.facility[i].Facility)
				window.localStorage['selectedFacility'] = angular.toJson(indexVm.facility[i]);
			/** get clicked facility's resource */
			if(name == indexVm.resource[i].Facility){
				var resource = indexVm.resource[i];
				/** store in array */
				resourceList.push(resource);
			}
		}

		// window.localStorage['currentPos']


		console.log(resourceList);
		/** store clicked facility into session */
		window.localStorage['resources'] = JSON.stringify(resourceList);
		/** open facility window in new window */
		window.open("/facilityWindow.html",'_blank', "width=750,height=750");
	}

	/**
		angularJS route redirect
		Because of google map api, it needs to refresh page in ordre to reinitialize service in angularJS
	*/
	indexVm.routeRedirect = function(url){
		// reload route
		$route.reload();
		// reload page
		$window.location.reload();
		// location
		window.location = "/#/"+url;	
	}
});

/**
	get distinct vaule from ng-repeat
*/
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
