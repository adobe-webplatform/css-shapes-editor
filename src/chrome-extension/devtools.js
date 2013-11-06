var port = null,
    editorToggle = null,
    transformToggle = null,
    shapeType = null,
    isEditorOn = false

chrome.devtools.panels.elements.createSidebarPane(
    "CSS Shapes",
    function(sidebar) {
      sidebar.setPage('options.html')
      sidebar.setHeight('200px')
      sidebar.onShown.addListener(setup)
      
      port = chrome.runtime.connect({name: "devtools"});
      port.onMessage.addListener(function(data) {
        // TODO treat incoming message
      });
       
      chrome.devtools.panels.elements.onSelectionChanged.addListener(onElementSelected);
});

var onElementSelected = function(){
  if (!isEditorOn){
    return
  }
  chrome.devtools.inspectedWindow.eval("(" + markElement.toString() + ")()", function(response){
    // TODO use reponse.key and send to editor
    turnOnEditor()
  })
}

var turnOnEditor = function(){
  port.postMessage({command: 'editor:on', shapeType: shapeType })
  transformToggle.checked = false
}

var turnOffEditor = function(){
  port.postMessage({command: 'editor:off', shapeType: shapeType })
  transformToggle.checked = false
}

var toggleTransformEditor = function(){
  port.postMessage({command: 'editor:transform', shapeType: shapeType })
}

// win is the 'window' object of the page inserted with sidebar.setPage()
var setup = function(win){
  if (!editorToggle){
    
    var shapeToggles = win.document.querySelectorAll('[name="shape-type"]')
    Array.prototype.forEach.call(shapeToggles, function(radio){
      
      if (radio.checked){
        shapeType = radio.value
      }
      
      radio.addEventListener('change', function(e){
        if (e.target.checked){
          shapeType = e.target.value
        }
        
        onElementSelected()
      })
    })
    
    editorToggle = win.document.querySelector('[data-editor-toggle]')
    editorToggle.addEventListener('change', function(e){
      isEditorOn = e.target.checked
      isEditorOn ? onElementSelected() : turnOffEditor()
    })
    
    transformToggle = win.document.querySelector('[data-transform-toggle]')
    transformToggle.addEventListener('change', toggleTransformEditor)
  }
}

/*
  Mark the DOM node of the selected element. The content script knows this marker and will select the element.
  In DevTools scope:
  - $0 references the element currently selected in the 'Elements' panel
  - $1 references the element previously selected
*/
var markElement = function(){
  $0.setAttribute('data-marker','')
  $1.removeAttribute('data-marker')
  
  // TODO return JSON with key for marker
}
