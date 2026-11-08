import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeWristInputSettings,wristSteeringDemand,resolveSteeringChoice,WRIST_SENSITIVITY_PRESETS} from '../src/wrist-input.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} vs ${expected}`);
test('new wrist defaults are three/twenty-five without modifying legacy numeric settings',()=>{
  const saved={steerTiltDeadzone:2,maxSteerTilt:27,steerTwistDeadzone:7,maxSteerTwist:35},before=JSON.stringify(saved);
  assert.deepEqual(normalizeWristInputSettings(saved),{steerWristDeadzone:3,maxSteerWrist:25,steerCurve:1});assert.equal(JSON.stringify(saved),before);
});
test('wrist deadzone/maximum/curve use the existing demand convention and positive means right',()=>{
  for(const angle of [-3,0,3])near(wristSteeringDemand(angle),0);
  near(wristSteeringDemand(14),.5);near(wristSteeringDemand(-14),-.5);near(wristSteeringDemand(25),1);near(wristSteeringDemand(-80),-1);
  near(wristSteeringDemand(14,{steerCurve:2}),.25);near(wristSteeringDemand(14,{},2),1);near(wristSteeringDemand(25,{},.5),.5);
  near(wristSteeringDemand(25,{},-1),0);near(wristSteeringDemand(NaN),0);
});
test('normalized bounds never allow a zero denominator and presets require explicit application',()=>{
  assert.deepEqual(normalizeWristInputSettings({steerWristDeadzone:99,maxSteerWrist:1,steerCurve:9}),{steerWristDeadzone:4,maxSteerWrist:5,steerCurve:2});
  assert.deepEqual(normalizeWristInputSettings({steerWristDeadzone:-1,maxSteerWrist:90,steerCurve:0}),{steerWristDeadzone:0,maxSteerWrist:40,steerCurve:1});
  assert.deepEqual(WRIST_SENSITIVITY_PRESETS,{calm:30,normal:25,agile:18});
});
test('a valid explicit URL wins, otherwise an old saved choice wins and reads never request persistence',()=>{
  assert.deepEqual(resolveSteeringChoice(),{mode:'tilt',source:'default',persist:false});
  assert.deepEqual(resolveSteeringChoice({storedMode:'twist'}),{mode:'twist',source:'saved',persist:false});
  assert.deepEqual(resolveSteeringChoice({urlMode:'wrist',storedMode:'tilt'}),{mode:'wrist',source:'url',persist:false});
  assert.deepEqual(resolveSteeringChoice({urlMode:'tilt',storedMode:'wrist'}),{mode:'tilt',source:'url',persist:false});
  assert.deepEqual(resolveSteeringChoice({urlMode:'unknown',storedMode:'twist'}),{mode:'twist',source:'saved',persist:false});
  assert.deepEqual(resolveSteeringChoice({storedMode:'unknown'}),{mode:'tilt',source:'default',persist:false});
});
