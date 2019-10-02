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
    return [...emojis].map(emo => { return e('span', {onClick: () => this.insertText(emo, 2)}, emo)})
  }

  render() {
    const {content, showSidePreview, showActionDropdown, showEmojiDropdown} = this.state
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
        e('input', {id: 'filterVal2', onKeyDown: this.onKeyDown, type: 'text', value: this.state.query, onChange: ({target}) => {this.setState({query: target.value})}}),
      ),
      e('div', {className: 'toolbarMenu'},
        //e('span', {onClick: () => {this.setState({showSidePreview: !showSidePreview})}}, 'Side preview'),
        e('span', {onClick: this.removeHtml}, icon('format_clear-24px.svg')),
        e('span', {onClick: () => this.insertText('<pre>\n\n</pre>', 6) }, icon('subject-24px.svg')),
        e('span', {onClick: () => this.insertText('<p>\n\n</p>', 4) }, icon('short_text-24px.svg')),
        e('span', {onClick: () => this.insertText('<ol>\n\n</ol>', 5) }, icon('format_list_numbered-24px.svg')),
        e('span', {onClick: () => this.insertText('<ul style="list-style-type:disc;">\n\n</ul>', 35) }, icon('list-24px.svg')),
        e('span', {onClick: () => this.insertText('<li></li>', 4) }, icon('list-item-24px.svg')),
        e('span', {onClick: () => this.insertText('<b></b>', 3) }, icon('format_bold-24px.svg')),
        e('span', {onClick: () => this.insertText('<s></s>', 3) }, icon('format_strikethrough-24px.svg')),
        e('span', {onClick: () => this.insertText('<i></i>', 3) }, icon('format_italic-24px.svg')),
        e('span', {onClick: () => this.insertText('<u></u>', 3) }, icon('format_underlined-24px.svg')),
        e('div', {className: 'dropdown'},
          e('button', {className: 'dropbtn', onClick: () => {this.setState({showEmojiDropdown: !showEmojiDropdown})}}, '😊'),
          showEmojiDropdown ? e('div', {id: 'myDropdown', className: 'dropdown-content'},
            e('div', null, this.mapEmojis('😊⭐😊😊😊')),
            e('div', null, this.mapEmojis('😊😊😊😊😊')),
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

/*(function($) {
	var defaults;
	$.event.fix = (function(originalFix) {
		return function(event) {
			event = originalFix.apply(this, arguments);
			if (event.type.indexOf("copy") === 0 || event.type.indexOf("paste") === 0) {
				event.clipboardData = event.originalEvent.clipboardData;
			}
			return event;
		};
	})($.event.fix);
	defaults = {
		callback: $.noop,
		matchType: /image.
	};
	return ($.fn.pasteImageReader = function(options) {
		if (typeof options === "function") {
			options = {
				callback: options
			};
		}
		options = $.extend({}, defaults, options);
		return this.each(function() {
			var $this, element;
			element = this;
			$this = $(this);
			return $this.bind("paste", function(event) {
				var clipboardData, found;
				found = false;
				clipboardData = event.clipboardData;
				return Array.prototype.forEach.call(clipboardData.types, function(type, i) {
					var file, reader;
					if (found) {
						return;
					}
					if (
						type.match(options.matchType) ||
						clipboardData.items[i].type.match(options.matchType)
					) {
						file = clipboardData.items[i].getAsFile();
						reader = new FileReader();
						reader.onload = function(evt) {
							return options.callback.call(element, {
								dataURL: evt.target.result,
								event: evt,
								file: file,
								name: file.name
							});
						};
						reader.readAsDataURL(file);
						snapshoot();
						return (found = true);
					}
				});
			});
		});
	});
})(jQuery);*/

/*var dataURL, filename;
$("html").pasteImageReader(function(results) {
	filename = results.filename, dataURL = results.dataURL;
	$data.text(dataURL);
	$size.val(results.file.size);
	$type.val(results.file.type);
	var img = document.createElement("img");
	img.src = dataURL;
	var w = img.width;
	var h = img.height;
	$width.val(w);
	$height.val(h);
	return $(".active")
		.css({
			backgroundImage: "url(" + dataURL + ")"
		})
		.data({ width: w, height: h });
});

var $data, $size, $type, $width, $height;
$(function() {
	$data = $(".data");
	$size = $(".size");
	$type = $(".type");
	$width = $("#width");
	$height = $("#height");
	$(".target").on("click", function() {
		var $this = $(this);
		var bi = $this.css("background-image");
		if (bi != "none") {
			$data.text(bi.substr(4, bi.length - 6));
		}

		$(".active").removeClass("active");
		$this.addClass("active");

		$this.toggleClass("contain");

		$width.val($this.data("width"));
		$height.val($this.data("height"));
		if ($this.hasClass("contain")) {
			$this.css({
				width: $this.data("width"),
				height: $this.data("height"),
				"z-index": "10"
			});
		} else {
			$this.css({ width: "", height: "", "z-index": "" });
		}
	});
});

function copy(text) {
	var t = document.getElementById("base64");
	t.select();
	try {
		var successful = document.execCommand("copy");
		var msg = successful ? "successfully" : "unsuccessfully";
		alert("Base64 data coppied " + msg + " to clipboard");
	} catch (err) {
		alert("Unable to copy text");
	}
}*/

const filename = decodeURIComponent(window.location.pathname.slice(6))

ReactDOM.render(e(EditPage, {filename}), document.querySelector('#editRoot'));
