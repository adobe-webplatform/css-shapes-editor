/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/markup.html', 'CircleEditor'],
function($, markup, CircleEditor){
    
    function _getCircleFromBox(element){
        var box = element.getBoundingClientRect();
        return 'circle('+
        [
            box.width / 2 + 'px',
            box.height / 2 + 'px',
            Math.min(box.height, box.width) / 2 + 'px'
        ].join(', ')
        +')';
    }
    
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
        
        it('should parse circle() with percentage center and radius', function(){
            var value = 'circle(50%, 50%, 50%)',
                box = target.getBoundingClientRect(),
                expectedCoords = {
                    cx: box.width / 2,
                    cxUnit: '%',
                    cy: box.height / 2,
                    cyUnit: '%',
                    // special case for computing % radius;
                    // @see http://www.w3.org/TR/css-shapes/#funcdef-circle
                    r: Math.round(50 / 100 * (Math.sqrt(box.width*box.width + box.height*box.height) / Math.sqrt(2))),
                    rUnit: '%'
                };
                
            editor = new CircleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });

        it('should parse circle() with unit-less center and percentage radius', function(){
            var value = 'circle(0, 0, 50%)',
                box = target.getBoundingClientRect(),
                expectedCoords = {
                    cx: 0,
                    cxUnit: 'px',
                    cy: 0,
                    cyUnit: 'px',
                    // special case for computing % radius;
                    // @see http://www.w3.org/TR/css-shapes/#funcdef-circle
                    r: Math.round(50 / 100 * (Math.sqrt(box.width*box.width + box.height*box.height) / Math.sqrt(2))),
                    rUnit: '%'
                };
                
            editor = new CircleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });

        it('should parse circle() with zero percentage radius', function(){
            var value = 'circle(400px, 200px, 0%)',
                box = target.getBoundingClientRect(),
                expectedCoords = {
                    cx: 400,
                    cxUnit: 'px',
                    cy: 200,
                    cyUnit: 'px',
                    r: 0,
                    rUnit: '%'
                };
                
            editor = new CircleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });

        it('should parse circle() with percentage center and px radius', function(){
            var value = 'circle(50%, 50%, 200px)',
                box = target.getBoundingClientRect(),
                expectedCoords = {
                    cx: box.width / 2,
                    cxUnit: '%',
                    cy: box.height / 2,
                    cyUnit: '%',
                    r: 200,
                    rUnit: 'px'
                };
                
            editor = new CircleEditor(target, value);
            expect(editor.parseShape(value)).toEqual(expectedCoords);
        });
        
        it('should throw error for circle() with negative radius', function(){
            function setupWithNegativeCx(){
                editor = new CircleEditor(target, 'circle(-100px, 100px, 100px)');
            }
            
            function setupWithNegativeCy(){
                editor = new CircleEditor(target, 'circle(100px, -100px, 100px)');
            }
            
            function setupWithNegativeR(){
                editor = new CircleEditor(target, 'circle(100px, 100px, -100px)');
            }
            
            // negative cx and cy are ok
            expect(setupWithNegativeCx).not.toThrow();
            expect(setupWithNegativeCy).not.toThrow();
            
            // negative radius is frowned upon >:(
            expect(setupWithNegativeR).toThrow();
        });
        
        // TODO: test with new notation
        
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
        
        it('should throw error value does not contain circle function', function(){
            
            function setupWithEmpty(){
                var value = '';
                editor = new CircleEditor(target, value);
            }
            
            function setupWithFake(){
                var value = 'fake()';
                editor = new CircleEditor(target, value);
            }
            
            function setupWithFalsePositive(){
                var value = 'fake-circle()';
                editor = new CircleEditor(target, value);
            }
            
            function setupWithNull(){
                var value = null;
                editor = new CircleEditor(target, value);
            }
            
            function setupWithUndefined(){
                var value = undefined;
                editor = new CircleEditor(target, value);
            }

            function setupWithDate(){
                var value = new Date();
                editor = new CircleEditor(target, value);
            }
            
            expect(setupWithEmpty).toThrow();
            expect(setupWithFake).toThrow();
            expect(setupWithFalsePositive).toThrow();
            expect(setupWithNull).toThrow();
            expect(setupWithUndefined).toThrow();
            expect(setupWithDate).toThrow();
        });
        
        it('should not throw error value contains empty circle function', function(){
            
            // empty circle declaration signals the editor to automatically infer the shape.
            // should not throw error.
            function setupWithCorrect(){
                var value = 'circle()';
                editor = new CircleEditor(target, value);
            }
            
            // value must be trimmed before parsing. 
            function setupWithWhitespacedCorrect(){
                editor.remove();
                var value = '   circle()';
                editor = new CircleEditor(target, value);
            }
            
            expect(setupWithCorrect).not.toThrow();
            expect(setupWithWhitespacedCorrect).not.toThrow();
        });
        
        it('should have update method', function(){
            var value = 'circle(0, 0, 100px)';
                
            editor = new CircleEditor(target, value);
            expect(editor.update).toBeDefined();
        });
        
        it('should update with new circle() css value', function(){
            var value = 'circle(0, 0, 100px)',
                newValue = 'circle(0px, 0px, 99px)';
                
            editor = new CircleEditor(target, value);
            editor.update(newValue);
            expect(editor.getCSSValue()).toEqual(newValue);
        });

        it('should update with new infered shape value when given empty circle()', function(){
            var value = 'circle(0, 0, 100px)',
                newValue = 'circle()',
                expectedValue = _getCircleFromBox(target);
                
            editor = new CircleEditor(target, value);
            editor.update(newValue);
            expect(editor.getCSSValue()).toEqual(expectedValue);
        });
        
        it('should throw error when updating with invalid css value', function(){
            
            function updateWithEmpty(){
                editor = new CircleEditor(target, value);
                editor.update('');
            }
            
            function updateWithFake(){
                editor = new CircleEditor(target, value);
                editor.update('fake');
            }
            
            function updateWithNull(){
                editor = new CircleEditor(target, value);
                editor.update(null);
            };
            
            function updateWithFalsePositive(){
                editor = new CircleEditor(target, value);
                editor.update('fake-circle()');
            };
            
            function updateWithPolygon(){
                editor = new CircleEditor(target, value);
                editor.update('polygon()');
            };
            
            expect(updateWithEmpty).toThrow();
            expect(updateWithFake).toThrow();
            expect(updateWithNull).toThrow();
            expect(updateWithFalsePositive).toThrow();
            // CircleEditor does not mutate to PolygonEditor
            expect(updateWithPolygon).toThrow();
        });
        
        it('should have transforms editor turned on after setup', function(){
            var value = 'circle(0, 0, 100px)';
            editor = new CircleEditor(target, value);
            
            expect(editor.transformEditor).toBeDefined();
            expect(editor.transformEditor.bbox).toBeDefined();
        });
        
        it('should reset the transforms editor on update', function(){
            var value = 'circle(0, 0, 100px)';
            editor = new CircleEditor(target, value);
            
            spyOn(editor, 'turnOffFreeTransform');
            spyOn(editor, 'turnOnFreeTransform');
            
            editor.update('circle(0px, 0px, 99px)');
            
            expect(editor.turnOffFreeTransform).toHaveBeenCalled();
            expect(editor.turnOnFreeTransform).toHaveBeenCalled();
            
            expect(editor.transformEditor).toBeDefined();
            expect(editor.transformEditor.bbox).toBeDefined();
        });
        
    });
});
