var express = require('express');
var app = express();
const fs = require('fs');
const path = require('path');
var _ = require('./common/lodash.min.js')

var sys = require('util')
var exec = require('child_process').exec;

const SerialPort = require('serialport');

var Gpio = require('onoff').Gpio;




// ---------------- INIT --------------------
var ip_address = null
Object.values(require('os').networkInterfaces()).forEach(function (ifaces) {
  const iface = ifaces[0]
  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
  if (!('IPv4' !== iface.family || iface.internal !== false)) {
    ip_address = iface.address
  }
})
// -------------- END INIT ------------------

var myWorker = new Worker('firmware.js');
myWorker.postMessage("hello");
myWorker.postMessage({name:"name value"});

app.get('/',function (req, res) {
  res.sendFile(path.join(__dirname, 'data/Ma machine.html'));
})

app.get('*',function (req, res) {
  res.writeHead(404, 'Not Found');
  res.end();
});

var portnb = 3009

app.listen(portnb, ip_address);

console.log(`Listening on ${ip_address}:${portnb}`)
