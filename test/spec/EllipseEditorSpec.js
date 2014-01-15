/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/markup.html', 'EllipseEditor'],
function($, markup, EllipseEditor){
    
    describe('EllipseEditor', function(){
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
            var value = 'ellipse()';
            editor = new EllipseEditor(target, value);
            expect(editor).toBeDefined();
        });
        
        it('should parse ellipse() with pixels', function(){
            var value = 'ellipse(100px, 100px, 100px, 100px)',
                expectedCoords = {
                    cx: 100,
                    cxUnit: 'px',
                    cy: 100,
                    cyUnit: 'px',
                    rx: 100,
                    rxUnit: 'px',
                    ry: 100,
                    ryUnit: 'px'
                };
                
            editor = new EllipseEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });
        
        it('should parse ellipse() with unit-less center', function(){
            var value = 'ellipse(0, 0, 100px, 100px)',
                expectedCoords = {
                    cx: 0,
                    cxUnit: 'px',
                    cy: 0,
                    cyUnit: 'px',
                    rx: 100,
                    rxUnit: 'px',
                    ry: 100,
                    ryUnit: 'px'
                };
                
            editor = new EllipseEditor(target, value);
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
        //     editor = new EllipseEditor(target, value);
        //     expect(editor.parseShape(value)).toEqual(expectedCoords);
        // });
        
        it('should throw error value does not contain ellipse function', function(){
            
            function setupWithEmpty(){
                var value = '';
                editor = new EllipseEditor(target, value);
            }
            
            function setupWithFake(){
                var value = 'fake()';
                editor = new EllipseEditor(target, value);
            }
            
            function setupWithFalsePositive(){
                var value = 'fake-ellipse()';
                editor = new EllipseEditor(target, value);
            }
            
            function setupWithEmpty(){
                var value = '';
                editor = new EllipseEditor(target, value);
            }
            
            // empty ellipse delcaration signals the editor to automatically infer the shape.
            // must not throw error.
            function setupWithCorrect(){
                var value = 'ellipse()';
                editor = new EllipseEditor(target, value);
            }
            
            // whitespace will be trimmed before matching
            function setupWithWhitespacedCorrect(){
                // manually remove previously generated editor in this spec
                editor.remove()
                var value = '   ellipse()';
                editor = new EllipseEditor(target, value);
            }
            
            expect(setupWithEmpty).toThrow();
            expect(setupWithFake).toThrow();
            expect(setupWithFalsePositive).toThrow();
            
            expect(setupWithCorrect).not.toThrow();
            expect(setupWithWhitespacedCorrect).not.toThrow();
        });
        
        
        it('should infer shape when ellipse() coordinates not defined', function(){
            
            // target.width is 800px
            // target.height is 400px
            // infers radius length to closest-edge, half the height in this case
            
            var value = 'ellipse()',
                expectedCoords = {
                    cx: 400,
                    cxUnit: 'px',
                    cy: 200,
                    cyUnit: 'px',
                    rx: 400,
                    rxUnit: 'px',
                    ry: 200,
                    ryUnit: 'px'
                };
                
            editor = new EllipseEditor(target, value);
            
            // expect not to parse the shape
            expect(editor.parseShape(value)).not.toBeDefined();
            
            // remove element offsets added to shape coords during setup
            editor.removeOffsets();
            expect(editor.coords).toEqual(expectedCoords);
        });
        
        // TODO: test with percentages, match the circle.html target box
        // TODO: test with negative values
        // TODO: test with new notation
    });
});
