var prefixes = ['','-webkit-','-ms-','-moz-']
var fixture = document.querySelector('#qunit-fixture')

// module("CSS Shapes");
// test('browser supports CSS Shapes', function(){
//   var div = document.createElement('div')
//   fixture.appendChild(div)
// 
//   prefixes.forEach(function(prefix){
//     var property = prefix + 'shape-inside'
//     var value = 'polygon(nonzero, 0px 0px, 100px 100px, 100px 0px)'
//     div.style[property] = value
//     equal(window.getComputedStyle(div, null)[property], value, 'Has support for ' + property)
//   })
//   
//   expect(0)
//   
// })
module("Shape Editor");
test("is defined", function() {
  ok(ShapeOverlay, "is defined");
});
