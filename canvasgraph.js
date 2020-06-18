// Oscar Saharoy 2020

var canvas = document.getElementById("canvas");
var ctx    = canvas.getContext("2d");

var viewportCorners = [-10, 10, 10, -10];
var canvasWidth, canvasHeight;
var mouseclicked = false;

var b = 0;

resize();
draw();

function resize() {

	var dpr       = window.devicePixelRatio || 1;
	var rect      = canvas.getBoundingClientRect();
	canvasWidth   = rect.width  * dpr;
	canvasHeight  = rect.height * dpr;
	canvas.width  = canvasWidth;
	canvas.height = canvasHeight;
}

window.addEventListener("resize", resize);

function mousemove(event) {

	if(mouseclicked) {
		viewportCorners[0] -= event.movementX / 50;
		viewportCorners[2] -= event.movementX / 50;
		viewportCorners[1] += event.movementY / 50;
		viewportCorners[3] += event.movementY / 50;
	}
}

function wheel(event) {

	console.log(event.deltaY);
}

window.addEventListener("mousemove", mousemove);
window.addEventListener("mousedown", () => (mouseclicked = true));
window.addEventListener("mouseup",   () => (mouseclicked = false));

canvas.onwheel = (e) => {e.preventDefault();};
canvas.addEventListener("wheel", wheel);

function draw() {

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	b += 0.05;

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

	ctx.beginPath();
	ctx.arc(graphToCanvasX(2*Math.cos(b)), graphToCanvasY(2*Math.sin(b)), 3, 0, 6.28);
	ctx.fill();

	ctx.lineWidth = 1;
	ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";

	for(var x=-10; x<10; ++x) {

		var lineAcross = graphToCanvasX(x);
		ctx.beginPath();
		ctx.moveTo(lineAcross,            0);
		ctx.lineTo(lineAcross, canvasHeight);
		ctx.stroke();
	}

	for(var y=-10; y<10; ++y) {

		var lineHeight = graphToCanvasY(y);
		ctx.beginPath();
		ctx.moveTo(          0, lineHeight);
		ctx.lineTo(canvasWidth, lineHeight);
		ctx.stroke();
	}

	requestAnimationFrame(draw);
}

function graphToCanvasX(graphX) {

	return (graphX - (viewportCorners[2] + viewportCorners[0]) / 2) * canvasWidth / (viewportCorners[2] - viewportCorners[0]) + canvasWidth / 2;
}

function graphToCanvasY(graphY) {

	return (graphY - (viewportCorners[3] + viewportCorners[1]) / 2) * canvasWidth / (viewportCorners[3] - viewportCorners[1]) + canvasHeight / 2;
}

function graphToCanvas(graphX, graphY) {

	var canvasX, canvasY;

	var viewportCenterX = (viewportCorners[2] + viewportCorners[0]) / 2;
	var viewportCenterY = (viewportCorners[3] + viewportCorners[1]) / 2;

	var pixelsPerUnitX = canvasWidth / (viewportCorners[2] - viewportCorners[0]);
	var pixelsPerUnitY = canvasWidth / (viewportCorners[3] - viewportCorners[1]);

	canvasX = (graphX - viewportCenterX) * pixelsPerUnitX + canvasWidth / 2;
	canvasY = (graphY - viewportCenterY) * pixelsPerUnitY + canvasHeight / 2;

	return [canvasX, canvasY];
}