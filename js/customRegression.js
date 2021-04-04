// Oscar Saharoy 2021

// function iteration variables
let beta = new Array(10).fill(1);
let customRegressionEnabled = false;

// some testing functions
const freakedExponential = (x, coeffs) => coeffs[0] * Math.pow(coeffs[1], Math.pow(x, coeffs[2])) + coeffs[3];
const sigmoid = (x, coeffs) => ( coeffs[0] / (coeffs[1] + coeffs[2] * coeffs[3] ** x) + coeffs[4] );

function customRegression(nbeta = 5, func = sigmoid) {

    requestAnimationFrame( () => customRegression() );

    if( !customRegressionEnabled ) return;

    let innerLoops = 0;

    for( let iteration = 0; iteration < 400 && innerLoops < 8000; ++iteration ) {

        // array containing sum of partial derivatives of error with respect to each parameter
        let dbeta = new Array(nbeta).fill(0);

        // loop over datapoints and find partial derivative of error from that point with respect to each parameter
        for(let i=0; i<dataPoints.length; ++i) {

            let xi = dataPoints[i].x;
            let yi = dataPoints[i].y;

            for(let j=0; j<nbeta; ++j) {

                // create parameter lists with 1 element perturbed for 2 sided gradient approximation
                // todo symbolic differentiation
                let betaplus  = beta.slice();
                let betaminus = beta.slice();
                betaplus[j]  += 1e-4;
                betaminus[j] -= 1e-4;

                // increment partial derivative
                dbeta[j] += (Math.pow(yi - func(xi, betaplus), 2) - Math.pow(yi - func(xi, betaminus), 2)) / 2e-4;

                ++innerLoops;
            }
        }

        // change the parameters proportional to their derivative
        for(let j=0; j<nbeta; ++j) {

            beta[j] -= 1e-4 * dbeta[j];
        }
    }

    // if any of the vars became NaN then change them back to 1
    beta = beta.map( x => isNaN(x) ? 1 : x );

    // set the curveFunction to the optimised function
    curveFunction = x => func(x, beta);
}

customRegression();