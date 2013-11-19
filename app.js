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
//app.engine('.html', require('jade').__express);

app.get('/', function(req, res){
  res.send("that's not a page", 404);
});

app.get('/avlcrime', function(req, res){
  res.render("index");
});

app.post('/avlcrime/crimes', function(req, response){
  //console.log("crimes");
  var params = req.body, maxYear = [], minYear = [];
  //console.log("params: "+ JSON.stringify(params));
  /*
  if(params.years.length){
    var maxYear = (parseInt(Math.max.apply(null, params.years)) + 1) + "-01-01 00:00:00.0";
    var minYear = Math.min.apply(null, params.years) + "-01-01 00:00:00.0";
  }
  */
  db.crimes.find({ 
    //$and:[
    //  {"properties.thedate": {$gte: minYear}}, 
    //  {"properties.thedate": {$lt: maxYear}}
    //],
    //"properties.severity": { $in: params.severities }, 
    "properties.offense": { $in: params.offenses } }, 
    function(err, crimes){
    if(err){
      console.log("err: "+ err);
    }else{
      //console.log("crimes: "+ crimes.length);
      var fc = {type: "FeatureCollection", features: crimes}
      response.send(fc, 200);
    }
  })
});

app.get('/avlcrime/params', function(req, response){
  var params = {
    offenses: [],
    severities: [],
    years: []
  }

  async.parallel({
    severities: function(callback){
      db.crimes.distinct('properties.severity', function(err, sev){
        if(err){
          console.log(err);
        }else{
          params.severities = sev;
        }
        callback(null, sev);
      });
    },
    offenses: function(callback){
      db.crimes.distinct('properties.offense', function(err, off){
        if(err){
          console.log(err);
        }else{
          params.offenses = off;
        }
        callback(null, off);
      });
    },
    years: function(callback){
      callback(null, ['2012', '2013']);
    },
  },
  function(err, result){
    response.send(result, 200);
  });
});

app.listen(3001);
console.log(new Date() +": avlcrime listening on port 3001");

