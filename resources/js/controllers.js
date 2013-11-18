/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var events, showSpinner = false, showError = false, showChart = false;
var offenses, severities, years;
//var offenses = null, severities = null, years = null;

var CrimeModule = angular.module('CrimeApp', []);

CrimeModule.factory('CrimeService', function(){
  var service = {
    offenses: offenses,
    severities: severities,
    years: years
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
      if (!element.parent('[data-toggle="buttons-checkbox"].btn-group').length) {
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
  }).success(function (data, status, headers, config) {
    console.log("data: "+ JSON.stringify(data));
    var tmpSev = []
    for(var i=0; i<data.severities.length; i++){
      tmpSev.push({name: data.severities[i], selected: false})
    }
    $scope.severities = tmpSev;

    var tmpOff = []
    for(var i=0; i<data.offenses.length; i++){
      tmpOff.push({name: data.offenses[i], selected: false})
    }
    $scope.offenses = tmpOff;

    var tmpYr = []
    for(var i=0; i<data.years.length; i++){
      tmpYr.push({name: data.years[i], selected: false})
    }
    $scope.years = tmpYr;
  }).error(function (data, status, headers, config) {
    console.log("error")
  });

  $scope.$watch('severities', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      CrimeService.severities = newVal
      //console.log("form severities change: "+ JSON.stringify(CrimeService.severities));
    }
  }, true)
  $scope.$watch('offenses', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      CrimeService.offenses = newVal;
      //console.log("form offenses change: "+ JSON.stringify(CrimeService.offenses)); 
    }
  }, true)
  $scope.$watch('years', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      CrimeService.years = newVal;
      //console.log("form years change: "+ JSON.stringify(CrimeService.years));
    }
  }, true)
})

CrimeModule.controller("DisplayController", function($scope, $http, CrimeService){
  $scope.CrimeService = CrimeService;
  $scope.map = L.map('map').setView([35.595, -82.552], 12);
  $scope.layer;
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
  var geojsonMarkerOptions = {
    radius: 8,
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

  $scope.getResults = function(){
    //console.log("getting results");
    postData = {
      severities: filterSelected(CrimeService.severities),
      offenses: filterSelected(CrimeService.offenses),
      years: filterSelected(CrimeService.years)
    }
    //console.log("postData: "+ JSON.stringify(postData));
    $http({
      url: '/avlcrime/crimes',
      method: "POST",
      data: postData,
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      //console.log("success");
      //console.log(data);
      if(typeof $scope.layer !== 'undefined'){
        $scope.map.removeLayer($scope.layer);
      }
      $scope.layer = L.geoJson(data,{
        onEachFeature: onEachFeature,
        pointToLayer: function(feature, latlng){
          //console.log("feature: "+ feature.properties.offense);
          geojsonMarkerOptions.fillColor = FILL_COLORS[feature.properties.offense];
          return L.circleMarker(latlng, geojsonMarkerOptions);
        }
      }).addTo($scope.map);
    }).error(function (data, status, headers, config) {
      console.log("error")
    });
  }

  //$scope.getResults();

  $scope.$watch('CrimeService.severities', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      //$scope.severities = filterSelected(newVal);
      //console.log("display severities change: "+ JSON.stringify($scope.severities));
      $scope.getResults();
    }
  }, true)
  $scope.$watch('CrimeService.offenses', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      //$scope.offenses = filterSelected(newVal);
      //console.log("display offenses change: "+ JSON.stringify($scope.offenses));
      $scope.getResults();
    }
  }, true)
  $scope.$watch('CrimeService.years', function(newVal, oldVal, scope){
    if(newVal !== oldVal){
      //$scope.years = filterSelected(newVal);
      //console.log("display years change: "+ JSON.stringify($scope.years));
      $scope.getResults();
    }
  }, true)
})

function onEachFeature(feature, layer) {
  var popupContent = ""+ feature.properties.thedate.substring(0,10) +"<br>"+
    feature.properties.offense +"<br>"+
    //feature.properties.severity +": "+ feature.properties.offense +"<br>"+
    feature.properties.address
    
  layer.bindPopup(popupContent);
}

function filterSelected(list){
  //console.log("list: "+ list);
  selected = [];
  if(typeof list == 'undefined'){
    return selected;
  }
  for(var i=0; i<list.length; i++){
    if(list[i].selected == true){
      selected.push(list[i].name);
    }
  }
  return selected;
}

//angular.bootstrap(DMCalApp, ["DMCalApp"]);
