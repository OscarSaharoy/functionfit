// Oscar Saharoy 2021

class Slider {
    
    constructor( sliderId, pId = null, inputId = null ) {
        
        // get the slider and throw an error if it wasn't found
        this.slider = document.getElementById( sliderId );
        if( !this.slider ) throw `LogSlider instatiated with invalid slider id: "${sliderId}"`;
        
        // get the p and throw an error if it wasn't found
        this.p = pId ? document.getElementById( pId ) : null;
        if( pId && !this.p ) throw `LogSlider instatiated with invalid p id: "${pId}"`;
        
        // get the input and throw an error if it wasn't found
        this.input = inputId ? document.getElementById( inputId ) : null;
        if( inputId && !this.input ) throw `LogSlider instatiated with invalid input id: "${inputId}"`;
        
        // this.value can be accessed as the slider's value
        this.value = +this.slider.value;
        
        // connect the callback to be called when the slider is changed
        this.slider.addEventListener( "input", () => this.sliderChange() );

        // if there's an input connect it to its callback
        this.input?.addEventListener( "input", () => this.inputChange()  );
        
        // decimal places of the slider
        this.decimalPlaces = this.slider.step.split(".")[1]?.length || 0;

        // add an onchange callback that can be set by the user
        this.onchange = () => {};
    }

    sliderChange() {

        // get the value from the slider
        this.value = +this.slider.value;

        // put the value into the p or input if they were supplied
        if( this.p     ) this.p.innerHTML = this.value;
        if( this.input ) this.input.value = this.value;

        this.onchange();
    }

    inputChange() {

        // gethe value from the input
        this.value = +this.input.value;

        // put the value into the slider
        this.slider.value = this.value;

        this.onchange();
    }
}

class LogSlider extends Slider {
    
    constructor( sliderId, numberId = null) {
        
        super( sliderId, numberId );
        
        // cache the initial value of the slider
        const initialValue = this.value;
        
        // setup min and max values from the slider
        this.max = this.slider.max;
        this.min = this.slider.min;
        
        // add a method to get the slider's value adjusted for log
        this.getValue = () => Math.exp( this.slider.value );
        
        // make the slider step small as log space is much smaller than actual space
        this.slider.setAttribute( "step", "0.00001" );
        
        // map the slider to log space
        this.slider.max = Math.log(this.max);
        this.slider.min = Math.log(this.min);
   
        this.round = (x, n) => x > 1 ? Math.round(x) : +x.toPrecision(n);
        
        this.onSliderChange = () => {
            
            this.value = this.getValue();
            this.number.innerHTML = this.round( this.value, 2 );
        };
        
        // forces a value into the slider (self.value may not equal self.slider.value)
        this.forceValue = newValue => {
            
            this.slider.value = Math.log(newValue);
            this.value = newValue;
            this.number.innerHTML = this.round(newValue);
        };
        
        // map the initial slider value into log space
        this.slider.value = Math.log( initialValue );
    }
}