/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['PolygonEditor', 'CircleEditor', 'EllipseEditor', 'RectangleEditor', 'lodash'], function(PolygonEditor, CircleEditor, EllipseEditor, RectangleEditor, _){
    
    'use strict';
    
    function CSSShapesEditor(target, value, options){
        
        var _defaults = {
            path: {
                stroke: 'rgba(0, 192, 238, 1)',
                'stroke-dasharray': '4, 4',
                fill: 'rgba(0,0,0,0)' // required; tricks transform editor to accept self-drag
            },
            point: {
                radius: 4,
                stroke: 'rgba(0, 192, 238, 1)',
                fill: 'rgba(252, 252, 252, 1)',
            }
        };
        
        options = _.extend({}, _defaults, options);
        
        /*
            Get shape type from provided string.
            
            @param {String} string with function-like notation such as:
                            polygon(...), circle(), ellipse() or rectangle()
            @throws {TypeError} if input does not contain function-like notation
            @return {String} name of shape
        */
        function _getShape(string){
            if (string.indexOf('(') < 0) {
                throw new TypeError('Value does not contain a shape function');
            }
            return string.split('(')[0].trim();
        }
        /*
            Get shape editor class appropriate for given shape.
            
            @param {String} shape Any of: polygon, circle, ellipse, rectangle
            @throws {TypeError} if shape is not recognized
            @return {Object} shape editor class
        */
        function _getFactory(shape){
            var Factory;
            
            switch (shape) {
            case 'polygon':
                Factory = PolygonEditor;
                break;

            case 'circle':
                Factory = CircleEditor;
                break;

            case 'ellipse':
                Factory = EllipseEditor;
                break;

            case 'rectangle':
                Factory = RectangleEditor;
                break;

            default:
                throw new TypeError('Value does not contain a valid shape function');
            }
            
            return Factory;
        }
        
        // ensure omitting 'new' is harmless
        if (!(this instanceof CSSShapesEditor)){
            return new CSSShapesEditor(target, value, options);
        }
        
        var _shape = _getShape(value),
            _factory = _getFactory(_shape),
            _old_update = _factory.prototype.update,
            _editor = new _factory(target, value, options);;
        
        /* 
            Hijack the update method to check if shape editor needs 
            to mutate when the update string contains a different shape type.
            
            @example 'polygon()' -> 'circle()', editor becomes CircleEditor instance
        */
        _factory.prototype.update = function(value){
            
            var newShape = _getShape(value);
            
            // updating to a different shape type, replace the editor.
            if (newShape !== _shape){
                
                _factory = _getFactory(newShape)
                
                // clean-up old editor
                _editor.remove();
                
                // replace editor
                _editor = new _factory(target, value, options);
                
                // cache current shape type
                _shape = newShape;
                
                return;
            }
            // updating same shape type; business as usual
            else{
                _old_update.call(_editor, value);
            }
        }
        
        return _editor;
    }
    
    return CSSShapesEditor;
});
