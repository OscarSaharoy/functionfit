// Oscar Saharoy 2021

const functionDropdown = new DropDown("function-dropdown");
const graph = new Graph("graphjs");

function drawPoint(graph, colour, pos) {

    // setup ctx style
    graph.ctx.strokeStyle = colour;
    graph.ctx.lineWidth   = 3;
    graph.ctx.fillStyle   = "white";

    // draw circle at pos
    graph.ctx.beginPath();
    graph.ctx.arc( pos.x, pos.y, graph.rem/2, 0, 6.28 );
    graph.ctx.fill();
    graph.ctx.stroke();
}

function drawPoints( graph ) {
 
    // loop over and draw each point
    for(var point of dataPoints) {

        // use pointFunction to determine point colour
        var pointColour = pointFunction(point) ? "#8decd3" : "#bbbbbb";
        drawPoint( graph, pointColour, graph.graphToCanvas( point ) );
    }
}

function drawCurve(graph) {

    // get the visible range of x values on the graph
    const [minX, maxX] = graph.xRange;
    const width = maxX - minX;

    // set style for curve
    graph.ctx.strokeStyle = "#8decd3";
    graph.ctx.lineWidth   = 3;
    graph.ctx.beginPath();

    // loop over the range of x currently visible and plot the curve at 300 points
    for( var x = minX; x < maxX; x += width/300 ) {

        // get y coord at that value of x
        var canvasY = graph.graphToCanvasY( curveFunction(x) );

        // limit y coord so that stroke works properly
        canvasY = canvasY > graph.canvasSize.y+10 ? graph.canvasSize.y+10 : canvasY < -10 ? -10 : canvasY;

        graph.ctx.lineTo( graph.graphToCanvasX(x), canvasY );
    }

    graph.ctx.stroke();
}

// add our draw functions onto the standard graph ones
graph.userDrawFunctions.push( drawCurve, drawPoints );

// data variables
var dataPoints     = [new vec2(-2.0, -0.5), new vec2(-0.8, 0.2), new vec2(0, -0.3), new vec2(0.6, 0.5), new vec2(2.0, 1.5)];

// initial function values
var curveFunction  = x => NaN;
var pointFunction  = (point) => (true);
var regressionFunction = () => linearRegression();



// return the first point found close to mousePos
const areClose = (point1, point2) => vec2.sqrDist( graph.graphToCanvas(point1), graph.graphToCanvas(point2) ) < graph.rem*25
const getClosePoint = mousePos => dataPoints.reduce( (acc, val) => acc ? acc : areClose(mousePos, val) ? val : null, null );
var draggedPoint    = null;
var pointerHasMoved = false;

function mousemove() {

    // when the mouse moves over the graph, set the cursor to indicate the action

    // if we are close to a point, use the move cursor
    if( getClosePoint( graph.mousePos ) ) graph.canvas.style.cursor = "move";

    // if we are panning the graph, use the grab cursor
    else if( graph.activePointers.length == 1 ) graph.canvas.style.cursor = "grabbing";

    // otherwise the normal cursor
    else graph.canvas.style.cursor = "auto";
}

function pointerdown() {

    // if we don't only have one active pointer we don't want to be dragging a point
    if( graph.activePointers.length != 1 ) {

        // this setting of the variables prevents any of the points being adjusted
        closePoint           = null; 
        graph.preventPanning = false;
        pointerHasMoved      = true;

        return;
    }

    // try to get a close point
    draggedPoint = getClosePoint( graph.meanPointerOnGraph );

    // preventPanning will be true if draggedPoint isn't null
    graph.preventPanning = !!draggedPoint;

    // pointer has not yet moved
    pointerHasMoved = false;
}

function pointermove() {

    // only do something if there are active pointers on the graph
    if( !graph.activePointers.length ) return;

    // pointer has moved
    pointerHasMoved = true;

    if( draggedPoint ) {

        // if we are dragging a point then set it to be at the pointer's position
        draggedPoint.setv( graph.meanPointerOnGraph );
    
        // update the model
        regressionFunction();
    }
}

function pointerup() {

    // if the pointer has moved there's nothing we need to do
    if( pointerHasMoved ) return;

    // if we are dragging a point but haven't moved the cursor, delete that point
    if( draggedPoint )
        dataPoints = dataPoints.filter( point => point != draggedPoint );

    // if we aren't dragging a point but we havent moved the cursor, add a point there
    if( !draggedPoint )
        dataPoints.push( vec2.clone( graph.meanPointerOnGraph ) );    

    // update the model
    regressionFunction();
}

