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

(function(scope) {

	var defaults = {
		shape: null,
		path: {
			stroke: 'blue'
		},
		point: {
			stroke: 'blue',
			fill: 'gray',
			opacity: 0,
		}
	}
	
	/*
		@param {DOM Element} element Element onto which to project the editor. Usually, it's the element that will use the output shape.
		@param {Object} config Options for the editor
		@example
		config = {
		  shape: "", // {String} polygon definition, like 'polygon(0 0, 100 100, 100 0)'
		  path: {}, // {Object} hash of attributes for the SVG path which visualizes the polygon
		  point: {} // {Object} hash of attributes for the SVG circle which represents a joint in the polygon
		}
	
	*/
	function BoxOverlay(element, config) {
		if (!element) { return }

		this.config = extend(defaults, config)

		this.xs = []; // stores the real x values
		this.ys = []; // stores the real y values

		this.shapeChangeListeners = [];
		this.isDraggingInProgress = false;

		this.element = (typeof element === 'string') ? document.querySelector(element) : element;
		this.setup()
	}

	var constants = {
		TRANSPARENT: 'rgba(0,0,0,0)',
		UNITS: "px",
		MIN_RADIUS: 5,
		MAX_RADIUS: 7,
		MIN_OPACITY: 0.3,
		MAX_OPACITY: 1,
		ANIM_TIME: 200,
		ACTIVE_RADIUS: 7
	}

	for (var constant in constants) {
		Object.defineProperty(BoxOverlay.prototype, constant, {
			value: constants[constant]
		});
	}
	
	BoxOverlay.prototype.setup = function() {

		// update the config as needed
		if (this.paper && this.config.update) {
			this.config = extend(defaults, this.config.update())
		}

		// load or infer coordinates
		var coords = getPointsFromPolygon(this.config.shape, this.element)

		// sets this.holder
		this.setupEditorHolder()

		// sets this.elRect, this.offsetLeft, this.offsetTop
		this.setupOffsets()

		// setup the points
		this.setupPoints(coords);
		this.drawPaths();
		
		// only allow transforms if we are working on function
		this.toggleTransformEditor();

		// TODO: refresh editor after DOM Mutation
		// this.mutationObserver = new MutationObserver(this.refresh.bind(this));
		window.addEventListener('resize', this.refresh.bind(this));
	}

	BoxOverlay.prototype.refresh = function() {
		this.setupEditorHolder()
		this.setupOffsets()
	}

	BoxOverlay.prototype.setupPoints = function(coords) {
		
		// add or modify existing points
		if (!this.paper) {

			this.paper = Raphael(this.holder, '100%', '100%');
			this.points = this.paper.set();

			// path to visualize the polygon
			this.path = this.paper.path().attr(this.config.path);

			coords.forEach(function(pair, index) {
				// offset coordinates to account for the element's position on the page
				pair.x = parseInt(pair.x, 10) + this.offsetLeft,
				pair.y = parseInt(pair.y, 10) + this.offsetTop

				// add points to the paper
				this.addPoint(pair.x, pair.y, index, pair)

			}.bind(this))

		} else {

			for (var i = this.points.length - 1; i >= coords.length; i--) {
				this.removePoint(i);
			}

			coords.forEach(function(pair, index) {

				// offset coordinates to account for the element's position on the page
				pair.x = parseInt(pair.x, 10) + this.offsetLeft,
				pair.y = parseInt(pair.y, 10) + this.offsetTop

				// add points to the paper
				this.updatePoint(index, pair.x, pair.y);

			}.bind(this))

		}
		
	}

	BoxOverlay.prototype.setupOffsets = function() {
		this.elRect = this.element.getBoundingClientRect()
		this.elContentRect = getContentBoxOf(this.element)

		var oldOffsetLeft = this.offsetLeft
		var oldOffsetTop = this.offsetTop

		// store editor offsets
		this.offsetLeft = this.elRect.left + window.scrollX + this.elContentRect.left
		this.offsetTop = this.elRect.top + window.scrollY + this.elContentRect.top

		// no points to update means this is the first run
		if (!this.points) {
			return
		}

		// update point offsets
		this.points.items.forEach(function(point, i) {
			var newX = point.attrs.cx - oldOffsetLeft + this.offsetLeft
			var newY = point.attrs.cy - oldOffsetTop + this.offsetTop
			this.updatePoint(i, newX, newY)
		}.bind(this))
	};

	BoxOverlay.prototype.setupEditorHolder = function() {

		// abort if editor holder already exists
		if (this.holder) {
			
			var root = document.documentElement;
			var width = Math.max
			this.holder.style.display='none';
			this.holder.style.minHeight=root.scrollHeight+'px';
			this.holder.style.minWidth=root.scrollWidth+'px';
			this.holder.style.display='block';
			return;
		}
		
		// create an element for the holder
		this.holder = document.createElement('div')

		// position this element so that it fills the viewport
		this.holder.style.position = "absolute"
		this.holder.style.top = 0
		this.holder.style.left = 0
		this.holder.style.right = 0
		this.holder.style.bottom = 0
		
		// see http://softwareas.com/whats-the-maximum-z-index
		this.holder.style.zIndex = 2147483647; 
		
		// other styling stuff
		this.holder.style.background = "rgba(0, 194, 255, 0.2)";
		this.holder.style.outline = "rgba(0, 194, 255, 0.2) 10px solid";
		this.holder.setAttribute('data-role', 'box-editor')

		// add this layer to the document
		document.documentElement.appendChild(this.holder)
		
		// resize tricks
		this.setupEditorHolder();

	}

	BoxOverlay.prototype.remove = function() {
		if (this.holder && this.holder.parentElement) {
			this.holder.parentElement.removeChild(this.holder)
		}
	}

	BoxOverlay.prototype.removePoint = function(x, y, i) {

		// refuse to remove any point if we cannot form a shape
		if (this.xs.length < 3) return;

		// remove the related data
		this.xs.splice(i, 1);
		this.ys.splice(i, 1);

		// remove the last point and reposition the rest of the points based on the remaining x/y coordinates
		this.points.pop().remove();
		for (var i = 0, len = this.xs.length; i < len; i++) {
			this.updatePoint(i, this.xs[i], this.ys[i]);
		}

	}

	BoxOverlay.prototype.addPoint = function(x, y, i, metadata) {
		metadata = Object(metadata) // also converts null & undefined to objects

		var point = (function(i, x, y, overlay, speculative) {

			var point = overlay.paper.circle(x, y, overlay.MIN_RADIUS).attr(overlay.config.point)
			overlay.points.push(point);
			return point;

		})(this.points.length, x, y, this);

		if (i >= 0) {
			this.xs.splice(i, 0, x);
			this.ys.splice(i, 0, y);
			for (var j = 0; j < this.xs.length; j++) {
				this.updatePoint(j, this.xs[j], this.ys[j]);
			}
		} else {
			this.xs.push(x);
			this.ys.push(y);
		}

		return point;
	}

	BoxOverlay.prototype.updatePoint = function(i, cx, cy) {
		this.xs[i] = cx;
		this.ys[i] = cy;

		this.points.items[i].attr({
			cx: cx,
			cy: cy
		});

		this.drawPaths();
		this.notifyListeners();
	}

	BoxOverlay.prototype.drawPaths = function() {
		var commands = ['M', this.points[0].attrs.cx, this.points[0].attrs.cy, 'L'];
		for (var i = 1; i < this.points.length; i++) {
			var pt = this.points[i].attrs
			commands.push(pt.cx, pt.cy);
		}
		commands.push('z');

		this.path.attr('path', commands);
	}

	BoxOverlay.prototype.notifyListeners = function() {
		for (var listener in this.shapeChangeListeners)
		this.shapeChangeListeners[listener]();
	}
	BoxOverlay.prototype.shapechange = function(callback) {
		this.shapeChangeListeners.push(callback);
	}
	BoxOverlay.prototype.getSize = function(callback) {
		return {
			width: this.xs[2]-this.xs[0],
			height: this.ys[2]-this.ys[0]
		}
	}

	BoxOverlay.prototype.toggleTransformEditor = function() {

		var overlay = this,
			pointsSnapshot = this.points.items.map(function(point, i) {
				return {
					x: point.attrs.cx,
					y: point.attrs.cy
				}
			})
		;

			// timer to avoid live-update during drags
		var breakdowntime = 0,
			timer = 0;

		function scheduleTimer() {
			overlay.isDraggingInProgress = true;
			breakdowntime = 2000 + new Date();

			if (timer) return;

			timer = setTimeout(tickTimer, 2000);
		}

		function tickTimer() {
			var delta = breakdowntime - new Date();
			if (delta > 15) {
				timer = setTimeout(tickTimer, delta)
			} else {
				overlay.isDraggingInProgress = false;
				timer = 0;
			}
		}

		function onMouseUp(e) {
			if (timer) {
				clearTimeout(timer);
				breakdowntime = timer = 0;
				tickTimer();
				if (e) setTimeout(onMouseUp, 32); // nobody clicks that fast, right?
			} else if (overlay.isDraggingInProgress) {
				overlay.isDraggingInProgress = false;
			}
		}

		// what happens when a change occurs in the shape

		function transformPoints() {

			// avoids syncing for another 2sec
			scheduleTimer();

			// update the ui nonetheless
			var matrix = overlay.phantomPath.matrix;

			pointsSnapshot.map(function(point, i) {
				var newX = matrix.x(point.x, point.y)
				var newY = matrix.y(point.x, point.y)

				overlay.updatePoint(i, newX, newY)
			})
		
		}

		if (!this.transformEditor) {

			// prepare for dragging
			window.addEventListener("mousedown", scheduleTimer, true);
			window.addEventListener("mouseup", onMouseUp, true);

			// using a phantom path because we already redraw the path by the transformed coordinates.
			// using the same path would result in double transformations for the path
			this.phantomPath = overlay.path.clone().attr({ 'stroke': 'transparent' });
			this.transformEditor = overlay.paper.freeTransform(this.phantomPath, {
				draw: ['bbox'],
				drag: [],
				keepRatio: ['bboxCorners'],
				rotate: [],
				scale: ['bboxSides'],
				distance: '0.8'
			}, transformPoints);
		
		}
		
	}
	
	/*
		Convert a polygon path string to an array of objects with x/y coordinates.
		@param {String} path CSS shape polygon path

		@return {Array} Array with objects. Each object has 'x' and 'y' as keys and unit-less numeric values. Example: [{x: 0, y: 30}, {x: 30, y: 30} ...]
		Returns empty array if path was invalid
	*/
	function getPointsFromPolygon(path, element) {
		var coords = []
		
		var infos = null;
		if (infos = /(\s*)rectangle\s*\((([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(path)) {
			
			//
			// code for rectangles
			// 
			var args = (
				infos[2]
				.replace(/\s+/g, ' ')
				.replace(/( ,|, )/g, ',').trim()
				.split(',')
				.map(function(point, i) {

					var isHeightRelated = !!(i%2);
					return convertToPixels(point, element, isHeightRelated);

				})
			);
			
			while(args.length<4) { args.push({value:10,unit:'px'}) }
			
			// build fake coordinates
			var x = args[0].value;
			var y = args[1].value;
			var w = args[2].value;
			var h = args[3].value;
			coords.push({ x: x,   y: y   });
			coords.push({ x: x+w, y: y   });
			coords.push({ x: x+w, y: y+h });
			coords.push({ x: x,   y: y+h });
			
			coords.args = args;
			coords.func = 'rectangle';
			
		}

		return coords
	}

	/*
      Returns the content box layout (relative to the border box)
	*/
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

	//
	// this section covers the unit conversion process
	//
	var unitConverters = {
		'px' : function(x) { return x; },
		'in' : function(x) { return x * 96; },
		'cm' : function(x) { return x / 0.02645833333; },
		'mm' : function(x) { return x / 0.26458333333; },
		'pt' : function(x) { return x / 0.75; },
		'pc' : function(x) { return x / 0.0625; },
		'em' : function(x,e) { return x*parseFloat(getComputedStyle(e).fontSize); },
		'rem': function(x,e) { return x*parseFloat(getComputedStyle(e.ownerDocument.documentElement).fontSize); },
		'vw' : function(x,e) { return x/100*window.innerWidth; },
		'vh' : function(x,e) { return x/100*window.innerHeight; },
		'%'  : function(x,e,h) {
			
			var box = e ? getContentBoxOf(e) : {
				top: 0,
				left: 0,
				width: 0,
				height: 0
			};
			
			if(h) { return x/100*box.height; }
			else  { return x/100*box.width;  }
			
		}
	};
	var unitBackConverters = {
		'px' : function(x) { return x; },
		'in' : function(x) { return x / 96; },
		'cm' : function(x) { return x * 0.02645833333; },
		'mm' : function(x) { return x * 0.26458333333; },
		'pt' : function(x) { return x * 0.75; },
		'pc' : function(x) { return x * 0.0625; },
		'em' : function(x,e) { return x/parseFloat(getComputedStyle(e).fontSize); },
		'rem': function(x,e) { return x/parseFloat(getComputedStyle(e.ownerDocument.documentElement).fontSize); },
		'vw' : function(x,e) { return x*100/window.innerWidth; },
		'vh' : function(x,e) { return x*100/window.innerHeight; },
		'%'  : function(x,e,h) {
			
			var box = e ? getContentBoxOf(e) : {
				top: 0,
				left: 0,
				width: 0,
				height: 0
			};
			
			if(h) { return x*100/box.height; }
			else  { return x*100/box.width;  }
			
		}
	};

	function convertToPixels(cssLength, element, heightRelative) {

		var match = cssLength.match(/^\s*(-?\d+(?:\.\d+)?)(\S*)\s*$/),
			currentLength = match ? parseFloat(match[1]) : 0.0,
			currentUnit = match ? match[2] : '',
			converter = unitConverters[currentUnit];

		if (match && converter) {

			return {
				value: converter.call(null, currentLength, element, heightRelative),
				unit: currentUnit
			};

		} else {

			return {
				value: currentLength ? currentLength : 0.0,
				unit: currentUnit ? currentUnit : 'px'
			};

		}
	}

	function convertFromPixels(pixelLength, destinUnit, element, heightRelative) {
		
		var converter = unitBackConverters[destinUnit];
		if(converter) {
			return '' + converter.call(null, pixelLength, element, heightRelative) + '' + destinUnit;
		} else {
			return '' + pixelLength + 'px';
		}
		
	}

	// Naive shallow extend
	function extend(obj, source) {
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}

		return obj;
	}

	scope['BoxOverlay'] = BoxOverlay

})(window)
