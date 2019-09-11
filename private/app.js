'use strict'

const e = React.createElement

class Item extends React.Component {
  constructor(props) {
    super(props)
    this.state = {elem: props.elem}
  }
  onNameChange = (event) => {
    const args = {oldName: this.state.elem, newName: event.target.value}
    this.setState({elem: event.target.value})
    $.post('http://localhost:3000/renameFile', args, function(data) {
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

class ItemList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  componentDidMount = () => {
    $.getJSON('http://localhost:3000/files', (data) => {
      this.setState({data})
    });
  }

  render() {
    const {filter, selectedFilterTags, selectedItem} = this.props
    const {data} = this.state

    if (!data) return null

    const items = data.map(function(elem,i) {
      const filterVals = filter.split(' ')
      const filters = [...filterVals, ..._.keys(selectedFilterTags)]

      if (shouldFilter(elem, filters)) return null

      const selected = selectedItem === i
      return e('li', {key: i}, e(Item, {elem, selected}))
    })

    return e('div',null,items)
  /*$("#root").html(items.join(''))
  if (!window.selectedItem)
    window.selectedItem = 0
  $('li')[window.selectedItem].setAttribute("selected", "true")*/

  }
}

const SuggestSearch = (props) => {
  return props.filter ? 'Search google for: ' + props.filter : null
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {filter: '', selectedFilterTags: {}, selectedItem: 0}
  }

  onKeyDown = (event) => {
    const key = event.key
    if (key === 'Enter') {
      //window.location.href = filterVal;
    } else if (key === 'ArrowDown') {
      console.log('ArrowDown')
      this.setState({selectedItem: this.state.selectedItem + 1})
    } else if (key === 'ArrowUp') {
      console.log('ArrowUp')
      this.setState({selectedItem: this.state.selectedItem - 1})
    } else {
      console.log('key = ' + key)
      const filterVal = event.target.value + key
      this.setState({filter: filterVal})
    }
  }

  filterTagClick = (event) => {
    console.log('filterTagClick')
    let selectedFilterTags = {...this.state.selectedFilterTags}
    if (selectedFilterTags[event.target.alt]) {
      selectedFilterTags = _.omit(selectedFilterTags, event.target.alt)
    } else {
      selectedFilterTags[event.target.alt] = true
    }
    this.setState({selectedFilterTags})
  }

  render() {

    const {selectedFilterTags, filter, selectedItem} = this.state

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

    return e(
      'div', null, 
        e(SideMenu, {filterTags, filterTagClick: this.filterTagClick, selectedFilterTags}),
        e('div', {id: 'filterValDiv'},
          e('span', {onClick: clearFilter}, '❌'),
          ' ',
          e('input', {id: 'filterVal', type: 'text', onKeyDown: this.onKeyDown, autoFocus: true})
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

          e('form', {action: '/newFile', method: 'post', target: 'dummyframe'},
            e('input', {type: 'submit', value: 'New File'})
          ),
          
          e(SuggestSearch, {filter}),
          
          e(ItemList, {filter, selectedFilterTags, selectedItem})
        )
      )
  }
}

ReactDOM.render(e(App), document.querySelector('#app'));

/*class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return e(
      'button',
      { onClick: () => this.setState({ liked: true }) },
      'Like'
    );
  }
}*/
