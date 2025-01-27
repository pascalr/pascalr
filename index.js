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


COMMANDS = {
  ls: {cmd: "ls -la"},
  firefox: {cmd: "firefox"},
  resetSound: {cmd: "pulseaudio -k && sudo alsa force-reload"},
  dota2: {cmd: "steam steam://rungameid/570"},
  civ6: {cmd: "steam steam://rungameid/289070"},
  csgo: {cmd: "steam steam://rungameid/730"},
  chromium: {cmd: "chromium-browser"},
  freecad: {cmd: "freecad"},
  marioKart: {cmd: "dolphin-emu --exec='/home/pascalr/games/Mario Kart Wii.wbfs'"},
  // FIXME: SANITIZE INPUT
  setVolume: {fn: (query) => (`for SINK in \`pacmd list-sinks | grep 'index:' | cut -b12-\`
do
  pacmd set-sink-volume $SINK ${query.volume}
done`)},
  arduino: {fn: (query) => (`echo ${query.cmd} > /dev/ttyACM0`)}
}

//65536

function puts(error, stdout, stderr) { sys.puts(stdout) } // Is that necessary?

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images')
  },
  filename: function (req, file, cb) {
    console.log(file)
    cb(null, Date.now() + '_' + file.originalname)
  }
})

var upload = multer({ storage: storage })

// CLASSES

class Upper extends Transform {
  constructor(options) {
    super(options);
  }
  _transform(data, encoding, callback) {
    this.push(data.toString().toUpperCase());
    callback();
  }
}

class HtmlSpacer extends Transform {
  constructor(options) {
    super(options);
  }
  _transform(data, encoding, callback) {
    this.push(data.toString().replace(/\n/g, '<br>'));
    callback();
  }
}

/*class AccentRemover extends Transform {
  constructor(options) {
    super(options);
  }
  _transform(data, encoding, callback) {
    this.push(data.toString().replace(/\n/g, '<br>'));
    callback();
  }
}*/

// CONSTANTS

const DATA_PATH = path.join(__dirname, 'data');

// FUNCTIONS

function parseTitleTags(str) {
  return str.split('#').slice(1)
}

function parseTitleName(str) {
  return str.split('#')[0]
}

function removeAccents(obj) {
  if (typeof obj === 'string') {
    return obj.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  } else if (obj) {
    return obj.map(str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
  }
  return obj
}

// Search index

 elasticlunr.clearStopWords();

console.log('Generating elasticlunr index...')

const index = elasticlunr(function () {
    this.addField('title');
    this.addField('tags');
    this.addField('content');
    this.setRef('id');
})
// this.addField('content');

function addToIndex(filename, content) {
  // TODO: Add the content of all human readable files to the content field of the index.
  let doc = {}
  doc.title = removeAccents(parseTitleName(filename));
  doc.tags = removeAccents(parseTitleTags(filename));
  if (content) {doc.content = removeAccents(content.toString());}
  doc.id = filename
      
  //console.log(`Adding file ${file} to the index. Title = ${doc.title}, tags = ${doc.tags}, id = ${doc.id}`)
  index.addDoc(doc)
}

function removeFromIndex(filename) {

  let doc = {}
  doc.title = removeAccents(parseTitleName(filename));
  doc.tags = removeAccents(parseTitleTags(filename));
  doc.id = filename

  index.removeDoc(doc)
}

// callback(err, filename)
function forEachFile(dir, callback) {
  fs.readdir(dir, function(err, list) {
    if (err) return callback(err);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          forEachFile(file, callback)
        } else {
          callback(null, file)
        }
      })
    })
  })
}

// generate template list
var templates = {} 
forEachFile(path.join(DATA_PATH, 'templates'), function(err, file) {
  fs.readFile(file, function(error, content) {
    if (error) {console.log('Unable to read data file: ' + error); throw error}
    templates[path.basename(file)] = content.toString()
  })
})

// generate style list
var styles = {} 
forEachFile(path.join(DATA_PATH, 'styles'), function(err, file) {
  fs.readFile(file, function(error, content) {
    if (error) {console.log('Unable to read data file: ' + error); throw error}
    styles[path.basename(file)] = content.toString()
  })
})

forEachFile(DATA_PATH, function(err, file) {
  fs.readFile(file, function(error, content) {
    if (error) {console.log('Unable to read data file: ' + error); throw error}
    addToIndex(path.basename(file), content)
  })
})

/*fs.readdir(DATA_PATH, function (err, files) {
  if (err) {console.log('Unable to read data directory: ' + err); throw err}

  files.forEach(function (file) {

    fs.readFile(path.join(DATA_PATH, file), function(error, content) {
      if (error) {console.log('Unable to read data file: ' + error); throw error}

      addToIndex(file, content)
    });
  });
})*/

