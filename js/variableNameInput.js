// Oscar Saharoy 2021

const variableNameInput = document.getElementById( "variable-name-input" );
var variableName = "x";

variableNameInput.addEventListener( "input", handleNameInput );

function handleNameInput() {

    // when the variable name changes, update the global variable
    // variableName and update the model

    variableName = variableNameInput.value;
    updateModel();
}