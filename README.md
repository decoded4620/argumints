
# ArguMints
![argumints!](argumints_logo.jpg)


Argumints is a Powerful Command Line Arguments Preprocessor and Data Mining Tool
## Benefits
Easily create meaningful input to your scripts. Not only limited to CLI option/argv parsing, ArguMints is also a powerful 
Data Gathering and Mining tool, template generator, and Regular Expression matcher.

#### CLI
    
    argv        // positional arguments
    Options     // --option arguments
    Flags       // -fxvZ  type arguments

#### Data Gathering, Mining, and Template Generation
use input arguments to gather file data, match with regular expressions to mine data you've gathered,
and use input arguments and file expansion to create dynamic templates.


## Usage


#### How to use the default instance
Requiring ArguMints provides a default ArguMints instance, with the configuration shown above.
```js
    
    var lib = require('argumints');
    
    // access a default instance via the 'myArguMints' built in
    var myArgs = lib.myArguMints;
    
    // - OR -
    
    // the one liner.
    var myArgs = require('argumints').myArguMints;
    
```

#### How to roll your own instance!
```js

    // see the bottom of this document for more information
    // on what the options do, and which options are available.
    var options = { ignoreJson:true, treatBoolStringsAsBoolean:false };
    var lib = require('argumints');
    
    
    var ArguMints = lib.ArguMints;
    var myArgs = new ArguMints(options);
    
    // - OR -
    
    // the one liner
    var myArgs = new require('argumints').ArguMints(options);
    
```
### Basic Examples 
    NOTE: Examples all from test materials included with ArguMints package!
#### Options, Flags, and Argv
```js

    // cmd line equivalent
    // C:\argumints> node argumints-test.js -xzfv --option arg0 arg1
    // NOTE: verbose is true here because failing a check for an option will 
    // revert to checking for the corresponding flag (usign first char of option name)
    myArgs.retort(["-xzfv", "--option", "arg0", "arg1"]);
    console.log(myArgs.opt("option"));                   // true
    console.log(myArgs.opt("verbose"));                  // true
    console.log(myArgs.flag("f"));                       // true
    console.log(myArgs.flag("x"));                       // true
    console.log(myArgs.flag("z"));                       // true
    console.log(myArgs.argv(0));                         // arg0
    console.log(myArgs.argv(1));                         // arg1

```

#### The Key=Value Store
```js

    // cmd line equivalent
    // C:\argumints> node argumints-test.js x=2 y=3
    myArgs.retort(["x=2","y=3"]);
    
    console.log(myArgs.keyValue("x"));
    console.log(myArgs.keyValue("y"));

```
### Advanced Examples

    NOTE: Examples all from test materisals included with ArguMints package!

#### Text File Expansion
```js

    // cmd line equivalent
    // C:\argumints> node argumints-test.js @testargs2.json
    myArgs.retort(["@test.txt"]);
    
    console.log(myArgs.argv(0)); // output the text file content
```

Materials

* [test.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test.txt)

#### JSON Expansion in line
JSON File Expansion works like regular File Expansion, with the additional benefit of grafting the resulting
JSON Data into either the keyStore, or onto the argv list after expansion, depending on how you structured the 
input ArguMint (see what I did there??).
```js
    
    // cmd line equivalent
    // C:\argumints> node argumints-test.js '{\"aProperty\":\"testValue\"}'
    myArgs.retort(["{\"aProperty\":\"testValue\"}"]);
    
    console.log(myArgs.keyValue("aProperty"));               // testValue
    
    // or
    myArgs.retort(["key=\"{\"aProperty\":\"testValue\"}\""]);
    
    console.log(myArgs.keyValue("key").aProperty);           // testValue

```

#### JSON File Expansion

```js

    // cmd line equivalent
    // C:\argumints> node argumints-test.js @testargs1.json
    myArgs.retort(["@testargs1.json"]);
    
    console.log(myArgs.keyValue("aNumber"));             // 1
    console.log(myArgs.keyValue("aBool"));               // true
    console.log(myArgs.keyValue("anArray")[2]);          // buckle
    console.log(myArgs.keyValue("anObject").prop);       // aProperty
    console.log(myArgs.keyValue("nullValue"));           // null
    
```

