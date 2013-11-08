/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, window */

(function(scope){
    function editor(target, property, value, options){
        
        if (value.indexOf('(') < 0) {
            throw TypeError('Value does not contain a shape function')
        }
        
        var shape = value.split('(')[0].trim()
        
        switch (shape) {
            case 'polygon': 
                return new PolygonEditor(arguments)
            break;
            
            case 'circle':
                return new CircleEditor(arguments)
            break;
            
            case 'ellipse':
                return new EllipseEditor(arguments)
            break;
            
            case 'rectangle':
                return new RectangleEditor(arguments)
            break;
            
            default:
                throw TypeError('Value does not contain a valid shape function')
            break;
        }
    } 
    
    scope.CSSShapesEditor = editor
})(this)