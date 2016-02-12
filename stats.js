var ArguMintStats =  function () {
    var _ops = 0;
    var _retorts = 0;
    var _bickerTime = 0;
    var _debateStart = (new Date()).getTime();

    var _isRecording = false;
    this.recordStart = function() {
        _isRecording = true;
        _debateStart = (new Date()).getTime();
        _retorts++;
    };

    this.recordOp = function() {
        _ops++;
    }

    this.recordStop = function() {
        _isRecording = false;
        var now = (new Date()).getTime();
        _bickerTime += (now - _debateStart);
        _debateStart = now;
    }
    this.isRecording = function(){
        return _isRecording;
    }
    this.reset = function() {
        _ops = 0;
        _retorts = 0;
        _bickerTime = 0;
        _debateStart = (new Date()).getTime();
    }
    //    MyClass.prototype = {
    //            get value(){
    //                return this._value;
    //            },
    //            set value(val){
    //                this._value = val;
    //            }
    //        };
    this.__defineGetter__("ops", function() {
        return _ops;
    });

    this.__defineGetter__("retorts", function() {
        return _retorts;
    });

    this.__defineGetter__("bickerTime", function() {
        return _bickerTime;
    });

    this.__defineGetter__("debateStart", function() {
        return _bickerTime;
    });

    this.__defineSetter__("bickerTime", function(value) {
        _bickerTime = value;
    });
};


 module.exports.ArguMintStats = ArguMintStats;