graph.addEventListener( "mousemove"  , mousemove   );
graph.addEventListener( "pointerdown", pointerdown );
graph.addEventListener( "pointermove", pointermove );
graph.addEventListener( "pointerup"  , pointerup   );


// ---------- end functionfit code ----------


// ---------- regression code ----------


// setup some variables
var polynomialTerms = document.getElementById("polynomial-terms");
var fourierTerms    = document.getElementById("fourier-terms");
var fourierStart    = document.getElementById("fourier-start");
var fourierEnd      = document.getElementById("fourier-end");

var buttons   = document.querySelectorAll("ol button");
var options   = document.getElementsByClassName("options");
var codeboxes = document.getElementsByClassName("codebox");
var mathspan  = document.getElementById("mathspan");

var regressionFunctions = [() => (linearRegression()),
                           () => (polynomialRegression(parseFloat(polynomialTerms.value))),
                           () => (powerlawRegression()),
                           () => (bellcurveRegression()),
                           () => (exponentialRegression()),
                           () => (fourierSeries(parseFloat(fourierStart.value), parseFloat(fourierEnd.value), parseFloat(fourierTerms.value)))];

functionDropdown.onchange = equationSelect;

function equationSelect( num ) {
    
    // highlight clicked button
    for(var i=0; i<buttons.length; ++i) {

        buttons[i].className     = i==num ? "buttonActive" : "";
        options[i].style.display = i==num ? "grid"   : "none";
    }

    // set regression mode and update regression model
    regressionFunction = regressionFunctions[num];
    regressionFunction();
}

function linearRegression() {

    // y = mx+c

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

    // set curve function and point function
    const lineFunction = (x) => (m*x + c);
    curveFunction = lineFunction;
    pointFunction = (point) => (true);

    // set equation display and code boxes
    mathText = "y = "+m.toFixed(3)+"x + "+c.toFixed(3);

    codeboxes[0].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[1].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[2].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[3].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
    codeboxes[4].value = (m.toFixed(3)+"*x + "+c.toFixed(3)).replace("+ -", "- ");
}

function polynomialRegression(order) {

    // y = c[0] + c[1]x + c[2]x^2 + c[3]x^3 ...

    // initialise variables and matrices
    var n = dataPoints.length;

    var x  = new Matrix(order+1, n);
    var y  = new Matrix(n, 1);

    // populate matrices

    // loop over first row in x to fill it
    for(var i=0; i<order+1; ++i) {

        // loop over dataPoints to set each value in x and y
        for(var p=0; p<dataPoints.length; ++p) {

            var xiToPower = Math.pow(dataPoints[p].x, i);

            x.set(i, p, xiToPower);
            y.set(p, 0, dataPoints[p].y);
        }
    }

    // calculate polynomial coefficients
    var c = matMul(matMul( (matMul( x, x.T() )).inv() , x), y).data;

    // set curve function and point function
    const polynomialFunction = (x) => (c.reduce( (acc, cur, idx) => (acc + cur*Math.pow(x, idx))) );
    curveFunction = polynomialFunction;
    pointFunction = (point) => (true);

    // set equation display and code boxes
    //⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹
    var powers = ["", "x", "x²", "x³", "x⁴", "x⁵", "x⁶", "x⁷", "x⁸", "x⁹"];
    mathText = c.reduce( (acc, cur, idx) => (acc + (acc=="" ? "y = " : " + ") + cur.toFixed(3)+powers[idx] ), "" ).replace("+ -", "- ");

    // arrays to help format code
    var powersccpp = ["", "*x", "*x*x", "*pow(x,3)", "*pow(x,4)", "*pow(x,5)", "*pow(x,6)", "*pow(x,7)", "*pow(x,8)", "*pow(x,9)"];
    var powerscsh  = ["", "*x", "*x*x", "*Math.Pow(x,3)", "*Math.Pow(x,4)", "*Math.Pow(x,5)", "*Math.Pow(x,6)", "*Math.Pow(x,7)", "*Math.Pow(x,8)", "*Math.Pow(x,9)"];
    var powersjs   = ["", "*x", "*x*x", "*Math.pow(x,3)", "*Math.pow(x,4)", "*Math.pow(x,5)", "*Math.pow(x,6)", "*Math.pow(x,7)", "*Math.pow(x,8)", "*Math.pow(x,9)"];
    var powerspy   = ["", "*x", "*x*x", "*x**3", "*x**4", "*x**5", "*x**6", "*x**7", "*x**8", "*x**9"];

    // code output function
    outputCode = (c_arr, powerslang) => (c_arr.reduce( (acc, cur, idx) => (acc + (acc=="" ? "" : " + ") + cur.toFixed(3)+powerslang[idx] ), "" ).replace("+ -", "- "));

    codeboxes[0].value = outputCode(c, powersjs  ).replace("+ -", "- ");
    codeboxes[1].value = outputCode(c, powersccpp).replace("+ -", "- ");
    codeboxes[2].value = outputCode(c, powerscsh ).replace("+ -", "- ");
    codeboxes[3].value = outputCode(c, powerspy  ).replace("+ -", "- ");
    codeboxes[4].value = outputCode(c, powersccpp).replace("+ -", "- ");
}

