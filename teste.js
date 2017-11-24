var http = require('http');
var fs = require('fs');
var Converter = require("csvtojson").Converter;




http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Node.JS! ');

// Convert a csv file with csvtojson

var converter = new Converter({});
converter.fromFile("auto-mpg.csv",function(err,result){
  console.log(result);
  var json = JSON.stringify(result);
  fs.writeFile('car.json', json, 'utf8');
});

   }).listen(8081);
   console.log('Server running at http://localhost:8081/');
