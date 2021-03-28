// Oscar Saharoy 2021

// ---------- vec2.js ----------


// Oscar Saharoy 2021

class vec2 {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setxy(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setv(vec) {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }

    incBy(vec) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    decBy(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }

    scaleBy(S) {
        this.x *= S;
        this.y *= S;
        return this;
    }

    mulBy(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
        return this;
    }

    divBy(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
        return this;
    }

    clamp(lower, upper) {
        this.x = this.x < lower.x ? lower.x : this.x > upper.x ? upper.x : this.x;
        this.y = this.y < lower.y ? lower.y : this.y > upper.y ? upper.y : this.y;
        return this;
    }

    abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    setIfGreater(vec) {
        this.x = Math.max( this.x, vec.x );
        this.y = Math.max( this.y, vec.y );
        return this;
    }

    setIfLess(vec) {
        this.x = Math.min( this.x, vec.x );
        this.y = Math.min( this.y, vec.y );
        return this;
    }

    static clone(vec) {
        return new vec2(vec.x, vec.y);
    }

    static fromPolar(r, theta) {
        return new vec2( Math.cos(theta), Math.sin(theta) ).scaleBy( r );
    }

    static get zero() {
        return new vec2( 0, 0 );
    }

    static get notANumber() {
        return new vec2( NaN, NaN );
    }

    static get infinity() {
        return new vec2( Infinity, Infinity );
    }

    static get minusInfinity() {
        return new vec2( -Infinity, -Infinity );
    }

    static isNaN(vec) {
        return isNaN( vec.x ) || isNaN( vec.y );
    }

    static add(vecA, vecB) {
        return new vec2( vecA.x + vecB.x, vecA.y + vecB.y );
    }

    static sub(vecA, vecB) {
        return new vec2( vecA.x - vecB.x, vecA.y - vecB.y );
    }

    static mul(vecA, vecB) {
        return new vec2( vecA.x * vecB.x, vecA.y * vecB.y );
    }

    static div(vecA, vecB) {
        return new vec2( vecA.x / vecB.x, vecA.y / vecB.y );
    }

    static neg(vec) {
        return new vec2( -vec.x, -vec.y );
    }

    static scale(vec, S) {
        return new vec2( S * vec.x, S * vec.y );
    }

    static sqrDist(vecA, vecB) {
        return ( vecA.x - vecB.x ) ** 2 + ( vecA.y - vecB.y ) ** 2;
    }

    static dist(vecA, vecB) {
        return this.sqrDist(vecA, vecB) ** 0.5;
    }

    static taxiDist(vecA, vecB) {
        return Math.abs( vecA.x - vecB.x ) + Math.abs( vecA.y - vecB.y ); 
    }

    static grad(vec) {
        return vec.y / vec.x;
    }

    static lerp(vecA, vecB, d) {
        return vec2.scale(vecB, d).incBy( vec2.scale(vecA, 1-d) );
    }

    static dot(vecA, vecB) {
        return vecA.x * vecB.x + vecA.y * vecB.y;
    }
}


// ---------- end vec2.js ----------


// ---------- graph.js ----------


// Oscar Saharoy 2021

class Graph {

    constructor(graphID) {

        // get canvas and drawing context
        this.canvas = document.getElementById(graphID);
        this.ctx    = this.canvas.getContext("2d");

        // declare properties
        this.boundingRect         = null;
        this.canvasSize           = vec2.zero;
        this.canvasToGraphScale   = new vec2(0.01, -0.01); // 2d scale factor that converts from canvas space to graph space
        this.originOffset         = vec2.zero; // offset of the origin from top corner of canvas in graph space
        this.originFixedInCanvas  = vec2.zero;
        this.mousePos             = vec2.zero; // position of the mouse hovering over the graph
        this.preventPanning       = false;
        this.dpr                  = 0;
        this.rem = parseInt( getComputedStyle(document.documentElement).fontSize )
                 * window.devicePixelRatio || 1;
        
        // arrays of pointer positions and active pointers
        this.activePointers   = [];
        this.pointerPositions = {};

        // mean pointer position and that of last frame
        this.meanPointer     = vec2.zero;
        this.lastMeanPointer = vec2.zero;

        // spread of pointers and that of last frame
        this.pointerSpread     = 0;
        this.lastPointerSpread = 0;

        // we need to keep a bool telling us to
        // skip a zoom/pan frame when a new pointer is added
        this.skip1Frame = false;

        // get mean and spread of a list of pointer positions
        this.getMeanPointer   = arr => arr.reduce( (acc, val) => acc.incBy( vec2.scale(val, 1/arr.length ) ), vec2.zero );
        this.getPointerSpread = (positions, mean) => positions.reduce( (acc, val) => acc + ((val.x-mean.x)**2 + (val.y-mean.y)**2)**0.5, 0 );
 
        // data variables 
        this.points = [];

        // user-changeable drawing functions
        this.curveDrawingFunction = graphjsDefaultDrawCurve;
        this.userDrawFunctions    = [];

        // functions to  translate from graph space to canvas space
        this.canvasToGraph  = point  => vec2.mul( point, this.canvasToGraphScale ).decBy( this.originOffset );
        this.graphToCanvas  = point  => vec2.add( point, this.originOffset ).divBy( this.canvasToGraphScale );

        this.graphToCanvasX = graphX => (graphX + this.originOffset.x) / this.canvasToGraphScale.x;
        this.graphToCanvasY = graphY => (graphY + this.originOffset.y) / this.canvasToGraphScale.y;

        // returns true if a point is inside the graph viewport
        this.insideViewport = point  => point.x > - this.originOffset.x
                                     && point.y < - this.originOffset.y
                                     && point.x < this.canvasSize.x * this.canvasToGraphScale.x - this.originOffset.x 
                                     && point.y > this.canvasSize.y * this.canvasToGraphScale.y - this.originOffset.y;

        // function to determine if we must draw a point or if we can skip it to save performance
        this.mustDrawPoint = (p, i, arr) => this.insideViewport( p ) 
                                         || i != 0            && this.insideViewport( arr[i-1] )
                                         || i != arr.length-1 && this.insideViewport( arr[i+1] );

        // initial canvas resize, center canvas & draw
        this.resize();
        this.centre = vec2.zero;
        this.redraw();

        // link all the events to their callbacks
        window.addEventListener(      "resize",       event => this.resize(      event ) );
        this.canvas.addEventListener( "mousemove",    event => this.mousemove(   event ) );
        this.canvas.addEventListener( "pointerdown",  event => this.pointerdown( event ) );
        this.canvas.addEventListener( "pointerup",    event => this.pointerup(   event ) );
        this.canvas.addEventListener( "pointerleave", event => this.pointerup(   event ) );
        this.canvas.addEventListener( "pointermove",  event => this.pointermove( event ) );
        this.canvas.addEventListener( "wheel",        event => this.wheel(       event ) ); 

        // pipe event listeners on the graph through to the canvas
        this.addEventListener = (...args) => this.canvas.addEventListener(...args);
    }

