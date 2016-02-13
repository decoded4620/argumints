(function() {
    var ArguMintsException = require("./exception.js").ArguMintsException;
    var ArguMintStats = require("./stats.js").ArguMintStats;
    var ArguMintRules = require("./rules.js").ArguMintRules;

    // used for filtering selecting, etc.
    var _ = require("underscore");
    var fs = require("fs");

    //@private
    var _rules = new ArguMintRules();

    var ArguMintsExtensions = (function() {

        function ArguMintsExtensions() {
            var mintyOps = {};
            var mintyKSOps = {};
            var mintyKSOpQueue = [];
            
            var mintyAGOps = {};
            var mintyAGOpQueue = [];
            
            //
            ArguMintsExtensions.prototype.hasKeyStoreOp = function(mintyKSOpStr) {
                return mintyKSOps.hasOwnProperty(mintyKSOpStr) && mintyKSOps[mintyKSOpStr] != null;
            }
            //
            ArguMintsExtensions.prototype.addKeyStoreOp = function(mintyKSOpStr, op) {
                mintyKSOps[mintyKSOpStr] = {
                    name : mintyKSOpStr,
                    op : op,
                    children : []
                };
                mintyKSOpQueue[mintyKSOpQueue.length] = mintyKSOps[mintyKSOpStr];
            }
            //
            ArguMintsExtensions.prototype.hasKeyStoreOps = function() {
                return mintyKSOpQueue.length > 0;
            }

            ArguMintsExtensions.prototype.addAggregateOp = function(mintyAggOpStr, op) {
                mintyAGOps[mintyAggOpStr] = {
                    name : mintyAggOpStr,
                    op : op,
                    children : []
                };
                mintyAGOpQueue[mintyAGOpQueue.length] = mintyAGOps[mintyAggOpStr];
            }
            ArguMintsExtensions.prototype.hasAggregateOps = function() {
                return mintyAGOpQueue.length > 0;
            }
            
            ArguMintsExtensions.prototype.execAggregateOps = function( commandTable, stopOnFirst){
                var retVal = false;

                for (var i = 0; i < mintyAGOpQueue.length; ++i) {
                    var opData = mintyAGOpQueue[i];

                    if (opData != null) {
                        
                        // only execute if the option is enabled.
                        if (commandTable.opt[opData.name] == true) {
                            if (opData != null) {
                                var op = opData.op;
                                if (typeof op == "function") {
                                    retVal = retVal || op(commandTable);
                                }
                            }
                        }
                    }

                    if (retVal && stopOnFirst) {
                        break;
                    }
                }

                return retVal;
            }
            /**
             * Handles either one or all key store operations. returns true if at least
             * one handler returned true. If stopOnFirst is true, the first handler
             * that returns true will stop executing further handlers.
             */
            ArguMintsExtensions.prototype.execKeyStoreOps = function(inputs, inOptions, stopOnFirst) {

                var retVal = false;

                for (var i = 0; i < mintyKSOpQueue.length; ++i) {
                    var opData = mintyKSOpQueue[i];

                    if (opData != null) {
                        // only execute if the option is enabled.
                        if (inOptions[opData.name] == true) {
                            if (opData != null) {
                                var op = opData.op;
                                if (typeof op == "function") {
                                    retVal = op.apply(ArguMints.extensions, inputs);
                                }
                            }
                        }
                    }

                    if (retVal && stopOnFirst) {
                        break;
                    }
                }

                return retVal;
            };
            //
            ArguMintsExtensions.prototype.hasOp = function(mintyOpStr) {
                return mintyOps.hasOwnProperty(mintyOpStr) && mintyOps[mintyOpStr] != null;
            };

            //
            ArguMintsExtensions.prototype.addOp = function(mintyOpStr, op) {
                mintyOps[mintyOpStr] = {
                    name : mintyOpStr,
                    op : op,
                    children : []
                };
            }

            //
            ArguMintsExtensions.prototype.getOp = function(mintyOpStr) {
                return mintyOps[mintyOpStr] == null ? null : mintyOps[mintyOpStr];
            }

            //
            ArguMintsExtensions.prototype.executeOp = function(mintyOpStr) {
                var opData = mintyOps[mintyOpStr]

                (function executeR(inOpData) {
                    if (opData != null) {
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
            }
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

            if (key != null && typeof key == "string") {
                key = key.trim();

                var keyStore = _commandTable.keyStore;
                var opt = _commandTable.opt;
                var currValue = _commandTable.keyStore[key];
                var pName = _rules.protoName(currValue);
                var newPName = _rules.protoName(value);
                var handled = false;
                if (ArguMints.extensions.hasKeyStoreOps()) {
                    // stop on first by default.
                    handled= ArguMints.extensions.execKeyStoreOps([ _commandTable, key, value
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
        }

        ArguMints.prototype.reset = function(newOptions) {

            if (_rules.protoName(newOptions) == ArguMintRules.OBJ) {
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
        }
        /**
         * Internal
         */
        /**
         * Dump the Command Table
         */
        ArguMints.prototype.argDump = function() {

            var dumped = new WeakMap();

            var self = this;
            // dump the contents of the command table, up to 100 levels into the tree.
            // this is an obscene limit, but insures no stack overflow or inifite circular print.
            function dump(o, dMap) {

                ++_dumpDepth;

                var chunk = "    "
                var spacing = "";

                for (var i = 0; i < _dumpDepth; ++i) {
                    spacing += chunk;
                }

                if (ArguMints.verbose) {
                    if (_rules.protoName(o) == ArguMintRules.ARR) {
                        console.log(spacing + "ArguMints.dump(" + _dumpDepth + ") - " + _rules.protoName(o, true) + " - array length: " + o.length);
                    }
                    else {
                        console.log(spacing + "ArguMints.dump(" + _dumpDepth + ") - " + _rules.protoName(o, true));
                    }
                }
                if (o === null) {
                    console.log(spacing + "null");
                }
                else {
                    var objtype = typeof o;
                    if (_rules.protoName(o) == ArguMintRules.ARR) {

                        // avoid circular reference dumping
                        if (!dMap.has(o)) {
                            dMap.set(o, true);

                            for (var i = 0; i < o.length; i++) {

                                var value = o[i];
                                var type = (typeof value);
                                var tag = ArguMints.verbose ? "[" + i + "]  " : "";
                                if (type == "object") {
                                    console.log(spacing + tag + _rules.protoName(value, true) + "(" + type + ")");
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
                                cnt++;
                                var value = o[prop];
                                var type = (typeof value);
                                var pName = _rules.protoName(value, true);

                                if (type == "object") {
                                    if (pName == ArguMintRules.ARR) {
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

                        if (cnt == 0) {
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
        }

        ArguMints.prototype.getUserArgs = function() {
            return _userArgs;
        }
        ArguMints.prototype.getScriptArgs = function() {
            // always return a copy
            return _.clone(_scriptArgs);
        }

        ArguMints.prototype.argc = function() {
            return _commandTable.argv.length;
        }
        ArguMints.prototype.argv = function(atIndex) {
            if ((typeof atIndex) == "number" && atIndex >= 0 && atIndex < _commandTable.argv.length) {
                return _commandTable.argv[atIndex];
            }

            return _.clone(_commandTable.argv);
        }

        ArguMints.prototype.opt = function(optName) {
            if (_rules.protoName(optName) != ArguMintRules.UDF) {
                if (_rules.protoName(_commandTable.opt[optName]) != ArguMintRules.UDF) {
                    return _commandTable.opt[optName];
                }
                return false;
            }
            else {
                // never return the original object.
                return _.clone(_commandTable.opt);
            }
        }

        ArguMints.prototype.keyValue = function(key) {

            if (_rules.protoName(key) == ArguMintRules.STR && key.length > 0) {
                return _commandTable.keyStore[key];
            }
            else {
                // key is null
                return _.clone(_commandTable.keyStore)
            }
        }

        ArguMints.prototype.flag = function(flag) {
            if (flag != null && flag != "") {
                if (_rules.protoName(_commandTable.flags[flag]) != ArguMintRules.UDF) {
                    return _commandTable.flags[flag];
                }

                return false;
            }

            return _.clone(_commandTable.flags);
        }

        function expandFile(tagInput) {

            var ret = tagInput;
            // pass through if not a string or properly formatted, or we are not enabling file expansion
            if (false === _options.enableFileExpansion || _rules.protoName(ret) !== ArguMintRules.STR || ret.charAt(0) !== '@') {
                return ret;
            }
            else {
                if (_fileExpansionChain == null) {
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

                if (cachedValue == null) {
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

                        if (hasContent && ret != null) {
                            ret = ret.trim();
                        }

                        if (ArguMints.verbose) {
                            console.log("ArguMints.expandFileArg() - loaded " + fn + " containing " + (ret.length > 0 ? ret.length : "ZERO") + " characters: " + ret);
                        }

                        if (_commandTable.opt["minty-no-cache"] !== true) {
                            _rules.cacheFileContent(tagInput, ret);
                        }
                        else{
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
                        console.log("ArguMints.expandFile() - returning: " + cachedValue.length + " cached chars for tag: " + tagInput)
                    }

                    ret = cachedValue;
                }

            }
            return ret;
        }

        ArguMints.prototype.pushArg = function(moreArgOrArgs) {
            if (_stats.isRecording() && moreArgOrArgs !== undefined) {
                if (_rules.protoName(moreArgOrArgs) !== ArguMintRules.ARR) {
                    _userArgs[_userArgs.length] = moreArgOrArgs;
                }
                else {
                    _userArgs = _userArgs.concat(moreArgOrArgs);
                }
            }
            return this;
        }

        ArguMints.prototype.insertArg = function(moreArgOrArgs, xArgsFromHere) {

            if (_stats.isRecording() && moreArgOrArgs !== undefined) {
                var idx = _currRetortIndex;
                if (_rules.protoName(xArgsFromHere) === ArguMintRules.NUM) {
                    idx += xArgsFromHere;
                }
                if (idx <= _userArgs.length) {
                    if (_rules.protoName(moreArgOrArgs) !== ArguMintRules.ARR) {
                        _userArgs.splice(idx, 0, moreArgOrArgs);
                    }
                    else {
                        _userArgs = _userArgs.slice(0, idx).concat(moreArgOrArgs).concat(_userArgs.slice(idx));
                    }
                }
            }
            return this;
        }
        // build the command table from the users Arguments
        ArguMints.prototype.retort = function(moreUserArgs, onStart, onArgExpand) {

            _stats.recordStart();
            _currRetortIndex = 0;
            // insure we always have default options
            if (_options == null) {
                _options = {
                    treatBoolStringsAsBoolean : true,
                    treatNullStringsAsNull : true,
                    treatRegExStringsAsRegEx : true,
                    treatNumberStringsAsNumbers : true,
                    treatUndefinedStringsAsUndefined : true,
                    enableFileExpansion : true,
                    ignoreJson : false
                }
            }

            // keep track of arguments we've already retorted to
            var retortIndex = 0;

            // only update user args ONCE. 
            // if the user calls retort multiple times with 
            // concatenations of arguments, we'll append them to
            // userArgs below
            if (_userArgs == null) {
                if (ArguMints.verbose) {
                    console.log("ArguMints.retort() - building initial ArguMints set");
                }
                // table of parsed input arguments.
                _commandTable = {
                    argv : [],
                    flags : {},
                    opt : {},
                    keyStore : {}
                };

                // the second arg is always the path to our script
                // if we're running outside of node
                var secondArg = process.argv[1];

                // if running inside of node REPL
                // the secondArg will either be null, or will be a user argument.
                // validate that the second argument is either 'null', or doesn't contain the location of 
                // the argumints script.
                if (ArguMints.REPL == true) {
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
                    _nodeLocation   = _scriptArgs[0];
                    
                    // path to this script
                    _scriptPath     = _scriptArgs[1];

                    // any additional args
                    _userArgs       = process.argv.slice(2);
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

            if (moreUserArgs != null) {
                _userArgs = _userArgs.concat(moreUserArgs);
            }

            var uLen = _userArgs == null ? 0 : _userArgs.length;

            if (onStart != null) {
                onStart(_userArgs.concat())
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
                    if (argAt == "" || argAt == null) {
                        _commandTable.argv.push(argAt);

                        // invoke the expansion callback
                        if (onArgExpand != null) {
                            onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                        }

                        continue;
                    }

                    var protoStr = _rules.protoName(argAt);

                    // this was expanded into an object
                    if (protoStr == ArguMintRules.OBJ) {
                        if (protoStr != ArguMintRules.REGX) {
                            copyCommandsFrom(argAt);
                        }
                        else {
                            // push regexp onto the arglist
                            _commandTable.argv.push(argAt);
                        }

                        // invoke the expansion callback
                        if (onArgExpand != null) {
                            onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                        }
                    }
                    else if (protoStr == ArguMintRules.STR) {
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


                                    if (onArgExpand != null) {
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

                                        if (onArgExpand != null) {
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
                                if (_rules.protoName(argAt, true) !== ArguMintRules.STR) {
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

                                if (onArgExpand != null) {
                                    onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                                }
                            }
                        }
                        else {
                            // key value pair
                            // substring rather than split
                            // so we don't end up splitting the
                            // '=' after the first (because that's content)
                            var pts = [ argAt.substring(0, aIdx), argAt.substring(aIdx + 1, argAt.length)
                            ];

                            // trim each to avoid keys with
                            // spaces in the name should folks be silly
                            setKeyStoreValue(pts[0], expandString(pts[1].trim()));

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
                        if (onArgExpand != null) {
                            onArgExpand(_userArgs[i], argAt, i, _userArgs.length);
                        }
                    }

                    // clear opts on each argument expansion if these options are set
                    if (_commandTable.opt["minty-clear-opts"] == true) {
                        // all options to be cleared upon each retort
                        _commandTable.opt = {};
                    }

                    // clear flags on each argument expansion if these options are set
                    if (_commandTable.opt["minty-clear-flags"] == true) {
                        // all options to be cleared upon each retort
                        _commandTable.flags = {};
                    }

                }

                if (ArguMints.verbose == true) {
                    console.log("ArguMints.retort() completed: " + (uLen - retortIndex) + " additional arguments were passed in by the user " + _userArgs.slice(retortIndex));
                }
            }
            
            if(ArguMints.extensions.hasAggregateOps){
                ArguMints.extensions.execAggregateOps( _commandTable, false);
            }


            if (_commandTable.opt["minty-dump"] == true) {
                this.argDump();
            }

            _stats.recordStop();
            return this;
        }

        function expandRegEx(regExpStr) {

            var ret = regExpStr;

            if (_rules.protoName(regExpStr) == ArguMintRules.STR) {
                regExpStr = regExpStr.trim();
                var tLen = regExpStr.length;
                var first = regExpStr.charAt(0);
                var last = regExpStr.charAt(tLen - 1);

                // only check for reg ex
                // if the string starts with "/"
                if (first == '`' && last == '`') {
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

            if (mightBeJson != null && typeof mightBeJson == "string" && mightBeJson.length > 0) {

                // insure the string has no space at the ends.
                var trimmed = mightBeJson.trim();
                var first = trimmed.charAt(0);
                var last = trimmed.charAt(trimmed.length - 1);

                if (ArguMints.verbose) {
                    console.log("ArguMints.expandJSONString() - maybe: " + trimmed);
                }
                // array or object must be the base element
                if ((first == '{' && last == '}') || (first == '[' && last == ']')) {
                    mightBeJson = JSON.parse(trimmed);
                    if (ArguMints.verbose) {
                        console.log("ArguMints.expandJSONString() - expanded: " + mightBeJson);
                    }
                }
            }
            return mightBeJson;
        }
        ;

        function expandString(str) {

            if (typeof str == "string" && str !== "") {
                var didMangle = false;

                var newValue = expandFile(str);

                didMangle = newValue != str;
                str = newValue;

                var pathMatches = str.match(_rules.filePathMatcher);
                var plen = pathMatches != null ? pathMatches.length : 0;
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
                else if (typeof str == "string") {
                    var xVal = str.toLowerCase();
                    if (!didMangle && _options.treatBoolStringsAsBoolean) {
                        if (xVal == "true") {
                            str = true;
                            didMangle = true;
                        }
                        else if (xVal == "false") {
                            str = false;
                            didMangle = true;
                        }
                    }
                    if (!didMangle && _options.treatNullStringsAsNull) {
                        if (xVal == "null") {
                            str = null;
                            didMangle = true;
                        }
                    }
                    if (!didMangle && _options.treatUndefinedStringsAsUndefined) {
                        if (xVal == ArguMintRules.UDF) {
                            str = undefined;
                            didMangle = true;
                        }
                    }
                }
                if (ArguMints.verbose){ 
                    console.log("ArguMints.expandString() - expanded: " + str);
                }
            }

            return str;
        }

        function expandArray(arr) {

            if (ArguMints.verbose) {
                console.log("ArguMints.expandArray(" + arr + ")");
            }
            var protoName = _rules.protoName(arr);

            if (protoName == ArguMintRules.ARR) {
                for (var i = 0; i < arr.length; i++) {
                    var value = arr[i];
                    var type = (typeof value);

                    // let inline expansion happen first, then pass through
                    value = expandString(value);

                    // attempt to expand it as an object
                    expandObject(value);

                    arr[i] = value;
                }
            }
            else {
                expandObject(value);
            }

            return this;
        }
        function expandObject(obj) {

            // pass through
            if (typeof obj !== "object") {
                return obj;
            }

            var protoName = _rules.protoName(obj);
            if (protoName == ArguMintRules.ARR) {
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
                    var keyValue = obj[key];
                    // inline expansion of strings will 
                    // perform the following
                    // 1. file expansion
                    // 2. RegExp expansion
                    // 3. Json Expansion
                    // 4. string expansion of values such as (i.e. -f --option key=value argv0 argv1)
                    keyValue = expandString(keyValue);

                    if (typeof argAt == "object" && keyValue != null) {
                        // expand the object result
                        // if this is an array, expandObject will direct to expandArray
                        expandObject(keyValue);
                    }

                    // overwrite current key
                    obj[key] = keyValue;
                }
            }
            return this;
        }

        ArguMints.prototype.matches = function(startIdx, endIdx) {
            var ret = null;
            if (_commandTable.opt["minty-match-argv"]) {
                ret = _commandTable.argvmatch;
            }
            else if (_commandTable.opt["minty-match-kv"]) {
                ret = _commandTable.kvmatch;
            }

            // bail if options weren't set
            if (ret == null) {
                return [];
            }

            if (ret.length == 0) {
                return ret.concat();
            }

            if (startIdx === undefined) {
                startIdx = 0;
            }
            if (endIdx === undefined) {
                endIdx = ret.length - 1;
            }

            if (startIdx == 0 && endIdx == (ret.length - 1)) {
                return ret.concat();
            }

            // slice it up and return the sub array
            return ret.slice(startIdx, endIdx);
        }

        ArguMints.extensions = new ArguMintsExtensions();
      
        
        ArguMints.extensions.addAggregateOp("minty-match-kv", function(commandTable){
            if(commandTable.keyStore){

                // copy the argv
                var kvStore = commandTable.keyStore;
                var filtered = [];
                var regExps = [];
                var curr = null;
                for ( var i in kvStore) {
                    curr = kvStore[i];
                    if (_rules.protoName(curr, true) == "RegExp") {
                        regExps[regExps.length] = curr;
                    }
                }

                var rLen = regExps.length;
                //find regex values
                for (var i = 0; i < rLen; i++) {
                    var currRegExp = regExps[i];
                    for ( var j in kvStore) {
                        var currArgAsStr = String(kvStore[j]);

                        if (currArgAsStr != null && currArgAsStr != "") {

                            var moreResults = currArgAsStr.match(currRegExp);

                            if (moreResults != null && moreResults.length > 0) {
                                filtered = filtered.concat(moreResults);
                            }
                        }
                    }
                }

                commandTable.kvmatch = filtered;
            }
        });
        ArguMints.extensions.addAggregateOp("minty-match-argv", function(commandTable){

            if (commandTable.argv) {
                // copy the argv
                var argv = commandTable.argv.concat();
                var argc = commandTable.argv.length;
                var filtered = [];
                var regExps = [];
                var curr = null;

                for (var i = 0; i < argc; ++i) {
                    curr = argv[i];
                    if (_rules.protoName(curr, true) == "RegExp") {
                        regExps[regExps.length] = curr;
                        // remove and step back
                        argv.splice(i, 1);
                        --i;
                    }
                }
                argc = argv.length;
                var rLen = regExps.length;
                //find regex values
                for (var i = 0; i < rLen; ++i) {
                    var currRegExp = regExps[i];
                    for (var j = 0; j < argc; ++j) {
                        var currArgAsStr = String(argv[j]);

                        if (currArgAsStr != null && currArgAsStr != "") {

                            var moreResults = (currArgAsStr.match(currRegExp));

                            if (moreResults != null && moreResults.length > 0) {
                                filtered = filtered.concat(moreResults);
                            }
                        }
                    }

                }
                commandTable.argvmatch = filtered;
            } 
        });
        ArguMints.extensions.addKeyStoreOp("minty-append-dup-keys", function(commandTable, key, value) {

            //
            // @private
            function appendNumberForKey(inStore, inOpt, inKey, inValue) {

                var called = false;
                inKey = inKey.trim();

                if (inStore[inKey] === undefined) {
                    inStore[inKey] = 0;
                }

                for ( var x in inOpt) {

                    var f = ArguMints.extensions.getOp(x);
                    if (f != null) {
                        f.op(inStore, inKey, inValue);
                        called = true;
                        break;
                    }
                }
                if (!called) {
                    inStore[inKey] += inValue;
                }
            }
            
            var handled = false;
            var keyStore = commandTable.keyStore;
            var currValue = keyStore[key];
            var pName = _rules.protoName(currValue);
            var newPName = _rules.protoName(value);

            if (currValue !== undefined) {
                if (pName == ArguMintRules.ARR) {
                    if (newPName == ArguMintRules.ARR) {
                        currValue = currValue.concat(value);
                        keyStore[key] = value;
                        handled = true;
                    }
                    else {
                        // if new value isn't undefined push it on
                        if (value !== undefined) {
                            currValue[currValue.length] = value;
                        }
                        // sanity
                        keyStore[key] = currValue;
                        handled = true;
                    }
                }
                else if (pName != ArguMintRules.UDF) {
                    if (pName == ArguMintRules.STR) {
                        if (newPName != ArguMintRules.UDF) {
                            // concat and coerce value to 'string'
                            keyStore[key] += value;
                            handled = true;
                        }
                    }
                    else if (pName == ArguMintRules.NUM) {
                        if (newPName == ArguMintRules.NUM) {
                            appendNumberForKey(keyStore, commandTable.opt, key, value);
                            handled = true;
                        }
                        else if (newPName == ArguMintRules.STR) {
                            keyStore[key] += value;
                            handled = true;
                        }
                    }
                }
            }
            else {
                if (newPName == ArguMintRules.NUM) {
                    appendNumberForKey(keyStore, commandTable.opt, key, value);
                    handled = true;
                }
            }

            return handled;
        });

        ArguMints.extensions.addOp("minty-op-add", function(keyStore, key, value) {
            keyStore[key.trim()] += value;
            return this;
        });

        // add extensions

        ArguMints.extensions.addOp("minty-op-sub", function(keyStore, key, value) {
            keyStore[key.trim()] -= value;

            return this;
        });

        ArguMints.extensions.addOp("minty-op-mul", function(keyStore, key, value) {
            keyStore[key.trim()] *= value;
            return this;
        });

        ArguMints.extensions.addOp("minty-op-div", function(keyStore, key, value) {
            keyStore[key.trim()] /= value;
            return this;
        });

        ArguMints.extensions.addOp("minty-op-sqrt", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.sqrt(value);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-sqr", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.pow(value, 2);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-ln", function(keyStore, key, value) {

            keyStore[key.trim()] += Math.log(value);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-cos", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.cos(value);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-sin", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.sin(value);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-tan", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.tan(value);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-atan", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.atan(value);
            return this;
        });

        ArguMints.extensions.addOp("minty-op-exp", function(keyStore, key, value) {
            keyStore[key.trim()] += Math.exp(value);
            return this;
        });
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
