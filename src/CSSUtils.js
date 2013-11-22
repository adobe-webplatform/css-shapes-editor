/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function(){
    "use strict";
    
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
    
    function Utils(){
        
        if (!(this instanceof Utils)){
            return new Utils
        }
        
        return {
            'convertToPixels': convertToPixels,
            'convertFromPixels': convertFromPixels,
            'getContentBoxOf': getContentBoxOf
        }
    }
    
    return new Utils;
})