function powerlawRegression() {

    // y = px^q

    // filter datapoints - only x>0 and y>0 allowed
    var powerlawPoints = dataPoints.filter((point) => (point.x > 0 && point.y > 0));

    // find p and q to minimise square residuals of dataset
    var slnx    = 0;
    var slnx2   = 0;
    var slny    = 0;
    var slnxlny = 0;
    var n       = powerlawPoints.length;

    // loop over each point in powerlawPoints
    for(var i=0; i<powerlawPoints.length; ++i) {

        // get data point
        point = powerlawPoints[i];

        // increment sums
        slnx    += Math.log(point.x);
        slnx2   += Math.log(point.x)*Math.log(point.x);
        slny    += Math.log(point.y);
        slnxlny += Math.log(point.x)*Math.log(point.y);
    }

    var q = (slnxlny/slnx - slny/n) / (slnx2/slnx - slnx/n);
    var p = Math.exp(slnxlny/slnx - q*slnx2/slnx);

    // set curve function and point function
    const powerlawFunction = (x) => (p*Math.pow(x, q));
    curveFunction = powerlawFunction;
    pointFunction = (point) => (point.x > 0 && point.y > 0);

    // set equation display and code boxes
    //mathText = "y = "+m.toFixed(3)+"x + "+c.toFixed(3);

    codeboxes[0].value = p.toFixed(3)+"*Math.pow(x, "+q.toFixed(3)+")";
    codeboxes[1].value = p.toFixed(3)+"*pow(x, "+q.toFixed(3)+")";
    codeboxes[2].value = p.toFixed(3)+"*Math.Pow(x, "+q.toFixed(3)+")";
    codeboxes[3].value = p.toFixed(3)+"*math.pow(x, "+q.toFixed(3)+")";
    codeboxes[4].value = p.toFixed(3)+"*pow(x, "+q.toFixed(3)+")";
}

function exponentialRegression() {

    // y = ab^x

    // get points above 0
    var exponentialPoints = dataPoints.filter( (point) => (point.y > 0) );

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

    // set curve function & point function
    const exponentialFunction = (x) => ( a*Math.pow(b, x) );
    curveFunction = exponentialFunction;
    pointFunction = (point) => (point.y > 0);

    // set equation display and code boxes
    mathText = "y = "+a.toFixed(3)+" × "+b.toFixed(3)+"^x";

    codeboxes[0].value = a.toFixed(3)+" * Math.pow("+b.toFixed(3)+", x)";
    codeboxes[1].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", x)";
    codeboxes[2].value = a.toFixed(3)+" * Math.Pow("+b.toFixed(3)+", x)";
    codeboxes[3].value = a.toFixed(3)+" * "+b.toFixed(3)+"**x";
    codeboxes[4].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", x)";
}

function bellcurveRegression() {

    // y = ab^-(x^2)

    // get points above 0
    var bellcurvePoints = dataPoints.filter( (point) => (point.y > 0) );

    // find a and b to minimise square residuals of dataset
    var sx2    = 0;
    var sx4    = 0;
    var slny   = 0;
    var sx2lny = 0;
    var n      = bellcurvePoints.length;

    // loop over each point in bellcurvePoints
    for(var P of bellcurvePoints) {

        var x2  = P.x*P.x;
        var lny = Math.log(P.y);

        sx2    += x2    ;
        sx4    += x2*x2 ;
        slny   += lny   ;
        sx2lny += x2*lny;
    }
    
    var lnb = (sx2lny - slny*sx2/n) / (sx2*sx2/n - sx4);
    var lna = slny/n + sx2*lnb/n;

    var a   = Math.exp(lna);
    var b   = Math.exp(lnb);

    // set curve function & point function
    const bellcurveFunction = (x) => ( a*Math.pow(b, -(x*x)) );
    curveFunction = bellcurveFunction;
    pointFunction = (point) => (point.y > 0);

    codeboxes[0].value = a.toFixed(3)+" * Math.pow("+b.toFixed(3)+", -x*x)";
    codeboxes[1].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", -x*x)";
    codeboxes[2].value = a.toFixed(3)+" * Math.Pow("+b.toFixed(3)+", -x*x)";
    codeboxes[3].value = a.toFixed(3)+" * "+b.toFixed(3)+"**(-x**2)";
    codeboxes[4].value = a.toFixed(3)+" * pow("+b.toFixed(3)+", -x*x)";
}

