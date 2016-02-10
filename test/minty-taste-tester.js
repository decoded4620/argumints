var expect    = require("chai").expect;
var lib = require("../argumints.js");
var ArguMints = lib.ArguMints;
var myMints = lib.myArguMints;

describe("ArguMints Test Suite - Vanilla", function() {
    describe("Test Empty Retort", function(){
        it("Retorts to no input arguments by the user", function() {
            
            ArguMints.verbose = true;

            var calledRetortExpandCb = false;
            var calledRetortCompleteCb = false;
            
            myMints.retort([    ],function(args){
                console.log("expandStart: " + args);
                calledRetortExpandCb = true;
            },
            function(arg, exp, idx, cnt){
                console.log("expandEach(" + arg + ", " + exp + ", " + idx + ", " + cnt + ")");
                calledRetortCompleteCb = true;
            });
            
            expect(calledRetortExpandCb).to.equal(true);
            expect(calledRetortCompleteCb).to.equal(true);
        });
    });
    
    describe("Test Args", function(){
        it("Retorts to ordered arguments alone", function() {
            expect(true).to.equal(true);
        });
    });
    
    describe("Test Opts", function(){
        it("Retorts to --option style inputs only", function() {
            expect(true).to.equal(true);
        });
    });
    
    describe("Test Flags", function(){
        it("Retorts to (-f | -fxv) style inputs only", function() {
            expect(true).to.equal(true);
        });
    });
});