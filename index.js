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

fs.readdir(DATA_PATH, function (err, files) {
  if (err) {console.log('Unable to read data directory: ' + err); throw err}

  files.forEach(function (file) {

    fs.readFile(path.join(DATA_PATH, file), function(error, content) {
      if (error) {console.log('Unable to read data file: ' + error); throw error}

      addToIndex(file, content)
    });
  });

})

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

  console.log('/getFile')

  const filePath = decodeURIComponent(req.params.filename)

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
      console.log('should be working no error...');
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

  res.set({ 'content-type': 'text/html; charset=utf-8' });
  //res.set({ 'content-type': 'charset=utf-8' });

  const stream = fs.createReadStream(filePath, {encoding: 'utf-8'});

  stream.on('error', function(error) {
    res.writeHead(404, 'Not Found');
    res.end();
  });

  //stream.pipe(new HtmlSpacer()).pipe(res)
  stream.pipe(res)
});

var port = 3000

app.listen(port);

console.log('Listening on http://localhost:' + port)
