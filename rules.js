//@private
var ArguMintRules = (function() {

    var _filePathMatcher = new RegExp("(^|\\s)(@(?:/?[^/\",@\\s]*)+/?|\"@(/?[^/\",@\\r\\n\\f\\t]*)+/?\")", "gm");
    var _fileCache = null;

    /**
     * CTOR 
     */
    function ArguMintRules(){
        this.__defineGetter__("filePathMatcher", function() {
            return _filePathMatcher;
        });
    }

    ArguMintRules.prototype = {
        getFileCache:function(tag) {
            var ret = null;
            if (tag != null && tag != '') {
                if (_fileCache != null) {
                    ret = _fileCache[tag];
                }
            }
            return ret;
        },
        isCached:function(tag){
            return (tag != null && tag != '' && _fileCache[tag] != null); 
        },
        cacheFileContent:function(tag, content) {
            if (tag != null && tag != '') {

                if (_fileCache === null) {
                    _fileCache = {}
                }

                _fileCache[tag] = content;
            }
        },
        // private vars
        // returns the prototype name for an Object. I.E.  rules.protoName([]); // Array
        protoName : function(protoVal, getFuncNames) {
            if (protoVal != null) {
                if (protoVal.constructor != null) {
                    protoVal = protoVal.constructor.name
                }
            }
            else {
                if (protoVal === undefined) {
                    protoVal = ArguMintRules.UDF;
                }
                else if (protoVal === null) {
                    protoVal = String(protoVal);
                }
            }
            
            return protoVal;
        }
    }
    
    
    ArguMintRules.FUNC = 'Function';
    ArguMintRules.STR = 'String';
    ArguMintRules.NUM = 'Number';
    ArguMintRules.BOOL = 'Boolean';
    ArguMintRules.ARR = 'Array';
    ArguMintRules.OBJ = 'Object';
    ArguMintRules.NUL = 'null';
    ArguMintRules.UDF = 'undefined';
    ArguMintRules.REGX = 'RegExp';
    
    return ArguMintRules;
    
}.call(this));


module.exports.ArguMintRules = ArguMintRules;
