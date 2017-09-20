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

app.factory('selectedFacility', function(){
	var savedSelectedInfo = {};
	function set(data){
		savedSelectedInfo = data;
	}
	function get(){
		return savedSelectedInfo;
	}
	return {
		set: set,
		get: get
	}
});
