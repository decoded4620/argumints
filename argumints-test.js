/**
 * Test
 */
var argumintsLib = require('./argumints.js');
var ArguMints = argumintsLib.ArguMints;
var defaultMints = argumintsLib.myArguMints;

testPerformance = function(){
    var list = [];
    for(var i = 0; i < 10; i++){
        list.push("agg" + (i % 20) + "=@testMatcher.txt");
        list.push("agg" + (i % 20) + "=@testMatcher2.txt");
        list.push("agg" + (20 + i % 20) + "=@test.txt");
        list.push("agg" + (20 + i % 20) + "=@test2.txt");
    }
    // add a regex
    list.push("@regExpOrd.txt");
    
    defaultMints.retort(list, function(arg, exp, idx, cnt){
        console.log(arg + "=>" + exp + ", " + (idx+1) + " of " + cnt + " is last one? " + (idx == cnt-1));
    });
}
test = function(){
    
    ArguMints.verbose = true;
    defaultMints.retort([],function(args){
        
    },
    function(arg, exp, idx, cnt){
    });
}

test();

if(defaultMints.opt('minty-test-p')){
    testPerformance();
}

console.log("script args: " + defaultMints.getScriptArgs().length);
console.log("user args:   " + defaultMints.getUserArgs().length);
console.log("ops =        " + defaultMints.getStats().ops);
console.log("bickerTime = " + defaultMints.getStats().bickerTime);
defaultMints.reset();