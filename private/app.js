'use strict'

const e = React.createElement

//React.createElement(component, props, ...children)

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
        e('a', {href: "../data/${name}"}, '🔎'),
        e('a', {href: "../data/${name}?contentType=text"}, '📖'),
        e('a', {href: "edit/${name}"}, '✏️'),
        e('span', {onClick: () => deleteFile(name)}, '❌'),
        e('input', {type: 'text', name:'filename', size: 64, value: elem, className: 'nothing',
          onChange: this.onNameChange}
    )
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
      const selected = selectedFilterTags[a.name]
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
    const {filter} = this.props
    const {data} = this.state

    if (!data) return null

    const selectedItem = 3

    const items = data.map(function(elem,i) {
      const filterVals = filter.split(' ')
      const filters = [...filterVals, ...getFilters()]

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {filter: '', selectedFilterTags: {}}
  }

  onKeyDown = (event) => {
    const key = event.key
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
      //filter()
      const filterVal = $("#filterVal")[0].value
      this.setState({filter: filterVal})
      $('#suggestSearch').html('Search google for: ' + filterVal)
    }
  }

  filterTagClick = (event) => {
    const selectedFilterTags = {...this.state.selectedFilterTags}
    selectedFilterTags[event.target.name] = !selectedFilterTags[event.target.name]
    this.setState({selectedFilterTags})
  }

  render() {

    const {selectedFilterTags} = this.state

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
        e(SideMenu, {filterTags, filterTagClick: this.filterTagClick}, selectedFilterTags),
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
          
          e(ItemList, {filter: this.state.filter})
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
