// Oscar Saharoy 2021

// points on the graph
let dataPoints = [new vec2(-2.0, -0.5), new vec2(-0.8, 0.2), new vec2(0, -0.3), new vec2(0.6, 0.5), new vec2(2.0, 1.5)];

// initial function values
let curveFunction  = x => NaN;
let pointFunction  = point => true;
let regressionFunction = () => {};

// get the sliders
const polynomialTerms     = new Slider( "polynomial-terms-slider", null, "polynomial-terms-number" );
const fourierTerms        = new Slider( "fourier-terms-slider"   , null, "fourier-terms-number"    );
const fourierStart        = new Slider( "fourier-start-slider"   , null, "fourier-start-number"    );
const fourierEnd          = new Slider( "fourier-end-slider"     , null, "fourier-end-number"      );
// const fourierSharpness    = new Slider( "fourier-sharp-slider"   , null, "fourier-sharp-number"    );

// link all to cause model update
polynomialTerms.onchange  = updateModel;
fourierTerms.onchange     = updateModel;
fourierStart.onchange     = updateModel;
fourierEnd.onchange       = updateModel;
// fourierSharpness.onchange = updateModel;


const regressionFunctions = [() => (linearRegression()),
                             () => (polynomialRegression( parseFloat(polynomialTerms.value) )),
                             () => (powerlawRegression()),
                             () => (bellcurveRegression()),
                             () => (exponentialRegression()),
                             () => (fourierSeries(parseFloat(fourierStart.value), parseFloat(fourierEnd.value), parseFloat(fourierTerms.value))),
                             () => {} ];

const equationLabels = Array.from( document.querySelectorAll( ".equation-label" ) );
const codeboxes      = Array.from( document.getElementsByClassName("codebox") ); 

const options        = Array.from( document.querySelectorAll( ".options" ) );
const optionsDict    = { "polynomial":     document.getElementById("polynomial-options"   ),
                         "fourier series": document.getElementById("fourierseries-options"),
                         "custom":         document.getElementById("custom-options"       ) }

const nonJsOptions   = Array.from( document.querySelectorAll( ".codes *" ) ).slice(3);                       

const functionDropdown = new DropDown("function-dropdown");
functionDropdown.onchange = equationSelect;

function equationSelect( idx ) {
    
    // show equation for current fit
    equationLabels.forEach( (elm, i) => elm.style.display = i==idx ? "grid" : "none" );

    // set only the currently applicable options to show
    options.forEach( elm => elm.style.display = "none" );
    if( optionsDict[ functionDropdown.value ] )
        optionsDict[ functionDropdown.value ].style.display = "grid";

    // set regression mode and update regression model
    regressionFunction = regressionFunctions[ idx ];
    updateModel();

    // handle the custom regression case
    customRegressionEnabled = functionDropdown.value == "custom";

    // if we are usiung custom regression we only want to show the JS box
    nonJsOptions.forEach( elm => elm.style.display = customRegressionEnabled ? "none" : "grid" );
}

function updateModel() {

    // fill the points textarea with the positions of the points
    pointsTextarea.value = dataPoints.reduce(
        (text, vec) => text + `${vec.x.toPrecision(3)}, ${vec.y.toPrecision(3)}\n`, "" );

    // run the regression function
    regressionFunction();

    // in case the JS code box has an error clear it
    unsetErrorBorder( jsBox );
}

equationSelect(0);
