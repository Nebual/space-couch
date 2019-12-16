/*
    dson2.js, implementation of DSON from http://dogeon.org/
    2014-06-06
    THIS IS FORKED FROM Douglas Crockford's json2.js: https://github.com/douglascrockford/JSON-js
    It first tries toDSON functions, then tries toJSON functions (used for things such as dates)
    
    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
    
    [lots of comments removed from json2.js]
    
    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

function f(n) {
	// Format integers to have at least two digits.
	return n < 10 ? '0' + n : n;
}

function dsonEncodeNumber(n) {
	return String(n)
		.replace('e', 'very')
		.replace('E', 'VERY');
}

function dsonOctalEscape(s) {
	return '\\u' + ('000000' + s.charCodeAt(0).toString(8)).slice(-6);
}

function trimString(s) {
	return s.replace(/^\s+|\s+$/g, '');
}

if (typeof Date.prototype.toJSON !== 'function') {
	// @ts-ignore
	Date.prototype.toJSON = function() {
		return isFinite(this.valueOf())
			? this.getUTCFullYear() +
					'-' +
					f(this.getUTCMonth() + 1) +
					'-' +
					f(this.getUTCDate()) +
					'T' +
					f(this.getUTCHours()) +
					':' +
					f(this.getUTCMinutes()) +
					':' +
					f(this.getUTCSeconds()) +
					'Z'
			: null;
	};
	// @ts-ignore
	String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {
		return this.valueOf();
	};
}
// @ts-ignore
if (typeof Number.prototype.toDSON !== 'function') {
	// @ts-ignore
	Number.prototype.toDSON = function() {
		return dsonEncodeNumber(this.valueOf());
	};
}
// @ts-ignore
if (typeof Boolean.prototype.toDSON !== 'function') {
	// @ts-ignore
	Boolean.prototype.toDSON = function() {
		return this.valueOf() ? 'yes' : 'no';
	};
}

let escapable, gap, indent, meta, rep;

function quote(string) {
	// If the string contains no control characters, no quote characters, and no
	// backslash characters, then we can safely slap some quotes around it.
	// Otherwise we must also replace the offending characters with safe escape
	// sequences.

	escapable.lastIndex = 0;
	return escapable.test(string)
		? '"' +
				string.replace(escapable, function(a) {
					var c = meta[a];
					return typeof c === 'string' ? c : dsonOctalEscape(a);
				}) +
				'"'
		: '"' + string + '"';
}

function str(key, holder) {
	// Produce a string from holder[key].

	var i, // The loop counter.
		k, // The member key.
		v, // The member value.
		length,
		mind = gap,
		partial,
		value = holder[key];

	// If the value has a toDSON method, call it to obtain a replacement value.

	if (
		value &&
		typeof value === 'object' &&
		typeof value.toDSON === 'function'
	) {
		value = value.toDSON(key);
	}
	// If the value has a toJSON method, call it to obtain a replacement value.
	else if (
		value &&
		typeof value === 'object' &&
		typeof value.toJSON === 'function'
	) {
		value = value.toJSON(key);
	}

	// If we were called with a replacer function, then call the replacer to
	// obtain a replacement value.

	if (typeof rep === 'function') {
		value = rep.call(holder, key, value);
	}

	// What happens next depends on the value's type.

	switch (typeof value) {
		case 'string':
			return quote(value);

		case 'number':
			// DSON numbers must be finite. Encode non-finite numbers as null.

			return isFinite(value) ? dsonEncodeNumber(value) : 'empty';

		case 'boolean':
			return value ? 'yes' : 'no';

		// @ts-ignore
		case 'null':
		// Fall through to 'object'
		// Note: typeof null does not produce 'null'. The case is included here in
		// the remote chance that this gets fixed someday.

		// If the type is 'object', we might be dealing with an object or an array or
		// null.

		case 'object':
			// Due to a specification blunder in ECMAScript, typeof null is 'object',
			// so watch out for that case.

			if (!value) {
				return 'empty';
			}

			// Make an array to hold the partial results of stringifying this object value.

			gap += indent;
			partial = [];

			// Is the value an array?

			if (Object.prototype.toString.apply(value) === '[object Array]') {
				// The value is an array. Stringify every element. Use null as a placeholder
				// for non-DSON values.

				length = value.length;
				for (i = 0; i < length; i += 1) {
					partial[i] = str(i, value) || 'empty';
				}

				// Join all of the elements together, separated with commas, and wrap them in
				// brackets.

				v =
					partial.length === 0
						? 'so many'
						: gap
						? 'so\n' +
						  gap +
						  partial.join(' and\n' + gap) +
						  '\n' +
						  mind +
						  'many'
						: 'so ' + partial.join(' and ') + ' many';
				gap = mind;
				return v;
			}

			// If the replacer is an array, use it to select the members to be stringified.

			if (rep && typeof rep === 'object') {
				length = rep.length;
				for (i = 0; i < length; i += 1) {
					if (typeof rep[i] === 'string') {
						k = rep[i];
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + ' is ' + v);
						}
					}
				}
			} else {
				// Otherwise, iterate through all of the keys in the object.

				for (k in value) {
					if (Object.prototype.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + ' is ' + v);
						}
					}
				}
			}

			// Join all of the member texts together, separated with commas,
			// and wrap them in braces.

			v =
				partial.length === 0
					? 'such wow'
					: gap
					? 'such\n' +
					  gap +
					  partial.join(',\n' + gap) +
					  '\n' +
					  mind +
					  'wow'
					: 'such ' + partial.join(',') + ' wow';
			gap = mind;
			return v;
	}
}

// If the DSON object does not yet have a stringify method, give it one.

escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
meta = {
	// table of character substitutions
	'\b': '\\b',
	'\t': '\\t',
	'\n': '\\n',
	'\f': '\\f',
	'\r': '\\r',
	'"': '\\"',
	'\\': '\\\\',
};
const stringify = function(value, replacer, space) {
	// The stringify method takes a value and an optional replacer, and an optional
	// space parameter, and returns a DSON text. The replacer can be a function
	// that can replace values, or an array of strings that will select the keys.
	// A default replacer method can be provided. Use of the space parameter can
	// produce text that is more easily readable.

	var i;
	gap = '';
	indent = '';

	// If the space parameter is a number, make an indent string containing that
	// many spaces.

	if (typeof space === 'number') {
		for (i = 0; i < space; i += 1) {
			indent += ' ';
		}

		// If the space parameter is a string, it will be used as the indent string.
	} else if (typeof space === 'string') {
		indent = space;
	}

	// If there is a replacer, it must be a function or an array.
	// Otherwise, throw an error.

	rep = replacer;
	if (
		replacer &&
		typeof replacer !== 'function' &&
		(typeof replacer !== 'object' || typeof replacer.length !== 'number')
	) {
		throw new Error('DSON.stringify');
	}

	// Make a fake root object containing our value under the key of ''.
	// Return the result of stringifying the value.

	return str('', { '': value });
};

function DSONParser(dson) {
	// @ts-ignore
	this.dson = dson;
	// @ts-ignore
	this.index = 0;
}

DSONParser.prototype.remaining = function() {
	return this.dson.length - this.index;
};

DSONParser.prototype.beginsWith = function(target, advanceIndex) {
	var match =
		this.dson.substring(this.index, this.index + target.length) === target;
	if (match && advanceIndex) {
		this.index += target.length;
	}
	return match;
};

DSONParser.prototype.beginsWithAny = function(chars, advanceIndex) {
	var match = this.remaining() ? chars.indexOf(this.curChar()) >= 0 : false;
	if (match && advanceIndex) {
		this.index++;
	}
	return match;
};

DSONParser.prototype.curChar = function(advance) {
	var c = this.dson.substring(this.index, this.index + 1);
	if (advance) {
		this.index++;
	}
	return c;
};

DSONParser.prototype.skipWhitespace = function() {
	while (/\s/.test(this.curChar())) {
		this.index++;
	}
	return;
};

DSONParser.prototype.parse = function() {
	this.skipWhitespace();
	if (!this.remaining()) {
		throw new SyntaxError('DSON.parse: Unexpected end of input');
	}

	if (this.beginsWith('"')) {
		return this.parseString();
	}

	if (this.beginsWith('such')) {
		return this.parseObject();
	}

	if (this.beginsWith('so')) {
		return this.parseArray();
	}

	if (this.beginsWithAny('0123456789-')) {
		return this.parseNumber();
	}

	return this.parseKeyword();
};

DSONParser.prototype.parseObject = function() {
	this.skipWhitespace();
	if (!this.beginsWith('such', true)) {
		throw new SyntaxError('DSON.parse: Invalid start of object');
	}

	var o = {};
	var foundFirst = false;
	while (this.remaining()) {
		this.skipWhitespace();
		if (this.beginsWith('wow', true)) {
			return o;
		}

		if (foundFirst) {
			if (!this.beginsWithAny(',.!?', true)) {
				throw new SyntaxError('DSON.parse: Pair separator not found');
			}
			this.skipWhitespace();
		}

		var key = this.parseString();
		this.skipWhitespace();
		if (!this.beginsWith('is', true)) {
			throw new SyntaxError('DSON.parse: Key/value separator not found');
		}
		o[key] = this.parse();
		foundFirst = true;
	}
	throw new SyntaxError('DSON.parse: Unexpected end of object input');
};

DSONParser.prototype.parseArray = function() {
	this.skipWhitespace();
	if (!this.beginsWith('so', true)) {
		throw new SyntaxError('DSON.parse: Invalid start of array');
	}

	var o = [];
	var foundFirst = false;
	while (this.remaining()) {
		this.skipWhitespace();
		if (this.beginsWith('many', true)) {
			return o;
		}

		if (foundFirst) {
			if (
				!this.beginsWith('and', true) &&
				!this.beginsWith('also', true)
			) {
				throw new SyntaxError('DSON.parse: Array separator not found');
			}
			this.skipWhitespace();
		}
		// @ts-ignore
		o.push(this.parse());
		foundFirst = true;
	}
	throw new SyntaxError('DSON.parse: Unexpected end of array input');
};

DSONParser.prototype.parseString = function() {
	this.skipWhitespace();
	if (!this.beginsWith('"', true)) {
		throw new SyntaxError(
			'DSON.parse: Expected double-quote at start of string'
		);
	}

	var s = '';
	while (this.remaining()) {
		var c = this.curChar(true);
		if (c == '"') {
			return s;
		}
		if (c == '\\') {
			if (!this.remaining()) {
				throw new SyntaxError('DSON.parse: Unexpected end of string');
			}

			c = this.curChar(true);
			var ind = '"\\/bfnrt'.indexOf(c);
			if (ind >= 0) {
				s += '"\\/\b\f\n\r\t'.charAt(ind);
			} else if (c === 'u') {
				if (this.remaining() < 6) {
					throw new SyntaxError(
						'DSON.parse: Invalid unicode escape sequence in string'
					);
				}
				var u = 0;
				for (var i = 0; i < 6; i++) {
					ind = '01234567'.indexOf(this.curChar(true));
					if (ind < 0) {
						throw new SyntaxError(
							'DSON.parse: Invalid unicode escape sequence in string'
						);
					}
					u = u * 8 + ind;
				}

				if (u >= 65536) {
					throw new SyntaxError(
						'DSON.parse: Invalid unicode escape sequence in string (too large)'
					);
				}

				s += String.fromCharCode(u);
			} else {
				throw new SyntaxError(
					'DSON.parse: Invalid escape sequence in string'
				);
			}
		} else {
			s += c;
		}
	}
	throw new SyntaxError('DSON.parse: Unexpected end of string');
};

DSONParser.prototype.parseKeyword = function() {
	this.skipWhitespace();
	if (this.beginsWith('yes', true)) {
		return true;
	}
	if (this.beginsWith('no', true)) {
		return false;
	}
	if (this.beginsWith('empty', true)) {
		return null;
	}
	throw new SyntaxError('DSON.parse: Unknown keyword or literal');
};

DSONParser.prototype.parseNumber = function() {
	this.skipWhitespace();

	// Validate the number
	var startIndex = this.index;
	var veryIndex = -1;
	this.beginsWith('-', true);
	var beginsWithZero = this.beginsWith('0', true);
	if (!beginsWithZero) {
		this.skipDigits();
	}
	var hasDecimal = this.beginsWith('.', true);
	if (hasDecimal) {
		this.skipDigits();
	}

	if (this.beginsWith('very', true) || this.beginsWith('VERY', true)) {
		veryIndex = this.index - 4;
		this.beginsWithAny('+-', true);
		this.skipDigits();
	}

	var s = this.dson.substring(startIndex, this.index);
	if (hasDecimal || veryIndex > 0) {
		if (veryIndex > 0) {
			veryIndex -= startIndex;
			s = s.substring(0, veryIndex) + 'e' + s.substring(veryIndex + 4);
		}
		return parseFloat(s);
	}
	return parseInt(s);
};

DSONParser.prototype.skipDigits = function() {
	var hasDigits = false;
	while (this.beginsWithAny('0123456789', true)) {
		hasDigits = true;
	}
	if (!hasDigits) {
		throw new SyntaxError('DSON.parse: Invalid number');
	}
	return;
};

const parse = function(text, reviver?) {
	// The parse method takes a text and an optional reviver function, and returns
	// a JavaScript value if the text is a valid DSON text.

	function walk(holder, key) {
		// The walk method is used to recursively walk the resulting structure so
		// that modifications can be made.

		var k,
			v,
			value = holder[key];
		if (value && typeof value === 'object') {
			for (k in value) {
				if (Object.prototype.hasOwnProperty.call(value, k)) {
					v = walk(value, k);
					if (v !== undefined) {
						value[k] = v;
					} else {
						delete value[k];
					}
				}
			}
		}
		return reviver.call(holder, key, value);
	}

	// Since DSON isn't that close to javascript's native format, we're gonna parse this
	// instead of relying on eval
	var parser = new DSONParser(text);
	var o = parser.parse();
	parser.skipWhitespace();
	if (parser.remaining()) {
		throw new SyntaxError(
			'DSON.parse: Unexpected input beyond end of data'
		);
	}

	return typeof reviver === 'function' ? walk({ '': o }, '') : o;
};

const DSON = {
	parse,
	stringify,
};
export default DSON;
