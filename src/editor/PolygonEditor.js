/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor', 'CSSUtils', 'snap', 'snap.plugins', 'snap.freeTransform'], function(Editor, CSSUtils, Snap, freeTransform){
    "use strict";
    
    if (!Editor){
        throw Error("Missing editor");
    }
    
    var _defaults = {
        path: {
            stroke: 'black'
        },
        point: {
            radius: 5,
            stroke: 'black',
            fill: 'gray',
        },
        xUnit: 'px',
        yUnit: 'px'
    } 
    
    function PolygonEditor(target, value, options){
        Editor.apply(this, arguments);
        
        // array of objects with x, y, xUnit, yUnit for each vertex
        this.vertices = [];
        
        // Snap polygon path
        this.shape = null;
        
        // Snap instance reference; setup in Editor.js
        this.snap = null
        
        // Snap paper for shape overaly; setup in Editor.js
        this.paper = null;
        
        // Snap group of SVG obj references for rendered vertices
        this.points = null
        
        // TODO: extend with 'options'
        this.config = _defaults;
        
        // SVG object reference of vertex being dragged
        this.activeVertex = null;
        
        // Index of vertex being dragged
        this.activeVertexIndex = null;
        
        this.setup();
        this.applyOffsets();
        this.draw();
        // this.toggleFreeTransform()
    }
    
    PolygonEditor.prototype = Object.create(Editor.prototype);
    PolygonEditor.prototype.constructor = PolygonEditor;
    
    PolygonEditor.prototype.setup = function(){
        /*  
            Sets up: this.holder, this.paper, this.snap, this.offsets
            Called manually so you have the option to implement a different drawing surface
        */ 
        Editor.prototype.setup.call(this);
        
        this.vertices = this.parseShape(this.value, this.target);
        
        if (!this.vertices.length){
            this.vertices = this.inferShapeFromElement(this.target)
        }
        
        this.polygonFillRule = this.vertices.polygonFillRule || 'nonzero'
        
        this.points = this.paper.g()
        
        // polygon path to visualize the shape
        this.shape = this.paper.path().attr(this.config.path).attr('fill','none');
        
        // TODO: throttle sensibly
        window.addEventListener('resize', this.refresh.bind(this));
        this.holder.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.holder.addEventListener('dblclick', this.onDblClick.bind(this));
    };
    
    PolygonEditor.prototype.refresh = function(){
        this.removeOffsets();
        this.setupOffsets();
        this.applyOffsets();
        this.draw();
    };
    
    /*
        Parse polygon string into array of objects with x, y coordinates and units for each vertex.
        Returns an empty array if polygon declaration is invalid.
        
        @example: [{x: 0, y: 0, xUnit: px, yUnit: px}, ...]
        
        @param {String} shape CSS polygon function shape
        @param {HTMLElement} element Reference for content box used when converting units to pixels (e.g. % to px). Usually the element onto which the shape is defined.
        
        @return {Array}
    */
    PolygonEditor.prototype.parseShape = function(shape, element){
        var coords = [],
            infos = null;
        
        // superficial check for shape declaration
        if (typeof shape != 'string' || !/^polygon\(.*?\)/i.test(shape.trim())){
            
            // remove editor DOM saffolding
            this.remove();
            
            throw Error('No polygon() function definition in provided value');
            return
        }
        
        if (infos = /polygon\s*\(([a-z]*),\s*(([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(shape.trim())) {
            coords = (
                infos[2]
                .replace(/\s+/g, ' ')
                .replace(/( ,|, )/g, ',').trim()
                .split(',')
                .map(function(pair) {

                    var points = pair.split(' ').map(function(pointString, i) {
                        
                        // TODO: what about calc(...)?
                        var isHeightRelated = (!!i);
                        
                        return CSSUtils.convertToPixels(pointString, element, isHeightRelated)
                    })
                    
                    if( !points[0] ) { points[0] = { value: 0 } }
                    if( !points[1] ) { points[1] = { value: 0 } }
                    
                    return {
                        x: points[0].value,
                        y: points[1].value,
                        xUnit: points[0].unit,
                        yUnit: points[1].unit
                    };
                    
                })
            );
            
            coords.polygonFillRule = infos[1] || null;
        }
        
        return coords
    };
    
    /*
        Return an array of x, y coordinates and units for the vertices which describe the element as a polygon.
        @throws {TypeError} if element is not a HTMLElement
        
        @param {HTMLElement} element
        @return {Array}
    */
    
    PolygonEditor.prototype.inferShapeFromElement = function(element) {
        if (!(element instanceof HTMLElement)){
            throw TypeError('inferShapeFromElement() \n Expected HTMLElement, got: ' + typeof element + ' ' + element)
        }
        
        var box = CSSUtils.getContentBoxOf(element)
        
        // TODO: also infer unit values
        var coords = [
            { x: 0, y: 0, xUnit: 'px', yUnit: 'px' },
            { x: box.width, y: 0, xUnit: 'px', yUnit: 'px' },
            { x: box.width, y: box.height, xUnit: 'px', yUnit: 'px' },
            { x: 0, y: box.height, xUnit: 'px', yUnit: 'px' }
        ];
        
        coords.polygonFillRule = 'nonzero';
        
        return coords
    };
    
    /*
        Return a valid polygon CSS Shape value from the current editor's state.
        @example polygon(nonzero, 0 0, 100px 0, ...)
        
        @return {String}
    */
    PolygonEditor.prototype.getCSSValue = function(){
        var offsetTop = this.offsets.top,
            offsetLeft = this.offsets.left,
            element = this.target,
            // @see http://dev.w3.org/csswg/css-shapes/#typedef-fill-rule
            fillRule = this.polygonFillRule,
            path;
            
        path = this.vertices.map(function(vertex, i){
            var x, y, xCoord, yCoord;
        
            // remove offsets
            x = Math.ceil(vertex.x - offsetLeft);
            y = Math.ceil(vertex.y - offsetTop);

            // turn px value into original units
            xCoord = CSSUtils.convertFromPixels(x, vertex.xUnit, element, false)
            yCoord = CSSUtils.convertFromPixels(y, vertex.yUnit, element, false)
            
            // return space-separted pair
            return [xCoord, yCoord].join(' ')
        }) 
        
        return 'polygon(' + [fillRule, path.join(', ')].join(', ') + ')'
    };
    
    /*
        Mutates the vertices array to account for element offsets on the page.
        This is required because the editor surface is 100% of the viewport and
        we are working with absolute units while editing.
        
        Offsets must be subtracted when the output polygon value is requested.
        
        @see PolygonEditor.removeOffsets()
    */
    PolygonEditor.prototype.applyOffsets = function(){
        this.vertices.forEach(function(v){
            v.x = v.x + this.offsets.left;
            v.y = v.y + this.offsets.top;
        }.bind(this))
    };
    
    /*
        Mutates the vertices array to subtract the offsets.
        
        @see PolygonEditor.applyOffsets()
    */
    PolygonEditor.prototype.removeOffsets = function(){
        this.vertices.forEach(function(v){
            v.x = v.x - this.offsets.left;
            v.y = v.y - this.offsets.top;
        }.bind(this))
    };
    
    /*
        Mousedown handler:
        - get the vertex at event target, if one exists
        OR
        - insert a new vertex if event target is close to a polygon edge
        THEN
        - attach event handlers for dragging the vertex
    */
    PolygonEditor.prototype.onMouseDown = function(e){
        var edge,
            // need target as a Raphael obj reference; e.target won't suffice.
            target = Snap.getElementByPoint(e.x, e.y);
        
        // prevent vertex editing while transform editor is on
        if (this.transformEditor){
            return
        }
        
        // check if target is a vertex representation i.e. draggable point
        if (target && target.data && typeof target.data('vertex-index') == 'number'){
            
            this.activeVertex = target;
            this.activeVertexIndex = target.data('vertex-index');
            
        } else {
            
            edge = this.polygonEdgeNear({x: e.x, y: e.y});
            
            if (edge){
                // insert new vertex
                // TODO: insert vertex precisely on the segment, or at event ?
                this.vertices.splice(edge.index1, 0, {
                    x: e.x,
                    y: e.y,
                    // TODO: infer units from the vertices of the edge
                    xUnits: this.config.xUnit,
                    yUnits: this.config.yUnit,
                });
                
                this.draw();
                
                this.activeVertex = Snap.getElementByPoint(e.x, e.y);
                this.activeVertexIndex = edge.index1;
            }
        } 
        
        if (!this.activeVertex || typeof this.activeVertexIndex !== 'number'){
            return
        }
        
        // attaches mousemove and mouseup
        this.handleDragging()
    };
    
    PolygonEditor.prototype.handleDragging = function(){
        var self = this;
        var _mouseMove = function(e){
            return self.onMouseMove.call(self, e);
        };
        
        var _mouseUp = function(){
            return function(){
                this.activeVertex = null;
                this.activeVertexIndex = null;
                this.holder.removeEventListener('mousemove', _mouseMove);
            }.call(self);
        };
        
        this.holder.addEventListener('mousemove', _mouseMove);
        this.holder.addEventListener('mouseup', _mouseUp);
    };
    
    /*
        Upate the current active vertex's coordinates with the event x and y,
        then redraw the shape.
    */
    PolygonEditor.prototype.onMouseMove = function(e){
        // 'this' is the PolygonEditor instance
        var vertex = this.vertices[this.activeVertexIndex]
        vertex.x = e.x;
        vertex.y = e.y;
        
        this.draw();
    }
    
    /*
        Given a point with x, y coordinates, attempt to find the polygon edge to which it belongs.
        Returns an object with indexes for the two vertices which define the edge.
        Returns null if the point does not belong to any edge.
        
        @example .polygonEdgeNear({x: 0, y: 100}) // => {index0: 0, index1: 1}
        
        @param {Object} p Object with x, y coordinates for the point to find nearby polygon edge.
        @return {Object | null} 
    */
    PolygonEditor.prototype.polygonEdgeNear = function(p){
        var edge = null,
            vertices = this.vertices,
            radius = this.config.point.radius,
            thresholdDistance = radius * radius;
        
        vertices.forEach(function(v, i){
            var v0 = vertices[i],
                v1 = vertices[(i + 1) % vertices.length];
                
            if (_distanceToEdgeSquared(v0, v1, p) < thresholdDistance){
                edge = {index0: i, index1: (i + 1) % vertices.length};
            }
        }) 
        
        return edge;
    };
    
    /*
        Double click handler:
        - if event target is on a vertex, remove it
        - redraw shape
        
        //TODO: prevent delete if less than 2 vertices left?
    */
    PolygonEditor.prototype.onDblClick = function(e){
        var target = Snap.getElementByPoint(e.x, e.y);
        
        // check if target is a vertex representation i.e. draggable point
        if (target && target.data && typeof target.data('vertex-index') == 'number'){
            
            // remove the vertex
            this.vertices.splice(target.data('vertex-index'), 1);
            this.draw();
        }
    };
    
    PolygonEditor.prototype.draw = function(){
        var paper = this.paper,
            config = this.config,
            doNotDrawVertices = (this.transformEditor != null),
            points = this.points,
            commands = [];
            
        this.points.clear()
        
        this.vertices.forEach(function(v, i) {
            
            if (!doNotDrawVertices){
                var point = paper.circle(v.x, v.y, config.point.radius)
                point.attr(config.point)
                point.data('vertex-index', i)
                points.add(point)
            }
            
            if (i === 0){
                // Move cursor to first vertex, then prepare drawing lines
                ['M' + v.x, v.y].forEach(function(cmd) {
                    commands.push(cmd)
                });
            } else {
                commands.push('L' + v.x, v.y);
            }
        });
        
        // close path
        commands.push('z');
        
        // draw the polygon shape
        this.shape.attr('path', commands).toBack();
        
        this.trigger('shapechange', this)
    };
    
    PolygonEditor.prototype.toggleFreeTransform = function(){
        
        // make a clone of the vertices to avoid compound tranforms
        var verticesClone = (JSON.parse(JSON.stringify(this.vertices)));
        
        function _transformPoints(){
            
            var matrix = this.shapeClone.transform().localMatrix,
                vertices = this.vertices;
                
            verticesClone.forEach(function(v, i){
                vertices[i].x = matrix.x(v.x,v.y);
                vertices[i].y = matrix.y(v.x,v.y);
            }) 
            
            this.draw()
        }
        
        if (this.transformEditor){
            this.shapeClone.remove();
            this.transformEditor.unplug();
            delete this.transformEditor
            
            return;
        }
        
        // using a phantom shape because we already redraw the path by the transformed coordinates.
        // using the same path would result in double transformations for the shape
        this.shapeClone = this.shape.clone().attr('stroke', 'none')
        
        this.transformEditor = Snap.freeTransform(this.shapeClone, {
            draw: ['bbox'],
            keepRatio: ['bboxCorners'],
            rotate: ['axisX'],
            scale: ['bboxCorners','bboxSides'],
            distance: '0.6'
        }, _transformPoints.bind(this));
    };
    
    PolygonEditor.prototype.turnOnFreeTransform = function(){
        if (this.transformEditor){
            // aready turned on
            return
        }
        
        this.toggleFreeTransform();
    };
    
    PolygonEditor.prototype.turnOffFreeTransform = function(){
        if (!this.transformEditor){
            // already turned off
            return
        }
        
        this.toggleFreeTransform();
    };
    
    /*
        Calculate min distance between a point and a line,
        @see http://paulbourke.net/geometry/pointlineplane/
        Accepts three points with x/y keys for unit-less coordinates.
        
        @param {Object} p1 Start of line
        @param {Object} p2 End of line
        @param {Object} p3 Point away from line
        
        @example _distanceToEdgeSquared({x:0, y:0}, {x: 0, y: 100}, {x: 100, 100})
        
        @return {Number} distance from point to line
    */
    function _distanceToEdgeSquared(p1, p2, p3){
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        
        if (dx == 0 && dy == 0){
            return Number.POSITIVE_INFNITY;
        }
        
        var u = ((p3.x - p1.x) * dx + (p3.y - p1.y) * dy) / (dx * dx + dy * dy);
        
        if (u < 0 || u > 1){
            return Number.POSITIVE_INFINITY;
        }
        
        var x = p1.x + u * dx;  // closest point on edge p1,p2 to p3
        var y = p1.y + u * dy;
        
        return Math.pow(p3.x - x, 2) + Math.pow(p3.y - y, 2);
    };
    
    return PolygonEditor
})