
# ArguMints

ArguMints <- ARGUMINTS <- Command Line and Script Argument Utility

Argumints is a Powerful Command Line Arguments Preprocessor.

### Usage

Example usage #1:


```js
// in your script
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var options = {
            treatBoolStringsAsBoolean:true,
            treatNullStringsAsNull:true,
            treatRegExStringsAsRegEx:true,
            enableArgFileLoading:true,
            ignoreJson:false
        };
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
# More fun usages...:

Using the following default options...

```js
var options = {
    treatBoolStringsAsBoolean:true,
    treatNullStringsAsNull:true,
    treatRegExStringsAsRegEx:true,
    enableArgFileLoading:true,
    ignoreJson:false
};
```


```js
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);
// append some more 'command line' args.
myArgs.retort([["@file1.txt","@file2.json"]]);

//results
//file1.txt is loaded, and its contents are placed in the first array slot.
//file2.json is loaded, and its contents are placed in the second array slot, once they've been expanded into a JSON object.
// the resulting array is placed in the first slot of
// Argumints.commandTable.argList 
// (since it has no key=value) format, and is not a flag.
```

```js
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);
// append some more 'command line' args.
myArgs.retort(["x=@file1.txt","y=@file2.json"]);

//results
//file1.txt is loaded, and its contents are written to the command table with key 'x'.
//file2.json is loaded, expanded into a JSON Object, and stored in the command table under key 'y'
```


```js
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);

// if file1 contents={"file":"@file2"}
// and file2 contents={"file":"@file1"}
myArgs.retort(["x=@file1","y=@file2"]);

//results
//file1 is loaded, and its contents are written to the command table with key 'x'.
//file2 is loaded, expanded into a JSON Object. The object is then
//passed to 'expandObject' which will attempt to load file1 again causing
// an ArguMintsException to be thrown.
```


```js
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);

// if file1 contents={"file":"@file2"}
// and file2 contents={"file":"@file1"}
myArgs.retort(["x=@file1.txt"]).retort(["y=@file2.json"]);

//results
//file1.txt is loaded, and its contents are written to the command table with key 'x'.
// retort is called again, causing an append operation.
//file2.json is loaded, expanded into a JSON Object, and stored in the command table under key 'y'
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