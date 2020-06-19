// Oscar Saharoy 2020


// get canvas and drawing context
var canvas = document.getElementById("canvas");
var ctx    = canvas.getContext("2d");

// declare variables
var viewportCorners = [-10, 10, 10, -10];
var canvasWidth, canvasHeight, dpr;
var mouseclicked = false;
var xGridSpacing = 1;
var yGridSpacing = 1;
var zoomLevelX   = 0;
var zoomLevelY   = 0;
var gridLinesX   = 16;
var gridLinesY   = 16;
 
// spinning dot temp
var b = 0;

// initial canvas resize & start draw loop
resize();
draw();

function resize() {

	// set canvas to have 1:1 canvas pixel to screen pixel ratio
	dpr           = window.devicePixelRatio || 1;
	var rect      = canvas.getBoundingClientRect();
	canvasWidth   = rect.width  * dpr;
	canvasHeight  = rect.height * dpr;
	canvas.width  = canvasWidth;
	canvas.height = canvasHeight;
}

window.addEventListener("resize", resize);

function mousemove(event) {

	// handle panning the graph
	if(mouseclicked) {
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
	var yLength = viewportCorners[1] - viewportCorners[3];

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

// event listeners
window.addEventListener("mousemove", mousemove);
window.addEventListener("mousedown", () => (mouseclicked = true));
window.addEventListener("mouseup",   () => (mouseclicked = false));

// prevents page scrolling when mouse in canvas and setup new behaviour
canvas.onwheel = (e) => {e.preventDefault();};
canvas.addEventListener("wheel", wheel);

function draw() {

	// cler canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// spinning dot test
	b += 0.05;

	// draw the 2 axes
	var originX = graphToCanvasX(0);
	var originY = graphToCanvasY(0);

	ctx.lineWidth = 3;
	ctx.strokeStyle = "rgba(0, 0, 0, 1)";

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
	ctx.lineWidth = 1;
	ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";

	// set font for numbers
	ctx.font = "1rem Comfortaa";

	// gridlines in x and y
	for(var x=-0.5*gridLinesX*xGridSpacing; x<0.5*gridLinesX*xGridSpacing; x==-1*xGridSpacing ? x+=2*xGridSpacing : x+=xGridSpacing) { // weird loop to skip x==0

		var lineAcross = graphToCanvasX(x);
		ctx.beginPath();
		ctx.moveTo(lineAcross,            0);
		ctx.lineTo(lineAcross, canvasHeight);
		ctx.stroke();

		// draw number
		ctx.fillText(x.toPrecision(2), lineAcross+3, originY-4);
	}

	for(var y=-0.5*gridLinesY*yGridSpacing; y<0.5*gridLinesY*yGridSpacing; y += yGridSpacing) {

		var lineHeight = graphToCanvasY(y);
		ctx.beginPath();
		ctx.moveTo(          0, lineHeight);
		ctx.lineTo(canvasWidth, lineHeight);
		ctx.stroke();

		// draw number
		ctx.fillText(y.toPrecision(2), originX+4, lineHeight-3);
	}

	requestAnimationFrame(draw);
}


// functions translate from graph space to canvas space
function graphToCanvasX(graphX) {

	return (graphX - (viewportCorners[2] + viewportCorners[0]) / 2) * canvasWidth / (viewportCorners[2] - viewportCorners[0]) + canvasWidth / 2;
}

function graphToCanvasY(graphY) {

	return (graphY - (viewportCorners[3] + viewportCorners[1]) / 2) * canvasHeight / (viewportCorners[3] - viewportCorners[1]) + canvasHeight / 2;
}

function canvasToGraphX(canvasX) {

	return (canvasX - canvasWidth / 2) * (viewportCorners[2] - viewportCorners[0]) / canvasWidth + (viewportCorners[2] + viewportCorners[0]) / 2;
}

function canvasToGraphY(canvasY) {

	return (canvasY - canvasHeight / 2) * (viewportCorners[3] - viewportCorners[1]) / canvasHeight + (viewportCorners[3] + viewportCorners[1]) / 2;
}

function canvasToGraphScaleX(canvasX) {

	return canvasX * (viewportCorners[2] - viewportCorners[0]) / canvasWidth;
}

function canvasToGraphScaleY(canvasY) {

	return canvasY * (viewportCorners[3] - viewportCorners[1]) / canvasHeight;
}