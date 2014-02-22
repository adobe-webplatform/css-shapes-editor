/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor','CSSUtils', 'snap', 'lodash'], function(Editor, CSSUtils, Snap, _){
    "use strict";
    
    var _defaults = {
        path: {
            stroke: 'black',
            fill: 'rgba(0, 0, 0, 0)' // tricks transform editor to accept self-drag
        },
        point: {
            radius: 5,
            stroke: 'rgba(0, 0, 0, 1)',
            fill: 'rgba(252, 252, 252, 1)'
        },
        bboxAttrs: {},
        cxUnit: 'px',
        cyUnit: 'px',
        rUnit: 'px'
    };
    
    function CircleEditor(target, value, options){
        Editor.apply(this, arguments);
        
        this.type = 'circle';
        
        // coordinates for circle: cx, cy, radius and corresponding units
        this.coords = null;
        
        this.config = _.extend({}, _defaults, options);
        
        this.setup();
        this.applyOffsets();
        this.draw();
        
        this.toggleFreeTransform();
    }
    
    CircleEditor.prototype = Object.create(Editor.prototype);
    CircleEditor.prototype.constructor = CircleEditor;

    CircleEditor.prototype.setup = function(){
        // Sets up: this.holder, this.paper, this.snap, this.offsets
        Editor.prototype.setup.call(this);
        
        this.setupCoordinates();
        
        this.shape = this.paper.circle().attr(this.config.path);
        
        // TODO: throttle sensibly
        window.addEventListener('resize', this.refresh.bind(this));
    };
    
    CircleEditor.prototype.setupCoordinates = function(){
        this.coords = this.parseShape(this.value);
        
        if (!this.coords){
            this.coords = this.inferShapeFromElement(this.target);
        }
    };
    
    CircleEditor.prototype.update = function(value){
        this.value = value;
        
        this.turnOffFreeTransform();
        this.removeOffsets();
        this.setupCoordinates();
        this.applyOffsets();
        this.draw();
        this.turnOnFreeTransform();
    };
    
    CircleEditor.prototype.refresh = function(){
        this.turnOffFreeTransform();
        this.removeOffsets();
        Editor.prototype.setupOffsets.call(this);
        this.applyOffsets();
        this.draw();
        this.turnOnFreeTransform();
    };
    
    /*
        Add the element's offsets to the circle coordinates.
        
        The editor surface covers 100% of the viewport and we're working 
        with absolute units while editing.
        
        @see CircleEditor.removeOffsets()
    */
    CircleEditor.prototype.applyOffsets = function(){
        var cx = this.coords.cx + this.offsets.left,
            cy = this.coords.cy + this.offsets.top;
            
        this.coords.cx = cx;
        this.coords.cy = cy;
    };
    
    /*
        Subtract the element's offsets from the circle coordinates.
        
        @see CircleEditor.applyOffsets()
    */
    CircleEditor.prototype.removeOffsets = function(){
        var cx = this.coords.cx - this.offsets.left,
            cy = this.coords.cy - this.offsets.top;
        
        this.coords.cx = cx;
        this.coords.cy = cy;
    };
    
    /*
        Parse circle string into object with coordinates for center, radius and units.
        Returns undefined if cannot parse shape.
        
        TODO: account for upcoming notation: http://dev.w3.org/csswg/css-shapes/#funcdef-circle
        
        @example:
        {
            cx: 0,          // circle center x
            cxUnit: 'px',
            cy: 0,          // circle center y
            cyUnit: 'px',
            r: 50,          // circle radius
            rUnit: '%'
        }
        
        @param {String} shape CSS circle function shape
        
        @return {Object | undefined}
    */
    CircleEditor.prototype.parseShape = function(shape){
        var element = this.target,
            coords,
            infos,
            args;
            
        // superficial check for shape declaration
        if (typeof shape !== 'string' || !/^circle\(.*?\)/i.test(shape.trim())){
            
            // remove editor DOM saffolding
            this.remove();
            
            throw new Error('No circle() function definition in provided value');
        }
        
        infos = /circle\s*\(((\s*[-+0-9.]+[a-z%]*\s*,*\s*){3})\s*\)/i.exec(shape.trim());
            
        if (infos){
            if (!infos[1]){
                return;
            }
            
            args = infos[1].replace(/\s+/g, '').split(',');
            
            // incomplete circle definition
            if (args.length < 3){
                return;
            }
            
            args = args.map(function(arg, i){
                
                // isHeightRelated is only checked for truthy-ness
                // 0 = cx
                // 1 = cy
                // 2 = radius
                var isHeightRelated = i
                
                return CSSUtils.convertToPixels(arg, element, isHeightRelated);
            });
            
            coords = {
                cx: args[0].value,
                cxUnit: args[0].unit,
                cy: args[1].value,
                cyUnit: args[1].unit,
                r: args[2].value,
                rUnit: args[2].unit
            };
        } 
        
        return coords;
    };
    
    /*
        Attempt to infer the coordinates for a circle that fits within the element.
        The center is at the element's center. The radius is the distance from the center to the closest edge.
        
        @throws Error if the element has no width or height.
        
        @param {HTMLElement} element Element from which to infer the shape.
        @return {Object} coordinates for circle. @see CircleEditor.parseShape()
    */
    CircleEditor.prototype.inferShapeFromElement = function(element){
        if (!(element instanceof HTMLElement)){
            throw new TypeError('inferShapeFromElement() \n Expected HTMLElement, got: ' + typeof element + ' ' + element);
        }
        
        var box = CSSUtils.getContentBoxOf(element);

        if (!box.height || !box.width){
            throw new Error('inferShapeFromElement() \n Cannot infer shape from element because it has no width or height');
        }
        
        // TODO: also infer unit values
        return {
            cx: box.width / 2,
            cxUnit: this.config.cxUnit,
            cy: box.height / 2,
            cyUnit: this.config.cyUnit,
            // pick radius in relation to closest-edge
            r: Math.min(box.height, box.width) / 2,
            rUnit: this.config.rUnit
        };
    };
    
    CircleEditor.prototype.getCSSValue = function(){
        var cx = this.coords.cx - this.offsets.left,
            cy = this.coords.cy - this.offsets.top,
            r = this.coords.r;
            
        cx = CSSUtils.convertFromPixels(cx, this.coords.cxUnit, this.target, false);
        cy = CSSUtils.convertFromPixels(cy, this.coords.cyUnit, this.target, true);
        r = CSSUtils.convertFromPixels(r, this.coords.rUnit, this.target, true);
        
        
        return 'circle(' + [cx, cy, r].join(', ') + ')';
    };
    
    CircleEditor.prototype.toggleFreeTransform = function(){
        
        // make a clone to avoid compound tranforms
        var coordsClone = (JSON.parse(JSON.stringify(this.coords)));
        var scope = this;
        
        function _transformPoints(){
            var matrix = scope.shapeClone.transform().localMatrix;
            
            scope.coords.cx = matrix.x(coordsClone.cx, coordsClone.cy).toFixed();
            scope.coords.cy = matrix.y(coordsClone.cx, coordsClone.cy).toFixed();
            scope.coords.r = (scope.transformEditor.attrs.scale.x * coordsClone.r).toFixed();
            
            scope.draw();
        }
        
        if (this.transformEditor){
            this.shapeClone.remove();
            this.transformEditor.unplug();
            delete this.transformEditor;
            
            return;
        }
        
        // using a phantom shape because we already redraw the path by the transformed coordinates.
        // using the same path would result in double transformations for the shape
        this.shapeClone = this.shape.clone().attr('stroke', 'none');
        
        this.transformEditor = Snap.freeTransform(this.shapeClone, {
            draw: ['bbox'],
            drag: ['self','center'],
            keepRatio: ['bboxCorners'],
            rotate: [],
            scale: ['bboxCorners'],
            distance: '0.6',
            attrs: this.config.point,
            bboxAttrs: this.config.bboxAttrs,
            size: this.config.point.radius
        }, 
        _transformPoints);
    };
    
    CircleEditor.prototype.draw = function(){
        // draw the circle shape
        this.shape.attr(this.coords);
        
        this.trigger('shapechange', this);
    };
    
    return CircleEditor;
});