//app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});

app.post('/saveImage', upload.single('blob'), function(req, res, next) {

  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  console.log(file)
  res.send(file.filename)

  /*console.log(req.data)
  console.log(req.body.data)
  console.log(req.body)
  console.log(req.body.get('id'))
  const blob = req.body.blob
  //const id = req.body.id
  const id = `${Date.now()}_${blob.name}`*/

  /*fs.writeFile('images/'+filename, null, { flag: 'wx' }, (err) => {
    if (err) throw err;
    addToIndex(filename)
    console.log('The file has been saved!');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('The file has been saved!', 'utf-8');
  });*/

})

app.post('/renameFile', function(req, res) {

  if (!req.body.newName) return null

  console.log('works!!!!!!! ' + req.path)
  console.log(req.body)
  fs.rename("data/"+req.body.oldName, "data/"+req.body.newName, function (err) {
    if (err) throw err;
    removeFromIndex(req.body.oldName)
    addToIndex(req.body.newName)
    console.log('renamed complete');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('The file has been saved!', 'utf-8');
  })
})

app.post('/newFile', function(req, res) {
  console.log('Creating new file.')
  const filename = req.body.newFilename || ' untitled_'+Date.now()

  fs.writeFile('data/'+filename, null, { flag: 'wx' }, (err) => {
    if (err) throw err;
    addToIndex(filename)
    console.log('The file has been saved!');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('The file has been saved!', 'utf-8');
  });

  //console.log(html)
})

app.delete('/deleteFile', function(req,res) {
  console.log('/deleteFile: ' + req.body.filename)
  fs.unlink('data/'+req.body.filename, (err) => {
    if (err) throw err;
    removeFromIndex(req.body.filename)
    console.log(`path/${req.body.filename} was deleted`);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('The file has been deleted!', 'utf-8');
  });
})

app.post('/save', function(req, res) {
  console.log('saving')
  const content = req.body.content
  const filename = req.body.filename
  
  console.log(content)

  fs.writeFile('data/'+filename, content, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('The file has been saved!', 'utf-8');
  });
})

app.post('/bookmark', function(req, res) {
  const filename = req.body.name
  const value = req.body.link

  const html = `<!DOCTYPE html>
      <html>
         <body>
            <script type="text/javascript">
              window.location.href = "${value}";
            </script>
         </body>
      </html>`

  fs.writeFile('data/'+filename, html, { flag: 'wx' }, (err) => {
    if (err) throw err;
    addToIndex(filename)
    console.log('The file has been saved!');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('The file has been saved!', 'utf-8');
  });

  //console.log(html)
})

app.get('/listeTemplates', function(req, res) {
  res.send({templates})
})

app.get('/listeStyles', function(req, res) {
  res.send({styles})
})

app.get('/listeRecettes', function(req, res) {
  fs.readdir(__dirname + '/data', function (err, files) {
    if (err) {return console.log('Unable to scan directory: ' + err); throw err;} 

    const recettesPublic = files.filter(f => (f.includes('#recette') && f.includes('#public')))

    res.send({data: recettesPublic});
  });
})

app.get('/search/:query?', function(req, res) {
  const query = removeAccents(decodeURIComponent(req.params.query))
  console.log('Searching for query = ' + query)

  if (query && query !== 'undefined') {
    
    const withoutContentResults = index.search(query, {
      fields: {
          content: {boost: 0},
          title: {boost: 2},
          tags: {boost: 1}
      },
      //bool: "OR",
      expand: true
    });

    const shouldUseSearchEngine = _.isEmpty(withoutContentResults)

    const results = index.search(query, {
      fields: {
          content: {boost: 0.1},
          title: {boost: 2},
          tags: {boost: 1}
      },
      //bool: "OR",
      expand: true
    });
    //const results = index.search(query)

    res.send({data: results.map(e => e.ref), shouldUseSearchEngine})

  } else {
    // List all files with pinned one at the top
    fs.readdir(__dirname + '/data', function (err, files) {
      if (err) {return console.log('Unable to scan directory: ' + err); throw err;} 

      const filesWithPins = files.map(f => ({name: f, tagVal: f.includes('#evt') ? 1 : f.includes('#pin') ? 2 : f.includes('#todo') ? 3 : 4}))
      const sortedFiles = _.sortBy(filesWithPins, ['tagVal', 'name']).map(f => f.name)

      res.send({data: sortedFiles});
    });
  }

  /*} else {
    fs.readdir(__dirname + '/data', function (err, files) {
      if (err) {return console.log('Unable to scan directory: ' + err); throw err;} 
      res.send(files);
    });
  }*/
})

