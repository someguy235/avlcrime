/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var events, showSpinner = false, showError = false, showChart = false;
var offenses = null, severity = null, years = null, selOffenses = null, selSeverity = null, selYears = null;

var CrimeModule = angular.module('CrimeApp', []);

CrimeModule.factory('CrimeService', function(){
  var service = {
    offenses: offenses,
    severity: severity,
    years: years,
    selOffenses: selOffenses,
    selSeverity: selSeverity,
    selYears: selYears
  }
  return service
})

//TODO: what the hell does this do?
function Main($scope){

}

//angular.module('buttonsToggle', []).directive('buttonsToggle', function() {
//var ButtonModule = angular.module('LastFmApp', []).directive('buttonsRadio', function() {
CrimeModule.directive('checkboxToggle', function() {
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
        //element.parent(".btn-group").find('button').removeClass("active");
        element.parent(".btn-group") //.children()
        .find("button[value='" + newValue + "']").toggleClass('active');
      });
    }
  };
});

CrimeModule.controller("FormController", function($scope, $http, CrimeService){
  $scope.selSeverity = null;
  $scope.selOffenses = null;
  $scope.selYears = null;

  $http({
    url: '/avlcrime/params',
    method: "GET",
    headers: {'Content-Type': 'application/json'}
  }).success(function (data, status, headers, config) {
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

  $scope.$watch('$scope.selSeverity', function(newVal, oldVal, scope){
    CrimeService.selSeverity = newVal;
    //console.log("selSeverity change: "+ $scope.selSeverity);
  })
  $scope.$watch('$scope.selOffenses', function(newVal, oldVal, scope){
    CrimeService.selOffenses = newVal;
    //console.log("selOffenses change: "+ $scope.selOffenses);
  })
  $scope.$watch('$scope.selYears', function(newVal, oldVal, scope){
    CrimeService.selYears = newVal;
    //console.log("selYears change: "+ $scope.selYears);
  })
})

CrimeModule.controller("DisplayController", function($scope, $http, CrimeService){
  $scope.selSeverity = CrimeService.selSeverity;
  $scope.selOffenses = CrimeService.selOffenses;
  $scope.selYears = CrimeService.selYears;
  $scope.map = L.map('map').setView([35.595, -82.552], 12);

  L.tileLayer(
    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: 'Map data © OpenStreetMap contributors' }
  ).addTo($scope.map);

  $scope.getResults = function(){
    postData = {
      severity: $scope.selSeverity,
      offenses: $scope.selOffenses,
      years: $scope.selYears
    }
    //console.log("postData: "+ postData);
    $http({
      url: '/avlcrime/crimes',
      method: "POST",
      data: postData,
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      //console.log("success");
      //console.log(data);
      L.geoJson(data,{
        onEachFeature: onEachFeature
      }).addTo($scope.map);
    }).error(function (data, status, headers, config) {
      console.log("error")
    });
  }

  $scope.getResults();

  $scope.$watch('CrimeService.selSeverity', function(newVal, oldVal, scope){
    $scope.selSeverity = newVal;
    console.log("selSeverity change: "+ $scope.selSeverity);
  })
  $scope.$watch('CrimeService.selOffenses', function(newVal, oldVal, scope){
    $scope.selOffenses = newVal;
    console.log("selOffenses change: "+ $scope.selOffenses);
  })
  $scope.$watch('CrimeService.selYears', function(newVal, oldVal, scope){
    $scope.selYears = newVal;
    console.log("selYears change: "+ $scope.selYears);
  })
})

function onEachFeature(feature, layer) {
  var popupContent = ""+ feature.properties.thedate.substring(0,10) +"<br>"
  popupContent += feature.properties.severity +": "+ feature.properties.offense
  layer.bindPopup(popupContent);
}

//angular.bootstrap(DMCalApp, ["DMCalApp"]);