    resize() {

        // set canvas to have 1:1 canvas pixel to screen pixel ratio
        this.dpr = window.devicePixelRatio || 1;
        this.boundingRect = this.canvas.getBoundingClientRect();
        this.canvasSize.setxy( this.boundingRect.width * this.dpr, this.boundingRect.height * this.dpr );

        this.canvas.width  = this.canvasSize.x;
        this.canvas.height = this.canvasSize.y;
    }
    
    mousemove( event ) {
        
        // set the mouse pos for the numbers in the top right
        this.mousePos.setv( this.canvasToGraph( new vec2( event.offsetX * this.dpr, event.offsetY * this.dpr ) ) );
    }

    setPointerMeanAndSpread() {

        // get al the pointer vectors
        const pointers     = Object.values( this.pointerPositions );

        // use fnuctions to find mean and spread
        this.meanPointer   = this.getMeanPointer( pointers );
        this.pointerSpread = this.getPointerSpread( pointers, this.meanPointer );
        
        // get the mean pointer in graph space
        this.meanPointerOnGraph = this.canvasToGraph( this.meanPointer.scaleBy( this.dpr ) );
    }

    pointerdown( event ) {

        // if the event's target element is in the preventDrag array then return
        //if( preventDrag.reduce( (result, elm) => result || elm == event.target, false) ) return;

        // otherwise add the pointer to pointerPositions and activePointers
        this.pointerPositions[event.pointerId] = new vec2(event.offsetX, event.offsetY);
        this.activePointers.push( event.pointerId );

        // set the mean pointer position so that we have access to the new meanPionter straight away
        this.setPointerMeanAndSpread()

        // we added a new pointer so skip a frame to prevent
        // a step change in pan position
        this.skip1Frame = true;
    }

    pointermove( event ) {

        event.preventDefault();

        // if this pointer isn't an active pointer
        // (pointerdown occured over a preventDrag element)
        // then do nothing
        if( !this.activePointers.includes(event.pointerId) ) return;

        // keep track of the pointer pos
        this.pointerPositions[event.pointerId] = new vec2(event.offsetX, event.offsetY);
    }

    pointerup( event ) {

        // remove the pointer from active pointers and pointerPositions
        // (does nothing if it wasnt in them)
        this.activePointers = this.activePointers.filter( id => id != event.pointerId );
        delete this.pointerPositions[event.pointerId];

        // we lost a pointer so skip a frame to prevent
        // a step change in pan position
        this.skip1Frame = true;
    }

    panAndZoom() {

        // theres no active pointers do nothing
        if( !this.activePointers.length ) return;

        // set the mean pointer and spread
        this.setPointerMeanAndSpread()
        
        // we have to skip a frame when we change number of pointers to avoid a jump
        // also don't pan/zoom if this.preventPanning is true
        if( !this.skip1Frame && !this.preventPanning ) {
            
            // increment the originOffset by the mean pointer movement, scaled to graph space
            this.originOffset.incBy( vec2.sub( this.meanPointer, this.lastMeanPointer ).mulBy( this.canvasToGraphScale ) );
            
            // call the wheel function with a constructed event to zoom with pinch
            this.wheel( { offsetX: this.meanPointer.x,
                          offsetY: this.meanPointer.y,                
                          deltaY: (this.lastPointerSpread - this.pointerSpread) * 2.7 } );
        }

        // update the vars to prepare for the next frame
        this.lastMeanPointer.setv( this.meanPointer );
        this.lastPointerSpread = this.pointerSpread;
        this.skip1Frame        = false;
    }

    wheel( event ) {

        // prevent browser from doing anything
        event.preventDefault?.();

        // adjust the zoom level and update the container
        const zoomAmount = event.deltaY / 600;

        // use ctrl and shift keys to decide whether to zoom in x or y directions or both
        if( !event.ctrlKey ) {

            // have to shift the origin to make the mouse the centre of enlargement
            this.originOffset.x       += event.offsetX * this.dpr * zoomAmount * this.canvasToGraphScale.x;
            this.canvasToGraphScale.x *= 1 + zoomAmount;
        }

        if( !event.shiftKey ) {

            this.originOffset.y       += event.offsetY * this.dpr * zoomAmount * this.canvasToGraphScale.y;
            this.canvasToGraphScale.y *= 1 + zoomAmount;
        }
    }

