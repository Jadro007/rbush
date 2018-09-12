/**
 * Functions for visualization of R-tree
 * There are some global variables for storing data (rects, points, tree)
 *
 * Call Draw function for rendering
 *
 * @author Tomáš Jadrný
 */

var W = 700,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

if (window.devicePixelRatio > 1) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width = canvas.width * 2;
    canvas.height = canvas.height * 2;
    ctx.scale(2, 2);
}

var colors = ['black', 'white', '#725300'],
    rects, points = [], selectedPoint = null;

var hierarchical_chart_config = {
    chart: {
        container: "#hierarchicalChart"
    },

    nodeStructure: {
        /*text: { name: "Parent node" }, // example structure
        children: [
            {
                text: { name: "First child" }
            },
            {
                text: { name: "Second child" }
            }
        ]*/
    }
};

// for building tree to display hierarchical view
var treeStructure = {};
var treeNodeCounter = 0;


/**
 * Recursive function to draw the tree
 * @param node
 * @param level
 * @param parent
 */
function drawTree(node, level, parent) {
    if (!node) { return; }

    var rect = [];

    // save information about the node for rendering (color, level, position, size)
    rect.push(level ? colors[(node.height - 1) % colors.length] : '#FFDB7A');
    rect.push(level ? 1 / Math.pow(level, 1.2) : 0.2);
    rect.push([
        Math.round(node.minX),
        Math.round(node.minY),
        Math.round(node.maxX - node.minX),
        Math.round(node.maxY - node.minY)
    ]);
    rect.push(node.height);

    rects.push(rect);

    // assign unique number to the node
    node.number = treeNodeCounter;

    // build structure for hierarchical tree
    var parentNode = null;
    if(parent) {
        parentNode = {
            text : {
                name : "R" + parent.number
            }
        };
    }
    var childNode = {
        parent: parentNode,
        text : {
            name : "R" + node.number
        }
    };

    treeStructure.push(childNode);

    treeNodeCounter++;


    if (node.leaf) return;
    if (level === 6) { return; }

    for (var i = 0; i < node.children.length; i++) {
        drawTree(node.children[i], level + 1, node);
    }
}


/**
 * Main function for drawing
 * It should be called every time if something changes
 */
function draw() {
    rects = [];
    treeNodeCounter = 0;
    treeStructure = [];
    drawTree(tree.data, 0);

    // re-render hierarchical structure
    hierarchical_chart_config.nodeStructure = list_to_tree(treeStructure).shift();
    new Treant( hierarchical_chart_config );


    ctx.clearRect(0, 0, W + 1, W + 1);
    ctx.font = "20px Fira Sans";

    // draw rectangles
    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        //ctx.globalAlpha = rects[i][1];
        var sizes = rects[i][2];
        ctx.clearRect(sizes[0], sizes[1], sizes[2], 2);
        ctx.clearRect(sizes[0], sizes[1], 2, sizes[3]);
        ctx.clearRect(sizes[0] + sizes[2], sizes[1], 2, sizes[3]);
        ctx.clearRect(sizes[0], sizes[1] + sizes[3], sizes[2], 2);


        // if the rectangle has size (fix for removing rectangles), display number of the rectangle
        if(sizes[2]  == 0 && sizes[3]  == 0) {

        } else {
            ctx.strokeRect.apply(ctx, rects[i][2]);
            ctx.fillStyle = rects[i][0];
            ctx.fillText(i, sizes[0] - (20 * rects[i][3]) + 25, sizes[1] + 25, 100);

        }


    }

    // render points
    for(var i in points) {
        var point = points[i];
        var radius = 5;
        var colorFill = "#FFCA3A";
        var colorStroke = "#CA895F";
        if(selectedPoint && selectedPoint.minX == point.x && selectedPoint.minY == point.y) {
            radius = 10;
        }

        ctx.beginPath();
        ctx.arc(point.x,point.y,radius,0,2*Math.PI);
        ctx.fillStyle = colorFill;
        ctx.fill();
        ctx.strokeStyle = colorStroke;
        ctx.stroke();
    }
}

/**
 * Calculate random coordinates and add points there
 */
function addRandom() {
    var N = document.getElementById("addN").value;
    for(var j = 0; j < N; j++) {
        var width = canvas.width;
        var height = canvas.height;

        var x = Math.floor(Math.random() * (width + 1));
        var y = Math.floor(Math.random() * (height + 1));

        for(var i in points) {
            if(points[i].x == x && points[i].y == y) {
                //addRandom();
                return;
            }
        }

        var item = {
            minX: x,
            minY: y,
            maxX: x,
            maxY: y
        };

        tree.insert(item);
        points.push({x:x,y:y});
    }
    draw();
}

/**
 * Add new point on given coordinates and add it to the Tree
 * There can't be 2 points on the same coordinates
 * @param e
 */
function add(e) {
    var x = e.offsetX,
        y = e.offsetY;

    var item = {
        minX: x,
        minY: y,
        maxX: x,
        maxY: y
    };


    for(var i in points) {
        if(points[i].x == x && points[i].y == y) {
            return;
        }
    }

    tree.insert(item);
    points.push({x:x,y:y});

    draw();
}


