

ArguMints.prototype.retort              = AMRetort;
ArguMints.prototype.getUserArgs         = AMGetUserArgs;
ArguMints.prototype.getScriptArgs       = AMGetScriptArgs;
ArguMints.prototype.copyTo              = AMCopyTo;
ArguMints.prototype.wheresMyNode        = AMWhereIsNode;
ArguMints.prototype.copyCommandsFrom    = AMCopyToCommandTable;
ArguMints.prototype.isJsonString        = AMIsJsonFormattedString;
ArguMints.prototype.isRegEx             = AMIsRegExString;
ArguMints.prototype.argDump             = AMArgDump;
ArguMints.prototype.innerDump           = AMDump;

/**
 * Constructor
 * 
 * @param options
 */
function ArguMints(options){
    
    this.options        = options;
    
    if(this.options == null){
        this.options = {
            verbose:false,
            treatBoolStringsAsBoolean:true,
            treatNullStringsAsNull:true,
            treatRegExStringsAsRegEx:true
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
function AMDump(o, maxDepth){
    
    ++this.argDumpDepth;
    if (this.argDumpDepth >= maxDepth) {
        
        if(this.options.verbose){
            console.log("max depth (" + this.argDumpDepth + ") reached!");
            console.log(o);
        }
        --this.argDumpDepth;
        return;
    }
    var objtype = typeof o;
    
    console.log('[' + o + ']');
    
    if (objtype === 'object') {
        var cnt = 0;
        for ( var prop in o) {
            cnt++;
            var value = o[prop];
            var type = (typeof value);
            
            console.log(this.argDumpDepth + ")\t" + prop + "=" + value + "(" + type + ")");

            if (type === 'object') {
                this.innerDump(value, maxDepth);
            }
        }

        if (cnt == 0) {
            console.log(this.argDumpDepth + ")\t\tobject has no properties");
        }
    }
    --this.argDumpDepth;
}
/**
 * Dump the Command Table
 */
function AMArgDump() {
    console.log("ArguMints.argDump(" + o + ")");
 
    // dump the contents of the command table, up to 100 levels into the tree.
    // this is an obscene limit, but insures no stack overflow or inifite circular print.
    this.innerDump(this.commandTable, 100);
    console.log("\twhere is node js: " + this.wheresMyNode);
    console.log("\tuser arguments: " + this.userArgs.length);
    console.log("\tscript arguments: " + this.scriptArgs);
};

function AMWhereIsNode(){
    return this.nodeLoc;
}

function AMGetScriptArgs(){
    return this.scriptArgs;
}

function AMGetUserArgs(){
    return this.userArgs;
}

// build the command table from the users Arguments
function AMRetort(){
    // first two args
    this.scriptArgs = process.argv.slice(0, 2);

    // any additional args
    this.userArgs   = process.argv.slice(2);

    // path to node installation
    this.nodeLoc    = this.scriptArgs[0];
    
    // path to this script
    this.scriptPath = this.scriptArgs[1];

    // table of parsed input arguments.
    this.commandTable = {};

    console.log("ArguMints.retort(" + this.nodeLoc + ", " + this.scriptPath + ")");

    var uLen = this.userArgs == null ? 0 : this.userArgs.length;
    if (uLen > 0) {

        if(this.options.verbose === true){
            console.log("\t" + uLen + " arguments were passed in by the user " + this.userArgs);
        }
        // userArgs are split on '=' to avoid forcing order
        for (var i = 0; i < uLen; ++i) {

            // current arg
            var argAt = this.userArgs[i];
            
            // first index of assignment operator in argument
            var aIdx = argAt.indexOf('=');
            if(this.options.verbose){
                console.log("\tprocessing argument: " + argAt);
            }
            // if this is NOT a 'key=value' pair
            // its a 'flag' i.e. verbose, etc.
            if (aIdx == -1) {
                
                // supports both '--flagName' and '-f' formats
                if(argAt.charAt(0) === '-'){
                    if(this.options.verbose){
                        console.log("\tflag type argument format at: " + i + ", argument: " + argAt);
                    }
                    // set as 'true'
                    if(argAt.charAt(1) === '-'){
                        this.commandTable[argAt.substring(2)] = true;
                    }
                    else{
                        this.commandTable[argAt.charAt(1)] = true;
                    }
                }
                else{
                    
                    if(this.isJsonString(argAt)){
                        if(this.options.verbose){
                            console.log("\tjson formatted input, parsing...");
                        }
                       
                        // copy the json key/values into the command table.
                        // this allows structured input.
                        this.copyCommandsFrom(JSON.parse(argAt));
                    }
                    else{
                        if(this.options.verbose){
                            console.log("\tflag malformed: " + argAt + ", ignoring!");
                        }
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
                
                if(this.isJsonString(value)){
                    if(this.commandTable.ignoreJson !== true){
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
                        if(this.options.treatBoolStringsAsBoolean){
                            if(xVal === 'TRUE'){
                                value = true;
                            }
                            else if(xVal === 'FALSE'){
                                value = false;
                            }
                        }
                        if(this.options.treatNullStringsAsNull){
                            if(xVal === 'NULL'){
                                value = null;
                            }
                        }
                        if(this.options.treatRegExStringsAsRegEx){
                            value = new RegExp(value);
                        }
                        this.commandTable[key] = value;
                    }
                    else if(typeof value === 'undefined'){
                        console.log("This shouldn't happen!");
                        
                        this.commandTable[key] = undefined;
                    }
                }
            }
        }
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
function AMCopyToCommandTable(copyFrom){
    // copy the keys to command table.
    for(var key in copyFrom){
        this.commandTable[key] = copyFrom[key];
    }

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
}

// export
module.exports.ArguMints = ArguMints;
/*
var am = new ArguMints({
    verbose:true,
    treatBoolStringsAsBoolean:true,
    treatNullStringsAsNull:true,
    treatRegExStringsAsRegEx:true
}).retort();

am.argDump();
*/