import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const fixture='/tests/fixtures/supersonic-renderer.html';
const evidence=new URL('../.cache/v0137-world/',import.meta.url);
async function save(name,value){await mkdir(evidence,{recursive:true});await writeFile(new URL(name,evidence),JSON.stringify(value,null,2)+'\n');}

test('GPU marker centroid agrees with final camera in 3 views, 2 origins, and a grid crossing near 20km',async({page})=>{
  test.setTimeout(90000);await page.setViewportSize({width:390,height:844});await page.goto(fixture);
  const results=await page.evaluate(async()=>{
    const {createSupersonicRenderer}=await import('/src/supersonic/renderer.js');
    const {createSupersonicState,supersonicOrientation}=await import('/src/supersonic/physics.js');
    const {createSupersonicProfile}=await import('/src/supersonic/profile.js');
    const {SUPERSONIC_COURSE}=await import('/src/supersonic/course.js');
    const {rotateVector}=await import('/src/supersonic/gate-crossing.js');
    const renderer=createSupersonicRenderer(document.getElementById('fixture'),{course:SUPERSONIC_COURSE});renderer.resize(390,844,1);
    const state={...createSupersonicState(createSupersonicProfile(),SUPERSONIC_COURSE),position:{x:19968,y:1500.375,z:-19968},orientation:supersonicOrientation(.23,.08,.37),heading:.23,pitch:.08,bank:.37};
    const offset=rotateVector({x:2.375,y:1.125,z:-80.625},state.orientation),target={x:state.position.x+offset.x,y:state.position.y+offset.y,z:state.position.z+offset.z};
    const rows=[];
    for(const mode of ['overlay','chase','cockpit'])for(const display of ['bank','fixed']){
      renderer.setCameraMode(mode);renderer.setDisplay(display);
      for(const origin of [{x:19456,y:1024,z:-19456},{x:20480,y:1024,z:-20480}]){
        renderer.sync(state,{highSpeedShake:false,speedFov:0,displayTwist:.12},0,{phase:'paused',origin});
        rows.push({mode,display,...renderer.drawMarkerDiagnostic(target,{radiusMetres:.5})});
      }
    }
    renderer.setCameraMode('cockpit');renderer.setDisplay('bank');
    for(const x of [19967.9,19968.1,19968.3]){
      renderer.sync({...state,position:{...state.position,x}},{highSpeedShake:false,speedFov:0},0,{phase:'paused'});
      rows.push({mode:'grid-cross',display:'bank',...renderer.drawMarkerDiagnostic(target,{radiusMetres:.5})});
    }
    const resources=renderer.snapshot();renderer.dispose();return {rows,resources};
  });
  for(const row of results.rows){expect(row.pixels,JSON.stringify(row)).toBeGreaterThan(4);expect(Math.hypot(row.centroid.x-row.analytic.x,row.centroid.y-row.analytic.y),JSON.stringify(row)).toBeLessThan(.8);}
  for(let i=0;i<12;i+=2)expect(Math.hypot(results.rows[i].centroid.x-results.rows[i+1].centroid.x,results.rows[i].centroid.y-results.rows[i+1].centroid.y)).toBeLessThan(.2);
  const crossing=results.rows.slice(-3);expect(crossing[0].origin.x).toBe(19456);expect(crossing[1].origin.x).toBe(20480);expect(crossing[2].origin.x).toBe(20480);
  await save('gpu-projection.json',results);
});

