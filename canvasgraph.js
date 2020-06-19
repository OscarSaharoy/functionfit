// Oscar Saharoy 2020

// point class really simple
class Point {

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

// get canvas and drawing context
var canvas = document.getElementById("canvas");
var ctx    = canvas.getContext("2d");

// declare graph variables
var viewportCorners = [-5, -5, 5, 5];
var canvasWidth, canvasHeight, dpr;
var mouseclicked = false;
var movedInClick = false;
var xGridSpacing = 1;
var yGridSpacing = 1;
var zoomLevelX   = 0;
var zoomLevelY   = 0;
var gridLinesX   = 16;
var gridLinesY   = 16;
var rem          = parseInt(getComputedStyle(document.documentElement).fontSize);
var mousePosX    = 0;
var mousePosY    = 0;

// data variables
var dataPoints   = [];
 
// spinning dot temp
var b = 0;

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

function mousemove(event) {

	// get mousepos for display at top of graph
	mousePosX = canvasToGraphX(event.offsetX*dpr);
	mousePosY = canvasToGraphY(event.offsetY*dpr);

	// handle panning the graph
	if(mouseclicked) {

		// set moved in click flag
		movedInClick = true;

		// shift corners of viewport
		viewportCorners[0] -= canvasToGraphScaleX(event.movementX);
		viewportCorners[2] -= canvasToGraphScaleX(event.movementX);
		viewportCorners[1] -= canvasToGraphScaleY(event.movementY);
		viewportCorners[3] -= canvasToGraphScaleY(event.movementY);
	}
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

function click(event) {

	// handle adding a point on click but only if the mouse didn't more during the click
	if(!movedInClick) {

		var removed = false;

		for(var [i, point] of Object.entries(dataPoints)) {

			console.log(i, point);

			// need to chanve to canbas space
			if( (point.x-mousePosX)*(point.x-mousePosX) + (point.y-mousePosY)*(point.y-mousePosY) < rem*rem/4 ) {

				dataPoints.splice(i, 1);
				removed = true;
			}
		}
		
		if(!removed) {
			dataPoints.push(new Point(mousePosX, mousePosY));
		}
	}

	movedInClick = false;
}

// event listeners
window.addEventListener("resize", resize);
window.addEventListener("mousemove", mousemove);
window.addEventListener("mousedown", () => (mouseclicked = true));
window.addEventListener("mouseup",   () => (mouseclicked = false));
window.addEventListener("click", click);

// prevents page scrolling when mouse in canvas
canvas.onwheel = (e) => {e.preventDefault();};
canvas.addEventListener("wheel", wheel);

function draw() {

	// cler canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// spinning dot test
	b += 0.05;

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

	// draw spinning dot
	ctx.beginPath();
	ctx.arc(graphToCanvasX(2*Math.cos(b)), graphToCanvasY(2*Math.sin(3*b)), 3, 0, 6.28);
	ctx.fill();

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

		y = Math.abs(y)<1e-10 ? 0.0 : y;

		var lineAcross = graphToCanvasX(x);
		ctx.beginPath();
		ctx.moveTo(lineAcross,            0);
		ctx.lineTo(lineAcross, canvasHeight);
		ctx.stroke();

		// if number is offscreen shift it onscreen
		var textHeight = rem;

		// draw number
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

	// draw mouse position x and y in top corner
	var text = mousePosX.toPrecision(3) + ", " + mousePosY.toPrecision(3);
	var textWidth = ctx.measureText(text).width;
	ctx.fillStyle = "white";
	ctx.fillRect(canvasWidth-8-textWidth, 0, 8+textWidth, rem+8);
	ctx.fillStyle = "black";
	ctx.fillText(text, canvasWidth-4-textWidth, rem+4);

	// set style for data points
	ctx.strokeStyle = "#30F35E";
	ctx.fillStyle   = "white";
	ctx.lineWidth   = 3;

	// draw data points
	for(var point of dataPoints) {

		// draw circle on each point
		ctx.beginPath();
		ctx.arc(graphToCanvasX(point.x), graphToCanvasY(point.y), rem/2, 0, 6.28);
		ctx.fill();
		ctx.stroke();
	}
	
	requestAnimationFrame(draw);
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

function canvasToGraphScaleX(canvasX) {

	return canvasX * (viewportCorners[2] - viewportCorners[0]) / canvasWidth;
}

function canvasToGraphScaleY(canvasY) {

	return canvasY * (viewportCorners[1] - viewportCorners[3]) / canvasHeight;
}