var moved = 0;
var movedE = null;

/**
 * On mouse down, reset recognition of add vs search
 * @param e
 */
function onMouseDown(e) {
    movedE = e;
    moved = 0;
}

/**
 * When moving mouse and mouse button is pressed, there will be search after mouse up
 * @param e
 */
function onMouseMove(e) {

    document.getElementById("coordinates").innerHTML = "X: " + Math.round(e.offsetX) + ", Y: " + Math.round(e.offsetY);

    if(!movedE) {
        return;
    }
    if(Math.abs(movedE.offsetX - e.offsetX) > 10 ||
        Math.abs(movedE.offsetY - e.offsetY) > 10
    ) {
        moved = 1
    }
    draw();

    // display transparent rectangle over selected are
    var alpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.2;

    ctx.fillRect(
        Math.min(movedE.offsetX, e.offsetX),
        Math.min(movedE.offsetY, e.offsetY),
        Math.abs(movedE.offsetX - e.offsetX),
        Math.abs(movedE.offsetY - e.offsetY));

    ctx.globalAlpha = alpha;

}


/**
 * For handling mouse up event
 * To recognize if event is adding or searching
 * @param e
 */
function onMouseUp(e) {
    if(moved) {
        search(e);
    } else {
        add(e);
    }

    moved = 0;
    movedE = null;
    draw();
}


/**
 * Searches over selected area
 * Then displays the list of results with buttons to control it
 * @param e
 */
function search(e) {
    var criteria = {
        minX: Math.min(e.offsetX, movedE.offsetX),
        minY: Math.min(e.offsetY, movedE.offsetY),
        maxX: Math.max(e.offsetX, movedE.offsetX),
        maxY: Math.max(e.offsetY, movedE.offsetY)
    };

    var results = tree.search(criteria);
    document.getElementById("results").innerHTML = "";

    if(results.length) {
        var deleteSelectionButton = document.createElement('button');
        deleteSelectionButton.innerHTML = "Delete selection";
        deleteSelectionButton.className = "delete";

        deleteSelectionButton.onclick = function(results){
            return function(){
                for(var i in results) {
                    var point = results[i];
                    tree.remove(point);
                    for(var j in points) {
                        if(points[j].x == point.minX && points[j].y == point.minY) {
                            points.splice(j,1);
                        }
                    }
                    document.getElementById("results").innerHTML = "";
                    draw();
                }
            }
        }(results);

        document.getElementById("results").appendChild(deleteSelectionButton);
        document.getElementById("results").appendChild(document.createElement('br'));
        document.getElementById("results").appendChild(document.createElement('br'));

    }

    for(var i in results) {
        var result = results[i];
        var newNode = document.createElement('div');

        newNode.onmouseover = function(point, node) {
            return function() {
                selectedPoint = point;
                draw();
            }
        }(result, newNode);

        newNode.onmouseout = function(point, node) {
            return function() {
                selectedPoint = null;
                draw();
            }
        }(result, newNode);
        newNode.innerHTML = "X: " + result.minX + ", Y: " + result.minY;
        newNode.className = "result";


        document.getElementById("results").appendChild(newNode);

        var newButton = document.createElement('button');
        newButton.innerHTML = "Delete";
        newButton.className = "delete";


        newButton.onclick = function(point, node){
            return function(){
                tree.remove(point);
                node.remove();
                for(var i in points) {
                    if(points[i].x == point.minX && points[i].y == point.minY) {
                        points.splice(i,1);
                    }
                }
                if(!document.getElementsByClassName("result").length) {
                    document.getElementById("results").innerHTML = "";
                }
                draw();
            }
        }(result, newNode);
        newNode.appendChild(newButton);

    }
}


/**
 * Deletes newest N points
 */
function deleteNewest() {
    var N = document.getElementById("removeN").value;
    for(var j = 0; j < N; j++) {
        if(!points.length) break;
        var pointData = points.pop(); // remove last one
        var criteria = {
            minX: pointData.x,
            minY: pointData.y,
            maxX: pointData.x,
            maxY: pointData.y
        };

        var results = tree.search(criteria);
        for(var i in results) { // one result
            tree.remove(results[i]);

        }

        draw();
    }

    draw();
}
/**
 * Helper function for element toggling
 * @param elementID
 */
function toggledisplay(elementID)
{
    (function(style) {
        style.display = style.display === 'none' ? 'block' : 'none';
    })(document.getElementById(elementID).style);
}

/**
 * Helper function to convert hash-array to tree with correct function for hierarchical rendering
 * @param list
 * @returns {Array}
 */
function list_to_tree(list) {
    var map = {}, node, roots = [], i;
    for (i = 0; i < list.length; i += 1) {
        map[list[i].text.name] = i; // initialize the map
        list[i].children = []; // initialize the children
    }
    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parent && node.parent.text.name !== "0") {
            // if you have dangling branches check that map[node.parentId] exists
            list[map[node.parent.text.name]].children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}