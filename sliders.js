
class Slider {
    
    constructor( sliderId, numberId = null) {
        
        // get the slider and throw an error if it wasn't found
        this.slider = document.getElementById( sliderId );
        if( !this.slider ) throw `LogSlider instatiated with invalid slider id: "${sliderId}"`;
        
        // get the number and throw an error if it wasn't found
        this.number = numberId ? document.getElementById( numberId ) : null;
        if( numberId && !this.number ) throw `LogSlider instatiated with invalid number id: "${numberId}"`;
        
        // add a method to get the slider's value
        this.getValue = () => +this.slider.value;
        this.value = 0;
        
        this.onSliderChange = () => this.value = this.number.innerHTML = this.getValue();
        this.onSliderChange();
        
        // connect the callback to be called when the slider is changed
        this.slider.addEventListener( "input", () => this.onSliderChange() );
        
        // map this.addEventListener onto the slider
        this.addEventListener = (...args) => this.slider.addEventListener(...args);
        
        // decimal places of the slider
        this.decimalPlaces = this.slider.step.split(".")[1]?.length || 0;
        
        // forces a value into the slider (self.value may not equal self.slider.value)
        this.forceValue = newValue => {
            
            this.slider.value = newValue;
            this.value = newValue;
            this.number.innerHTML = +newValue.toFixed(this.decimalPlaces);
        };
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