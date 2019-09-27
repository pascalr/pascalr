'use strict'

const e = React.createElement

console.log('show.js')
$.get('http://localhost:3000/getFile'+window.location.pathname.slice(5), function(data) {
  console.log('Got file: ' + window.location.pathname)
  $("#root").html(data)

  document.getElementsByTagName("body")[0].style.display = "block";
});

const htmlFilename = window.location.pathname.slice(6)
const filename = decodeURIComponent(htmlFilename)

ReactDOM.render(e('a', {href: `http://localhost:3000/edit/${htmlFilename}`}, 'edit'), document.querySelector('#editLink'));
