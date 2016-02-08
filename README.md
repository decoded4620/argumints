
# ArguMints

ArguMints <- ARGUMINTS <- Command Line and Script Argument Utility

Argumints is a Powerful Command Line Arguments Preprocessor.

# Usage
ArguMints is both a Command Line Option Parser, as well as a Data Mining and template / data generator mechanism that can benefit how you write your Node JS. Applications.

## Options:

You may pass an options object to ArguMints so it will understand how to 'retort' to your input.
Below are the default values used by ArguMints should none be passed in
```js
var options = {
    treatBoolStringsAsBoolean:true,         // argv of "true/false" are converted to boolean
    treatNullStringsAsNull:true,            // argv of "null" converted to null
    treatRegExStringsAsRegEx:true,          // argv of "/*.*/g" converted to RegEx("*.*","g");
    treatNumberStringsAsNumbers:true,       // argv of "1" converted to Number(1)
    treatUndefinedStringsAsUndefined:true,  // argv of "undefined" converted to undefined
    enableArgFileLoading:true,              // argv of @filename.txt will load contents of filename.txt (if true) otherwise, no change is made to value.
    ignoreJson:false                        // ignore json formatting and return the literal string value.
};

var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);
```
## Basic Examples 
### NOTE: Examples all from test materials included with ArguMints package!
#### Options, Flags, and ArgV
```js
// cmd line equivalent
// C:\argumints> node argumints-test.js -xzfv --option arg0 arg1
// NOTE: verbose is true here because failing a check for an option will 
// revert to checking for the corresponding flag (usign first char of option name)
var test1 = new ArguMints(defaultOptions);
test1.retort(["-xzfv", "--option", "arg0", "arg1"]);
console.log(test1.opt("option"));                   // true
console.log(test1.opt("verbose"));                  // true
console.log(test1.flag("f"));                       // true
console.log(test1.flag("x"));                       // true
console.log(test1.flag("z"));                       // true
console.log(test1.argv(0));                         // arg0
console.log(test1.argv(1));                         // arg1
```

#### The Key=Value Store
```js

// cmd line equivalent
// C:\argumints> node argumints-test.js x=2 y=3
test1.retort(["x=2","y=3"]);

console.log(test1.keyValue("x"));
console.log(test1.keyValue("y"));

```
#### JSON Expansion
```js

// cmd line equivalent
// C:\argumints> node argumints-test.js @testargs1.json
test1.retort(["{\"aProperty\":\"testValue\"}"]);

console.log(test1.keyValue("aProperty"));
```
#### JSON File Expansion
```js

// cmd line equivalent
// C:\argumints> node argumints-test.js @testargs1.json
test1.retort(["@testargs1.json"]);

console.log(test1.keyValue("aNumber"));             // 1
console.log(test1.keyValue("aBool"));               // true
console.log(test1.keyValue("anArray")[2]);          // buckle
console.log(test1.keyValue("anObject").prop);       // aProperty
console.log(test1.keyValue("nullValue"));           // null

// content of testargs1.json
/*
 {
    "aNumber":1,
    "aBool":true,
    "aString":"Hello World!",
    "anArray":[1,2,"buckle","my","shoe"],
    "anObject":{"prop":"aProperty"},
    "nullValue":null
}
 */
```
#### Recursive JSON File Expansion
```js
// cmd line equivalent
// C:\argumints> node argumints-test.js @testargs2.json
test1.retort(["@testargs2.json"]);

console.log(test1.keyValue("fromFile1"));
console.log(test1.keyValue("fromFile2"));


/*
// content of testargs2.json
{
    "fromFile1":"@test.txt",
    "fromFile2":"@test2.txt"
}

// content of test.txt 
This is some test content from a text file!
// content of test2.txt
This is some more test content from another text file!
 */
```

