/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor', 'CSSUtils'], function(Editor, CSSUtils){
    "use strict";
    
    if (!Editor){
        throw "Missing editor"
    }  
    
    function PolygonEditor(target, property, value){
        Editor.apply(this, arguments)
        
        // array of objects with x, y and unit for each vertex
        this.vertices = []
        
        // Raphael polygon path
        this.shape = null
        
        // TODO: setup offsets
        // TODO: get default units
        // TODO: setup Raphael paper -> move to Editor ?
        // TODO: draw shape
        
        this.setup()
    }
    
    PolygonEditor.prototype = Object.create(Editor.prototype);
    PolygonEditor.prototype.constructor = PolygonEditor;
    
    PolygonEditor.prototype.setup = function(){
        
        this.vertices = this.parseShape(this.value, this.target)
        
        if (!this.vertices.length){
            this.vertices = this.inferPolygonFromElement(this.target)
        }
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
    
    PolygonEditor.prototype.draw = function(){
        // TODO: draw vertices onto the paper
    };
    
    return PolygonEditor
})