test('GPU sea/cloud images retain phase across rebase and resources stay bounded',async({page})=>{
  test.setTimeout(60000);await page.setViewportSize({width:390,height:844});await page.goto(fixture);
  const result=await page.evaluate(async()=>{
    const {createSupersonicRenderer}=await import('/src/supersonic/renderer.js');
    const {createSupersonicState,supersonicOrientation}=await import('/src/supersonic/physics.js');
    const {createSupersonicProfile}=await import('/src/supersonic/profile.js');
    const {SUPERSONIC_COURSE}=await import('/src/supersonic/course.js');
    const renderer=createSupersonicRenderer(document.getElementById('fixture'),{course:SUPERSONIC_COURSE,cameraMode:'cockpit'});renderer.resize(390,844,1);
    const state={...createSupersonicState(createSupersonicProfile(),SUPERSONIC_COURSE),position:{x:19968,y:1500,z:-19968},orientation:supersonicOrientation(.15,-.3,0),simulationSeconds:17};
    const input={highSpeedShake:false,speedFov:0};
    renderer.sync(state,input,0,{phase:'paused',origin:{x:19456,y:1024,z:-19456}});const first=renderer.readFrameDiagnostic(),a=renderer.snapshot(),objects=renderer.getPassObjects(),cloud={...objects[0].position};
    renderer.sync(state,input,0,{phase:'paused',origin:{x:20480,y:1024,z:-20480}});const second=renderer.readFrameDiagnostic(),b=renderer.snapshot();
    let absoluteError=0,changed=0,maximum=0;for(let i=0;i<first.pixels.length;i+=4){let error=0;for(let k=0;k<3;k++){const difference=Math.abs(first.pixels[i+k]-second.pixels[i+k]);absoluteError+=difference;error+=difference;maximum=Math.max(maximum,difference);}if(error>6)changed++;}
    const unchangedCloud=JSON.stringify(cloud)===JSON.stringify(objects[0].position),stablePass=objects===renderer.getPassObjects();
    const counts=[];for(let i=0;i<20;i++){
      renderer.sync({...state,position:{...state.position,x:19968+i*400},simulationSeconds:17+i*.1},input,.1,{phase:'paused'});counts.push(renderer.snapshot().gpu);
    }
    const c=renderer.snapshot();renderer.setVisibility('legacy');const hidden=renderer.getPassObjects().length===0;renderer.setVisibility('assisted');
    renderer.dispose();renderer.dispose();const disposed=renderer.snapshot();
    return {meanChannelError:absoluteError/(390*844*3),changedRatio:changed/(390*844),maximum,a,b,c,counts,unchangedCloud,stablePass,hidden,disposed};
  });
  expect(result.meanChannelError).toBeLessThan(.5);expect(result.changedRatio).toBeLessThan(.01);
  expect(result.unchangedCloud&&result.stablePass&&result.hidden).toBe(true);expect(result.a.world.sea.phase).toEqual(result.b.world.sea.phase);expect(result.a.world.cloudPhase).toBe(result.b.world.cloudPhase);
  expect(new Set(result.counts.map(c=>c.geometries)).size).toBe(1);expect(new Set(result.counts.map(c=>c.textures)).size).toBe(1);expect(new Set(result.counts.map(c=>c.programs)).size).toBe(1);
  expect(result.counts.every(c=>c.calls>0)).toBe(true);
  expect(result.disposed.disposed).toBe(true);expect(result.disposed.world.geometryCount).toBe(0);expect(result.disposed.world.sea.textureCount).toBe(0);
  await save('gpu-phase-resources.json',result);
});

for(const fuelMode of ['unlimited','gauge'])test(`actual stage AB flight reaches M2 and all six gates with ${fuelMode} fuel`,async({page})=>{
  test.setTimeout(90000);await page.goto(fixture);
  const result=await page.evaluate(async fuelMode=>{
    const {createSupersonicStageAdapter}=await import('/src/supersonic/stage.js');
    const {createSupersonicRenderer}=await import('/src/supersonic/renderer.js');
    const {SUPERSONIC_COURSE}=await import('/src/supersonic/course.js');
    const renderer=createSupersonicRenderer(document.getElementById('fixture'),{course:SUPERSONIC_COURSE,cameraMode:'cockpit'});
    const stage=createSupersonicStageAdapter(renderer,{course:SUPERSONIC_COURSE,supersonicSettings:{fuelMode,maxG:9}});stage.resize(390,844,1);stage.launchFlight();
    const input={highSpeedShake:false,speedFov:0,speedSettings:{streakAmount:0},supersonic:{bankDemand:0,pitchDemandRadians:0,throttle:1,afterburnerRequested:true}};
    const trace=[],events=[],movingGpu=[];let status=stage.getStatus(),paused=false;
    for(let i=0;i<120&&!status.complete&&!status.grounded;i++){
      stage.update(1,input);status=stage.getStatus();events.push(...status.supersonic.events);
      if(status.speed>=679.99&&movingGpu.length<3&&!status.complete){
        const target={x:status.position.x+2,y:status.position.y+2,z:status.position.z-100};
        movingGpu.push({speed:status.speed,seconds:status.supersonic.simulationSeconds,...renderer.drawMarkerDiagnostic(target,{radiusMetres:.7})});
      }
      if(i%5===0||status.complete)trace.push({seconds:status.supersonic.simulationSeconds,speed:status.speed,mach:status.supersonic.mach,position:status.position,clearance:status.groundClearance,collected:status.collected,fuel:status.afterburner.fuel,origin:status.supersonic.renderDiagnostics.origin});
      if(i===30){const before=JSON.stringify([status.position,status.velocity,status.orientation,status.supersonic.simulationSeconds]);stage.update(0,{paused:true});const held=stage.getStatus();paused=before===JSON.stringify([held.position,held.velocity,held.orientation,held.supersonic.simulationSeconds])&&!held.afterburner.active;stage.launchFlight();stage.update(.001,{...input,supersonic:{...input.supersonic,afterburnerRequested:false}});}
    }
    const out={complete:status.complete,grounded:status.grounded,collected:status.collected,position:status.position,afterburner:status.afterburner,supersonic:status.supersonic,trace,events,movingGpu,paused};stage.dispose();return out;
  },fuelMode);
  expect(result.complete,JSON.stringify(result.trace)).toBe(true);expect(result.grounded).toBe(false);expect(result.collected).toBe(5);expect(result.paused).toBe(true);
  expect(result.supersonic.metrics.maximumMach).toBe(2);expect(result.supersonic.metrics.firstMach1Seconds).toBeGreaterThan(0);expect(result.supersonic.metrics.firstMach2Seconds).toBeGreaterThan(result.supersonic.metrics.firstMach1Seconds);
  expect(result.supersonic.gateResults.every(g=>Number.isFinite(g.passedAtSeconds))).toBe(true);expect(result.events.filter(e=>e.type==='gate-pass'||e.type==='exit-pass')).toHaveLength(6);
  expect(result.movingGpu).toHaveLength(3);expect(new Set(result.movingGpu.map(r=>r.origin.z)).size).toBeGreaterThan(1);
  for(const sample of result.movingGpu){expect(sample.speed).toBe(680);expect(sample.pixels).toBeGreaterThan(4);expect(Math.hypot(sample.centroid.x-sample.analytic.x,sample.centroid.y-sample.analytic.y)).toBeLessThan(.8);}
  expect(result.afterburner.unlimited).toBe(fuelMode==='unlimited');expect(result.afterburner.fuel).toBeGreaterThan(0);expect(result.supersonic.metrics.minimumSeaClearance).toBeGreaterThan(1400);
  if(fuelMode==='gauge'){expect(result.afterburner.consumed).toBeGreaterThan(80);expect(result.afterburner.earned).toBeGreaterThan(0);}else expect(result.afterburner.consumed).toBe(0);
  await save(`actual-ab-${fuelMode}.json`,result);
});

