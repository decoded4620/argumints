var fs = require('fs');

ArguMints.prototype.retort                  = AMRetort;
ArguMints.prototype.getUserArgs             = AMGetUserArgs;
ArguMints.prototype.getScriptArgs           = AMGetScriptArgs;
ArguMints.prototype.argv                    = AMGetArgV;
ArguMints.prototype.opt                     = AMGetOpt;
ArguMints.prototype.keyValue                = AMGetKeyValue;
ArguMints.prototype.flag                    = AMGetFlag;
ArguMints.prototype.copyTo                  = AMCopyTo;
ArguMints.prototype.wheresMyNode            = AMWhereIsNode;
ArguMints.prototype.copyCommandsFrom        = AMCopyToCommandTable;
ArguMints.prototype.expandJSONString        = AMExpandJSONString;
ArguMints.prototype.expandRegEx             = AMExpandRegExp;
ArguMints.prototype.argDump                 = AMArgDump;
ArguMints.prototype.innerDump               = AMDump;
ArguMints.prototype.expandFile              = AMExpandFile;
ArguMints.prototype.expandObject            = AMExpandObject;
ArguMints.prototype.expandArray             = AMExpandArray;
ArguMints.prototype.expandString            = AMExpandString;
ArguMints.prototype.reset                   = AMReset;

ArguMintRules.prototype.cacheFileContent    = AMCacheFileContent;
ArguMintRules.prototype.getFileCache        = AMGetFileCache;

ArguMints.verbose                           = false;


// token used to call priviledged ArguMints functions
// even tho they are public
nonce = {};

//@private
function checkNonce(token, throwMessage){
    if(nonce !== token){
        throw new ArguMintsException(throwMessage);
    }
}

//@private
function ArguMintsException(message){
    this.message =message;
    this.name = "ArguMintsException";
}

function ArguMintStats(){
    this.ops = 0;
    this.retorts = 0;
    this.bickerTime = 0;
    this.debateStart = (new Date()).getTime();
}


//@private
function ArguMintRules(){
    this.fileExpansionPathMatcher = new RegExp("(^|\\s)(@(?:/?[^/\",@\\s]*)+/?|\"@(/?[^/\",@\\r\\n\\f\\t]*)+/?\")","gm");
    this.fileCache = null;
}
function AMCacheFileContent(tag, content){
    if(ArguMints.verbose) console.log("ArguMintRules.cacheFileContent(" + tag + ")");
    if(tag !== null && tag !== '' && tag !== undefined){
        
        if(this.fileCache === null){
            this.fileCache = {}
        }
 
        this.fileCache[tag] = content;
    }
}
function AMGetFileCache(tag){
    var ret = null;
    if(tag !== null && tag !== '' && tag !== undefined){
        if(this.fileCache !== null){
            ret= this.fileCache[tag];
            
            if(ret !== null && ret !== undefined){
                if(ArguMints.verbose) console.log("ArguMintRules.getFileCache(tag: " + tag + ") - " + ret.length);
            }
        }
    }
    return ret;
}


/**
 * Constructor
 * 
 * @param options
 */
function ArguMints(options){
    this.options        = options;
    this.argDumpDepth   = 0;
    this.rules          = new ArguMintRules();
    this.stats          = new ArguMintStats();
    this.commandTable   = null;
    this.scriptArgs     = null;
    this.userArgs       = null;
    this.nodeLoc        = null;
}

function AMReset(){
    this.commandTable   = null;
    this.scriptArgs     = null;
    this.userArgs       = null;
    this.nodeLoc        = null;
    this.stats = new ArguMintStats();
}
/**
 * Internal
 */
