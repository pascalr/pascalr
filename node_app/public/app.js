function filenameChanged(name) {
  console.log('Filename change works! : ' + name)
}

$.getJSON('http://localhost:3000/test', function(data) {
  const items = data.map(function(elem) {
    const val = '<li><a href="'+elem+'">🔎</a> &nbsp; &#x1f4c4;<span class="size">174 bytes</span><input type="text" name="filename" onchange="filenameChanged()" value="'+elem+'" class="nothing"/></li>'
    return val
  })
  //$("#root").html('This is a test')
  $("#root").html(items.join(''))
});