    redraw() {

        // clear canvas
        this.ctx.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
        
        // run pan and zoom function
        this.panAndZoom();

        // set origin position fixed inside the canvas
        this.originFixedInCanvas.setv( 
            vec2.div( this.originOffset, this.canvasToGraphScale ).clamp( new vec2(0, 0), this.canvasSize ) );

        // get positions of gridlines on graph
        const gridlinePositions = this.getGridlinePositions();

        // map points to canvas space - used for drawing them
        const pointsOnCanvas = this.points.filter( this.mustDrawPoint ).map( this.graphToCanvas );

        // draw the graph elements
        this.drawAxes();
        this.drawGridlines(gridlinePositions);
        this.curveDrawingFunction( pointsOnCanvas, this );
        this.drawLabels(gridlinePositions);
        this.drawMousePosition();

        // call each of the user functions
        this.userDrawFunctions.forEach( func => func(this) );
        
        // continue draw loop
        requestAnimationFrame( () => this.redraw() );
    }

    getGridlinePositions() {

        // object to hold the gridlines in x and y directions
        const gridlines = { x: [], y: [] };

        // size of the graph in graph space
        const graphSize = vec2.mul( this.canvasSize, this.canvasToGraphScale ).abs();

        // calculate space between the gridlines in graph units
        var gridlineSpacingX = Math.pow(10, Math.floor( Math.log10(graphSize.x) ) );
        var gridlineSpacingY = Math.pow(10, Math.floor( Math.log10(graphSize.y) ) );

        // adjust the gridline spacing to get a nice number of gridlines
        if      ( graphSize.x / gridlineSpacingX < 2.5 ) gridlineSpacingX /= 5;
        else if ( graphSize.x / gridlineSpacingX < 6   ) gridlineSpacingX /= 2;
        if      ( graphSize.y / gridlineSpacingY < 2.5 ) gridlineSpacingY /= 5;
        else if ( graphSize.y / gridlineSpacingY < 6   ) gridlineSpacingY /= 2;

        // calculate positions of the most negative gridline in graph space
        const firstGridlineX = Math.floor( - this.originOffset.x                / gridlineSpacingX ) * gridlineSpacingX;
        const firstGridlineY = Math.floor( -(this.originOffset.y + graphSize.y) / gridlineSpacingY ) * gridlineSpacingY;

        // keep adding grid lines at a spacing of gridlineSpacing until the whole graph is covered
        for(var x = firstGridlineX; x < firstGridlineX + graphSize.x + gridlineSpacingX; x += gridlineSpacingX)
            gridlines.x.push(x);

        for(var y = firstGridlineY; y < firstGridlineY + graphSize.y + gridlineSpacingY; y += gridlineSpacingY)
            if( Math.abs(y) > 1e-9 ) gridlines.y.push(y);

        return gridlines;
    }

    drawAxes() {

        // draw the x and y axes

        this.ctx.lineWidth   = 3;
        this.ctx.strokeStyle = "black";

        this.drawVerticalLine(   this.originFixedInCanvas.x );
        this.drawHorizontalLine( this.originFixedInCanvas.y );
    }

    drawGridlines(gridlinePositions) {

        // change style for gridlines
        this.ctx.lineWidth   = 1;
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";

        gridlinePositions.x.forEach( x => this.drawVerticalLine(   this.graphToCanvasX( x ) ) );
        gridlinePositions.y.forEach( y => this.drawHorizontalLine( this.graphToCanvasY( y ) ) );
    }

    drawLabels(gridlinePositions) {

        // change style for labels
        this.ctx.fillStyle = "black";
        this.ctx.font      = `500 ${this.rem}px Roboto Mono`;

        gridlinePositions.x.forEach( x => this.drawXLabel( x ) );
        gridlinePositions.y.forEach( y => this.drawYLabel( y ) );
    }

    drawMousePosition() {

        this.ctx.font = `500 ${this.rem*1.2}px Roboto Mono`;

        // get text from mousePos
        const text = this.mousePos.x.toPrecision(3) + ", " + this.mousePos.y.toPrecision(3);
        const textWidth = this.ctx.measureText(text).width;

        // draw white box behind
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(this.canvasSize.x-8-textWidth, 0, 8+textWidth, this.rem*1.3 + 8);

        // draw numbers
        this.ctx.fillStyle = "black";
        this.ctx.fillText(text, this.canvasSize.x-8-textWidth, this.rem*1.3 + 4);
    }

    drawVerticalLine(canvasX) {

        // draws a line down the canvas at a given y coordinate
        this.ctx.beginPath();
        this.ctx.moveTo(canvasX,                 0);
        this.ctx.lineTo(canvasX, this.canvasSize.y);
        this.ctx.stroke();
    }

    drawHorizontalLine(canvasY) {

        // draws a line across the canvas at a given y coordinate
        this.ctx.beginPath();
        this.ctx.moveTo(                0, canvasY);
        this.ctx.lineTo(this.canvasSize.x, canvasY);
        this.ctx.stroke();
    }

    drawXLabel(graphX) {

        // get coordinates of label in canvas space
        const canvasX = this.graphToCanvasX( graphX );
        const canvasY = this.originFixedInCanvas.y;

        // draw number
        const text       = graphjsFormatNumber(graphX);
        const textHeight = this.rem;
        const textX      = canvasX + textHeight / 2;
        const textY      = canvasY-textHeight*2 < 0 ? textHeight*1.5 : canvasY-textHeight/2;

        this.ctx.fillText( text, textX, textY );
    }

    drawYLabel(graphY) {

        // get y coordinate of label in canvas space
        const canvasY = this.graphToCanvasY( graphY );
        const canvasX = this.originFixedInCanvas.x;

        // draw number
        const text       = graphjsFormatNumber(graphY);
        const textHeight = this.rem * this.dpr;
        const textWidth  = this.ctx.measureText( text ).width;
        const textX      = canvasX+textHeight+textWidth > this.canvasSize.x ? this.canvasSize.x-textHeight/2-textWidth : canvasX+textHeight/2;
        const textY      = canvasY - textHeight / 2;

        this.ctx.fillText( text, textX, textY );
    }

    // public functions

