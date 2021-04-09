// Oscar Saharoy 2021

// get the central div
const central = document.querySelector( ".central" );

// get the divider between the graph and UI
const dragHandle = document.querySelector( "#drag-handle" );
let dragHandleClicked = false;
let dragHandleX = 0;

const rem = parseInt( getComputedStyle(document.documentElement).fontSize );

// event listeners to enable dragging of the divider
dragHandle.addEventListener( "pointerdown",  e => dragHandleClicked = true  );
document.addEventListener(   "pointerup",    e => dragHandleClicked = false );
document.addEventListener(   "pointerleave", e => dragHandleClicked = false );
document.addEventListener(   "pointermove",  e => dragHandleX = e.clientX   );


function dragHandleLoop() {

    requestAnimationFrame( dragHandleLoop );

    // if we have stopped using the desktop media query reset the gridTemplateColumns
    if( !window.matchMedia('screen and (min-width:1200px)').matches && central.style.gridTemplateColumns ) 
        central.style.gridTemplateColumns = "";

    // only act if the dragHandle is being dragged
    if( !dragHandleClicked ) return;

    // calculate ui width from mouse position
    const uiWidth = Math.max( dragHandleX-10, 30*rem );

    // change the central div's column template - change amount of screen that is graph/UI
    central.style.gridTemplateColumns = `${uiWidth}px 2rem auto`;
}

dragHandleLoop();