function fourierSeries(startX, endX, maxFreq) {

    // period is the length of 1 Complexete cycle
    var period = endX - startX;

    // get sorted list of points within the target period
    var fourierPoints = dataPoints.filter( (point) => (point.x >= startX && point.x <= startX+period) );
    fourierPoints.sort( (a,b) => (a.x < b.x ? -1 : 1) );

    // add extra point onto the end of the sequence to make function loop smoothly
    fourierPoints.push(new vec2(fourierPoints[0].x+period, fourierPoints[0].y));

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

    // set curve function & point funtion
    const fourierFunction = (x) => (c.reduce( (acc, cur, idx) => ( acc + comMul(cur, comExp(2*Math.PI*(idx-maxFreq)*x/period)).re ), 0 )/period );
    curveFunction = fourierFunction;
    pointFunction = (point) => (point.x >= startX && point.x <= startX+period);

    // get positive frequencies
    cpos = c.slice(maxFreq);

    // variables to help format code
    var cosccpp = " * cos(M_PI*";
    var coscsh  = " * Math.Cos(Math.PI*";
    var cosjs   = " * Math.cos(Math.PI*";
    var cospy   = " * math.cos(math.pi*";
    var coshlsl = " * cos(pi*";

    // code ouput function
    outputCode = (c_arr, coslang) => (c_arr.reduce( (acc, cur, idx) => (acc + (acc=="" ? (cur.mod()/period).toFixed(3) : " + "+(cur.mod()*2/period).toFixed(3)) + (acc=="" ? "" : coslang+(2*idx/period).toFixed(3)+"*x + "+cur.arg().toFixed(3)+")") ), "" ));

    codeboxes[0].value = curveFunction;///outputCode(cpos, cosjs).replace("+ -", "- ");
    codeboxes[1].value = outputCode(cpos, cosccpp).replace("+ -", "- ");
    codeboxes[2].value = outputCode(cpos, coscsh).replace("+ -", "- ");
    codeboxes[3].value = outputCode(cpos, cospy).replace("+ -", "- ");
    codeboxes[4].value = outputCode(cpos, coshlsl).replace("+ -", "- ");
}


// function iteration variables
var beta  = new Array(10).fill(1);
const freakedExponential = (x, coeffs) => (coeffs[0]*Math.pow(coeffs[1], Math.pow(x, coeffs[2])) + coeffs[3]);
const sigmoid = (x, coeffs) => ( coeffs[0] / (coeffs[1] + coeffs[2] * Math.pow(coeffs[3], x)) + coeffs[4] );

function functionIteration(nbeta = 4, func = freakedExponential) {

    // check for nans in parameters
    for(var i=0; i<nbeta; ++i) {

        beta[i] = isNaN(beta[i]) ? 1 : beta[i];
    }

    for(var iteration=0; iteration<1000; ++iteration) {

        // array containing sum of partial derivatives of error with respect to each parameter
        var dbeta = new Array(nbeta).fill(0);

        // loop over datapoints and find partial derivative of error from that point with respect to each parameter
        for(var i=0; i<dataPoints.length; ++i) {

            var xi = dataPoints[i].x;
            var yi = dataPoints[i].y;

            for(var j=0; j<nbeta; ++j) {

                // create parameter lists with 1 element perturbed for 2 sided gradient approximation
                // todo symbolic differentiation
                var betaplus  = beta.slice();
                var betaminus = beta.slice();
                betaplus[j]  += 1e-4;
                betaminus[j] -= 1e-4;

                // increment partial derivative
                dbeta[j] += (Math.pow(yi - func(xi, betaplus), 2) - Math.pow(yi - func(xi, betaminus), 2)) / 2e-4;
            }
        }

        // change the parameters proportional to their derivative
        for(var j=0; j<nbeta; ++j) {

            beta[j] -= 0.001*dbeta[j];
        }
    }

    const iteratedFunction = (x) => (func(x, beta));
    return [iteratedFunction, (point) => (true)];
}

regressionFunction();
