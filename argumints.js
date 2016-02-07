var fs = require('fs');

ArguMints.prototype.retort              = AMRetort;
ArguMints.prototype.getUserArgs         = AMGetUserArgs;
ArguMints.prototype.getScriptArgs       = AMGetScriptArgs;
ArguMints.prototype.getOrderedArgs      = AMGetOrderedArgs;
ArguMints.prototype.copyTo              = AMCopyTo;
ArguMints.prototype.wheresMyNode        = AMWhereIsNode;
ArguMints.prototype.copyCommandsFrom    = AMCopyToCommandTable;
ArguMints.prototype.isJsonString        = AMIsJsonFormattedString;
ArguMints.prototype.isRegEx             = AMIsRegExString;
ArguMints.prototype.argDump             = AMArgDump;
ArguMints.prototype.innerDump           = AMDump;
ArguMints.prototype.expandFileArgument  = AMExpandFileArg;
ArguMints.prototype.expandObject        = AMExpandObject;
ArguMints.prototype.expandArray         = AMExpandArray;
ArguMints.prototype.expandString        = AMExpandString;
ArguMints.prototype.trim                = AMTrimString;

ArguMints.verbose                       = false;

// token used to call priviledged ArguMints functions
// even tho they are public
nonce = {};

function checkNonce(token, throwMessage){
    if(nonce !== token){
        throw new ArguMintsException(throwMessage);
    }
}
function ArguMintsException(message){
    this.message =message;
    this.name = "ArguMintsException";
}

/**
 * Constructor
 * 
 * @param options
 */
function ArguMints(options){
    
    this.options        = options;
    
    if(this.options == null){
        this.options = {
            treatBoolStringsAsBoolean:true,
            treatNullStringsAsNull:true,
            treatRegExStringsAsRegEx:true,
            enableArgFileLoading:true,
            ignoreJson:false
        }
    }
    
    this.commandTable   = null;
    this.scriptArgs     = null;
    this.userArgs       = null;
    this.nodeLoc        = null;
    this.argDumpDepth   = 0;
}

/**
 * Internal
 */
function AMDump(o, maxDepth, token){
    checkNonce(token, "dump() - call not allowed externally!");
    ++this.argDumpDepth;
    
    if(ArguMints.verbose)console.log("--------------------------------------------------------");
    if (this.argDumpDepth >= maxDepth) {
        
        if(ArguMints.verbose){
            console.log("max depth (" + this.argDumpDepth + ") reached!");
            console.log(o);
        }
        --this.argDumpDepth;
        return;
    }
    if(o === null){
        console.log(this.argDumpDepth + ")\tnull");
    }
    else{
        var objtype = typeof o;
        if( Object.prototype.toString.call( o ) === '[object Array]' ) {
            for ( var i = 0; i < o.length; i++) {
                var value = o[i];
                var type = (typeof value);
                
                if (type === 'object') {
                    if(ArguMints.verbose) console.log(this.argDumpDepth + ")\t[" + i + "] >>>> ");
                    this.innerDump(value, maxDepth, nonce);
                }
                else{
                    if(ArguMints.verbose) console.log(this.argDumpDepth + ")\t[" + i + "] " + value + "(" + type + ")");
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
                    if(ArguMints.verbose) console.log(this.argDumpDepth + ")\t" + prop + " >>>> ");
                    this.innerDump(value, maxDepth, nonce);
                }
                else{
                    if(ArguMints.verbose) console.log(this.argDumpDepth + ")\t" + prop + "=" + value + "(" + type + ")");
                }
            }
    
            if (cnt == 0) {
                console.log(this.argDumpDepth + ")\t{}");
            }
        }
        else{
            if(ArguMints.verbose) console.log('[' + o + ']');
        }
    }
    if(ArguMints.verbose)console.log("--------------------------------------------------------");
    --this.argDumpDepth;
}
/**
 * Dump the Command Table
 */
