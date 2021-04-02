// Oscar Saharoy 2021

const sum = (arr, f = x => x ) => arr.reduce( (acc, v) => acc + f(v), 0 ); 
const sf3 = x => x.toPrecision(3);

function linearRegression() {

    // y = ax+b

    // find a and b to minimise square residuals of dataset
    const sx  = sum( dataPoints, p => p.x       );
    const sx2 = sum( dataPoints, p => p.x ** 2  );
    const sy  = sum( dataPoints, p => p.y       );
    const sxy = sum( dataPoints, p => p.x * p.y );
    
    const N = dataPoints.length;
    const a = (sxy/sx - sy/N) / (sx2/sx - sx/N);
    const b = sxy/sx - a*sx2/sx;

    // set curve function and point function
    curveFunction = x => a*x + b;
    pointFunction = p => true;

    // set equation display and code boxes
    codeString = `${ sf3(a) } * ${ variableName } + ${ sf3(b) }`.replace("+ -", "- ");

    codeboxes.forEach( box => box.value = codeString );
}

function powerlawRegression() {

    // y = px^b

    // filter datapoints - only x>0 and y>0 allowed
    const powerlawPoints = dataPoints.filter( p => p.x > 0 && p.y > 0 );

    // find a and b to minimise square residuals of dataset
    const slnx    = sum( powerlawPoints, p => Math.log(p.x)                 );
    const slnx2   = sum( powerlawPoints, p => Math.log(p.x) ** 2            );
    const slny    = sum( powerlawPoints, p => Math.log(p.y)                 );
    const slnxlny = sum( powerlawPoints, p => Math.log(p.x) * Math.log(p.y) );
    const N       = powerlawPoints.length;

    const b = ( slnxlny/slnx - slny/N ) / ( slnx2/slnx - slnx/N );
    const a = Math.exp( slnxlny/slnx - b*slnx2/slnx );

    // set curve function and point function
    curveFunction = x => a * x ** b;
    pointFunction = p => p.x > 0 && p.y > 0;

    // get stringw which contain the code for the function
    const codeString1 = `${sf3(a)} * ${ variableName } ** ${ sf3(b) }`;
    const codeString2 = `${sf3(a)} * pow( ${ variableName }, ${ sf3(b) } )`;

    // set code boxes
    codeboxes[0].value = codeString1;
    codeboxes[1].value = codeString2;
    codeboxes[2].value = codeString2.replace( "pow", "Math.Pow" );
    codeboxes[3].value = codeString1;
    codeboxes[4].value = codeString2;
}

function exponentialRegression() {

    // y = ab^x

    // get points above 0
    let exponentialPoints = dataPoints.filter( p => p.y > 0 );

    // find a and b to minimise square residuals of dataset
    const sx    = sum( exponentialPoints, p => p.x                 );
    const sx2   = sum( exponentialPoints, p => p.x ** 2            );
    const slny  = sum( exponentialPoints, p => Math.log(p.y)       );
    const sxlny = sum( exponentialPoints, p => p.x * Math.log(p.y) );
    const N     = exponentialPoints.length;

    // calculate a and b
    const b = Math.exp( (slny - N*sxlny/sx) / (sx - N*sx2/sx) );
    const a = Math.exp( slny/N - Math.log(b)*sx/N );

    // set curve function & point function
    curveFunction = x => a * b ** x;
    pointFunction = p => p.y > 0;

    // set equation display and code boxes
    const codeString1 = `${ sf3(a) } * ${ sf3(b) } ** ${ variableName }`;
    const codeString2 = `${ sf3(a) } * pow( ${ sf3(b) }, ${ variableName } )`;

    codeboxes[0].value = codeString1;
    codeboxes[1].value = codeString2;
    codeboxes[2].value = codeString2.replace( "pow", "Math.Pow" );
    codeboxes[3].value = codeString1;
    codeboxes[4].value = codeString2;
}

