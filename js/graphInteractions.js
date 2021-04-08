// Oscar Saharoy 2021

// return the first point found close to mousePos
const areClose = (point1, point2) => vec2.sqrDist( graph.graphToCanvas(point1), graph.graphToCanvas(point2) ) < graph.rem*45
const getClosePoint = mousePos => dataPoints.reduce( (acc, val) => acc ? acc : areClose(mousePos, val) ? val : null, null );

// some variables used for interaction with the graph
let draggedPoint    = null;
let pointerHasMoved = false;
let originalPos     = vec2.zero;

function mousemove() {

    // when the mouse moves over the graph, set the cursor to indicate the action

    // if we are close to a point, use the move cursor
    if( getClosePoint( graph.mousePos ) ) graph.canvas.style.cursor = "move";

    // if we are panning the graph, use the grab cursor
    else if( graph.activePointers.length == 1 ) graph.canvas.style.cursor = "grabbing";

    // otherwise the normal cursor
    else graph.canvas.style.cursor = "auto";
}

function pointerdown() {

    // if we don't only have one active pointer we don't want to be dragging a point
    if( graph.activePointers.length != 1 ) {

        // this setting of the variables prevents any of the points being adjusted
        closePoint           = null; 
        graph.preventPanning = false;
        pointerHasMoved      = true;

        return;
    }

    // try to get a close point
    draggedPoint = getClosePoint( graph.meanPointerOnGraph );

    // preventPanning will be true if draggedPoint isn't null
    graph.preventPanning = !!draggedPoint;

    // pointer has not yet moved
    pointerHasMoved = false;

    // record the original position
    originalPos.setv( graph.meanPointer );
}

function pointermove() {

    // only do something if there are active pointers on the graph
    if( !graph.activePointers.length ) return;

    // pointer has moved
    pointerHasMoved |= vec2.dist( originalPos, graph.meanPointer ) > 3 * graph.dpr;

    if( draggedPoint ) {

        // if we are dragging a point then set it to be at the pointer's position
        draggedPoint.setv( graph.meanPointerOnGraph );
    
        // update the model
        updateModel();
    }
}

function pointerup() {

    // if the pointer has moved there's nothing we need to do
    if( pointerHasMoved || !graph.meanPointerOnGraph ) return;

    // if we are dragging a point but haven't moved the cursor, delete that point
    if( draggedPoint )
        dataPoints = dataPoints.filter( point => point != draggedPoint );

    // if we aren't dragging a point but we havent moved the cursor, add a point there
    if( !draggedPoint )
        dataPoints.push( vec2.clone( graph.meanPointerOnGraph ) );    

    // update the model
    updateModel();
}


function drawPoint(graph, colour, pos) {

    // setup ctx style
    graph.ctx.strokeStyle = colour;
    graph.ctx.lineWidth   = 0.19 * graph.rem;
    graph.ctx.fillStyle   = "white";

    // draw circle at pos
    graph.ctx.beginPath();
    graph.ctx.arc( pos.x, pos.y, graph.rem/2, 0, 6.28 );
    graph.ctx.fill();
    graph.ctx.stroke();
}

function drawPoints( graph ) {
 
    // loop over and draw each point
    for(let point of dataPoints) {

        // use pointFunction to determine point colour
        let pointColour = pointFunction(point) ? "#8decd3" : "#bbbbbb";
        drawPoint( graph, pointColour, graph.graphToCanvas( point ) );
    }
}

function drawCurve(graph) {

    // get the visible range of x values on the graph
    const [minX, maxX] = graph.xRange;
    const width = maxX - minX;

    // set style for curve
    graph.ctx.strokeStyle = "#8decd3";
    graph.ctx.lineWidth   = 0.19 * graph.rem;
    graph.ctx.beginPath();

    // loop over the range of x currently visible and plot the curve at 300 points
    for( let x = minX; x < maxX; x += width/300 ) {

        // get y coord at that value of x
        let canvasY = graph.graphToCanvasY( curveFunction(x) );

        // limit y coord so that stroke works properly
        canvasY = canvasY > graph.canvasSize.y+10 ? graph.canvasSize.y+10 : canvasY < -10 ? -10 : canvasY;

        graph.ctx.lineTo( graph.graphToCanvasX(x), canvasY );
    }

    graph.ctx.stroke();
}

// put the graph object into global namespace
const graph = new Graph("graphjs");

// centre the graph but after all the other code runs
setTimeout( () => graph.centre = vec2.zero, 0 );

// add our draw functions and callbacks onto the graph
graph.userDrawFunctions.push( drawCurve, drawPoints );
graph.addEventListener( "mousemove"  , mousemove    );
graph.addEventListener( "pointerdown", pointerdown  );
graph.addEventListener( "pointermove", pointermove  );
graph.addEventListener( "pointerup"  , pointerup    );