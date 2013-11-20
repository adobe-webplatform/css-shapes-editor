/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/polygon.html', 'PolygonEditor'],
function($, markup, PolygonEditor){
    
    function _getPolygonFromBox(element){
        var box = element.getBoundingClientRect();
        return expectedValue = [
            'polygon(',
            [   
                'nonzero',
                '0px 0px',
                box.width + 'px' + ' ' + '0px',
                box.width + 'px' + ' ' +  box.height +'px',
                '0px' + ' ' +  box.height +'px',
            ].join(', '),
            ')'
        ].join('') 
    }
    
    describe('PolygonEditor', function(){
        var editor, 
            target, 
            property = 'shape-inside',
            value = 'polygon(nonzero, 0 0, 100px 0, 100px 100px)',
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
            editor = new PolygonEditor(target, value);
            expect(editor).toBeDefined();
        });
        
        it('should return polygon css shape value', function(){
            var inValue = 'polygon(nonzero, 0px 0px, 100px 0px, 100px 100px)',
                outValue;
            
            editor = new PolygonEditor(target, inValue);
            outValue = editor.getCSSValue();
            
            expect(outValue).toEqual(inValue);
        });
        
        it('should infer polygon from element when no value', function(){
            var inValue = '',
                expectedValue = _getPolygonFromBox(target),
                outValue;
            
            editor = new PolygonEditor(target, inValue);
            outValue = editor.getCSSValue();
            
            expect(outValue).toEqual(expectedValue);
        }); 
        
        it('should infer polygon from element when value is incomplete', function(){
            var inValue = 'polygon(0,0, 100px, 0)',
                expectedValue = _getPolygonFromBox(target),
                outValue;
            
            editor = new PolygonEditor(target, inValue);
            outValue = editor.getCSSValue();
            
            expect(outValue).toEqual(expectedValue);
        }); 

        it('should add new vertex when edge is clicked', function(){
            var inValue = '',
                box = target.getBoundingClientRect(),
                mockEvent = {
                    x: target.offsetLeft,
                    // mid-way on the left edge
                    y: target.offsetTop + box.height / 2
                },
                expectedVerticesLength;
            
            editor = new PolygonEditor(target, inValue);
            // expect to add one more vertex
            expectedVerticesLength = editor.vertices.length + 1;
            
            // dispatch mock 'mousedown' event
            editor.onMouseDown.call(editor, mockEvent);
            
            expect(editor.vertices.length).toEqual(expectedVerticesLength);
        });
        
        it('should trigger "shapechange" event when new vertex is added', function(){
            var inValue = '',
                box = target.getBoundingClientRect(),
                mockEvent = {
                    x: target.offsetLeft,
                    // mid-way on the left edge
                    y: target.offsetTop + box.height / 2
                };
            
            editor = new PolygonEditor(target, inValue);
            spyOn(editor, 'trigger');
            
            // dispatch mock 'mousedown' event
            editor.onMouseDown.call(editor, mockEvent);
            
            expect(editor.trigger).toHaveBeenCalled();
            expect(editor.trigger).toHaveBeenCalledWith('shapechange', editor);
        });

        it('should remove vertex when double clicked', function(){
            var inValue = '',
                mockEvent = {
                    x: target.offsetLeft,
                    y: target.offsetTop
                },
                expectedVerticesLength;
            
            editor = new PolygonEditor(target, inValue);
            // expect to remove a vertex
            expectedVerticesLength = editor.vertices.length - 1;
            
            // dispatch mock 'mousedown' event
            editor.onDblClick.call(editor, mockEvent);
            
            expect(editor.vertices.length).toEqual(expectedVerticesLength);
        });
        
        it('should trigger "shapechange" event when vertex is removed', function(){
            var inValue = '',
                mockEvent = {
                    x: target.offsetLeft,
                    y: target.offsetTop
                };
            
            editor = new PolygonEditor(target, inValue);
            spyOn(editor, 'trigger')
            
            // dispatch mock 'mousedown' event
            editor.onDblClick.call(editor, mockEvent);
            
            expect(editor.trigger).toHaveBeenCalled();
            expect(editor.trigger).toHaveBeenCalledWith('shapechange', editor);
        });
        
        it('should trigger "shapechange" event when vertex is moved', function(){
            var inValue = '',
                moveBy = 100,
                mockMouseDownEvent = {
                    x: target.offsetLeft,
                    y: target.offsetTop
                },
                mockMouseMoveEvent = {
                    x: target.offsetLeft + moveBy,
                    y: target.offsetTop + moveBy
                },
                firstVertex = {};
            
            editor = new PolygonEditor(target, inValue);
            
            // cache the first vertex coordinates
            firstVertex.x = editor.vertices[0].x;
            firstVertex.y = editor.vertices[0].y;
            
            spyOn(editor, 'trigger');
            
            // dispatch mock 'mousedown' event; 
            // mousedown on existing vertex sets the editor.activeVertex used when dragging
            editor.onMouseDown.call(editor, mockMouseDownEvent);
            
            // dispatch mock mousemove event
            editor.onMouseMove.call(editor, mockMouseMoveEvent);
            
            expect(editor.trigger).toHaveBeenCalled();
            expect(editor.trigger).toHaveBeenCalledWith('shapechange', editor);
            expect(editor.trigger.callCount).toEqual(1);
            
            // expect the first vertex to have been moved
            expect(editor.vertices[0].x).toEqual(firstVertex.x + moveBy);
            expect(editor.vertices[0].y).toEqual(firstVertex.y + moveBy);
        });
        
        it('should turn on the transforms editor', function(){
            var inValue = '';
            
            editor = new PolygonEditor(target, inValue);
            editor.turnOnFreeTransform();
            
            expect(editor.transformEditor).toBeDefined();
            expect(editor.transformEditor.bbox).toBeDefined();
        });

        it('should turn off the transforms editor', function(){
            var inValue = '';
            
            editor = new PolygonEditor(target, inValue);
            
            // turn it on
            editor.turnOnFreeTransform();
            expect(editor.transformEditor).toBeDefined();
            
            // now turn it off
            editor.turnOffFreeTransform();
            expect(editor.transformEditor).not.toBeDefined();
        });
        
        it('should not add new vertex when transform editor is on', function(){
            var inValue = '',
                box = target.getBoundingClientRect(),
                mockEvent = {
                    x: target.offsetLeft,
                    // mid-way on the left edge
                    y: target.offsetTop + box.height / 2
                },
                expectedVerticesLength;
            
            editor = new PolygonEditor(target, inValue);
            // expect vertices count to be the same
            expectedVerticesLength = editor.vertices.length;
            
            editor.turnOnFreeTransform();
            
            // dispatch mock 'mousedown' event
            editor.onMouseDown.call(editor, mockEvent);
            
            expect(editor.vertices.length).toEqual(expectedVerticesLength);
        });
        
        it('should not remove vertex when transform editor is on', function(){
            var inValue = '',
                mockEvent = {
                    x: target.offsetLeft,
                    y: target.offsetTop
                },
                expectedVerticesLength;
            
            editor = new PolygonEditor(target, inValue);
            // expect vertices count to be the same
            expectedVerticesLength = editor.vertices.length;
            
            editor.turnOnFreeTransform();
            
            // dispatch mock 'mousedown' event
            editor.onDblClick.call(editor, mockEvent);
            
            expect(editor.vertices.length).toEqual(expectedVerticesLength);
        });
        
    });
});
