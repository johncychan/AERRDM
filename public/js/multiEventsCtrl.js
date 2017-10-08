app.controller('multiEventCtrl', function(NgMap, $q, $compile, $scope, $mdDialog, $http, $timeout, $interval, ngDialog, localStorageService, $window){

  //map initialization
  var multiVm = this;
  var directionDisplay;
  var directionsService;
  var stepDisplay;
  $scope.headerMes = "Multi Event";

  multiVm.eventStarted = false;

  multiVm.markerNotPlace = true;

  var position;
  var marker = [];
  var facilityMarker = [];
  var polyline = [];
  var poly2 = [];
  var poly = null;
  var timerHandle = [];
  var startLoc = new Array();
  var facilitiesMarker = new Array();
  var endLoc;
  var startLocation = new Array();
  var endLocation = new Array();
  multiVm.markerIndex = 0;
  multiVm.markersList = [];

  var speed = 0.000005, wait = 1;
  var infowindow = null;
  
  var myPano;
  var panoClient;
  var nextPanoId;

  var iconBase = "./img/";
  var icons = {
    ambulance:{
      url: iconBase + "ambulance.svg"
    },
    fireTruck:{
      icon: iconBase + "firetruck.svg"
    },
    policeCar:{
      icon: iconBase + "police-car.svg"
    },
    hospital:{
      icon: iconBase + "hospital.svg"
    },
    fireStation:{
      icon: iconBase + "fire-station.svg"
    },
    policeStation:{
      icon: iconBase + "polica-station.svg"
    }
  };

  NgMap.getMap("map").then(function(map){
    multiVm.map = map;
    multiVm.map.setZoom(14);
    // open hamburger menu as default
    multiVm.hamCheck = true;
    // show search box as defualt
    multiVm.searchExtend();
  });



  function clearMapClickEvent(){
    //clear onclick event in map
    google.maps.event.clearListeners(multiVm.map, 'click');
  }

  multiVm.mapKeyUp = function($event){
    var onKeyUpResult = $event.keyCode;
    if(onKeyUpResult == 27)
      defaultCursor();
  }

  function defaultCursor() {
    clearMapClickEvent();
    multiVm.map.setOptions({draggableCursor:''});
  };

  // random location
  multiVm.randomLocation = function(){

    // var place = [
    // "-33.86035933, 151.2050238",
    // "151.2050238, 151.19059978",
    // "-33.89035505, 151.2260241",
    // "-33.87666251, 151.19473463",
    // "-33.85315971, 151.18648391",
    // "-33.86033052, 151.21215368",
    // "-33.88528746, 151.19362093",
    // "-33.88556935, 151.18516061",
    // "-33.87114333, 151.20569572",
    // "-33.86434054, 151.20310438",
    // "-33.88490885, 151.23425777",
    // "-33.8906694, 151.21657942"
    // ];

    // var max = 5;
    // var min = 2;
    // var placeArrLen = place.length;
    // var eventNum = Math.floor((Math.random()*(max-min+1)) + min);
    // console.log(eventNum);
    // var index = Math.floor((Math.random()*(max-min+1))+min);
    // var eventArr = [];
    // while(eventArr.length < eventNum){
    // 	var randomnumber = Math.ceil(Math.random()*placeArrLen);
    // 	if(eventArr.indexOf(randomnumber) > -1) continue;
    // 	eventArr[eventArr.length] = randomnumber;
    // }
    // for(var i = 0; i < eventArr.length; ++i){
    // 	// var geocoder = new google.maps.Geocoder();
    // 	// console.log(eventArr);
    // 	var myLatLng = new google.maps.LatLng(parseFloat(place[eventArr[i].]))
    // 	multiVm.placeMarkerByRandomAndSearch(place[eventArr[i]]);
    	
    // }


    // var geocoder = new google.maps.Geocoder();
    // geocoder.geocode({'address': place[index]}, function(results, status){
    //   multiVm.map.setCenter(results[0].geometry.location);
    //   var latLng = new google.maps.LatLng(parseFloat(place[.geo.lat))
    //   multiVm.placeMarkerByRandomAndSearch(results[0].geometry.location)
    // });
  }

  // enable user to click on the map to place marker
  multiVm.putMarker = function(){
    if(!multiVm.eventStarted){
      // change cursor to marker
      multiVm.map.setOptions({draggableCursor:'url(img/marker.svg), auto'});
      // add click event on map
      google.maps.event.addListener(multiVm.map, 'click', function(event){
        multiVm.placeMarker(event);
      });
    }
  }

  // current location
  multiVm.currentLocation = function(){
    if(!multiVm.eventStarted){
      navigator.geolocation.getCurrentPosition(function(position){
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        multiVm.map.setCenter(new google.maps.LatLng(pos.lat, pos.lng));
        console.log("processing");
        multiVm.placeMarkerCurrent(pos);
      });
    }
  }

  // triggered when place changed
  multiVm.placeChanged = function(){
    if(!multiVm.eventStarted){
      multiVm.markerNotPlace = false;
      multiVm.place = this.getPlace();
      multiVm.map.setCenter(multiVm.place.geometry.location);
      multiVm.placeMarkerByRandomAndSearch(multiVm.place.geometry.location);
    }
  }

  //place a marker by clicking mouse
  multiVm.placeMarker = function(e){
    if(multiVm.marker){
      multiVm.markerIndex++;
    }
    console.log("put marker");
    console.log(multiVm.markerIndex);

    multiVm.marker = new google.maps.Marker({
      position: e.latLng,
      map: multiVm.map,
      icon: "./img/marker.svg",
      draggable: true,
      animation: google.maps.Animation.DROP
    });

    multiVm.markersList.push(multiVm.marker);
    if(multiVm.markersList.length > 0){
      multiVm.markerNotPlace = false;
    }
    
    console.log(multiVm.markersList);

    //generate factor
    multiVm.factorGenerate(multiVm.markerIndex);
    //add element to marker
    multiVm.markerElement();

    // var htmlElement = "  <div><div><p id=\"infoWin-header\">Event Setting</p></div> " + 
    // "<div><button class=\"button continue-btn ripple\" ng-click=\"multiVm.setDataField(multiVm.markerIndex)\">" + "Set event data" + "</button></div></div>"
    // compiled = $compile(htmlElement)($scope);
    // multiVm.marker.infoWin = new google.maps.InfoWindow({
    // 	content: compiled[0]
    // })
    // // multiVm.marker.addListener('click', function($scope){
    // //   multiVm.marker.infoWin.open(multiVm.map, multiVm.marker);
    // // });
    // multiVm.marker.addListener('click', function() {  
    //     multiVm.marker.infoWin.open(multiVm.map, this);
    // });
    // multiVm.lastOpenedInfoWindow = multiVm.marker.infoWin;
  }

  multiVm.placeMarkerCurrent = function(pos){
    if(multiVm.marker){
      multiVm.markerIndex++;
    }

    multiVm.marker = new google.maps.Marker({
      position: {lat: pos.lat, lng: pos.lng},
      map: multiVm.map,
      icon: "./img/marker.svg",
      draggable: true,
      animation: google.maps.Animation.DROP
    });
    multiVm.factorGenerate(multiVm.markerIndex);
    multiVm.map.setZoom(14);
    multiVm.markerElement();
  }

  //place a marker by random and search
  multiVm.placeMarkerByRandomAndSearch = function(loc){
    if(multiVm.marker){
      multiVm.marker.setMap(null);
    }
    multiVm.marker = new google.maps.Marker({
      position: loc,
      map: multiVm.map,
      icon: "./img/marker.svg",
      draggable: true,
      animation: google.maps.Animation.DROP
    });

    multiVm.markerElement();

  }

  // add element to marker
  multiVm.markerElement = function(){
    //display the marker info
    // multiVm.htmlElement = "  <div><div><p id=\"infoWin-header\">Single Event Setting</p></div> " + 
    // "<div><button class=\"button continue-btn ripple\" ng-click=\"multiVm.setDataField()\">" + "Set event data" + "</button></div></div>"
    // // var htmlElement = "<showTag></showTag>"
    // //need to compile 

    // multiVm.compiled = $compile(multiVm.htmlElement)($scope)
    // multiVm.marker.infoWin = new google.maps.InfoWindow({
    //   // content: "<showTag></showTag>"
    //   content: multiVm.compiled[0]

    // });
    // //show the infomation window
    // multiVm.marker.addListener('click', function($scope){
    //   multiVm.marker.infoWin.open(multiVm.map, multiVm.marker);
    // });
    var eventNumber = multiVm.markerIndex;

    var htmlElement = "  <div><div><p id=\"infoWin-header\">Event Setting ["+eventNumber+"]</p></div> " + 
    "<div><button class=\"button continue-btn ripple\" ng-click=\"multiVm.setDataField(multiVm.markerIndex)\">" + "Set event data" + "</button></div></div>"
    compiled = $compile(htmlElement)($scope);
    multiVm.marker.infoWin = new google.maps.InfoWindow({
      content: compiled[0]
    })
    // multiVm.marker.addListener('click', function($scope){
    //   multiVm.marker.infoWin.open(multiVm.map, multiVm.marker);
    // });
    multiVm.marker.addListener('click', function() {  
        multiVm.marker.infoWin.open(multiVm.map, this);
    });

    //set info windows
    multiVm.lastOpenedInfoWindow = multiVm.marker.infoWin;

  }

  multiVm.closeInfoWin = function(){
    if (multiVm.lastOpenedInfoWindow) {
          multiVm.lastOpenedInfoWindow.close();
      }
  }
  
  multiVm.callFunction = function(name){
    if(angular.isFunction(multiVm[name]))
      multiVm[name]()
  }


  multiVm.infoWinRedirect = function(toFunction){
    // remove last compile element object
    multiVm.compiled.remove();
    // get function name 
    multiVm.to_function = toFunction;
    multiVm.htmlElement = "  <div><div><p id=\"infoWin-header\">Event information</p></div> " + 
    "<div><button class=\"button continue-btn ripple\" ng-click=\"multiVm.callFunction(multiVm.to_function)\">" + "View progress" + "</button></div></div>"
    // var htmlElement = "<showTag></showTag>"
    //need to compile 
    multiVm.compiled = $compile(multiVm.htmlElement)($scope)
    multiVm.marker.infoWin = new google.maps.InfoWindow({
      // content: "<showTag></showTag>"
      content: multiVm.compiled[0]
    });
  }

  multiVm.category_list = ["Medical Help", "Urban Fire", "Chemical Leakage"];

  multiVm.levelGenerator = function(){
    return Math.floor((Math.random()*5)+1);
  }
  multiVm.categoryGenerator = function(){
    var size = multiVm.category_list.length;
    return Math.floor((Math.random()*size));
  }
  multiVm.expenditureGenerator = function(){
    var max = 200; 
    var min = 0;
    return Math.floor((Math.random()*(max-min+1))+min);
  }
  multiVm.velocityGenerator = function(){
    var max = 100;
    var min = 20;
    return Math.floor((Math.random()*(max-min+1))+min);
  }
  multiVm.deadlineGenerator = function(){
    var max = 15;
    var min = 5;
    return Math.floor((Math.random()*(max-min+1))+min);
  }

  multiVm.minExpenditureGenerator = function(){
    var max = 100; 
    var min = 0;
    return Math.floor((Math.random()*(max-min+1))+min);
  }
  multiVm.maxExpenditureGenerator = function(){
    var max = 200;
    var min = 101;
    return Math.floor((Math.random()*(max-min+1))+min);
  }

  multiVm.minVelocityGenerator = function(){
    var max = 60; 
    var min = 20;
    return Math.floor((Math.random()*(max-min+1))+min);
  }
  multiVm.maxVelocityGenerator = function(){
    var max = 100;
    var min = 61;
    return Math.floor((Math.random()*(max-min+1))+min);
  }

  multiVm.eventList = [];
  multiVm.factorGenerate = function(index){
    multiVm.level = multiVm.levelGenerator();
    multiVm.category = multiVm.categoryGenerator();
    multiVm.expenditure = multiVm.expenditureGenerator();
    multiVm.minExpenditure = multiVm.minExpenditureGenerator();
    multiVm.maxExpenditure = multiVm.maxExpenditureGenerator();
    multiVm.velocity = multiVm.velocityGenerator();
    multiVm.minvelocity = multiVm.minVelocityGenerator();
    multiVm.maxvelocity = multiVm.maxVelocityGenerator();
    multiVm.deadline = multiVm.deadlineGenerator();

    //Auto increment

    multiVm.eId = 001;

    var eventId = index+1;

    multiVm.factor = {
      'ID': eventId,
      'Severity Level': multiVm.level,
      'Category': multiVm.category_list[multiVm.category],
      'Resource avg. expenditure': multiVm.expenditure,
      'Min expenditure': multiVm.minExpenditure,
      'Max expenditure': multiVm.maxExpenditure,
      'Min velocity': multiVm.minvelocity,
      'Max velocity': multiVm.maxvelocity,
      'Resource avg. velocity': multiVm.velocity,
      'Deadline': multiVm.deadline,
      'Location': multiVm.marker.position.toUrlValue()
    }


    multiVm.eventList[index] = new Array();
    multiVm.eventList[index] = multiVm.factor;
  }


    multiVm.progrssMenuOpen = function () {
      ngDialog.open({ 
        template: 'eventProgress.html',
        overlay: false,
        showClose: false,
        scope: $scope,
        className: 'ngdialog-theme-default progress-menu draggable'       
      });
    };


  multiVm.apply = function(){
    $mdDialog.hide();
  }


  multiVm.confirmStart = function(){
    $mdDialog.hide();
    console.log(multiVm.eventList);

    //pop out overview event windows
    multiVm.overviewMenu();
  }

  multiVm.overviewMenu = function () {
    ngDialog.openConfirm({ 
      template: 'multiEventOverview.html',
      overlay: true,
      showClose: false,
      scope: $scope,
      className: 'ngdialog-theme-default overview-menu draggable'       
    }).then(function(value){
        multiVm.startMultiEvent();
    });
  };
  // now start the simulation

  multiVm.startMultiEvent = function(){
    // close factor menu
    multiVm.eventStarted = true;
    console.log("Start Multi");
    // var progressStage = 0;

    // // close hamburger menu
    // multiVm.hamCheck = false;
    // // hide search box
    // multiVm.searchExtend();
    // // close info window
    // multiVm.closeInfoWin();
    // // clear onclick event in map
    // clearMapClickEvent();
    // // change back to default google map cursor
    // defaultCursor();
    // // start progress menu animation
    // progressInfoControl(0);

    // // open progress menu
    // multiVm.progrssMenuOpen();
    // // redirect info window to progress menu
    // multiVm.infoWinRedirect("progrssMenuOpen");

    // multiVm.map.setCenter(multiVm.marker.position);

    // //search 
    // searchCircle();

    // // sendReqtToFac();
    // //two http request chainning together
    // //first $http get all facility location and display
    // //second $http request filter the facilities remove the unused facilities location
    
    // multiVm.getFaciLoc().then(getTasks);
    
    // multiVm.panelShow = "true";
  } 


  multiVm.getFaciLoc = function(){
    console.log("getFaciLoc");
    return $http({

      method  : 'POST',
      url     : '/singleEvent',
      //     // set the headers so angular passing info as form data (not request payload)
      headers : { 'Content-Type': 'application/json' },
      data    : {
                 Severity: multiVm.factor["Severity Level"],
                 Category: multiVm.factor["Category"],
                 Expenditure: {min: multiVm.factor['Min expenditure'], max: multiVm.factor['Max expenditure']},
                 Velocity: {min: multiVm.factor['Min velocity'], max: multiVm.factor['Max velocity']},
                 Deadline: multiVm.factor["Deadline"],
                 Location: multiVm.marker.position.toUrlValue(),
                 ResourceNum: {min: 2, max: 10}
                }

      }).then(function success(response) {

        console.log(response.data);
        var totalFacilites = 0;
        var totalPoliceStation = 0;
        var totalHospital = 0;
        var totalFireStation = 0;
        var ambulanceNum = 0;
        var policeCarNum = 0;
        var fireTruckNum = 0;


        for(var i = 0; i < response.data.facilities.length; ++i){
          totalFacilites++;
          if(response.data.facilities[i].type == "hospital"){
            ambulanceNum = response.data.resources.hospital.num;
            totalHospital++;
          }
          else if(response.data.facilities[i].type == "police"){
            policeCarNum = response.data.resources.police.num;
            totalPoliceStation++;
          }
          else if(response.data.facilities[i].type == "fire_station"){
            fireTruckNum = response.data.resources.fire_station.num;
            totalFireStation++;
          }
        }

        $timeout(function(){
          for(var i = 0; i < response.data.facilities.length; ++i){
            if(response.data.facilities[i].type == "hospital"){
              putHospital(response.data.facilities[i]);
            }
            else if(response.data.facilities[i].type == "police"){
              putPolice(response.data.facilities[i]);
            }
            else if(response.data.facilities[i].type == "fire_station"){
              putFire(response.data.facilities[i]);
            }
          }
        }, 5000);
        // sendReqtToFac(response.data);
        receiveEventTask(ambulanceNum, policeCarNum, fireTruckNum);
        multiVm.facilitesSummary(totalFacilites, totalHospital, totalPoliceStation, totalFireStation);

        return response.data;

      });
  }

  sendReqtToFac = function(dataObj){
    console.log(dataObj.facilities.length);
    for(var i = 0; i < dataObj.facilities.length; ++i){
      endLoc[i] = dataObj.facilities.location;
      polylines[i] = new google.maps.Polyline({
        path: [multiVm.marker.position, dataObj.facilities.location],
        geodestic: true,
        strokeColor: '#178cd',
        strokeOpacity: 0.6,
        strokeWeight: 2
      });
      requestMarker[i] = new google.maps.Marker({
        position: multiVm.marker.position,
        map: multiVm.map,
        icon: "img/bomb.svg"
      });
    }
    moveReqMarker(endLoc, polylines, requestMarker);
  }

  moveReqMarker = function(endLoc, polyline, marker){
    var eol = [];
    var poly2 = [];
    var timerHandle = [];
    for (var i = 0; i < polyline.length; i++) {
        var dfd = $.Deferred();
        poly2[i] = new google.maps.Polyline({
            path: []
        });
        marker[i].setMap(map);
        polyline[i].setMap(map);
        startAnimation(i);
    }
  }


  getTasks = function(dataObj){
    return $http({

      method  : 'POST',
      url     : '/assignResource',
      headers : { 'Content-Type': 'application/json' },
      data    : {
                  sim_id: dataObj.sim_id
      }
    }).then(function success(response){
        console.log(response.data);
        for(var i = 0; i < response.data.length; ++i){
          startLoc.push(response.data[i].Location);
        }

        progressHandle[stage] = $timeout(function(){
      progressInfoControl(stage);
    }, delayArray[stage]);

        $timeout(function(){
          setRoutes()}, 20000);
    })
  }


  function receiveEventTask(ambulanceNum, policeCarNum, fireTruckNum){
    multiVm.totalResources = ambulanceNum+policeCarNum+fireTruckNum;
    multiVm.ambulance = ambulanceNum;
    multiVm.police = policeCarNum;
    multiVm.fireTruck = fireTruckNum;
  }

  multiVm.resourceAllocation = function(resourceObj){
    multiVm.allocatedResources = []
    for(var i = 0; i < resourceObj.length; i++){

    }
  }

  multiVm.taskSummary = function(){

  }

  multiVm.facilitesSummary = function(totalFacilites, totalHospital, totalPoliceStation, totalFireStation) {
    multiVm.facilitiesSum = {
      'Total': totalFacilites,
      'Hospital': totalHospital,
      'Polication Station': totalPoliceStation,
      'Fire Station': totalFireStation
    }
  }

  multiVm.setDataField = function(index){
    // generate factor
    console.log(index);
    multiVm.factorGenerate(index);

    $mdDialog.show(
      {
        templateUrl: "multiFactorDialog.html",
        clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true,
            controller: function($scope) {
      }
    });
  };

  // reset factor
  multiVm.reset = function () {
    multiVm.factorGenerate();
  }

  // close dialog
  multiVm.close = function () {
    $mdDialog.cancel();
  }


  var totalProgressStage = 6;
  var currentProgressStage = 0;
  var progressHandle = [];
  // var delayArray = [0, 1500, 3500, 5500, 7500, 7600, 8100];
  var delayArray = [0, 5000, 5000, 5000, 5000, 100, 500, 500, 950, 1500, 5500, 5500, 5500];


  function progressInfoControl(stage){
    // currentProgressStage = stage;
    if(stage > delayArray.length){
      return;
    }
    if(stage == 0){
      multiVm.stage = "Analysing Event";
    }
    else if(stage == 1){
      multiVm.eventShow = true;
    }
    else if(stage == 2){
    multiVm.stage = "Establishing Plan";
    }
    else if(stage == 3){
      multiVm.taskShow = true;
    }
    else if(stage == 4){
      multiVm.stage = "Searching for Facilities";
    }
    else if(stage == 5){
      multiVm.containerExtend = 'progress-first-extend';
      multiVm.contentExtend = 'progress-content-extend';
    }
    else if(stage == 6){
      multiVm.radarShow = true;
    }
    else if(stage == 7){
      multiVm.containerExtend = 'progress-second-extend';
      multiVm.facilityShow = true;
    }
    else if(stage == 8){
      multiVm.radarShow = false;
    }
    else if(stage == 9){
      multiVm.stage = "Sending Tasks Info to Facilities";
      multiVm.dotShow = true;
    }
    else if(stage == 10){
      multiVm.stage = "Receiving Response from Facilities";
    }
    else if(stage == 11){
      multiVm.stage = "Analysing Response from Facilities";
    }
    else if(stage == 12){
      multiVm.stage = "Resources Allocaton";
    }


    stage++;
    currentProgressStage = stage;
    progressHandle[stage] = $timeout(function(){
      progressInfoControl(stage);
    }, delayArray[stage]);

  }

  multiVm.searchExtend = function(){
    defaultCursor();
    multiVm.searchBoxExtend = "";
    if(!multiVm.searchShow){
      multiVm.searchBoxExtend = "animated fadeIn";
      multiVm.searchShow = true;
    }
    else{
      multiVm.searchBoxExtend = "animated fadeOut ";
      multiVm.searchShow = false;
    }
  }

  multiVm.progressMenuIsOpen = false;
  multiVm.progrssMenuOpen = function(){
    // progress menu first open
    if(!multiVm.progressMenuIsOpen){
      multiVm.dialog = ngDialog.open({ 
        template: 'eventProgress.html',
        overlay: false,
        showClose: false,
        scope: $scope,  
        className: 'ngdialog-theme-default progress-menu draggable'       
      });
      multiVm.progressMenuIsOpen = true;
    }
    else{
      // progress menu opened for first time, then check whether it is opened atm
      if(!ngDialog.isOpen(multiVm.dialog.id)){
        console.log("in");
        multiVm.dialog = ngDialog.open({ 
          template: 'eventProgress.html',
          overlay: false,
          showClose: false,
          scope: $scope,  
          className: 'ngdialog-theme-default progress-menu draggable'       
        });
      }
    }
  };


  function createMarker(latlng, label, html) {
    var marker = new google.maps.Marker({
        position: latlng,
        map: multiVm.map,
        title: label,
        // zIndex: Math.round(latlng.lat()*-100000)<<5,
        icon: "./img/police-car.svg",
        animation: google.maps.Animation.DROP
        });
        marker.myname = label;

    return marker;
  }  

  function putPolice(facilityObj, label, type){
    var iconUrl;
    var latlng = facilityObj.location;
    var marker = new google.maps.Marker({
      position: latlng,
      map: multiVm.map,
      title: label,
      icon: "./img/police-station.svg",
      animation: google.maps.Animation.DROP
    })

    var facilityElement = "";

    facilityElement = facilitiesInfo(facilityObj, "police");

    var compiled = $compile(facilityElement)($scope)
    marker.infoWin = new google.maps.InfoWindow({
      // content: "<showTag></showTag>"
      content: compiled[0]

    });
    //show the infomation window
    marker.addListener('click', function($scope){
      marker.infoWin.open(multiVm.map, marker);
    });

    // return marker;
  }

  function putHospital(facilityObj, label, type){
    var iconUrl;
    var latlng = facilityObj.location;
    var marker = new google.maps.Marker({
      position: latlng,
      map: multiVm.map,
      title: label,
      icon: "./img/hospital.svg",
      animation: google.maps.Animation.DROP
    })
    var facilityElement = "";
    facilityElement = facilitiesInfo(facilityObj, "hospital");

    var compiled = $compile(facilityElement)($scope)
    marker.infoWin = new google.maps.InfoWindow({
      // content: "<showTag></showTag>"
      content: compiled[0]

    });
    //show the infomation window
    marker.addListener('click', function($scope){
      marker.infoWin.open(multiVm.map, marker);
    });

    // return marker;
  }

  function putFire(facilityObj, label, type){
    var iconUrl;
    var latlng = facilityObj.location;
    var marker = new google.maps.Marker({
      position: latlng,
      map: multiVm.map,
      title: label,
      icon: "./img/fire-station.svg",
      animation: google.maps.Animation.DROP
    })

    var facilityElement = "";
    facilityElement = facilitiesInfo(facilityObj, "fire_station");

    var compiled = $compile(facilityElement)($scope)
    marker.infoWin = new google.maps.InfoWindow({
      // content: "<showTag></showTag>"
      content: compiled[0]

    });
    //show the infomation window
    marker.addListener('click', function($scope){
      marker.infoWin.open(multiVm.map, marker);
    });

    // return marker;
  }

  function facilitiesInfo(facilityObj, facility_type){
    var type = "";
    var resource_number = 0;
    multiVm.number = 0;
    if(facility_type == "police")
      type = "Police Car";
    else if(facility_type == "hospital")
      type = "Ambulance";
    else if(facility_type == "fire_station")
      type = "Fire Truck";

    var resource_number = facilityObj.resourceNum;
    var facility_name = facilityObj.name;

    var element =   "<div>"+
              "<div class=\"infoWin-header-container\">"+
                "<p id=\"infoWin-header\" class=\"facility-header\">Location</p>"+"<span class=\"facility-name\">"+facility_name+"</span>"+
              "</div> " + 
              "<div>" +
                "<div id=\"facility-info-container\">"+
                      "<table id=\"resource-info-table\">"+
                        "<tr>"+
                          "<th colspan=\"2\" class=\"recourse-header\">Mobile Resources Information</th>"+
                        "</tr>"+
                        "<tr>"+
                          "<th class=\"sub-header\">ID</th>"+
                          "<th class=\"sub-header\">Type</th>"+
                        "</tr>"+
                        "<tr>"+
                          
                        "</tr>"+
                      "</table>"+
                    "</div>"+
              "</div>"+
            "</div>"

    return element;
  }

  function searchCircle(){
    var _radius = 5000;
    var rMin = _radius * 2/5;
    var rMax = _radius;
    var direction = 1;

    var circleOption = {
      center: multiVm.marker.position,
      fillColor: '#3878c7',
      fillOpacity: 0.2,
      map: multiVm.map,

      radius: rMin,
      strokeColor: '#3878c7',
          strokeOpacity: 0.2,
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
      var startLocLength;

      var rendererOptions = {
        map: multiVm.map,
        suppressMarkers : true,
        preserveViewport: true
      }

      directionsService = new google.maps.DirectionsService();

      var travelMode = google.maps.DirectionsTravelMode.DRIVING;
      var requests = new Array();
      for(var i = 0; i < startLoc.length; ++i){
        requests[i] = {
          origin: startLoc[i],
          destination: multiVm.marker.position,
          travelMode: travelMode
        };
        directionsService.route(requests[i], makeRouteCallback(i, directionDisplay[i]));
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
                disp.setMap(multiVm.map);

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
          polyline[routeNum].setMap(multiVm.map);             

          //map.fitBounds(bounds);

          $timeout(function(){
            startAnimation(routeNum)
          }, 25000);     
        }
      } 
    }

    var eol = [];
    var lastVertex = 1;
    var stepnum=0;
    var maxStep = 5; // max distance per move
    multiVm.step = 0.1; // 3; // metres
    var playStop = true; // true = play, false = stop

    var tick = 100; // milliseconds

    var current_index = 0;
    var current_point = [];

    var markerStarted = false;

    multiVm.stepControl = function(step){
      multiVm.step = multiVm.step + step;
      if(multiVm.step > maxStep){
        multiVm.step = maxStep;
      }
      else if(multiVm.step < 0.1){
        multiVm.step = 0.1;
      }
    }

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


  // stop simulation
  multiVm.stopTimeout = function(){
    //reset map
    //clear current event
    console.log("Stop simulation and redraw the map");
      ngDialog.openConfirm({
          template:'\
            <div>\
              <div class="modal-header safari_top_radius">\
                <div id="progress-title-content">\
                  <div class="icon-container">\
                    <span id="progress-title-icon"></span>\
                  </div>\
                  <span class="progress-title">Confirmation</span>\
                </div>  \
              </div>\
              <div id="confirm-content">\
                <p>Are you sure you want to stop the simulation?</p>\
                <div class="ngdialog-buttons modal-footer ">\
                    <button type="button" class="ngdialog-button ngdialog-button-secondary" ng-click="closeThisDialog(0)">No</button>\
                    <button type="button" class="ngdialog-button ngdialog-button-primary" ng-click="confirm(1)">Yes</button>\
                </div>\
              </div>\
            </div>',
          plain: true,
          showClose: false,
          className: 'ngdialog-theme-default confirm-menu-container'
      }).then(function(value){
        $window.location.reload();
      });
  }

  // pause simulation
  multiVm.pauseTimeout = function(){
    if(playStop){
      // console.log(currentProgressStage);
      playStop = false;
      // if marker started
      if(markerStarted){
        for(var i = 0; i < startLoc.length; i++){
          $timeout.cancel(timerHandle[i]);
          console.log("Pause" + i);
        }
      }
      // pause progress menu
      $timeout.cancel(progressHandle[currentProgressStage]);
      multiVm.pause = "pause-effect";
      multiVm.pauseIcon = true;
    }
  }

  // play simulation after paused
  multiVm.restartTimeout = function(){
    if(!playStop){
      playStop = true;
      if(markerStarted){
        // need to fix bug
        timerHandle[0] = $timeout(function() {
            animate(0, (current_point + multiVm.step*5));
          }, tick);
          timerHandle[1] = $timeout(function() {
            animate(1, (current_point + multiVm.step*5));
          }, tick);
      }

      multiVm.pause = "";
        progressHandle[currentProgressStage] = $timeout(function(){
          progressInfoControl(currentProgressStage);
        }, delayArray[currentProgressStage]);
        multiVm.pauseIcon = false;
    }
  }

    function animate(index,d) {
      markerStarted = true;
      current_point = d;
      if (d > eol[index]) {
          marker[index].setPosition(endLocation[index].latlng);
          return;
      }
      var p = polyline[index].GetPointAtDistance(d);
      marker[index].setPosition(p);
      updatePoly(index,d);
      timerHandle[index] =  $timeout(function() {
        animate(index, (d + multiVm.step*5));
      }, tick);
  }

    function startAnimation(index){

      eol[index] = polyline[index].Distance();

      poly2[index] = new google.maps.Polyline({path: [polyline[index].getPath().getAt(0)],
              strokeColor:"#FFFF00", strokeWeight:3});

      animate(index, 50);
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
