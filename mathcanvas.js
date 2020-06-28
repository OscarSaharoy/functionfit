// Oscar Saharoy 2020

var mathText = "";

( function () {

	// canvas variables
	var canvas       = document.getElementById("mathcanvas");
	var ctx          = canvas.getContext("2d");

	var canvasWidth  = 0;
	var canvasHeight = 0;	

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

	function draw() {

		// set font and fillstyle
		ctx.font      = "1.8rem Crimson Text";
		ctx.fillStyle = "black";

		// clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// replace + - in mathtext with just a -
		var formatted = mathText.replace("+ -", "- ");

		// test
		var textWidth = ctx.measureText(formatted).width;
		ctx.fillText(formatted, (canvasWidth-textWidth)/2, canvasHeight/2+0.9*rem);

		requestAnimationFrame(draw);
	}

} )();