function bellcurveRegression() {

    // y = ab^-(x^2)

    // get points above 0
    let bellcurvePoints = dataPoints.filter( p => p.y > 0 );

    // find a and b to minimise square residuals of dataset
    const sx2    = sum( bellcurvePoints, p => p.x ** 2                );
    const sx4    = sum( bellcurvePoints, p => p.x ** 4                );
    const slny   = sum( bellcurvePoints, p => Math.log(p.y)           );
    const sx2lny = sum( bellcurvePoints, p => p.x **2 * Math.log(p.y) );
    const N      = bellcurvePoints.length;

    const lnb = (sx2lny - slny*sx2/N) / (sx2*sx2/N - sx4);
    const lna = slny/N + sx2*lnb/N;
    const a   = Math.exp(lna);
    const b   = Math.exp(lnb);

    // set curve function & point function
    curveFunction = x => a * b ** -(x*x);
    pointFunction = p => p.y > 0;

    // get strings to put into the codeboxes
    const codeString1 = `${ sf3(a) } * ${ sf3(b) } ** -(${ variableName }*${ variableName })`;
    const codeString2 = `${ sf3(a) } * pow( ${ sf3(b) }, -(${ variableName }*${ variableName }) )`;

    codeboxes[0].value = codeString1;
    codeboxes[1].value = codeString2;
    codeboxes[2].value = codeString2.replace( "pow", "Math.Pow" );
    codeboxes[3].value = codeString1;
    codeboxes[4].value = codeString2;
}

function polynomialRegression(order) {

    // y = c[0] + c[1]x + c[2]x^2 + c[3]x^3 ...

    // initialise variables and matrices
    let n = dataPoints.length;

    let x  = new Matrix(order+1, n);
    let y  = new Matrix(n, 1);

    // populate matrices

    // loop over first row in x to fill it
    for(let i=0; i<order+1; ++i) {

        // loop over dataPoints to set each value in x and y
        for(let p=0; p<dataPoints.length; ++p) {

            let xiToPower = Math.pow(dataPoints[p].x, i);

            x.set(i, p, xiToPower);
            y.set(p, 0, dataPoints[p].y);
        }
    }

    // calculate polynomial coefficients
    let c = matMul(matMul( (matMul( x, x.T() )).inv() , x), y).data;

    // set curve function and point function
    curveFunction = x => c.reduce( (acc, cur, idx) => ( acc + cur*Math.pow(x, idx) ) );
    pointFunction = p => true;

    // set equation display and code boxes
    //⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹
    let powers = ["", "x", "x²", "x³", "x⁴", "x⁵", "x⁶", "x⁷", "x⁸", "x⁹"];
    mathText = c.reduce( (acc, cur, idx) => (acc + (acc=="" ? "y = " : " + ") + cur.toPrecision(3)+powers[idx] ), "" ).replace("+ -", "- ");

    // arrays to help format code
    let powersccpp = ["", "*x", "*x*x", "*pow(x,3)", "*pow(x,4)", "*pow(x,5)", "*pow(x,6)", "*pow(x,7)", "*pow(x,8)", "*pow(x,9)"].map( s => s.replaceAll( "x", variableName) );
    let powerscsh  = ["", "*x", "*x*x", "*Math.Pow(x,3)", "*Math.Pow(x,4)", "*Math.Pow(x,5)", "*Math.Pow(x,6)", "*Math.Pow(x,7)", "*Math.Pow(x,8)", "*Math.Pow(x,9)"].map( s => s.replaceAll( "x", variableName) );
    let powerspy   = ["", "*x", "*x*x", "*x**3", "*x**4", "*x**5", "*x**6", "*x**7", "*x**8", "*x**9"].map( s => s.replaceAll( "x", variableName) );

    // code output function
    outputCode = (c_arr, powerslang) => (c_arr.reduce( (acc, cur, idx) => (acc + (acc=="" ? "" : " + ") + cur.toPrecision(3)+powerslang[idx] ), "" ).replace("+ -", "- "));

    codeboxes[0].value = outputCode(c, powerspy  ).replace("+ -", "- ");
    codeboxes[1].value = outputCode(c, powersccpp).replace("+ -", "- ");
    codeboxes[2].value = outputCode(c, powerscsh ).replace("+ -", "- ");
    codeboxes[3].value = outputCode(c, powerspy  ).replace("+ -", "- ");
    codeboxes[4].value = outputCode(c, powersccpp).replace("+ -", "- ");
}


