const shell = require('child_process').execSync;
const fs = require('fs');
const path = require('path');
var _ = require('./common/lodash.min.js')

var output_root = '../public_pascalr/'
var output_dir = '../public_pascalr/show'
  
shell(`mkdir -p ${output_dir}`);
shell(`rm -R ${output_dir}`);
shell(`mkdir -p ${output_dir}`);

var data_list = [
  'calc',
  "Liste d'épicerie",
]

var list = [...data_list]
console.log(list)

for (let i = 0; i < list.length; i++) {
  shell(`cp "${path.join('data',list[i])}" "${path.join(output_dir,list[i])+'.html'}"`);
  //fs.copyFile(path.join('data',list[i]), path.join(output_dir,list[i])+'.html', (err) => {
  //  if (err) throw err;
  //});
}

shell(`cp data/desktop ../public_pascalr/`);

function cpDir(dir) {
  var output_path = path.join(output_dir,dir)
  shell(`mkdir -p ${output_path}`);
  shell(`cp -r ${dir}/* ${output_path}`);
}

cpDir('images')
