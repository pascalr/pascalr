'use strict'

const e = React.createElement

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function uniqueId(ids) {
  // In the very rare chance that two ids are the same, get another one
  const id = uuidv4();
  return ids[id] ? uniqueId(ids) : id;
}

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
    this.state = {content: '', showSidePreview: true, showActionDropdown: false, modified: false, sections: {}, selectedSection: '', editingName: null}
    this.contentRef = React.createRef();
  }

  componentDidMount() {
    const {filename} = this.props
    $.get('/getFile/'+encodeURIComponent(filename), (content) => {
      let rawSections = content.split('<!-- SECTION')
      let sections = {}
      if (rawSections[0].trim()) {
        let id = [uuidv4()]
        sections = {[id]: {name: 'Untitled', content: rawSections[0], id}}
      }
      rawSections.slice(1).forEach((s) => {
        let i = s.indexOf('-->')
        let sectionName = s.substr(0,i).trim() || 'Untitled'
        let hidden = false
        if (sectionName[0] === '*') {
          sectionName = sectionName.slice(1)
          hidden = true
        }
        let content = s.substr(i+3).trim()
        let id = uniqueId(sections)
        sections[id] = {name: sectionName, content, id, hidden}
      })

      this.setState({content,sections})
    })
    $.get('/listeTemplates', ({templates}) => {
      this.setState({templates})
    })
    $.get('/listeStyles', ({styles}) => {
      this.setState({styles})
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
    const {sections} = this.state
    const {filename} = this.props
    let content = ""
    Object.values(sections).forEach((section) => {
      content += `\n<!-- SECTION ${section.hidden ? '*' : ''}${section.name || ''} -->\n` 
      content += section.content
    })
    content = content.trim()

    $.post('/save', {content, filename}, data => {
      console.log('Document saved')
      this.setState({modified: false})
    });
  }

  chordifyClicked = (event) => {
    this.addSection('Begin cordify', '<pre class="chordify" style="column-count: 3;">', true,
    () => this.addSection('Cordify content', '', false,
    () => this.addSection('End cordify', '</pre>', true)))
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
    let sections = {...this.state.sections}
    let section = {...sections[this.state.selectedSection]}
    const selectionStart = this.contentRef.current.selectionStart
    const selectionEnd = this.contentRef.current.selectionEnd
    console.log(content)
    console.log(this.contentRef.current.selectionStart)
    console.log(this.contentRef.current.selectionEnd)
    console.log(text)
    console.log(window.getSelection().toString())
    section.content = section.content.slice(0, selectionStart) + text.slice(0, offset) + section.content.slice(selectionStart, selectionEnd) + text.slice(offset) + section.content.slice(selectionEnd)
    sections[section.id] = section
    this.setState({sections, modified: true}, () => {
      this.contentRef.current.focus()
      this.contentRef.current.selectionStart = this.contentRef.current.selectionEnd = selectionStart + offset
    })
  }

  handleSectionChange = (oldSection, event) => {
    let sections = {...this.state.sections}
    let section = {...oldSection}
    section.content = event.target.value
    sections[section.id] = section

    this.setState({sections, modified: true})
  }

  onKeyDown = (event) => {
    const key = event.key
    if (key === 'Enter') {
      const href = `/?q=${encodeURIComponent(this.state.query)}`
      window.location.href = href
    }
  }

  onFocus = (section) => {
    this.setState({selectedSection: section.id})
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
    return [...emojis].map(emo => {
      return e('span', {key: `emoji_${emo}`, className: 'clickable',
        onClick: () => {
          this.insertText(emo, 2)
          //this.setState({showEmojiDropdown: false})
        }}, emo)
    })
  }

  templateList = () => {
    return Object.keys(this.state.templates || {}).map((t) => (
      e('div', {key: `template_${t}`, onClick: () => this.insertText(this.state.templates[t])}, t)
    ))
  }

  styleList = () => {
    return Object.keys(this.state.styles || {}).map((s) => (
      e('div', {key: `style_${s}`, onClick: () => this.insertText(this.state.styles[s])}, s)
    ))
  }

  addSection = (name, content, hidden, callback) => {
    const sections = {...this.state.sections}
    const id = uniqueId(sections)
    sections[id] = {name: name || 'Untitled', content: content || "", hidden, id}
    this.setState({sections, modified: true}, callback)
  }

  printSections = () => {
    return e('div', null,
      e('div', null, 'Comment section name'),
      e('h1', {id: 'filename'},
        e('span', {style: {marginLeft: '50px'}}, filename),
        e('span', {style: {marginLeft: '50px'}},
          e('button', {onClick: this.saveClicked}, 'Save')
        )
      ),
      Object.keys(this.state.sections).map((id) => {
        return e('div', {key: `section_${id}`}, this.printSection(this.state.sections[id]))
      }),
      e('div', {className: 'clickable', onClick: () => this.addSection()}, '+ Add section'),
    )
  }

  deleteSection = (section) => {
    let sections = {...this.state.sections}
    delete sections[section.id]
    this.setState({sections})
  }

  hideSection = (theSection) => {
    let sections = {...this.state.sections}
    let section = {...theSection}
    section.hidden = !section.hidden
    sections[section.id] = section
    this.setState({sections})
  }

  handleNameChange = (theSection) => (event) => {
    let sections = {...this.state.sections}
    let section = {...theSection}
    section.name = event.target.value
    sections[section.id] = section
    this.setState({sections, modified: true})
  }

  printEditingName = (section) => {
    return e('span', null,
      e('input', {value: section.name, onChange: this.handleNameChange(section), onBlur: () => {this.setState({editingName: null})}}, null),
    )
  }


  // OPTIMIZE: The are you sure for the delete should be right under the mouse when the person clicks.
  printSection = (section) => {
    const {selectedSection,editingName} = this.state

    return e('div', null,
      e('div', null,
        (editingName === section.id) ? this.printEditingName(section) :
        e('span', {className: 'sectionName clickable', onClick: () => this.hideSection(section)},((section.name || 'Untitled') + (section.hidden ? '↓':'↑'))),
        e('span',{className: 'clickable', onClick: () => this.setState({editingName: section.id})},icon('brush-24px.svg')),
        e('span',{className: 'clickable', onClick: () => confirm("Are you sure?") && this.deleteSection(section)},'delete'),
      ),
      section.hidden ? null :
      e('textarea', {ref: (section.id === selectedSection ? this.contentRef : null), value: section.content, rows: '30', cols: '100', onChange: (event) => this.handleSectionChange(section, event), onPaste: this.onPaste, onFocus: () => this.onFocus(section)}),
    )
  }

  render() {
    const {sections, showSidePreview, showActionDropdown, showEmojiDropdown, showTitleDropdown, showTemplateDropdown, showStyleDropdown} = this.state
    const {filename} = this.props

    const content = Object.keys(sections).map(s => (
      sections[s].hidden ? '' : sections[s].content
    )).join('')

    const id = Date.now()

    return e('div', null,
      //e('div', {className: 'navigationMenu'},
      //),
      e('div', {className: 'navbar'},
        e('a', {href: '/show/desktop'}, 'Home'),
        e('a', {href: `/show/${encodeURIComponent(filename)}`}, 'Show'),
        e('span', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showActionDropdown: !showActionDropdown})}}, 'Actions', e('i', {className: 'fa fa-caret-down'})),
          showActionDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            e('div', {onClick: this.chordifyClicked}, 'Chordify'),
            e('div', {onClick: this.removeNewlinesClicked}, 'Remove newlines'),
          ) : null,
        ),
        e('span', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showTemplateDropdown: !showTemplateDropdown})}}, 'Templates', e('i', {className: 'fa fa-caret-down'})),
          showTemplateDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            this.templateList(),
          ) : null,
        ),
        e('span', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showStyleDropdown: !showStyleDropdown})}}, 'Styles', e('i', {className: 'fa fa-caret-down'})),
          showStyleDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            this.styleList(),
          ) : null,
        ),
        e('input', {id: 'filterVal2', onKeyDown: this.onKeyDown, type: 'text', value: this.state.query, onChange: ({target}) => {this.setState({query: target.value})}}),
      ),
      e('div', {className: 'toolbarMenu'},
        e('span', {onClick: () => {this.setState({showSidePreview: !showSidePreview})}}, 'Side preview'),
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
        e('span', {onClick: () => this.insertText('<img src="images/" alt="">', 17) }, icon('add_photo_alternate-24px.svg')),
        e('span', {onClick: () => this.insertText('<u></u>', 3) }, icon('format_underlined-24px.svg')),
        e('span', {className: 'dropdown'},
          e('span', {className: 'tooldropbtn', onClick: () => {this.setState({showEmojiDropdown: !showEmojiDropdown})}}, '😊'),
          showEmojiDropdown ? e('div', {className: 'dropdown-content'},
            e('div', null, this.mapEmojis('😊⭐😂❤😍')),
            e('div', null, this.mapEmojis('👍🤔💪🐱🚀')),
            e('div', null, this.mapEmojis('🤦')),
          ) : null
        ),
        e('span', {className: 'dropdown'},
          e('span', {className: 'tooldropbtn', onClick: () => {this.setState({showTitleDropdown: !showTitleDropdown})}}, icon('title-24px.svg')),
          showTitleDropdown ? e('div', {className: 'dropdown-content'},
            e('div', {className: 'clickable', onClick: () => {this.insertText('<h1></h1>', 4), this.setState({showTitleDropdown: false})}}, 'Title 1'),
            e('div', {className: 'clickable', onClick: () => {this.insertText('<h2></h2>', 4), this.setState({showTitleDropdown: false})}}, 'Title 2'),
            e('div', {className: 'clickable', onClick: () => {this.insertText('<h3></h3>', 4), this.setState({showTitleDropdown: false})}}, 'Title 3'),
            e('div', {className: 'clickable', onClick: () => {this.insertText('<h4></h4>', 4), this.setState({showTitleDropdown: false})}}, 'Title 4'),
            e('div', {className: 'clickable', onClick: () => {this.insertText('<h5></h5>', 4), this.setState({showTitleDropdown: false})}}, 'Title 5'),
            e('div', {className: 'clickable', onClick: () => {this.insertText('<h6></h6>', 4), this.setState({showTitleDropdown: false})}}, 'Title 6'),
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
        this.printSections(),
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
