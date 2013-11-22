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
	var cssProperty = 'width';
	var cssPrefixedProperty = cssProperty;
	
	var rawValue = 0; var rawUnit = 'px'; var oldSize = undefined;
	
	function getConfigForShape() {
		var target = currentElement;
		var targetBox = getContentBoxOf(currentElement);
		function getContentBoxOf(element) {

			var width = element.offsetWidth;
			var height = element.offsetHeight;

			var style = getComputedStyle(element);

			var leftBorder = parseFloat(style.borderLeftWidth);
			var rightBorder = parseFloat(style.borderRightWidth);
			var topBorder = parseFloat(style.borderTopWidth);
			var bottomBorder = parseFloat(style.borderBottomWidth);

			var leftPadding = parseFloat(style.paddingLeft);
			var rightPadding = parseFloat(style.paddingRight);
			var topPadding = parseFloat(style.paddingTop);
			var bottomPadding = parseFloat(style.paddingBottom);

			// TODO: what happens if box-sizing is not content-box? 
			// seems like at least shape-outside vary...
			return {

				top: topBorder + topPadding,
				left: leftBorder + leftPadding,
				width: width - leftBorder - leftPadding - rightPadding - rightBorder,
				height: height - topBorder - topPadding - bottomPadding - topBorder

			}

		}
		
		if(typeof(oldSize)==="undefined") { oldSize = targetBox[cssProperty] }
		
		// generate the config now
		var config, shape = "rectangle(0px,0px,"+targetBox.width+"px,"+targetBox.height+"px)";

		switch (cssLiveDev.currentCSSProperty) {
		case 'width':
			config = {
				'shape': shape,
				'path': {
					stroke: 'blue'
				},
				'point': {
					fill: 'blue'
				}
			}

			break;

		case 'height':
			config = {
				'shape': shape,
				'path': {
					stroke: 'red'
				},
				'point': {
					fill: 'red'
				}
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
			currentElement.style.setProperty("min-width", "", "");
			currentElement.style.setProperty("min-height", "", "");
			currentElement.style.setProperty("max-width", "", "");
			currentElement.style.setProperty("max-height", "", "");
			oldSize = undefined;

			// remove the editor of the page
			editor.remove()
			editor = null

		}
	}

	//
	// instanciate a new editor, backup the current state
	//
	function setupEditor(valueToEdit) {
		var target = currentElement;

		// only accept unit values, not keywords
		var infos = valueToEdit.match(/(\+?\-?[0-9.]+)([a-z%]*)/)
		if(!infos) { return false; }
		
		// recompose the value
		rawValue = parseFloat(infos[1]); if(!rawValue) { rawValue=0.0 }
		rawUnit = infos[2]; if(!rawUnit) { rawUnit='px' }
		valueToEdit = rawValue + rawUnit;

		// set the value to edit on the element...
		// TODO: make a backup of the previous value		
		target.style.setProperty("min-width", "0px", "important");
		target.style.setProperty("min-height", "0px", "important");
		target.style.setProperty("max-width", "none", "important");
		target.style.setProperty("max-height", "none", "important");
		target.style.setProperty(cssPrefixedProperty, valueToEdit, "important");

		// make sure raphael is ready
		Raphael.eve("raphael.DOMload")

		// initiate some config
		var config = getConfigForShape(valueToEdit)
		config.update = function() { return getConfigForShape() }
		editor = new BoxOverlay(target, config);
		editor.shapechange(function() { 
			
			debugger;
			var newSize = editor.getSize()[cssLiveDev.currentCSSProperty];
			var newValue = (rawValue*(newSize/oldSize));
			var newValue = (Math.round(20*newValue)/20);
			if(!newValue) { newValue = '0px' }
			else          { newValue = newValue+rawUnit }
			
			cssLiveDev.updateValue(newValue);
		
		});

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

		var style = document.createElement("style");
		style.textContent = ("[data-role=box-editor] > nav {" + "    position: fixed; bottom: 33px; right: 33px; display: block;" + "}" + "" + "[data-role=box-editor] > nav > button {" + "    float: right; " + "    border: none; background: blue; color: white;" + "    margin: 0px; margin-left: 10px; padding: 5px 15px;" + "}" + "" + "[data-role=box-editor] > nav > button:first-child {" + "    background: red;" + "}" + "" + "[data-role=box-editor] > nav > button:hover {" + "    background: royalblue; cursor: pointer;" + "}");
		editor.holder.appendChild(style);


	}

	var s = cssLiveDev.supportedProperties;
	s['width']=s['height'] = {
		
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
			removeEditor(); setupEditor(v);
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
