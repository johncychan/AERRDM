angular.module('myApp',['ngMap']).controller('getCurrent', function(NgMap) {
    var vm = this;
    vm.message = 'You can not hide. :)';
    NgMap.getMap("map").then(function(map) {
      vm.map = map;
    });
    vm.callbackFunc = function(param) {
      console.log('I know where '+ param +' are. ' + vm.message);
      console.log('You are at' + vm.map.getCenter());
    };
  });
