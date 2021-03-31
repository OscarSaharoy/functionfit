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
        new ResizeObserver( () => this.resize() ).observe( this.canvas );

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

        // clear box behind
        this.ctx.clearRect(this.canvasSize.x-8-textWidth, 0, 8+textWidth, this.rem*1.3 + 8);

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
