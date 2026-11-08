import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicActivity} from '../src/supersonic-activity.js';
test('native first-frame zero, pause and resume cannot import waiting time into Mach records',()=>{
 const clock=createSupersonicActivity();clock.begin({attemptId:1,simulationSeconds:0});
 clock.advance(0,{attemptId:1,simulationSeconds:0});
 clock.advance(.5,{attemptId:1,simulationSeconds:.5,metrics:{firstMach1Seconds:.3}});
 clock.begin({attemptId:1,simulationSeconds:.5});clock.advance(0,{attemptId:1,simulationSeconds:.5});
 clock.advance(.25,{attemptId:1,simulationSeconds:.75,metrics:{firstMach1Seconds:.3}});
 assert.deepEqual(clock.snapshot(),{attemptId:1,activeSeconds:.75,interruptedSeconds:0,firstMach1ActiveSeconds:.3,firstMach2ActiveSeconds:null});
});
test('a terminal fraction excludes unused real frame time and a new attempt gets new clocks',()=>{
 const clock=createSupersonicActivity();clock.begin({attemptId:1,simulationSeconds:0});
 clock.advance(2,{attemptId:1,simulationSeconds:1,timing:{terminalRemainder:1},firstMach1Seconds:.4,firstMach2Seconds:.9});
 assert.equal(clock.snapshot().activeSeconds,1);assert.equal(clock.snapshot().firstMach2ActiveSeconds,.9);
 clock.begin({attemptId:2,simulationSeconds:0});assert.equal(clock.snapshot().activeSeconds,0);assert.equal(clock.snapshot().firstMach1ActiveSeconds,null);
});
test('unprocessed active time is observed separately and never presented as a measured Mach crossing',()=>{
 const clock=createSupersonicActivity();clock.begin({attemptId:1,simulationSeconds:0});
 clock.advance(1,{attemptId:1,simulationSeconds:.5,firstMach1Seconds:.3});
 assert.equal(clock.snapshot().activeSeconds,1);assert.equal(clock.snapshot().interruptedSeconds,.5);
 assert.equal(clock.snapshot().firstMach1ActiveSeconds,null);
 clock.advance(.1,{attemptId:1,simulationSeconds:.5});assert.equal(clock.snapshot().interruptedSeconds,.6);
});
