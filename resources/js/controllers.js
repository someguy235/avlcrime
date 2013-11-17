/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var events, showSpinner = false, showError = false, showChart = false;
var offenses = null, severity = null, years = null;

var CrimeModule = angular.module('CrimeApp', []);

CrimeModule.factory('CrimeService', function(){
  var service = {
    events: events,
    //showSpinner: showSpinner,
    //showError: showError,
    //showChart: showChart,
    offenses: offenses,
    severity: severity,
    years: years
  }
  return service
})
/*
//TODO: what the hell does this do?
function Main($scope){

}

//angular.module('buttonsRadio', []).directive('buttonsRadio', function() {
//var ButtonModule = angular.module('LastFmApp', []).directive('buttonsRadio', function() {
LastFmModule.directive('buttonsRadio', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function($scope, element, attr, ctrl) {
      element.bind('click', function() {
        $scope.$apply(function(scope) {
          ctrl.$setViewValue(attr.value);
        });
      });

      // This should just be added once, but is added for each radio input now?
      $scope.$watch(attr.ngModel, function(newValue, oldValue) {
        element.parent(".btn-group").find('button').removeClass("active");
        element.parent(".btn-group") //.children()
        .find("button[value='" + newValue + "']").addClass('active');
      });
    }
  };
});
*/
CrimeModule.controller("FormController", function($scope, $http, CrimeService){
  $http({
    url: '/lastfm/options',
    method: "GET",
    headers: {'Content-Type': 'application/json'}
  }).success(function (data, status, headers, config) {
    console.log("success");
    console.log(data);
    CrimeService.severity = data.severity;
    CrimeService.offenses = data.offenses;
    CrimeService.years = data.years;
  }).error(function (data, status, headers, config) {
    console.log("error")
  });
/*
  $scope.getResults = function(){
    LastFmService.showSpinner = true;
    LastFmService.showError = false;
    LastFmService.showChart = false;
    LastFmService.username = $scope.username;
    console.log("getResults()");

    postData = {
      "username": $scope.username,
      "period": $scope.period,
      "numArtists": $scope.numArtists
    }
    console.log(postData);

    $http({
      url: '/lastfm/results',
      method: "POST",
      data: postData,
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      LastFmService.showSpinner = false;
      LastFmService.showChart = true;
      LastFmService.events = data;

      console.log("success");
      console.log(data);
      nv.addGraph(function() {
        //var chart = nv.models.multiBarChart()
        //var chart = nv.models.stackedAreaChart()
        //var chart = nv.models.lineWithFocusChart()
        var chart = nv.models.pieChart()
          //.x(function(d) { return d[0] })
          .x(function(d) { return d.label; })
          //.y(function(d) { return d[1] })
          .y(function(d) { return d.value; })
          //.showControls(false).stacked(true)
          .showLabels(true)
          .labelThreshold(.05)
          .donut(true)
        d3.select('#chart1 svg')
          .datum(data[0].values)
          .transition().duration(500).call(chart)
        //nv.utils.windowResize(chart.update);
        return chart;
      });
    }).error(function (data, status, headers, config) {
      LastFmService.showSpinner = false;
      LastFmService.showError = true;
      console.log("error")
    });
  }
  */
})

CrimeModule.controller("DisplayController", function($scope, $http, CrimeService){
  $scope.CrimeService = CrimeService;
  $scope.severity = CrimeService.severity;
  $scope.offenses = CrimeService.offenses;
  $scope.years = CrimeService.years;
  //$scope.map = CrimeService.map;
  $scope.map = L.map('map').setView([35.595, -82.552], 12);

  L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: 'Map data © OpenStreetMap contributors' }
  ).addTo($scope.map);

  $scope.getResults = function(){
    postData = {
      severity: $scope.severity,
      offenses: $scope.offenses,
      years: $scope.years
    }
    $http({
      url: '/avlcrime/crimes',
      method: "POST",
      data: postData,
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      console.log("success");
      console.log(data);
      L.geoJson(data,{
        onEachFeature: onEachFeature
      }).addTo($scope.map);
    }).error(function (data, status, headers, config) {
      console.log("error")
    });
  }

  $scope.getResults();

  $scope.$watch('CrimeService.severity', function(newVal, oldVal, scope){
    $scope.severity = newVal;
  })
  $scope.$watch('CrimeService.offenses', function(newVal, oldVal, scope){
    $scope.offenses = newVal;
  })
  $scope.$watch('CrimeService.years', function(newVal, oldVal, scope){
    $scope.years = newVal;
  })
})

function onEachFeature(feature, layer) {
  var popupContent = ""+ feature.properties.thedate.substring(0,10) +": "+ feature.properties.offense
  layer.bindPopup(popupContent);
}

//angular.bootstrap(DMCalApp, ["DMCalApp"]);
