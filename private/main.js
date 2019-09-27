/*function printFiles(data) {
  const items = data.map(function(elem) {
    const name = encodeURIComponent(elem)
    return `
    <li>
      <a href="../data/${name}">🔎</a>
      <a href="../data/${name}?contentType=text">📖</a> 
      <a href="edit/${name}">✏️</a> 
      <span onclick="deleteFile('${name}')">❌</span> 
      &nbsp;
      &#x1f4c4;
      <input type="text" name="filename" onfocus="this.oldValue = this.value;"
             onchange="filenameChanged(this);this.oldValue = this.value;" size="64" value="${elem}" class="nothing"/>
    </li>`
  })
  $("#root").html(items.join(''))
  if (!window.selectedItem)
    window.selectedItem = 0
  $('li')[window.selectedItem].setAttribute("selected", "true")
}*/

/*function loadFiles() {
  console.log('loading files')
  $.getJSON('http://localhost:3000/files', function(data) {
    printFiles(data)
  });
}*/

/*function searchKeyDown(key) {
  if (key === 'Enter') {
    if (getFilterList().length === $('li').length) {
      const filterVal = $("#filterVal")[0].value
      window.location.href = filterVal;
    }
  } else if (key === 'ArrowDown') {
    console.log('ArrowDown')
    const nbItems = $('li').length - getFilterList().length
    window.selectedItem = window.selectedItem + 1
    if (window.selectedItem >= nbItems) {
      window.selectedItem = nbItems
    }
  } else if (key === 'ArrowUp') {
    console.log('ArrowUp')
    const nbItems = getFilterList().length
    window.selectedItem = window.selectedItem > 0 ? window.selectedItem - 1 : 0
  } else {
    console.log('key = ' + key)
    filter()
    const filterVal = $("#filterVal")[0].value
    $('#suggestSearch').html('Search google for: ' + filterVal)
  }
}*/

function deleteFile(name) {
  if (confirm('Are you sure you want to delete "' + decodeURIComponent(name) + '" ?')) {
    $.ajax({
      url: '/deleteFile/'+name,
      type: 'DELETE',
      success: function(result) {
          // Do something with the result
      }
    });
  }
}

/*function filenameChanged(args) {
  $.post('http://localhost:3000/renameFile', {oldName: args.value, newName: args.oldValue}, function(data) {
    console.log('Filename changed')
  });
}*/

function shouldFilter(value, filters) {
  return !filters.map(f => {
    return ciIncludes(value,f);
  }).reduce((acc,curr) => acc && curr, true)
}

function toggleSelected(elem) {
  if (elem.getAttribute("selected")) {
    elem.removeAttribute("selected")
  } else {
    elem.setAttribute("selected", "true")
  }
  filter()
}

/*function getFilterList() {
  console.log('filtering')
  const list = $("li")
  const filterVal = $("#filterVal")[0].value
  const filterVals = filterVal.split(' ')
  let filterTags = $(".filterTag")
  filterTags = $.makeArray( filterTags )
  filterTags = $.map( filterTags, function( val, i ) {
    if (val.getAttribute("selected")) {
      return val.alt
    }
  });
  const filters = [...filterVals, ...filterTags]

  list.css("display", "block")
  return list.filter(function( index ) {
    return shouldFilter(list[index].children[4].value, filters) // FIXME: children[4]
    //return !ciIncludes(list[index].innerText,filterVal);
  })
}

function filter() {
  return getFilterList().css("display", "none")
}*/

function ciEquals(a, b) {
  return typeof a === 'string' && typeof b === 'string'
    ? a.localeCompare(b, undefined, { sensitivity: 'base'}) === 0
    : a === b;
}

// returns whether b is a substring of a
function ciIncludes(a, b) {
  if (!a) {return false}
  if (!b) {return true}

  for (let n = a.length - b.length; n >= 0; n--) {
    if (ciEquals(a.slice(n,n+b.length), b)) {
      return true
    }
  }
  return false
}
