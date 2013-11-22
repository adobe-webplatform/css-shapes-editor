/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/markup.html', 'RectangleEditor'],
function($, markup, RectangleEditor){
    
    describe('RectangleEditor', function(){
        var editor, 
            target, 
            value,
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
            var value = 'rectangle(0, 0, 400px, 200px)';
            editor = new RectangleEditor(target, value);
            expect(editor).toBeDefined();
        });
        
        it('should parse rectangle() with pixels', function(){
            var value = 'rectangle(0, 0, 400px, 200px)',
                expectedCoords = {
                    x: 0,
                    xUnit: 'px',
                    y: 0,
                    yUnit: 'px',
                    w: 400,
                    wUnit: 'px',
                    h: 200,
                    hUnit: 'px'
                };
                
            editor = new RectangleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });
        
        it('should parse rectangle() with shared border-radius', function(){
            var value = 'rectangle(0, 0, 400px, 200px, 50px)',
                expectedCoords = {
                    x: 0,
                    xUnit: 'px',
                    y: 0,
                    yUnit: 'px',
                    w: 400,
                    wUnit: 'px',
                    h: 200,
                    hUnit: 'px',
                    rx: 50,
                    rxUnit: 'px',
                    ry: 50,
                    ryUnit: 'px'
                };
                
            editor = new RectangleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });

        it('should parse rectangle() with separte border-radii', function(){
            var value = 'rectangle(0, 0, 400px, 200px, 50px, 100px)',
                expectedCoords = {
                    x: 0,
                    xUnit: 'px',
                    y: 0,
                    yUnit: 'px',
                    w: 400,
                    wUnit: 'px',
                    h: 200,
                    hUnit: 'px',
                    rx: 50,
                    rxUnit: 'px',
                    ry: 100,
                    ryUnit: 'px'
                };
                
            editor = new RectangleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });
        
        it('should infer shape when rectangle() not defined', function(){
            
            // target.width is 800px
            // target.height is 400px
            
            var value = 'rectangle()',
                expectedCoords = {
                    x: 0,
                    xUnit: 'px',
                    y: 0,
                    yUnit: 'px',
                    w: 800,
                    wUnit: 'px',
                    h: 400,
                    hUnit: 'px'
                };
                
            editor = new RectangleEditor(target, value);
            
            // expect not to parse the shape
            expect(editor.parseShape(value)).not.toBeDefined();
            
            // remove element offsets added to shape coords during setup
            editor.removeOffsets();
            expect(editor.coords).toEqual(expectedCoords);
        });
        
        it('should throw error value does not contain rectangle function', function(){
            
            function setupWithEmpty(){
                var value = '';
                editor = new RectangleEditor(target, value);
            }
            
            function setupWithFake(){
                var value = 'fake()';
                editor = new RectangleEditor(target, value);
            }
            
            function setupWithFalsePositive(){
                var value = 'fake-rectangle()';
                editor = new RectangleEditor(target, value);
            }
            
            function setupWithNull(){
                var value = null;
                editor = new RectangleEditor(target, value);
            }
            
            function setupWithUndefined(){
                var value = undefined;
                editor = new RectangleEditor(target, value);
            }
        
            function setupWithDate(){
                var value = new Date();
                editor = new RectangleEditor(target, value);
            }
            
            expect(setupWithEmpty).toThrow();
            expect(setupWithFake).toThrow();
            expect(setupWithFalsePositive).toThrow();
            expect(setupWithNull).toThrow();
            expect(setupWithUndefined).toThrow();
            expect(setupWithDate).toThrow();
        });
        
        it('should not throw error value contains empty rectangle function', function(){
            
            // empty rectangle declaration signals the editor to automatically infer the shape.
            // should not throw error.
            function setupWithCorrect(){
                var value = 'rectangle()';
                editor = new RectangleEditor(target, value);
            }
            
            // value must be trimmed before parsing. 
            function setupWithWhitespacedCorrect(){
                editor.remove();
                var value = '   rectangle()';
                editor = new RectangleEditor(target, value);
            }
            
            expect(setupWithCorrect).not.toThrow();
            expect(setupWithWhitespacedCorrect).not.toThrow();
        });   
        
        // TODO: test with negative values
        // TODO: test with new notation
    });
});
