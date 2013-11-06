/*
 * Copyright (c) 2013 Adobe Systems Incorporated.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

!function() {

	var cssLiveDev = window._LD_CSS_EDITOR;

	var editor = null;
	var currentElement = null;

	var prefix = '-webkit-';
	var cssProperty = 'shape-inside';
	var cssPrefixedProperty = prefix+cssProperty;
	
	function getConfigForShape(shapeToEdit) {
		var target = currentElement;

		// extract the shape to edit
		var path = shapeToEdit;
		if (!path) {
			if (target.style.getPropertyPriority(cssPrefixedProperty) == 'important') {
				path = target.style[cssPrefixedProperty];
			} else {
				path = window.getComputedStyle(target)[cssPrefixedProperty];
			}
		}
		
        // find out which units are used accross dimensions
        var parsedShape = cssSyntax.parseCSSValue(path.trim());
        var hasOnlyPercentages = true; var baseUnitX = '%', baseUnitY = '%';
        if((parsedShape) && (parsedShape[0] instanceof cssSyntax.Func) && (parsedShape[0].name=='polygon')) {
		
			// for argument of the function:
            parsedShape[0].value.forEach(function(arg) {
    
                arg.value.forEach(function(item,index) {
        
                    // test each argument component:
                    if (item instanceof cssSyntax.DimensionToken) {
                    	if(index<3) {
                    		if(baseUnitX=='%') baseUnitX = item.unit;
							else if(baseUnitX !== item.unit) { baseUnitX='px' }
                    	} else {
                    		if(baseUnitY=='%') baseUnitY = item.unit;
							else if(baseUnitY !== item.unit) { baseUnitY='px' }
                    	}
                    }
        
                })
    
            })
        }
	
		var defaultXUnit = baseUnitX || 'px';
		var defaultYUnit = baseUnitY || 'px';

		// generate the config now
		var config;

		switch (cssLiveDev.currentCSSProperty) {
		case 'shape-inside':

			config = {
				'shape': path,
				'path': {
					stroke: 'blue'
				},
				'point': {
					fill: 'blue'
				},
				'defaultXUnit': defaultXUnit,
				'defaultYUnit': defaultYUnit
			}

			break;

		case 'shape-outside':
			config = {
				'shape': path,
				'path': {
					stroke: 'red'
				},
				'point': {
					fill: 'red'
				},
				'defaultXUnit': defaultXUnit,
				'defaultYUnit': defaultYUnit
			}
			break;
		}

		return config;
	}

	//
	// remove the current editor, restore the previous state
	//
	function removeEditor() {
		if (editor) {

			// restore the original style
			// TODO: restore original value, not dummies
			currentElement.style[cssPrefixedProperty] = '';

			// remove the editor of the page
			editor.remove()
			editor = null

		}
	}

	//
	// instanciate a new editor, backup the current state
	//
	function setupEditor(shapeToEdit) {
		var target = currentElement;

		// set the value to edit on the element...
		// TODO: make a backup of the previous value
		target.style.setProperty(cssPrefixedProperty, shapeToEdit, "important");

		// make sure raphael is ready
		Raphael.eve("raphael.DOMload")

		// initiate some config
		var config = getConfigForShape(shapeToEdit)
		config.update = function(v) { return getConfigForShape(v) }
		editor = new ShapeOverlay(target, config);
		editor.shapechange(function() { cssLiveDev.updateValue(editor.getPolygonPath()) });

		// add some message to specify what the user can do from now
		var nav = document.createElement("nav");
		editor.holder.appendChild(nav);

		var button1 = document.createElement("button");
		button1.innerHTML = "Done <small><i>(Esc)</i></small>";
		button1.onclick = function() { removeEditor() };
		nav.appendChild(button1);

		var button2 = document.createElement("button");
		button2.innerHTML = "Switch element <small><i>(R)</i></small>";
		button2.onclick = function() { onkeydown({ keyCode: 82 }) };
		nav.appendChild(button2);

		var button3 = document.createElement("button");
		button3.innerHTML = "Transform shape <small><i>(T)</i></small>";
		button3.onclick = function() { onkeydown({ keyCode: 84 }) };
		nav.appendChild(button3);

		var style = document.createElement("style");
		style.textContent = ("[data-role=shape-editor] > nav {" + "    position: fixed; bottom: 33px; right: 33px; display: block;" + "}" + "" + "[data-role=shape-editor] > nav > button {" + "    float: right; " + "    border: none; background: blue; color: white;" + "    margin: 0px; margin-left: 10px; padding: 5px 15px;" + "}" + "" + "[data-role=shape-editor] > nav > button:first-child {" + "    background: red;" + "}" + "" + "[data-role=shape-editor] > nav > button:hover {" + "    background: royalblue; cursor: pointer;" + "}");
		editor.holder.appendChild(style);


	}

	var s = cssLiveDev.supportedProperties;
	s['shape-inside']=s['shape-outside']=s['clip-path'] = {
		
		startEditing: function(newElement, newCSSProperty, newShapeToEdit) {

			// take note of the shape type
			cssPrefixedProperty = newCSSProperty;
			cssProperty = newCSSProperty.replace(/^-([a-z]+)-/i,'');
		
			// update the current element
			currentElement = newElement;

			// create a new editor surface
			removeEditor()
			setupEditor(newShapeToEdit)

		},
		
		stopEditing: function() {
			removeEditor();
		},
		
		updateValue: function(v) {
			editor.setup(v);
		},
		
		isReadyForBatchUpdate: function() {
			return (!editor.isDraggingInProgress);
		},
		
		isOpen: function() {
			return (this.shapeOverlay) && (this.shapeOverlay.holder.style.display!='none');
		},
		
		show: function() {
			this.shapeOverlay.holder.style.display='';
		},
		
		hide: function() {
			this.shapeOverlay.holder.style.display='none';
		},
		
		get shapeOverlay() {
			return editor;
		}
		
	};
	
	
	//
	// binding keys
	//
	document.addEventListener('keydown', onkeydown)

	function onkeydown(e) {
		
		// only return when the editor is visible...
		if (!editor) { return } 
		else { var m = cssLiveDev }
		
		// analyze the keycodes now...
		if (e.keyCode === 116 || e.keyCode == 84) { // T
			editor.toggleTransformEditor();
			return;
		}
		if (e.keyCode === 82) { // R
			var valueToEdit = m.currentCSSValue ? m.currentCSSValue : m.futureCSSValue;
			m.startElementSelection(m.currentCSSProperty, m.currentSelector, valueToEdit, true);
			return;
		}
		if (e.keyCode === 27) { // ESCAPE
			removeEditor();
			return;
		}
	}

	
}();
