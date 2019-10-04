'use strict'

const e = React.createElement

console.log('show.js')
$.get('http://localhost:3000/getFile'+window.location.pathname.slice(5), function(data) {
  console.log('Got file: ' + window.location.pathname)
  $("#root").html(data)

  document.getElementsByTagName("body")[0].style.display = "block";
});

const htmlFilename = window.location.pathname.slice(6)
const filename = decodeURIComponent(htmlFilename)

class ShowNav extends React.Component {
  constructor(props) {
    super(props)
    this.state = {showActionDropdown: false}
  }

  render() {
    const {showActionDropdown} = this.state
   
    return e('div', {className: 'navbar'},
      e('a', {href: 'http://localhost:3000/'}, 'Home'),
      e('a', {href: `http://localhost:3000/edit/${encodeURIComponent(filename)}`}, 'Edit'),
      e('div', {className: 'dropdown'},
        e('button', {className: 'dropbtn', onClick: () => {this.setState({showActionDropdown: !showActionDropdown})}}, 'Actions', e('i', {className: 'fa fa-caret-down'})),
        showActionDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
          e('div', null, 'Show 1'),
          e('div', null, 'Show 2'),
        ) : null,
      ),
      e('input', {id: 'filterVal2', onKeyDown: this.onKeyDown, type: 'text', value: this.state.query, onChange: ({target}) => {this.setState({query: target.value})}}),
    )
  }
}

ReactDOM.render(e(ShowNav), document.querySelector('#navbar'));