function AMDump(o, maxDepth, token){
    checkNonce(token, "dump() - call not allowed externally!");
    
    ++this.argDumpDepth;
    
    var spacing = "";
        for(var i = 0; i < this.argDumpDepth; ++i){
            spacing += "    ";
        }
    if(ArguMints.verbose){
        console.log(spacing + "ArguMints.dump() - " + Object.prototype.toString.call(o));
    }
    if (this.argDumpDepth < maxDepth) {
        if(o === null){
            console.log(spacing + "null");
        }
        else{
            var objtype = typeof o;
            if( Object.prototype.toString.call( o ) === '[object Array]' ) {
                for ( var i = 0; i < o.length; i++) {
                    var value = o[i];
                    var type = (typeof value);
                    var tag = ArguMints.verbose ? "[" + i + "]  " : "";
                    if (type === 'object') {
                        console.log(spacing + tag + Object.prototype.toString.call(value) + "(" + type + ")");
                        if(ArguMints.verbose)console.log(spacing + "--------------------------------------------------------");
                        this.innerDump(value, maxDepth, nonce);
                    }
                    else{
                        if(type === 'string'){
                            console.log(spacing + tag +  (value.split('\r\n').join('\r\n     ' + spacing)));
                        }
                        else{
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
                    
        
                    if (type === 'object') {
                        console.log(spacing + "[" + prop + "] " + Object.prototype.toString.call(value) + "(" + type + ")");
                        console.log(spacing + "--------------------------------------------------------");
                        this.innerDump(value, maxDepth, nonce);
                    }
                    else{
                        console.log(spacing + prop + "=" + value + "(" + type + ")");
                    }
                }
        
                if (cnt == 0) {
                    console.log(spacing + "\t{}");
                }
            }
            else{
                if(type === 'string'){
                    
                    console.log(spacing + '[' + (o.split('\r\n').join(spacing + '     \r\n'))+ ']');
                }
                else{
                    console.log(spacing + '[' + o + ']');
                }
            }
        }
    }
    else{
        if(ArguMints.verbose){
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
function AMArgDump() {
    
    // dump the contents of the command table, up to 100 levels into the tree.
    // this is an obscene limit, but insures no stack overflow or inifite circular print.
    this.innerDump(this.commandTable, 100, nonce);
    
    return this;
};

function AMWhereIsNode(){
    return this.nodeLoc;
}

function AMGetScriptArgs(){
    return this.scriptArgs;
}

function AMGetArgV(atIndex){
    if(typeof atIndex == 'number' && atIndex >= 0 && atIndex < this.commandTable._argList.length){
        return this.commandTable._argList[atIndex];
    }
    
    return null;
}
function AMGetOpt(opt){
    if(typeof this.commandTable._options[opt] !== 'undefined'){
        return this.commandTable._options[opt];
    }
    
    // check for the flag version i.e. if we checked for --verbose check for -v
    return this.flag(opt.charAt(0));
}
function AMGetKeyValue(key){
    return this.commandTable._keyStore[key];
}
function AMGetFlag(flag){
    if(typeof this.commandTable._flags[flag] !== 'undefined'){
        return this.commandTable._flags[flag];
    }
    
    return false;
}
function AMGetUserArgs(){
    return this.userArgs;
}


function AMExpandFile(tagInput, token){
    
    checkNonce(token, "ArguMints.expandFile() - call not allowed externally!");
    this.stats.ops++;
    var ret = tagInput;
    // pass through if not a string or properly formatted, or we are not enabling file expansion
    if(false === this.options.enableFileExpansion || typeof ret !== 'string' || ret.charAt(0) !== '@'){
        return ret;
    }
    else{
        if(this.fileExpansionChain === null){
            this.fileExpansionChain = [];
        }
        
        if(this.fileExpansionChain.indexOf(tagInput) != -1){
            if(ArguMints.verbose){
                console.log("ArguMints.expandFileArg() - Expansion chain: " + this.fileExpansionChain);
            }
            
            throw new ArguMintsException("ArguMints.expandFileArg() - Circular File Expansion Detected!: " + "Expansion chain: " + this.fileExpansionChain.join("->"));
        }
        
        
        this.fileExpansionChain.push(tagInput);
        this.stats.ops++;
        var cachedValue = this.rules.getFileCache(tagInput);
        
        if(cachedValue===null||cachedValue===undefined){
            //this is a file, load it synchronously here
            //process its contents as utf8
            var fn = ret.substring(1);
            if(ArguMints.verbose) console.log("ArguMints.expandFileArg(" + fn + ") - " + this.fileExpansionChain.join('->'));
            
            try{
                
                // Query the entry
                stats = fs.lstatSync(fn);
                // Is it a directory?
                var hasContent = stats.isFile() && !stats.isDirectory();
                // overwrite our value with the data from the file and continue
                ret = hasContent ? fs.readFileSync(fn, 'utf8') : '';
                if(hasContent && ret !== null){
                    ret = ret.trim();
                }
                
                if(ArguMints.verbose) console.log("ArguMints.expandFileArg() - loaded " + fn + " containing " + (ret.length > 0 ? ret.length : 'ZERO') + " characters: " + ret);
                this.stats.ops++;
                this.rules.cacheFileContent(tagInput, ret);
            }
            catch(e){
                
            }
        }
        else{
            if(ArguMints.verbose) console.log("ArguMints.expandFile() - returning: " + cachedValue.length + " cached chars for tag: " + tagInput);
            ret = cachedValue;
        }
        
    }
    return ret;
}
// build the command table from the users Arguments
function AMRetort(moreUserArgs){
    
    this.stats.retorts++;
    this.stats.debateStart = (new Date()).getTime();
    
    // insure we always have default options
    if(this.options == null){
        this.options = {
            treatBoolStringsAsBoolean:true,
            treatNullStringsAsNull:true,
            treatRegExStringsAsRegEx:true,
            treatNumberStringsAsNumbers:true,
            treatUndefinedStringsAsUndefined:true,
            enableFileExpansion:true,
            ignoreJson:false
        }
    }
    
    
    // clear this on each retort.
    if(ArguMints.verbose) console.log("ArguMints.retort() - clear expansion chain : " + this.fileExpansionChain);
    
    
    // keep track of arguments we've already retorted to
    var retortIndex = 0;
    
    // only update user args ONCE. 
    // if the user calls retort multiple times with 
    // concatenations of arguments, we'll append them to
    // userArgs below
    if(this.userArgs == null){
        if(ArguMints.verbose){
            console.log("ArguMints.retort() -building initial ArguMints set");
        }
        // table of parsed input arguments.
        this.commandTable = {
                _argList:[],
                _flags:{},
                _options:{},
                _keyStore:{}
        };
        
        // first two args we always scrape
        this.scriptArgs = process.argv.slice(0, 2);
        
        // path to node installation
        this.nodeLoc    = this.scriptArgs[0];
        
        // path to this script
        this.scriptPath = this.scriptArgs[1];
        
        // any additional args
        this.userArgs   = process.argv.slice(2);

        if(moreUserArgs != null){
            this.userArgs = this.userArgs.concat(moreUserArgs);
        }
        
        retortIndex = 0;
    }
    else{
        if(ArguMints.verbose){
            console.log("ArguMints.retort() -Adding Additional arguments to existing ArguMints set");
        }
        
        // start from where we left off, unless reset is called.
        retortIndex = this.userArgs.length;
        
        if(moreUserArgs != null){
            this.userArgs = this.userArgs.concat(moreUserArgs);
        }
    }


    var uLen = this.userArgs == null ? 0 : this.userArgs.length;
    if(ArguMints.verbose === true){
        console.log("ArguMints.retort() -" + (uLen - retortIndex) + " additional arguments were passed in by the user " + this.userArgs.slice(retortIndex));
    }
    if (uLen > retortIndex) {
        // userArgs are split on '=' to avoid forcing order
        for (var i = retortIndex; i < uLen; ++i) {
            this.stats.ops++;

            // clear this after processing each argument
            this.fileExpansionChain = null;
            
            // current arg
            var argAt = this.userArgs[i];

            // do the full expansion test first
            argAt = this.expandString(argAt);
            
            
            // if file expansion results in null or empty string,
            // push this value onto the command args list now and short circuit.
            if(argAt === '' || argAt === null){
                this.commandTable._argList.push(argAt);
                continue;
            }
            
            var protoStr = Object.prototype.toString.call(argAt);
            
            // this was expanded into an object
            if(typeof argAt === 'object'){
                if(protoStr !== '[object RegExp]'){
                    this.copyCommandsFrom(argAt);
                }
                else{
                    // push regexp onto the arglist
                    this.commandTable._argList.push(argAt);
                }
                continue;
            }
            
            if(typeof argAt === 'string'){
                // first index of assignment operator in argument
                var aIdx = argAt.indexOf('=');
                var qIdx = argAt.indexOf('"');
                
                // if there are quotes before our assignment operator, its not really an assignment but a string
                // value.
                if(aIdx > qIdx && qIdx != -1){
                    aIdx = -1;
                }
                // if this is NOT a 'key=value' pair
                // its a 'flag' i.e. verbose, etc.
                if (aIdx == -1) {
                    // supports both '--flagName' and '-f' formats
                    if(argAt.charAt(0) === '-'){
                        // set as 'true'
                        if(argAt.charAt(1) === '-'){
    
                            if(ArguMints.verbose){
                                console.log("ArguMints.retort() - add option at: " + i + ", argument: " + argAt);
                            }
                            
                            this.commandTable._options[argAt.substring(2)] = true;
                        }
                        else{
                            if(ArguMints.verbose){
                                console.log("ArguMints.retort() - add flag at: " + i + ", argument: " + argAt);
                            }
                            
                            // allow multiple flags in a single arg.
                            for(var x = 1; x < argAt.length; ++x){
                                this.commandTable._flags[argAt.charAt(x)] = true;
                            }
                            
                        }
//                        if(this.commandTable._flags['v'] === true || this.commandTable._options['verbose'] === true){
//                            ArguMints.verbose = true;
//                        }
                    }
                    else{
                        argAt = this.expandString(argAt);
                        
                        // if expansion worked.
                        if(typeof argAt !== 'string'){
                            if(ArguMints.verbose)console.log("ArguMints.retort() -add object formatted input, parsed..." + argAt);
                            // copy the json key/values into the command table.
                            // this allows structured input.
                            this.copyCommandsFrom(argAt);
                        }
                        else{
                            if(ArguMints.verbose) console.log("ArguMints.retort() -add string arg:" + argAt.length + " chars to argList");
                            this.commandTable._argList.push(argAt);
                        }
                    }
                }
                else{
                    // key value pair
                    
                    var pts = [
                      argAt.substring(0, aIdx), 
                      argAt.substring(aIdx+1,argAt.length)
                    ];
                    
                    var key     = pts[0];
                    var value   = pts[1];
    
                    // this will expand file and json all at once
                    var value = this.expandString(value);
                    
                    if(ArguMints.verbose) console.log("ArguMints.retort() -set final retort for" + key + " to (" + value +")");
                    this.commandTable._keyStore[key] = value;
                }
            }
            else{ 
                if(ArguMints.verbose) console.log("ArguMints.retort() - adding primitive retort to argList (" + value +")");
                this.commandTable._argList.push(argAt);
            }
        }
    }
    var now = (new Date()).getTime();
    this.stats.bickerTime += (now - this.stats.debateStart);
    this.stats.debateStart = now;
    return this;
}

function AMExpandRegExp(testForRegExp){
    
    var first = testForRegExp.charAt(0);
    var ret = testForRegExp;
    // only check for reg ex
    // if the string starts with '/'
    if(first==='/'){
        if(ArguMints.verbose) console.log("ArguMints.expandRegEx() - checking validity (" + ret +")");
        var idx     = testForRegExp.length-1;
        var options = "";
        var last = testForRegExp.charAt(idx);
        while(idx >= 0){
            var last = testForRegExp.charAt(idx--);
            this.stats.ops++;
            if(last === first){
                break;
            }
            options = last + options;
        }
        
        if(idx != 0){
            this.stats.ops++;
            //options?
            try{
                var exp = testForRegExp.substring(1, idx+1);
                ret = RegExp(exp, options);
            }
            catch(e){
                if(ArguMints.verbose) console.log("WARNING -ArguMints.expandRegEx() - regExp Not Valid! -" + e + "(" + ret +")");
                ret = testForRegExp;
            }
        }
        if(ArguMints.verbose) console.log("ArguMints.expandRegEx() - " + Object.prototype.toString.call(ret) );
    }
    return ret;
}
/**
 * Returns 'JSON Formatted string' if the string passed in is in proper JSON format.
 */
function AMExpandJSONString(mightBeJson){
    if(mightBeJson !== null && typeof mightBeJson === 'string' && mightBeJson.length > 0){
        
        // insure the string has no space at the ends.
        var trimmed = mightBeJson.trim();
        
        var first = trimmed.charAt(0);
        var last = trimmed.charAt(trimmed.length-1);
        if(ArguMints.verbose) console.log("ArguMints.expandJSONString() - maybe: " + trimmed);
        // array or object must be the base element
        if((first==='{' && last ==='}')||(first==='['&&last===']')){
            mightBeJson =  JSON.parse(trimmed);
            if(ArguMints.verbose) console.log("ArguMints.expandJSONString() - expanded: " + mightBeJson);
        }
    }
    return mightBeJson;
}
function AMExpandString(str){
    if(typeof str === 'string' && str !== ''){
        var didMangle = false;
        // first attempt to expand it as a file
        var newValue = this.expandFile(str, nonce);

        didMangle = newValue !== str && (str=newValue);
        
        this.stats.ops++;
        
        var pathMatches = str.match(this.rules.fileExpansionPathMatcher);
        var plen = pathMatches != null ? pathMatches.length : 0;
        if(plen > 0){
            for(var i = 0; i < plen; i++){
                var match = pathMatches[i];
                
                var idx = str.indexOf(match);
                this.stats.ops++;
                
                if(idx > -1){
                    var actFileName = match;
                    if(actFileName.charAt(0) === '"'){
                        this.stats.ops++;
                        actFileName = actFileName.substring(2, actFileName.length-1);
                    }
                    else{
                        this.stats.ops++;
                        actFileName = actFileName.substring(1, actFileName.length);
                    }
                    
                    this.stats.ops++;
                    // inject contents
                    str = str.substring(0, idx) + this.expandString(actFileName) + str.substring(idx + match.length, str.length);
                }
            }
        }
        
        
        // next attempt to build a regex
        newValue = this.expandRegEx(str);
        didMangle = newValue !== str && (str=newValue);
        
        if(true !== this.options.ignoreJson){
            // attempt to format as json
            newValue = this.expandJSONString(str);
            didMangle = newValue !== str;
            str=newValue;
        }
        else{
            if(ArguMints.verbose){
                console.log("Ignore  JSON INPUT");
            }
        }
        
        
        
        if(!isNaN(str)){
            if(this.options.treatNumberStringsAsNumbers === true){
                str = Number(str); 
                didMangle = true;
            }
        }
        else if(typeof str === 'string'){
            var xVal = str.toLowerCase();
            if(!didMangle && this.options.treatBoolStringsAsBoolean){
                if(xVal === 'true'){
                    str = true;
                    didMangle = true;
                }
                else if(xVal === 'false'){
                    str = false;
                    didMangle = true;
                }
            }
            if(!didMangle && this.options.treatNullStringsAsNull){
                if(xVal === 'null'){
                    str = null;
                    didMangle = true;
                }
            }
            if(!didMangle && this.options.treatUndefinedStringsAsUndefined){
                if(xVal === 'undefined'){
                    str = undefined;
                    didMangle = true;
                }
            }
        }
        if(ArguMints.verbose) console.log("ArguMints.expandString() - expanded: " + str);
    }
    
    return str;
}

function AMExpandArray(arr){
    if(ArguMints.verbose) console.log("ArguMints.expandArray(" + arr + ")");
    if( Object.prototype.toString.call( arr ) === '[object Array]' ) {
        for ( var i = 0; i < arr.length; i++) {
            this.stats.ops++;
            var value = arr[i];
            var type = (typeof value);
            
            // let inline expansion happen first, then pass through
            value = this.expandString(value);
            
            // attempt to expand it as an object
            this.expandObject(value);

            arr[i] = value;
        }
    }
    else if(typeof arr === 'object'){
        this.expandObject(value);
    }
    
    return this;
}
function AMExpandObject(obj){
    
    // pass through
    if(typeof obj !== 'object'){
        return obj;
    }
    
    this.stats.ops++;
    if( Object.prototype.toString.call( obj ) === '[object Array]' ) {
        if(ArguMints.verbose) console.log("ArguMints.expandObject(" + obj + ") - ARRAY ");
        this.expandArray( obj );
    }
    else{
        if(ArguMints.verbose) console.log("ArguMints.expandObject(" + obj + ") - OBJECT ");
        // copy the keys to command table.
        for(var key in obj){
            var argAt = obj[key];
            this.stats.ops++;
            // inline expansion of strings will 
            // perform the following
            // 1. file expansion
            // 2. RegExp expansion
            // 3. Json Expansion
            // 4. string expansion of values such as (i.e. -f --option key=value argv0 argv1)
            argAt = this.expandString(argAt);
            
            if(typeof argAt === 'object' && argAt != null){
                // expand the object result
                // if this is an array, expandObject will direct to expandArray
                this.expandObject(argAt);
            }
            
            // overwrite current key
            obj[key] = argAt;
        }
    }
    return this;
}

function AMCopyToCommandTable(copyFrom){
    
    // expand for any file content in the json
    this.expandObject(copyFrom);
    
    // copy the keys to command table.
    for(var key in copyFrom){
        this.stats.ops++;
        this.commandTable._keyStore[key] = copyFrom[key];
    }

    return this;
}
/**
 * Copy the 'commandTable' object to otherObject
 */
function AMCopyTo(otherObject, overwrite){
    if(otherObject != null){
        for(var key in this.commandTable._keyStore){
            if(overwrite || typeof otherObject[key] === 'undefined'){
                this.stats.ops++;
                otherObject[key] = this.commandTable._keyStore[key];
            }
        }
    }
    
    return this;
}

// Export to the world.
module.exports.ArguMints = ArguMints;