    addPoint(point) {

        this.points.push( point );
    }

    addPoints(points) {

        points.forEach( point => this.points.push(point) );
    }

    removePoint(point) {

        this.points = this.points.filter( x => x != point );
    }

    clearPoints() {

        this.points = [];
    }

    get centre() {

        return vec2.mul( this.canvasSize, this.canvasToGraphScale ).scaleBy( 0.5 ).decBy( this.originOffset );
    }

    set centre( point ) {

        // set the centre of the graph to be point
        this.originOffset.setv( vec2.mul(this.canvasSize, this.canvasToGraphScale).scaleBy( 0.5 ).decBy( point ) );
    }

    get xRange() {

        // get the min and max x coords of the graph
        const minX = - this.originOffset.x;
        const maxX = this.canvasSize.x * this.canvasToGraphScale.x - this.originOffset.x;

        return [minX, maxX];
    }

    set xRange( [minX, maxX] ) {

        // set the graph to range from minX to maxX on x axis
        this.canvasToGraphScale.x = (maxX - minX) / this.canvasSize.x;
        this.originOffset.x       = (this.canvasSize.x * this.canvasToGraphScale.x - minX - maxX) / 2;
    }

    get yRange() {

        // get the min and max y coords of the graph
        const minX = - this.originOffset.y;
        const maxX = -this.canvasSize.x * this.canvasToGraphScale.x - this.originOffset.y;

        return [minX, maxX];
    }

    set yRange( [minY, maxY] ) {

        // set the graph to range from minY to maxY on y axis
        this.canvasToGraphScale.y = (maxY - minY) / -this.canvasSize.y;
        this.originOffset.y       = (this.canvasSize.y * this.canvasToGraphScale.y - minY - maxY) / 2;
    }

    set range( [bottomLeft, topRight] ) {

        // set graph range using 2 points
        this.canvasToGraphScale   = vec2.sub( topRight, bottomLeft ).divBy( this.canvasSize ).mulBy( new vec2(1, -1) );
        this.originOffset         = vec2.mul(this.canvasSize, this.canvasToGraphScale).decBy( bottomLeft ).decBy( topRight ).scaleBy( 0.5 );
    }
}


// default curve drawing function
function graphjsDefaultDrawCurve(points, graph) {

    if( !points.length ) return;

    // set style
    graph.ctx.strokeStyle = "#54f330";
    graph.ctx.lineWidth   = 2.5;

    graph.ctx.beginPath();
    graph.ctx.moveTo( points[0].x, points[0].y );

    // keep track of the last point that we drew
    var lastDrawnPoint = points[0];

    for(point of points) {

        // for each next point, only draw it if its more than 3 pixels away from the last one we drew
        if( vec2.taxiDist(point, lastDrawnPoint) < 3 ) continue;

        lastDrawnPoint = point;
        graph.ctx.lineTo( point.x, point.y );
    }

    graph.ctx.stroke();
}

// number formatting function
function graphjsFormatNumber(x) {

    // if x is basically 0 then just return that
    if( Math.abs(x) < 1e-10 ) return "0";
    
    // use x.toString unless number is very small or very big then use toExponential
    var text = x.toString();
    if( Math.abs(x) > 10000 || Math.abs(x) < 0.001 ) text = x.toExponential();

    var fixed;

    // fix numbers like 57.5699999999995e+12
    const ninesRegexMatch = text.match( /(9|\.|\-){4,}(\d)*/ );

    if( ninesRegexMatch ) {

        var incrementPower = false;

        // if start of string is nines (9.999932) then handle this case
        if( ninesRegexMatch.index == 0 ) {

            fixed = x>0 ? "1" : "-1";
            incrementPower = true;
        }

        else {
            
            // extract correct part of string (except digit to be incremented)
            fixed = text.substring(0, ninesRegexMatch.index-1);

            // increment last correct digit and add it on to make up for nines
            fixed += parseInt( text[ninesRegexMatch.index-1] ) + 1;
        }

        // match suffix of the form e+xxx and add it back on
        const suffix = text.match( /e(\+|\-)(\d+)/ );
        
        if( suffix ) {

            var power = parseInt( suffix[2] )

            if(incrementPower) power += Math.abs(x) > 1 ? 1 : -1;

            fixed += "e" + suffix[1] + power;
        }

        return fixed;
    }

    // fix numbers like 5.560000000001e-5
    const zerosRegexMatch = text.match( /(0|\.){5,}(\d)+/ );

    if( zerosRegexMatch ) {

        // extract correct part of string
        fixed = text.substring(0, zerosRegexMatch.index);

        // match suffix of the form e+xxx and add it back on
        const suffix = text.match( /e(\+|\-)(\d+)/ );

        if(suffix) fixed += suffix[0];

        return fixed;
    }

    return text;
}


// ---------- end graph.js ----------


// ---------- functionfit code ----------


const graph = new Graph("graphjs");

function drawPoint(graph, colour, pos) {

    // setup ctx style
    graph.ctx.strokeStyle = colour;
    graph.ctx.lineWidth   = 3;
    graph.ctx.fillStyle   = "white";

    // draw circle at pos
    graph.ctx.beginPath();
    graph.ctx.arc( pos.x, pos.y, graph.rem/2, 0, 6.28 );
    graph.ctx.fill();
    graph.ctx.stroke();
}

function drawPoints( graph ) {
 
    // loop over and draw each point
    for(var point of dataPoints) {

        // use pointFunction to determine point colour
        var pointColour = pointFunction(point) ? "#54F330" : "#bbbbbb";
        drawPoint( graph, pointColour, graph.graphToCanvas( point ) );
    }
}

function drawCurve(graph) {

    // get the visible range of x values on the graph
    const [minX, maxX] = graph.xRange;
    const width = maxX - minX;

    // set style for curve
    graph.ctx.strokeStyle = "#54F330";
    graph.ctx.lineWidth   = 3;
    graph.ctx.beginPath();

    // loop over the range of x currently visible and plot the curve at 300 points
    for( var x = minX; x < maxX; x += width/300 ) {

        // get y coord at that value of x
        var canvasY = graph.graphToCanvasY( curveFunction(x) );

        // limit y coord so that stroke works properly
        canvasY = canvasY > graph.canvasSize.y+10 ? graph.canvasSize.y+10 : canvasY < -10 ? -10 : canvasY;

        graph.ctx.lineTo( graph.graphToCanvasX(x), canvasY );
    }

    graph.ctx.stroke();
}

// add our draw functions onto the standard graph ones
graph.userDrawFunctions.push( drawCurve, drawPoints );

// data variables
var dataPoints     = [new vec2(-2.0, -0.5), new vec2(-0.8, 0.2), new vec2(0, -0.3), new vec2(0.6, 0.5), new vec2(2.0, 1.5)];

// initial function values
var curveFunction  = x => NaN;
var pointFunction  = (point) => (true);
var regressionFunction = () => ([null, (point) => (true)]);

// return the first point found close to mousePos
const areClose = (point1, point2) => vec2.sqrDist( graph.graphToCanvas(point1), graph.graphToCanvas(point2) ) < graph.rem*25
const getClosePoint = mousePos => dataPoints.reduce( (acc, val) => acc ? acc : areClose(mousePos, val) ? val : null, null );
var draggedPoint    = null;
var pointerHasMoved = false;

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
}

