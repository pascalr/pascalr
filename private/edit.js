'use strict'

const e = React.createElement

class EditPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {content: ''}
  }

  componentDidMount() {
    const {filename} = this.props
    $.get('http://localhost:3000/getFile/'+encodeURIComponent(filename), (content) => {
      this.setState({content})
    });
  }

  saveClicked = (event) => {
    const {content} = this.state
    const {filename} = this.props
    $.post('http://localhost:3000/save', {content, filename}, data => {
      console.log('Document saved')
    });
  }

  render() {
    const {content} = this.state
    const {filename} = this.props
    return e('div', null,
      e('a', {href: 'http://localhost:3000/'}, 'Home'),
      e('span', null, 'Raw'),
      e('span', null, 'Chordify'),
      e('span', null, 'Remove \n'),
      e('span', null, 'Remove markup'),
      e('div', {className: 'content'},
        e('h1',{id: 'filename'},
          e('span', {style: {marginLeft: '50px'}}, filename),
          e('span', {style: {marginLeft: '50px'}},
            e('button', {onClick: this.saveClicked}, 'Save')
          )
        ),
        e('textarea', {value: content, rows: '40', cols: '180', onChange: ({target}) => {this.setState({content: target.value})}})
      )
    )
  }
}

const filename = decodeURIComponent(window.location.pathname.slice(6))

ReactDOM.render(e(EditPage, {filename}), document.querySelector('#editRoot'));
