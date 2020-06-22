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

function linearLeastSquares() {

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
}

function polynomialLeastSquares(order) {

	// initialise variables and matrices
	var n  = dataPoints.length;
	var c  = new Array(order+1);

	var sx = math.zeros([order+1, order+1]);
	var x  = math.ones([order+1, n]);
	var y  = math.matrix([n, 1]);

	// populate matrices
	for(var i=0; i<order*2+1; ++i) {

		// sum of datapoint.x raised to powers
		var powerSum = 0;

		for(var p=0; p<dataPoints.length; ++p) {

			if(i<order+1) {

				x._data[i][p] = Math.pow(dataPoints[p].x, i);
			}
		}
	}

	console.log(x);
}