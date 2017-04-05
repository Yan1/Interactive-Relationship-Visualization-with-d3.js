#### Interactive Relationship Visualization

##### Abstract
The force.js in *js file* can be used to draw interactive relationship visualization graph.

To be specific, it supports filter, zoom, drag, pan, refresh and so on. In addition, you even could add pulse when click the node.


##### How to use
```
var drawRelation = new DrawRelation(graph, 'main_wrapper');  // graph is an object with relationList and nodeList, main_wrapper is the id of dom to hold the svg
    drawRelation.init();
    drawRelation.showNodeInfo = function (node) {  // when click one node, the function will be executed
        alert(node.name)
    }
```
Currently the plugin just contains several types of relationship, like invest, legal representative and so on. If you want to customize the relationships, you need add the options param to cover the default options.

##### Demos
There are two demos. The demo.html shows several links between the same two nodes, but the demo2.html shows only one link between the same two nodes. You download the whole project and open the demo.html or demo2.html in the browser.