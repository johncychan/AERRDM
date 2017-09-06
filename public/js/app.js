var app = angular.module('meanMapApp', ['ngRoute', 'ngMap', 'ngMaterial', 'ngDialog']);

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
		controller: "multeEventCtrl",
		controllerAs: "multiVm"
	})
})