function AMArgDump() {
    if(ArguMints.verbose)console.log("========================================================");
    if(ArguMints.verbose) console.log("ArguMints.argDump()");
 
    // dump the contents of the command table, up to 100 levels into the tree.
    // this is an obscene limit, but insures no stack overflow or inifite circular print.
    this.innerDump(this.commandTable, 100, nonce);
    
    if(ArguMints.verbose) console.log("\twhere is node js: " + this.wheresMyNode());
    if(ArguMints.verbose) console.log("\tuser arguments: " + this.userArgs.length);
    if(ArguMints.verbose) console.log("\tscript arguments: " + this.getScriptArgs());
    if(ArguMints.verbose) console.log("\tordered arguments: " + this.getOrderedArgs());
    
    return this;
};

function AMWhereIsNode(){
    return this.nodeLoc;
}

function AMGetScriptArgs(){
    return this.scriptArgs;
}

function AMGetOrderedArgs(){
    return this.commandTable.argList;
}
function AMGetUserArgs(){
    return this.userArgs;
}


function AMExpandFileArg(tagInput, token){
    
    checkNonce(token, "expandFileArg() - call not allowed externally!");
    if(this.fileExpansionChain === null){
        this.fileExpansionChain = [];
    }
    
    if(this.fileExpansionChain.indexOf(tagInput) != -1){
        if(ArguMints.verbose){
            console.log("Expansion chain: " + this.fileExpansionChain);
        }
        
        throw new ArguMintsException("Circular File Expansion Detected!: " + "Expansion chain: " + this.fileExpansionChain.join("->"));
    }
    
    this.fileExpansionChain.push(tagInput);
    
    var ret = tagInput;

    //this is a file, load it synchronously here
    //process its contents as utf8
    var fn = ret.substring(1);
    
    // Query the entry
    stats = fs.lstatSync(fn);
    // Is it a directory?
    var hasContent = stats.isFile() && !stats.isDirectory();
    // overwrite our value with the data from the file and continue
    ret = hasContent ? fs.readFileSync(fn, 'utf8') : '';
    
    if(ret != ''){
        ret = this.trim(ret);
        if(ArguMints.verbose) console.log("\tFile Contents: (" + ret + ")");
    }
    if(ArguMints.verbose) console.log("\tfound file argument: " + fn + " loaded " + (ret.length > 0 ? ret.length : 'ZERO') + " characters");
    
    return ret;
}

