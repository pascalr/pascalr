'use strict'

const e = React.createElement

function stripHtml(html){
  var doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

function icon(filename) {
  return e('img', {src: `/icon/${filename}`, alt: filename, height: 24, width: 24})
}

class EditPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {content: '', showSidePreview: false, showActionDropdown: false}
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

  removeHtml = (event) => {
    const content = this.state.content
    const selectionStart = this.contentRef.current.selectionStart
    const selectionEnd = this.contentRef.current.selectionEnd
    let replacedContent = stripHtml(content.slice(selectionStart, selectionEnd))
    // Remove now emtpy lines
    replacedContent = replacedContent.replace(/^\s*\n/gm, '')
    console.log('replacedContent')
    console.log(replacedContent)
    this.setState({content: content.slice(0, selectionStart) + replacedContent + content.slice(selectionEnd)})
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

   /*<div class="dropdown">
  <button onclick="myFunction()" class="dropbtn">Dropdown</button>
  <div id="myDropdown" class="dropdown-content">
    <a href="#">Link 1</a>
    <a href="#">Link 2</a>
    <a href="#">Link 3</a>
  </div>
</div>*/

  /*<div class="navbar">
  <a href="#home">Home</a>
  <a href="#news">News</a>
  <div class="dropdown">
  <button class="dropbtn" onclick="myFunction()">Dropdown
    <i class="fa fa-caret-down"></i>
  </button>
  <div class="dropdown-content" id="myDropdown">
    <a href="#">Link 1</a>
    <a href="#">Link 2</a>
    <a href="#">Link 3</a>
  </div>
  </div> 
</div>*/

  render() {
    const {content, showSidePreview, showActionDropdown} = this.state
    const {filename} = this.props

    const id = Date.now()

    return e('div', null,
      //e('div', {className: 'navigationMenu'},
      //),
      e('div', {className: 'navbar'},
        e('a', {href: 'http://localhost:3000/'}, 'Home'),
        e('a', {href: `http://localhost:3000/show/${encodeURIComponent(filename)}`}, 'Show'),
        e('div', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showActionDropdown: !showActionDropdown})}}, 'Dropdown', e('i', {className: 'fa fa-caret-down'})),
          showActionDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            e('div', null, '1'),
            e('div', null, '2'),
            e('div', null, '3'),
          ) : null,
        ),
      ),
      e('div', {className: 'toolbarMenu'},
        e('span', {onClick: () => {this.setState({showSidePreview: !showSidePreview})}}, 'Side preview'),
        e('span', {onClick: this.chordifyClicked}, 'Chordify'),
        e('span', {onClick: this.removeNewlinesClicked}, 'Remove newlines'),
        e('span', {onClick: this.removeHtml}, icon('format_clear-24px.svg')),
        e('span', {onClick: () => this.insertText('<pre>\n\n</pre>', 6) }, icon('subject-24px.svg')),
        e('span', {onClick: () => this.insertText('<p>\n\n</p>', 4) }, icon('short_text-24px.svg')),
        e('span', {onClick: () => this.insertText('<ol>\n\n</ol>', 5) }, icon('format_list_numbered-24px.svg')),
        e('span', {onClick: () => this.insertText('<ul style="list-style-type:disc;">\n\n</ul>', 35) }, icon('list-24px.svg')),
        e('span', {onClick: () => this.insertText('<li></li>', 4) }, icon('list-item-24px.svg')),
        e('span', {onClick: () => this.insertText('<b></b>', 3) }, icon('format_bold-24px.svg')),
        e('span', {onClick: () => this.insertText('<s></s>', 3) }, icon('format_strikethrough-24px.svg')),
        e('span', {onClick: () => this.insertText('<i></i>', 3) }, icon('format_italic-24px.svg')),
        e('span', {onClick: () => this.insertText(`
<span id="answer_${id}"/>
<script>
  $('#answer_${id}').html()
</script>`, 78) }, icon('equals.svg')),
        e('span', {onClick: () => this.insertText('<sub></sub>', 5) }, icon('subscript.svg')),
        e('span', {onClick: () => this.insertText('<script>\n\n</script>\n', 9) }, icon('settings_ethernet-24px.svg')),
        e('span', {onClick: () => this.insertText(`<!DOCTYPE html>
<html>
  <body>
    <script type="text/javascript">
      window.location.href = "";
    </script>
  </body>
</html>
          `, 98) }, icon('http-24px.svg')
        ),

      ),
      e('div', {className: showSidePreview ? 'editShowContentContainer' : 'undefined'},
      e('div', {className: showSidePreview ? 'editContent' : 'theEditContent'},
        e('h1',{id: 'filename'},
          e('span', {style: {marginLeft: '50px'}}, filename),
          e('span', {style: {marginLeft: '50px'}},
            e('button', {onClick: this.saveClicked}, 'Save')
          )
        ),
        e('textarea', {ref: this.contentRef, value: content, rows: '40', cols: '65', onChange: this.handleChange})
      ), showSidePreview ?
      e('div', {className: 'showContent'},
        e('div', {dangerouslySetInnerHTML: {__html: content}})
      ) : null,
      )
    )
  }
}

const filename = decodeURIComponent(window.location.pathname.slice(6))

ReactDOM.render(e(EditPage, {filename}), document.querySelector('#editRoot'));
