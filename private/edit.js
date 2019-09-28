'use strict'

const e = React.createElement

class EditPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {content: ''}
    this.contentRef = React.createRef();
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

  chordifyClicked = (event) => {
    const content = '<pre>\n' + this.state.content + `</pre>\n<script>\n$('pre').css('column-count', '3')\n</script>`
    this.setState({content})
  }

  removeNewlinesClicked = (event) => {
    const content = this.state.content.replace(/^\s*\n/gm, '')
    this.setState({content})
  }

  insertText = (text, offset) => {
    let {content} = this.state
    const selectionStart = this.contentRef.current.selectionStart
    const selectionEnd = this.contentRef.current.selectionEnd
    console.log(content)
    console.log(this.contentRef.current.selectionStart)
    console.log(this.contentRef.current.selectionEnd)
    console.log(text)
    console.log(window.getSelection().toString())
    content = content.slice(0, selectionStart) + text.slice(0, offset) + content.slice(selectionStart, selectionEnd) + text.slice(offset) + content.slice(selectionEnd)
    this.setState({content}, () => {
      this.contentRef.current.focus()
      this.contentRef.current.selectionStart = this.contentRef.current.selectionEnd = selectionStart + offset
    })
  }

  handleChange = (event) => {
    this.setState({content: event.target.value})
  }

/*
    <b> - Bold text
    <strong> - Important text
    <i> - Italic text
    <em> - Emphasized text
    <mark> - Marked text
    <small> - Small text
    <del> - Deleted text
    <ins> - Inserted text
    <sub> - Subscript text
    <sup> - Superscript text
*/

  render() {
    const {content} = this.state
    const {filename} = this.props
    return e('div', null,
      e('div', {className: 'navigationMenu'},
        e('a', {href: 'http://localhost:3000/'}, 'Home'),
        e('a', {href: `http://localhost:3000/show/${encodeURIComponent(filename)}`}, 'Show'),
      ),
      e('div', {className: 'toolbarMenu'},
        e('span', null, 'Side preview'),
        e('span', {onClick: this.chordifyClicked}, 'Chordify'),
        e('span', {onClick: this.removeNewlinesClicked}, 'Remove newlines'),
        e('span', null, 'Remove <tags>'),
        e('span', {onClick: () => this.insertText('<pre>\n\n</pre>', 6) }, '<pre>'),
        e('span', {onClick: () => this.insertText('<ol>\n\n</ol>', 5) }, '<ol>'),
        e('span', {onClick: () => this.insertText('<ul style="list-style-type:disc;">\n\n</ul>', 35) }, '<ul>'),
        e('span', {onClick: () => this.insertText('<li></li>', 4) }, '<li>'),
        e('span', {onClick: () => this.insertText('<b></b>', 3) }, '<b>'),
        e('span', {onClick: () => this.insertText('<i></i>', 3) }, '<i>'),
        e('span', {onClick: () => this.insertText('<sub></sub>', 5) }, '<sub>'),
        e('span', {onClick: () => this.insertText('<script>\n\n</script>\n', 9) }, '<script>'),
        e('span', {onClick: () => this.insertText(`<!DOCTYPE html>
<html>
  <body>
    <script type="text/javascript">
      window.location.href = "";
    </script>
  </body>
</html>
          `, 98) }, 'redirect'
        ),

      ),
      e('div', {className: 'content'},
        e('h1',{id: 'filename'},
          e('span', {style: {marginLeft: '50px'}}, filename),
          e('span', {style: {marginLeft: '50px'}},
            e('button', {onClick: this.saveClicked}, 'Save')
          )
        ),
        e('textarea', {ref: this.contentRef, value: content, rows: '40', cols: '180', onChange: this.handleChange})
      )
    )
  }
}

const filename = decodeURIComponent(window.location.pathname.slice(6))

ReactDOM.render(e(EditPage, {filename}), document.querySelector('#editRoot'));