test('actual dive stops at shared hull contact and GPU solid meets the sea before center altitude zero',async({page})=>{
  test.setTimeout(90000);await page.goto(fixture);
  const result=await page.evaluate(async()=>{
    const {createSupersonicRenderer}=await import('/src/supersonic/renderer.js');
    const {createSupersonicState,advanceSupersonic}=await import('/src/supersonic/physics.js');
    const {createSupersonicProfile}=await import('/src/supersonic/profile.js');
    const {SUPERSONIC_COURSE}=await import('/src/supersonic/course.js');
    const profile=createSupersonicProfile({pitchGain:1,maxG:9}),renderer=createSupersonicRenderer(document.getElementById('fixture'),{course:SUPERSONIC_COURSE,cameraMode:'chase'});renderer.resize(390,844,1);
    let state=createSupersonicState(profile,SUPERSONIC_COURSE);const events=[];
    for(let i=0;i<120&&!state.grounded&&!state.complete;i++){const result=advanceSupersonic(state,{bankDemand:0,pitchDemandRadians:-Math.PI/12,throttle:.5,afterburnerRequested:false},1,profile,SUPERSONIC_COURSE);state=result.state;events.push(...result.events);}
    renderer.sync(state,{highSpeedShake:false,speedFov:0,speedSettings:{streakAmount:0}},0,{phase:'terminal'});
    const mask=renderer.drawContactDiagnostic(state.terminal.contactPoint),snapshot=renderer.snapshot();window.supersonicContactRenderer=renderer;
    return {state,events,mask,snapshot};
  });
  expect(result.state.grounded).toBe(true);expect(result.state.position.y).toBeGreaterThan(.1);expect(result.state.position.y).toBeLessThan(4);expect(result.state.groundClearance).toBe(0);expect(result.state.terminal.contactPoint.y).toBe(0);
  expect(result.mask.solidPixels).toBeGreaterThan(20);expect(result.mask.seaPixels).toBeGreaterThan(1000);expect(result.mask.nearestSolid,JSON.stringify(result.mask)).toBeLessThan(2);expect(result.mask.nearestSea,JSON.stringify(result.mask)).toBeLessThan(2);
  await mkdir(evidence,{recursive:true});await page.screenshot({path:fileURLToPath(new URL('actual-hull-sea-contact.png',evidence)),fullPage:true});
  await page.evaluate(()=>window.supersonicContactRenderer.dispose());await save('actual-hull-sea-contact.json',result);
});
