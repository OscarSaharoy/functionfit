// Oscar Saharoy 2020

class Complex {
	constructor(re, im) {

		this.re = re;
		this.im = im;
	}

	arg() {

		return Math.atan2(this.im, this.re);
	}

	mod() {

		return Math.sqrt(this.re*this.re + this.im*this.im);
	}
}

function comExp(x) {

	// e^(ix)
	return new Complex(Math.cos(x), Math.sin(x));
}

function comAdd(z1, z2) {

	// z1+z2
	return new Complex(z1.re+z2.re, z1.im+z2.im);
}

function comSub(z1, z2) {

	// z1-z2
	return new Complex(z1.re-z2.re, z1.im-z2.im);
}

function comMul(z1, z2) {

	// z1*z2
	return new Complex(z1.re*z2.re-z1.im*z2.im, z1.re*z2.im+z1.im*z2.re);
}

function comDiv(z1, z2) {

	// z1/z2
	var denominator = z2.re*z2.re + z2.im*z2.im;
	return new Complex((z1.re*z2.re+z1.im*z2.im)/denominator, (z1.im*z2.im-z1.re*z2.re)/denominator);
}

function comScale(z1, s) {

	// z1*s
	return new Complex(z1.re*s, z1.im*s);
}


class Matrix {
	constructor(rows, cols) {

		this.r = rows;
		this.c = cols;
		this.l = rows*cols;
		this.data = new Array(rows*cols).fill(0);
	}

	index(row, col) {

		return row*this.c + col;
	}

	set(row, col, value) {

		this.data[row*this.c + col] = value;
	}

	get(row, col) {

		return this.data[row*this.c + col];
	}

	T() {

		// returns transpose as new matrix

		// create new array to fill with transposed elements
		var temp = new Matrix(this.c, this.r);

		// set indices
		var i=0;
		var j=0;

		for(var t=0; t<this.l; ++t) {

			// set element in temp matrix
			temp.data[t] = this.data[j*this.c + i];

			// update indices
			++j;

			if(j==temp.c) {

				++i;
				j = 0;
			}
		}

		return temp;
	}

	det() {

		// find the determinant of matrix - must be square

		// temporary variable to store output
		var temp = 0;

		// if its a 2x2 matrix, return the determinant directly
		if(this.r == 2 && this.c == 2) {

			return this.data[0] * this.data[3] - this.data[1] * this.data[2];
		}

		// loop over first row, recursively calling det on the minors
		for(var t=0; t<this.c; ++t) {

			temp += (-t%2 * 2 + 1) * this.data[t] * (this.minor(0, t)).det();
		}

		return temp;
	}

	inv() {

		// invert matrix - square matrices only
		var temp = new Matrix(this.r, this.c);
		var transpose = this.T();
		var determinant = this.det();

		// if its a 2x2 matrix return the inverse
		if(this.r == 2 && this.c == 2) {

			temp.data[0] =   1/determinant * this.data[3];
			temp.data[1] = - 1/determinant * this.data[1];
			temp.data[2] = - 1/determinant * this.data[2];
			temp.data[3] =   1/determinant * this.data[0];

			return temp;
		}

		for(var t=0; t<this.l; ++t) {

			temp.data[t] = ( (t + (this.c%2==0 ? Math.floor(t/this.c) : 0))%2 * -2 + 1 )/determinant * transpose.minor(Math.floor(t/this.c)%this.r, t%this.c).det();
		}

		return temp;
	}

	minor(r1, c1) {

		// temporary matrix to store result
		var temp = new Matrix(this.r-1, this.c-1);

		// index of current element in the minor matrix
		var im = 0;

		// iterate over elements of temp matrix
		for(var t=0; t<temp.l; ++t, ++im) {

			// skip if im is inside the crossed out row/column
			while(im%this.c == c1 || Math.floor(im/this.c)%this.r == r1) {

				++im;
			}

			temp.data[t] = this.data[im];
		}

		return temp;
	}
}

function matMul(M1, M2) {

	// multiply 2 matrices and return new matrix

	// initialise result matrix
	var temp = new Matrix(M1.r, M2.c);

	// indices of entry in result matrix
	var i = 0;
	var j = 0;

	for(var t=0; t<temp.l; ++t) {

		// sum for entry in result matrix
		var sum = 0;

		// calculate entry
		for(var k=0; k<M2.r; k++) {

			sum += M1.data[i*M1.c + k] * M2.data[k*M2.c + j];
		}

		// assign entry to value of sum
		temp.data[t] = sum;

		// update indices
		++j;

		if(j==temp.c) {

			++i;
			j = 0;
		}
	}

	return temp;
}