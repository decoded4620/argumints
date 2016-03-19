var ArguMintRules = (function() {
    var _filePathMatcher = new RegExp("(^|\\s)(@(?:/?[^/\",@\\s]*)+/?|\"@(/?[^/\",@\\r\\n\\f\\t]*)+/?\")", "gm");
    var _fileCache = null;

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
        }
    }
   
    return ArguMintRules;
    
}.call(this));

module.exports.ArguMintRules = ArguMintRules;
