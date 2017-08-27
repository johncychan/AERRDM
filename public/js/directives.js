//var app = angular.module('meanMapApp', ['ngRoute', 'ngMap', 'ngMaterial']);

// app.directive("showForm", function(){
// 	return {
// 		restrict: 'E',
// 		templateUrl: 'setDataForm.html'
// 	}
// });

// app.directive("showTag", function(){
// 	return{
// 		// template: "<div><h1><button ng-click=\"vm.setDataField()\">" + "Start simulation" + "</button></h1></div>"
// 		template: "<p>Name<p>"
// 	};
// });


app.directive('draggable', function() {
  return {
    // A = attribute, E = Element, C = Class and M = HTML Comment
    restrict:'A',
    //The link function is responsible for registering DOM listeners as well as updating the DOM.
    link: function(scope, element, attrs) {
      element.draggable();
    }
  };
});
 