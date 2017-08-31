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
    restrict:'C',
    //The link function is responsible for registering DOM listeners as well as updating the DOM.
    link: function(scope, element, attrs) {
      element.draggable();
    }
  };
});
 
app.directive('blink', ['$interval', function($interval) {
  return function(scope, element, attrs) {
      var timeoutId;
      
      var blink = function() {
        element.css('opacity') === '1' ? element.css('opacity', '0') : element.css('opacity', '1');
      }
      
      timeoutId = $interval(function() {
        blink();
      }, 600);
    
      element.css({
        'display': 'inline-block'
      });
      
      element.on('$destroy', function() {
        $interval.cancel(timeoutId);
      });
    };
}]);