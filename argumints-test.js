/**
 * Test
 */
var ArguMints = require('argumints').ArguMints;

ArguMints.test = function(){
    var defaultOptions = {
                    treatBoolStringsAsBoolean:true,
                    treatNullStringsAsNull:true,
                    treatRegExStringsAsRegEx:true,
                    treatNumberStringsAsNumbers:true,
                    treatUndefinedStringsAsUndefined:true,
                    enableFileExpansion:true,
                    ignoreJson:false
                };

    var test1 = new ArguMints(defaultOptions);
    test1.retort();
}
ArguMints.test();
