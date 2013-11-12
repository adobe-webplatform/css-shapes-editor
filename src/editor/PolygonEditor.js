/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor', 'CSSUtils', 'Raphael'], function(Editor, CSSUtils, Raphael){
    "use strict";
    
    if (!Editor){
        throw "Missing editor"
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
    
    function PolygonEditor(target, property, value, options){
        Editor.apply(this, arguments);
        
        // array of objects with x, y and unit for each vertex
        this.vertices = [];
        
        // Raphael polygon path
        this.shape = null;
        
        // Raphael paper for shape overlay.
        this.paper = null;
        
        // TODO: extend with 'options'
        this.config = _defaults;
        
        // TODO: get default units
        // TODO: delegate click on points
        // TODO: delegate click on path
        
        this.setup();
        this.applyOffsets();
        this.draw();
    }
    
    PolygonEditor.prototype = Object.create(Editor.prototype);
    PolygonEditor.prototype.constructor = PolygonEditor;
    
    PolygonEditor.prototype.setup = function(){
        this.vertices = this.parseShape(this.value, this.target)
        
        if (!this.vertices.length){
            this.vertices = this.inferPolygonFromElement(this.target)
        }
        
        // Raphael paper onto which to draw TODO: move to Editor.js?
        this.paper = Raphael(this.holder, '100%', '100%');
        
        
        // TODO: throttle sensibly
        window.addEventListener('resize', this.refresh.bind(this))
        this.holder.addEventListener('mousedown', this.onMouseDown.bind(this))
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
        
        @param {String} polygon CSS polygon function shape
        @param {HTMLElement} element Reference for content box used when converting units to pixels (e.g. % to px). Usually the element onto which the shape is defined.
        
        @return {Array}
    */
    PolygonEditor.prototype.parseShape = function(polygon, element){
        var coords = [],
            infos = null;
        
        if (infos = /(\s*)polygon\s*\(([a-z, ]*)(([-+0-9.]+[a-z%]*|calc\([^)]*\)|\s|\,)*)\)?(\s*)/i.exec(polygon)) {
            coords = (
                infos[3]
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
            
            // TODO: rename to 'fillRule' http://dev.w3.org/csswg/css-shapes/#typedef-fill-rule
            coords.prelude = infos[2];
        }
        
        return coords
    };
    
    /*
        Return an array of x, y coordinates and units for the vertices which describe the element as a polygon.
        @throws {TypeError} if element is not a HTMLElement
        
        @param {HTMLElement} element
        @return {Array}
    */
    
    PolygonEditor.prototype.inferPolygonFromElement = function(element) {
        if (!(element instanceof HTMLElement)){
            throw TypeError('inferPolygonFromElement() \n Expected HTMLElement, got: ' + typeof element + ' ' + element)
        }
        
        var box = CSSUtils.getContentBoxOf(element)
        
        // TODO: also infer unit values
        var coords = [
            { x: 0, y: 0, xUnit: 'px', yUnit: 'px' },
            { x: box.width, y: 0, xUnit: 'px', yUnit: 'px' },
            { x: box.width, y: box.height, xUnit: 'px', yUnit: 'px' },
            { x: 0, y: box.height, xUnit: 'px', yUnit: 'px' }
        ]
        
        return coords
    };
    
    PolygonEditor.prototype.getCSSValue = function(){
        // TODO: subtract offsets from vertices
        // TODO: return CSS formatted polygon
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
    
    PolygonEditor.prototype.onMouseDown = function(e){
        // console.log(e.target.tagName === 'circle')
        // console.log(this)              
        var edge = this.polygonEdgeNear({x: e.x, y: e.y})
        
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
            
            this.draw()
        }
    };
    
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
                
            if (distanceToEdgeSquared(v0, v1, p) < thresholdDistance){
                edge = {index0: i, index1: (i + 1) % vertices.length};
            }
        }) 
        
        return edge;
    }
    
    PolygonEditor.prototype.draw = function(){
        var paper = this.paper,
            config = this.config,
            commands = [];
        
        // TODO: add container for points and clear that
        this.paper.clear()
        
        this.vertices.forEach(function(v, i) {
            
            // TODO: add to fragment, then to page
            var point = paper.circle(v.x, v.y, config.point.radius)
            point.attr(config.point)
            point.node.setAttribute('data-vertexIndex', i)
            
            if (i === 0){
                // Move cursor to first vertex, then prepare drawing lines
                ['M', v.x, v.y, 'L'].forEach(function(cmd) {
                    commands.push(cmd)
                });
            } else {
                commands.push(v.x, v.y);
            }
        });
        
        // close path
        commands.push('z');
        
        // polygon path to visualize the shape
        this.shape = this.paper.path().attr(this.config.path);
        
        // draw the polygon shape
        this.shape.attr('path', commands).toBack();
    };
    
    // See http://paulbourke.net/geometry/pointlineplane/
    
    function distanceToEdgeSquared(p1, p2, p3){
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
    }
    
    return PolygonEditor
})