function pointermove() {

    // only do something if there are active pointers on the graph
    if( !graph.activePointers.length ) return;

    // pointer has moved
    pointerHasMoved = true;

    if( draggedPoint ) {

        // if we are dragging a point then set it to be at the pointer's position
        draggedPoint.setv( graph.meanPointerOnGraph );
    
        // update the model
        regressionFunction();
    }
}

function pointerup() {

    // if the pointer has moved there's nothing we need to do
    if( pointerHasMoved ) return;

    // if we are dragging a point but haven't moved the cursor, delete that point
    if( draggedPoint )
        dataPoints = dataPoints.filter( point => point != draggedPoint );

    // if we aren't dragging a point but we havent moved the cursor, add a point there
    if( !draggedPoint )
        dataPoints.push( vec2.clone( graph.meanPointerOnGraph ) );    

    // update the model
    regressionFunction();
}

graph.addEventListener( "mousemove"  , mousemove   );
graph.addEventListener( "pointerdown", pointerdown );
graph.addEventListener( "pointermove", pointermove );
graph.addEventListener( "pointerup"  , pointerup   );


// ---------- end functionfit code ----------


// ---------- regression code ----------


// setup some variables
var polynomialTerms = document.getElementById("polynomial-terms");
var fourierTerms    = document.getElementById("fourier-terms");
var fourierStart    = document.getElementById("fourier-start");
var fourierEnd      = document.getElementById("fourier-end");

var buttons   = document.querySelectorAll("ol button");
var options   = document.getElementsByClassName("options");
var codeboxes = document.getElementsByClassName("codebox");
var mathspan  = document.getElementById("mathspan");

var regressionFunctions = [() => (linearRegression()),
                           () => (polynomialRegression(parseFloat(polynomialTerms.value))),
                           () => (powerlawRegression()),
                           () => (bellcurveRegression()),
                           () => (exponentialRegression()),
                           () => (fourierSeries(parseFloat(fourierStart.value), parseFloat(fourierEnd.value), parseFloat(fourierTerms.value)))];

function equationSelect(num) {
    
    // highlight clicked button
    for(var i=0; i<buttons.length; ++i) {

        buttons[i].className     = i==num ? "buttonActive" : "";
        options[i].style.display = i==num ? "grid"   : "none";
    }

    // set regression mode and update regression model
    regressionFunction = regressionFunctions[num];
    regressionFunction();
}

function linearRegression() {

    // y = mx+c

    // find m and c to minimise square residuals of dataset
    var m   = 0;
    var c   = 0;
    var sx  = 0;
    var sx2 = 0;
    var sy  = 0;
    var sxy = 0;
    var n   = dataPoints.length;

    // loop over each point in dataPoints
    for(var i=0; i<dataPoints.length; ++i) {

        // get data point
        point = dataPoints[i];

        // increment sums
        sx  += point.x;
        sx2 += point.x*point.x;
        sy  += point.y;
        sxy += point.x*point.y;
    }

    m = (sxy/sx - sy/n) / (sx2/sx - sx/n);
    c = sxy/sx - m*sx2/sx;

    // set curve function and point function
    const lineFunction = (x) => (m*x + c);
    curveFunction = lineFunction;
    pointFunction = (point) => (true);

    // set equation display and code boxes
    mathText = "y = "+m.toFixed(3)+"x + "+c.toFixed(3);

    codeboxes[0].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[1].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[2].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[3].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[4].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
}

