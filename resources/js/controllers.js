/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var events, showSpinner = false, showError = false, showChart = false;
var offenses, layers = {};
var FILL_COLORS = {
  'Drug Arrest': '#FFC73F',
  'Vandalism': '#E8903A',
  'Larceny of Motor Vehicle': '#FF754C',
  'Larceny': '#E83A4E',
  'Burglary': '#FC3FFF',
  'Robbery': '#5171FF',
  'Aggravated Assault': '#35C4E8',
  'Rape': '#47FFAD',
  'Homicide': '#4CE835'
}

var CrimeModule = angular.module('CrimeApp', []);

CrimeModule.factory('CrimeService', function(){
  var service = {
    offenses: offenses,
    layers: layers
  }
  return service
})

//TODO: what the hell does this do?
function Main($scope){

}

CrimeModule.directive('checkboxToggle', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function($scope, element, attr, ctrl) {
      // ignore other kind of button groups (e.g. buttons-radio)
      if (!element.parent('[data-toggle="buttons-checkbox"].btn-group-vertical').length) {
        return;
      }

      // set/unset 'active' class when model changes
      $scope.$watch(attr.ngModel, function(newValue, oldValue) {
        element.toggleClass('active', ctrl.$viewValue);
      });

      // update model when button is clicked
      element.bind('click', function(e) {
        $scope.$apply(function(scope) {
          ctrl.$setViewValue(!ctrl.$viewValue);
        });

        // don't let Bootstrap.js catch this event,
        // as we are overriding its data-toggle behavior.
        e.stopPropagation();
      });
    }
  };
});

CrimeModule.controller("FormController", function($scope, $http, CrimeService){
  $http({
    url: '/avlcrime/params',
    method: "GET",
    headers: {'Content-Type': 'application/json'}
  }).success(function (offenses, status, headers, config) {
    var tmpOff = []
    for(var i=0; i<offenses.length; i++){
      tmpOff.push({name: offenses[i], selected: false, color: FILL_COLORS[offenses[i]]})
    }
    $scope.offenses = tmpOff;
  }).error(function (data, status, headers, config) {
    //console.log("error")
  });
  $scope.$watch('offenses', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      CrimeService.offenses = newVal;
    }
  }, true)
})

CrimeModule.controller("DisplayController", function($scope, $http, CrimeService){
  $scope.CrimeService = CrimeService;
  $scope.map = L.map('map').setView([35.595, -82.552], 12);
  var activeLayers = [];
  var markerOpts = {
    radius: 5,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

  L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: 'Map data © OpenStreetMap contributors' }
  ).addTo($scope.map);

  $scope.getOffenses = function(){
    $http({
      url: '/avlcrime/crimes',
      method: "POST",
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      $.each(data, function(offenseType, offenseGroup){
        var tmpGrp = [];
        markerOpts.fillColor = FILL_COLORS[offenseType];
        $.each(offenseGroup, function(key, offense){
          tmpGrp.push(
            L.circleMarker(
              [offense.lat, offense.lon], markerOpts
            ).bindPopup(offense.date +"<br>"+ offense.add +"<br>"+ offense.off)
          )
        })
        CrimeService.layers[offenseType] = L.layerGroup(tmpGrp);;
      })
    }).error(function (data, status, headers, config) {
      //console.log("error")
    });
  }

  $scope.getOffenses();

  $scope.updateMap = function(){
    $.each(CrimeService.offenses, function(key, val){
      var layerIdx = $.inArray(val.name, activeLayers);
      if(val.selected && (layerIdx < 0)){
        activeLayers.push(val.name);
        $scope.map.addLayer(CrimeService.layers[val.name]);
      }else if(!val.selected && (layerIdx > -1)){
        activeLayers.splice(layerIdx, 1);
        $scope.map.removeLayer(CrimeService.layers[val.name]);
      }
    })
  }

  $scope.$watch('CrimeService.offenses', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      $scope.updateMap();
    }
  }, true)
})

