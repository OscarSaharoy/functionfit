// Oscar Saharoy 2020

// point class really simple
class Point {

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

function addp(pointA, pointB) {

	return new Point(pointA.x+pointB.x, pointA.y+pointB.y);
}

function scalep(point, S) {

	return new Point(S*point.x, S*point.y);
}

// get canvas and drawing context
var canvas = document.getElementById("canvasgraph");
var ctx    = canvas.getContext("2d");

// declare graph variables
var viewportCorners = [-5, -5, 5, 5];
var canvasWidth, canvasHeight, dpr;
var mouseclicked   = false;
var movedInClick   = false;
var xGridSpacing   = 1;
var yGridSpacing   = 1;
var zoomLevelX     = 0;
var zoomLevelY     = 0;
var gridLinesX     = 16;
var gridLinesY     = 16;
var rem            = parseInt(getComputedStyle(document.documentElement).fontSize);
var mousePosX      = 0;
var mousePosY      = 0;

// data variables
var dataPoints     = [new Point(-2.0, -0.5), new Point(-0.8, 0.2), new Point(0, -0.3), new Point(0.6, 0.5), new Point(2.0, 1.5)];//[];
var closeDataPoint = -1;

// initial function values
var curveFunction  = null;
var pointFunction  = (point) => (true);
var regressionFunction = () => ([null, (point) => (true)]);

// initial canvas resize & start draw loop
resize();
wheel(new WheelEvent(null));
draw();

// set graph to have 1:1 x scale and y scale
viewportCorners[1] = viewportCorners[0] * canvasHeight/canvasWidth;
viewportCorners[3] = viewportCorners[2] * canvasHeight/canvasWidth;
gridLinesY = gridLinesX * canvasHeight/canvasWidth;

function resize() {

	// set canvas to have 1:1 canvas pixel to screen pixel ratio
	dpr           = window.devicePixelRatio || 1;
	var rect      = canvas.getBoundingClientRect();
	canvasWidth   = rect.width  * dpr;
	canvasHeight  = rect.height * dpr;
	canvas.width  = canvasWidth;
	canvas.height = canvasHeight;
}

function wheel(event) {

	// zoom in and out on the graph
	var centerX = canvasToGraphX(event.offsetX*dpr);
	var centerY = canvasToGraphY(event.offsetY*dpr);

	// move viewport corners towards or away from cursor
	var viewportCornerDeltas = [viewportCorners[0] - centerX, viewportCorners[1] - centerY, viewportCorners[2] - centerX, viewportCorners[3] - centerY];
	var scale   = 1 + event.deltaY / 200;
	viewportCorners = [centerX + viewportCornerDeltas[0] * scale, centerY + viewportCornerDeltas[1] * scale, centerX + viewportCornerDeltas[2] * scale, centerY + viewportCornerDeltas[3] * scale];

	// calculate which gridlines to draw
	var xLength = viewportCorners[2] - viewportCorners[0];
	var yLength = viewportCorners[3] - viewportCorners[1];

	// this is awful
	if(xLength > gridLinesX*xGridSpacing) {
		xGridSpacing *= ((zoomLevelX%3)+3)%3 == 1 ? 2.5 : 2; // weird modulo fixes negative result for negative numbers
		++zoomLevelX;
	}
	else if(xLength < (((zoomLevelX%3)+3)%3 == 2 ? gridLinesX/2.5 : gridLinesX/2)*xGridSpacing) {
		xGridSpacing /= ((zoomLevelX%3)+3)%3 == 2 ? 2.5 : 2;
		--zoomLevelX;
	}
	if(yLength > gridLinesY*yGridSpacing) {
		yGridSpacing *= ((zoomLevelY%3)+3)%3 == 1 ? 2.5 : 2;
		++zoomLevelY;
	}
	else if(yLength < (((zoomLevelY%3)+3)%3 == 2 ? gridLinesY/2.5 : gridLinesY/2)*yGridSpacing) {
		yGridSpacing /= ((zoomLevelY%3)+3)%3 == 2 ? 2.5 : 2;
		--zoomLevelY;
	}
}

function mousedown(event) {

	mousemove(event);

	// set mouseclicked flag
	mouseclicked = true;
}

function mousemove(event) {

	// get mousepos for display at top of graph and close data point
	mousePosX = canvasToGraphX(event.offsetX*dpr);
	mousePosY = canvasToGraphY(event.offsetY*dpr);

	// handle panning the graph
	if(mouseclicked && closeDataPoint == -1) {

		// set cursor to grabbing
		canvas.style.cursor = "grabbing";

		// set moved in click flag
		movedInClick = true;

		// shift corners of viewport
		viewportCorners[0] -= canvasToGraphScaleX(event.movementX);
		viewportCorners[2] -= canvasToGraphScaleX(event.movementX);
		viewportCorners[1] -= canvasToGraphScaleY(event.movementY);
		viewportCorners[3] -= canvasToGraphScaleY(event.movementY);
	}

	// handle moving close data point
	else if(mouseclicked) {

		// set moved in click flag
		movedInClick = true;

		// move close data point to under cursor
		dataPoints[closeDataPoint].x = mousePosX;
		dataPoints[closeDataPoint].y = mousePosY;

		// update regression model
		regressionFunction();
	}

	else {

		// update close data point
		closeDataPoint = getCloseDataPoint(mousePosX, mousePosY);

		// if mouse is close to a point then change cursor to movey
		canvas.style.cursor = closeDataPoint == -1 ? "auto" : "move";
	}
}

function mouseup(event) {

	// handle adding a point on click but only if the mouse didn't more during the click
	if(!movedInClick) {

		if(closeDataPoint != -1) {

			dataPoints.splice(closeDataPoint, 1);
		}
		else {
			dataPoints.push(new Point(mousePosX, mousePosY));
		}

		// update regression model
		regressionFunction();
	}

	// set mouse flags
	mouseclicked = false;
	movedInClick = false;

	// call mousemove to update cursor
	mousemove(event);
}

// event listeners
window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", mousemove);
canvas.addEventListener("mousedown", mousedown);
canvas.addEventListener("mouseup", mouseup);

// prevents page scrolling when mouse in canvas
canvas.onwheel = (e) => {e.preventDefault();};
canvas.addEventListener("wheel", wheel);

function draw() {

	// cler canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// get origin x and y pos limited to viewport extents
	var originX = 0 <= viewportCorners[0] ? viewportCorners[0] : (0 >= viewportCorners[2] ? viewportCorners[2] : 0);
	var originY = 0 <= viewportCorners[1] ? viewportCorners[1] : (0 >= viewportCorners[3] ? viewportCorners[3] : 0);
	originX = graphToCanvasX(originX);
	originY = graphToCanvasY(originY);

	// draw the 2 axes
	ctx.lineWidth = 3;
	ctx.strokeStyle = "black";

	ctx.beginPath();
	ctx.moveTo(          0, originY);
	ctx.lineTo(canvasWidth, originY);
	ctx.stroke();
	ctx.moveTo(originX, 0);
	ctx.lineTo(originX, canvasHeight);
	ctx.stroke();

	// change strokestyle for gridlines
	ctx.lineWidth   = 1;
	ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
	ctx.fillStyle   = "black";

	// set font for numbers
	ctx.font = "1rem Comfortaa";

	// start point for drawing gridlines
	var xStart = Math.floor(viewportCorners[0]/xGridSpacing - 1) * xGridSpacing;
	var yStart = Math.floor(viewportCorners[1]/yGridSpacing - 1) * yGridSpacing;

	// gridlines in x and y
	for(var x=xStart; x<viewportCorners[2]; x+=xGridSpacing) {

		x = Math.abs(x)<1e-10 ? 0.0 : x;

		var lineAcross = graphToCanvasX(x);
		ctx.beginPath();
		ctx.moveTo(lineAcross,            0);
		ctx.lineTo(lineAcross, canvasHeight);
		ctx.stroke();

		// if number is offscreen shift it onscreen
		var textHeight = rem;

		// draw numbers
		ctx.fillText(x.toPrecision(2), lineAcross+4, (originY-8-textHeight < 0 ? textHeight+4 : originY-4));
	}

	for(var y=yStart; y<viewportCorners[3]; y += yGridSpacing) {
		
		y = Math.abs(y)<1e-10 ? 0.0 : y;

		var lineHeight = graphToCanvasY(y);
		ctx.beginPath();
		ctx.moveTo(          0, lineHeight);
		ctx.lineTo(canvasWidth, lineHeight);
		ctx.stroke();

		// if number is offscreen shift it onscreen
		var textWidth = ctx.measureText(y.toPrecision(2)).width;

		// draw number
		ctx.fillText(y.toPrecision(2), (originX+8+textWidth > canvasWidth ? canvasWidth-4-textWidth : originX+4), lineHeight-4);
	}

	// set style for curve
	ctx.strokeStyle = "#54F330";
	ctx.lineWidth   = 2;

	// draw curve if a curve function is set
	if(curveFunction != null) {

		var step = (viewportCorners[2] - viewportCorners[0])/300;
		ctx.beginPath();
		//ctx.moveTo(xStart, 0);

		for(var x=xStart; x<viewportCorners[2]; x+=step) {

			// limit y coord so that stroke works properly
			var canvasY = graphToCanvasY(curveFunction(x));
			canvasY = canvasY>canvasHeight+10 ? canvasHeight+10 : canvasY<-10 ? -10 : canvasY;

			ctx.lineTo(graphToCanvasX(x), canvasY);
		}
		ctx.stroke();
	}

	// draw mouse position x and y in top corner
	ctx.font = "1.3rem Comfortaa";
	var text = mousePosX.toPrecision(3) + ", " + mousePosY.toPrecision(3);
	var textWidth = ctx.measureText(text).width;

	// draw white box behind
	ctx.fillStyle = "white";
	ctx.fillRect(canvasWidth-8-textWidth, 0, 8+textWidth, rem*1.3+8);

	// draw numbers
	ctx.fillStyle = "black";
	ctx.fillText(text, canvasWidth-4-textWidth, rem*1.3+4);

	// set style for data points
	ctx.fillStyle = "white";
	ctx.lineWidth = 3;

	// draw data points
	for(var point of dataPoints) {

		// use pointFunction to determine point colour
		var pointColour = pointFunction(point) ? "#54F330" : "#bbbbbb";
		drawPoint(pointColour, point.x, point.y);
	}
	
	requestAnimationFrame(draw);
}

// get index of close dataPoint in the dataPoints array or -1 if none are close
function getCloseDataPoint(x, y) {

	const closeEnough = point => graphToCanvasScaleX(point.x-x) * graphToCanvasScaleX(point.x-x)
			   				   + graphToCanvasScaleY(point.y-y) * graphToCanvasScaleY(point.y-y)
			   				   < rem*rem/2

	return dataPoints.findIndex(closeEnough);
}

function drawPoint(colour, x, y) {

	ctx.strokeStyle = colour;

	// draw circle on point
	ctx.beginPath();
	ctx.arc(graphToCanvasX(x), graphToCanvasY(y), rem/2, 0, 6.28);
	ctx.fill();
	ctx.stroke();
}


// functions translate from graph space to canvas space
function graphToCanvasX(graphX) {

	return (graphX - (viewportCorners[2] + viewportCorners[0]) / 2) * canvasWidth / (viewportCorners[2] - viewportCorners[0]) + canvasWidth / 2;
}

function graphToCanvasY(graphY) {

	return (graphY - (viewportCorners[1] + viewportCorners[3]) / 2) * canvasHeight / (viewportCorners[1] - viewportCorners[3]) + canvasHeight / 2;
}

function canvasToGraphX(canvasX) {

	return (canvasX - canvasWidth / 2) * (viewportCorners[2] - viewportCorners[0]) / canvasWidth + (viewportCorners[2] + viewportCorners[0]) / 2;
}

function canvasToGraphY(canvasY) {

	return (canvasY - canvasHeight / 2) * (viewportCorners[1] - viewportCorners[3]) / canvasHeight + (viewportCorners[1] + viewportCorners[3]) / 2;
}

function graphToCanvasScaleX(graphX) {

	return graphX *  canvasWidth / (viewportCorners[2] - viewportCorners[0]);
}

function graphToCanvasScaleY(graphY) {

	return graphY * canvasHeight / (viewportCorners[1] - viewportCorners[3]);
}

function canvasToGraphScaleX(canvasX) {

	return canvasX * (viewportCorners[2] - viewportCorners[0]) / canvasWidth;
}

function canvasToGraphScaleY(canvasY) {

	return canvasY * (viewportCorners[1] - viewportCorners[3]) / canvasHeight;
}