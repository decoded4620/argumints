var AuxUtils = require("./aux_utils.js");

var BuiltIns = (function(){

    var ArguMints = null;
    function BuiltIns(InArguMintsCtor){
        ArguMints = InArguMintsCtor;
    }
    
    BuiltIns.prototype.initialize = function(){
        if(ArguMints === undefined){
            throw new Error("Cannot Load Builtins!");
        }
        
    
        ArguMints.extensions.addAggregateOp("minty-match-kv", function(commandTable) {
            if (commandTable.keyStore) {
    
                // copy the argv
                var kvStore = commandTable.keyStore;
                var regExps = [];
                var curr = null;
                for ( var i in kvStore) {
                    if (kvStore.hasOwnProperty(i)) {
                        curr = kvStore[i];
                        if (AuxUtils.typeName(curr, true) == "RegExp") {
                            regExps[regExps.length] = curr;
                        }
                    }
                }
    
                var rLen = regExps.length;
                //find regex values
                for (var x = 0; x < rLen; x++) {
                    var currRegExp = regExps[x];
                    for ( var j in kvStore) {
                        if (kvStore.hasOwnProperty(j)) {
                            var currArgAsStr = String(kvStore[j]);
    
                            if (!AuxUtils.isNully(currArgAsStr) && currArgAsStr !== "") {
    
                                var moreResults = currArgAsStr.match(currRegExp);
    
                                if (!AuxUtils.isNully(moreResults) && moreResults.length > 0) {
                                    commandTable.matches = commandTable.matches.concat(moreResults);
                                }
                            }
                        }
                    }
                }
            }
        });
        ArguMints.extensions.addAggregateOp("minty-match-argv", function(commandTable) {
    
            if (commandTable.argv) {
                // copy the argv
                var argv = commandTable.argv.concat();
                var argc = commandTable.argv.length;
                var regExps = [];
                var curr = null;
                var i;
                for (i = 0; i < argc; ++i) {
                    curr = argv[i];
                    if (AuxUtils.typeName(curr, true) === AuxUtils.REGX) {
                        regExps[regExps.length] = curr;
                        // remove and step back
                        argv.splice(i, 1);
                        --i;
                    }
                }
                argc = argv.length;
                var rLen = regExps.length;
                //find regex values
                for (i = 0; i < rLen; ++i) {
                    var currRegExp = regExps[i];
                    for (var j = 0; j < argc; ++j) {
                        var currArgAsStr = String(argv[j]);
    
                        if (!AuxUtils.isNully(currArgAsStr) && currArgAsStr !== "") {
    
                            var moreResults = (currArgAsStr.match(currRegExp));
    
                            if (!AuxUtils.isNully(moreResults) && moreResults.length > 0) {
                                commandTable.matches = commandTable.matches.concat(moreResults);
                            }
                        }
                    }
                }
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
    
                    if (inOpt.hasOwnProperty(x)) {
                        var f = ArguMints.extensions.getOp(x);
                        if (!AuxUtils.isNully(f)) {
                            f.op(inStore, inKey, inValue);
                            called = true;
                            break;
                        }
                    }
                }
                if (!called) {
                    inStore[inKey] += inValue;
                }
            }
    
            var handled = false;
            var keyStore = commandTable.keyStore;
            var currValue = keyStore[key];
            var currTypeName = AuxUtils.typeName(currValue);
            var newTypeName = AuxUtils.typeName(value);
    
            if (currValue !== undefined) {
                if (currTypeName == AuxUtils.ARR) {
                    if (newTypeName == AuxUtils.ARR) {
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
                else if (currTypeName != AuxUtils.UDF) {
                    if (currTypeName == AuxUtils.STR) {
                        if (newTypeName != AuxUtils.UDF) {
                            // concat and coerce value to 'string'
                            keyStore[key] += value;
                            handled = true;
                        }
                    }
                    else if (currTypeName == AuxUtils.NUM) {
                        if (newTypeName == AuxUtils.NUM) {
                            appendNumberForKey(keyStore, commandTable.opt, key, value);
                            handled = true;
                        }
                        else if (newTypeName == AuxUtils.STR) {
                            keyStore[key] += value;
                            handled = true;
                        }
                    }
                }
            }
            else {
                if (newTypeName == AuxUtils.NUM) {
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
    
    return BuiltIns;
}.call(this));

module.exports.BuiltIns = BuiltIns;