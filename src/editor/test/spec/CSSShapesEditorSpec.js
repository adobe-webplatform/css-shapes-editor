/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery','CSSShapesEditor','PolygonEditor','CircleEditor'],
function($, CSSShapesEditor, PolygonEditor, CircleEditor){
    
    describe('CSSShapesEditor', function(){
        var target, property, value, editor;

        beforeEach(function(){
            target = $('#shape-element');
            property = 'shape-inside';
            value = '';
        })

        it('should be defined', function(){
            value = 'circle(50%, 50%, 50%)';
            editor = new CSSShapesEditor(target, property, value);
            expect(editor).toBeDefined();
        });

        it('should return instance of polygon editor', function(){
            value = 'polygon(nonzero, 0 0, 100px 0, 100px 100px)';
            editor = new CSSShapesEditor(target, property, value);
            expect(editor instanceof PolygonEditor).toBe(true);
        });

        it('should return instance of circle editor', function(){
            value = 'circle(50%, 50%, 50%)';
            editor = new CSSShapesEditor(target, property, value);
            expect(editor instanceof CircleEditor).toBe(true);
        });

        it('should throw error for unknown shape in value', function(){
            value = 'fake-shape()';

            var setup = function() {
                editor = new CSSShapesEditor(target, property, value);
            };

            expect(setup).toThrow();
        });

        it('should throw error for invalid value', function(){
            var setupWithUndefined = function() {
                editor = new CSSShapesEditor(target, property, undefined);
            };

            var setupWithNull = function() {
                editor = new CSSShapesEditor(target, property, null);
            };

            var setupWithEmpty = function() {
                editor = new CSSShapesEditor(target, property, '');
            };

            var setupWithZero = function() {
                editor = new CSSShapesEditor(target, property, 0);
            };

            expect(setupWithUndefined).toThrow();
            expect(setupWithNull).toThrow();
            expect(setupWithEmpty).toThrow();
            expect(setupWithZero).toThrow();
        });
    });
});

