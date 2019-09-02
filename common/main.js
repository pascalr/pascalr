function filenameChanged() {
  console.log('Filename change works! : ' + name)
}

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

function filter() {
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
  list.filter(function( index ) {
    return shouldFilter(list[index].innerText, filters)
    //return !ciIncludes(list[index].innerText,filterVal);
  }).css("display", "none")
}

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