// build the command table from the users Arguments
function AMRetort(moreUserArgs){

    // clear this on each retort.
    this.fileExpansionChain = null;
    
    if(ArguMints.verbose) console.log("ArguMints.retort()");
    // only update user args ONCE. 
    // if the user calls retort multiple times with 
    // concatenations of arguments, we'll append them to
    // userArgs below
    if(this.userArgs == null){
        if(ArguMints.verbose){
            console.log("\tbuilding initial ArguMints set");
        }
        // table of parsed input arguments.
        this.commandTable = {
                argList:[]
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
            moreUserArgs = this.userArgs;
        }
    }
    else{
        if(ArguMints.verbose){
            console.log("\tAdding Additional arguments to existing ArguMints set");
        }
        if(moreUserArgs != null){
            this.userArgs = this.userArgs.concat(moreUserArgs);
        }
    }
    


    var uLen = moreUserArgs == null ? 0 : moreUserArgs.length;
    if (uLen > 0) {

        if(ArguMints.verbose === true){
            console.log("\t" + uLen + " additional arguments were passed in by the user " + this.userArgs);
        }
        // userArgs are split on '=' to avoid forcing order
        for (var i = 0; i < uLen; ++i) {

            // current arg
            var argAt = moreUserArgs[i];

            if(argAt === '' || argAt === null){
                this.commandTable.argList.push(argAt);
                continue;
            }
            if(typeof argAt !== 'string'){
                this.expandObject(argAt);
                this.commandTable.argList.push(argAt);
                continue;
            }

            console.log(argAt);
            if(false !== this.options.enableArgFileLoading && argAt.charAt(0) === '@'){
                argAt = this.expandFileArgument(argAt, nonce);
                
                if(argAt === '' || argAt === null){
                    
                    // if it resolves to blank or null
                    // push it to the argList
                    this.commandTable.argList.push(argAt);
                    continue;
                }
            }
            
            // first index of assignment operator in argument
            var aIdx = argAt.indexOf('=');
            if(ArguMints.verbose){
                console.log("\tprocessing argument: " + argAt);
            }
            // if this is NOT a 'key=value' pair
            // its a 'flag' i.e. verbose, etc.
            if (aIdx == -1) {
                console.log("Arg At: " + (typeof argAt));
                // supports both '--flagName' and '-f' formats
                if(argAt.charAt(0) === '-'){
                    if(ArguMints.verbose){
                        console.log("\tflag type argument format at: " + i + ", argument: " + argAt);
                    }
                    // set as 'true'
                    if(argAt.charAt(1) === '-'){
                        this.commandTable[argAt.substring(2)] = true;
                    }
                    else{
                        if(argAt.length > 2){
                            if(ArguMints.verbose) console.log("flag argument truncated from: " + argAt.substring(1) + " to " + argAt.substring(1,3));
                        }
                        this.commandTable[argAt.charAt(1)] = true;
                    }
                }
                else{
                    
                    if(this.isJsonString(argAt)){
                        if(ArguMints.verbose){
                            console.log("\tjson formatted input, parsing...");
                        }
                        
                        if(this.options.ignoreJson !== true){
                            // copy the json key/values into the command table.
                            // this allows structured input.
                            this.copyCommandsFrom(JSON.parse(argAt));
                        }
                        else{
                            if(ArguMints.verbose) console.log("JSON Strings not parsed for this instance of ArguMints, saving in argList");
                            this.commandTable.argList.push(argAt);
                        }
                    }
                    else{
                        if(ArguMints.verbose) console.log("Adding arg: " + argAt + " to argList");
                        this.commandTable.argList.push(argAt);
                    }
                }
            }
            else{
                var pts = [
                  argAt.substring(0, aIdx), 
                  argAt.substring(aIdx+1,argAt.length)
                ];
                
                var key     = pts[0];
                var value   = pts[1];
                
                console.log('value: ' + value);
                if(false !== this.options.enableArgFileLoading && value.charAt(0) === '@'){
                   
                    value = this.expandFileArgument(value, nonce);
                    if(value === '' || value === null){
                        
                        // if it resolves to blank or null
                        // push it to the argList
                        this.commandTable.argList.push(value);
                        continue;
                    }
                }

                
                if(this.isJsonString(value)){
                    if(this.options.ignoreJson !== true){
                        this.commandTable[key] = JSON.parse(value);
                    }
                    else{
                        this.commandTable[key] = value;
                    }
                }
                else{
                    if(!isNaN(value)){
                        value = Number(value);
                    }
                    else if(typeof value === 'string'){
                        var xVal = value.toUpperCase();
                        var updatedValue = false;
                        if(!updatedValue && this.options.treatBoolStringsAsBoolean){
                            if(xVal === 'TRUE'){
                                value = true;
                                updatedValue = true;
                            }
                            else if(xVal === 'FALSE'){
                                value = false;
                                updatedValue = true;
                            }
                        }
                        if(!updatedValue && this.options.treatNullStringsAsNull){
                            if(xVal === 'NULL'){
                                value = null;
                                updatedValue = true;
                            }
                        }
                        if(!updatedValue && this.options.treatRegExStringsAsRegEx){
                            if(this.isRegEx(value)){
                                value = new RegExp(value);
                                updatedValue = true;
                            }
                        }
                        
                        this.commandTable[key] = value;
                    }
                    else if(typeof value === 'undefined'){
                        this.commandTable[key] = undefined;
                    }
                }
            }
        }
    }
    
    
    if(ArguMints.verbose){
        console.log("Expansion chain: " + this.fileExpansionChain);
    }
    return this;
}

function AMIsRegExString(mightBeRegEx){
    var first = mightBeRegEx.charAt(0);
    var last = mightBeRegEx.charAt(mightBeRegEx.length-1);
    
    if((first==='/' && last ==='/')){
        return true;
    }
    
    return false;
}
/**
 * 
 */