function polynomialRegression(order) {

    // y = c[0] + c[1]x + c[2]x^2 + c[3]x^3 ...

    // initialise variables and matrices
    var n = dataPoints.length;

    var x  = new Matrix(order+1, n);
    var y  = new Matrix(n, 1);

    // populate matrices

    // loop over first row in x to fill it
    for(var i=0; i<order+1; ++i) {

        // loop over dataPoints to set each value in x and y
        for(var p=0; p<dataPoints.length; ++p) {

            var xiToPower = Math.pow(dataPoints[p].x, i);

            x.set(i, p, xiToPower);
            y.set(p, 0, dataPoints[p].y);
        }
    }

    // calculate polynomial coefficients
    var c = matMul(matMul( (matMul( x, x.T() )).inv() , x), y).data;

    // set curve function and point function
    const polynomialFunction = (x) => (c.reduce( (acc, cur, idx) => (acc + cur*Math.pow(x, idx))) );
    curveFunction = polynomialFunction;
    pointFunction = (point) => (true);

    // set equation display and code boxes
    //⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹
    var powers = ["", "x", "x²", "x³", "x⁴", "x⁵", "x⁶", "x⁷", "x⁸", "x⁹"];
    mathText = c.reduce( (acc, cur, idx) => (acc + (acc=="" ? "y = " : " + ") + cur.toFixed(3)+powers[idx] ), "" ).replace("+ -", "- ");

    // arrays to help format code
    var powersccpp = ["", "*x", "*x*x", "*pow(x,3)", "*pow(x,4)", "*pow(x,5)", "*pow(x,6)", "*pow(x,7)", "*pow(x,8)", "*pow(x,9)"];
    var powerscsh  = ["", "*x", "*x*x", "*Math.Pow(x,3)", "*Math.Pow(x,4)", "*Math.Pow(x,5)", "*Math.Pow(x,6)", "*Math.Pow(x,7)", "*Math.Pow(x,8)", "*Math.Pow(x,9)"];
    var powersjs   = ["", "*x", "*x*x", "*Math.pow(x,3)", "*Math.pow(x,4)", "*Math.pow(x,5)", "*Math.pow(x,6)", "*Math.pow(x,7)", "*Math.pow(x,8)", "*Math.pow(x,9)"];
    var powerspy   = ["", "*x", "*x*x", "*x**3", "*x**4", "*x**5", "*x**6", "*x**7", "*x**8", "*x**9"];

    // code output function
    outputCode = (c_arr, powerslang) => (c_arr.reduce( (acc, cur, idx) => (acc + (acc=="" ? "" : " + ") + cur.toFixed(3)+powerslang[idx] ), "" ).replace("+ -", "- "));

    codeboxes[0].value = outputCode(c, powersjs  ).replace("+ -", "- ");
    codeboxes[1].value = outputCode(c, powersccpp).replace("+ -", "- ");
    codeboxes[2].value = outputCode(c, powerscsh ).replace("+ -", "- ");
    codeboxes[3].value = outputCode(c, powerspy  ).replace("+ -", "- ");
    codeboxes[4].value = outputCode(c, powersccpp).replace("+ -", "- ");
}

function powerlawRegression() {

    // y = px^q

    // filter datapoints - only x>0 and y>0 allowed
    var powerlawPoints = dataPoints.filter((point) => (point.x > 0 && point.y > 0));

    // find p and q to minimise square residuals of dataset
    var slnx    = 0;
    var slnx2   = 0;
    var slny    = 0;
    var slnxlny = 0;
    var n       = powerlawPoints.length;

    // loop over each point in powerlawPoints
    for(var i=0; i<powerlawPoints.length; ++i) {

        // get data point
        point = powerlawPoints[i];

        // increment sums
        slnx    += Math.log(point.x);
        slnx2   += Math.log(point.x)*Math.log(point.x);
        slny    += Math.log(point.y);
        slnxlny += Math.log(point.x)*Math.log(point.y);
    }

    var q = (slnxlny/slnx - slny/n) / (slnx2/slnx - slnx/n);
    var p = Math.exp(slnxlny/slnx - q*slnx2/slnx);

    // set curve function and point function
    const powerlawFunction = (x) => (p*Math.pow(x, q));
    curveFunction = powerlawFunction;
    pointFunction = (point) => (point.x > 0 && point.y > 0);

    // set equation display and code boxes
    //mathText = "y = "+m.toFixed(3)+"x + "+c.toFixed(3);

    codeboxes[0].value = p.toFixed(3)+"*Math.pow(x, "+q.toFixed(3)+")";
    codeboxes[1].value = p.toFixed(3)+"*pow(x, "+q.toFixed(3)+")";
    codeboxes[2].value = p.toFixed(3)+"*Math.Pow(x, "+q.toFixed(3)+")";
    codeboxes[3].value = p.toFixed(3)+"*math.pow(x, "+q.toFixed(3)+")";
    codeboxes[4].value = p.toFixed(3)+"*pow(x, "+q.toFixed(3)+")";
}

function exponentialRegression() {

    // y = ab^x

    // get points above 0
    var exponentialPoints = dataPoints.filter( (point) => (point.y > 0) );

    // function is y=ab^x
    var a = 1;
    var b = 1;

    // find a and b to minimise square residuals of dataset
    var sx    = 0;
    var sx2   = 0;
    var slny  = 0;
    var sxlny = 0;
    var n     = exponentialPoints.length;

    // loop over each point in dataPoints
    for(var i=0; i<n; ++i) {

        // get data point
        point = exponentialPoints[i];

        // increment sums
        sx    += point.x;
        sx2   += point.x*point.x;
        slny  += Math.log(point.y);
        sxlny += point.x*Math.log(point.y);
    }

    // calculate a and b
    b = Math.exp( (slny - n*sxlny/sx) / (sx - n*sx2/sx) );
    a = Math.exp( slny/n - Math.log(b)*sx/n );

    // set curve function & point function
    const exponentialFunction = (x) => ( a*Math.pow(b, x) );
    curveFunction = exponentialFunction;
    pointFunction = (point) => (point.y > 0);

    // set equation display and code boxes
    mathText = "y = "+a.toFixed(3)+" × "+b.toFixed(3)+"^x";

    codeboxes[0].value = a.toFixed(3)+" * Math.pow("+b.toFixed(3)+", x)";
    codeboxes[1].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", x)";
    codeboxes[2].value = a.toFixed(3)+" * Math.Pow("+b.toFixed(3)+", x)";
    codeboxes[3].value = a.toFixed(3)+" * "+b.toFixed(3)+"**x";
    codeboxes[4].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", x)";
}

