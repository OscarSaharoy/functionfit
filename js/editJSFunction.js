// Oscar Saharoy 2021

// get the js code box and add the callback
const jsBox = document.getElementById( "code-js" );
jsBox.addEventListener( "input", handleJSCodeInput );

function unsetJSCodeError() {

    // unset the box's red border if there is one
    jsBox.style.boxShadow = "";
    jsBox.style.border    = "";
}

function handleJSCodeInput() {

    // get the user's function string
    const funcString = jsBox.value;

    // try to set the curve function to that
    try {

        let detectedVariableName;

        // if the user is using the current variable name then use that
        if( funcString.includes( variableName ) ) detectedVariableName = variableName;

        // otherwise detect the variable name being used in the function
        else detectedVariableName = funcString.match( /[a-zA-Z_$][a-zA-Z_$0-9]*/ )[0];

        // eval the function definition and put the result into evaluatedFunction
        const evaluatedFunction = eval( `${detectedVariableName} => ${funcString}` );

        // check if calling the function causes an error
        evaluatedFunction(0);

        // if its all good put the function into curveFunction
        curveFunction = evaluatedFunction;

        // worked so clear the error outline
        unsetJSCodeError();

    }
    catch( err ) {

        // console log the error
        console.log(err);

        // give the code box a red highlight to show the error
        jsBox.style.boxShadow = "0 0 0 2px #F84444";
        jsBox.style.border    = "3px solid #F84444";
        return;
    }
}