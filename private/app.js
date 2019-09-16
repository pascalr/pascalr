'use strict'

const e = React.createElement

class Item extends React.Component {
  constructor(props) {
    super(props)
    this.state = {elem: props.elem}
  }
  onNameChange = (event) => {
    const args = {oldName: this.state.elem, newName: event.target.value}
    $.post('http://localhost:3000/renameFile', args, data => {
      this.setState({elem: args.newName})
      console.log('Filename changed')
    });
  }
  render() {
    const {selected} = this.props
    const {elem} = this.state
    const name = encodeURIComponent(elem)

    return e(
      'div', {isselected: selected.toString()}, 
        e('a', {href: `../data/${name}`}, '🔎'),
        e('a', {href: `../data/${name}?contentType=text`}, '📖'),
        e('a', {href: `edit/${name}`}, '✏️'),
        e('span', {onClick: () => deleteFile(name)}, '❌'),
        e('input', {type: 'text', name:'filename', size: 64, value: elem, className: 'nothing',
          onChange: this.onNameChange}
    ))
      //&nbsp;
      //&#x1f4c4;
      //<input type="text" name="filename" onfocus="this.oldValue = this.value;"
      //       onchange="filenameChanged(this);this.oldValue = this.value;" size="64" value="${elem}" class="nothing"/>
  }
}

class FilterTag extends React.Component {
  render() {
    const {src, name, onClick, selected} = this.props

    return e('img', {src, alt: name, className: 'filterTag', tagselected: (selected || false).toString(), onClick})
  }
}

function getFilters() {
  /*console.log('filters')
  let filterTags = $(".filterTag")
  filterTags = $.makeArray( filterTags )
  filterTags = $.map( filterTags, function( val, i ) {
    if (val.getAttribute("selected")) {
      return val.alt
    }
  });
  return filterTags*/
  //return filterTags.map(a => a.props.name)
  return ''
}

class SideMenu extends React.Component {
  render() {
    const {filterTags, selectedFilterTags, filterTagClick} = this.props

    return e('div', {id: 'sideMenu'}, filterTags.map((a,i) => {
      const selected = selectedFilterTags ? selectedFilterTags[a.name] : false
      return e(FilterTag, {src: a.src, name: a.name, onClick: filterTagClick, key: `filterTag${i}`, selected})
    }))
  }
}

const SuggestCreate = (props) => {
  if (!props.filter) return null

  return e('form', {action: '/newFile', method: 'post', target: 'dummyframe', style: {display: 'inline'}},
            e('input', {type: "hidden", id: "newFilename", name: "newFilename", value: props.filter}),
            e('input', {type: 'submit', value: 'New File', style: {float: 'right', marginRight: '200px'}})
          )
}

const SuggestSearch = (props) => {
  if (!props.filter) return null

  const url = `https://www.google.com/search?q=${props.filter}`

  return e('span', {onClick: (event) => {window.location.href = url}, className: 'clickable',
    isselected: props.selected.toString()}, 'Search google for: ' + props.filter)
}

const Suggest = (props) => {
  if (!props.filter) return null

  return e('div', null, e(SuggestSearch, props), e(SuggestCreate, props))
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {filter: '', selectedFilterTags: {}, selectedItem: 1, nbItems: 0}
  }

  componentDidMount = () => {
    $.getJSON('http://localhost:3000/files', (data) => {
      this.setState({data}, this.updateFilteredItems)
    });
  }

  redirectToSearch(query) {
    const url = `https://www.google.com/search?q=${query}`
    window.location.href = url
  }

  onKeyDown = (event) => {
    const key = event.key
    if (key === 'Enter') {
      if (this.state.selectedItem === 0) {
        this.redirectToSearch(this.state.filter)
      }
    } else if (key === 'ArrowDown') {
      console.log('ArrowDown')
      if (this.state.selectedItem < this.state.filteredItems.length)
        this.setState({selectedItem: this.state.selectedItem + 1})
    } else if (key === 'ArrowUp') {
      console.log('ArrowUp')
      if (this.state.selectedItem > 0)
        this.setState({selectedItem: this.state.selectedItem - 1})
    }
  }

  onKeyPress = (event) => {
    const key = event.key
    console.log('key = ' + key)
    const filterVal = event.target.value + key
    this.setState({filter: filterVal}, this.updateFilteredItems)
  }

  updateFilteredItems = () => {
    let {data, filter, selectedFilterTags, selectedItem} = this.state
    if (!data) return
    
    const filteredItems = data.filter(elem => {
      const filterVals = filter.split(' ')
      const filters = [...filterVals, ..._.keys(selectedFilterTags)]

      return !shouldFilter(elem, filters)
    })

    if (selectedItem >= filteredItems.length) {
      selectedItem = filteredItems.length
    }

    this.setState({filteredItems, selectedItem})
  }

  filterTagClick = (event) => {
    console.log('filterTagClick')
    let selectedFilterTags = {...this.state.selectedFilterTags}
    if (selectedFilterTags[event.target.alt]) {
      selectedFilterTags = _.omit(selectedFilterTags, event.target.alt)
    } else {
      selectedFilterTags[event.target.alt] = true
    }
    this.setState({selectedFilterTags}, this.updateFilteredItems)
  }

  render() {

    const {selectedFilterTags, filter, selectedItem, data, filteredItems} = this.state

    const filterTags = [
      {src: '../common/checklist.png', name: 'TODO'},
      {src: '../common/pin.png', name: 'pin'},
      {src: '../common/headphone.png', name: 'Music'},
      {src: '../common/accords.jpg', name: 'Accords'},
      {src: '../common/guitar.png', name: 'Guitar'},
      {src: '../common/film.png', name: 'Film'},
      {src: '../common/penguin.png', name: 'Recette'},
      {src: '../common/mic.png', name: 'Karaoke'},
    ]

    let itemList = null
    if (filteredItems) {
      const items = filteredItems.map((elem,i) => {
        const selected = selectedItem === i+1
        return e('li', {key: 'item'+i+elem}, e(Item, {elem, selected}))
      })

      itemList = e('div',null,items)
    }

    return e(
      'div', null, 
        e(SideMenu, {filterTags, filterTagClick: this.filterTagClick, selectedFilterTags}),
        e('div', {id: 'filterValDiv'},
          e('span', {onClick: clearFilter}, '❌'),
          ' ',
          e('input', {id: 'filterVal', type: 'text', onKeyPress: this.onKeyPress, onKeyDown: this.onKeyDown, autoFocus: true})
        ),
        e('div', {className: 'content'},
          e('iframe', {width: 0, height: 0, border: 0, style: {display: 'none'}, name: 'dummyframe', id: 'dummyframe'}),

          e('form', {action: '/bookmark', method: 'post', target: 'dummyframe'},
            'Link:',
            e('input', {type: 'text', name: 'link'}),
            'Name:',
            e('input', {type: 'text', name: 'name'}),
            e('input', {type: 'submit', value: 'Bookmark'})
          ),

          /*e('form', {action: '/newFile', method: 'post', target: 'dummyframe'},
            e('input', {type: 'submit', value: 'New File'})
          ),*/
          
          e(Suggest, {filter, selected: selectedItem === 0}),
          
          itemList
        )
      )
  }
}

ReactDOM.render(e(App), document.querySelector('#app'));