function bellcurveRegression() {

    // y = ab^(x^-2)

    // get points above 0
    var bellcurvePoints = dataPoints.filter( (point) => (point.y > 0) );

    // find a and b to minimise square residuals of dataset
    var sx2    = 0;
    var sx4    = 0;
    var slny   = 0;
    var sx2lny = 0;
    var n      = bellcurvePoints.length;

    // loop over each point in bellcurvePoints
    for(var P of bellcurvePoints) {

        var x2  = P.x*P.x;
        var lny = Math.log(P.y);

        sx2    += x2;
        sx4    += x2*x2;
        slny   += lny;
        sx2lny += x2*lny;
    }
    
    var lnb = (sx2lny - slny*sx2/n) / (sx2*sx2/n - sx4);
    var lna = slny/n + sx2*lnb/n;

    var a   = Math.exp(lna);
    var b   = Math.exp(lnb);

    // set curve function & point function
    const bellcurveFunction = (x) => ( a*Math.pow(b, -(x*x)) );
    curveFunction = bellcurveFunction;
    pointFunction = (point) => (point.y > 0);

    codeboxes[0].value = a.toFixed(3)+" * Math.pow("+b.toFixed(3)+", -x*x)";
    codeboxes[1].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", -x*x)";
    codeboxes[2].value = a.toFixed(3)+" * Math.Pow("+b.toFixed(3)+", -x*x)";
    codeboxes[3].value = a.toFixed(3)+" * "+b.toFixed(3)+"**(-x**2)";
    codeboxes[4].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", -x*x)";
}

function fourierSeries(startX, endX, maxFreq) {

    // period is the length of 1 Complexete cycle
    var period = endX - startX;

    // get sorted list of points within the target period
    var fourierPoints = dataPoints.filter( (point) => (point.x >= startX && point.x <= startX+period) );
    fourierPoints.sort( (a,b) => (a.x < b.x ? -1 : 1) );

    // add extra point onto the end of the sequence to make function loop smoothly
    fourierPoints.push(new vec2(fourierPoints[0].x+period, fourierPoints[0].y));

    // array of fourier coefficients
    var c = new Array(maxFreq*2+1);

    // loop over frequency components
    for(var freq=-maxFreq; freq<=maxFreq; ++freq) {

        // calulate fourier coefficient as value of integral
        var integral = new Complex(0, 0);

        for(var i=0; i<fourierPoints.length-1; ++i) {

            // setup some variables
            var x_a = fourierPoints[i].x;
            var y_a = fourierPoints[i].y;
            var x_b = fourierPoints[i+1].x;
            var y_b = fourierPoints[i+1].y;

            // line is the interpolation function between the 2 points
            var grad = (y_b-y_a)/(x_b-x_a);
            const line = (x) => (grad*(x-x_a) + y_a);

            var u = 0;

            // increment value of integral
            if(freq != 0) {

                var freq2pi = 2*freq*Math.PI/period;

                u = comAdd(
                        comSub(
                            comMul(
                                new Complex(0, y_b / freq2pi),
                                comExp(-freq2pi*x_b)
                            ), 
                            comMul(
                                new Complex(0, y_a / freq2pi),
                                comExp(-freq2pi*x_a)
                            )
                        ),
                        comScale(
                            comSub(
                                comExp(-freq2pi*x_b), 
                                comExp(-freq2pi*x_a)
                            ),
                            grad/(freq2pi*freq2pi)
                        )
                    );
            }
            else {
                u = new Complex(grad/2 * (x_b*x_b - x_a*x_a) + (y_a - grad*x_a) * (x_b - x_a), 0);
            }

            // increment integral
            integral = comAdd(integral, u);
        }

        // set value in c
        c[freq+maxFreq] = integral;
    }

    // set curve function & point funtion
    const fourierFunction = (x) => (c.reduce( (acc, cur, idx) => ( acc + comMul(cur, comExp(2*Math.PI*(idx-maxFreq)*x/period)).re ), 0 )/period );
    curveFunction = fourierFunction;
    pointFunction = (point) => (point.x >= startX && point.x <= startX+period);

    // get positive frequencies
    cpos = c.slice(maxFreq);

    // variables to help format code
    var cosccpp = " * cos(M_PI*";
    var coscsh  = " * Math.Cos(Math.PI*";
    var cosjs   = " * Math.cos(Math.PI*";
    var cospy   = " * math.cos(math.pi*";
    var coshlsl = " * cos(pi*";

    // code ouput function
    outputCode = (c_arr, coslang) => (c_arr.reduce( (acc, cur, idx) => (acc + (acc=="" ? (cur.mod()/period).toFixed(3) : " + "+(cur.mod()*2/period).toFixed(3)) + (acc=="" ? "" : coslang+(2*idx/period).toFixed(3)+"*x + "+cur.arg().toFixed(3)+")") ), "" ));

    codeboxes[0].value = curveFunction;///outputCode(cpos, cosjs).replace("+ -", "- ");
    codeboxes[1].value = outputCode(cpos, cosccpp).replace("+ -", "- ");
    codeboxes[2].value = outputCode(cpos, coscsh).replace("+ -", "- ");
    codeboxes[3].value = outputCode(cpos, cospy).replace("+ -", "- ");
    codeboxes[4].value = outputCode(cpos, coshlsl).replace("+ -", "- ");
}


// function iteration variables
var beta  = new Array(10).fill(1);
const freakedExponential = (x, coeffs) => (coeffs[0]*Math.pow(coeffs[1], Math.pow(x, coeffs[2])) + coeffs[3]);
const sigmoid = (x, coeffs) => ( coeffs[0] / (coeffs[1] + coeffs[2] * Math.pow(coeffs[3], x)) + coeffs[4] );

