var express = require('express');
var app = express();
var bodyParser = require('body-parser')
const fs = require('fs');
const filename = 'file.txt';
//fs.closeSync(fs.openSync(filename, 'w'));

app.use(bodyParser.urlencoded({ extended: false }))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});

app.use(express.static("public"));

app.get('/rename/:old_name/:new_name', function(req, res) {
  console.log('works!!!!!!! ' + req.path)
  fs.rename(req.params.old_name, req.params.new_name, function (err) {
    if (err) throw err;
    console.log('renamed complete');
  })
  //res.sendFile('test.html');
//  res.sendFile('test.html', { root: __dirname });
  
/*  const before = new Date().getMilliseconds()
  const val = "hello this is a test"
  res.send(val);
  const after = new Date().getMilliseconds()
  console.log('get: ' + req.path + ' in ' + (after - before) + ' ms.')*/
});

/*var express = require('express');
var app = express();
var editJsonFile = require("edit-json-file");
var bodyParser = require('body-parser')

// TODO: Specify the file to use from command line only. Don't use from the url.
// This touch the file to make sure it exists.
//const fs = require('fs');
//const filename = 'file.txt';
//fs.closeSync(fs.openSync(filename, 'w'));

var app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var args = process.argv.slice(2);
//Note that the first arg is usually the path to nodejs, and the second arg is the location of the script you're executing.

let dbName = null
if (args[0]) {
  dbName = args[0]
}

var files = {}
var historyFiles = {}
function filesByName(rawName) {
  const name = dbName || rawName
  if (!files[name]) {
    files[name] = editJsonFile(`${__dirname}/data/${name}.json`, {
      autosave: true
    });
  }
  return files[name]
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});
 
app.get('/:db/:path', function(req, res) {
  const before = new Date().getMilliseconds()
  const file = filesByName(req.params.db)
  const val = file.get(req.params.path)
  res.send(val);
  const after = new Date().getMilliseconds()
  console.log('get: ' + req.path + ' in ' + (after - before) + ' ms.')
});

app.put('/:db/:path', function(req, res) {
  console.log('set: ' + req.path)
  const file = filesByName(req.params.db)
  file.set(req.params.path, req.body.data)
  res.send('done');
});

app.delete('/:db/:path', function(req, res) {
  console.log('unset: ' + req.path)
  const file = filesByName(req.params.db)
  file.unset(req.params.path)
  res.send('done');
});*/

//app.get('*',function (req, res) {
//  console.log('no routes matches: ' + req.path)
//});

var port = 3000

app.listen(port);

console.log('Listening on http://localhost:' + port)
