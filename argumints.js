(function() {
    var fs = require('fs');

    // token used to call priviledged ArguMints functions
    // even tho they are public
    var nonce = {};

    // Prototype Setup
    ArguMints.prototype.retort = AMRetort;
    ArguMints.prototype.getUserArgs = AMGetUserArgs;
    ArguMints.prototype.getStats = AMGetStats;
    ArguMints.prototype.getScriptArgs = AMGetScriptArgs;
    ArguMints.prototype.argv = AMGetArgV;
    ArguMints.prototype.opt = AMGetOpt;
    ArguMints.prototype.keyValue = AMGetKeyValue;
    ArguMints.prototype.flag = AMGetFlag;
    ArguMints.prototype.matches = AMGetMatches;
    ArguMints.prototype.reset = AMReset;

    ArguMints.prototype.expandJSONString = AMExpandJSONString;
    ArguMints.prototype.expandRegEx = AMExpandRegExp;
    ArguMints.prototype.expandFile = AMExpandFile;
    ArguMints.prototype.expandObject = AMExpandObject;
    ArguMints.prototype.expandArray = AMExpandArray;
    ArguMints.prototype.expandString = AMExpandString;

    ArguMints.prototype.argDump = AMArgDump;
    ArguMints.prototype.innerDump = AMDump;
    ArguMints.prototype.wheresMyNode = AMWhereIsNode;
    ArguMints.prototype.pushArg  = AMPushArgument;
    ArguMints.prototype.insertArg  = AMInsertArgument;
    ArguMints.verbose = false;
    
    
    

    //@private
    /**
     * used to verify function callers for some of the internal methods we
     * don't want external callers to call :).
     */
    function checkNonce(token, throwMessage) {
        if (nonce !== token) {
            throw new ArguMintsException(throwMessage);
        }
    }

    //@private
    function ArguMintsException(message) {
        this.message = message;
        this.name = "ArguMintsException";
    }
    
    function ArguMintsExtensions(){
        var mintyOps = {};

        ///
        this.addMintyOp = function(mintyOpStr, op){
            mintyOps[mintyOpStr] = op;
        }
        
        this.getMintyOp = function(mintyOpStr){
            return mintyOps[mintyOpStr];
        }
    }

    /**
     * Stats Object records retorts, ops, and performance
     */
    function ArguMintStats() {
        var _ops = 0;
        var _retorts = 0;
        var _bickerTime = 0;
        var _debateStart = (new Date()).getTime();

        var _isRecording = false;
        this.recordStart = function() {
            _isRecording = true;
            _debateStart = (new Date()).getTime();
            _retorts++;
        };

        this.recordOp = function() {
            _ops++;
        }

        this.recordStop = function() {
            _isRecording = false;
            var now = (new Date()).getTime();
            _bickerTime += (now - _debateStart);
            _debateStart = now;
        }
        this.isRecording = function(){
            return _isRecording;
        }
        this.reset = function() {
            _ops = 0;
            _retorts = 0;
            _bickerTime = 0;
            _debateStart = (new Date()).getTime();
        }
        //    MyClass.prototype = {
        //            get value(){
        //                return this._value;
        //            },
        //            set value(val){
        //                this._value = val;
        //            }
        //        };
        this.__defineGetter__("ops", function() {
            return _ops;
        });

        this.__defineGetter__("retorts", function() {
            return _retorts;
        });

        this.__defineGetter__("bickerTime", function() {
            return _bickerTime;
        });

        this.__defineGetter__("debateStart", function() {
            return _bickerTime;
        });

        this.__defineSetter__("bickerTime", function(value) {
            _bickerTime = value;
        });
    }

    //@private
    function ArguMintRules() {
        this.fileExpansionPathMatcher = new RegExp("(^|\\s)(@(?:/?[^/\",@\\s]*)+/?|\"@(/?[^/\",@\\r\\n\\f\\t]*)+/?\")",
                "gm");
        this.fileCache = null;

        // private vars
        var UDF = 'undefined';
        var FUN = 'Function';

        // returns the prototype name for an Object. I.E.  rules.protoName([]); // Array
        this.protoName = function(protoVal, getFuncNames) {
            if (protoVal != null) {
                if (protoVal.constructor != null) {
                    protoVal = protoVal.constructor.name
                }
            }
            else {
                if (protoVal === undefined) {
                    protoVal = UDF;
                }
                else if (protoVal === null) {
                    protoVal = String(protoVal);
                }
            }

            return protoVal;
        };

        this.cacheFileContent = function(tag, content) {
            if (ArguMints.verbose) console.log("ArguMintRules.cacheFileContent(" + tag + ")");
            if (tag != null && tag !== '' && tag !== undefined) {

                if (this.fileCache === null) {
                    this.fileCache = {}
                }

                this.fileCache[tag] = content;
            }
        };

        this.getFileCache = function(tag) {
            var ret = null;
            if (tag != null && tag !== '') {
                if (this.fileCache != null) {
                    ret = this.fileCache[tag];

                    if (ret != null) {
                        if (ArguMints.verbose) console.log("ArguMintRules.getFileCache(tag: " + tag + ") - "
                                + ret.length);
                    }
                }
            }
            return ret;
        }
    }
    

    /**
     * Constructor
     * 
     * @param options
     */
    function ArguMints(options) {
        this.options = options;
        this.argDumpDepth = 0;
        this.rules = new ArguMintRules();
        this.stats = new ArguMintStats();
        this.extensions = new ArguMintsExtensions();
        this.commandTable = null;
        this.scriptArgs = null;
        this.userArgs = null;
        this.nodeLoc = null;
        this.currRetortIndex = 0;
        this.extensions.addMintyOp('minty-op-add', function(keyStore, key, value){
            keyStore[key.trim()] += value;
            return this;
        });
        
        // add extensions
        
        this.extensions.addMintyOp('minty-op-sub', function(keyStore, key, value){
            keyStore[key.trim()] -= value;
            
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-mul', function(keyStore, key, value){
            keyStore[key.trim()] *= value;
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-div', function(keyStore, key, value){
            keyStore[key.trim()] /= value;
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-sqrt', function(keyStore, key, value){
            keyStore[key.trim()] += Math.sqrt(value);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-sqr', function(keyStore, key, value){
            keyStore[key.trim()] += Math.pow(value,2);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-ln', function(keyStore, key, value){
            keyStore[key.trim()] += Math.log(value);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-cos', function(keyStore, key, value){
            keyStore[key.trim()] += Math.cos(value);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-sin', function(keyStore, key, value){
            keyStore[key.trim()] += Math.sin(value);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-tan', function(keyStore, key, value){
            keyStore[key.trim()] += Math.tan(value);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-atan', function(keyStore, key, value){
            keyStore[key.trim()] += Math.atan(value);
            return this;
        });
        
        this.extensions.addMintyOp('minty-op-exp', function(keyStore, key, value){
            keyStore[key.trim()] += Math.exp(value);
            return this;
        });
        
        this.appendNumberForKey = function(_keyStore, _opt, key, value, token){
            checkNonce(token, "Cannot call appendNumberForKey() externally");
            var called = false;
            key = key.trim();
            
            if(_keyStore[key] === undefined){
                _keyStore[key] = 0;
            }
            
            for(var x in _opt){
                var f= this.extensions.getMintyOp(x);
                
                if( undefined !== f){
                    f( _keyStore, key, value );
                    called = true;
                    break;
                }
            }
            if(!called){
                _keyStore[key] += value;
            }
            return this;
        }

        // sets a value, or appends it if our options 
        // specify
        this.setKeyStoreValue = function(key, value, token) {

            checkNonce(token, "Cannot call setKeyStoreValue externally!");
            key == null ? null : key.trim();

            if (key != null) {

                var _keyStore = this.commandTable._keyStore;
                var _opt = this.commandTable._opt;
                var currValue = this.commandTable._keyStore[key.trim()];
                var pName = this.rules.protoName(currValue);
                var newPName = this.rules.protoName(value);
                
                if (_opt['minty-append-dup-keys'] === true) {


                    if (currValue !== undefined) {
                        if (pName === 'Array') {
                            if (newPName == 'Array') {
                                currValue = currValue.concat(value);
                                _keyStore[key.trim()] = value;
                            }
                            else {
                                // if new value isn't undefined push it on
                                if (value !== undefined) {
                                    currValue.push(value);
                                }
                                // sanity
                                _keyStore[key.trim()] = currValue;
                            }
                        }
                        else if (pName !== 'undefined') {
                            if (pName === 'String') {
                                if (newPName !== 'undefined') {
                                    // concat and coerce value to 'string'
                                    _keyStore[key.trim()] += value;
                                }
                                else {
                                    //do nothing here
                                }
                            }
                            else if( pName === 'Number'){
                                if(newPName === 'Number' ){
                                    this.appendNumberForKey(_keyStore, _opt, key, value, nonce);
                                }
                                else if( newPName === 'String'){
                                     _keyStore[key.trim()] += value;
                                }
                                else{
                                    _keyStore[key.trim()] = currValue;
                                }
                            }
                            else {
                                _keyStore[key.trim()] = currValue;
                            }
                        }
                        else{
                            _keyStore[key.trim()] = currValue;
                        }
                    }
                    else {
                        if(newPName === 'Number'){
                            this.appendNumberForKey(_keyStore, _opt, key, value, nonce);
                        }
                        else{
                            _keyStore[key.trim()] = value;
                        }
                    }
                }
                else {
                    _keyStore[key.trim()] = value;
                }
            }
            return this;
        }
        /**
         * Copy the 'commandTable' object to otherObject
         */
        this.copyTo = function(otherObject, overwrite) {
            if (otherObject != null) {
                for ( var key in this.commandTable._keyStore) {
                    if (overwrite || otherObject[key] === undefined) {
                        this.stats.recordOp();
                        otherObject[key] = this.commandTable._keyStore[key];
                    }
                }
            }

            return this;
        }

        this.copyCommandsFrom = function(copyFrom) {
            this.stats.recordOp();
            // expand for any file content in the json
            this.expandObject(copyFrom, nonce);

            // copy the keys to command table.
            for ( var key in copyFrom) {
                this.stats.recordOp();
                this.setKeyStoreValue(key, copyFrom[key], nonce);
            }

            return this;
        }
    }

    function AMGetStats() {
        return {
            ops : this.stats.ops,
            retorts : this.stats.retorts,
            bickerTime : this.stats.bickerTime,
            debateStart : this.stats.debateStart
        };
    }

    function AMReset(newOptions) {

        if (this.rules.protoName(newOptions) === 'Object') {
            this.options = newOptions;
        }
        this.stats.reset();
        this.retortIndex = 0;
        this.commandTable = null;
        this.scriptArgs = null;
        this.userArgs = null;
        this.nodeLoc = null;

        
        return this;
        // NOTE: we don't kill 'options' here
        // so the user can 'retort' again with thame options.
    }
    /**
     * Internal
     */
    function AMDump(o, maxDepth, token) {
        checkNonce(token, "dump() - call not allowed externally!");

        ++this.argDumpDepth;
        var chunk = "    "
        var spacing = "";

        for (var i = 0; i < this.argDumpDepth; ++i) {
            spacing += chunk;
        }

        if (ArguMints.verbose) {
            if (this.rules.protoName(o) === 'Array') {
                console.log(spacing + "ArguMints.dump() - " + this.rules.protoName(o, true) + " - array length: "
                        + o.length);
            }
            else {
                console.log(spacing + "ArguMints.dump() - " + this.rules.protoName(o, true));
            }
        }
        if (this.argDumpDepth < maxDepth) {
            if (o === null) {
                console.log(spacing + "null");
            }
            else {
                var objtype = typeof o;
                if (this.rules.protoName(o) === 'Array') {
                    for (var i = 0; i < o.length; i++) {
                        var value = o[i];
                        var type = (typeof value);
                        var tag = ArguMints.verbose ? "[" + i + "]  " : "";
                        if (type === 'object') {
                            console.log(spacing + tag + this.rules.protoName(value, true) + "(" + type + ")");
                            console.log((spacing + chunk + "--------------------------------------------------------")
                                    .substring(0, 50));
                            this.innerDump(value, maxDepth, nonce);
                            console.log((spacing + chunk + "--------------------------------------------------------")
                                    .substring(0, 50));

                        }
                        else {
                            if (type === 'string') {
                                console.log(spacing + tag + (value.split('\r\n').join('\r\n     ' + spacing)));
                            }
                            else {
                                console.log(spacing + tag + value + "(" + type + ")");
                            }
                        }
                    }
                }
                else if (objtype === 'object') {
                    var cnt = 0;
                    for ( var prop in o) {
                        cnt++;
                        var value = o[prop];
                        var type = (typeof value);
                        var pName = this.rules.protoName(value, true);

                        if (type === 'object') {
                            if (pName == 'Array') {
                                console.log(spacing + "[" + prop + "] " + pName + ", length: " + value.length);
                            }
                            else {
                                console.log(spacing + "[" + prop + "] " + pName + "(" + type + ")");
                            }
                            console.log((spacing + chunk + "--------------------------------------------------------")
                                    .substring(0, 50));
                            this.innerDump(value, maxDepth, nonce);
                            console.log((spacing + chunk + "--------------------------------------------------------")
                                    .substring(0, 50));

                        }
                        else {
                            console.log(spacing + prop + "=" + value + "(" + type + ")");
                        }
                    }

                    if (cnt == 0) {
                        console.log(spacing + "\t{}");
                    }
                }
                else {
                    if (type === 'string') {

                        console.log(spacing + '[' + (o.split('\r\n').join(spacing + '     \r\n')) + ']');
                    }
                    else {
                        console.log(spacing + '[' + o + ']');
                    }
                }
            }
        }
        else {
            if (ArguMints.verbose) {
                console.log("ERROR: max depth (" + this.argDumpDepth + ") reached!");
            }
            --this.argDumpDepth;
            return;
        }
        --this.argDumpDepth;
    }
    /**
     * Dump the Command Table
     */
    function AMArgDump(maxDepth) {

        if (typeof maxDepth === 'undefined') {
            maxDepth = 100;
        }
        // dump the contents of the command table, up to 100 levels into the tree.
        // this is an obscene limit, but insures no stack overflow or inifite circular print.
        this.innerDump(this.commandTable, maxDepth, nonce);

        return this;
    }
    ;

    function AMWhereIsNode() {
        return this.nodeLoc;
    }

    function AMGetScriptArgs() {
        return this.scriptArgs;
    }

    function AMGetArgV(atIndex) {
        if (typeof atIndex == 'number' && atIndex >= 0 && atIndex < this.commandTable._argv.length) {
            return this.commandTable._argv[atIndex];
        }

        return this.commandTable._argv.concat();
    }
    function AMGetOpt(opt) {
        if (this.rules.protoName(opt) !== 'undefined') {
            if (this.rules.protoName(this.commandTable._opt[opt]) !== 'undefined') {
                return this.commandTable._opt[opt];
            }
            return false;
        }
        else {

            // never return the original object.
            var copy = {};
            for ( var key in this.commandTable._opt) {
                copy[key] = this.commandTable._opt[key];
            }

            return copy;
        }
    }
    function AMGetKeyValue(key) {
        if (this.rules.protoName(key) === 'String' && key.length > 0) {
            return this.commandTable._keyStore[key];
        }
    }
    function AMGetFlag(flag) {
        if (this.rules.protoName(this.commandTable._flags[flag]) !== 'undefined') {
            return this.commandTable._flags[flag];
        }

        return false;
    }
    function AMGetUserArgs() {
        return this.userArgs;
    }

    function AMExpandFile(tagInput, token) {

        checkNonce(token, "ArguMints.expandFile() - call not allowed externally!");
        this.stats.recordOp();
        var ret = tagInput;
        // pass through if not a string or properly formatted, or we are not enabling file expansion
        if (false === this.options.enableFileExpansion || this.rules.protoName(ret) !== 'String'
                || ret.charAt(0) !== '@') {
            this.stats.recordOp();
            return ret;
        }
        else {
            if (this.fileExpansionChain == null) {
                this.fileExpansionChain = [];
            }

            if (this.fileExpansionChain.indexOf(tagInput) != -1) {
                if (ArguMints.verbose) {
                    console.log("ArguMints.expandFileArg() - Expansion chain: " + this.fileExpansionChain);
                }

                throw new ArguMintsException("ArguMints.expandFileArg() - Circular File Expansion Detected!: "
                        + "Expansion chain: " + this.fileExpansionChain.join("->"));
            }

            this.fileExpansionChain.push(tagInput);
            this.stats.recordOp();
            var cachedValue = this.rules.getFileCache(tagInput);

            this.stats.recordOp();

            if (cachedValue == null) {
                //this is a file, load it synchronously here
                //process its contents as utf8
                var fn = ret.substring(1);
                if (ArguMints.verbose) console.log("ArguMints.expandFileArg(" + fn + ") - "
                        + this.fileExpansionChain.join('->'));

                try {

                    // Query the entry
                    stats = fs.lstatSync(fn);
                    // Is it a directory?
                    var hasContent = stats.isFile() && !stats.isDirectory();
                    // overwrite our value with the data from the file and continue
                    ret = hasContent ? fs.readFileSync(fn, 'utf8') : '';
                    if (hasContent && ret != null) {
                        ret = ret.trim();
                    }

                    if (ArguMints.verbose) console.log("ArguMints.expandFileArg() - loaded " + fn + " containing "
                            + (ret.length > 0 ? ret.length : 'ZERO') + " characters: " + ret);

                    if (this.commandTable._opt['minty-no-cache'] !== true) {
                        this.rules.cacheFileContent(tagInput, ret);
                    }
                    else if (ArguMints.verbose) console.log("ArguMints.expandFile() not caching file at: " + tagInput
                            + ", caching is off");
                }
                catch (e) {
                    console.log(e);
                }
            }
            else {
                if (ArguMints.verbose) console.log("ArguMints.expandFile() - returning: " + cachedValue.length
                        + " cached chars for tag: " + tagInput);
                ret = cachedValue;
            }

        }
        return ret;
    }
    
    function AMPushArgument(moreArgOrArgs){
        if(this.stats.isRecording() && moreArgOrArgs !== undefined){
            if(this.rules.protoName(moreArgOrArgs) !== 'Array'){
                this.userArgs[this.userArgs.length] = moreArgOrArgs;
            }
            else{
                this.userArgs = this.userArgs.concat(moreArgOrArgs);
            }
        }
        return this;
    }
    
    function AMInsertArgument(moreArgOrArgs, xArgsFromHere){
        
        console.log("insert(" + moreArgOrArgs + ", "+ xArgsFromHere);
        if(this.stats.isRecording() && moreArgOrArgs !== undefined){
            var idx = this.currRetortIndex;
            console.log("IDX: " + idx + ", " + this.userArgs.length);
            if(this.rules.protoName(xArgsFromHere) === 'number'){
                idx+=xArgsFromHere;
            }
            if(idx <= this.userArgs.length){
                if(this.rules.protoName(moreArgOrArgs) !== 'Array'){
                    this.userArgs.splice(idx, 0, moreArgOrArgs);
                }
                else{
                    this.userArgs = this.userArgs.slice(0, idx).concat(moreArgOrArgs).concat(this.userArgs.slice(idx))
                }
                
                console.log("NEW ARGS: " + this.userArgs);
            }
        }
        return this;
    }
    // build the command table from the users Arguments
    function AMRetort(moreUserArgs, onStart, onArgExpand) {

        this.stats.recordStart();

        // insure we always have default options
        if (this.options == null) {
            this.options = {
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
        this.currRetortIndex = 0;
        this.stats.recordOp();

        // only update user args ONCE. 
        // if the user calls retort multiple times with 
        // concatenations of arguments, we'll append them to
        // userArgs below
        if (this.userArgs == null) {
            if (ArguMints.verbose) {
                console.log("ArguMints.retort() -building initial ArguMints set");
            }
            // table of parsed input arguments.
            this.commandTable = {
                _argv : [],
                _flags : {},
                _opt : {},
                _keyStore : {}
            };

            // the second arg is always the path to our script
            // if we're running outside of node
            var secondArg = process.argv[1];

            // if running inside of node command line process
            // the secondArg will either be null, or will be a user argument.
            // validate that the second argument is either 'null', or doesn't contain the location of 
            // the argumints script.
            if (secondArg == null || (secondArg.indexOf('@') != 0 && secondArg.indexOf('.js') == -1)) {
                this.scriptArgs = process.argv.slice(0, 1);

                // path to node installation
                this.nodeLoc = this.scriptArgs[0];

                // we're not running a script if we get here, we're inside of node.
                this.scriptPath = null;

                // any additional args
                this.userArgs = process.argv.slice(1);
            }
            // otherwise the first two args we always scrape
            else {
                this.scriptArgs = process.argv.slice(0, 2);

                // path to node installation
                this.nodeLoc = this.scriptArgs[0];
                // path to this script
                this.scriptPath = this.scriptArgs[1];

                // any additional args
                this.userArgs = process.argv.slice(2);
            }

            retortIndex = 0;
        }
        else {
            if (ArguMints.verbose) {
                console.log("ArguMints.retort() -Adding Additional arguments to existing ArguMints set");
            }

            // start from where we left off, unless reset is called.
            retortIndex = this.userArgs.length;
        }

        if (moreUserArgs != null) {
            this.userArgs = this.userArgs.concat(moreUserArgs);
        }

        var uLen = this.userArgs == null ? 0 : this.userArgs.length;

        if(onStart != null){onStart(this.userArgs.concat())}
        
        if (uLen > retortIndex) {
            // userArgs are split on '=' to avoid forcing order
            // NOTE: we don't use uLen in the for loop because
            // args may be modified mid retort!
            for (var i = retortIndex; i < this.userArgs.length; ++i) {
                
                this.currRetortIndex++;
                
                this.stats.recordOp();

                // clear this after processing each argument
                this.fileExpansionChain = null;

                // current arg, copied so it can be mangled.
                // this.userArgs[i] will never change from its orginal value.
                var argAt = this.userArgs[i];

                // do the full expansion test first
                argAt = this.expandString(argAt, nonce);

                // if file expansion results in null or empty string,
                // push this value onto the command args list now and short circuit.
                if (argAt === '' || argAt == null) {
                    this.commandTable._argv.push(argAt);
                    
                    // invoke the expansion callback
                    if (onArgExpand != null) {
                        onArgExpand(this.userArgs[i], argAt, i, this.userArgs.length );
                    }
                    
                    continue;
                }

                var protoStr = this.rules.protoName(argAt);

                // this was expanded into an object
                if (protoStr === 'Object') {
                    if (protoStr !== 'RegExp') {
                        this.copyCommandsFrom(argAt);
                    }
                    else {
                        // push regexp onto the arglist
                        this.commandTable._argv.push(argAt);
                    }
                    
                    // invoke the expansion callback
                    if (onArgExpand != null) {
                        onArgExpand(this.userArgs[i], argAt, i, this.userArgs.length );
                    }
                }
                else if (protoStr === 'String') {
                    // first index of assignment operator in argument
                    var aIdx = argAt.indexOf('=');
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
                        if (argAt.charAt(0) === '-') {
                            // set as 'true'
                            if (argAt.charAt(1) === '-') {

                                if (ArguMints.verbose) {
                                    console.log("ArguMints.retort() - add option at: " + i + ", argument: " + argAt);
                                }
                                
                                var sub = argAt.substring(2);
                                
                                if (onArgExpand != null) {
                                    onArgExpand(this.userArgs[i], argAt, i, this.userArgs.length );
                                }
                                
                                this.commandTable._opt[sub] = true;
                            }
                            else {
                                if (ArguMints.verbose) {
                                    console.log("ArguMints.retort() - add flag at: " + i + ", argument: " + argAt);
                                }

                                // allow multiple flags in a single arg.
                                for (var x = 1; x < argAt.length; ++x) {
                                    
                                    this.commandTable._flags[argAt.charAt(x)] = true;
                                    
                                    if (onArgExpand != null) {
                                        onArgExpand(this.userArgs[i], argAt.charAt(x), i, this.userArgs.length );
                                    }
                                }

                            }
                            if (this.commandTable._opt['minty-verbose'] === true) {
                                ArguMints.verbose = true;
                            }
                        }
                        else {
                            argAt = this.expandString(argAt, nonce);

                            // if expansion worked.
                            if (this.rules.protoName(argAt, true) !== 'String') {
                                if (ArguMints.verbose) console.log("ArguMints.retort() -add object formatted input, parsed..." + argAt);
                                // copy the json key/values into the command table.
                                // this allows structured input.
                                this.copyCommandsFrom(argAt);
                            }
                            else {
                                if (ArguMints.verbose) console.log("ArguMints.retort() -add string arg:" + argAt.length
                                        + " chars to argList");
                                this.commandTable._argv.push(argAt);
                            }
                            
                            if (onArgExpand != null) {
                                onArgExpand(this.userArgs[i], argAt, i, this.userArgs.length );
                            }
                        }
                    }
                    else {
                        // key value pair
                        // substring rather than split
                        // so we don't end up splitting the
                        // '=' after the first (because that's content)
                        var pts = [ argAt.substring(0, aIdx), argAt.substring(aIdx + 1, argAt.length) ];

                        // trim each to avoid keys with
                        // spaces in the name should folks be silly
                        this.setKeyStoreValue(pts[0], this.expandString(pts[1].trim(), nonce), nonce);
                        
                        
                        if (ArguMints.verbose) console.log("ArguMints.retort() -set final retort for" + pts[0] + " to ("
                                + this.commandTable._keyStore[pts[0]] + ")");
                    }
                }
                else {
                    if (ArguMints.verbose) console.log("ArguMints.retort() - adding primitive retort to argList ("
                            + argAt + ")");
                    this.commandTable._argv.push(argAt);
                    
                 // invoke the expansion callback
                    if (onArgExpand != null) {
                        onArgExpand(this.userArgs[i], argAt, i, this.userArgs.length );
                    }
                }
                
                

                // clear opts on each argument expansion if these options are set
                if (this.commandTable._opt['minty-clear-opts'] == true) {
                    // all options to be cleared upon each retort
                    this.commandTable._opt = {};
                }

                // clear flags on each argument expansion if these options are set
                if (this.commandTable._opt['minty-clear-flags'] == true) {
                    // all options to be cleared upon each retort
                    this.commandTable._flags = {};
                }
                
            }

            if (ArguMints.verbose === true) {
                console.log("ArguMints.retort() completed: " + (uLen - retortIndex)
                        + " additional arguments were passed in by the user " + this.userArgs.slice(retortIndex));
            }
        }

        if (this.commandTable._argv) {
            if (this.commandTable._opt['minty-match-argv'] == true) {
                // copy the argv
                var argv = this.commandTable._argv.concat();
                var argc = this.commandTable._argv.length;
                var filtered = [];
                var regExps = [];
                var curr = null;

                for (var i = 0; i < argc; i++) {
                    curr = argv[i];
                    if (this.rules.protoName(curr, true) === 'RegExp') {
                        regExps[regExps.length] = curr;
                        // remove and step back
                        argv.splice(i, 1);
                        --i;
                    }
                }

                argc = argv.length;
                var rLen = regExps.length;
                //find regex values
                for (var i = 0; i < rLen; i++) {
                    var currRegExp = regExps[i];
                    for (var j = 0; j < argc; j++) {
                        var currArgAsStr = String(argv[j]);

                        if (currArgAsStr != null && currArgAsStr != '') {

                            var moreResults = (currArgAsStr.match(currRegExp));

                            if (moreResults != null && moreResults.length > 0) {
                                filtered = filtered.concat(moreResults);
                            }
                        }
                    }

                }

                this.commandTable._argvmatch = filtered;
            }

            if (this.commandTable._opt['minty-match-kv'] == true) {
                // copy the argv
                var kvStore = this.commandTable._keyStore;
                var filtered = [];
                var regExps = [];
                var curr = null;
                for ( var i in kvStore) {
                    curr = kvStore[i];
                    if (this.rules.protoName(curr, true) === 'RegExp') {
                        regExps[regExps.length] = curr;
                    }
                }

                var rLen = regExps.length;
                //find regex values
                for (var i = 0; i < rLen; i++) {
                    var currRegExp = regExps[i];
                    for ( var j in kvStore) {
                        var currArgAsStr = String(kvStore[j]);

                        if (currArgAsStr != null && currArgAsStr != '') {

                            var moreResults = (currArgAsStr.match(currRegExp));

                            if (moreResults != null && moreResults.length > 0) {
                                filtered = filtered.concat(moreResults);
                            }
                        }
                    }
                }

                this.commandTable._kvmatch = filtered;
            }

        }

        if (this.commandTable._opt['minty-dump'] == true) {
            this.argDump();
        }

            
        this.stats.recordStop();
        return this;
    }

    function AMExpandRegExp(testForRegExp) {

        var first = testForRegExp.charAt(0);
        var ret = testForRegExp;
        // only check for reg ex
        // if the string starts with '/'
        if (first === '/') {
            if (ArguMints.verbose) console.log("ArguMints.expandRegEx() - checking validity (" + ret + ")");
            var idx = testForRegExp.length - 1;
            var options = "";
            var last = testForRegExp.charAt(idx);
            while (idx >= 0) {
                var last = testForRegExp.charAt(idx--);
                this.stats.recordOp();
                if (last === first) {
                    break;
                }
                options = last + options;
            }

            if (idx != 0) {
                this.stats.recordOp();
                //options?
                try {
                    var exp = testForRegExp.substring(1, idx + 1);
                    ret = RegExp(exp, options);
                }
                catch (e) {
                    if (ArguMints.verbose) console.log("WARNING -ArguMints.expandRegEx() - regExp Not Valid! -" + e
                            + "(" + ret + ")");
                    ret = testForRegExp;
                }
            }
            if (ArguMints.verbose) console.log("ArguMints.expandRegEx() - " + this.rules.protoName(ret, true));
        }
        return ret;
    }
    /**
     * Returns 'JSON Formatted string' if the string passed in is in proper JSON format.
     */
    function AMExpandJSONString(mightBeJson, token) {

        checkNonce(token, "Cannot call expandJsonString Externally!");

        if (mightBeJson != null && typeof mightBeJson === 'string' && mightBeJson.length > 0) {

            // insure the string has no space at the ends.
            var trimmed = mightBeJson.trim();

            var first = trimmed.charAt(0);
            var last = trimmed.charAt(trimmed.length - 1);
            if (ArguMints.verbose) console.log("ArguMints.expandJSONString() - maybe: " + trimmed);
            // array or object must be the base element
            if ((first === '{' && last === '}') || (first === '[' && last === ']')) {
                mightBeJson = JSON.parse(trimmed);
                if (ArguMints.verbose) console.log("ArguMints.expandJSONString() - expanded: " + mightBeJson);
            }
        }
        return mightBeJson;
    }
    function AMExpandString(str, token) {

        checkNonce(token, "cannot call expandString() externally!");

        if (typeof str === 'string' && str !== '') {
            var didMangle = false;
            // first attempt to expand it as a file
            var newValue = this.expandFile(str, nonce);

            didMangle = newValue !== str;
            str = newValue;

            this.stats.recordOp();

            var pathMatches = str.match(this.rules.fileExpansionPathMatcher);
            var plen = pathMatches != null ? pathMatches.length : 0;
            if (plen > 0) {
                for (var i = 0; i < plen; i++) {
                    var match = pathMatches[i];

                    var idx = str.indexOf(match);
                    this.stats.recordOp();

                    if (idx > -1) {
                        var actFileName = match;
                        if (actFileName.charAt(0) === '"') {
                            this.stats.recordOp();
                            actFileName = actFileName.substring(2, actFileName.length - 1);
                        }
                        else {
                            this.stats.recordOp();
                            actFileName = actFileName.substring(1, actFileName.length);
                        }

                        this.stats.recordOp();
                        // inject contents
                        str = str.substring(0, idx) + this.expandString(actFileName, nonce)
                                + str.substring(idx + match.length, str.length);
                    }
                }
            }

            // next attempt to build a regex
            newValue = this.expandRegEx(str);
            didMangle = newValue !== str;
            str = newValue;

            if (true !== this.options.ignoreJson) {
                // attempt to format as json
                newValue = this.expandJSONString(str, nonce);
                didMangle = newValue !== str;
                str = newValue;
            }
            else {
                if (ArguMints.verbose) {
                    console.log("Ignore  JSON INPUT");
                }
            }

            if (!isNaN(str)) {
                if (this.options.treatNumberStringsAsNumbers === true) {
                    str = Number(str);
                    didMangle = true;
                }
            }
            else if (typeof str === 'string') {
                var xVal = str.toLowerCase();
                if (!didMangle && this.options.treatBoolStringsAsBoolean) {
                    if (xVal === 'true') {
                        str = true;
                        didMangle = true;
                    }
                    else if (xVal === 'false') {
                        str = false;
                        didMangle = true;
                    }
                }
                if (!didMangle && this.options.treatNullStringsAsNull) {
                    if (xVal === 'null') {
                        str = null;
                        didMangle = true;
                    }
                }
                if (!didMangle && this.options.treatUndefinedStringsAsUndefined) {
                    if (xVal === 'undefined') {
                        str = undefined;
                        didMangle = true;
                    }
                }
            }
            if (ArguMints.verbose) console.log("ArguMints.expandString() - expanded: " + str);
        }

        return str;
    }

    function AMExpandArray(arr, token) {

        checkNonce(token, "cannot call expandArray() externally");

        if (ArguMints.verbose) console.log("ArguMints.expandArray(" + arr + ")");
        var protoName = this.rules.protoName(arr);

        if (protoName === 'Array') {
            for (var i = 0; i < arr.length; i++) {
                this.stats.recordOp();
                var value = arr[i];
                var type = (typeof value);

                // let inline expansion happen first, then pass through
                value = this.expandString(value, nonce);

                // attempt to expand it as an object
                this.expandObject(value, nonce);

                arr[i] = value;
            }
        }
        else{
            this.expandObject(value, nonce);
        }

        return this;
    }
    function AMExpandObject(obj, token) {

        checkNonce(token, "cannot call expandObject externally")
        // pass through
        if (typeof obj !== 'object') {
            return obj;
        }

        this.stats.recordOp();
        var protoName = this.rules.protoName(obj);
        if (protoName === 'Array') {
            if (ArguMints.verbose) console.log("ArguMints.expandObject(" + obj + ") - ARRAY ");
            this.expandArray(obj, nonce);
        }
        else {
            if (ArguMints.verbose) console.log("ArguMints.expandObject(" + obj + ") - OBJECT ");
            // copy the keys to command table.
            for ( var key in obj) {
                var keyValue = obj[key];
                this.stats.recordOp();
                // inline expansion of strings will 
                // perform the following
                // 1. file expansion
                // 2. RegExp expansion
                // 3. Json Expansion
                // 4. string expansion of values such as (i.e. -f --option key=value argv0 argv1)
                keyValue = this.expandString(keyValue, nonce);

                if (typeof argAt === 'object' && keyValue != null) {
                    // expand the object result
                    // if this is an array, expandObject will direct to expandArray
                    this.expandObject(keyValue, nonce);
                }

                // overwrite current key
                obj[key] = keyValue;
            }
        }
        return this;
    }

    function AMGetMatches(startIdx, endIdx) {
        var ret = null;
        if (this.commandTable._opt['minty-match-argv']) {
            ret = this.commandTable._argvmatch;
        }
        else if (this.commandTable._opt['minty-match-kv']) {
            ret = this.commandTable._kvmatch;
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
})();