function functionIteration(nbeta = 4, func = freakedExponential) {

    // check for nans in parameters
    for(var i=0; i<nbeta; ++i) {

        beta[i] = isNaN(beta[i]) ? 1 : beta[i];
    }

    for(var iteration=0; iteration<1000; ++iteration) {

        // array containing sum of partial derivatives of error with respect to each parameter
        var dbeta = new Array(nbeta).fill(0);

        // loop over datapoints and find partial derivative of error from that point with respect to each parameter
        for(var i=0; i<dataPoints.length; ++i) {

            var xi = dataPoints[i].x;
            var yi = dataPoints[i].y;

            for(var j=0; j<nbeta; ++j) {

                // create parameter lists with 1 element perturbed for 2 sided gradient approximation
                // todo symbolic differentiation
                var betaplus  = beta.slice();
                var betaminus = beta.slice();
                betaplus[j]  += 1e-4;
                betaminus[j] -= 1e-4;

                // increment partial derivative
                dbeta[j] += (Math.pow(yi - func(xi, betaplus), 2) - Math.pow(yi - func(xi, betaminus), 2)) / 2e-4;
            }
        }

        // change the parameters proportional to their derivative
        for(var j=0; j<nbeta; ++j) {

            beta[j] -= 0.001*dbeta[j];
        }
    }

    const iteratedFunction = (x) => (func(x, beta));
    return [iteratedFunction, (point) => (true)];
}


// ---------- end regression code ----------

// ---------- quickMaths.js ----------


// Oscar Saharoy 2020

class Complex {
    constructor(re, im) {

        this.re = re;
        this.im = im;
    }

    arg() {

        return Math.atan2(this.im, this.re);
    }

    mod() {

        return Math.sqrt(this.re*this.re + this.im*this.im);
    }
}

function comExp(x) {

    // e^(ix)
    return new Complex(Math.cos(x), Math.sin(x));
}

function comAdd(z1, z2) {

    // z1+z2
    return new Complex(z1.re+z2.re, z1.im+z2.im);
}

function comSub(z1, z2) {

    // z1-z2
    return new Complex(z1.re-z2.re, z1.im-z2.im);
}

function comMul(z1, z2) {

    // z1*z2
    return new Complex(z1.re*z2.re-z1.im*z2.im, z1.re*z2.im+z1.im*z2.re);
}

function comDiv(z1, z2) {

    // z1/z2
    var denominator = z2.re*z2.re + z2.im*z2.im;
    return new Complex((z1.re*z2.re+z1.im*z2.im)/denominator, (z1.im*z2.im-z1.re*z2.re)/denominator);
}

function comScale(z1, s) {

    // z1*s
    return new Complex(z1.re*s, z1.im*s);
}


class Matrix {
    constructor(rows, cols) {

        this.r = rows;
        this.c = cols;
        this.l = rows*cols;
        this.data = new Array(rows*cols).fill(0);
    }

    index(row, col) {

        return row*this.c + col;
    }

    set(row, col, value) {

        this.data[row*this.c + col] = value;
    }

    get(row, col) {

        return this.data[row*this.c + col];
    }

    T() {

        // returns transpose as new matrix

        // create new array to fill with transposed elements
        var temp = new Matrix(this.c, this.r);

        // set indices
        var i=0;
        var j=0;

        for(var t=0; t<this.l; ++t) {

            // set element in temp matrix
            temp.data[t] = this.data[j*this.c + i];

            // update indices
            ++j;

            if(j==temp.c) {

                ++i;
                j = 0;
            }
        }

        return temp;
    }

    det() {

        // find the determinant of matrix - must be square

        // temporary variable to store output
        var temp = 0;

        // if its a 2x2 matrix, return the determinant directly
        if(this.r == 2 && this.c == 2) {

            return this.data[0] * this.data[3] - this.data[1] * this.data[2];
        }

        // loop over first row, recursively calling det on the minors
        for(var t=0; t<this.c; ++t) {

            temp += (-t%2 * 2 + 1) * this.data[t] * (this.minor(0, t)).det();
        }

        return temp;
    }

    inv() {

        // invert matrix - square matrices only
        var temp = new Matrix(this.r, this.c);
        var transpose = this.T();
        var determinant = this.det();

        // if its a 2x2 matrix return the inverse
        if(this.r == 2 && this.c == 2) {

            temp.data[0] =   1/determinant * this.data[3];
            temp.data[1] = - 1/determinant * this.data[1];
            temp.data[2] = - 1/determinant * this.data[2];
            temp.data[3] =   1/determinant * this.data[0];

            return temp;
        }

        for(var t=0; t<this.l; ++t) {

            temp.data[t] = ( (t + (this.c%2==0 ? Math.floor(t/this.c) : 0))%2 * -2 + 1 )/determinant * transpose.minor(Math.floor(t/this.c)%this.r, t%this.c).det();
        }

        return temp;
    }

    minor(r1, c1) {

        // temporary matrix to store result
        var temp = new Matrix(this.r-1, this.c-1);

        // index of current element in the minor matrix
        var im = 0;

        // iterate over elements of temp matrix
        for(var t=0; t<temp.l; ++t, ++im) {

            // skip if im is inside the crossed out row/column
            while(im%this.c == c1 || Math.floor(im/this.c)%this.r == r1) {

                ++im;
            }

            temp.data[t] = this.data[im];
        }

        return temp;
    }
}

function matMul(M1, M2) {

    // multiply 2 matrices and return new matrix

    // initialise result matrix
    var temp = new Matrix(M1.r, M2.c);

    // indices of entry in result matrix
    var i = 0;
    var j = 0;

    for(var t=0; t<temp.l; ++t) {

        // sum for entry in result matrix
        var sum = 0;

        // calculate entry
        for(var k=0; k<M2.r; k++) {

            sum += M1.data[i*M1.c + k] * M2.data[k*M2.c + j];
        }

        // assign entry to value of sum
        temp.data[t] = sum;

        // update indices
        ++j;

        if(j==temp.c) {

            ++i;
            j = 0;
        }
    }

    return temp;
}


// ---------- end quickMaths.js ---------- 