app.get('/getFile/:filename', function(req, res) {

  let filePath = decodeURIComponent(req.params.filename)
  //const extension = filePath.split('.').pop();
  //if (extension === 'html') { // The files in data are not stored with .html, (though maybe they should.
  //  filePath = filePath.slice(0,-5)
  //}

  fs.readFile('data/'+filePath, function(error, content) {
    if (error) {
      if(error.code == 'ENOENT'){
        console.log('error ENOENT... filepath: ' + filePath);
        fs.readFile('./404.html', function(error, content) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        console.log('error...');
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
        res.end(); 
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(content, 'utf-8');
    }
  })
})

app.get('/show/:filename', function(req, res) {
  res.sendFile(path.join(__dirname, 'private/show.html'));
})

app.get('/edit/:filename', function(req, res) {
  res.sendFile(path.join(__dirname, 'private/edit.html'));
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

// TODO: read this
// https://blog.soshace.com/en/programming-en/node-lessons-safe-way-to-file/

app.get('/common/*',function (req, res) {
  res.sendFile(path.join(__dirname, req.path));
})

app.get('/icon/*',function (req, res) {
  res.sendFile(path.join(__dirname, req.path));
})

app.get('/private/*',function (req, res) {
  res.sendFile(path.join(__dirname, req.path));
})

app.get('/images/*',function (req, res) {
  res.sendFile(path.join(__dirname, req.path));
})

const CODE_MOVE = "M" // () changes mode to move (maybe useless)
const CODE_GRAB = "G" // () close the claw until pressure switch is closed
const CODE_RELEASE = "R" // () open the claw to position 0
const CODE_X = "X" // (mm) absolute position to move to
const CODE_Y = "Y" // (mm) absolute position to move to
const CODE_Z = "Z" // (mm) absolute position to move to
const CODE_ADD = "A" // (qty) tilts until weight lost is equal to qty
const CODE_END = "\n" // () do the command, separates all the small commands
const CODE_TERMINATE = ";" // () send the command

var pince = {
  x: 0,
  y: 0,
  z: 0,
}

var CUISEUR = 1;

var INGREDIENTS_POSITION = {
  riz: {x: 50, y: 100}
}

function grabIngredient(ingredient) {
  if (!INGREDIENTS_POSITION[ingredient]) {throw "Unkown ingredient " + ingredient}
  return retract() + CODE_MOVE + CODE_X + INGREDIENTS_POSITION[ingredient].x + CODE_Y + INGREDIENTS_POSITION[ingredient].y + CODE_END + grab()
}

function grab() {
  return CODE_MOVE + CODE_Z + "500" + CODE_END
}

function removeCap() {
}

function moveToContainer() {
}

function add() {

}

function retract() {
  return pince.z <= 0 ? "" : "G00Z0\n"
}

app.post('/run/recette',function (req, res) {
  console.log('HERE! About to run command: ' + req.params.command)
  var gcode = ""
  var selectedContainerType = 0;
  var selectedContainer = 0;
  for (var i = 0; i < req.body.in.length; i++) {
    const cmd = req.body.in[i]
    if (cmd === "Cuiseur") {
      selectedContainerType = CUISEUR;
      selectedContainer = req.body.in[i+1];
      i++;
    } else if (cmd === "Ajouter") {
      const qty = req.body.in[i+1];
      const ingredient = req.body.in[i+2];
      gcode += grabIngredient(ingredient)
      gcode += retract()
      // Grab the ingredient
      // Move to the selected container
      // Drop the required amount into the container
      // Retract
    } else if (cmd === "Verser") {
    } else if (cmd === "Melanger") {
    } else if (cmd === "Cuire") {
    } else {
      console.log('Unkown command: ' + cmd)
      res.end('Unkown command: ' + cmd)
      return false;
    }
  }
  gcode += CODE_TERMINATE
  console.log(req)
})

app.get('/run/:command',function (req, res) {

  console.log('About to run command: ' + req.params.command)
  const cmd = COMMANDS[req.params.command]
  if (!cmd) {
    console.log('Unkown command ' + req.params.command)
    return
  }
  const toExe = (cmd.fn) ? cmd.fn(req.query) : cmd.cmd
  exec(toExe, function(err, stdout, stderr) {
    console.log(err)
    console.log(stderr)
    console.log(stdout);
    res.set({ 'content-type': 'text/plain; charset=utf-8' });
    res.send(stdout)
  });
})

app.get('/publierRecettes', function(req,res) {
  exec("rm ../recettesPascal/data/*", function(err, stdout, stderr) {
    exec("cp data/*#recette*#public* ../recettesPascal/data", function(err, stdout, stderr) {
      res.end('done')
    })
    exec("cp data/*#public*#recette* ../recettesPascal/data", function(err, stdout, stderr) {
      res.end('done')
    })
  })
})

app.get('/resizeImages', function(req,res) {
  exec("find ../recettesPascal/images -iname '*.jpg' -exec convert \\{} -verbose -resize 400x400\\> \\{} \\;", function(err, stdout, stderr) {
  })
  exec("find ../recettesPascal/images -iname '*.png' -exec convert \\{} -verbose -resize 400x400\\> \\{} \\;", function(err, stdout, stderr) {
  })
  res.end('done')
})

//app.use('/scripts', express.static(__dirname + '/node_modules/quill-better-table/dist/'));


// ************ ARDUINO ********************
var arduinoLog = {}
var arduinoInfo = {}
var arduinoInfoChanged = false

const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600, autoOpen: false });
const parser = port.pipe(new Readline({ delimiter: '\n' }));
port.on("open", () => {
  arduinoLog = {}
  console.log('serial port open');
});
parser.on('data', data =>{
  const timestamp = Date.now()
  const str = data.toString()
  if (str[0] === '-') {
    const splited = str.split(':')
    const key = splited[0].trim().substr(1).trim()
    const value = splited[1].trim()
    arduinoInfo[key] = value
    arduinoInfoChanged = true
  } else {
    arduinoLog[timestamp.toString()] = str
  }
  console.log('got word from arduino:', str);
});

function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

app.get('/closeArduino', function(req, res) {
  port.close(function (err) {
    console.log(`${new Date().toUTCString()} - Port closed.`, err);
  })
  res.end()
})

app.get('/reloadArduino', function(req, res) {
  console.log('GET path=' + req.path);
  console.log('*** reloadingArduino ***')
  port.close(function (err) {
    console.log(`${new Date().toUTCString()} - Port closed.`, err);
    port.open(function (err) {
      console.log(`${new Date().toUTCString()} - Port opened.`, err);
      if (err) {
        return console.log('Error opening port: ', err.message)
      }
  
      // Because there's no callback to write, write errors will be emitted on the port:
      //port.write('main screen turn on')
    })
  })
  res.end()
})

app.get('/poll/arduino', nocache, function(req, res) {
  console.log('poll/arduino')
  //res.set('Content-Type', 'application/json');
  //res.writeHead(200, { 'Content-Type': 'application/json' });
  const keys = Object.keys(arduinoLog).slice()
  let log = ""
  keys.forEach((key) => {
    log = log + arduinoLog[key] + "\n"
    delete arduinoLog[key]
  })
  //res.status(200).send({log, info: (arduinoInfoChanged ? arduinoInfo : null)})
  res.status(200).json({log, info: (arduinoInfoChanged ? arduinoInfo : null)})

  arduinoInfoChanged = false
  //res.end();
})
// *****************************************


// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
app.get('*',function (req, res) {

  console.log('GET * path=' + req.path);

  var filePath = '.' + req.path;
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
  if (req.query.contentType && req.query.contentType == 'text')
    contentType = 'text/plain'

  console.log(extname)
  if (extname === '.html') {
    filePath = path.join('./data/',filePath).slice(0,-5)
    console.log(filePath)
  }

  res.set({ 'content-type': 'text/html; charset=utf-8' });
  //res.set({ 'content-type': 'charset=utf-8' });

  const stream = fs.createReadStream(filePath, {encoding: 'utf-8'});

  stream.on('error', function(error) {
    console.log('File not found')
    res.writeHead(404, 'Not Found');
    res.end();
  });

  //stream.pipe(new HtmlSpacer()).pipe(res)
  stream.pipe(res)
});

// todo: if 'local', get local ip
var server_address = process.argv[2] || 'localhost'
var portnb = process.argv[3] || '3000'

if (server_address === 'local' || server_address === 'lan') {
  var ip_address = null
  Object.values(require('os').networkInterfaces()).forEach(function (ifaces) {
    const iface = ifaces[0]
    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
    if (!('IPv4' !== iface.family || iface.internal !== false)) {
      ip_address = iface.address
    }
  })
  server_address = ip_address
}

app.listen(portnb, server_address);
//app.listen(portnb, '192.168.0.20');
//app.listen(portnb);

console.log('Listening on ' + server_address + ' port ' + portnb)
