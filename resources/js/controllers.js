/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var offenses, layers = {}, crimesCount = 0;
var showPoints = true, showHeat = false;
var FILL_COLORS = {
  'Drug Arrest': '#006837',
  'Vandalism': '#1A9850',
  'Larceny of Motor Vehicle': '#66BD63',
  'Larceny': '#A6D96A',
  'Burglary': '#FFFFBF',
  'Robbery': '#FDAE61',
  'Aggravated Assault': '#F46D43',
  'Rape': '#D73027',
  'Homicide': '#A50026'
}
var ORDERS = [
  'Drug Arrest',
  'Vandalism',
  'Larceny of Motor Vehicle',
  'Larceny',
  'Burglary',
  'Robbery',
  'Aggravated Assault',
  'Rape',
  'Homicide'
]

var CrimeModule = angular.module('CrimeApp', []);

CrimeModule.factory('CrimeService', function(){
  var service = {
    offenses: offenses,
    layers: layers,
    showPoints: showPoints,
    showHeat: showHeat,
    crimesCount: crimesCount,
    ORDERS: ORDERS
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
      if (!element.parent('[data-toggle="buttons-checkbox"].btn-group-vertical').length &&
          !element.parent('[data-toggle="buttons-checkbox"].btn-group').length) {
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
  $scope.CrimeService = CrimeService;
  $scope.showPoints = CrimeService.showPoints;
  $scope.showHeat = CrimeService.showHeat;
  $scope.crimesCount = CrimeService.crimesCount;
  var ORDERS = CrimeService.ORDERS;
  
  $http({
    url: '/avlcrime/params',
    method: "GET",
    headers: {'Content-Type': 'application/json'}
  }).success(function (offenses, status, headers, config) {
    var tmpOff = []
    for(var i=0; i<offenses.length; i++){
      tmpOff.push({
        name: offenses[i], 
        selected: false, 
        color: FILL_COLORS[offenses[i]],
        index: ORDERS.indexOf(offenses[i])
      })
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
  $scope.$watch('showPoints', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      CrimeService.showPoints = newVal;
    }
  }, true)
  $scope.$watch('showHeat', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      CrimeService.showHeat = newVal;
    }
  }, true)
  $scope.$watch('CrimeService.crimesCount', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
     $scope.crimesCount = CrimeService.crimesCount;
    }
  }, true)
})

CrimeModule.controller("DisplayController", function($scope, $http, CrimeService){
  $scope.CrimeService = CrimeService;
  $scope.showSpinner = false;
  $scope.map = L.map('map',
    {
      center: new L.LatLng(35.595, -82.552),
      zoom: 12
    }
  );

  var hmOpts = {
    radius: { value: 200, absolute: true},
    opacity: 0.8,
    gradient: {
      0.45: "rgb(0,0,255)",
      0.55: "rgb(0,255,255)",
      0.65: "rgb(0,255,0)",
      0.95: "yellow",
      1.0: "rgb(255,0,0)"
    }
  }
  var hmLayer = L.TileLayer.heatMap( hmOpts );

  var tileLayer = L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: 'Map data © OpenStreetMap contributors' }
  );

  $scope.map.addLayer(tileLayer);
  $scope.map.addLayer(hmLayer);

  var activeLayers = [];
  var hmData = {};
  var markerOpts = {
    radius: 5,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

  $scope.getOffenses = function(){
    $http({
      url: '/avlcrime/crimes',
      method: "POST",
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      $.each(data, function(offenseType, offenseGroup){
        var tmpGrp = [];
        hmData[offenseType] = [];
        markerOpts.fillColor = FILL_COLORS[offenseType];
        $.each(offenseGroup, function(key, offense){
          tmpGrp.push(
            L.circleMarker(
              [offense.lat, offense.lon], markerOpts
            ).bindPopup(offense.date.substr(0, 10) +"<br>"+ offense.add +"<br>"+ offense.off)
          )
          hmData[offenseType].push({lat:offense.lat, lon:offense.lon, value: 1});
        })
        CrimeService.layers[offenseType] = L.layerGroup(tmpGrp);;
      })
    }).error(function (data, status, headers, config) {
      //console.log("error")
    });
  }

  $scope.getOffenses();

  $scope.updateMap = function(){
    //$scope.showSpinner = true;
    var hmLayerData = [];
    $.each(CrimeService.offenses, function(key, val){
      var layerIdx = $.inArray(val.name, activeLayers);
      if(val.selected){
        hmLayerData = $.merge(hmLayerData, hmData[val.name]);
        if(layerIdx < 0){
          activeLayers.push(val.name);
        }
      }else if(layerIdx > -1){
        activeLayers.splice(layerIdx, 1);
      }
    });

    $.each(CrimeService.offenses, function(key, val){
      var layerIdx = $.inArray(val.name, activeLayers);
      if(CrimeService.showPoints && layerIdx > -1){
        if(!$scope.map.hasLayer(CrimeService.layers[val.name])){
          $scope.map.addLayer(CrimeService.layers[val.name]);
        }
      }else if($scope.map.hasLayer(CrimeService.layers[val.name])){
        $scope.map.removeLayer(CrimeService.layers[val.name]);
      }
    });
    if(hmLayerData.length > 0 && CrimeService.showHeat){
      if(!$scope.map.hasLayer(hmLayer)){
        $scope.map.addLayer(hmLayer);
      }
      hmLayer.setData(hmLayerData);
    }else{
      if($scope.map.hasLayer(hmLayer)){
        $scope.map.removeLayer(hmLayer);
      }
    }
    CrimeService.crimesCount = hmLayerData.length;
    //$scope.showSpinner = false;
  }

  $scope.$watch('CrimeService.offenses', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      $scope.updateMap();
    }
  }, true)
  $scope.$watch('CrimeService.showPoints', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      $scope.updateMap();
    }
  }, true)
  $scope.$watch('CrimeService.showHeat', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      $scope.updateMap();
    }
  }, true)
})

