import {test} from 'node:test';import assert from 'node:assert/strict';
import {createAfterburnerSession} from '../src/afterburner-session.js';
test('AB counters survive retries without double counting pause copies and remain detached',()=>{
 const s=createAfterburnerSession();s.advance({uses:1,seconds:2,earned:25,maxSpeed:34});s.advance({uses:1,seconds:2,earned:25,maxSpeed:34});
 assert.equal(s.snapshot().uses,1);s.beginLeg();s.advance({uses:2,seconds:3,earned:40,maxSpeed:40});
 assert.deepEqual(s.snapshot(),{uses:3,seconds:5,earned:65,maxSpeed:40});assert.equal(s.lastLegSnapshot().uses,2);
 const snapshot=s.snapshot();snapshot.uses=99;assert.equal(s.snapshot().uses,3);s.reset();assert.equal(s.snapshot().maxSpeed,0);
});
