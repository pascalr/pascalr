$.get('http://localhost:3000/getFile'+window.location.pathname, function(data) {
  console.log(data)
  $("#editTextArea").html(data)
  $("#filename").html(decodeURIComponent(window.location.pathname.substring(6)))
});

$("#hiddenInputFilename").attr('value', decodeURIComponent(window.location.pathname.substring(6)))
