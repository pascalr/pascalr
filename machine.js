var express = require('express');
var app = express();
const fs = require('fs');
const path = require('path');
var _ = require('./common/lodash.min.js')

var sys = require('util')
var exec = require('child_process').exec;

const SerialPort = require('serialport');

//app.get('/home', function(req, res) {
//  res.send({templates})
//})

app.get('/hello',function (req, res) {
  console.log('Received command hello')
  //res.sendFile(path.join(__dirname, req.path));
  res.sendFile(path.join(__dirname, 'data/Ma machine'));
})

// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
app.get('*',function (req, res) {
  res.writeHead(404, 'Not Found');
  res.end();
});

var portnb = 3009

app.listen(portnb, "192.168.0.20");

console.log('Listening on port:' + portnb)
