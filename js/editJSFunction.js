// Oscar Saharoy 2021

// get the js code box and add the callback
const jsBox = document.getElementById( "code-js" );
jsBox.addEventListener( "input"   , handleJSCodeInput );
jsBox.addEventListener( "focusin" , () => customRegressionPaused = true  );
jsBox.addEventListener( "focusout", () => customRegressionPaused = false );

function setErrorBorder( box ) {

    // set the box's border to be red
    box.style.boxShadow = "0 0 0 2px #F84444";
    box.style.border    = "3px solid #F84444";
}

function unsetErrorBorder( box ) {

    // unset the box's red border if there is one
    box.style.boxShadow = "";
    box.style.border    = "";
}

function handleJSCodeInput() {

    // get the user's function string
    const funcString = jsBox.value;

    // try to set the curve function to that
    try {

        let detectedVariableName;

        // regex that matches if the current variableName is in the string
        const matchVariableName = new RegExp( `(^|\\W)${variableName}(\\W|$)`,"" );

        // if the user is using the current variableName then use that
        if( funcString.match( matchVariableName ) ) detectedVariableName = variableName;

        // otherwise detect the variable name being used in the function
        else detectedVariableName = funcString.match( /[a-zA-Z_$][a-zA-Z_$0-9]*/ )[0];

        // eval the function definition and put the result into evaluatedFunction
        const evaluatedFunction = eval( `${detectedVariableName} => ${funcString}` );

        // check if calling the function causes an error
        evaluatedFunction(0);

        // if its all good put the function into curveFunction
        curveFunction = evaluatedFunction;

        // worked so clear the error outline
        unsetErrorBorder( jsBox );

    }
    catch( err ) {

        // console log the error
        console.log(err);

        // give the code box a red highlight to show the error
        setErrorBorder( jsBox );

        return;
    }
}