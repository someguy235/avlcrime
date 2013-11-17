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
  console.log("crimes");
  var session = req.session
  var params = req.body;

  var now = "2013-10-01 00:00:00.0";
  db.crimes.find({"properties.thedate": {$gt: now}, "properties.severity": "Felony"}, function(err, crimes){
    if(err){
      console.log("err: "+ err);
    }else{
      var fc = {type: "FeatureCollection", features: crimes}
      response.send(fc, 200);
    }
  })
});

app.get('/avlcrime/params', function(req, response){
  console.log("params");
  
  var params = {
    offenses: ['Drug Arrest', 'Vandalism', 'Larceny'],
    severities: ['Felony', 'Misdemeanor'],
    years: ['2013', '2012']
  }

  response.send(params, 200);
});

app.listen(3001);
console.log(new Date() +": avlcrime listening on port 3001");

