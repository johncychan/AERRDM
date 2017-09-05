app.controller('singleEventCtrl', function(NgMap, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog){

	//map initialization
	var singleVm = this;
	var directionDisplay;
	var directionsService;
	var stepDisplay;


	var position;
	var marker = [];
	var polyline = [];
	var poly2 = [];
	var poly = null;
	var timerHandle = [];
	var startLoc = new Array();
	var facilitiesMarker = new Array();
	var endLoc;
	var startLocation = new Array();
	var endLocation = new Array();

	var speed = 0.000005, wait = 1;
	var infowindow = null;
	
	var myPano;
	var panoClient;
	var nextPanoId;

	NgMap.getMap("map").then(function(map){
		singleVm.map = map;
		singleVm.map.setZoom(10);
	});


	//put a marker by clicking mouse
	singleVm.placeMarker = function(e){
		if(singleVm.marker){
			singleVm.marker.setMap(null);
		}else{
			singleVm.marker = new google.maps.Marker({
				position: e.latLng,
				map: singleVm.map,
				draggable: true,
				
			});
		}
		//display the marker info
		singleVm.htmlElement = "	<div><div><p id=\"event-setting-header\">Single Event Setting</p></div> " + 
		"<div><button class=\"button continue-btn ripple\" ng-click=\"singleVm.setDataField()\">" + "Set event data" + "</button></div></div>"
		// var htmlElement = "<showTag></showTag>"
		//need to compile 

		singleVm.compiled = $compile(singleVm.htmlElement)($scope)
		singleVm.marker.infoWin = new google.maps.InfoWindow({
			// content: "<showTag></showTag>"
			content: singleVm.compiled[0]
		});
		//show the infomation window
		singleVm.marker.addListener('click', function($scope){
			singleVm.marker.infoWin.open(singleVm.map, singleVm.marker);
		});
		//clear onclick event in marker
		google.maps.event.clearListeners(singleVm.map, 'click');

		//set info windows
		singleVm.lastOpenedInfoWindow = singleVm.marker.infoWin;

	}

	singleVm.closeInfoWin = function(){
		if (singleVm.lastOpenedInfoWindow) {
        	singleVm.lastOpenedInfoWindow.close();
    	}
	}
	
	singleVm.callFunction = function(name){
		if(angular.isFunction(singleVm[name]))
			singleVm[name]()
	}

	singleVm.infoWinRedirect = function(toFunction){
		// remove last compile element object
		singleVm.compiled.remove();
		// get function name 
		singleVm.to_function = toFunction;
		singleVm.htmlElement = "	<div><div><p id=\"event-setting-header\">Event information</p></div> " + 
		"<div><button class=\"button continue-btn ripple\" ng-click=\"singleVm.callFunction(singleVm.to_function)\">" + "View progress" + "</button></div></div>"
		// var htmlElement = "<showTag></showTag>"
		//need to compile 
		singleVm.compiled = $compile(singleVm.htmlElement)($scope)
		singleVm.marker.infoWin = new google.maps.InfoWindow({
			// content: "<showTag></showTag>"
			content: singleVm.compiled[0]
		});
	}

	singleVm.category_list = ["Medical Help", "Urban Fire", "Chemical Leakage"];

	singleVm.levelGenerator = function(){
		return Math.floor((Math.random()*5)+1);
	}
	singleVm.categoryGenerator = function(){
		var size = singleVm.category_list.length;
		return Math.floor((Math.random()*size));
	}
	singleVm.expenditureGenerator = function(){
		var max = 70; 
		var min = 30
		return Math.floor((Math.random()*(max-min+1))+min);
	}
	singleVm.velocityGenerator = function(){
		var max = 65;
		var min = 30;
		return Math.floor((Math.random()*(max-min+1))+min);
	}
	singleVm.deadlineGenerator = function(){
		var max = 15;
		var min = 5;
		return Math.floor((Math.random()*(max-min+1))+min);
	}

	singleVm.factorGenerate = function(){
  		singleVm.level = singleVm.levelGenerator();
		singleVm.category = singleVm.categoryGenerator();
		singleVm.expenditure = singleVm.expenditureGenerator();
		singleVm.velocity = singleVm.velocityGenerator();
		singleVm.deadline = singleVm.deadlineGenerator();

		//Auto increment
		singleVm.eId = 001;

		singleVm.factor = {
			'ID': singleVm.eId,
			'Severity Level': singleVm.level,
			'Category': singleVm.category_list[singleVm.category],
			'Resource avg. expenditure': singleVm.expenditure,
			'Resource avg. velocity': singleVm.velocity,
			'Deadline': singleVm.deadline
		}
  	}

  	// singleVm.progrssMenuOpen = function () {
	  //   ngDialog.open({ 
	  //     template: 'eventProgress.html',
	  //     overlay: false,
	  //     showClose: false,
	  //     scope: $scope,
	  //     className: 'ngdialog-theme-default progress-menu draggable'       
	  //   });
   //  };

	// now start the simulation
	singleVm.startSingleEvent = function(){
		// close factor menu
		$mdDialog.hide();
		// close info window
		singleVm.closeInfoWin();
		// open progress menu
		singleVm.progrssMenuOpen();
		// redirect info window to progress menu
		singleVm.infoWinRedirect("progrssMenuOpen");

		// console.log($scope.factor);
		// singleVm.map.setZoom(16);
		singleVm.map.setCenter(singleVm.marker.position);

		// post data to back-end
		var eventData = {
			location: singleVm.marker.position,
			eventId: singleVm.eId,
			SeverityLevel: singleVm.level
		}
		$http({
		   method  : 'POST',
		   url     : '/singleEvent',
		//     // set the headers so angular passing info as form data (not request payload)
		   headers : { 'Content-Type': 'application/json' },
		   data    :  {
		               ID: singleVm.factor["ID"],
		               Severity: singleVm.factor["Severity Level"],
		               Category: singleVm.factor["Category"],
		               Expenditure: singleVm.factor["Resource avg. expenditure"],
		               Velocity: singleVm.factor["Resource avg. velocity"],
		               Deadline: singleVm.factor["Deadline"],
		               Location: singleVm.marker.position.toUrlValue()
		             }

		  }).then(function success(response) {
			// console.log(response.data);
		  });


		//receive facilities location from server and put markers on map
		//using fake data right now
		//wait back end implementation
		// singleVm.facilities = [];
		// singleVm.destinations  = [];
		// var facility1 = {lat: -34.4105585, lng: 150.8783824};
		// var facility2 = {lat: -34.4853985, lng: 150.872664};
		// singleVm.facilities.push(facility1);
		// singleVm.facilities.push(facility2);
		startLoc[0] = 'Sydney';
		startLoc[1] = 'Hyams Beach';
		endLoc = 'University of Wollongong';
		

		// for(var i = 0; i < endLoc.length; ++i){
		// 	facilitiesMarker[i] = new google.maps.Marker({
		// 		position: startLoc[i],
		// 		map: singleVm.map,
		// 		animation: google.maps.Animation.DROP
		// 	});
		// }
		
		//set the routes between startloc and endloc
//********************************
		receiveEventTask();
		searchCircle();
		setRoutes();
	} 

	singleVm.setDataField = function(){
		// generate factor
		singleVm.factorGenerate();

		$mdDialog.show(
			{
				templateUrl: "factorDialog.html",
				clickOutsideToClose: true,
		        scope: $scope,
		        preserveScope: true,
		        controller: function($scope) {
			}
		});
	};

	// reset factor
	singleVm.reset = function () {
		singleVm.factorGenerate();
	}

	// close dialog
	singleVm.close = function () {
    	$mdDialog.cancel();
  	}


  	singleVm.progrssMenuOpen = function () {

	    var dialog = ngDialog.open({ 
        	template: 'eventProgress.html',
        	overlay: false,
        	showClose: false,
        	scope: $scope,
        	className: 'ngdialog-theme-default progress-menu draggable'     	
        });


  		singleVm.stage = "Analysing Event";
  		$timeout(function() {
  			singleVm.eventShow = true;
  		}, 1500);
       
        $timeout(function() {
  			singleVm.stage = "Establishing Plan";
  		}, 3500);
		$timeout(function() {
  			singleVm.taskShow = true;
  		}, 5500);
        $timeout(function() {
  			singleVm.stage = "Searching for Facilities";
  		}, 7500);


  		$timeout(function() {
  			singleVm.containerExtend = 'progress-extend';
  			singleVm.contentExtend = 'progress-content-extend';
  		}, 7600);

  		$timeout(function() {
  			singleVm.radarShow = true;
  		}, 8100);
    };


  	function createMarker(latlng, label, html) {
	    var marker = new google.maps.Marker({
	        position: latlng,
	        map: singleVm.map,
	        title: label,
	        zIndex: Math.round(latlng.lat()*-100000)<<5
	        });
	        marker.myname = label;

	    return marker;
	}  

	function searchCircle(){
		var _radius = 10000;
		var rMin = _radius * 4/5;
		var rMax = _radius;
		var direction = 1;

		var circleOption = {
			center: singleVm.marker.position,
			fillColor: '#3878c7',
			fillOpacity: 0.6,
			map: singleVm.map,
			radius: 10000,
			strokeColor: '#3878c7',
	        strokeOpacity: 1,
	        strokeWeight: 0.5
		}
		var circle = new google.maps.Circle(circleOption);

		var circleTimer = $interval(function(){
			var radius = circle.getRadius();
			if((radius > rMax) || (radius) < rMin){
				direction *= -1;
			}
			var _par = (radius/_radius) - 0.7;

			circleOption.radius = radius + direction * 10;
			circleOption.fillOpacity = 0.6 * _par;

			circle.setOptions(circleOption);
		}, 20);
	}

  	function setRoutes(){

  		var directionDisplay = new Array();

  		var rendererOptions = {
  			map: singleVm.map,
  			suppressMarkers : true,
  			preserveViewport: true
  		}

  		directionsService = new google.maps.DirectionsService();

  		var travelMode = google.maps.DirectionsTravelMode.DRIVING;
  		var requests = new Array();
  		// for(var i = 0; i < startLoc.length; ++i){
  		// 	requests[i] = {
  		// 		origin: startLoc[i],
  		// 		destination: endLoc,
  		// 		travelMode: travelMode
  		// 	};
  		// 	directionsService.route(requests[i], makeRouteCallback(i, directionDisplay[i]));
  		// }
  		var request = {
  			origin: startLoc[0],
  			destination: singleVm.marker.position,
  			travelMode: travelMode

  		}
  		directionsService.route(request, makeRouteCallback(0, directionDisplay[0]));
  		
  		function makeRouteCallback(routeNum, dip){
	  		if(polyline[routeNum] && (polyline[routeNum].getMap() != null)){
	  			startAnimation(routeNum);
	  			return;
	  		}
	  		return function(response, status){
	  			if(status == google.maps.DirectionsStatus.OK){

	  				var bounds = new google.maps.LatLngBounds();
	  				var route = response.routes[0];
	  				startLocation[routeNum] = new Object();
	  				endLocation[routeNum] = new Object();

	  				polyline[routeNum] = new google.maps.Polyline({
	  				path: [],
	            	strokeColor: '#FFFF00',
	            	strokeWeight: 3 
	            	});
	  				poly2[routeNum] = new google.maps.Polyline({
		            path: [],
		            strokeColor: '#FFFF00',
		            strokeWeight: 3
		            });    


	  				var path = response.routes[0].overview_path;
		            var legs = response.routes[0].legs;


		            disp = new google.maps.DirectionsRenderer(rendererOptions);     
		            disp.setMap(singleVm.map);
		            disp.setDirections(response);

		            //create resources markers
		            for (i = 0; i < legs.length; i++) {

		              if (i == 0) { 
		                startLocation[routeNum].latlng = legs[i].start_location;
		                startLocation[routeNum].address = legs[i].start_address;
		                // marker = google.maps.Marker({map:map,position: startLocation.latlng});
		                marker[routeNum] = createMarker(legs[i].start_location,"start",legs[i].start_address,"green");
		              }
		              endLocation[routeNum].latlng = legs[i].end_location;
		              endLocation[routeNum].address = legs[i].end_address;
		              var steps = legs[i].steps;

		              for (j = 0; j < steps.length; j++) {
		                var nextSegment = steps[j].path;                
		                var nextSegment = steps[j].path;

		                for (k = 0;k < nextSegment.length; k++) {

		                    polyline[routeNum].getPath().push(nextSegment[k]);
		                    //bounds.extend(nextSegment[k]);
		                }

		              }
	            	}
	            	
	  			}
	  			polyline[routeNum].setMap(singleVm.map);		         
			    //map.fitBounds(bounds);
		        startAnimation(routeNum); 

	  			
	  		}
  		}	
  	}

  	var eol = [];
  	var lastVertex = 1;
  	var stepnum=0;
    singleVm.step = 3; // 5; // metres
    var tick = 100; // milliseconds

  	function updatePoly(i,d) {
	 // Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
	    if (poly2[i].getPath().getLength() > 20) {
	          poly2[i] = new google.maps.Polyline([polyline[i].getPath().getAt(lastVertex-1)]);
	          // map.addOverlay(poly2)
	        }

	    if (polyline[i].GetIndexAtDistance(d) < lastVertex + 2) {
	        if (poly2[i].getPath().getLength() > 1) {
	            poly2[i].getPath().removeAt(poly2[i].getPath().getLength() - 1)
	        }
	            poly2[i].getPath().insertAt(poly2[i].getPath().getLength(),polyline[i].GetPointAtDistance(d));
	    } else {
	        poly2[i].getPath().insertAt(poly2[i].getPath().getLength(),endLocation[i].latlng);
	    }
	 }

  	function animate(index,d) {
  		// console.log(index + " " + d);
	   	if (d > eol[index]) {
	      	marker[index].setPosition(endLocation[index].latlng);
	      	return;
	   	}
	    var p = polyline[index].GetPointAtDistance(d);
	    marker[index].setPosition(p);
	    updatePoly(index,d);
	    timerHandle[index] =  $timeout(function() {
	    	animate(index, (d + singleVm.step*20));
	    }, tick);

	}

  	function startAnimation(index){

  		eol[index] = polyline[index].Distance();

  		poly2[index] = new google.maps.Polyline({path: [polyline[index].getPath().getAt(0)],
  						strokeColor:"#FFFF00", strokeWeight:3});
  		$timeout(function() {
  			animate(index, 50);
  		}, 50);
  	}


  	function receiveEventTask(){
  	singleVm.services = [];
  	//for loop to receive type of resources needed
   	 //push()
        singleVm.services =
        [{
          resource: 'Police car',
          number: 2
        },{
          resource: 'Ambulance',
          number: 3
        }];
        singleVm.totalResource = 0;
        for(var i = 0; i < singleVm.services.length; i++){
	        singleVm.totalResource += singleVm.services[i].number;
		}

    }

});

app.controller('AppCtrl', function ($scope, $mdSidenav) {
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
		template: "<div><h1><button ng-click=singleVm.setDataField()>" + "Start simulation" + "</button></h1></div>"
		// template: "<p><p>"
	};
});