#### Recursive JSON File Expansion and Mining (Advanced)
```js

// cmd line equivalent
// C:\argumints> node argumints-test.js @testargs3.json
test1.retort(["@testargs3.json"]);

console.log(test1.keyValue("testArgs1"));
console.log(test1.keyValue("testArgs2"));

// dig in?
console.log(test1.keyValue("testArgs1").aNumber);
console.log(test1.keyValue("testArgs1").anArray[4]);
console.log(test1.keyValue("testArgs2").fromFile1);
console.log(test1.keyValue("testArgs2").fromFile2);

/*
// content of testargs3.json
{ 
    "testArgs1":"@testargs1.json",
    "testArgs2":"@testargs2.json"
}
    
// content of testargs1.json same as above
// content of testargs2.json same as above
*/
```
### Bulk File Expansion
#### Expansion in Array
```js
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);
// append some more 'command line' args.
myArgs.retort([["@file1.txt","@file2.json"]]);

//results
//file1.txt contents loaded into the first array slot.
//file2.json contents loaded, expanded into a JSON object
//           and placed into the second array slot.
// the resulting array is placed in the first slot of
// Argumints.commandTable.argList 
// (since it has no key=value) format, and is not a flag.
```

#### Expansion as a Key=Value store
```js
var ArguMints = require('argumints').ArguMints;
ArguMints.verbose = true;
var myArgs = new ArguMints(options);
// append some more 'command line' args.
myArgs.retort(["x=@file1.txt","y=@file2.json"]);

//results
//file1.txt contents are stored in the command table with key 'x'.
//file2.json contents are expanded into a JSON Object, and stored 
//           in the command table with key 'y'
```

### Circular Expansion Protection
If you accidentally circularly reference files during an expansion chain, you'll get an exception as show below. This avoids infinite loops and stack overflows when doing really crazy things with ArguMints.

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

#### Notes on File Expansion
Files are expanded using the '@' character to denote resource location. This is either an absolute or relative local resource. And can be a Windows or Linux Path. Windows paths that have Spaces in the name must be surrounded by quotes!

The Following Formats are acceptable.

     "@C:\Program Files\Blah"
     "@Program Files\Blah"
      @..\another\place\for\file.txt
      @my/file/is/relative.txt
      @/abs/linux/path/or/root/of/curr/win/drive
      @\root\of\curr\win\drive
      @relative\win\path
      
 File contents can be in JSON format, which means their content will be expanded into a  JavaScript object. Any properties of said object that are of String type, and follow the file expansion nomenclature will also be expanded. Circular Expansion is not allowed.

## Regular Expressions
You can save a regExp in a file and readily use it as a JavaScript RegExp() object.
```js
// cmd line argumints-test.js @regExp.txt
test1.retort(["@regExp.txt"]);
var reg = test1.argv(0);
console.log("this is myemail@address.com ok?".match(reg));          //['myemail@address.com']
```
####OR USING KEY VALUE STORE
```js
// cmd line argumints-test.js @regExp.txt
test1.retort(["exp=@regExp.txt"]);
var reg = test1.keyValue("exp");
console.log("this is myemail@address.com ok?".match(reg));          //['myemail@address.com']
```
#### The Reg Exp used in regExp.txt
```js
//contents of regExp.txt (an expression to match email addresses in  a body of multi-line text)
/*
/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gm
*/
```
### Requirements

Node

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
            treatRegExStringsAsRegEx:true,
            ignoreJson:false,
            enableFileExpansion:true
        };
var ag = new ArguMints(options).retort();
```

### Methods

#### .retort(arrayOfArgsOrNull)

Immediately analyzes the input arguments to the current running node process. This assumes the first two arguments are NodeJS Location, and Script URI.

You Can call retort() multiple times, with an array of arguments, or with no arguments. Arguments will be treated the same as if they were passed in via command line.

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
#### .argv(atIndex)
Returns the ordered argument passed into the Node Script at the specified index.

```js
// argumints-test helpMe!
console.log(new ArguMints().retort().argv(1));            // helpMe!
```

#### .opt(optName)
Returns true if the option at 'optName' was set

```js
// argumints-test --verbose
console.log(new ArguMints().retort().opt("verbose"));            // true
```


#### .keyValue(key)
Returns the value stored under 'key' in the keyStore. The Key Store is populated using the format 'key=value' when passing in arguments. you can also specify files, i.e. 'key=@test.txt'

```js
// argumints-test x=2
console.log(new ArguMints().retort().keyValue("x"));            // 2
```

#### .reset(key)
Resets the ArguMints instance. You must call 'retort()' again to re-parse the argument inputs, however, this gives you the option to append new arguments onto the instance.

```js
// argumints-test x=2
console.log(new ArguMints().retort().keyValue("x"));            // 2
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