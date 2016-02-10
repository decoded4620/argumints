var expect    = require("chai").expect;
var lib = require("../argumints.js");
var ArguMints = lib.ArguMints;
var myMints = lib.myArguMints;

// we're running from a script.
ArguMints.nodeCLI = false;

var dArgs =  [];//["--minty-dump", "--minty-verbose"];
describe("ArguMints Test Suite - Vanilla -->", function() {
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
            
            ArguMints.verbose = false;
        });
    });
    
    describe("Test Args -->", function(){
        it("Basic Retort Inputs, argv, opt, flag, keyValue-->", function() {
            myMints.reset();
            
            
            // NOTE: in this test script, 'spec' in an argument that is passed into
            // the testing harness, so all retorts will be appended to that argv value 'spec'.
            // thus tests below (when checking for indices) will be 1 based to skip the first 'spec' 
            // arguments for the test.
            myMints.retort(["a", "b", "c"].concat(dArgs));
            
            console.log(myMints.argv());
            expect(myMints.argv(1)).to.equal("a");
            expect(myMints.argv(2)).to.equal("b");
            expect(myMints.argv(3)).to.equal("c");
            
            
            myMints.retort(["--op1", "--op2", "--op3"].concat(dArgs));
            
            expect(myMints.opt('op1')).to.equal(true);
            expect(myMints.opt('op2')).to.equal(true);
            expect(myMints.opt('op3')).to.equal(true);
           
            myMints.retort(["-xzvf", "-dywa"]);
           
            expect(myMints.flag('x')).to.equal(true);
            expect(myMints.flag('z')).to.equal(true);
            expect(myMints.flag('v')).to.equal(true);
            expect(myMints.flag('f')).to.equal(true);
            expect(myMints.flag('d')).to.equal(true);
            expect(myMints.flag('y')).to.equal(true);
            expect(myMints.flag('w')).to.equal(true);
            expect(myMints.flag('a')).to.equal(true);
           
            myMints.retort(["vacationDays=14", "changeInMyPocket=.27", "checkFor=null","meaningOfLife=undefined","zed=dead", "isIt=true", "theDude=abides"].concat(dArgs));
            
            expect(myMints.keyValue('isIt')).to.equal(true);
            expect(myMints.keyValue('checkFor')).to.equal(null);
            expect(myMints.keyValue('vacationDays')).to.equal(14);
            expect(myMints.keyValue('changeInMyPocket')).to.equal(.27);
            expect(myMints.keyValue('meaningOfLife')).to.equal(undefined);
            expect(myMints.keyValue('zed')).to.equal("dead");
            expect(myMints.keyValue('theDude')).to.equal("abides");
           
            expect(true).to.equal(true);
        });
    });
    
    describe("Test Key Value Pairs using JSON Expansion-->", function(){
        it("Retorts to JSON formatted input, and tests the keyValue settings-->.", function() {
            myMints.reset();
            
            
            // NOTE: in this test script, 'spec' in an argument that is passed into
            // the testing harness, so all retorts will be appended to that argv value 'spec'.
            // thus tests below (when checking for indices) will be 1 based to skip the first 'spec' 
            // arguments for the test.
            myMints.retort(['{"keyValStr":"str", "keyValInt":1, "keyValDouble":1.00000001, "keyValBool":true, "keyValArr":[1,2,3], "keyValObj":{"name":"anObject"}, "keyValNul":null }'].concat(dArgs));
            
            expect(myMints.keyValue('keyValStr')).to.equal("str");
            expect(myMints.keyValue('keyValInt')).to.equal(1);
            expect(myMints.keyValue('keyValDouble')).to.equal(1.00000001);
            expect(myMints.keyValue('keyValBool')).to.equal(true);
            expect(myMints.keyValue('keyValArr')[2]).to.equal(3);
            expect(myMints.keyValue('keyValObj').name).to.equal("anObject");
            expect(myMints.keyValue('keyValNul')).to.equal(null);
        });
    });
    
    describe("Test Regular Expressions-->", function(){
        it("Test a Regular Expression directly input-->", function() {
            myMints.reset();
            myMints.retort(["--minty-match-argv", "anotherEmail@gmail.com", "barcher4620@gmail.com", '`/^(([^<>()[\\]\\\\.,;:\\s@"]+(\\.[^<>()[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$/g`'].concat(dArgs));
            expect(myMints.matches().length).to.equal(2);
        });
    });
    
    
    
    describe("Test JSON File Expansion-->", function(){
        it("Retorts a file expansion input pointing to json formatted data-->", function() {
            myMints.reset();
            myMints.retort(["@test/testargs1.json"].concat(dArgs));

            expect(myMints.keyValue("aNumber")).to.equal(1);             
            expect(myMints.keyValue("aBool")).to.equal(true);               
            expect(myMints.keyValue("anArray")[2]).to.equal("buckle");         
            expect(myMints.keyValue("anObject").prop).to.equal("aProperty");       
            expect(myMints.keyValue("nullValue")).to.equal(null);          
        });
    });

    describe("Test Key Duplication-->", function(){
        it("Retorts to keyValue pair duplicates using --minty-append-dup-keys--> ", function() {
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys","key1=2", "key1=3", "key2=5"].concat(dArgs));

            expect(myMints.keyValue("key1")).to.equal(myMints.keyValue("key2"));
            
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "key1=@test/test.txt", "key1=@test/test2.txt", "key2=@test/test.txt", "key3=@test/test2.txt"].concat(dArgs));

            // check string concatenation
            expect(myMints.keyValue("key1")).to.equal(myMints.keyValue("key2") + myMints.keyValue("key3"));
            
            
            myMints.reset();
            //check ops

            myMints.retort(["--minty-append-dup-keys", "--minty-op-div", "div=10", "div=2", "ans=5"].concat(dArgs));
            expect(myMints.keyValue("div")).to.equal(myMints.keyValue("ans"));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-sub", "div=10", "div=2", "-12"].concat(dArgs));
            expect(myMints.keyValue("div")).to.equal(myMints.argv(1));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-mul", "div=10", "div=2", "ans=20"].concat(dArgs));
            expect(myMints.keyValue("div")).to.equal(myMints.keyValue("ans"));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-sqrt", "div=4", "2"].concat(dArgs));
            expect(myMints.keyValue("div")).to.equal(myMints.argv(1));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-sqr", "div=10", "100"].concat(dArgs));
            expect(myMints.keyValue("div")).to.equal(myMints.argv(1));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-ln", "ln=5"].concat(dArgs));
            expect(myMints.keyValue("ln")).to.equal(Math.log(5));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-tan", "tan=.6"].concat(dArgs));
            expect(myMints.keyValue("tan")).to.equal(Math.tan(.6));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-cos", "cos=.6"].concat(dArgs));
            expect(myMints.keyValue("cos")).to.equal(Math.cos(.6));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-sin", "sin=.5"].concat(dArgs));
            expect(myMints.keyValue("sin")).to.equal(Math.sin(.5));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-atan", "atan=.5"].concat(dArgs));
            expect(myMints.keyValue("atan")).to.equal(Math.atan(.5));
            myMints.reset();
            myMints.retort(["--minty-append-dup-keys", "--minty-op-exp", "exp=2"].concat(dArgs));
            expect(myMints.keyValue("exp")).to.equal(Math.exp(2));
        });
    });
    
    
    describe("Test Argument Manipulation-->", function(){
        it("Retorts and uses the retort expansion callback to manipulate arguments to modify the behavior of retort.--> ", function() {
            myMints.reset();
         // the factorial function, ArguMints style!
            var fact = 1;
            myMints.retort( [4].concat(dArgs),null, function(arg, exp, idx, cnt){
                if( typeof exp === 'number' && exp > 0){
                    fact *= exp;
                    myMints.insertArg(arg-1, 0);
                }
            });
            
            expect(fact).to.equal(24);     
            myMints.reset();
            fact = 1;
            myMints.retort( [0].concat(dArgs),null, function(arg, exp, idx, cnt){
                if( typeof exp === 'number' && exp > 0){
                    fact *= exp;
                    myMints.insertArg(arg-1, 0);
                }
            });
            
            expect(fact).to.equal(1);
            
            myMints.reset();
            
         // the summation function, ArguMints style!
            var sum = 0;
            var t = 4;  // first x numbers
            myMints.retort( [1].concat(dArgs),null, function(arg, exp, idx, cnt){
                if( typeof exp === 'number' ){
                    sum += exp;
                    
                    t--;
                    if(t > 0){
                        myMints.pushArg(exp+1);
                    }
                }
            });
            
            expect(sum).to.equal(10);
        });
    });
    
    
});