Materials

* [testargs1.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs1.json)

#### Recursive JSON File Expansion
```js

    // cmd line equivalent
    // C:\argumints> node argumints-test.js @testargs2.json
    myArgs.retort(["@testargs2.json"]);
    
    console.log(myArgs.keyValue("fromFile1"));
    console.log(myArgs.keyValue("fromFile2"));
     
```
Materials

* [testargs2.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs2.json)
* [test.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test.txt)
* [test2.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test2.txt)

#### Recursive JSON File Expansion and Mining (Advanced)
```js
    
    // cmd line equivalent
    // C:\argumints> node argumints-test.js @testargs3.json
    myArgs.retort(["@testargs3.json"]);
    
    console.log(myArgs.keyValue("testArgs1"));
    console.log(myArgs.keyValue("testArgs2"));
    
    // dig in to the values...
    console.log(myArgs.keyValue("testArgs1").aNumber);
    console.log(myArgs.keyValue("testArgs1").anArray[4]);
    console.log(myArgs.keyValue("testArgs2").fromFile1);
    console.log(myArgs.keyValue("testArgs2").fromFile2);
    
```

Materials - all files below were loaded because of templatization starting with testargs3.json

* [testargs1.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs1.json)
* [testargs2.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs2.json)
* [testargs3.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs3.json)
* [test.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test.txt)
* [test2.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test.txt)

### Bulk File Expansion
#### Expansion in Array
```js

    ArguMints.verbose = true;
    // append some more 'command line' args.
    myArgs.retort([["@test.txt","@testargs1.json"]]);
    
    //results
    //test.txt contents loaded into the first array slot.
    //testargs1.json contents loaded, expanded into a JSON object
    //           and placed into the second array slot.
    // the resulting array is placed in the first slot of
    // Argumints.commandTable.argList 
    // (since it has no key=value) format, and is not a flag.
    
```

Materials

* [test.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test.txt)
* [testargs1.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs1.json)

#### Expansion as a Key=Value store
```js

    ArguMints.verbose = true;
    // append some more 'command line' args.
    myArgs.retort(["x=@test.txt","y=@testargs1.json"]);
    
    //results
    //test.txt contents are stored in the command table with key 'x'.
    //testargs1.json contents are expanded into a JSON Object, and stored 
    //           in the command table with key 'y'
    
```

Materials

