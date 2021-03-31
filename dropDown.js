// Oscar Saharoy 2021

class DropDown {

    constructor( dropdownId, initial=0 ) {

        // get all the elements (this.entries is an array containing all the entries)
        this.outerDiv = document.querySelector( `#${dropdownId}` );
        this.innerDiv = document.querySelector( `#${dropdownId} .inner` );
        this.entries  = Array.from( document.querySelectorAll( `#${dropdownId} p` ) );

        // state for the DropDown - the selected element is stored in this.selected
        // and this.open is true when the dropdown is open
        this.selected    = this.entries[initial];
        this.isOpen      = true;
        this.ignoreFocus = false;

        // close the menu to start with - hide all but selected element
        this.close();

        // add event listeners
        this.outerDiv.addEventListener( "pointerdown", event => this.pointerdown(event)  );
        this.outerDiv.addEventListener( "focusout",    event => this.focusout(event)     );
        this.outerDiv.addEventListener( "focusin",     event => this.focusin(event)      );

        this.entries.forEach( elm => elm.addEventListener( "pointerdown", () => this.clickEntry( event, elm ) ) );
        this.entries.forEach( elm => elm.addEventListener( "keydown",  event => this.keydown(    event, elm ) ) );

        // pipe addEventListener through to the outer div
        this.addEventListener = (...args) => this.outerDiv.addEventListener(...args);

        // also have an onchange event which can be assigned a function
        this.onchange = idx => {};
    }

    close() {

        // menu is now closed
        this.isOpen = false;

        // hide all elements that aren't this.selected
        this.entries.forEach( elm => elm.className = elm == this.selected ? "" : "hidden" );
    }

    open() {

        // menu is now open
        this.isOpen = true;

        // make all elements visible
        this.entries.forEach( elm => elm.className = "" );
    }

    ignoreFocusWhileClosing() {

        // set ignoreFocus to true and set it back to false after the time it takes
        // to close the dropdown
        this.ignoreFocus = true;
        setTimeout( () => this.ignoreFocus = false, 220 )
    }

    focusin( event ) {

        // when one of the p elements inside gets focused, open the dropdown
        // unless this.ignoreFocus is true then do nothing
        if( !this.ignoreFocus ) this.open();
    }


    focusout( event ) {

        // when one of the p elements inside loses focus, close the dropdown
        // unless this.ignoreFocus is true then do nothing
        if( !this.ignoreFocus ) this.close();
    }

    pointerdown( event ) {

        // if the menu is closed open it or if it is open close it 
        if( this.isOpen ) {

            this.close();

            // need to ignore focus events while the menu is closing or it will re open
            this.ignoreFocusWhileClosing();
        }

        else this.open();
    }

    keydown( event, elm = null ) {

        // detec space or enter keypress
        if( event.key == " " || event.key == "Enter" ) {

            // avoid browser scrolling down on space
            event.preventDefault();

            // select the focused element and close the dropdown
            this.selected = elm;
            this.close();

            // call the onchange function
            this.onchange( this.index )
        }
    }

    clickEntry( event, elm = null ) {

        if( !this.isOpen ) return;

        // when one of the entries is clicked, make it the selected one
        this.selected = elm;

        // call the onchange function
        this.onchange( this.index )
    }

    get value() {

        return this.selected.innerHTML;
    }

    get index() {

        return this.entries.indexOf( this.selected );
    }

    set index( value ) {

        // set this.selected by the values provided
        this.selected = this.entries[value];

        // hide all elements that aren't this.selected
        this.entries.forEach( elm => elm.className = elm == this.selected ? "" : "hidden" );
    }
}
