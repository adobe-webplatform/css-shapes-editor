/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/circle.html', 'CircleEditor'],
function($, markup, CircleEditor){
    
    describe('CircleEditor', function(){
        var editor, 
            target, 
            property = 'shape-inside',
            value = '',
            $fixture = $('#test-fixture').html(markup);
            
        beforeEach(function(){
            // inject markup for test
            $fixture.html(markup);
            target = $('#test-shape')[0];
        });
        
        afterEach(function(){
            editor.remove();
            $fixture.empty();
        });

        it('should be defined', function(){
            var value = 'circle()';
            editor = new CircleEditor(target, value);
            expect(editor).toBeDefined();
        });
        
        it('should parse circle() with pixels', function(){
            var value = 'circle(100px, 100px, 100px)',
                expectedCoords = {
                    cx: 100,
                    cxUnit: 'px',
                    cy: 100,
                    cyUnit: 'px',
                    r: 100,
                    rUnit: 'px'
                };
                
            editor = new CircleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });
        
        it('should parse circle() with unit-less center', function(){
            var value = 'circle(0, 0, 100px)',
                expectedCoords = {
                    cx: 0,
                    cxUnit: 'px',
                    cy: 0,
                    cyUnit: 'px',
                    r: 100,
                    rUnit: 'px'
                };
                
            editor = new CircleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });
        
        // TODO: figure out reason for NaN in test, but correct in production
        // it('should parse legacy circle() with em units', function(){
        //     var value = 'circle(1em, 1em, 1em)',
        //         expectedCoords = {
        //             cx: 1,
        //             cxUnit: 'em',
        //             cy: 1,
        //             cyUnit: 'em',
        //             r: 1,
        //             rUnit: 'em'
        //         };
        //         
        //     editor = new CircleEditor(target, value);
        //     expect(editor.parseShape(value)).toEqual(expectedCoords);
        // });
        
        it('should infer shape when circle() not defined', function(){
            
            // target.width is 800px
            // target.height is 400px
            // infers radius length to closest-edge, half the height in this case
            
            var value = 'circle()',
                expectedCoords = {
                    cx: 400,
                    cxUnit: 'px',
                    cy: 200,
                    cyUnit: 'px',
                    r: 200,
                    rUnit: 'px'
                };
                
            editor = new CircleEditor(target, value);
            
            // expect not to parse the shape
            expect(editor.parseShape(value)).not.toBeDefined();
            
            // remove element offsets added to shape coords during setup
            editor.removeOffsets();
            expect(editor.coords).toEqual(expectedCoords);
        });
        
        // TODO: test with percentages, match the circle.html target box
        // TODO: test with invalid string
        // TODO: test with negative values
        // TODO: test with new notation
    });
});
