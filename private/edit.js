'use strict'

const e = React.createElement

function stripHtml(html){
  var doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

function icon(filename) {
  return e('img', {src: `/icon/${filename}`, alt: filename, height: 24, width: 24})
}

const LIVRE_TEMPLATE = `<style>
.main_image {
  float: left;
  margin-right: 20px;
}
</style>

<img class="main_image" src="/images/1570202817042_image.png" width="200">

<h1>Title</h1>
<div id='subtitle'>Subtitle</div>
<div id='rating'>⭐⭐⭐⭐⭐</div>
<div id='authour'>Author</div>

<h2>Résumé</h2>

<p>
</p>

<h2>Critique</h2>

<p>
</p>
`

class EditPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {content: '', showSidePreview: true, showActionDropdown: false, modified: false}
    this.contentRef = React.createRef();
  }

  componentDidMount() {
    const {filename} = this.props
    $.get('http://localhost:3000/getFile/'+encodeURIComponent(filename), (content) => {
      this.setState({content})
    })
    window.addEventListener('beforeunload', this.handleLeavePage)
  }
  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleLeavePage)
  }

  handleLeavePage = (event) => {
    if (!this.state.modified) {return null}

    const confirmationMessage = this.state.modified ? 'Some modifications are not yet saved. Are you sure you want to leave?' : null;
    event.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
    return confirmationMessage;
  }

  saveClicked = (event) => {
    const {content} = this.state
    const {filename} = this.props
    $.post('http://localhost:3000/save', {content, filename}, data => {
      console.log('Document saved')
      this.setState({modified: false})
    });
  }

  chordifyClicked = (event) => {
    const content = '<pre>\n' + this.state.content + `</pre>\n<script>\n$('pre').css('column-count', '3')\n</script>`
    this.setState({content, modified: true})
  }

  removeNewlinesClicked = (event) => {
    const content = this.state.content.replace(/^\s*\n/gm, '')
    this.setState({content, modified: true})
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
    this.setState({content: content.slice(0, selectionStart) + replacedContent + content.slice(selectionEnd), modified: true})
  }

  insertText = (text, offset = 0) => {
    let {content} = this.state
    const selectionStart = this.contentRef.current.selectionStart
    const selectionEnd = this.contentRef.current.selectionEnd
    console.log(content)
    console.log(this.contentRef.current.selectionStart)
    console.log(this.contentRef.current.selectionEnd)
    console.log(text)
    console.log(window.getSelection().toString())
    content = content.slice(0, selectionStart) + text.slice(0, offset) + content.slice(selectionStart, selectionEnd) + text.slice(offset) + content.slice(selectionEnd)
    this.setState({content, modified: true}, () => {
      this.contentRef.current.focus()
      this.contentRef.current.selectionStart = this.contentRef.current.selectionEnd = selectionStart + offset
    })
  }

  handleChange = (event) => {
    this.setState({content: event.target.value, modified: true})
  }

  onKeyDown = (event) => {
    const key = event.key
    if (key === 'Enter') {
      const href = `/?q=${encodeURIComponent(this.state.query)}`
      window.location.href = href
    }
  }

  onPaste = (event) => {

    console.log('onPaste')
    
    var items = (event.clipboardData  || event.originalEvent.clipboardData).items;
   
    console.log(JSON.stringify(items)); // will give you the mime types
    
    // find pasted image among pasted items
    var blob = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) {
        blob = items[i].getAsFile();
      }
    }
    // load image if there is a pasted image
    if (blob !== null) {
      console.log(blob)
      const id = `${Date.now()}_${blob.name}`
      var fd = new FormData();
      fd.append('blob', blob);
      $.ajax({
          type: 'POST',
          url: '/saveImage',
          data: fd,
          processData: false,
          contentType: false
      }).done((filename) => {
        this.insertText(`<img src="/images/${filename}">`)
        console.log(data);
      });
      /*var reader = new FileReader();
      reader.onload = (event) => {
        const dataURL = event.target.result
        this.insertText(`<img src="${dataURL}">`)
        console.log(event.target.result); // data url!
      };
      reader.readAsDataURL(blob);*/
    }
  }

  mapEmojis = (emojis) => {
    return [...emojis].map(emo => { return e('span', {key: `emoji_${emo}`, className: 'clickable', onClick: () => this.insertText(emo, 2)}, emo)})
  }

  render() {
    const {content, showSidePreview, showActionDropdown, showEmojiDropdown, showTitleDropdown, showTemplateDropdown} = this.state
    const {filename} = this.props

    const id = Date.now()

    return e('div', null,
      //e('div', {className: 'navigationMenu'},
      //),
      e('div', {className: 'navbar'},
        e('a', {href: 'http://localhost:3000/'}, 'Home'),
        e('a', {href: `http://localhost:3000/show/${encodeURIComponent(filename)}`}, 'Show'),
        e('div', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showActionDropdown: !showActionDropdown})}}, 'Actions', e('i', {className: 'fa fa-caret-down'})),
          showActionDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            e('div', {onClick: this.chordifyClicked}, 'Chordify'),
            e('div', {onClick: this.removeNewlinesClicked}, 'Remove newlines'),
          ) : null,
        ),
        e('div', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showTemplateDropdown: !showTemplateDropdown})}}, 'Templates', e('i', {className: 'fa fa-caret-down'})),
          showTemplateDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            e('div', {onClick: () => this.insertText('')}, 'Recette'),
            e('div', {onClick: () => this.insertText(LIVRE_TEMPLATE)}, 'Livre'),
            e('div', {onClick: () => this.insertText('')}, 'Film'),
            e('div', {onClick: () => this.insertText('')}, 'Jeu'),
          ) : null,
        ),
        e('input', {id: 'filterVal2', onKeyDown: this.onKeyDown, type: 'text', value: this.state.query, onChange: ({target}) => {this.setState({query: target.value})}}),
      ),
      e('div', {className: 'toolbarMenu'},
        //e('span', {onClick: () => {this.setState({showSidePreview: !showSidePreview})}}, 'Side preview'),
        e('span', {onClick: this.removeHtml}, icon('format_clear-24px.svg')),
        e('span', {onClick: () => this.insertText('<pre>\n\n</pre>', 6) }, icon('subject-24px.svg')),
        e('span', {onClick: () => this.insertText('<blockquote>\n\n</blockquote>\n<cite>\n\n</cite>', 13) }, icon('format_quote-24px.svg')),
        e('span', {onClick: () => this.insertText('<p>\n\n</p>', 4) }, icon('short_text-24px.svg')),
        e('span', {onClick: () => this.insertText('<ol>\n\n</ol>', 5) }, icon('format_list_numbered-24px.svg')),
        e('span', {onClick: () => this.insertText('<ul>\n\n</ul>', 5) }, icon('list-24px.svg')),
        e('span', {onClick: () => this.insertText('<li></li>', 4) }, icon('list-item-24px.svg')),
        e('span', {onClick: () => this.insertText('<b></b>', 3) }, icon('format_bold-24px.svg')),
        e('span', {onClick: () => this.insertText('<s></s>', 3) }, icon('format_strikethrough-24px.svg')),
        e('span', {onClick: () => this.insertText('<i></i>', 3) }, icon('format_italic-24px.svg')),
        e('span', {onClick: () => this.insertText('<u></u>', 3) }, icon('format_underlined-24px.svg')),
        e('div', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showEmojiDropdown: !showEmojiDropdown})}}, '😊'),
          showEmojiDropdown ? e('div', {className: 'dropdown-content'},
            e('div', null, this.mapEmojis('😊⭐😂❤😍')),
            e('div', null, this.mapEmojis('👍🤔💪🐱🚀')),
          ) : null
        ),
        e('div', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showTitleDropdown: !showTitleDropdown})}}, icon('title-24px.svg')),
          showTitleDropdown ? e('div', {className: 'dropdown-content'},
            e('div', {className: 'clickable', onClick: () => this.insertText('<h1></h1>', 4) }, 'Title 1'),
            e('div', {className: 'clickable', onClick: () => this.insertText('<h2></h2>', 4) }, 'Title 2'),
            e('div', {className: 'clickable', onClick: () => this.insertText('<h3></h3>', 4) }, 'Title 3'),
            e('div', {className: 'clickable', onClick: () => this.insertText('<h4></h4>', 4) }, 'Title 4'),
            e('div', {className: 'clickable', onClick: () => this.insertText('<h5></h5>', 4) }, 'Title 5'),
            e('div', {className: 'clickable', onClick: () => this.insertText('<h6></h6>', 4) }, 'Title 6'),
          ) : null
        ),
        e('span', {onClick: () => this.insertText(`
<span id="answer_${id}"/>
<script>
  $('#answer_${id}').html()
</script>`, 78) }, icon('equals.svg')),
        e('span', {onClick: () => this.insertText('<sub></sub>', 5) }, icon('subscript.svg')),
        e('span', {onClick: () => this.insertText('<sup></sup>', 5) }, icon('exponent.svg')),
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
        e('textarea', {ref: this.contentRef, value: content, rows: '40', cols: '65', onChange: this.handleChange, onPaste: this.onPaste})
      ), showSidePreview ?
      e('div', {className: 'showContent'},
        e('div', {contentEditable: true, dangerouslySetInnerHTML: {__html: content}})
      ) : null,
      )
    )
  }
}

const filename = decodeURIComponent(window.location.pathname.slice(6))

ReactDOM.render(e(EditPage, {filename}), document.querySelector('#editRoot'));
