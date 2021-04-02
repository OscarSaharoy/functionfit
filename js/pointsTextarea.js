// Oscar Saharoy 2021

function updatePoints() {
    
    // get the string in the textarea, split it into vec2s and set datapoints to that

    // array of lines of the text that contain a digit character
    const lines  = pointsTextarea.value.split( /\r?\n/ ).filter( s => s.match( /\d/) );

    // split each line by the comma in the middle, parse each as a float,
    // correct NaNs to 0, and take only 2 numbers from each line
    let xyValues = lines.map( point => point.split(",")
                                            .map( parseFloat )
                                            .map( v => isNaN(v) ? 0 : v )
                                            .slice(0, 2) );

    // get rid of lines where only 1 number was found
    // and map float arrays to vectors
    dataPoints   = xyValues.filter( point => point.length == 2 )
                           .map( xy => new vec2(xy[0], xy[1]) );

    // update the model
    regressionFunction();
}

// get the points text area and add callbacks
const pointsTextarea = document.querySelector("#points-textarea");

const openTextarea  = () => { pointsTextarea.style.height   = "25rem";
                              pointsTextarea.style.minWidth = "11rem"; };

const closeTextarea = () => { pointsTextarea.style.height   = "100%" ;
                              pointsTextarea.style.minWidth = ""     ; };

pointsTextarea.addEventListener( "focusin" , openTextarea  );
pointsTextarea.addEventListener( "focusout", closeTextarea );
pointsTextarea.addEventListener( "input"   , updatePoints  );