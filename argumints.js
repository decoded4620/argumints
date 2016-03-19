(function() {

    var Requires            = require("./requires.js");
    var ArguMintsException  = Requires.ArguMintsException;
    var ArguMintStats       = Requires.ArguMintStats;
    var ArguMintRules       = Requires.ArguMintRules;
    var AuxUtils            = Requires.AuxUtils;
    
    // a set of 'Built In' Extensions
    var BuiltIns            = Requires.BuiltIns;
    
    // used for filtering selecting, etc.
    var _                   = require("underscore");
    var fs                  = require("fs");

    //@private
    var _rules              = new ArguMintRules();
    
    var ArguMintsExtensions = (function() {

        function ArguMintsExtensions() {
            var mintyOps        = {};
            var mintyKSOps      = {};
            var mintyKSOpQueue  = [];

            var mintyAGOps      = {};
            var mintyAGOpQueue  = [];

            ArguMintsExtensions.prototype.hasKeyStoreOp = function(mintyKSOpStr) {
                return mintyKSOps.hasOwnProperty(mintyKSOpStr) && !AuxUtils.isNully(mintyKSOps[mintyKSOpStr]);
            };
            
            ArguMintsExtensions.prototype.addKeyStoreOp = function(mintyKSOpStr, op) {
                mintyKSOps[mintyKSOpStr] = {
                    name : mintyKSOpStr,
                    op : op,
                    children : []
                };
                mintyKSOpQueue[mintyKSOpQueue.length] = mintyKSOps[mintyKSOpStr];
            };
            
            ArguMintsExtensions.prototype.hasKeyStoreOps = function() {
                return mintyKSOpQueue.length > 0;
            };

            ArguMintsExtensions.prototype.addAggregateOp = function(mintyAggOpStr, op) {
                mintyAGOps[mintyAggOpStr] = {
                    name : mintyAggOpStr,
                    op : op,
                    children : []
                };
                mintyAGOpQueue[mintyAGOpQueue.length] = mintyAGOps[mintyAggOpStr];
            };

            ArguMintsExtensions.prototype.hasAggregateOps = function() {
                return mintyAGOpQueue.length > 0;
            };

            ArguMintsExtensions.prototype.execAggregateOps = function(commandTable, stopOnFirst) {
                var retVal = false;

                for (var i = 0; i < mintyAGOpQueue.length; ++i) {
                    var opData = mintyAGOpQueue[i];

                    if (!AuxUtils.isNully(opData)) {

                        // only execute if the option is enabled.
                        if (commandTable.opt[opData.name] === true) {
                            var op = opData.op;
                            if (typeof op == "function") {
                                retVal = retVal || op(commandTable);
                            }
                        }
                    }

                    if (retVal && stopOnFirst) {
                        break;
                    }
                }

                return retVal;
            };
            /**
             * Handles either one or all key store operations. returns true if at least
             * one handler returned true. If stopOnFirst is true, the first handler
             * that returns true will stop executing further handlers.
             */
            ArguMintsExtensions.prototype.execKeyStoreOps = function(inputs, inOptions, stopOnFirst) {
                var retVal = false;

                for (var i = 0; i < mintyKSOpQueue.length; ++i) {
                    var opData = mintyKSOpQueue[i];

                    if (!AuxUtils.isNully(opData)) {
                        // only execute if the option is enabled.
                        if (inOptions[opData.name] === true) {
                            var op = opData.op;
                            if (typeof op == "function") {
                                retVal = op.apply(ArguMints.extensions, inputs);
                            }
                        }
                    }

                    if (retVal && stopOnFirst) {
                        break;
                    }
                }

                return retVal;
            };
            
            ArguMintsExtensions.prototype.hasOp = function(mintyOpStr) {
                return mintyOps.hasOwnProperty(mintyOpStr) && !AuxUtils.isNully(mintyOps[mintyOpStr]);
            };

            ArguMintsExtensions.prototype.addOp = function(mintyOpStr, op) {
                mintyOps[mintyOpStr] = {
                    name : mintyOpStr,
                    op : op,
                    children : []
                };
            };

            ArguMintsExtensions.prototype.getOp = function(mintyOpStr) {
                return AuxUtils.isNully(mintyOps[mintyOpStr]) ? null : mintyOps[mintyOpStr];
            };

            ArguMintsExtensions.prototype.executeOp = function(mintyOpStr) {
                var opData = mintyOps[mintyOpStr]

                (function executeR(inOpData) {
                    if (!AuxUtils.isNully(opData)) {
                        var op = opData.op;
                        if (typeof op == "function") {
                            op();
                        }

                        var lLen = inOpData.children.length;
                        for (var i = 0; i < lLen; ++i) {
                            executeR(inOpData);
                        }
                    }
                }(opData));
            };
        }

        // return the function to generate new values of ArguMintsExtensions
        return ArguMintsExtensions;
    }());

    /**
     * Constructor
     * 
     * @param options
     * an optional {} object.
     */
    function ArguMints(options) {

        // initialize the private store for this instance.
        // we can reference this anywhere by calling privitize
        var _commandTable = null;
        var _options = options;
        var _dumpDepth = 0;
        var _stats = new ArguMintStats();
        var _scriptArgs = null;
        var _userArgs = null;
        var _nodeLocation = null;
        var _scriptPath = null;
        var _currRetortIndex = 0;
        var _fileExpansionChain = null;

        // sets a value, or appends it if our options 
        // specify
        function setKeyStoreValue(key, value) {
            if (!AuxUtils.isNully(key) && typeof key == "string") {
                key = key.trim();

                var keyStore = _commandTable.keyStore;
                var currValue = _commandTable.keyStore[key];
                var handled = false;
                if (ArguMints.extensions.hasKeyStoreOps()) {
                    // stop on first by default.
                    handled = ArguMints.extensions.execKeyStoreOps([ _commandTable, key, value
                    ], _commandTable.opt, true);

                    if (!handled) {
                        keyStore[key] = value;
                    }
                }
            }
            return this;
        }

        function copyCommandsFrom(copyFrom) {
            // explodes all templates or JSON strings within
            // this objects properties.
            // expand for any file content in the JSON
            expandObject(copyFrom);

            // set each key value from the object
            _.each(copyFrom, function(value, key, obj) {
                setKeyStoreValue(key, value);
            });

            return this;
        }

        ArguMints.prototype.getStats = function() {
            return {
                ops : _stats.ops,
                retorts : _stats.retorts,
                bickerTime : _stats.bickerTime,
                debateStart : _stats.debateStart
            };
        };

        ArguMints.prototype.reset = function(newOptions) {
            if (AuxUtils.typeName(newOptions) == AuxUtils.OBJ) {
                _options = newOptions;
            }
            _stats.reset();
            _commandTable = null;
            _scriptArgs = null;
            _userArgs = null;
            _nodeLocation = null;

            return this;
            // NOTE: we don't kill 'options' here
            // so the user can 'retort' again with thame options.
        };
        /**
         * Internal
         */
        /**
         * Dump the Command Table
         */
        ArguMints.prototype.argDump = function() {
            var dumped = new WeakMap();

            // dump the contents of the command table, up to 100 levels into the tree.
            // this is an obscene limit, but insures no stack overflow or inifite circular print.
            function dump(o, dMap) {
                ++_dumpDepth;

                var chunk = "    ";
                var spacing = "";

                for (var i = 0; i < _dumpDepth; ++i) {
                    spacing += chunk;
                }

                if (ArguMints.verbose) {
                    if (AuxUtils.typeName(o) == AuxUtils.ARR) {
                        console.log(spacing + "ArguMints.dump(" + _dumpDepth + ") - " + AuxUtils.typeName(o, true) + " - array length: " + o.length);
                    }
                    else {
                        console.log(spacing + "ArguMints.dump(" + _dumpDepth + ") - " + AuxUtils.typeName(o, true));
                    }
                }
                if (o === null) {
                    console.log(spacing + "null");
                }
                else {
                    var objtype = typeof o;
                    var value, type, pName, tag;
                    if (AuxUtils.typeName(o) == AuxUtils.ARR) {

                        // avoid circular reference dumping
                        if (!dMap.has(o)) {
                            dMap.set(o, true);

                            for (var x = 0; x < o.length; x++) {

                                value = o[x];
                                type = (typeof value);
                                tag = ArguMints.verbose ? "[" + x + "]  " : "";
                                if (type == "object") {
                                    console.log(spacing + tag + AuxUtils.typeName(value, true) + "(" + type + ")");
                                    console.log((spacing + chunk + "--------------------------------------------------------").substring(0, 50));
                                    dump(value, dMap);
                                    console.log((spacing + chunk + "--------------------------------------------------------").substring(0, 50));

                                }
                                else {
                                    if (type == "string") {
                                        console.log(spacing + tag + (value.split('\r\n').join('\r\n     ' + spacing)));
                                    }
                                    else {
                                        console.log(spacing + tag + value + "(" + type + ")");
                                    }
                                }
                            }
                        }
                    }
                    else if (objtype == "object") {
                        var cnt = 0;

                        if (!dMap.has(o)) {
                            dMap.set(o, true);
                            for ( var prop in o) {
                                // gets rid of unwanted prototype properties.
                                if (o.hasOwnProperty(prop)) {
                                    cnt++;
                                    value = o[prop];
                                    type = (typeof value);
                                    pName = AuxUtils.typeName(value, true);

                                    if (type == "object") {
                                        if (pName == AuxUtils.ARR) {
                                            console.log(spacing + "[" + prop + "] " + pName + ", length: " + value.length);
                                        }
                                        else {
                                            console.log(spacing + "[" + prop + "] " + pName + "(" + type + ")");
                                        }
                                        console.log((spacing + chunk + "--------------------------------------------------------").substring(0, 50));
                                        dump(value, dMap);
                                        console.log((spacing + chunk + "--------------------------------------------------------").substring(0, 50));

                                    }
                                    else {
                                        console.log(spacing + prop + "=" + value + "(" + type + ")");
                                    }
                                }
                            }
                        }

                        if (cnt === 0) {
                            console.log(spacing + "\t{}");
                        }
                    }
                    else {
                        if (type == "string") {
                            console.log(spacing + "[" + (o.split('\r\n').join(spacing + '     \r\n')) + "]");
                        }
                        else {
                            console.log(spacing + "[" + o + "]");
                        }
                    }
                }
                --_dumpDepth;
            }

            dump(_commandTable, dumped);

            // clear after calling
            dumped = null;

            return this;
        };

        ArguMints.prototype.getUserArgs = function() {
            return _userArgs;
        };
        ArguMints.prototype.getScriptArgs = function() {
            // always return a copy
            return _.clone(_scriptArgs);
        };

        ArguMints.prototype.argc = function() {
            return _commandTable.argv.length;
        };
        ArguMints.prototype.argv = function(atIndex) {
            if ((typeof atIndex) == "number" && atIndex >= 0 && atIndex < _commandTable.argv.length) {
                return _commandTable.argv[atIndex];
            }

            return _.clone(_commandTable.argv);
        };

        ArguMints.prototype.opt = function(optName) {
            if (AuxUtils.typeName(optName) != AuxUtils.UDF) {
                if (AuxUtils.typeName(_commandTable.opt[optName]) != AuxUtils.UDF) {
                    return _commandTable.opt[optName];
                }
                return false;
            }
            else {
                // never return the original object.
                return _.clone(_commandTable.opt);
            }
        };

        ArguMints.prototype.keyValue = function(key) {
            if (AuxUtils.typeName(key) == AuxUtils.STR && key.length > 0) {
                return _commandTable.keyStore[key];
            }
            else {
                // key is null
                return _.clone(_commandTable.keyStore);
            }
        };

        ArguMints.prototype.flag = function(flag) {
            if (!AuxUtils.isNully(flag) && flag !== "") {
                if (AuxUtils.typeName(_commandTable.flags[flag]) != AuxUtils.UDF) {
                    return _commandTable.flags[flag];
                }

                return false;
            }

            return _.clone(_commandTable.flags);
        };

        function expandFile(tagInput) {
            var ret = tagInput;
            // pass through if not a string or properly formatted, or we are not enabling file expansion
            if (false === _options.enableFileExpansion || AuxUtils.typeName(ret) !== AuxUtils.STR || ret.charAt(0) !== '@') {
                return ret;
            }
            else {
                if (AuxUtils.isNully(_fileExpansionChain)) {
                    _fileExpansionChain = [];
                }

                if (_fileExpansionChain.indexOf(tagInput) != -1) {
                    if (ArguMints.verbose) {
                        console.log("ArguMints.expandFileArg() - Expansion chain: " + _fileExpansionChain);
                    }

                    throw new ArguMintsException("ArguMints.expandFileArg() - Circular File Expansion Detected!: " + "Expansion chain: " + _fileExpansionChain.join("->"));
                }

                _fileExpansionChain.push(tagInput);
                var cachedValue = _rules.getFileCache(tagInput);

                if (AuxUtils.isNully(cachedValue)) {
                    //this is a file, load it synchronously here
                    //process its contents as utf8
                    var fn = ret.substring(1);

                    if (ArguMints.verbose) {
                        console.log("ArguMints.expandFileArg(" + fn + ") - " + _fileExpansionChain.join("->"));
                    }

                    try {

                        // Query the entry
                        var stats = fs.lstatSync(fn);

                        // Is it a directory?
                        var hasContent = stats.isFile() && !stats.isDirectory();

                        // overwrite our value with the data from the file and continue
                        ret = hasContent ? fs.readFileSync(fn, "utf8") : "";

                        if (hasContent && !AuxUtils.isNully(ret)) {
                            ret = ret.trim();
                        }

                        if (ArguMints.verbose) {
                            console.log("ArguMints.expandFileArg() - loaded " + fn + " containing " + (ret.length > 0 ? ret.length : "ZERO") + " characters: " + ret);
                        }

                        if (_commandTable.opt["minty-no-cache"] !== true) {
                            _rules.cacheFileContent(tagInput, ret);
                        }
                        else {
                            if (ArguMints.verbose) {
                                console.log("ArguMints.expandFile() not caching file at: " + tagInput + ", caching is off");
                            }
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                else {
                    if (ArguMints.verbose) {
                        console.log("ArguMints.expandFile() - returning: " + cachedValue.length + " cached chars for tag: " + tagInput);
                    }

                    ret = cachedValue;
                }

            }
            return ret;
        }

        ArguMints.prototype.pushArg = function(moreArgOrArgs) {
            if (_stats.isRecording() && moreArgOrArgs !== undefined) {
                if (AuxUtils.typeName(moreArgOrArgs) !== AuxUtils.ARR) {
                    _userArgs[_userArgs.length] = moreArgOrArgs;
                }
                else {
                    _userArgs = _userArgs.concat(moreArgOrArgs);
                }
            }
            return this;
        };

        ArguMints.prototype.insertArg = function(moreArgOrArgs, xArgsFromHere) {
            if (_stats.isRecording() && moreArgOrArgs !== undefined) {
                var idx = _currRetortIndex;
                if (AuxUtils.typeName(xArgsFromHere) === AuxUtils.NUM) {
                    idx += xArgsFromHere;
                }
                if (idx <= _userArgs.length) {
                    if (AuxUtils.typeName(moreArgOrArgs) !== AuxUtils.ARR) {
                        _userArgs.splice(idx, 0, moreArgOrArgs);
                    }
                    else {
                        _userArgs = _userArgs.slice(0, idx).concat(moreArgOrArgs).concat(_userArgs.slice(idx));
                    }
                }
            }
            return this;
        };
        // build the command table from the users Arguments
        ArguMints.prototype.retort = function(moreUserArgs, onStart, onArgExpand) {
            _stats.recordStart();
            _currRetortIndex = 0;
            // insure we always have default options
            if (AuxUtils.isNully(_options)) {
                _options = {
                    treatBoolStringsAsBoolean : true,
                    treatNullStringsAsNull : true,
                    treatRegExStringsAsRegEx : true,
                    treatNumberStringsAsNumbers : true,
                    treatUndefinedStringsAsUndefined : true,
                    enableFileExpansion : true,
                    ignoreJson : false
                };
            }

            // keep track of arguments we've already retorted to
            var retortIndex = 0;

            // only update user args ONCE. 
            // if the user calls retort multiple times with 
            // concatenations of arguments, we'll append them to
            // userArgs below
            if (AuxUtils.isNully(_userArgs)) {
                if (ArguMints.verbose) {
                    console.log("ArguMints.retort() - building initial ArguMints set");
                }
                // table of parsed input arguments.
                _commandTable = {
                    argv : [],
                    matches : [],
                    flags : {},
                    opt : {},
                    keyStore : {}
                };

                // if running inside of node REPL
                // the secondArg will either be null, or will be a user argument.
                // validate that the second argument is either 'null', or doesn't contain the location of 
                // the argumints script.
                if (ArguMints.REPL === true) {
                    _scriptArgs = process.argv.slice(0, 1);

                    // path to node installation
                    _nodeLocation = _scriptArgs[0];

                    // we're not running a script if we get here, we're inside of node.
                    _scriptPath = null;

                    // any additional args
                    _userArgs = process.argv.slice(1);
                }
                // otherwise the first two args we always scrape
                else {
                    _scriptArgs = process.argv.slice(0, 2);

                    // path to node installation
                    _nodeLocation = _scriptArgs[0];

                    // path to this script
                    _scriptPath = _scriptArgs[1];

                    // any additional args
                    _userArgs = process.argv.slice(2);
                }

                retortIndex = 0;
            }
            else {
                if (ArguMints.verbose) {
                    console.log("ArguMints.retort() -Adding Additional arguments to existing ArguMints set");
                }

                // start from where we left off, unless reset is called.
                retortIndex = _userArgs.length;
            }

            if (!AuxUtils.isNully(moreUserArgs)) {
                _userArgs = _userArgs.concat(moreUserArgs);
            }

            var uLen = AuxUtils.isNully(_userArgs) ? 0 : _userArgs.length;

            if (!AuxUtils.isNully(onStart)) {
                onStart(_userArgs.concat());
            }

            if (uLen > retortIndex) {

                // userArgs are split on '=' to avoid forcing order
                // NOTE: we don't use uLen in the for loop because
                // args may be modified mid retort!
                for (var i = retortIndex; i < _userArgs.length; ++i) {

                    _currRetortIndex++;

                    // clear this after processing each argument
                    _fileExpansionChain = null;

                    // current arg, copied so it can be mangled.
                    // _userArgs[i] will never change from its orginal value.
                    var argAt = _userArgs[i];

                    // do the full expansion test first
                    argAt = expandString(argAt);

                    // if file expansion results in null or empty string,
                    // push this value onto the command args list now and short circuit.
                    if (argAt === "" || AuxUtils.isNully(argAt)) {
                        _commandTable.argv.push(argAt);

                        // invoke the expansion callback
                        if (!AuxUtils.isNully(onArgExpand)) {
                            onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                        }

                        continue;
                    }

                    var protoStr = AuxUtils.typeName(argAt);

                    // this was expanded into an object
                    if (protoStr == AuxUtils.OBJ) {
                        if (protoStr !== AuxUtils.REGX) {
                            copyCommandsFrom(argAt);
                        }
                        else {
                            // push regexp onto the arglist
                            _commandTable.argv.push(argAt);
                        }

                        // invoke the expansion callback
                        if (!AuxUtils.isNully(onArgExpand)) {
                            onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                        }
                    }
                    else if (protoStr == AuxUtils.STR) {
                        // first index of assignment operator in argument
                        var aIdx = argAt.indexOf("=");
                        var qIdx = argAt.indexOf('"');

                        // if there are quotes before our assignment operator, its not really an assignment but a string
                        // value.
                        if (aIdx > qIdx && qIdx != -1) {
                            aIdx = -1;
                        }
                        // if this is NOT a 'key=value' pair
                        // its a 'flag' i.e. verbose, etc.
                        if (aIdx == -1) {
                            // supports both '--flagName' and '-f' formats
                            if (argAt.charAt(0) == "-") {
                                // set as 'true'
                                if (argAt.charAt(1) == "-") {

                                    if (ArguMints.verbose) {
                                        console.log("ArguMints.retort() - add option at: " + i + ", argument: " + argAt);
                                    }

                                    if (!AuxUtils.isNully(onArgExpand)) {
                                        onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                                    }

                                    _commandTable.opt[argAt.substring(2)] = true;
                                }
                                else {

                                    if (ArguMints.verbose) {
                                        console.log("ArguMints.retort() - add flag at: " + i + ", argument: " + argAt);
                                    }

                                    // allow multiple flags in a single arg.
                                    for (var x = 1; x < argAt.length; ++x) {
                                        _commandTable.flags[argAt.charAt(x)] = true;

                                        if (!AuxUtils.isNully(onArgExpand)) {
                                            onArgExpand(_userArgs[i], argAt.charAt(x), i, _userArgs.length);
                                        }
                                    }
                                }
                                if (_commandTable.opt["minty-verbose"] === true) {
                                    ArguMints.verbose = true;
                                }
                            }
                            else {
                                argAt = expandString(argAt);

                                // if expansion worked.
                                if (AuxUtils.typeName(argAt, true) !== AuxUtils.STR) {
                                    if (ArguMints.verbose) {
                                        console.log("ArguMints.retort() -add object formatted input, parsed..." + argAt);
                                    }
                                    // copy the json key/values into the command table.
                                    // this allows structured input.
                                    copyCommandsFrom(argAt);
                                }
                                else {
                                    if (ArguMints.verbose) {
                                        console.log("ArguMints.retort() -add string arg:" + argAt.length + " chars to argList");
                                    }
                                    _commandTable.argv.push(argAt);
                                }

                                if (!AuxUtils.isNully(onArgExpand)) {
                                    onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                                }
                            }
                        }
                        else {
                            // key value pair
                            // substring rather than split
                            // so we don't end up splitting the
                            // '=' after the first (because that's content)
                            var pts = [ argAt.substring(0, aIdx), argAt.substring(aIdx + 1, argAt.length) ];
                            
                            var pKey = pts[0];
                            // trim each to avoid keys with
                            // spaces in the name should folks be silly
                            setKeyStoreValue(pKey, expandString(pts[1].trim()));

                            if (!AuxUtils.isNully(onArgExpand)) {
                                onArgExpand(_userArgs[i], _commandTable.keyStore[pKey], i, _userArgs.length);
                            }
                            
                            if (ArguMints.verbose) {
                                console.log("ArguMints.retort() -set final retort for" + pts[0] + " to (" + _commandTable.keyStore[pts[0]] + ")");
                            }
                        }
                    }
                    else {
                        if (ArguMints.verbose) {
                            console.log("ArguMints.retort() - adding primitive retort to argList (" + argAt + ")");
                        }
                        _commandTable.argv.push(argAt);

                        // invoke the expansion callback
                        if (!AuxUtils.isNully(onArgExpand)) {
                            onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                        }
                    }

                    // clear opts on each argument expansion if these options are set
                    if (_commandTable.opt["minty-clear-opts"] === true) {
                        // all options to be cleared upon each retort
                        _commandTable.opt = {};
                    }

                    // clear flags on each argument expansion if these options are set
                    if (_commandTable.opt["minty-clear-flags"] === true) {
                        // all options to be cleared upon each retort
                        _commandTable.flags = {};
                    }

                }

                if (ArguMints.verbose === true) {
                    console.log("ArguMints.retort() completed: " + (uLen - retortIndex) + " additional arguments were passed in by the user " + _userArgs.slice(retortIndex));
                }
            }

            if (ArguMints.extensions.hasAggregateOps) {
                ArguMints.extensions.execAggregateOps(_commandTable, false);
            }

            if (_commandTable.opt["minty-dump"] === true) {
                this.argDump();
            }

            _stats.recordStop();
            return this;
        };

        function expandRegEx(regExpStr) {
            var ret = regExpStr;

            if (AuxUtils.typeName(regExpStr) === AuxUtils.STR) {
                regExpStr = regExpStr.trim();
                var tLen = regExpStr.length;
                var first = regExpStr.charAt(0);
                var last = regExpStr.charAt(tLen - 1);

                // only check for reg ex
                // if the string starts with "/"
                if (first === '`' && last === '`') {
                    if (ArguMints.verbose) {
                        console.log("ArguMints.expandRegEx() - checking validity of expression (" + (ret.length - 2) + ") chars");
                    }

                    // second to last char
                    var idx = tLen - 2;

                    var optFlags = "";

                    while (idx > 0) {
                        last = regExpStr.charAt(idx--);
                        if (last == '/') {
                            break;
                        }
                        optFlags = last + optFlags;
                    }

                    if (idx > 1) {
                        var regExStr = regExpStr.substring(2, idx + 1);
                        ret = RegExp(regExStr, optFlags);
                        if (ArguMints.verbose) {
                            console.log("ArguMints.expandRegEx() - optFlags: " + optFlags + ", regExStr: " + regExStr);
                        }
                    }
                }
            }
            return ret;
        }
        /**
         * Returns 'JSON Formatted string' if the string passed in is in proper JSON format.
         */
        function expandJSONString(mightBeJson) {
            if (!AuxUtils.isNully(mightBeJson) && typeof mightBeJson === "string" && mightBeJson.length > 0) {

                // insure the string has no space at the ends.
                var trimmed = mightBeJson.trim();
                var first = trimmed.charAt(0);
                var last = trimmed.charAt(trimmed.length - 1);

                if (ArguMints.verbose) {
                    console.log("ArguMints.expandJSONString() - maybe: " + trimmed);
                }
                // array or object must be the base element
                if ((first === '{' && last === '}') || (first === '[' && last === ']')) {
                    mightBeJson = JSON.parse(trimmed);
                    if (ArguMints.verbose) {
                        console.log("ArguMints.expandJSONString() - expanded: " + mightBeJson);
                    }
                }
            }
            return mightBeJson;
        }

        function expandString(str) {
            if (typeof str == "string" && str !== "") {
                var didMangle = false;

                var newValue = expandFile(str);

                didMangle = newValue != str;
                str = newValue;

                var pathMatches = str.match(_rules.filePathMatcher);
                var plen = !AuxUtils.isNully(pathMatches) ? pathMatches.length : 0;
                if (plen > 0) {
                    for (var i = 0; i < plen; i++) {

                        var match = pathMatches[i];
                        var idx = str.indexOf(match);

                        if (idx > -1) {
                            var actFileName = match;
                            if (actFileName.charAt(0) == '"') {
                                actFileName = actFileName.substring(2, actFileName.length - 1);
                            }
                            else {
                                actFileName = actFileName.substring(1, actFileName.length);
                            }

                            // inject contents
                            str = str.substring(0, idx) + expandString(actFileName) + str.substring(idx + match.length, str.length);
                        }
                    }
                }

                // next attempt to build a regex
                newValue = expandRegEx(str);
                didMangle = newValue !== str;
                str = newValue;

                if (true !== _options.ignoreJson) {
                    // attempt to format as json
                    newValue = expandJSONString(str);
                    didMangle = newValue !== str;
                    str = newValue;
                }
                else {
                    if (ArguMints.verbose) {
                        console.log("Ignore  JSON INPUT");
                    }
                }

                if (!isNaN(str)) {
                    if (_options.treatNumberStringsAsNumbers === true) {
                        str = Number(str);
                        didMangle = true;
                    }
                }
                else if (typeof str === "string") {
                    var xVal = str.toLowerCase();
                    if (!didMangle && _options.treatBoolStringsAsBoolean) {
                        if (xVal == "true") {
                            str = true;
                            didMangle = true;
                        }
                        else if (xVal === "false") {
                            str = false;
                            didMangle = true;
                        }
                    }
                    if (!didMangle && _options.treatNullStringsAsNull) {
                        if (xVal === "null") {
                            str = null;
                            didMangle = true;
                        }
                    }
                    if (!didMangle && _options.treatUndefinedStringsAsUndefined) {
                        if (xVal === AuxUtils.UDF) {
                            str = undefined;
                            didMangle = true;
                        }
                    }
                }
                if (ArguMints.verbose) {
                    console.log("ArguMints.expandString() - expanded: " + str);
                }
            }

            return str;
        }

        function expandArray(arr) {
            if (ArguMints.verbose) {
                console.log("ArguMints.expandArray(" + arr + ")");
            }

            var protoName = AuxUtils.typeName(arr);
            var value;
            if (protoName == AuxUtils.ARR) {
                for (var i = 0; i < arr.length; i++) {
                    value = arr[i];

                    // let inline expansion happen first, then pass through
                    value = expandString(value);

                    // attempt to expand it as an object
                    expandObject(value);

                    arr[i] = value;
                }
            }
            else if (protoName === 'object') {
                expandObject(value);
            }

            return this;
        }
        function expandObject(obj) {
            if (typeof obj !== "object") {
                return obj;
            }

            var protoName = AuxUtils.typeName(obj);
            if (protoName == AuxUtils.ARR) {
                if (ArguMints.verbose) {
                    console.log("ArguMints.expandObject(" + obj + ") - ARRAY ");
                }
                expandArray(obj);
            }
            else {
                if (ArguMints.verbose) {
                    console.log("ArguMints.expandObject(" + obj + ") - OBJECT ");
                }
                // copy the keys to command table.
                for ( var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var keyValue = obj[key];
                        // inline expansion of strings will 
                        // perform the following
                        // 1. file expansion
                        // 2. RegExp expansion
                        // 3. Json Expansion
                        // 4. string expansion of values such as (i.e. -f --option key=value argv0 argv1)
                        keyValue = expandString(keyValue);

                        if (typeof argAt === "object" && !AuxUtils.isNully(keyValue)) {
                            // expand the object result
                            // if this is an array, expandObject will direct to expandArray
                            expandObject(keyValue);
                        }

                        // overwrite current key
                        obj[key] = keyValue;
                    }
                }
            }
            return this;
        } 

        ArguMints.prototype.matches = function(startIdx, endIdx) {
            var ret = null;
            if (!AuxUtils.isNully(_commandTable.matches)){
                ret = _commandTable.matches;
            }

            // bail if options weren't set
            if (AuxUtils.isNully(ret)) {
                return [];
            }

            if (ret.length === 0) {
                return ret.concat();
            }

            if (startIdx === undefined) {
                startIdx = 0;
            }
            if (endIdx === undefined) {
                endIdx = ret.length - 1;
            }

            if (startIdx === 0 && endIdx == (ret.length - 1)) {
                return ret.concat();
            }

            // slice it up and return the sub array
            return ret.slice(startIdx, endIdx);
        };

        // allow for extension of the api
        ArguMints.extensions = new ArguMintsExtensions();
        
        // provide some built ins
        new BuiltIns(ArguMints).initialize();
    }
    
    // Prototype Setup
    ArguMints.verbose = false;
    ArguMints.REPL = false;

    // Export the prototype so others can create instances
    module.exports.ArguMints = ArguMints;

    // Export a Default instance for anyone to use
    module.exports.myArguMints = new ArguMints({
        treatBoolStringsAsBoolean : true,
        treatNullStringsAsNull : true,
        treatRegExStringsAsRegEx : true,
        treatNumberStringsAsNumbers : true,
        treatUndefinedStringsAsUndefined : true,
        enableFileExpansion : true,
        ignoreJson : false
    });
}.call(this));
