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
			stroke: 'black'
		},
		point: {
			stroke: 'black',
			fill: 'gray',
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
	function ShapeOverlay(element, config) {
		if (!element) {
			return
		}

		this.config = extend(defaults, config)

		this.xs = []; // stores the real x values
		this.ys = []; // stores the real y values
		this.ms = []; // stores the metadata values (unit)

		this.currIndex = -1;
		this.shapeChangeListeners = [];
		this.isShapeEditable = true;
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
		Object.defineProperty(ShapeOverlay.prototype, constant, {
			value: constants[constant]
		});
	}

	ShapeOverlay.prototype.setup = function(v) {

		// update the config as needed
		if (this.paper && this.config.update) {
			this.config = extend(defaults, this.config.update(v))
		}

		// load or infer coordinates
		var coords = getPointsFromPolygon(this.config.shape, this.element)

		if (!coords.length) {
			coords = getPointsFromElement(this.element)
		}

		if (!coords.length) {
			
			// if no point, at the origin as a first point
			coords.push({
				x: 0,
				y: 0
			})
			
			// notify the error in the console
			setTimeout(function() {
				throw new Error('No path information could be extracted from config.shape or infered from the element\'s bounding rectangle')
			}, 0);
			
		}
		
		// make sure we can draw a shape from the coords
		while(coords.length < 3) {
			coords.push({
				x: 100*Math.random(),
				y: 100*Math.random()
			})
		}
		
		// close the toggle editing, if needed
		if(this.transformEditor) { debugger; this.func=''; this.toggleTransformEditor(); }

		// sets this.holder
		this.setupEditorHolder()

		// sets this.elRect, this.offsetLeft, this.offsetTop
		this.setupOffsets()

		// setup the points
		this.setupPoints(coords);
		this.drawPaths();
		
		// only allow transforms if we are working on function
		if(this.func) { this.toggleTransformEditor(); }

		// TODO: refresh editor after DOM Mutation
		// this.mutationObserver = new MutationObserver(this.refresh.bind(this));
		window.addEventListener('resize', this.refresh.bind(this));
	}

	ShapeOverlay.prototype.refresh = function() {
		this.setupEditorHolder()
		this.setupOffsets()
	}

	ShapeOverlay.prototype.setupPoints = function(coords) {
		
		// store any metadata we could find before the points
		if(coords.prelude) {
			this.prelude = coords.prelude;
		} else {
			this.prelude = '';
		}
		
		if(coords.func) {
			this.func = coords.func;
			this.args = coords.args;
		} else {
			this.func = '';
			this.args = null;
		}
		
		// add or modify existing points
		if (!this.paper) {

			this.paper = Raphael(this.holder, '100%', '100%');
			this.points = this.paper.set();
			this.halfPoints = this.paper.set();

			// path to visualize the polygon
			this.path = this.paper.path()
				.attr(this.config.path);

			// thicker transparent path, stacked on top of the real path to make it easier to hit with the mouse
			this.pathShield = this.paper.path()
				.attr({
				'stroke-width': this.ACTIVE_RADIUS,
				'stroke-linejoin': 'round',
				opacity: 0
			});
			
			// TODO: look at isShapeEditable
			this.pathShield.mouseover(this.showFunction(this.halfPoints, this.pathShield, this.halfPoints));

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
				
				// update the metadata informations
				this.ms[index] = pair;

				// add points to the paper
				this.updatePoint(index, pair.x, pair.y);

			}.bind(this))

		}
		
	}

	ShapeOverlay.prototype.setupOffsets = function() {
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

	ShapeOverlay.prototype.setupEditorHolder = function() {

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
		this.holder.setAttribute('data-role', 'shape-editor')

		// add this layer to the document
		document.documentElement.appendChild(this.holder)
		
		// resize tricks
		this.setupEditorHolder();

	}

	ShapeOverlay.prototype.remove = function() {
		if (this.holder && this.holder.parentElement) {
			this.holder.parentElement.removeChild(this.holder)
			if(this.scheduleTimer) {
				window.removeEventListener("mousedown", this.scheduleTimer, true);
				window.removeEventListener("mouseup", this.onMouseUp, true);
			}
		}
	}

	ShapeOverlay.prototype.showFunction = function(show, focus, unfocus) {
		var overlay = this;

		return function() {
			if (!overlay.isShapeEditable) {
				return false
			}
			show.animate({
				opacity: overlay.MIN_OPACITY
			}, overlay.ANIM_TIME);
			// unfocus.unmouseout();
			focus.mouseout(overlay.hideFunction(show));
		};
	}

	ShapeOverlay.prototype.hideFunction = function(hide) {
		var overlay = this;
		return function() {
			hide.animate({
				opacity: 0
			}, overlay.ANIM_TIME);
		};
	}

	ShapeOverlay.prototype.removePoint = function(x, y, i) {

		// refuse to remove any point if we cannot form a shape
		if (this.xs.length < 3) return;

		// remove the related data
		this.xs.splice(i, 1);
		this.ys.splice(i, 1);
		this.ms.splice(i, 1);

		// remove the last point and reposition the rest of the points based on the remaining x/y coordinates
		this.points.pop().remove();
		this.halfPoints.pop().remove();
		for (var i = 0, len = this.xs.length; i < len; i++) {
			this.updatePoint(i, this.xs[i], this.ys[i]);
		}

	}

	ShapeOverlay.prototype.addPoint = function(x, y, i, metadata) {
		metadata = Object(metadata) // also converts null & undefined to objects

		var point = (function(i, x, y, overlay, speculative) {

			var halfX, halfY, halfClientX, halfClientY;
			var halfPoint = overlay.paper.circle(x, y, overlay.MIN_RADIUS)
				.attr(overlay.config.point)
				.attr({ opacity: 0 })
				.mousedown(
					function halfDragStart(event) {

						overlay.isDraggingInProgress = true;

						halfX = halfPoint.attr('cx');
						halfY = halfPoint.attr('cy');
						halfClientX = event.clientX;
						halfClientY = event.clientY;

						var point = overlay.addPoint(halfX, halfY, i + 1, null);
						if (overlay.currIndex != i + 1) {
							overlay.currIndex = i + 1;
							point.toFront();
						}

						function halfDragMove(event) {
							var dx = event.clientX - halfClientX;
							var dy = event.clientY - halfClientY;
							overlay.updatePoint(i + 1, halfX + dx, halfY + dy)
							event.stopImmediatePropagation();
							event.preventDefault();
						}

						function halfDragEnd() {
							overlay.isDraggingInProgress = false;
							window.removeEventListener('mousemove', halfDragMove, true);
							window.removeEventListener('mouseup', halfDragEnd, true);
						}

						window.addEventListener('mousemove', halfDragMove, true);
						window.addEventListener('mouseup', halfDragEnd, true);

					}
				)
			;

			overlay.halfPoints.push(halfPoint);

			function dragStart() {
				overlay.isDraggingInProgress = true;
				x = overlay.xs[i];
				y = overlay.ys[i];
				if (overlay.currIndex != i) {
					overlay.currIndex = i;
					point.toFront();
				}
			}

			function dragMove(dx, dy) {
				overlay.updatePoint(i, x + dx, y + dy);
			}

			function dragEnd() {
				overlay.isDraggingInProgress = false;

				x = overlay.xs[i];
				y = overlay.ys[i];
			}

			var point = (
				overlay.paper.circle(x, y, overlay.MIN_RADIUS)
				.attr(overlay.config.point)
				.drag(dragMove, dragStart, dragEnd)
				.dblclick(function() {
					overlay.removePoint(x, y, i);
				})
			);

			overlay.points.push(point);

			return point;

		})(this.points.length, x, y, this);

		if (i >= 0) {
			this.halfPoints.attr('opacity', this.MIN_OPACITY);
			this.halfPoints.unmouseover()
				.mouseover(this.showFunction(this.halfPoints, this.halfPoints, this.pathShield));
			this.xs.splice(i, 0, x);
			this.ys.splice(i, 0, y);
			this.ms.splice(i, 0, metadata);
			for (var j = 0; j < this.xs.length; j++) {
				this.updatePoint(j, this.xs[j], this.ys[j]);
			}
		} else {
			this.xs.push(x);
			this.ys.push(y);
			this.ms.push(metadata);
		}

		return point;
	}

	ShapeOverlay.prototype.updateHalfPoint = function(i) {
		var i2 = (i + 1) % this.halfPoints.length;
		var x = (this.xs[i] + this.xs[i2]) / 2;
		var y = (this.ys[i] + this.ys[i2]) / 2;
		this.halfPoints.items[i].attr({
			cx: x,
			cy: y
		});
	}

	ShapeOverlay.prototype.updatePoint = function(i, cx, cy) {
		this.xs[i] = cx;
		this.ys[i] = cy;

		this.points.items[i].attr({
			cx: cx,
			cy: cy
		});

		this.updateHalfPoint(i);
		this.updateHalfPoint((i + this.halfPoints.length - 1) % this.halfPoints.length);

		this.drawPaths();
		this.notifyListeners();
	}

	ShapeOverlay.prototype.hidePoints = function() {
		this.points.items.map(function(point) {
			point.hide()
		})
	}

	ShapeOverlay.prototype.showPoints = function() {
		this.points.items.map(function(point) {
			point.show()
		})
	}

	ShapeOverlay.prototype.drawPaths = function() {
		var commands = ['M', this.points[0].attrs.cx, this.points[0].attrs.cy, 'L'];
		for (var i = 1; i < this.points.length; i++) {
			var pt = this.points[i].attrs
			commands.push(pt.cx, pt.cy);
		}
		commands.push('z');

		this.path.attr('path', commands);
		this.pathShield.attr('path', commands);
	}

	ShapeOverlay.prototype.notifyListeners = function() {
		for (var listener in this.shapeChangeListeners)
		this.shapeChangeListeners[listener]();
	}
	ShapeOverlay.prototype.shapechange = function(callback) {
		this.shapeChangeListeners.push(callback);
	}

	ShapeOverlay.prototype.toggleTransformEditor = function() {

		var overlay = this,
			pointsSnapshot = this.points.items.map(function(point, i) {
				return {
					x: point.attrs.cx,
					y: point.attrs.cy
				}
			})

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

		if (this.transformEditor) {
			
			// do not allow to escape transform mode for functions
			if(this.func) { return; }

			// abort any dragging process
			this.isDraggingInProgress = false;
			clearTimeout(timer); timer = 0;
			window.removeEventListener("mousedown", this.scheduleTimer, true);
			window.removeEventListener("mouseup", this.onMouseUp, true);

			// remove the transform editor
			this.transformEditor.unplug()
			this.phantomPath.remove()
			
			// show polygon editor points
			this.isShapeEditable = true
			this.showPoints()
			
			// remove junk
			delete this.phantomPath
			delete this.transformEditor
			return

		} else {

			// prepare for dragging
			window.addEventListener("mousedown", this.scheduleTimer=scheduleTimer, true);
			window.addEventListener("mouseup", this.onMouseUp=onMouseUp, true);

		}

		// hide polygon editor points
		this.hidePoints()
		this.isShapeEditable = false

		// using a phantom path because we already redraw the path by the transformed coordinates.
		// using the same path would result in double transformations for the path
		this.phantomPath = overlay.path.clone()
			.attr({
			'stroke': overlay.TRANSPARENT
		})

		this.transformEditor = overlay.paper.freeTransform(this.phantomPath, {
			draw: ['bbox'],
			keepRatio: ['bboxCorners'],
			rotate: [(this.func ? 'none' : 'axisX')],
			scale: ['bboxCorners', (this.func !== 'circle' ? 'bboxSides' : 'none')],
			distance: '0.8'
		}, transformPoints);
	}

	ShapeOverlay.prototype.refreshShape = function() {
		
	}
	
	/*
		Get a polygon definition path for use with CSS Shapes properties
		@example: "polygon(0px 0px, 800px 0px, 800px 400px, 0px 400px)"

		@return {String}
	*/
	ShapeOverlay.prototype.getPolygonPath = function() {
		var overlay = this;
		
		switch(this.func) {
		case 'rectangle':
			//
			// export a rectangle declaration
			// expects exactly four points with the rect coordinates
			//
			
			// extracts location
			var x = this.xs[0]-overlay.offsetLeft;
			var y = this.ys[0]-overlay.offsetTop;
			var w = this.xs[2]-x-overlay.offsetLeft;
			var h = this.ys[2]-y-overlay.offsetTop;
			
			// extracts data
			var args = this.args;
			var otherArgs = '';
			if(args.length>4) {
				otherArgs += ', ' + convertFromPixels(args[4].value, args[4].unit, overlay.element, false);
				if(args.length>5) {
					otherArgs += ', ' + convertFromPixels(args[5].value, args[5].unit, overlay.element, true);
				}
			}
			return (
				'rectangle(' + 
					convertFromPixels(x, args[0].unit, overlay.element, false) + ', ' +
					convertFromPixels(y, args[1].unit, overlay.element, true) + ', ' +
					convertFromPixels(w, args[2].unit, overlay.element, false) + ', ' +
					convertFromPixels(h, args[3].unit, overlay.element, true) + otherArgs + 
				')'
			);
			
		case 'inset-rectangle':
			//
			// export a rectangle declaration
			// expects exactly four points with the rect coordinates
			//
			
			// extracts location
			var contentBox = getContentBoxOf(overlay.element);
			var l = this.xs[0]-overlay.offsetLeft;
			var t = this.ys[0]-overlay.offsetTop;
			var w = this.xs[2]-x-overlay.offsetLeft;
			var h = this.ys[2]-y-overlay.offsetTop;
			var b = contentBox.height - h - y;
			var r = contentBox.width - w - x;
			
			// extracts data
			var args = this.args;
			var otherArgs = '';
			if(args.length>4) {
				otherArgs += ', ' + convertFromPixels(args[4].value, args[4].unit, overlay.element, false);
				if(args.length>5) {
					otherArgs += ', ' + convertFromPixels(args[5].value, args[5].unit, overlay.element, true);
				}
			}
			return (
				'inset-rectangle(' + 
					convertFromPixels(t, args[0].unit, overlay.element, true) + ', ' +
					convertFromPixels(r, args[1].unit, overlay.element, false) + ', ' +
					convertFromPixels(b, args[2].unit, overlay.element, true) + ', ' +
					convertFromPixels(l, args[3].unit, overlay.element, false) + otherArgs + 
				')'
			);
			
		case 'ellipse':
			//
			// export a rectangle declaration
			// expects exactly four points with the rect coordinates
			//
			
			// extracts location
			var contentBox = getContentBoxOf(overlay.element);
			var cx = this.xs[0]-overlay.offsetLeft;
			var cy = this.ys[1]-overlay.offsetTop;
			var rx = this.xs[1]-this.xs[0];
			var ry = this.ys[1]-this.ys[0];
			
			// extracts data
			var args = this.args;
			return (
				'ellipse(' + 
					convertFromPixels(cx, args[0].unit, overlay.element, false) + ', ' +
					convertFromPixels(cy, args[1].unit, overlay.element, true) + ', ' +
					convertFromPixels(rx, args[2].unit, overlay.element, false) + ', ' +
					convertFromPixels(ry, args[3].unit, overlay.element, true) +
				')'
			);
			
		case 'circle':
			//
			// export a rectangle declaration
			// expects exactly four points with the rect coordinates
			//
			
			// extracts location
			var contentBox = getContentBoxOf(overlay.element);
			var cx = this.xs[0]-overlay.offsetLeft;
			var cy = this.ys[1]-overlay.offsetTop;
			var rx = this.xs[1]-this.xs[0];
			
			// extracts data
			var args = this.args;
			return (
				'circle(' + 
					convertFromPixels(cx, args[0].unit, overlay.element, false) + ', ' +
					convertFromPixels(cy, args[1].unit, overlay.element, true) + ', ' +
					convertFromPixels(rx, args[2].unit, overlay.element, 2) + 
				')'
			);
			
		default:
			// 
			// export a polygon declaration
			// 
			var path = (
				overlay.points.items.map(function(point, i) {

					// remove original offset of the element
					var x = Math.ceil(point.attrs.cx - overlay.offsetLeft)
					var y = Math.ceil(point.attrs.cy - overlay.offsetTop)

					// TODO: WORK ON PER-COMPONENT UNITS
					var xUnit = overlay.ms[i].xUnit || overlay.config.defaultXUnit || 'px';
					var yUnit = overlay.ms[i].yUnit || overlay.config.defaultYUnit || 'px';
					return (
						convertFromPixels(x, xUnit, overlay.element, false) 
						+ ' ' + convertFromPixels(y, yUnit, overlay.element, true)
					);
				
				})
			);

			var defaultPreludeFinder = (/\s*nonzero\s*\,\s*/);
			var prelude = (overlay.prelude ? overlay.prelude : '');
			if(defaultPreludeFinder.test(prelude)) { prelude = ''; }
			return 'polygon(' + prelude + path.join(', ') + ')';
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
		if (infos = /(\s*)polygon\s*\(([a-z, ]*)(([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(path)) {
			
			//
			// code for polygons (main subject of this editor)
			//
			
			coords = (
				infos[3]
				.replace(/\s+/g, ' ')
				.replace(/( ,|, )/g, ',').trim()
				.split(',')
				.map(function(pair) {

					var points = pair.split(' ').map(function(point, i) {

						// TODO: what about calc(...)?
						var isHeightRelated = (!!i);
						return convertToPixels(point, element, isHeightRelated)

					})
				
					if(!points[0]) { points[0] = {value:0} }
					if(!points[1]) { points[1] = {value:0} }

					return {
						x: points[0].value,
						y: points[1].value,
						xUnit: points[0].unit,
						yUnit: points[1].unit
					};

				})
			);
			
			coords.prelude = infos[2];

		} else if (infos = /(\s*)rectangle\s*\((([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(path)) {
			
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
			
		} else if (infos = /(\s*)inset-rectangle\s*\((([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(path)) {
			
			//
			// code for inset rectangles (wtf, why u no just support calc?)
			// 
			var args = (
				infos[2]
				.replace(/\s+/g, ' ')
				.replace(/( ,|, )/g, ',').trim()
				.split(',')
				.map(function(point, i) {

					var isHeightRelated = !(i%2);
					return convertToPixels(point, element, isHeightRelated);

				})
			);
			
			while(args.length<4) { args.push({value:0,unit:'px'}) }
			
			// gather some info on the element
			var contentBox = getContentBoxOf(element);
			
			// build fake coordinates
			var x = args[3].value;
			var y = args[0].value;
			var w = contentBox.width - args[1].value - x;
			var h = contentBox.height - args[2].value - y;
			coords.push({ x: x,   y: y   });
			coords.push({ x: x+w, y: y   });
			coords.push({ x: x+w, y: y+h });
			coords.push({ x: x,   y: y+h });
			
			coords.args = args;
			coords.func = 'inset-rectangle';
			
		} else if (infos = /(\s*)ellipse\s*\((([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(path)) {
			
			//
			// code for inset rectangles (wtf, why u no just support calc?)
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
			
			// gather some info on the element
			var contentBox = getContentBoxOf(element);
			
			// build fake coordinates
			var cx = args[0].value;
			var cy = args[1].value;
			var rx = args[2].value;
			var ry = args[3].value;
			coords.push({ x: cx,    y: cy-ry  });
			coords.push({ x: cx+rx, y: cy     });
			coords.push({ x: cx,    y: cy+ry  });
			coords.push({ x: cx-rx, y: cy     });
			
			coords.args = args;
			coords.func = 'ellipse';
			
		} else if (infos = /(\s*)circle\s*\((([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(path)) {
			
			//
			// code for inset rectangles (wtf, why u no just support calc?)
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
			
			while(args.length<3) { args.push({value:10,unit:'px'}) }
			
			// gather some info on the element
			var contentBox = getContentBoxOf(element);
			
			// build fake coordinates
			var cx = args[0].value;
			var cy = args[1].value;
			var rx = args[2].value;
			var ry = rx;
			coords.push({ x: cx,    y: cy-ry  });
			coords.push({ x: cx+rx, y: cy     });
			coords.push({ x: cx,    y: cy+ry  });
			coords.push({ x: cx-rx, y: cy     });
			
			coords.args = args;
			coords.func = 'circle';
			
		}

		return coords
	}

	/*
		Get polygon coordinate points from an element's boundingClientRect
		@param {DOM Element} element
		@return {Array} Array of objects with x/y coordinates for the corners of the element. Returns empty array if no element or element invalid
	*/
	function getPointsFromElement(element) {
		var coords = [],
			box = element ? getContentBoxOf(element) : null

		if (box) {
			coords = [ {x:0, y:0}, {x:box.width, y:0}, {x:box.width, y:box.height}, {x:0,y:box.height} ]
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
			
            // get the box from which to compute the percentages
			var box = e ? getContentBoxOf(e) : {
				top: 0,
				left: 0,
				width: 0,
				height: 0
			};
			
            // special case of a circle radius:
			if(h==2) { return x*100/Math.sqrt(box.height*box.height+box.width*box.width); }
            
            // otherwise, we use the width or height
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
				value: Math.round(20*converter.call(null, currentLength, element, heightRelative))/20,
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
			return '' + (Math.round(20*converter.call(null, pixelLength, element, heightRelative))/20) + '' + destinUnit;
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

	scope['ShapeOverlay'] = ShapeOverlay

})(window)
