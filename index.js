var http = require('http');
var Converter = require("csvtojson").Converter;
var fs = require('fs');
const Encog = require('encog');
const _ = require('lodash');

// create a neural network

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Node.JS!');


// Convert a csv file with csvtojson
var converter = new Converter({});
converter.fromFile("auto-mpg.csv",function(err,result){
//  console.log(result);
  var json = JSON.stringify(result);
  fs.writeFile('car.json', json, 'utf8', function(err, res){
    console.log("CSV to JSON");

  });
});

const dataEncoder = new Encog.Preprocessing.DataEncoder();
let carDataset = JSON.parse(fs.readFileSync('car.json', 'utf8'));
carDataset = _.shuffle(carDataset);
carDataset = Encog.Preprocessing.DataToolbox.trainTestSplit(carDataset);

/******************/
//data normalization
/******************/

//apply a specific mapping to each column
const mappings = {
    'mpg': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'cylinders': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'displacement': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'horsepower': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'weight': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'acceleration': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'model year': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'origin': new Encog.Preprocessing.DataMappers.EqualLengthBuckets(),
    'car name': new Encog.Preprocessing.DataMappers.OneHot(),

};

//Fit to data, then transform it.
let trainData = dataEncoder.fit_transform(carDataset.train, mappings);
//transform the test data based on the train data
let testData = dataEncoder.transform(carDataset.test, mappings);

//slice the data in input and output
trainData = Encog.Preprocessing.DataToolbox.sliceOutput(trainData.values, 3);
testData = Encog.Preprocessing.DataToolbox.sliceOutput(testData.values, 3);

// create a neural network
const network = new Encog.Networks.Basic();
network.addLayer(new Encog.Layers.Basic(null, true, 10));
network.addLayer(new Encog.Layers.Basic(new Encog.ActivationFunctions.Sigmoid(), true, 10));
network.addLayer(new Encog.Layers.Basic(new Encog.ActivationFunctions.Sigmoid(), true, 5));
network.addLayer(new Encog.Layers.Basic(new Encog.ActivationFunctions.Sigmoid(), false, 3));
network.randomize();

// train the neural network
const train = new Encog.Training.Propagation.Resilient(network, trainData.input, trainData.output);
Encog.Utils.Network.trainNetwork(train, {minError: 0.01, minIterations: 10});

//validate the neural network
let accuracy = Encog.Utils.Network.validateNetwork(network, testData.input, testData.output);
console.log('Accuracy:', accuracy);

//save the trained network
Encog.Utils.File.saveNetwork(network, 'car.dat');

//load a pretrained network
const newNetwork = Encog.Utils.File.loadNetwork('car.dat');

//validate the neural network
accuracy = Encog.Utils.Network.validateNetwork(newNetwork, testData.input, testData.output);
console.log('accuracy: ', accuracy);


}).listen(8081);
console.log('Server running at http://localhost:8081/');
