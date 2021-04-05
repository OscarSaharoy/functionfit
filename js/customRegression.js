// Oscar Saharoy 2021

// initial values for customFunc and nVars
let customFunc = x => beta[0] / (beta[1] + beta[2] * beta[3] ** x) + beta[4];
let nVars = 5;

// function iteration variables
const varNames  = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j' ];
const varRegexs = varNames.map( c => new RegExp( `\\b${c}\\b`, "g" ) );
let beta        = Array(10).fill(1);
let customRegressionEnabled = false;


// get the formula textarea and add callback
const customOptions  = document.querySelector( "#custom-options"  );
const customTexterea = document.querySelector( "#custom-textarea" );
customTexterea.addEventListener( "input", customChange );


// make an array of all the variable sliders
const sliders = [];

// and an array of the divs that hold them
const sliderDivs = [];

// get the slider template
const sliderTemplate = document.querySelector( "#var-slider-template" );

// make a slider for each variable letter and add it into the dom
for( let c of varNames ) {

    // get the slider holder and the elements inside
    const sliderHolderDiv = sliderTemplate.cloneNode( true );
    const heading     = sliderHolderDiv.querySelector( "h4"          );
    const sliderInput = sliderHolderDiv.querySelector( ".var-slider" );
    const numberInput = sliderHolderDiv.querySelector( ".var-number" );

    // add the div into the DOM
    customOptions.appendChild( sliderHolderDiv );
    sliderDivs.push( sliderHolderDiv );

    // set the heading and IDs of elements
    heading.innerHTML = c;
    sliderInput.id    = `${c}-slider`;
    numberInput.id    = `${c}-number`;

    // make an infiniteRangeSlider and push it to the sliders array
    const slider      = new InfiniteRangeSlider( `${c}-slider`, null, `${c}-number` );
    sliders.push( slider );
}

// link each slider to change its variable
sliders.forEach( (elm, i) => elm.onchange = () => beta[i] = elm.value );

// get rid of the template slider holder
sliderTemplate.remove();


function customChange() {

    // handle a change to the custom function formula being used

    // get the user's function string
    let funcString = customTexterea.value;

    // try to set the curve function to that
    try {

        let detectedVariableName;

        // regex that matches if the current variableName is in the string
        const matchVariableName = new RegExp( `(^|\\W)${variableName}(\\W|$)`,"" );

        // if the user is using the current variableName then use that
        if( funcString.match( matchVariableName ) ) detectedVariableName = variableName;

        // otherwise try to detect the variable name being used in the function
        else detectedVariableName = funcString.match( /(?:[^\w.](?!\bMath\.\w+\b))(([l-zA-Z_$](?=$| |\W))|([a-zA-Z_$][a-zA-Z0-9_$]+))/ )[1];

        // loop over the single letters in the function string and replace them with elements of beta
        nVars = 0;
        for( let i = 0; i < varNames.length; ++i ) {

            const re = varRegexs[i];

            if( funcString.match( re ) ) {

                funcString = funcString.replaceAll( re, `beta[${nVars}]` );
                sliderDivs[i].style.display = "grid";
                sliderDivs[i].onchange = 

                ++nVars;
            }
        }

        // eval the function definition and put the result into evaluatedFunction
        const evaluatedFunction = eval( `${detectedVariableName} => ${funcString}` );

        // check if calling the function causes an error
        evaluatedFunction(0);

        // if its all good put the function into customFunc
        customFunc = evaluatedFunction;

        // worked so clear the error outline
        unsetErrorBorder( customTexterea );

        // show only the relavant sliders
        sliderDivs.forEach( (elm,i) => elm.style.display = customTexterea.value.match(varRegexs[i]) ? "grid" : "none" );
    }
    catch( err ) {

        // console log the error
        console.log(err);

        // give the code box a red highlight to show the error
        setErrorBorder( customTexterea );
    }
}


function customRegressionLoop() {

    // run this again next frame
    requestAnimationFrame( () => customRegressionLoop() );

    // only run when customRegressionEnabled is true and the user isn't typing in the JS box
    if( !customRegressionEnabled || inJSBox ) return;

    // only do 8000 inner loops to keep performance
    let innerLoops = 0;
    while( innerLoops < 8000 && nVars ) {

        // array containing sum of partial derivatives of error with respect to each parameter
        let dbeta = new Array(nVars).fill(0);

        // loop over datapoints and find partial derivative of error from that point with respect to each parameter
        for( let i = 0; i < dataPoints.length; ++i ) {

            let xi = dataPoints[i].x;
            let yi = dataPoints[i].y;

            for( let j = 0; j < nVars; ++j ) {

                // fill the right entry of dbeta using 2 sided difference approximation
                // todo automatic differentiation

                beta[j] += 1e-4;

                const forward = customFunc(xi);

                beta[j] -= 2e-4;

                const backward = customFunc(xi);

                beta[j] += 1e-4;

                // increment partial derivative
                dbeta[j] += ( (yi - forward) ** 2  - (yi - backward) ** 2 ) / 2e-4;

                ++innerLoops;
            }
        }

        // change the parameters proportional to their derivative
        dbeta.forEach( (d,i) => beta[i] -= 1e-4 * d );
    }

    // if any of the vars became NaN then change them back to a random number between 0 and 1
    beta = beta.map( x => isNaN(x) ? Math.random() : x );

    // set the curveFunction to the optimised function
    curveFunction = customFunc;
    pointFunction = () => true;

    // we cant make code for all languages, only JS
    codeboxes.forEach( elm => elm.value = "unavailable :(" );

    // get the function string from the customTextarea
    let funcString = customFunc.toString();

    // sub in the calculated values of the variables
    for( let i = 0; i < nVars; ++i )
        funcString = funcString.replaceAll( new RegExp( `beta\\[${i}\\]`, "g" ), beta[i].toPrecision(3) );

    // gets the string from the => onwards
    funcString = funcString.match( /(?:=> )(.*)/ )[1];

    // put that into the JS box after some formatting
    codeboxes[0].value = funcString.replaceAll( / *\+ *- */g, " - " ).replaceAll( / +/g, " " );

    // set the values of all the var sliders
    sliders.forEach( (elm, i) => elm.value = beta[i] );
}

customRegressionLoop();