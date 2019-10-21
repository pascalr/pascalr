'use strict'

const e = React.createElement

function deleteFile(name, callback) {
  if (confirm('Are you sure you want to delete "' + name + '" ?')) {
    $.ajax({
      url: '/deleteFile',
      type: 'DELETE',
      data: {filename: name},
      success: callback
    });
  }
}

function rIcon(filename) {
  return e('img', {src: `/icon/${filename}`, className: 'clickable', style: {filter: 'invert(1)', marginTop: '4px'}, alt: filename, height: 24, width: 24})
}

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
    this.state = {showActionDropdown: false, marginWidth: '15%'}
  }

  render() {
    const {showActionDropdown, marginWidth} = this.state
   
    return e('div', {className: 'navbar'},
      e('a', {href: 'http://localhost:3000/'}, 'Home'),
      e('a', {href: `http://localhost:3000/edit/${encodeURIComponent(filename)}`}, 'Edit'),
      e('div', {className: 'clickable', onClick: () => deleteFile(filename, () => {window.location.href = "/"})}, 'Delete'),
      e('a', {href: `http://localhost:3000/publish/${encodeURIComponent(filename)}`}, 'Publish'),
      e('div', {className: 'dropdown'},
        e('button', {className: 'dropbtn', onClick: () => {this.setState({showActionDropdown: !showActionDropdown})}}, 'Actions', e('i', {className: 'fa fa-caret-down'})),
        showActionDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
          e('div', null, 'Show 1'),
          e('div', null, 'Show 2'),
        ) : null,
      ),
      e('span', {onClick: () => {
        if (marginWidth === '0%') {
          $('#root').css('margin-left', '15%')
          $('#root').css('margin-right', '15%')
          this.setState({marginWidth: '15%'})
        } else if (marginWidth === '15%') {
          $('#root').css('margin-left', '0%')
          $('#root').css('margin-right', '0%')
          this.setState({marginWidth: '0%'})
        }
      }}, rIcon('aspect_ratio-24px.svg')),
      e('input', {id: 'filterVal2', onKeyDown: this.onKeyDown, type: 'text', value: this.state.query, onChange: ({target}) => {this.setState({query: target.value})}}),
    )
  }
}

ReactDOM.render(e(ShowNav), document.querySelector('#navbar'));
