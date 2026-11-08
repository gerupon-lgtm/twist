import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// Actual default start flow and DOM practice inputs only. The recovery driver
// reads the ray of the displayed FD; it never imports guidance/kernel code.
test('normal sonic flow recovers the deliberately missed first gate by its displayed director',async({page})=>{
  test.setTimeout(150000);
  const errors=[],trace=[],evidence={layer:'actual main/start-flow/practice/displayed-FD',driverGain:1.5,sampleMilliseconds:100,trace,errors};
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});await page.clock.install();
  await page.addInitScript(()=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'cockpit'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.flight-settings.v1',JSON.stringify({deadzone:3,maxTilt:25,steerTiltDeadzone:3,maxSteerTilt:15,steerCurve:1,autoAfterburner:false}));
    localStorage.setItem('twist.supersonic-settings.v1',JSON.stringify({maxG:9,fuelMode:'unlimited',pitchGain:.35,radarRange:10000}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
  });
  async function read(){return page.locator('#app').evaluate(app=>{
    const d=app.dataset,json=k=>JSON.parse(d[k]??'null');
    const visible=id=>{const el=document.getElementById(id);return Boolean(el&&!el.hasAttribute('hidden')&&el.getClientRects().length);};
    return {phase:d.phase,camera:d.camera,input:d.input,startFlow:d.startFlow,speed:+d.speed,pitch:+d.flightPitch,heading:+d.heading,bank:+d.bank,
      position:json('position'),velocity:json('velocity'),sonic:json('supersonic'),startup:json('startup'),ready:d.guidanceReady==='true',direction:json('guidanceDirection'),
      pairVisible:visible('guidance-director')&&visible('guidance-flight-path'),guidanceMode:document.getElementById('guidance-panel').dataset.mode,
      reason:document.getElementById('guidance-status').textContent,clamped:document.getElementById('guidance-director').dataset.clamped};
  });}
  function sample(state,stage,inputs){return {stage,seconds:state.sonic.simulationSeconds,position:state.position,velocity:state.velocity,speed:state.speed,pitch:state.pitch,heading:state.heading,bank:state.bank,
    activeGateIndex:state.sonic.activeGateIndex,missCount:state.sonic.gateResults[0].missCount,passedAtSeconds:state.sonic.gateResults[0].passedAtSeconds,
    ready:state.ready,pairVisible:state.pairVisible,direction:state.direction,guidanceMode:state.guidanceMode,reason:state.reason,clamped:state.clamped,inputs};}
  // Invert the existing phone-angle mapping (default curve1), not the flight
  // state. Browser range quantization remains unchanged and is recorded below.
  async function apply(state,{bankDemand=0,pitchDemand=0}={}){
    const maxPitch=15*state.sonic.effectiveSettings.pitchGain*Math.PI/180;
    const pitchFraction=Math.max(-1,Math.min(1,pitchDemand/maxPitch));
    const steer=bankDemand===0?0:Math.sign(bankDemand)*(3+12*Math.abs(bankDemand));
    const pitch=pitchFraction===0?0:Math.sign(pitchFraction)*(3+22*Math.abs(pitchFraction));
    const dryFeedforward=(200/340)**2; // drag(200)/dryThrust; wave drag is absent at200.
    const throttle=100*Math.max(0,Math.min(1,dryFeedforward+.12*(200-state.speed)));
    return page.evaluate(values=>{
      const applied={};for(const [id,value]of [['practice-steer',values.steer],['practice-pitch',values.pitch],['throttle-input',values.throttle]]){
        const el=document.getElementById(id);el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));applied[id]=+el.value;
      }return {requested:values,applied};
    },{steer,pitch,throttle,bankDemand,pitchDemand});
  }
  try{
    await page.goto('/?course=supersonic&camera=cockpit');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
    await expect(page.locator('#app')).toHaveAttribute('data-start-flow','on');
    await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');await page.locator('#start-flow-start').click();
    await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','courses');await page.locator('[data-course-id=supersonic]').click();
    await page.locator('#start-flow-course-start').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
    await page.locator('#start-flow-hold').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
    await page.clock.runFor(2900);expect((await read()).phase).not.toBe('running');await page.clock.runFor(120);
    await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','play');
    let state=await read();evidence.initial=state;
    expect(state.input).toBe('practice');expect(state.camera).toBe('cockpit');expect(state.sonic.effectiveSettings).toMatchObject({maxG:9,fuelMode:'unlimited',pitchGain:.35});
    expect(state.sonic.activeGateIndex).toBe(0);expect(state.sonic.gateResults[0].missCount).toBe(0);
    const attemptId=state.sonic.attemptId,startHeading=state.heading;let seedPhase='pulse';
    for(let i=0;i<600&&state.sonic.gateResults[0].missCount===0;i++){
      expect(state.phase,'seed must remain in a live flight').toBe('running');expect(state.sonic.activeGateIndex,'seed must miss gate1 before collecting it').toBe(0);
      if(seedPhase==='pulse'&&wrap(state.heading-startHeading)>=.04){seedPhase='coast';evidence.pulseEnd=state;}
      const inputs=await apply(state,{bankDemand:seedPhase==='pulse'?.7:0});trace.push(sample(state,`seed-${seedPhase}`,inputs));
      await page.clock.runFor(100);state=await read();
    }
    evidence.atMiss=state;
    expect(state.sonic.gateResults[0].missCount,'the actual bank pulse must first miss gate1').toBeGreaterThanOrEqual(1);
    expect(state.sonic.activeGateIndex).toBe(0);expect(state.sonic.gateResults[0].passedAtSeconds).toBeNull();
    const missAt=state.sonic.simulationSeconds;let previousHeading=state.heading,totalTurn=0,ready=0,unready=0,maxExtent=0,minSpeed=Infinity,maxSpeed=0,maximumG=0;
    for(let i=0;i<900&&state.sonic.activeGateIndex===0;i++){
      expect(state.phase,'recovery must remain a live flight').toBe('running');
      let bankDemand=0,pitchDemand=0;
      if(state.ready&&state.direction&&state.pairVisible){
        ready++;
        const v=state.velocity,direction=state.direction,track=Math.atan2(v.x,-v.z);
        const yaw=wrap(Math.atan2(direction.x,-direction.z)-track);
        const actualClimb=Math.atan2(v.y,Math.hypot(v.x,v.z)),commandClimb=Math.atan2(direction.y,Math.hypot(direction.x,direction.z));
        const maxBank=Math.atan(Math.sqrt(state.sonic.effectiveSettings.maxG**2-1));
        const bank=Math.max(-maxBank,Math.min(maxBank,Math.atan(1.5*yaw*state.speed/9.8)));
        bankDemand=bank/maxBank;
        const maxPitch=15*state.sonic.effectiveSettings.pitchGain*Math.PI/180;
        pitchDemand=Math.max(-maxPitch,Math.min(maxPitch,state.pitch+1.5*(commandClimb-actualClimb)));
      }else unready++;
      const inputs=await apply(state,{bankDemand,pitchDemand});trace.push(sample(state,'displayed-recovery',inputs));
      await page.clock.runFor(100);state=await read();
      totalTurn+=Math.abs(wrap(state.heading-previousHeading));previousHeading=state.heading;
      maxExtent=Math.max(maxExtent,Math.abs(state.position.x),Math.abs(state.position.z));minSpeed=Math.min(minSpeed,state.speed);maxSpeed=Math.max(maxSpeed,state.speed);maximumG=Math.max(maximumG,state.sonic.gLoad);
    }
    evidence.final=state;evidence.recovery={seconds:state.sonic.simulationSeconds-missAt,totalTurnRadians:totalTurn,turns:totalTurn/(2*Math.PI),ready,unready,maxExtent,minSpeed,maxSpeed,maximumG};
    expect(state.sonic.attemptId).toBe(attemptId);expect(state.phase).toBe('running');
    expect(state.sonic.activeGateIndex,JSON.stringify(evidence.recovery)).toBe(1);
    expect(state.sonic.gateResults[0].id).toBe('supersonic-gate-1');expect(state.sonic.gateResults[0].missCount).toBeGreaterThanOrEqual(1);
    expect(state.sonic.gateResults[0].passedAtSeconds).toBeGreaterThan(evidence.atMiss.sonic.simulationSeconds);
    expect(state.sonic.gateResults[0].lastCrossingRadialDistance).toBeLessThanOrEqual(80);
    expect(state.sonic.grounded).toBe(false);expect(maximumG).toBeLessThanOrEqual(9+1e-6);expect(ready).toBeGreaterThan(50);
    expect(evidence.recovery.seconds).toBeLessThan(90);expect(errors).toEqual([]);
    await page.screenshot({path:'.cache/v0132-gui-miss-recovery-pass.png'});
    await page.locator('#pause-button').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pause');
  }finally{
    await mkdir('.cache',{recursive:true});await writeFile('.cache/v0132-gui-miss-recovery.json',JSON.stringify(evidence,null,2)+'\n');
    await page.screenshot({path:'.cache/v0132-gui-miss-recovery.png'}).catch(()=>{});
  }
});
