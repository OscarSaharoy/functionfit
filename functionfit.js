// Oscar Saharoy 2020

// functions: linear y = mx + c, polynomial a + bx + cx^2 + ...

function optimiseLinear() {

	// learning rate
	var lr = 0.01;

	// iteration loop
	for(var iterations=0; iterations<100; ++iterations) {

		// loop over each point in dataPoints
		for(var i=0; i<dataPoints.length; ++i) {

			// get data point
			point = dataPoints[i];

			// derivatives of square residuals of points wrt line variables
			var dD2dm = -2*point.x*(point.y-m*point.x-c);
			var dD2dc = -2*(point.y-m*point.x-c);

			// adjust variables
			m -= lr*dD2dm;
			c -= lr*dD2dc;
		}
	}

	// draw line on graph
	curvePoints = [];

	for(var x=-10; x<11; ++x) {
		curvePoints.push(new Point(x, m*x+c));
	}

	return (x) => (m*x + c);
}

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
	var n  = dataPoints.length;

	var sx = math.zeros([order+1, order+1]);
	var x  = math.zeros([order+1, n]);
	var y  = math.zeros([n, 1]);

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

				x[i][p] = xiToPower;
				y[p][0] = dataPoints[p].y
			}
		}

		// set value in sx based on powersum
		var [m, n] = indexHelper(i, 0);
		sx[m][n] = powerSum;
	}

	// fill the rest of sx based on Lrow-depth indexing
	for(var Lrow=1; Lrow<order+1; ++Lrow) {
		for(var depth=0; depth<LrowDepth(Lrow); ++depth) {

			var [m, n] = indexHelper(depth, Lrow);
			var [r, s] = indexHelper(depth+1, Lrow-1);
			sx[m][n] = sx[r][s];
		}
	}

	// create matrices from arrays
	sx = math.matrix(sx);
	x  = math.matrix(x);
	y  = math.matrix(y);

	// calculate polynomial coefficients
	var c = math.flatten(math.multiply(math.inv(sx), math.multiply(x, y)))._data;
	// alternative
	//var c = math.multiply(math.multiply(math.inv(math.multiply(x, math.transpose(x))), x), y);

	// draw curve on graph
	curvePoints = [];

	for(var x=-10; x<11; x+=0.1) {

		var y=0;

		for(var p=0; p<order+1; ++p) {
			
			y += Math.pow(x, p) * c[p];
		}

		curvePoints.push(new Point(x, y))
	}

	// return polynomial function
	const poly = (x) => (c.reduce( (acc, cur, idx) => (acc + cur*Math.pow(x, idx))) );
	return poly;
}

function fourierSeries(maxFreq) {

	var c = new Array(maxFreq*2+1);

	for(var freq=-maxFreq; freq<=maxFreq; ++freq) {

		var integral = 0;

		for(var i=0; i<dataPoints.length-1; ++i) {

			var x_a = dataPoints[i].x;
			var y_a = dataPoints[i].y;
			var x_b = dataPoints[i+1].x;
			var y_b = dataPoints[i+1].y;

			var grad = (y_b-y_a)/(x_b-x_a);
			const line = (x) => (grad*(x-x_a) + y_a);

			var u = 0;

			if(freq != 0) {
				u = math.add(math.subtract(math.multiply(math.complex(0, line(x_b) / (2*freq*Math.PI)), math.exp(math.complex(0, -2*Math.PI*freq*x_b))), math.multiply(math.complex(0, line(x_a) / (2*freq*Math.PI)), math.exp(math.complex(0, -2*Math.PI*freq*x_a))) ), math.multiply(grad/(4*Math.PI*Math.PI*freq*freq), math.subtract(math.exp(math.complex(0, -2*Math.PI*freq*x_b)), math.exp(math.complex(0, -2*Math.PI*freq*x_a)))));
			}
			else {
				u = grad/2 * (x_b*x_b - x_a*x_a) + (y_a - grad*x_a) * (x_b - x_a);
			}
			integral = math.add(integral, u);
		}

		c[freq+maxFreq] = integral;
	}

	curvePoints = [];

	for(var x=-1; x<=2; x+=0.01) {

		var y = 0;

		for(var freq=-maxFreq; freq<=maxFreq; ++freq) {

			y += math.multiply(c[freq+maxFreq], math.exp(math.complex(0, 2*Math.PI*freq*x))).re;
		}

		curvePoints.push(new Point(x, y));
	}
}