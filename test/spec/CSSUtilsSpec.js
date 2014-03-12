/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

// see main.js for path mapping config
define(['jquery', 'text!spec/test-files/cssutils-markup.html', 'CSSUtils'],
function($, markup, CSSUtils){
    'use strict';

    describe('CSSUtils', function(){
        var editor,
            target,
            $fixture = $('#test-fixture').html(markup);

        beforeEach(function(){
            // inject markup for test
            $fixture.html(markup);
            target = $('#box')[0];
        });

        afterEach(function(){
            $fixture.empty();
        });

        it('should be defined', function(){
            // expect(CSSUtils).toBeDefined();
        });

        describe('.getBox()', function(){
            it('should be defined', function(){
                expect(CSSUtils.getBox).toBeDefined();
            });

            it('should throw error for unrecognized box type', function(){
                function fakeBox(){
                    CSSUtils.getBox(target, 'fake-box');
                }

                expect(fakeBox).toThrow();
            });

            it('should compute content box', function(){
                var box = CSSUtils.getBox(target, 'content-box');
                expect(box.width).toEqual(400);
                expect(box.height).toEqual(400);
                expect(box.top).toEqual(100);
                expect(box.left).toEqual(100);
            });

            it('should compute padding box', function(){
                var box = CSSUtils.getBox(target, 'padding-box');
                expect(box.width).toEqual(500);
                expect(box.height).toEqual(500);
                expect(box.top).toEqual(50);
                expect(box.left).toEqual(50);
            });

            it('should compute border box', function(){
                // 'box-sizing' is default content-box; values are additive
                var box = CSSUtils.getBox(target, 'border-box');
                expect(box.width).toEqual(600);
                expect(box.height).toEqual(600);
                expect(box.top).toEqual(0);
                expect(box.left).toEqual(0);
            });

            it('should compute margin box', function(){
                var box = CSSUtils.getBox(target, 'margin-box');
                expect(box.width).toEqual(700);
                expect(box.height).toEqual(700);
                expect(box.top).toEqual(-50);
                expect(box.left).toEqual(-50);
            });

        });

        describe('Convert from pixels', function(){

        });

        describe('Convert to pixels', function(){

        });


    });
});
