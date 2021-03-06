var express = require('express');
var request = require('request');
var _ = require('underscore');
var async = require('async');

var dbUrl = "avlcrime"
var collections = ["crimes"]
var db = require("mongojs").connect(dbUrl, collections)

var app = express();

app.use('/avlcrime/resources', express.static(__dirname + '/resources'));
app.use(express.json());

app.set("views", __dirname + "/views");
app.set("view engine", "jade");

app.engine('.jade', require('jade').__express);

app.get('/', function(req, res){
  res.send("that's not a page", 404);
});

app.get('/avlcrime', function(req, res){
  res.render("index");
});

app.post('/avlcrime/crimes', function(req, response){
  var bDate, eDate;
  if(req.body.year === 'month'){
    var b = new Date();
    bDate = b.getFullYear() + '-' + ("0"+ b.getMonth()).slice(-2) + '-' + ("0"+ b.getDate()).slice(-2) + ' 00:00:00.0';
    console.log("bDate: "+ bDate);
    var e = new Date();
    eDate = e.getFullYear() + '-' + ("0"+ (e.getMonth() + 1)).slice(-2) + '-' + ("0"+ e.getDate()).slice(-2) + ' 00:00:00.0';
    console.log("eDate: "+ eDate);
  }else{
    bDate = req.body.year + "-01-01 00:00:00.0";
    eDate = (parseInt(req.body.year, 10) + 1) + "-01-01 00:00:00.0";
  }
  //db.crimes.find({"properties.thedate" : {$gte: "2014-01-01 00:00:00.0"}},
  db.crimes.find({"properties.thedate" : {$gte: bDate, $lt: eDate}},
    function(err, crimes){
    if(err){
      console.log("err: "+ err);
    }else{
      var fc = {}
      _.each(crimes, function(val, key){
        if(typeof fc[val.properties.offense] == 'undefined'){
          fc[val.properties.offense] = [];
        }
        fc[val.properties.offense].push({
          lat: val.geometry.coordinates[1],
          lon: val.geometry.coordinates[0],
          off: val.properties.offense,
          add: val.properties.address,
          date: val.properties.thedate
        });
      })
      response.send(fc, 200);
    }
  })
});

app.get('/avlcrime/params', function(req, response){
  db.crimes.distinct('properties.offense', function(err, off){
    if(err){
      console.log(err);
    }else{
      response.send(off, 200);
    }
  });
});

app.listen(3001);
console.log(new Date() +": avlcrime listening on port 3001");

