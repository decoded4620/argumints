module.exports = (function(){
    var Requires = {
            ArguMintsException:require("./exception.js").ArguMintsException,
            ArguMintStats:require("./stats.js").ArguMintStats,
            ArguMintRules:require("./rules.js").ArguMintRules,
            AuxUtils:require("./aux_utils.js"),
            BuiltIns:require("./argumints-builtins.js").BuiltIns
        };
    
    return Requires;
}());

