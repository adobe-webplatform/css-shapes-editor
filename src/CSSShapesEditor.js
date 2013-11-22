/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['PolygonEditor', 'CircleEditor', 'EllipseEditor', 'RectangleEditor'], function(PolygonEditor, CircleEditor, EllipseEditor, RectangleEditor){
    
    function CSSShapesEditor(target, value, options){
        
        if (value.indexOf('(') < 0) {
            throw TypeError('Value does not contain a shape function')
        }
        
        var shape = value.split('(')[0].trim(),
            factory = function(){ };
        
        switch (shape) {
            case 'polygon':
                factory = PolygonEditor;
            break;
            
            case 'circle':
                factory = CircleEditor;
            break;
            
            case 'ellipse':
                factory = EllipseEditor;
            break;
            
            case 'rectangle':
                factory = RectangleEditor;
            break;
            
            default:
                throw TypeError('Value does not contain a valid shape function')
            break;
        }
        
        return new factory(target, value, options)
    }
    
    return CSSShapesEditor
})
