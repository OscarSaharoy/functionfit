// Oscar Saharoy 2020

// functions: linear y = mx + c, polynomial a + bx + cx^2 + ...

function linearRegression() {

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

	// draw line on graph
	curvePoints = [];

	for(var x=-10; x<11; ++x) {
		curvePoints.push(new Point(x, m*x+c));
	}

	// return linear function
	const line = (x) => (m*x + c);
	return line;
}

function polynomialRegression(order) {

	// initialise variables and matrices
	var n = dataPoints.length;

	var sx = new Matrix(order+1, order+1);
	var x  = new Matrix(order+1, n);
	var y  = new Matrix(n, 1);

	// little functions to help indexing in xs
	indexHelper = (depth, Lrow) => (depth<order+1-Lrow ? [depth, Lrow] : [order-Lrow, depth-order+2*Lrow]);
	LrowDepth   = (Lrow) => (2*(order-Lrow)+1);

	// populate matrices

	// loop over first Lrow in sx to fill it
	for(var i=0; i<LrowDepth(0); ++i) {

		// sum of datapoint.x raised to powers
		var powerSum = 0;

		// loop over dataPoints to get powersum and set each value in x
		for(var p=0; p<dataPoints.length; ++p) {

			var xiToPower = Math.pow(dataPoints[p].x, i);
			powerSum += xiToPower;

			// set value in x and y
			if(i<order+1) {

				x.set(i, p, xiToPower);
				y.set(p, 0, dataPoints[p].y);
			}
		}

		// set value in sx based on powersum
		var [m, n] = indexHelper(i, 0);
		sx.set(m, n, powerSum);
	}

	// fill the rest of sx based on Lrow-depth indexing
	for(var Lrow=1; Lrow<order+1; ++Lrow) {
		for(var depth=0; depth<LrowDepth(Lrow); ++depth) {

			var [m, n] = indexHelper(depth, Lrow);
			var [r, s] = indexHelper(depth+1, Lrow-1);
			sx.set(m, n, sx.get(r, s));
		}
	}

	// calculate polynomial coefficients
	var c = (matMul(sx.inv(), matMul(x, y))).data;
	// alternative
	//var c = matMul(matMul( (matMul( x, x.T() )).inv() , x), y).data;


	// draw curve on graph
	curvePoints = [];

	for(var x=-10; x<11; x+=0.1) {

		var y=0;

		for(var p=0; p<order+1; ++p) {
			
			y += Math.pow(x, p) * c[p];
		}

		curvePoints.push(new Point(x, y));
	}

	// return polynomial function
	const poly = (x) => (c.reduce( (acc, cur, idx) => (acc + cur*Math.pow(x, idx))) );
	return poly;
}

function fourierSeries(startX, period, maxFreq) {

	// get sorted list of points within the target period
	var fourierPoints = dataPoints.filter( (point) => (point.x >= startX && point.x <= startX+period) );
	fourierPoints.sort( (a,b) => (a.x < b.x ? -1 : 1) );

	// add extra point onto the end of the sequence to make function loop smoothly
	fourierPoints.push(new Point(fourierPoints[0].x+period, fourierPoints[0].y));

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

	// draw curve

	curvePoints = [];

	for(var x=-1; x<=2; x+=0.01) {

		var y = 0;

		for(var freq=-maxFreq; freq<=maxFreq; ++freq) {

			y += comMul(c[freq+maxFreq], comExp(2*Math.PI*freq*x/period)).re;
		}

		curvePoints.push(new Point(x, y/period));
	}

	// return fourier function
	const fourierFunction = (x) => (c.reduce( (acc, cur, idx) => ( acc + comMul(cur, comExp(2*Math.PI*(idx-maxFreq)*x/period)).re ), 0 )/period );
	return fourierFunction;
}

function exponentialRegression() {

	// get points above 0
	var exponentialPoints = dataPoints.filter( (point) => (point.y >= 0) );

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

	// draw line on graph
	curvePoints = [];

	for(var x=-2; x<3; x+=0.1) {
		curvePoints.push( new Point(x, a*Math.pow(b, x)) );
	}

	// return exponential function
	const exponentialFunction = (x) => ( a*Math.pow(b, x) );
	return exponentialFunction;
}