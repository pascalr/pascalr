var express = require('express');
var app = express();
var bodyParser = require('body-parser')
const fs = require('fs');
const path = require('path');
const multer = require('multer')
var _ = require('./common/lodash.min.js')
var he = require('he') // unused I think
var elasticlunr = require('./common/elasticlunr.js')
const { Transform } = require('stream');

var sys = require('util')
var exec = require('child_process').exec;

const SerialPort = require('serialport');

//app.get('/home', function(req, res) {
//  res.send({templates})
//})

app.get('/hello',function (req, res) {
  //res.sendFile(path.join(__dirname, req.path));
  res.sendFile(path.join(__dirname, 'hello.html'));
})

// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
app.get('*',function (req, res) {
  res.writeHead(404, 'Not Found');
  res.end();
});

var portnb = 3009

app.listen(portnb, "192.168.0.10");

console.log('Listening on port:' + portnb)
