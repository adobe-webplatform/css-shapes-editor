/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, runs, $, waitsForDone, spyOn */

describe('Editor', function(){
    it('should be defined', function(){
        var editor = new Editor()
        expect(editor).toBeDefined();
    });
});