// &#128193;
// TODO: Make a model to simplify the passing of a model
// Here I need Filename(name: string, type: boolean)

$.getJSON('http://localhost:3000/test', function(data) {
  const items = data.map(function(elem) {
    const val = '<li><a href="'+elem+'">🔎</a> &nbsp; &#x1f4c4;<span class="size">174 bytes</span><input type="text" name="filename" onchange="filenameChanged()" value="'+elem+'" class="nothing"/></li>'
    return val
  })
  $("#root").html(items.join(''))
});

