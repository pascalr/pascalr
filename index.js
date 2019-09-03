var express = require('express');
var app = express();
var bodyParser = require('body-parser')
const fs = require('fs');
const path = require('path');
var _ = require('./common/lodash.min.js')
var he = require('he')

app.use(bodyParser.urlencoded({ extended: false }))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});

app.get('/rename/:old_name/:new_name', function(req, res) {
  console.log('works!!!!!!! ' + req.path)
  fs.rename(req.params.old_name, req.params.new_name, function (err) {
    if (err) throw err;
    console.log('renamed complete');
  })
})

app.get('/files', function(req, res) {
  console.log('It works. Thats amazing!!!!!!! ' + req.path)

  var names = null
  //const directoryPath = path.join(__dirname, 'Documents');
  fs.readdir(__dirname + '/data', function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    names = files.map(function (file) {
      //var name = dir + '/' + file;
      //if (fs.statSync(name).isDirectory()){
      //    getFiles(name, files_);
      //} else {
      //    files_.push(name);
      //}
      // Do whatever you want to do with the file
      return file;
    });
    res.send(names);
  });
})

app.get('/list', function(req, res) {
  console.log('GET ' + req.path)

  //const directoryPath = path.join(__dirname, 'Documents');
  fs.readdir(__dirname + '/..', function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    var listing = files.map(function (file) {
      console.log(file); 
      return {name: file, isDirectory: fs.statSync(name).isDirectory()};
    });
    res.send(listing);
  });
})

app.use(express.static("private"));

// res.sendFile('test.html');
// res.sendFile('test.html', { root: __dirname });
  
/*  const before = new Date().getMilliseconds()
  const val = "hello this is a test"
  res.send(val);
  const after = new Date().getMilliseconds()
  console.log('get: ' + req.path + ' in ' + (after - before) + ' ms.')*/

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

// TODO: read this
// https://blog.soshace.com/en/programming-en/node-lessons-safe-way-to-file/

// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
app.get('*',function (req, res) {

  console.log('GET * path=' + req.path);

  var filePath = '.' + req.url;
  if (filePath == './')
    filePath = './public/index.html';

  filePath = decodeURIComponent(filePath)

  var extname = path.extname(filePath);

  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };
  var contentType = map[extname] || 'text/html'
  //var contentType = 'text/plain'

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                console.log('error ENOENT... filepath: ' + filePath);
                fs.readFile('./404.html', function(error, content) {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                });
            }
            else {
                console.log('error...');
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                res.end(); 
            }
        }
        else {
            console.log('no error...');
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });


});

var port = 3000

app.listen(port);

console.log('Listening on http://localhost:' + port)