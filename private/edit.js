//import QuillBetterTable from 'quill-better-table'

$.get('http://localhost:3000/getFile'+window.location.pathname, function(data) {
  console.log(data)
  $("#editTextArea").val(data)
  //$("#editor").html(data)
  $("#filename").html(decodeURIComponent(window.location.pathname.substring(6)))
});

$("#hiddenInputFilename").attr('value', decodeURIComponent(window.location.pathname.substring(6)))

/*Quill.register({
  'modules/better-table': quillBetterTable
}, true)

window.onload = () => {
  const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      table: false,
      'better-table': {
        operationMenu: {
          items: {
            unmergeCells: {
              text: 'Another unmerge cells name'
            }
          },
          color: {
            colors: ['green', 'red', 'yellow', 'blue', 'white'],
            text: 'Background Colors:'
          }
        }
      },
      keyboard: {
        bindings: quillBetterTable.keyboardBindings
      }
    }
  })

  let tableModule = quill.getModule('better-table')
  document.body.querySelector('#insert-table')
    .onclick = () => {
      tableModule.insertTable(3, 3)
    }

  document.body.querySelector('#get-table')
    .onclick = () => {
      console.log(tableModule.getTable())
    }

  document.body.querySelector('#get-contents')
    .onclick = () => {
      updateDeltaView(quill)
    }
}

function updateDeltaView (quill) {
  document.body.querySelector('#delta-view')
    .innerHTML = JSON.stringify(
      quill.getContents()
    )
}
*/
