var app = angular.module('meanMapApp', ['ngRoute', 'ngMap', 'ngMaterial', 'ngDialog', 'LocalStorageModule']);

app.config(function($routeProvider) {
	$routeProvider
	.when('/',
	{
		templateUrl: "singleEvent.html",
		controller: "singleEventCtrl",
		controllerAs: "singleVm"
	})
	.when("/multiEvent",
	{
		templateUrl: "multiEvent.html",
		controller: "multiEventCtrl",
		controllerAs: "multiVm"
	})
	.when("/facilityWindow",
	{
		templateUrl: "facilityWindow.html"

	})
});

app.config(function (localStorageServiceProvider){
	localStorageServiceProvider.setPrefix('meanMapApp');
});

app.factory('facilitySelected', function(){
	var selectedFacility = {};
	var pickedFacility = {};
	return {
	  getFacility : function () {
	    return selectedFacility;
	  },

	  setFacility : function (obj) {
	    selectedFacility = obj;
	  },

	  setPickFacility : function(obj){
	  	pickedFacility = obj
	  },

	  getPickFacility : function(obj){
	  	return pickedFacility;
	  }
	}
});
