/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['PolygonEditor', 'CircleEditor', 'EllipseEditor', 'RectangleEditor'], function(PolygonEditor, CircleEditor, EllipseEditor, RectangleEditor){
    
    'use strict';
    
    function CSSShapesEditor(target, value, options){
        
        // ensure omitting 'new' is harmless
        if (!(this instanceof CSSShapesEditor)){
            return new CSSShapesEditor(target, value, options);
        }
        
        if (value.indexOf('(') < 0) {
            throw new TypeError('Value does not contain a shape function');
        }
        
        var shape = value.split('(')[0].trim(),
            Factory;
        
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
        
        return new Factory(target, value, options);
    }
    
    return CSSShapesEditor;
});