function AMIsJsonFormattedString(mightBeJson){
    var first = mightBeJson.charAt(0);
    var last = mightBeJson.charAt(mightBeJson.length-1);
    
    if((first==='{' && last ==='}')||(first==='['&&last===']')){
        return true;
    }
    
    return false;
}
function AMTrimString(str){
    if(typeof str === 'string'){
        var strLen = str.length;
        for(var i = 0, j = strLen-1, s= 0, e = j; i < strLen; ++i && --j){
            var sblank = (str[i] == ' ' || str[i] ==  '\r\n' || str[i] == '\r' || str[i] == '\n');
            var eblank = (str[j] == ' ' || str[j] ==  '\r\n' || str[j] == '\r' || str[j] == '\n');
            s = sblank ? i : s;
            e = eblank ? j : e;
            
            if(!sblank && !eblank){
                if(i == 0){
                    break;
                }

                str = str.substring(s, e-s);
                break;
            }
        }
    }

    if(ArguMints.verbose)console.log("ArguMints.trim - " + str);
    
    return str;
}

function AMExpandString(str){
    if(typeof str === 'string'){
        if(false !== this.options.enableArgFileLoading && str.charAt(0) === '@'){
            str = this.expandFileArgument(str, nonce);
        }
        
        // after file expansion, check json expansion
        if(this.options.ignoreJson !== true){
            if(this.isJsonString(str)){
                
                str = JSON.parse(str);
            }
            else{
                if(ArguMints.verbose){
                    console.log("NOT JSON: (" + (typeof str) + ")" + str);
                }
            }
        }
    }
    
    return str;
}

function AMExpandArray(arr){
    if(ArguMints.verbose) console.log("ArguMints.expandArray(" + arr + ")");
    if( Object.prototype.toString.call( arr ) === '[object Array]' ) {
        for ( var i = 0; i < arr.length; i++) {
            var value = arr[i];
            var type = (typeof value);
            
            // let inline expansion happen first, then pass through
            value = this.expandString(value);
            
            // if the above object was expanded from file args
            if(ArguMints.verbose) console.log("\t\t[" + i + "] " + value + "(" + type + ")");
            
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
    if(typeof obj !== 'object'){
        return this;
    }
    if(ArguMints.verbose) console.log("ArguMints.expandObject(" + obj + ") - type: " + (typeof obj));
    
    if( Object.prototype.toString.call( obj ) === '[object Array]' ) {
        this.expandArray( obj );
    }
    else{
        // copy the keys to command table.
        for(var key in obj){
            var argAt = obj[key];
            
            // inline expansion
            argAt = this.expandString(argAt);
            
            // expand the object result
            // if this is an array, expandObject will direct to expandArray
            this.expandObject(argAt);
            
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
        this.commandTable[key] = copyFrom[key];
    }

    return this;
}
/**
 * Copy the 'commandTable' object to otherObject
 */
function AMCopyTo(otherObject, overwrite){
    if(otherObject != null){
        for(var key in this.commandTable){
            if(overwrite || typeof otherObject[key] === 'undefined'){
                otherObject[key] = this.commandTable[key];
            }
        }
    }
    
    return this;
}

ArguMints.test = function(){
    ArguMints.verbose = true;

    var am = new ArguMints({
        verbose:true,
        treatBoolStringsAsBoolean:true,
        treatNullStringsAsNull:true,
        treatRegExStringsAsRegEx:true,
        ignoreJson:false,
        enableArgFileLoading:true
    })
    .retort(["x=@test2.txt", "y=@testargs.json"])
    .retort(["{\"key\":\"value\"}", "json={\"key\":\"value\"}"])
    .retort(["@.\\testargs.json","@.\\testargs2.json"])
    .retort(["message1=@.\\testargs2.json","message2=@.\\testargs.json"]);

    am.argDump();
}
// Export to the world.
module.exports.ArguMints = ArguMints;

// !! -- CAUTION -- !! -- CAUTION -- !! -- CAUTION -- !!
// TEST ONLY - COMMENT OUT PRIOR TO VERSIONING!!
// BEGIN
ArguMints.test();
// END
// COMMENT ABOVE PRIOR TO VERSIONING!!!
// !! -- CAUTION -- !! -- CAUTION -- !! -- CAUTION -- !!