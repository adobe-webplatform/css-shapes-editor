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
        'em' : function(x, e) { return x*parseFloat(getComputedStyle(e).fontSize); },
        'rem': function(x, e) { return x*parseFloat(getComputedStyle(e.ownerDocument.documentElement).fontSize); },
        'vw' : function(x, e) { return x/100*window.innerWidth; },
        'vh' : function(x, e) { return x/100*window.innerHeight; },
        '%'  : function(x, e, opts) {

            opts = opts || {};

            var box = e ? getBox(e, opts.boxType) : {
                top: 0,
                left: 0,
                width: 0,
                height: 0
            };

            // special case for computing radius for circle()
            // @see http://www.w3.org/TR/css-shapes/#funcdef-circle
            if (opts.isRadius){
                return Math.round(x/100 * (Math.sqrt(box.height * box.height + box.width * box.width) / Math.sqrt(2)));
            }


            if (opts.isHeightRelated) { return x/100*box.height; }
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
        'em' : function(x, e) { return x/parseFloat(getComputedStyle(e).fontSize); },
        'rem': function(x, e) { return x/parseFloat(getComputedStyle(e.ownerDocument.documentElement).fontSize); },
        'vw' : function(x, e) { return x*100/window.innerWidth; },
        'vh' : function(x, e) { return x*100/window.innerHeight; },
        '%'  : function(x, e, opts) {

            opts = opts || {};

            // get the box from which to compute the percentages
            var box = e ? getBox(e, opts.boxType) : {
                top: 0,
                left: 0,
                width: 0,
                height: 0
            };

            // special case for computing radius for circle()
            // @see http://www.w3.org/TR/css-shapes/#funcdef-circle
            if (opts.isRadius){
                return Math.round(x*100/(Math.sqrt(box.height*box.height+box.width*box.width)/Math.sqrt(2)));
            }

            // otherwise, we use the width or height
            if (opts.isHeightRelated) { return x*100/box.height; }
            else  { return x*100/box.width;  }

        }
    };

    function convertToPixels(cssLength, element, opts) {

        var match = cssLength.match(/^\s*(-?\d+(?:\.\d+)?)(\S*)\s*$/),
            currentLength = match ? parseFloat(match[1]) : 0.0,
            currentUnit = match ? match[2] : '',
            converter = unitConverters[currentUnit];

        if (match && converter) {

            return {
                value: Math.round(20*converter.call(null, currentLength, element, opts))/20,
                unit: currentUnit
            };

        } else {

            return {
                value: currentLength ? currentLength : 0.0,
                unit: currentUnit ? currentUnit : 'px'
            };

        }
    }

    function convertFromPixels(pixelLength, destinUnit, element, opts) {

        var converter = unitBackConverters[destinUnit];

        if(converter) {
            return '' + (Math.round(20*converter.call(null, pixelLength, element, opts))/20) + '' + destinUnit;
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

        };
    }

    /*
      Returns coordinates and dimensions for an element's given box type.
      Boxes are relative to the element's border-box.

      @param {Object} element
      @param {String} boxType one of 'content-box', 'padding-box', 'border-box', 'margin-box'
    */
    function getBox(element, boxType){
        var width = element.offsetWidth,
            height = element.offsetHeight,

            style = getComputedStyle(element),

            leftBorder = parseFloat(style.borderLeftWidth),
            rightBorder = parseFloat(style.borderRightWidth),
            topBorder = parseFloat(style.borderTopWidth),
            bottomBorder = parseFloat(style.borderBottomWidth),

            leftPadding = parseFloat(style.paddingLeft),
            rightPadding = parseFloat(style.paddingRight),
            topPadding = parseFloat(style.paddingTop),
            bottomPadding = parseFloat(style.paddingBottom),

            leftMargin = parseFloat(style.marginLeft),
            rightMargin = parseFloat(style.marginRight),
            topMargin = parseFloat(style.marginTop),
            bottomMargin = parseFloat(style.marginBottom);

        var box = {
            top: 0,
            left: 0,
            width: 0,
            height: 0
        };

        switch (boxType){
            case 'content-box':
                box.top = topBorder + topPadding;
                box.left = leftBorder + leftPadding;
                box.width = width - leftBorder - leftPadding - rightPadding - rightBorder;
                box.height = height - topBorder - topPadding - bottomPadding - bottomBorder;
                break;

            case 'padding-box':
                box.top = topPadding;
                box.left = leftPadding;
                box.width = width - leftBorder - rightBorder;
                box.height = height - topBorder - bottomBorder;
                break;

            case 'border-box':
                box.top = 0;
                box.left = 0;
                box.width = width;
                box.height = height;
                break;

            case 'margin-box':
                box.top = 0 - topMargin;
                box.left = 0 - leftMargin;
                box.width = width + leftMargin + rightMargin;
                box.height = height + topMargin + bottomMargin;
                break;

            default:
                throw new TypeError('Invalid parameter, boxType: ' + boxType);
        }

        return box;
    }

    function Utils(){

        if (!(this instanceof Utils)){
            return new Utils();
        }

        return {
            'convertToPixels': convertToPixels,
            'convertFromPixels': convertFromPixels,
            'getContentBoxOf': getContentBoxOf,
            'getBox': getBox
        };
    }

    return new Utils();
});
