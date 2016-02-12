var ArguMintsException =  function(message) {
    
    var _message = message;
    
    this.__defineGetter__("message", function() {
        return _message;
    });
    
    // see if we can't just push ourselves out there.
};

module.exports.ArguMintsException = ArguMintsException;