* [test.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/test.txt)
* [testargs1.json](https://npm-cdn.herokuapp.com/argumints@1.1.4/testargs1.json)

### Circular Expansion Protection
If you accidentally circularly reference files during an expansion chain, you'll get an exception as show below. This avoids infinite loops and stack overflows when doing really crazy things with ArguMints.

```js

    ArguMints.verbose = true;
    myArgs.retort(["x=@testarg_infinite.txt"]);
    
    //results
    // file refers to itself by having its contents be a valid url expansion, pointing to its own url.
    // an ArguMintsException is thrown due to Circular Expansion detection.
    // Each Argument is individually protected against circular expansion, so you CAN refer to the same file twice, as long as
    // its under different argument expansions.
    
```

Materials
* [testarg_infinite.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testarg_infinite.txt)

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


using '--argumints-match-argv' option we perform aggregate data mining and data gathering.

### CLI

```js

    // match all instances of the word 'ord' within the two textfiles provided.
    // matches are cumulative.
    myArgs.retort(["--argumints-match-argv", "@testMatcher.txt", "@testMatcher2.txt", "/([A-Za-z0-9]*(ord)[A-Za-z]*)|(famil[A-Za-z0-9]*)/igm"]);
    console.log(myArgs.matches());
    
    // result
    /*
        [ 'ord',
            'word',
            'ordinal',
            'ordinary',
            'ordered',
            'ordained',
            'ford',
            'Nordic',
            'family',
            'Family',
            'families',
            'Familiar',
            'FaMiLy',
            'FaMiLiAr' 
        ]
    */
    
```
Materials
* [testMatcher.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testMatcher.txt)
* [testMatcher2.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testMatcher2.txt)

### From File
You can save a regExp in a file and readily use it as a JavaScript RegExp() object.
```js

    // cmd line argumints-test.js --argumints-match-argv @testMatcher.txt @testMatcher2.txt @regExpOrd.txt
    myArgs.retort(["--argumints-match-argv","@regExpOrd.txt", "@testMatcher.txt", "@testMatcher2.txt"]);
    console.log(myArgs.matches());
    
```

Materials

* [testMatcher.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testMatcher.txt)
* [testMatcher2.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testMatcher2.txt)
* [regExpOrd.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/regExpOrd.txt)

####OR USING KEY VALUE STORE
```js

    // cmd line argumints-test.js --argumints-match-kv  @regExp.txt @testMatcher.txt @testMatcher2.txt
    myArgs.retort(["--argumints-match-kv", "search=This is an email: myemail@address.com", "exp=@regExp.txt"]);
    console.log(myArgs.matches());
    
    // use the reg ex again and again!
    var regExp = myArgs.keyValue("exp");
    console.log("this is my email: myemail@address.com ok?".match(regExp));          //['myemail@address.com']
    
```

Materials

* [testMatcher.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testMatcher.txt)
* [testMatcher2.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/testMatcher2.txt)
* [regExp.txt](https://npm-cdn.herokuapp.com/argumints@1.1.4/regExp.txt)



### The Options {} Object:

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

#### .retort(arrayOfArgs=null, onStartCb=null, onArgExpandCb=null)


Immediately analyzes the input arguments to the current running node process, as well as the additional `arrayOfArgs` passed in.  

##### params
`arrayOfArgs1` - an Array of 'string' values that will be expanded, or `null`

`onStartCb` - a `function` with signature `function(userAgs)` or `null`. If specified, the function will be called upon starting the retort, after gathering the input arguments.

`onArgExpandCb` - a `function` with signature `function(argVal, expandedVal, idx, cnt)` or `null`. If specified, the function will be called upon the processing of each individual argument in `arrayOfArgs` allowing you to act after each one. The arguments for the function are the original argument, the expanded value, the current argument `idx`, and,the count of arguments.

You Can call `retort()` multiple times, with an array of arguments, or with no arguments. Arguments will be treated the same as if they were passed in via command line.



```js

    myArgs.retort([1,2,3,"--minty-op-div"], onStart, onRetortEach);
    
    function onStart(args){
        console.log("there are: " + args.length + " input args"); // 4    
    }
    function onRetortEach(arg, exp, idx, cnt){
        console.log(origV + "=>" + newV + ", is last one? " + (idx == cnt-1));
    }

```
### wheresMyNode
Node installation location.

### getUserArgs()
Returns all arguments passed in originally by the user (prior to expansion)

```js
    
    // node argumints-test.js arg1 arg2 --opt1 --opt2 key1=val1 key2=val2
    console.log(myArgs.retort().getUserArgs());
    //output is   [arg1, arg2, --opt1, --opt2, key1=value1, key2=val2]

```

### getScriptArgs()
Returns the script arguments which are either of length 1 or 2, depending on where you are running code from (node command line or windows command line via node executable).

```js

    // node argumints-test.js arg1 arg2 --opt1 --opt2 key1=val1 key2=val2
    console.log(myArgs.retort().getScriptArgs());
    //output is   [C:\path\to\node.exe, C:\path\to\script.js]
    // OR         [C:\path\to\node.exe]  when running in Node Command Line.
    
```

#### .argv(atIndex)
Returns the ordered argument passed into the Node Script at the specified index.

```js

    // node argumints-test.js helpMe! thank you
    console.log(myArgs.retort().argv(1));            // output: helpMe!
    
    // get them all
    console.log(myArgs.retort().argv());            // output: [helpMe!,thank,you]
```

#### .opt(optName)
Returns true if the option at `optName` was set
If no `optName` is specified, a copy of the internal _opt table is returned for inspection.
```js

    // argumints-test --verbose
    console.log(myArgs.retort().opt("verbose"));    // output: true
    
    // get them all
    console.log(myArgs.retort().opt());             // output: {verbose:true}
```

In addition to using `opt` as a check, you can specify some 'built in' options
to enhance the minty flavour of `ArguMints`.

##### Built in options

The Following Options will change the internal behavior of ArguMints
* `--minty-match-argv`
* `--minty-match-kv`
* `--minty-dump`
* `--minty-append-dup-keys`
* `--minty-op-add`
* `--minty-op-sub`
* `--minty-op-div`
* `--minty-op-mul`
* `--minty-op-sqrt`
* `--minty-op-sqr`
* `--minty-op-ln`
* `--minty-no-cache`
* `--minty-verbose`
* `--minty-clear-opts`
* `--minty-clear-flags`

###### --minty-match-argv
setting this option will match all ordered arguments which aren't RegularExpressions against all ordered arguments which are regular expressions, and aggregate the matches. This is useful when spanning multiple files for patterns (i.e. email addresses, etc).

```js
    
    // the first two positional arguments are files containing text blobs. 
    // the third positional argument is a text file containing a regular expression which
    // will expand to a RegExp instance, and match against the content of the files.
    myArgs.retort(["--minty-match-argv","@testMatcher.txt","@testMatcher2.txt", "@regExpOrd.txt"]);
    var matches = myArgs.matches();
```
###### --minty-match-kv
much like minty-match-argv, except this iterates through keyStore values rather than positional arguments.
you must only set one of these two keys, they are mutually exclusive.
```js
    
    myArgs.retort(["--minty-match-kv","file1=@testMatcher.txt","file2=@testMatcher2.txt", "searchRegExp=@regExpOrd.txt"]);
    var matches = myArgs.matches();

```

##### --minty-dump
Once retort completes, a minty-dump (of the commandTableData) will be displayed on console. smells great...


##### --minty-append-dup-keys
If the same `key` is set as a `keyValue` across one (or multiple) calls to `retort()`, the results are aggregated. 
This only works for Array (pushes or concatenates), Number (adds unless otherwise specified) and String types (concatenates)

```js
    
    // node .\argumints-test.js --minty-append-dup-keys "key1=some text" "key1=, more text" "key1=, even more" --minty-dump
    myArgs.retort(["--minty-append-dup-keys", "key1=some text", "key1=", more text", "key1=", even more"]);
    console.log(myArgs.keyValue('key1');
    
    //output: some text, more text, even more
    
    
    // -- OR --
    
    myArgs.retort(["--minty-append-dup-keys", "key1=2","key1=2","key1="6"]);
    
    console.log(myArgs.keyValue('key1'));
    //output: 10
    
    
    // -- OR --
    
    myArgs.retort(["--minty-append-dup-keys", "key1=221","key1=B","key1=" Baker Street"]);
    myArgs.keyValue('key1')); // output: 221B Baker Street
    // -- OR --
    
    myArgs.retort(["--minty-append-dup-keys", "key1=0x000000","key1=0xFFF000","key2="0x000FFF"]);
    console.log(myArgs.keyValue('key1') == myArgs.keyValue('key2')); // output: true

```
Mutually Exclusive Operation Modifiers

###### --minty-op-add
Use this with `--minty-append-dup-keys`, this will decide the current operation to be performed. this is enabled by default unless another type is specified.

###### --minty-op-div
Uses a divide operation when `--minty-append-dup-keys` is set.

###### --minty-op-sub
Uses a subtract operation when `--minty-append-dup-keys` is set.

###### --minty-op-mul
Uses a multiply operation when `--minty-append-dup-keys` is set.

###### --minty-op-sqrt
Uses a square root operation when `--minty-append-dup-keys` is set.

###### --minty-op-sqr
Uses a square operation when `--minty-append-dup-keys` is set.

###### --minty-op-ln
Uses a natural log operation when `--minty-append-dup-keys` is set.

###### --minty-op-tan
Uses a tangent `(Math.tan(argAt))` operation`--minty-append-dup-keys` is set.

###### --minty-op-atan
Uses a tangent `(Math.atan(argAt))` operation`--minty-append-dup-keys` is set.

###### --minty-op-sin
Uses a tangent `(Math.sin(argAt))` operation`--minty-append-dup-keys` is set.

###### --minty-op-cos
Uses a tangent `(Math.cos(argAt))` operation`--minty-append-dup-keys` is set.

###### --minty-op-exp
Agreggates  `(Math.exp(argAt))`  or `e^x` operations on a key if set one or more times and `--minty-append-dup-keys` is set.


##### --minty-no-cache
File contents are not cached. Normally expanding a file will cache the file content, so further expansions in arguments using the
same file will be faster. However, if your script modifies the file between retorts, or even while retorting, you can set this option to force it to reload upon each expansion request

```js

    myArgs.retort(["--minty-no-cache", "@test1.txt", "key1="@test1.txt", "key2="@test1.txt"]);
    //result: test1.txt is reloaded 3 times

```

##### --minty-clear-opts and --minty-clear-flags
This allows you to change how minty works during a retort. For example, within the expansion callback (3rd parameter)
if this is set, your flags/options are wiped clean and the next
iteration will result in different behavior. Further more, you can 
push or insert arguments into minty as it is retorting as long
as they are inserted after the current processing point.

```js

    myArgs.retort(["--minty-clear-opts", "--opt"], null, function(a,e,i,c){
        // opts are now clear
        myArgs.insertArg("--minty-clear-opts");
        myArgs.pushArg("--opt2");
    });
    

```

#### .flag(flagName=undefined)
returns true if a flag by name is enabled. Flag names are a single character.
If no flagName is passed, a copy of the internal _opt table is returned for inspection.
```js

    // argumints-test --verbose
    console.log(myArgs.retort().matches());            // true
    
```
#### .keyValue(key=undefined)
Returns the value stored under `key` in the keyStore. The Key Store is populated using the format `key=value` when passing in arguments. you can also specify files, i.e. `key=@test.txt`
If no `key` is specified, a copy of the entire keyStore is returned for your inspection.

```js

    // argumints-test x=2
    console.log(myArgs.retort().keyValue("x"));            // 2
    
```
#### .matches(start=-1,end=-1)
Returns any matches after a retort with a regular expression and having --argumints-match-argv or --argumints-match-kv enagbled.
if `start` or `end` are specified, it will return a 'slice' of the matches contained within.

```js

    // argumints-test --argumints-verbose --argumints-match-argv @testMatcher2.txt @regExpOrd.txt
    console.log(myArgs.retort().matches());            // true

```

#### .insertArg(arg, xArgsFromHere);
This allows you to insert arguments directly in front of the current retort position. This means you can do fun things
like factorials. NOTE: This is not meant to replace good old native code doing math, but its great for scripting and doing
dynamic templated calculations and datamining.
```js

     // the factorial function, ArguMints style!
    var fact = 1;
    defaultMints.retort( [3],null, function(arg, exp, idx, cnt){
        if( typeof exp === 'number' && exp > 0){
            fact *= exp;
            defaultMints.insertArg(arg-1, 0);
        }
    });
    
    console.log("Fact: " + fact);           // output 6
    

```

#### .pushArg(moreArgs)
Pushes additional arguments onto the user argument queue. This can only be done during a retort, thus you must call this from the retort callback you pass into retort. be careful that you have a way to stop pushing arguments to avoid an infinitely growing args list.

```js

    // the summation function, ArguMints style!
    var sum = 0;
    var t = 15;  // first x numbers
    defaultMints.retort( [1],null, function(arg, exp, idx, cnt){
        if( typeof exp === 'number' ){
            sum += exp;
            
            t--;
            if(t > 0){
                defaultMints.pushArg(exp+1);
            }
        }
    });
    
    console.log("Sum: " + sum); 

```
#### .reset(newOptions=undefined)
Resets the ArguMints instance. You must call `retort()` again to re-parse the argument inputs, however, this gives you the option to append new arguments onto the instance.

```js

    // reset all data, keep current options
    myArgs.reset();
    
    // reset all data, and overwrite new options
    myArgs.reset({ignoreJson:true});
    
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