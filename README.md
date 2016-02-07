
# ArguMints

ArguMints <- ARGUMINTS <- Command Line and Script Argument Utility

Argumints is a Powerful Command Line Arguments Preprocessor.

### Usage

Example usage #1:


```js
// in your script
var ArguMints = require('argumints').ArguMints;
var options = { verbose:true }
//Command Line Arguments passed into the script using ArguMints are parsed by ArguMints into proper Javascript Datatypes.
var myArgs = new ArguMints(options);

// retort is synonymous for responding to user Arguments, i.e. building the command table in ArguMints.
myArgs.retort();

var commandTable = myArgs.commandTable;
console.log(typeof commandTable.v + " " + commandTable.v );
console.log(typeof commandTable.x + " " + commandTable.x);
console.log(typeof commandTable.y + " " + commandTable.y);
```
Now run the script with the following

```js
node myscript.js -v x=2 y=[1,2,3]
//output
boolean true
number 2
object [1,2,3]
```

### Requirements

Node or IE8+

### Installation and usage

Node, browserify:
```
npm install argumints
```

```js
var ArguMints = require('argumints').ArguMints;
var options = {
    verbose:true,
    treatBoolStringsAsBoolean:true,
    treatNullStringsAsNull:true,
    treatRegExStringsAsRegEx:true
}
var ag = new ArguMints(options).retort();

var table = ag.commandTable;
```

### Methods

#### .retort()

Immediately analyzes the input arguments to the current running node process. This assumes the first two arguments are NodeJS Location, and Script URI.

```js
var ArguMints = require('argumints').ArguMints;
var options = {
    verbose:true,
    treatBoolStringsAsBoolean:true,
    treatNullStringsAsNull:true,
    treatRegExStringsAsRegEx:true
}
var ag = new ArguMints(options).retort();

var table = ag.commandTable;
```


### License

```
The MIT License (MIT)

Copyright (c) 2016 Decoded4620

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```