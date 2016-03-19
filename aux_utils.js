module.exports = (function(){

    function AuxUtils(){}

    AuxUtils.FUNC   = 'Function';
    AuxUtils.STR    = 'String';
    AuxUtils.NUM    = 'Number';
    AuxUtils.BOOL   = 'Boolean';
    AuxUtils.ARR    = 'Array';
    AuxUtils.OBJ    = 'Object';
    AuxUtils.NUL    = 'null';
    AuxUtils.UDF    = 'undefined';
    AuxUtils.REGX   = 'RegExp';
    
    // static to check for either null or undefined
    // as a value
    AuxUtils.isNully = function(o){
        return o === null || o === undefined;
    }
     
    // returns the prototype name for an Object. I.E.  rules.protoName([]); // Array
    AuxUtils.typeName = function(protoVal, getFuncNames) {
        var pName = null;
        if (protoVal != null) {
            if (protoVal.constructor != null) {
                pName = protoVal.constructor.name
            }
        }
        else {
            if (protoVal === undefined) {
                // this is faster than calling 'toString' or 'type of' to simply return 'undefined'
                pName = AuxUtils.UDF;
            }
            else if (protoVal === null) {
                // this is faster than calling 'toString' to simply return 'null'
                pName = AuxUtils.NUL;
            }
        }
        
        return pName;
    }
    
    return AuxUtils;
}());