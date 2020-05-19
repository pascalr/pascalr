const shell = require('child_process').execSync;
const fs = require('fs');
const path = require('path');
var _ = require('./common/lodash.min.js')

var output_dir = '../public_pascalr/'
  
shell(`rm -R ${output_dir}/*`);

var data_list = ([
  'desktop',
  'calc',
  "Liste d'épicerie",
]).map(s => path.join('data',s))
shell(`mkdir -p ${path.join(output_dir,'data')}`);

var list = [...data_list]
console.log(list)

for (let i = 0; i < list.length; i++) {
  fs.copyFile(list[i], path.join(output_dir,list[i])+'.html', (err) => {
    if (err) throw err;
  });
}

function cpDir(dir) {
  var output_path = path.join(output_dir,dir)
  shell(`mkdir -p ${output_path}`);
  shell(`cp -r ${dir}/* ${output_path}`);
}

cpDir('images')
