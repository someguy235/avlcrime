//var express = require('express');
var request = require('request');
var _ = require('underscore');
//var async = require('async');

var dbUrl = "avlcrime"
var collections = ["crimes"]
var db = require("mongojs").connect(dbUrl, collections)

var crimesURL = "http://opendataserver.ashevillenc.gov/geoserver/ows?service=WFS&request=GetFeature&srsName=EPSG:4326&typeName=coagis:coa_crime_mapper_apd_locations_view&maxFeatures=1000000&outputFormat=json";


request(crimesURL, function(err, res, body){
  var newCrimes = 0;
  var data = JSON.parse(body);
  _.each(data.features, function(inCrime, key){
    db.crimes.find({idnum: inCrime.properties.idnum}, function(err, fndCrimes){
      if(err){
        console.log("err: "+ err);
      }else if(!fndCrimes.length){
        console.log(key +": crime not found in cache")
        var newCrime = {
          idnum: inCrime.properties.idnum,
          casenum: inCrime.properties.casenumber,
          source: inCrime.properties.source,
          severity: inCrime.properties.severity,
          date: inCrime.properties.thedate,
          offense: inCrime.properties.offense,
          agency: inCrime.properties.agency,
          location: {
            address: inCrime.properties.address,
            lat: inCrime.geometry.coordinates[1],
            lon: inCrime.geometry.coordinates[0]
          }
        }
        db.crimes.save(newCrime, function(err, saved){
          if(err || !saved) console.log("crime not saved: "+ err);
          else{
            console.log("crime saved");
            newCrimes++;
          }
        });
      }else{
        console.log(key +": crime found in cache");
      }
    });
  })
});

