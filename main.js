function shouldFilter(value, filters) {
  return !filters.map(f => {
    console.log(value)
    console.log(f)
    return ciIncludes(value,f);
  }).reduce((acc,curr) => acc && curr, true)
}

function filter() {
  const list = $("li")
  const filterVal = $("#filterVal")[0].value
  const filterVals = filterVal.split(' ')

  list.css("display", "block")
  list.filter(function( index ) {
    return shouldFilter(list[index].innerText, filterVals)
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
