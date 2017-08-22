var app = angular.module('meanMapApp', ['ngRoute', 'ngMap', 'ngMaterial', 'ngDialog']);


app.controller('mainContrl', function(NgMap, $compile, $scope, $mdDialog, $http, $timeout){

	//map initialization
	var vm = this;
	var directionDisplay;
	var directionsService;
	var stepDisplay;

	var position;
	var marker = [];
	var polyline = [];
	var poly2 = [];
	var poly = null;
	var timerHandle = [];
	var timerHandle = [];

	var speed = 0.000005, wait = 1;
	var infowindow = null;
	
	var myPano;
	var panoClient;
	var nextPanoId;

	NgMap.getMap("map").then(function(map){
		vm.map = map;
	});

	//put a marker by clicking mouse
	vm.placeMarker = function(e){
		if(vm.marker){
			vm.marker.setMap(null);
		}else{
			vm.marker = new google.maps.Marker({
				position: e.latLng,
				map: vm.map,
				draggable: true
			});
		}
		//display the marker info
		var htmlElement = "	<div><div><p id=\"event-setting-header\">Single Event Setting</p></div><div><button class=\"button continue-btn ripple\" ng-click=\"vm.setDataField()\">" + "Set event data" + "</button></div></div>"
		// var htmlElement = "<showTag></showTag>"
		//need to compile 
		var compiled = $compile(htmlElement)($scope)
		vm.marker.infoWin = new google.maps.InfoWindow({
			// content: "<showTag></showTag>"
			content: compiled[0]
		});
		//show the infomation window
		vm.marker.addListener('click', function($scope){
			vm.marker.infoWin.open(vm.map, vm.marker);
		});
		google.maps.event.clearListeners(vm.map, 'click');
	}

	vm.setDataField = function(){
		//change center view
		vm.map.setZoom(18);
		vm.map.setCenter(vm.marker.position);
		// $scope.open = function(){
			
		// }
		//pop a form ask user set the input field

	}

	vm.category_list = ["Medical Help", "Urban Fire", "Chemical Leakage"];

	vm.levelGenerator = function(){
		return Math.floor((Math.random()*5)+1);
	}
	vm.categoryGenerator = function(){
		var size = vm.category_list.length;
		return Math.floor((Math.random()*size));
	}
	vm.expenditureGenerator = function(){
		var max = 70; 
		var min = 30
		return Math.floor((Math.random()*(max-min+1))+min);
	}
	vm.velocityGenerator = function(){
		var max = 65;
		var min = 30;
		return Math.floor((Math.random()*(max-min+1))+min);
	}
	vm.deadlineGenerator = function(){
		var max = 15;
		var min = 5;
		return Math.floor((Math.random()*(max-min+1))+min);
	}

	vm.factorGenerate = function(){
  		vm.level = vm.levelGenerator();
		vm.category = vm.categoryGenerator();
		vm.expenditure = vm.expenditureGenerator();
		vm.velocity = vm.velocityGenerator();
		vm.deadline = vm.deadlineGenerator();

		//Auto increment
		vm.eId = 001;

		vm.factor = {
			'ID': vm.eId,
			'Severity Level': vm.level,
			'Category': vm.category_list[vm.category],
			'Resource avg. expenditure': vm.expenditure,
			'Resource avg. velocity': vm.velocity,
			'Deadline': vm.deadline
		}
  	}

	// now start the simulation
	vm.startSingleEvent = function(){
		// close factor menu
		$mdDialog.hide();

		// console.log($scope.factor);
		vm.map.setZoom(16);
		vm.map.setCenter(vm.marker.position);
		//post Json 
		// $http({
		//   method  : 'POST',
		//   url     : '/root',
		//     // set the headers so angular passing info as form data (not request payload)
		//   headers : { 'Content-Type': 'application/json' },
		//   data    :  {
		//               type:'root',
		//               username:$scope.rEmail,
		//               password:$scope.rPassword
		//             }

		//  })
		//receive facilities location from server and put markers on map
		vm.facilities = [];
		vm.destinations  = [];
		var facility1 = {lat: -34.4105585, lng: 150.8783824};
		var facility2 = {lat: -34.4853985, lng: 150.872664};
		vm.facilities.push(facility1);
		vm.facilities.push(facility2);
		
		for(var i = 0; i < vm.facilities.length; ++i){
			vm.destinations[i] = new google.maps.Marker({
				position: vm.facilities[i],
				map: vm.map,
				animation: google.maps.Animation.DROP
			});
		}
		
		//set the routes between startloc and endloc
		setRoutes();
	} 

	vm.setDataField = function(){
		// generate factor
		vm.factorGenerate();

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
	vm.reset = function () {
		vm.factorGenerate();
	}

	// close dialog
	vm.close = function () {
    	$mdDialog.cancel();
  	}

 //  	function createMarker(latlng, label, html) {
	// // alert("createMarker("+latlng+","+label+","+html+","+color+")");
	//     var contentString = '<b>'+label+'</b><br>'+html;
	//     var marker = new google.maps.Marker({
	//         position: latlng,
	//         map: map,
	//         title: label,
	//         zIndex: Math.round(latlng.lat()*-100000)<<5
	//         });
	//         marker.myname = label;


	//     google.maps.event.addListener(marker, 'click', function() {
	//         infowindow.setContent(contentString); 
	//         infowindow.open(map,marker);
	//         });
	//     return marker;
	// }  


  	function setRoutes(){
  		var directionDisplay = new Array();
  		var rendererOptions = {
  			map: vm.map,
  			suppressMarkers : true,
  			preserveViewport: true
  		}
  		directionsService = new google.maps.DirectionsService();

  		var travelMode = google.maps.DirectionsTravelMode.DRIVING;
  		vm.requests = [];
  		for(var i = 0; i < vm.destinations.length; ++i){
  			vm.request = {
  				origin: vm.marker.position,
  				destination: vm.destinations[i].position,
  				travelMode: travelMode
  			};
  			directionsService.route(vm.request, makeRouteCallback(i, directionDisplay[i]));
  		}
  		
  		function makeRouteCallback(routeNum, dip){
	  		if(polyline[routeNum] && (polyline[routeNum].getMap() != null)){
	  			startAnimation(routeNum);
	  			return;
	  		}
	  		return function(response, status){
	  			if(status == google.maps.DirectionsStatus.OK){
	  				var bounds = new google.maps.LatLngBounds();
	  				var route = response.routes[0];
	  				vm.marker.position = new Object();
	  				vm.destinations[routeNum] = new Object();

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

		            //fir each route, display summary information
	  				var path = response.routes[0].overview_path;
		            var legs = response.routes[0].legs;


		            disp = new google.maps.DirectionsRenderer(rendererOptions);     
		            disp.setMap(vm.map);
		            disp.setDirections(response);

		            for (i=0;i<legs.length;i++) {
		              if (i == 0) { 
		                vm.marker.location = legs[i].start_location;
		                // vm.marker.location.address = legs[i].start_address;
		                // marker = google.maps.Marker({map:map,position: startLocation.latlng});
		                // marker[routeNum] = createMarker(legs[i].start_location,"start",legs[i].start_address,"green");
		              }
		              vm.destinations[routeNum].latlng = legs[i].end_location;
		              vm.destinations[routeNum].address = legs[i].end_address;
		              var steps = legs[i].steps;

		              for (j=0;j<steps.length;j++) {
		                var nextSegment = steps[j].path;                
		                var nextSegment = steps[j].path;

		                for (k=0;k<nextSegment.length;k++) {
		                    polyline[routeNum].getPath().push(nextSegment[k]);
		                    //bounds.extend(nextSegment[k]);
		                }

		              }
	            	}

	            	polyline[routeNum].setMap(vm.map);
			         
			        //map.fitBounds(bounds);
			        startAnimation(routeNum);  

	  			}
	  		}
  		}
  	}

  	var eol = [];


  	function updatePoly(i,d) {
	 // Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
	    if (poly2[i].getPath().getLength() > 20) {
	          poly2[i]=new google.maps.Polyline([polyline[i].getPath().getAt(lastVertex-1)]);
	          // map.addOverlay(poly2)
	        }

	    if (polyline[i].GetIndexAtDistance(d) < lastVertex+2) {
	        if (poly2[i].getPath().getLength()>1) {
	            poly2[i].getPath().removeAt(poly2[i].getPath().getLength()-1)
	        }
	            poly2[i].getPath().insertAt(poly2[i].getPath().getLength(),polyline[i].GetPointAtDistance(d));
	    } else {
	        poly2[i].getPath().insertAt(poly2[i].getPath().getLength(),endLocation[i].latlng);
	    }
	 }
  	function animate(index,d) {
	   if (d>eol[index]) {

	      marker[index].setPosition(endLocation[index].latlng);
	      return;
	   }
	    var p = polyline[index].GetPointAtDistance(d);

	    //map.panTo(p);
	    marker[index].setPosition(p);
	    updatePoly(index,d);
	    // timerHandle[index] = setTimeout("animate("+index+","+(d+step)+")", tick);
	    $timeout(animate(index, (d + step)), tick);
	}

  	function startAnimation(index){
  		if(timerHandle[index])
  			clearTimeout(timerHandle[index]); 

  		console.log(polyline[index]);
  		eol[index] = polyline[index].Distance();
  		vm.map.setCenter(polyline[index].getPath().getAt(0));

  		poly2[index] = new google.maps.Polyline({path: [polyline[index].getPath().getAt(0)],
  						strokeColor:"#FFFF00", strokeWeight:3});
		// timerHandle[index] = setTimeout("animate("+index+",50)", 2000);
		$timeout(animate(index, 50), 2000);
  	}

});

app.controller('AppCtrl', function ($scope, $timeout, $mdSidenav) {
    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
      return function() {
        $mdSidenav(componentId).toggle();
      };
    }
  });

app.controller('dialogCtrl', function ($scope, ngDialog) {
    $scope.clickToOpen = function () {
        ngDialog.open({ 
        	template: 'templateId', 
        	className: 'ngdialog-theme-default'
        });
    };
});

app.directive("showForm", function(){
	return {
		restrict: 'E',
		templateUrl: 'setDataForm.html'
	}
});

app.directive("showTag", function(){
	return{
		template: "<div><h1><button ng-click=vm.setDataField()>" + "Start simulation" + "</button></h1></div>"
		// template: "<p><p>"
	};
});

