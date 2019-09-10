'use strict'

const e = React.createElement

//React.createElement(component, props, ...children)

class Item extends React.Component {
  constructor(props) {
    super(props);
  }
  onNameChange = (oldName) => (event) => {
    return null
    const args = {oldName, newName: event.target.value}
    $.post('http://localhost:3000/renameFile', , function(data) {
      console.log('Filename changed')
    });
  }
  render() {
    const {elem,selected} = this.props
    const name = encodeURIComponent(elem)

    return e(
      'div', {isselected: selected.toString()}, 
        e('a', {href: "../data/${name}"}, '🔎'),
        e('a', {href: "../data/${name}?contentType=text"}, '📖'),
        e('a', {href: "edit/${name}"}, '✏️'),
        e('span', {onClick: () => deleteFile(name)}, '❌'),
        e('input', {type: 'text', name:'filename', size: 64, value: elem, className: 'nothing',
          onChange: this.onNameChange(elem)})
    )
      //&nbsp;
      //&#x1f4c4;
      //<input type="text" name="filename" onfocus="this.oldValue = this.value;"
      //       onchange="filenameChanged(this);this.oldValue = this.value;" size="64" value="${elem}" class="nothing"/>
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
    const {data} = this.state

    if (!data) return null

    const selectedItem = 3

    const items = data.map(function(elem,i) {
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
  }

  render() {
    return e(ItemList);
  }
}

const domContainer = document.querySelector('#app');
ReactDOM.render(e(App), domContainer);

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
