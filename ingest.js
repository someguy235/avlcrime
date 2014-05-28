//var express = require('express');
var request = require('request');
var _ = require('underscore');
var async = require('async');

var dbUrl = "avlcrime"
var collections = ["crimes"]
var db = require("mongojs").connect(dbUrl, collections)

var crimesURL = "http://opendataserver.ashevillenc.gov/geoserver/ows?service=WFS&request=GetFeature&srsName=EPSG:4326&typeName=coagis:coa_crime_mapper_apd_locations_view&maxFeatures=1000000&outputFormat=json";

request(crimesURL, function(err, res, body){
  var data = JSON.parse(body),
    oldCrimes = 0,
    newCrimes = 0;

  var finished = _.after(data.features.length, function(){
    console.log("old crimes: "+ oldCrimes);
    console.log("new crimes: "+ newCrimes);
    process.exit(0); 
  })

  console.log("found crimes: "+ data.features.length);
  _.each(data.features, function(inCrime, key){
    db.crimes.find({"properties.idnum": inCrime.properties.idnum}, function(err, fndCrimes){
      if(err){
        console.log("err: "+ err);
        finished();
      }else if(!fndCrimes.length){
        //console.log(key +": crime not found in cache")
        newCrimes++;
        db.crimes.save(inCrime, function(err, saved){
          if(err || !saved){
            console.log("crime not saved: "+ err);
            finished();
          }else{
            //console.log(key +": crime saved");
            console.log(JSON.stringify(inCrime));
            finished();
          }
        });
      }else{
        //console.log(key +": crime found in cache");
        oldCrimes++
        finished();
      }
    });
  })
})


