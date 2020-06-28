// Oscar Saharoy 2020

// setup some variables
var polynomialTerms = document.getElementById("polynomial-terms");
var fourierTerms    = document.getElementById("fourier-terms");
var fourierStart    = document.getElementById("fourier-start");
var fourierEnd      = document.getElementById("fourier-end");

var buttons   = document.getElementsByClassName("equationButton");
var options   = document.getElementsByClassName("options");
var codeboxes = document.getElementsByClassName("codebox");
var mathspan  = document.getElementById("mathspan");

var regressionFunctions = [() => (linearRegression()),
						   () => (polynomialRegression(parseFloat(polynomialTerms.value))),
						   () => (powerlawRegression()),
						   () => (exponentialRegression()),
						   () => (fourierSeries(parseFloat(fourierStart.value), parseFloat(fourierEnd.value), parseFloat(fourierTerms.value)))];

function equationSelect(num) {

	// highlight clicked button
	for(var i=0; i<buttons.length; ++i) {

		buttons[i].style.background = i==num ? "#D7FEE0" : "transparent";
		options[i].style.display    = i==num ? "grid"   : "none";
	}

	// set regression mode and update regression model
	regressionFunction = regressionFunctions[num];
	regressionFunction();
}