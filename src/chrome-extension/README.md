CSS Shapes Editor
===

Google Chrome DevTools extension that allows editing shapes from the CSS Shapes spec.


Installation
---

This stuff is experimental!

- Clone this extension's repo:

    `git clone https://git.corp.adobe.com/rcaliman/css-shapes-editor.git`

- Open Google Chrome and go to the extensions manager:

    `chrome://extensions`

- Tick the 'Developer mode' checkbox, upper right

- Click 'Load unpacked extension' and select the extension's folder cloned in the first step.

Usage
---
- Open a web page

- Turn on the Developer Tools:

Menu: *View > Developer > Developer Tools*

- Switch to the 'Elements' panel. There's a new sidebar panel called *CSS Shapes*.

- Open the *CSS Shapes* sidebar panel and toggle shape editing on.

- Select an element from the the 'Elements' panel node tree

- A shape editor will overlay on top of the selected element. Drag the points of the overlay to change the shape. Double-click on the semi-transparent mid-points to add a new point. Double-click an existing point to remove it. 

- The shape will be added to the inline styles of the element. Copy it from the 'Styles' sidebar panel or from the `style` attribute of the selected element.

- When you're done, turn off the editor from the 'CSS Shapes' sidebar panel.

Troubleshooting
---
**The editor does not show up**: try refreshing the page while keeping the DevTools window open.


Good to know
---
The editor overlays an element over the page which prevents mouse / touch events from going to the elements on the page. Turn off the shape editor if you need to interact with the page.
