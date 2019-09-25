/*var quill = new Quill('#editor', {
  theme: 'snow'
});

console.log(quill.getContents())*/

console.log('show.js')
$.get('http://localhost:3000/getFile'+window.location.pathname.slice(5), function(data) {
  console.log('Got file: ' + window.location.pathname)
  $("#root").html(data)

  document.getElementsByTagName("body")[0].style.display = "block";
});
