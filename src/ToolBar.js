// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['lodash', 'snap'], function(_, Snap){
    "use strict";

    var _defaults = {
        path: {
            stroke: 'black',
            fill: 'rgba(0, 0, 0, 0)'
        },
        point: {
            radius: 5,
            stroke: 'rgba(0, 0, 0, 1)',
            fill: 'rgba(252, 252, 252, 1)'
        },

        type: "full",
        toolsSize: 32
    };

    var _defaultTool = {
        name: "tool",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjEwMHB4IiBoZWlnaHQ9IjEwMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTAwIDEwMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8cG9seWdvbiBzdHlsZT0iZmlsbDojMDEwMTAxOyIgcG9pbnRzPSI1Ni4yNSw2Mi41IDU2LjI1LDgxLjI1IDY4Ljc1LDgxLjI1IDUwLDEwMCAzMS4yNSw4MS4yNSA0My43NSw4MS4yNSA0My43NSw2Mi41ICIvPgo8cG9seWdvbiBzdHlsZT0iZmlsbDojMDEwMTAxOyIgcG9pbnRzPSIzNy41LDU2LjI1IDE4Ljc1LDU2LjI1IDE4Ljc1LDY4Ljc1IDAsNTAgMTguNzUsMzEuMjUgMTguNzUsNDMuNzUgMzcuNSw0My43NSAiLz4KPHBvbHlnb24gc3R5bGU9ImZpbGw6IzAxMDEwMTsiIHBvaW50cz0iNDMuNzUsMzcuNSA0My43NSwxOC43NSAzMS4yNSwxOC43NSA1MCwwIDY4Ljc1LDE4Ljc1IDU2LjI1LDE4Ljc1IDU2LjI1LDM3LjUgIi8+Cjxwb2x5Z29uIHN0eWxlPSJmaWxsOiMwMTAxMDE7IiBwb2ludHM9IjYyLjUsNDMuNzUgODEuMjUsNDMuNzUgODEuMjUsMzEuMjUgMTAwLDUwIDgxLjI1LDY4Ljc1IDgxLjI1LDU2LjI1IDYyLjUsNTYuMjUgIi8+Cjwvc3ZnPg==",
        onActivate: function () { /* 'this' scoped to ToolBar instance */ },
        onDeactivate: function () { /* 'this' scoped to ToolBar instance */ },
    };

    function ToolBar(options) {
        this.config = _.extend({}, _defaults, options);

        this.type = this.config.type;

        this.paper = this.config.paper || new Snap('100%','100%').paper;

        this.body = this.paper.g();

        this.tools = {};

        // click handler with 'this' bound to ToolBar instance scope;
        this.onToolClick = (function(scope){
            return function(e){
                // 'this' is ToolBar instance

                var target = e.target,
                    tool = this.tools[target.id];

                if (!tool){
                    return;
                }

                // if undefined, it's falsy and that's ok; continue
                if (tool.el.data('selected')){
                    return;
                }

                // toggle off all tools
                Object.keys(this.tools).forEach(function(id){
                    this.deactivate(id);
                }.bind(this));

                // toggle on this tool
                this.activate(target.id);

            }.bind(scope);
        })(this);
    }

    ToolBar.prototype.activate = function(id){
        if (!this.tools[id]){
            return;
        }

        var tool = this.tools[id];
        tool.el.data('selected', true);
        tool.el.attr({fill: 'blue'});
        tool.onActivate.call(this);
    };

    ToolBar.prototype.deactivate = function(id){
        if (!this.tools[id]){
            return;
        }

        var tool = this.tools[id];

        // only deactivate if already active
        if (!tool.el.data('selected')){
            return;
        }

        tool.el.data('selected', false);
        tool.el.attr({fill: 'red'});
        tool.onDeactivate.call(this);
    };

    ToolBar.prototype.add = function(id, options){
        if (this.tools[id]){
            throw new Error('Tool with id "' + id + '" already exists.');
        }

        // TODO: rename config to tool
        var config = _.extend({}, _defaultTool, options),
            size = this.config.toolsSize;

        config.el = this.paper.rect();
        config.el.attr({
            width: size,
            height: size,
            id: id,
            fill: "red",
            x: 0,
            y: Object.keys(this.tools).length * size,
        });

        config.el.click(this.onToolClick.bind(this));

        this.tools[id] = config;

        this.height(Object.keys(this.tools).length * size);
        this.body.append(config.el);
        this.body.transform('translate(100, 100)');
    };

    ToolBar.prototype.remove = function(id){
        if (!this.tools[id]){
            return;
        }

        delete this.tools[id];
    };

    ToolBar.prototype.position = function(pos){
        var oldX = this.body.attr('x'),
            oldY = this.body.attr('y'),
            newPos;

        if (!pos || typeof pos !== 'object'){
            return { x: oldX, y: oldY };
        }

        newPos = {
            x: (typeof pos.x === 'number') ? pos.x : oldX,
            y: (typeof pos.y === 'number') ? pos.y : oldY
        };

        this.body.transform('translate('+newPos.x+','+newPos.y+')');

        return newPos;
    };

    ToolBar.prototype.dimension = function(type, value){
        var oldValue = this.body.getBBox()[type];

        if (!value || typeof value !== 'number' || value === oldValue){
            return oldValue;
        } else {
            this.body.attr(type, value);
            return value;
        }
    };

    ToolBar.prototype.height = function(value){
        return this.dimension("height", value);
    };

    ToolBar.prototype.width = function(value){
        return this.dimension("width", value);
    };

    return ToolBar;
});