function fourierSeries(startX, endX, maxFreq) {

    // period is the length of 1 Complexete cycle
    let period = endX - startX;

    // get sorted list of points within the target period
    let fourierPoints = dataPoints.filter( (point) => (point.x >= startX && point.x <= startX+period) );
    fourierPoints.sort( (a,b) => (a.x < b.x ? -1 : 1) );

    // add extra point onto the end of the sequence to make function loop smoothly
    fourierPoints.push(new vec2(fourierPoints[0].x+period, fourierPoints[0].y));

    // array of fourier coefficients
    let c = new Array(maxFreq*2+1);

    // loop over frequency components
    for(let freq=-maxFreq; freq<=maxFreq; ++freq) {

        // calulate fourier coefficient as value of integral
        let integral = new Complex(0, 0);

        for(let i=0; i<fourierPoints.length-1; ++i) {

            // setup some variables
            let x_a = fourierPoints[i].x;
            let y_a = fourierPoints[i].y;
            let x_b = fourierPoints[i+1].x;
            let y_b = fourierPoints[i+1].y;

            // line is the interpolation function between the 2 points
            let grad = (y_b-y_a)/(x_b-x_a);
            const line = (x) => (grad*(x-x_a) + y_a);

            let u = 0;

            // increment value of integral
            if(freq != 0) {

                let freq2pi = 2*freq*Math.PI/period;

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

    // set curve function & point funtion
    const fourierFunction = (x) => (c.reduce( (acc, cur, idx) => ( acc + comMul(cur, comExp(2*Math.PI*(idx-maxFreq)*x/period)).re ), 0 )/period );
    curveFunction = fourierFunction;
    pointFunction = (point) => (point.x >= startX && point.x <= startX+period);

    // get positive frequencies
    cpos = c.slice(maxFreq);

    // variables to help format code
    let cosccpp = " * cos(M_PI*";
    let coscsh  = " * Math.Cos(Math.PI*";
    let cosjs   = " * Math.cos(Math.PI*";
    let cospy   = " * math.cos(math.pi*";
    let coshlsl = " * cos(pi*";

    // code ouput function
    outputCode = (c_arr, coslang) => (c_arr.reduce( (acc, cur, idx) => (acc + (acc=="" ? (cur.mod()/period).toPrecision(3) : " + "+(cur.mod()*2/period).toPrecision(3)) + (acc=="" ? "" : coslang+(2*idx/period).toPrecision(3)+"*x + "+cur.arg().toPrecision(3)+")") ), "" ));

    codeboxes[0].value = outputCode(cpos, cosjs  ).replaceAll("x", variableName).replaceAll("+ -", "- ");
    codeboxes[1].value = outputCode(cpos, cosccpp).replaceAll("x", variableName).replaceAll("+ -", "- ");
    codeboxes[2].value = outputCode(cpos, coscsh ).replaceAll("x", variableName).replaceAll("+ -", "- ");
    codeboxes[3].value = outputCode(cpos, cospy  ).replaceAll("x", variableName).replaceAll("+ -", "- ");
    codeboxes[4].value = outputCode(cpos, coshlsl).replaceAll("x", variableName).replaceAll("+ -", "- ");
}


// function iteration variables
let beta  = new Array(10).fill(1);
const freakedExponential = (x, coeffs) => (coeffs[0]*Math.pow(coeffs[1], Math.pow(x, coeffs[2])) + coeffs[3]);
const sigmoid = (x, coeffs) => ( coeffs[0] / (coeffs[1] + coeffs[2] * Math.pow(coeffs[3], x)) + coeffs[4] );

function functionIteration(nbeta = 4, func = freakedExponential) {

    // check for nans in parameters
    for(let i=0; i<nbeta; ++i) {

        beta[i] = isNaN(beta[i]) ? 1 : beta[i];
    }

    for(let iteration=0; iteration<1000; ++iteration) {

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
            }
        }

        // change the parameters proportional to their derivative
        for(let j=0; j<nbeta; ++j) {

            beta[j] -= 0.001*dbeta[j];
        }
    }

    const iteratedFunction = (x) => (func(x, beta));
    return [iteratedFunction, (point) => (true)];
}