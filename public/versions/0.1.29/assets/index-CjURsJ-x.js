(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=e=>Math.max(0,Math.min(1.2,Number.isFinite(e)?e:0)),t={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1,PageUp:10,PageDown:-10};function n(n,{onChange:r,getValue:i}={}){let a=n.ownerDocument,o=e(Number(n.value)/100),s=null,c=!1;n.min=`0`,n.max=`120`,n.step=`1`;let l=n.style.pointerEvents,u=a.createElement(`div`);u.className=`throttle-drag-control`,Object.assign(u.style,{position:`relative`,minWidth:`0`}),n.replaceWith(u),u.append(n),n.style.pointerEvents=`none`;let d=a.createElement(`div`);d.className=`throttle-drag-surface`,d.setAttribute(`aria-hidden`,`true`),Object.assign(d.style,{position:`absolute`,inset:`0`,touchAction:`pan-y`,cursor:`ew-resize`}),u.append(d);let f=[],p=(e,t,n)=>{e.addEventListener(t,n),f.push([e,t,n])},m=()=>{let t=i?.();return Number.isFinite(t)?e(t):o};function h(t=m()){o=e(t),n.value=String(Math.round(o*100))}function g(t){h(Math.round(e(t)*100)/100),r?.(o)}function _(){let e=s?.pointer;if(s=null,e!==void 0)try{d.releasePointerCapture(e)}catch{}}function v(){let e=m();_(),e>1?g(1):h(e)}p(d,`click`,e=>e.preventDefault()),p(d,`pointerdown`,e=>{if(!(c||n.disabled||e.button!==0||e.isPrimary===!1||!e.isTrusted)){e.preventDefault(),n.focus({preventScroll:!0}),h(m()),s={pointer:e.pointerId,x:e.clientX,y:e.clientY,value:o,started:!1,scroll:!1};try{d.setPointerCapture(e.pointerId)}catch{}}}),p(d,`pointermove`,e=>{if(!s||s.pointer!==e.pointerId||n.disabled||!e.isTrusted)return;let t=e.clientX-s.x,r=e.clientY-s.y;if(!s.started){if(Math.abs(r)>=5&&Math.abs(r)>Math.abs(t)&&(s.scroll=!0),s.scroll||Math.abs(t)<5||Math.abs(r)>Math.abs(t))return;s.started=!0}e.preventDefault();let i=Math.max(20,n.getBoundingClientRect().width-28);g(s.value+t/i*1.2)}),p(d,`pointerup`,e=>{s?.pointer===e.pointerId&&_()});for(let e of[`pointercancel`,`lostpointercapture`])p(d,e,e=>{s?.pointer===e.pointerId&&v()});return p(n,`keydown`,e=>{n.disabled||e.altKey||e.ctrlKey||e.metaKey||!e.isTrusted||(Object.hasOwn(t,e.key)||e.key===`Home`||e.key===`End`)&&(e.preventDefault(),_(),g(e.key===`Home`?0:e.key===`End`?1.2:m()+t[e.key]/100))}),p(n,`input`,e=>{if(n.disabled){h(m());return}let t=Number(n.value)/100;t>1&&!e.isTrusted?h(m()):g(t)}),h(o),{sync:h,cancel:v,dispose(){if(!c){v(),c=!0;for(let[e,t,n]of f)e.removeEventListener(t,n);n.style.pointerEvents=l,u.replaceWith(n)}}}}function r(e,t={}){let n=document.getElementById(`afterburner-hud`);if(!n)return;let r=e.afterburner??{},i=Math.max(0,Math.min(100,Number.isFinite(r.fuel)?r.fuel:0)),a=r.active?`ON`:r.needsRelease?`RELEASE`:i<=0?`EMPTY`:`READY`;n.dataset.status=a.toLowerCase(),n.dataset.active=String(r.active===!0),n.dataset.fuel=String(i),n.querySelector(`i`).style.width=`${i}%`,n.querySelector(`output`).textContent=`${Math.floor(i)}`,n.title=t.hudLanguage===`ja`?`AB ${Math.floor(i)} / 100。110%まで横に動かすと点火。100%へ戻すと解除。`:`AB ${Math.floor(i)} / 100 · ${a} · DRAG TO 110%, RETURN TO 100%`,n.setAttribute(`aria-label`,n.title),n.querySelector(`b`).textContent=r.active?`AB ON`:`AB`;let o=document.getElementById(`afterburner-status`);o.textContent=t.hudLanguage===`ja`?r.active?`作動中`:r.needsRelease?`戻す`:i<=0?`空`:`使用可`:a}function i(){let e=()=>({uses:0,seconds:0,earned:0,maxSpeed:0}),t=e(),n=e(),r=e(),i=e=>Number.isFinite(e)&&e>0?e:0;return{reset(){t=e(),n=e(),r=e()},beginLeg(){n=e(),r=e()},advance(e={}){for(let a of[`uses`,`seconds`,`earned`]){let o=i(e[a]);t[a]+=Math.max(0,o-r[a]),n[a]=o,r[a]=o}n.maxSpeed=Math.max(n.maxSpeed,i(e.maxSpeed)),t.maxSpeed=Math.max(t.maxSpeed,n.maxSpeed)},snapshot(){return{...t}},lastLegSnapshot(){return{...n}}}}var a=Object.freeze([`m/s`,`km/h`,`kt`]),o=`km/h`;function s(e){return a.includes(e)?e:o}function c(e,t=o){if(!Number.isFinite(e)||e<=0)return 0;let n=s(t);return e*(n===`km/h`?3.6:n===`kt`?3600/1852:1)}var l=Object.freeze({maxFuel:100,startFuel:0,targetReward:25,exitReward:40,comboWindow:10,comboStep:5,comboMaxBonus:15,lowAltitude:12,lowAltitudeMinSpeed:6,lowAltitudeRate:4,drainRate:12,extraThrust:18,maxSpeed:45,autoAngle:35,minAutoAngle:25,maxAutoAngle:60,autoHoldSeconds:.18,autoReleaseDegrees:5}),u=l,d=e=>Number.isFinite(e)?Math.max(0,e):0,f=(e,t)=>Math.min(Number.MAX_VALUE,e+t),p=(e,t,n)=>Math.min(n,Math.max(t,e));function m(){return{fuel:u.startFuel,active:!1,needsRelease:!1,uses:0,seconds:0,earned:0,maxSpeed:0,burstSeconds:0,timeSeconds:0,combo:0,lastTargetSeconds:null,autoHoldSeconds:0,autoRequest:!1}}function h(e){return{fuel:p(d(e?.fuel),0,u.maxFuel),active:e?.active===!0,needsRelease:e?.needsRelease===!0,uses:Math.floor(d(e?.uses)),seconds:d(e?.seconds),earned:d(e?.earned),maxSpeed:d(e?.maxSpeed),burstSeconds:d(e?.burstSeconds),timeSeconds:d(e?.timeSeconds),combo:Math.floor(d(e?.combo)),lastTargetSeconds:Number.isFinite(e?.lastTargetSeconds)&&e.lastTargetSeconds>=0?e.lastTargetSeconds:null,autoHoldSeconds:p(d(e?.autoHoldSeconds),0,u.autoHoldSeconds),autoRequest:e?.autoRequest===!0}}function g(e,t){let n=Math.min(u.maxFuel-e.fuel,t);return{...e,fuel:e.fuel+n,earned:f(e.earned,n)}}function _(e,t={}){let{targets:n=0,exit:r=!1}=t??{},i=h(e),a=Math.floor(d(n));if(a>0){let e=i.lastTargetSeconds===null?1/0:i.timeSeconds-i.lastTargetSeconds,t=e>=0&&e<=u.comboWindow?i.combo:0,n=Math.min(a,4),r=0;for(let e=0;e<n;e+=1)r+=u.targetReward+Math.min(u.comboMaxBonus,t*u.comboStep),t=f(t,1);r+=(a-n)*(u.targetReward+u.comboMaxBonus),i=g({...i,combo:f(t,a-n),lastTargetSeconds:i.timeSeconds},r)}return r===!0?g(i,u.exitReward):i}function v(e){return{...h(e),active:!1,needsRelease:!0,autoHoldSeconds:0,autoRequest:!1}}function y(e,t){let n=h(e);return{...n,maxSpeed:Math.max(n.maxSpeed,d(t))}}function b(e,t,n={}){n??={};let r=h(e),i=r.active;if(n.running!==!0||n.flight!==!0||n.grounded===!0)return{state:v(r),activeSeconds:0,ignited:!1,ended:i};let a=d(t),o=n.manualRequest===!0,s=Number.isFinite(n.autoAngle)?p(n.autoAngle,u.minAutoAngle,u.maxAutoAngle):u.autoAngle,c=Number.isFinite(n.pitchInputDegrees)?n.pitchInputDegrees:0,l=n.autoEnabled!==!0||c>=-(s-u.autoReleaseDegrees),m=0;n.autoEnabled!==!0||l?(r.autoRequest=!1,r.autoHoldSeconds=0):r.autoRequest||(c<=-s?(m=Math.max(0,u.autoHoldSeconds-r.autoHoldSeconds),r.autoHoldSeconds=Math.min(u.autoHoldSeconds,r.autoHoldSeconds+a),r.autoRequest=r.autoHoldSeconds>=u.autoHoldSeconds):r.autoHoldSeconds=0);let _=o||r.autoRequest,y=o?a:r.autoRequest?Math.max(0,a-m):0;!o&&l&&(r.needsRelease=!1);let b=n.autoEnabled===!0&&c<=-s;(_||b)&&r.fuel<=0&&(r.needsRelease=!0);let x=_&&!r.needsRelease?Math.min(y,r.fuel/u.drainRate):0,S=!i&&x>0,C=x>0&&x>=r.fuel/u.drainRate;return r.fuel=C?0:Math.max(0,r.fuel-x*u.drainRate),r.active=_&&!r.needsRelease&&r.fuel>0&&(i||x>0),C&&(r.needsRelease=!0),S&&(r.uses=f(r.uses,1),r.burstSeconds=0),r.seconds=f(r.seconds,x),r.burstSeconds=f(r.burstSeconds,x),r.timeSeconds=f(r.timeSeconds,a),r.maxSpeed=Math.max(r.maxSpeed,d(n.speed)),x===0&&Number.isFinite(n.groundClearance)&&n.groundClearance>0&&n.groundClearance<u.lowAltitude&&Number.isFinite(n.speed)&&n.speed>=u.lowAltitudeMinSpeed&&(r=g(r,u.lowAltitudeRate*(1-n.groundClearance/u.lowAltitude)*a)),{state:r,activeSeconds:x,ignited:S,ended:(i||S)&&!r.active}}var x=Object.freeze({cruiseSpeed:10,defaultThrottle:.5,gravity:3,maxThrust:1.8,cruiseDrag:.9,maxSpeed:30,maxLift:9,stallStart:20*Math.PI/180,stallEnd:70*Math.PI/180,recoveryThrust:5.4,recoveryTurnRate:2.5,maxRecoveryAcceleration:12,maxTimeStep:.05,integrationStep:1/120}),S=(e,t,n)=>Math.min(n,Math.max(t,e)),C=e=>Number.isFinite(e)?e:0,w=(e,t)=>e.x*t.x+e.y*t.y+e.z*t.z,T=e=>({x:C(e?.x),y:C(e?.y),z:C(e?.z)}),E=1e-10,D=(e,t,n)=>{let r=S((e-t)/(n-t),0,1);return r*r*(3-2*r)};function O(e){let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));if(t===0)return null;let n=e.x/t,r=e.y/t,i=e.z/t,a=Math.hypot(n,r,i);return{x:n/a,y:r/a,z:i/a}}function k(e,t=x.maxSpeed){let n=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));if(n===0)return e;let r=Math.hypot(e.x/n,e.y/n,e.z/n);if(n<=t/r)return e;let i=t/r;return{x:e.x/n*i,y:e.y/n*i,z:e.z/n*i}}function A(e){let t=O(T(e?.forward))??{x:0,y:0,z:-1},n=O(T(e?.up))??{x:0,y:1,z:0},r=e=>{let n=w(e,t);return{x:e.x-t.x*n,y:e.y-t.y*n,z:e.z-t.z*n}},i=r(n);return Math.hypot(i.x,i.y,i.z)<E&&(i=r(Math.abs(t.y)<.9?{x:0,y:1,z:0}:{x:0,y:0,z:1})),{forward:t,up:O(i)}}function j(e,t,n,r,i=0){let a=Math.hypot(e.x,e.y,e.z),o=a>E?{x:e.x/a,y:e.y/a,z:e.z/a}:{x:0,y:0,z:0},s=a>E?Math.atan2(-w(e,n),w(e,t)):0,c=w(n,o),l={x:n.x-o.x*c,y:n.y-o.y*c,z:n.z-o.z*c},u=Math.hypot(l.x,l.y,l.z)>E?O(l):null,d=(a/x.cruiseSpeed)**2,f=S((Math.abs(s)-x.stallStart)/(x.stallEnd-x.stallStart),0,1),p=1-f**2*(3-2*f),m=u&&a>E?S(x.gravity*d*(1+4.5*s),-x.maxLift,x.maxLift)*p:0,h=x.cruiseDrag*d,g=(1-D(Math.abs(t.y),Math.sin(Math.PI/12),Math.sin(Math.PI/4)))*D(n.y,.3,.8),_=1-D(w(e,t),1,4.5),v=D(s,x.stallStart,x.stallEnd),y=r*g*Math.max(_,v),b=r*(x.maxThrust+x.recoveryThrust*g*_)+i,C=w(t,o),T={x:t.x-o.x*C,y:t.y-o.y*C,z:t.z-o.z*C},k=Math.hypot(T.x,T.y,T.z),A=k>E?O(T):null,j=A?Math.min(x.maxRecoveryAcceleration,a*x.recoveryTurnRate*r*g*v)*Math.min(1,k/.1):0;return{x:t.x*b-o.x*h+(u?.x??0)*m+(A?.x??0)*j,y:t.y*b-o.y*h+(u?.y??0)*m-x.gravity+(A?.y??0)*j,z:t.z*b-o.z*h+(u?.z??0)*m+(A?.z??0)*j,angleOfAttack:s,lift:m,thrust:b,recoveryAssist:y,recoveryAcceleration:j}}function M(e,t,n){let r=T(e),i=Math.hypot(r.x,r.y,r.z),a=n?.afterburner===!0?l.maxSpeed:n?.preserveOverspeed===!0&&Number.isFinite(i)?Math.max(x.maxSpeed,i):x.maxSpeed,o=n?.afterburner===!0?l.extraThrust:0,s=k(r,a),{forward:c,up:u}=A(n),d=S(C(n?.throttle),0,1),f=S(C(t),0,x.maxTimeStep),p=Math.ceil(f/x.integrationStep),m=p>0?f/p:0;for(let e=0;e<p;e+=1){let e=j(s,c,u,d,o),t=j(k({x:s.x+e.x*m/2,y:s.y+e.y*m/2,z:s.z+e.z*m/2},a),c,u,d,o);s=k({x:s.x+t.x*m,y:s.y+t.y*m,z:s.z+t.z*m},a)}let h=j(s,c,u,d,o);return{velocity:s,speed:Math.hypot(s.x,s.y,s.z),verticalSpeed:s.y,angleOfAttack:h.angleOfAttack,lift:h.lift,throttle:d,engineThrust:h.thrust,recoveryAssist:h.recoveryAssist,recoveryAcceleration:h.recoveryAcceleration}}var N=Object.freeze({speed:[`SPD`,`速度`],altitude:[`ALT`,`現在高度`],verticalSpeed:[`V/S`,`昇降速度`],heading:[`HDG`,`方位`],throttle:[`THR`,`エンジン出力`],targetAltitude:[`TGT ALT`,`目標`],heightSame:[`ALT OK`,`高さ同じ`],heightOkay:[`ALT OK`,`高さOK`],climb:[`CLIMB`,`▲ 早めに上へ`],descend:[`DESCEND`,`▼ 早めに下へ`],nose:[`NOSE`,`機首`],bank:[`BANK`,`翼の傾き`],flightPath:[`FPM`,`進行`],radarTrack:[`TRK`,`進行方向`],terrain:[`TERRAIN`,`地面注意`],pullUp:[`PULL UP`,`地面接近！`],stall:[`STALL`,`失速から復帰補助中`],exit:[`EXIT`,`出口`],exitOpen:[`EXIT OPEN`,`出口開放・黄色と白の門へ`],nextTarget:[`NEXT`,`次は`],flightDirector:[`FD`,`目標へ向かう輪`],aligned:[`ALIGNED`,`合っています`],target:[`TGT`,`目標`],arrived:[`ARRIVED`,`到着`],altitudeShort:[`ALT`,`高さ`],groundClearance:[`ALT`,`地面まで`],climbShort:[`V/S`,`昇降`],guidanceLevel:[`LEVEL TO SHOW GUIDANCE`,`姿勢を水平に戻すと案内を表示`],flightPathOut:[`FPM OUT OF VIEW`,`進行方向は画面外です`],flightPathCovered:[`FPM OBSCURED`,`進行方向の印は計器の奥です`],flightPathWaiting:[`FPM WHEN MOVING`,`移動を始めると進行方向を表示`]}),P=e=>e===`ja`?`ja`:`en`;function F(e,t){return N[t]?.[+(P(e)===`ja`)]??``}function I(e,t=`en`){let n=typeof e?.targetLabel==`string`?e.targetLabel:typeof e?.label==`string`?e.label:``;if(e?.kind===`exit`||n===`出口`||Number.isFinite(e?.collected)&&Number.isFinite(e?.total)&&e.total>0&&e.collected>=e.total)return F(t,`exit`);let r=/^光\s*(\d+)$/.exec(n),i=e?.number??(r?Number(r[1]):Number.isInteger(e?.collected)&&e.collected>=0?e.collected+1:null),a=Number.isInteger(i)&&i>0?i:null;return P(t)===`ja`?n||(a?`光 ${a}`:`目標`):a?`TGT ${a}`:`TGT`}function L(e,t=`en`,{digits:n=1,equal:r=`高さ同じ`}={}){if(!Number.isFinite(e))return`—`;let i=Number.isInteger(n)?Math.max(0,Math.min(3,n)):1;if(Math.abs(e)<.05)return P(t)===`ja`?r:`ALT OK`;let a=Math.abs(e).toFixed(i);return P(t)===`ja`?`${e>0?`▲上に`:`▼下に`}${a}m`:`${e>0?`▲ +`:`▼ −`}${a}m`}function ee(e,t=`en`,{assisted:n=!1}={}){let r=Number.isFinite(e?.bearing)?e.bearing:0,i=Number.isFinite(e?.elevation)?e.elevation:0;if(P(t)===`en`)return Math.abs(i)>.13?i>0?`▲`:`▼`:``;let a=Math.abs(r)>Math.PI/2?n&&Math.abs(r)>=175*Math.PI/180?`後ろ`:r>0?`右の後ろ`:`左の後ろ`:Math.abs(r)>.25?r>0?`右`:`左`:`正面`,o=Math.abs(i)>.13?i>0?`上`:`下`:``;return`${a}${o?`・${o}`:``}`}function te(e,t=`en`){let n=P(t)===`ja`?{clear:`地面との間隔`,low:`低空に注意`,danger:`地面接近！`,stopped:`地面に接触`,unknown:`高さを確認できません`}:{clear:``,low:`TERRAIN`,danger:`PULL UP`,stopped:`TERRAIN`,unknown:`ALT —`};return n[e]??n.unknown}function ne(e={},t=`en`){let n=Number.isFinite(e?.recoveryAssist)&&e.recoveryAssist>0;return n||Number.isFinite(e?.angleOfAttack)&&Math.abs(e.angleOfAttack)>=x.stallStart?P(t)===`ja`&&!n?`失速`:F(t,`stall`):``}function re(e,t,n=`en`){let r=P(n)===`ja`;if(e?.grounded)return r?`地面に接触・停止`:`TERRAIN`;let i=ne(e,n);return[[`danger`,`low`].includes(t?.level)?r?`地面注意`:t.level===`danger`?`PULL UP`:`TERRAIN`:``,i,e?.inputHeld&&t?.level===`clear`&&!i?r?`入力保持中・傾きを戻すと追従`:`INPUT HOLD`:``].filter(Boolean).join(` / `)||(r?`機首 ┼　進行方向 ⊙`:`NOSE ┼　FPM ⊙`)}var ie=Object.freeze({停止中:`STOP`,上昇中:`CLIMB`,下降中:`DESCEND`,巡航中:`CRUISE`,ブレーキ:`BRAKE`,加速中:`ACCEL`,速度維持:`SPD HOLD`,失速からの復帰補助中:`STALL`,地面を見る補助中:`TERRAIN`,中立で翼を戻す:`WINGS LEVEL`});function ae(e,t=`en`){return P(t)===`ja`?e:ie[e]??``}function oe(e,t=`en`){let n=Number.isInteger(e?.total)&&e.total>0?e.total:3,r=Number.isInteger(e?.collected)&&e.collected>=0?Math.min(n,e.collected):0;return P(t)===`ja`?r<n?`${n}つの光を集めて、出口へ`:`光がそろいました。出口へ`:r<n?`TGT ${r}/${n} → EXIT`:`EXIT OPEN`}function se(e,t=`en`){let n=Number.isInteger(e?.total)&&e.total>0?e.total:3,r=Number.isInteger(e?.collected)&&e.collected>=0?Math.max(0,n-e.collected):n;return P(t)===`ja`?r===0?`${n}つの光がそろいました。出口へ向かいましょう。`:`光を集めました。あと${r}つ。`:r===0?`EXIT OPEN`:`TGT COLLECTED · ${r} REM`}function ce(){let e=getComputedStyle(document.documentElement);return{left:Math.max(0,parseFloat(e.getPropertyValue(`--screen-safe-left`))||0),right:Math.max(0,parseFloat(e.getPropertyValue(`--screen-safe-right`))||0)}}var le=e=>document.getElementById(e);function ue(e,{phase:t,mode:n,camera:r,language:i=`en`}={}){let a=le(`flight-essential-hud`),o=n===`flight`,s=P(i)===`ja`;a.hidden=t!==`running`||o&&r===`cockpit`,a.dataset.mode=o?`flight`:`explore`,a.setAttribute(`aria-label`,s?o?`飛行の速度と高度`:`探索の速度と高さ`:o?`FLIGHT READINGS`:`EXPLORE READINGS`);let c=le(`flight-essential-height`),l=le(`flight-essential-vario`),u=le(`flight-warning-text`);c.hidden=le(`target-height-inline`).hidden,l.hidden=!o,le(`flight-essential-vario-label`).textContent=s?`昇降`:`V/S`;let d=Number.isFinite(e.verticalSpeed)?e.verticalSpeed:0;le(`flight-essential-vario-value`).textContent=`${d>0?`+`:``}${d.toFixed(1)}`,le(`flight-essential-details`).hidden=c.hidden&&l.hidden;let f=o?ne(e,i)||(e.inputHeld?s?`入力保持中`:`INPUT HOLD`:``):``;u.textContent!==f&&(u.textContent=f);let p=!f;u.hidden!==p&&(u.hidden=p);let m=le(`flight-essential-alert`),h=u.hidden&&le(`ground-warning-text`).hidden;if(m.hidden!==h&&(m.hidden=h),a.hidden)return;let g=ce(),_=document.querySelector(`.navigation`).getBoundingClientRect(),v=document.querySelector(`.topbar`).getBoundingClientRect(),y=Math.max(_.bottom,v.bottom),b=le(`flight-essential-speed`),x=le(`bottom-panel`).getBoundingClientRect();b.style.width=`76px`;let S={left:g.left+12,right:g.left+88,top:y+124,bottom:y+124+b.getBoundingClientRect().height},C=!o&&S.left<x.right&&S.right>x.left&&S.top<x.bottom&&S.bottom+8>x.top,w=innerWidth>=600&&innerHeight<=500||C;Object.assign(b.style,{left:`${g.left+(w?124:12)}px`,top:`${y+(w?12:124)}px`}),Object.assign(le(`flight-essential-altitude`).style,{left:`${innerWidth-g.right-104}px`,top:`${y+12}px`,width:`92px`}),o||le(`app`).style.setProperty(`--explore-toast-bottom`,`${Math.max(12,innerHeight-le(`bottom-panel`).getBoundingClientRect().top+10)}px`)}var de=Object.freeze({defaultGravity:9.8,minGravity:3,maxGravity:15,yawCap:2.5,minSpeed:6}),fe=(e,t,n)=>Math.min(n,Math.max(t,e)),pe=e=>Number.isFinite(e)?e:0,me=e=>({x:pe(e?.x),y:pe(e?.y),z:pe(e?.z)});function he(e){return Number.isFinite(e)?fe(e,de.minGravity,de.maxGravity):de.defaultGravity}function ge(e,t,n=de.defaultGravity){if(!Number.isFinite(t)||t<=0||!Number.isFinite(e))return 0;let r=fe(e,-Math.PI/2+1e-8,Math.PI/2-1e-8);return fe(he(n)*Math.tan(r)/Math.max(t,de.minSpeed),-de.yawCap,de.yawCap)}function _e(e,t,n=de.defaultGravity){if(!Number.isFinite(e)||e<=0)return 0;let r=Math.abs(ge(t,e,n));return r>0?e/r:1/0}function ve(e,t,n,r){let i=me(e);if(!Number.isFinite(r)||r<=0)return i;let a=Math.hypot(i.x,i.z);if(!a||!Number.isFinite(a))return i;let o=me(t),s=Math.hypot(o.x,o.z)>1e-10?o:i,c=fe(pe(n),-de.yawCap,de.yawCap)*r,l=Math.atan2(s.x,-s.z)+(Number.isFinite(c)?c:0);return{x:Math.sin(l)*a,y:i.y,z:-Math.cos(l)*a}}var ye=(e,t,n)=>Object.freeze({x:e,y:t,z:n}),R=(e,t,n,r,i)=>{let a=Math.hypot(n.x-t.x,n.z-t.z),o=e=>ye(t.x+(n.x-t.x)*e/a,t.y+(n.y-t.y)*e/a,t.z+(n.z-t.z)*e/a);return Object.freeze({id:`${e}-final`,from:o(r),to:o(a-i),width:24,heightTolerance:12})},z=(e,t,n,r,i,a=0,o=0)=>Object.freeze({id:e,name:t,start:Object.freeze(n),lights:Object.freeze(r.map(Object.freeze)),exit:Object.freeze(i),abStraights:Object.freeze(a?[R(e,r.at(-1),i,a,o)]:[])}),be=z(`legacy`,`v0.1.25 比較用`,ye(0,14,26),[ye(0,14,0),ye(4,16,-34),ye(4,18,-68)],ye(8,20,-96)),xe=be,Se=`easy`,B=Object.freeze({easy:z(`easy`,`やさしい・おおきな半周`,ye(-150,22,200),[ye(-150,24,130),ye(-60,30,40),ye(80,24,40)],ye(280,28,40-200*Math.sqrt(3)),90,40),normal:z(`normal`,`ふつう・右から左へ`,ye(-180,22,300),[ye(-180,24,230),ye(-80,30,130),ye(30,24,130),ye(140,32,130),ye(195,24,130-55*Math.sqrt(3))],ye(195-490/Math.sqrt(2),30,130-55*Math.sqrt(3)-490/Math.sqrt(2)),120,40),hard:z(`hard`,`むずかしい・二つのうず`,ye(-240,24,60),[ye(-240,28,0),ye(-240+85/Math.sqrt(2),38,-85/Math.sqrt(2)),ye(-155+85/Math.sqrt(2),28,-85/Math.sqrt(2)),ye(-112.5+85/Math.sqrt(2),38,-85/Math.sqrt(2)+42.5*Math.sqrt(3)),ye(-155+85/Math.sqrt(2),28,-85/Math.sqrt(2)+85*Math.sqrt(3)),ye(-197.5+85/Math.sqrt(2),38,-85/Math.sqrt(2)+127.5*Math.sqrt(3)),ye(-155+85/Math.sqrt(2),28,-85/Math.sqrt(2)+170*Math.sqrt(3)),ye(-70+85/Math.sqrt(2),38,-85/Math.sqrt(2)+170*Math.sqrt(3))],ye(205+85/Math.sqrt(2),28,-85/Math.sqrt(2)-105*Math.sqrt(3)),150,50)});function Ce(e){return typeof e==`string`&&(e===`legacy`||Object.hasOwn(B,e))?e:Se}function V(e){let t=Ce(e);return t===`legacy`?be:B[t]}var we=(e,t,n,r)=>Object.freeze({lightCountRange:Object.freeze(e),utilizationBand:Object.freeze(t),minSignificantTurns:n,cruiseTimeRange:Object.freeze(r)}),Te=Object.freeze({speeds:Object.freeze([10,20]),difficultySpeed:20,cruiseSpeed:10,bankDegrees:30,turnGravity:de.defaultGravity,minimumTurnDegrees:45,maximumUtilization:1,limits:Object.freeze({horizontal:350,minHeight:2,maxHeight:45,heightChange:10,minLights:3,maxLights:8}),abMinimumLengths:Object.freeze({easy:200,normal:300,hard:300}),abMinimumEntryMargin:80,abMinimumExitRunout:35,difficulties:Object.freeze({easy:we([3,4],[.3,.6],2,[60,100]),normal:we([5,6],[.4,.8],3,[90,150]),hard:we([7,8],[.6,.9],6,[120,180])})}),Ee=`twist.course.v1`,De=e=>typeof e==`string`&&Ce(e)===e&&V(e).id===e;function Oe(e,t=``){try{let e=(typeof t==`string`?new URLSearchParams(t):t instanceof URL?t.searchParams:t instanceof URLSearchParams?t:null)?.get(`course`);if(De(e))return e}catch{}try{let t=e?.getItem(Ee);if(De(t))return t}catch{}return Ce()}function ke(e,t){if(!De(t))return!1;try{return e.setItem(Ee,t),!0}catch{return!1}}var Ae=(e,t,n)=>Math.min(n,Math.max(t,e)),je=e=>((e+180)%360+360)%360-180;function Me(e,t={}){if(!e||![e.x,e.z].every(Number.isFinite)||!t||typeof t!=`object`)return null;let{halfExtent:n=350}=t;if(!Number.isFinite(n)||n<=0)return null;let r=Number.isFinite(t.heading)?t.heading%(Math.PI*2):0,i=Number.isFinite(t.speed)?Math.max(0,t.speed):0,a=he(t.turnGravity),o=Number.isFinite(t.maxBank)&&t.maxBank>=0&&t.maxBank<90?t.maxBank:40,s=_e(i,o*Math.PI/180,a),c=Math.min(60,n*.6),l=Math.max(c,n*.75),u=Ae(Number.isFinite(s)?Math.max(c,s*1.3+i*2):l,c,l),d=n-Math.max(Math.abs(e.x),Math.abs(e.z)),f=d<0,p=d<=u,m=Math.max(0,n-u-10),h={x:Ae(e.x,-m,m),y:Number.isFinite(e.y)?e.y:0,z:Ae(e.z,-m,m)},g=h.x-e.x,_=h.z-e.z;g===0&&_===0&&(h={x:0,y:h.y,z:0},g=-e.x,_=-e.z);let v=Math.max(Math.abs(g),Math.abs(_)),y=null,b=null,x=null;if(v>0){let e=g/v,t=_/v,n=Math.hypot(e,t);y={x:e/n,y:0,z:t/n},b=Math.atan2(y.x,-y.z),x=je((b-r)*180/Math.PI),x===-180&&(x=180)}let S=Math.abs(e.x)>=Math.abs(e.z)?e.x<0?`west`:`east`:e.z<0?`north`:`south`,C=t.velocity,w=C&&[C.x,C.z].every(Number.isFinite)?C:{x:Math.sin(r)*i,z:-Math.cos(r)*i},T=[{distance:n-e.x,outward:w.x},{distance:n+e.x,outward:-w.x},{distance:n-e.z,outward:w.z},{distance:n+e.z,outward:-w.z}].filter(e=>Math.abs(e.distance-d)<=1e-7),E=Math.max(...T.map(e=>e.outward)),D=E>.1,O=E<-.1,k=D?`outward`:O?`inward`:Math.hypot(w.x,w.z)>.1?`parallel`:`stopped`,A=D?Math.max(0,d)/E:null;return{halfExtent:n,clearance:d,near:p,outside:f,level:f?`outside`:p?`near`:`clear`,warningDistance:u,turnRadius:Number.isFinite(s)?s:null,turnGravity:a,maxBank:o,returnPosition:h,returnDirection:y,returnHeading:b,returnBearingDeg:x,nearestEdge:S,outwardSpeed:E,motion:k,approaching:D,returning:O,timeToEdge:A}}var Ne=1e3,Pe=1001,Fe=1002,Ie=1003,Le=1004,Re=1005,ze=1006,Be=1007,Ve=1008,He=1009,Ue=1010,We=1011,Ge=1012,Ke=1013,qe=1014,Je=1015,Ye=1016,Xe=1017,Ze=1018,Qe=1020,$e=35902,et=35899,tt=1021,nt=1022,rt=1023,it=1026,at=1027,ot=1028,st=1029,ct=1030,lt=1031,ut=1033,dt=33776,ft=33777,pt=33778,mt=33779,ht=35840,gt=35841,_t=35842,vt=35843,yt=36196,bt=37492,xt=37496,St=37488,Ct=37489,wt=37490,Tt=37491,Et=37808,Dt=37809,Ot=37810,kt=37811,At=37812,jt=37813,Mt=37814,Nt=37815,Pt=37816,Ft=37817,It=37818,Lt=37819,Rt=37820,zt=37821,Bt=36492,Vt=36494,Ht=36495,Ut=36283,Wt=36284,Gt=36285,Kt=36286,qt=2300,Jt=2301,Yt=2302,Xt=2303,Zt=2400,Qt=2401,$t=2402,en=3200,tn=`srgb`,nn=`srgb-linear`,rn=`linear`,an=`srgb`,on=7680,sn=35044,cn=35048,ln=2e3;function un(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function dn(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function fn(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function pn(){let e=fn(`canvas`);return e.style.display=`block`,e}var mn={};function hn(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function gn(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function H(...e){e=gn(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function U(...e){e=gn(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function _n(...e){let t=e.join(` `);t in mn||(mn[t]=!0,H(...e))}function vn(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var yn={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},bn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},xn=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Sn=1234567,Cn=Math.PI/180,wn=180/Math.PI;function Tn(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(xn[e&255]+xn[e>>8&255]+xn[e>>16&255]+xn[e>>24&255]+`-`+xn[t&255]+xn[t>>8&255]+`-`+xn[t>>16&15|64]+xn[t>>24&255]+`-`+xn[n&63|128]+xn[n>>8&255]+`-`+xn[n>>16&255]+xn[n>>24&255]+xn[r&255]+xn[r>>8&255]+xn[r>>16&255]+xn[r>>24&255]).toLowerCase()}function En(e,t,n){return Math.max(t,Math.min(n,e))}function Dn(e,t){return(e%t+t)%t}function On(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function kn(e,t,n){return e===t?0:(n-e)/(t-e)}function An(e,t,n){return(1-n)*e+n*t}function jn(e,t,n,r){return An(e,t,1-Math.exp(-n*r))}function Mn(e,t=1){return t-Math.abs(Dn(e,t*2)-t)}function Nn(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Pn(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function Fn(e,t){return e+Math.floor(Math.random()*(t-e+1))}function In(e,t){return e+Math.random()*(t-e)}function Ln(e){return e*(.5-Math.random())}function Rn(e){e!==void 0&&(Sn=e);let t=Sn+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function zn(e){return e*Cn}function Bn(e){return e*wn}function Vn(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Hn(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Un(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Wn(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:H(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Gn(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Kn(e,t){if(t.constructor===Float32Array)return e;let n=Gn(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function qn(e,t){if(t.constructor===Float32Array)return e;let n=Gn(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var W={DEG2RAD:Cn,RAD2DEG:wn,generateUUID:Tn,clamp:En,euclideanModulo:Dn,mapLinear:On,inverseLerp:kn,lerp:An,damp:jn,pingpong:Mn,smoothstep:Nn,smootherstep:Pn,randInt:Fn,randFloat:In,randFloatSpread:Ln,seededRandom:Rn,degToRad:zn,radToDeg:Bn,isPowerOfTwo:Vn,ceilPowerOfTwo:Hn,floorPowerOfTwo:Un,setQuaternionFromProperEuler:Wn,normalize:qn,denormalize:Kn},G=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=En(this.x,e.x,t.x),this.y=En(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=En(this.x,e,t),this.y=En(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(En(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(En(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},K=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:H(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(En(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},q=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Yn.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Yn.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=En(this.x,e.x,t.x),this.y=En(this.y,e.y,t.y),this.z=En(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=En(this.x,e,t),this.y=En(this.y,e,t),this.z=En(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(En(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Jn.copy(this).projectOnVector(e),this.sub(Jn)}reflect(e){return this.sub(Jn.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(En(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Jn=new q,Yn=new K,Xn=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return _n(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Zn.makeScale(e,t)),this}rotate(e){return _n(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Zn.makeRotation(-e)),this}translate(e,t){return _n(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Zn.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Zn=new Xn,Qn=new Xn().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),$n=new Xn().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function er(){let e={enabled:!0,workingColorSpace:nn,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=nr(e.r),e.g=nr(e.g),e.b=nr(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=rr(e.r),e.g=rr(e.g),e.b=rr(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?rn:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[nn]:{primaries:t,whitePoint:r,transfer:rn,toXYZ:Qn,fromXYZ:$n,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:tn},outputColorSpaceConfig:{drawingBufferColorSpace:tn}},[tn]:{primaries:t,whitePoint:r,transfer:an,toXYZ:Qn,fromXYZ:$n,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:tn}}}),e}var tr=er();function nr(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function rr(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var ir,ar=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ir===void 0&&(ir=fn(`canvas`)),ir.width=e.width,ir.height=e.height;let t=ir.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=ir}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=fn(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=nr(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(nr(t[e]/255)*255):t[e]=nr(t[e]);return{data:t,width:e.width,height:e.height}}return H(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},or=0,sr=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:or++}),this.uuid=Tn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(cr(r[t].image)):e.push(cr(r[t]))}else e=cr(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function cr(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?ar.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(H(`Texture: Unable to serialize Texture.`),{})}var lr=0,ur=new q,dr=class e extends bn{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=Pe,i=Pe,a=ze,o=Ve,s=rt,c=He,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:lr++}),this.uuid=Tn(),this.name=``,this.source=new sr(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new G(0,0),this.repeat=new G(1,1),this.center=new G(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xn,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(ur).x}get height(){return this.source.getSize(ur).y}get depth(){return this.source.getSize(ur).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){H(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?H(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ne:e.x-=Math.floor(e.x);break;case Pe:e.x=e.x<0?0:1;break;case Fe:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Ne:e.y-=Math.floor(e.y);break;case Pe:e.y=e.y<0?0:1;break;case Fe:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};dr.DEFAULT_IMAGE=null,dr.DEFAULT_MAPPING=300,dr.DEFAULT_ANISOTROPY=1;var fr=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=En(this.x,e.x,t.x),this.y=En(this.y,e.y,t.y),this.z=En(this.z,e.z,t.z),this.w=En(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=En(this.x,e,t),this.y=En(this.y,e,t),this.z=En(this.z,e,t),this.w=En(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(En(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},pr=class extends bn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ze,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new fr(0,0,e,t),this.scissorTest=!1,this.viewport=new fr(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new dr({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:ze,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new sr(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},mr=class extends pr{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},hr=class extends dr{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Ie,this.minFilter=Ie,this.wrapR=Pe,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},gr=class extends dr{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Ie,this.minFilter=Ie,this.wrapR=Pe,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},_r=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/vr.setFromMatrixColumn(e,0).length(),i=1/vr.setFromMatrixColumn(e,1).length(),a=1/vr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(br,e,xr)}lookAt(e,t,n){let r=this.elements;return wr.subVectors(e,t),wr.lengthSq()===0&&(wr.z=1),wr.normalize(),Sr.crossVectors(n,wr),Sr.lengthSq()===0&&(Math.abs(n.z)===1?wr.x+=1e-4:wr.z+=1e-4,wr.normalize(),Sr.crossVectors(n,wr)),Sr.normalize(),Cr.crossVectors(wr,Sr),r[0]=Sr.x,r[4]=Cr.x,r[8]=wr.x,r[1]=Sr.y,r[5]=Cr.y,r[9]=wr.y,r[2]=Sr.z,r[6]=Cr.z,r[10]=wr.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],M=r[14],N=r[3],P=r[7],F=r[11],I=r[15];return i[0]=a*x+o*T+s*k+c*N,i[4]=a*S+o*E+s*A+c*P,i[8]=a*C+o*D+s*j+c*F,i[12]=a*w+o*O+s*M+c*I,i[1]=l*x+u*T+d*k+f*N,i[5]=l*S+u*E+d*A+f*P,i[9]=l*C+u*D+d*j+f*F,i[13]=l*w+u*O+d*M+f*I,i[2]=p*x+m*T+h*k+g*N,i[6]=p*S+m*E+h*A+g*P,i[10]=p*C+m*D+h*j+g*F,i[14]=p*w+m*O+h*M+g*I,i[3]=_*x+v*T+y*k+b*N,i[7]=_*S+v*E+y*A+b*P,i[11]=_*C+v*D+y*j+b*F,i[15]=_*w+v*O+y*M+b*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=vr.set(r[0],r[1],r[2]).length(),o=vr.set(r[4],r[5],r[6]).length(),s=vr.set(r[8],r[9],r[10]).length();i<0&&(a=-a),yr.copy(this);let c=1/a,l=1/o,u=1/s;return yr.elements[0]*=c,yr.elements[1]*=c,yr.elements[2]*=c,yr.elements[4]*=l,yr.elements[5]*=l,yr.elements[6]*=l,yr.elements[8]*=u,yr.elements[9]*=u,yr.elements[10]*=u,t.setFromRotationMatrix(yr),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=ln,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=ln,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},vr=new q,yr=new _r,br=new q(0,0,0),xr=new q(1,1,1),Sr=new q,Cr=new q,wr=new q,Tr=new _r,Er=new K,Dr=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(En(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-En(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(En(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-En(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(En(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-En(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:H(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Tr.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Tr,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Er.setFromEuler(this),this.setFromQuaternion(Er,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Dr.DEFAULT_ORDER=`XYZ`;var Or=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},kr=0,Ar=new q,jr=new K,Mr=new _r,Nr=new q,Pr=new q,Fr=new q,Ir=new K,Lr=new q(1,0,0),Rr=new q(0,1,0),zr=new q(0,0,1),Br={type:`added`},Vr={type:`removed`},Hr={type:`childadded`,child:null},Ur={type:`childremoved`,child:null},Wr=class e extends bn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kr++}),this.uuid=Tn(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new q,n=new Dr,r=new K,i=new q(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new _r},normalMatrix:{value:new Xn}}),this.matrix=new _r,this.matrixWorld=new _r,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Or,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return jr.setFromAxisAngle(e,t),this.quaternion.multiply(jr),this}rotateOnWorldAxis(e,t){return jr.setFromAxisAngle(e,t),this.quaternion.premultiply(jr),this}rotateX(e){return this.rotateOnAxis(Lr,e)}rotateY(e){return this.rotateOnAxis(Rr,e)}rotateZ(e){return this.rotateOnAxis(zr,e)}translateOnAxis(e,t){return Ar.copy(e).applyQuaternion(this.quaternion),this.position.add(Ar.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Lr,e)}translateY(e){return this.translateOnAxis(Rr,e)}translateZ(e){return this.translateOnAxis(zr,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Mr.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Nr.copy(e):Nr.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Pr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Mr.lookAt(Pr,Nr,this.up):Mr.lookAt(Nr,Pr,this.up),this.quaternion.setFromRotationMatrix(Mr),r&&(Mr.extractRotation(r.matrixWorld),jr.setFromRotationMatrix(Mr),this.quaternion.premultiply(jr.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(U(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Br),Hr.child=e,this.dispatchEvent(Hr),Hr.child=null):U(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Vr),Ur.child=e,this.dispatchEvent(Ur),Ur.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Mr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Mr.multiply(e.parent.matrixWorld)),e.applyMatrix4(Mr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Br),Hr.child=e,this.dispatchEvent(Hr),Hr.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Pr,e,Fr),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Pr,Ir,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Wr.DEFAULT_UP=new q(0,1,0),Wr.DEFAULT_MATRIX_AUTO_UPDATE=!0,Wr.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Gr=class extends Wr{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Kr={type:`move`},qr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Gr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Gr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new q,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new q),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Gr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new q,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new q,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Kr)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Gr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Jr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Yr={h:0,s:0,l:0},Xr={h:0,s:0,l:0};function Zr(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Qr=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=tn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,tr.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=tr.workingColorSpace){return this.r=e,this.g=t,this.b=n,tr.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=tr.workingColorSpace){if(e=Dn(e,1),t=En(t,0,1),n=En(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Zr(i,r,e+1/3),this.g=Zr(i,r,e),this.b=Zr(i,r,e-1/3)}return tr.colorSpaceToWorking(this,r),this}setStyle(e,t=tn){function n(t){t!==void 0&&parseFloat(t)<1&&H(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:H(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);H(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=tn){let n=Jr[e.toLowerCase()];return n===void 0?H(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=nr(e.r),this.g=nr(e.g),this.b=nr(e.b),this}copyLinearToSRGB(e){return this.r=rr(e.r),this.g=rr(e.g),this.b=rr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=tn){return tr.workingToColorSpace($r.copy(this),e),Math.round(En($r.r*255,0,255))*65536+Math.round(En($r.g*255,0,255))*256+Math.round(En($r.b*255,0,255))}getHexString(e=tn){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=tr.workingColorSpace){tr.workingToColorSpace($r.copy(this),t);let n=$r.r,r=$r.g,i=$r.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=tr.workingColorSpace){return tr.workingToColorSpace($r.copy(this),t),e.r=$r.r,e.g=$r.g,e.b=$r.b,e}getStyle(e=tn){tr.workingToColorSpace($r.copy(this),e);let t=$r.r,n=$r.g,r=$r.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Yr),this.setHSL(Yr.h+e,Yr.s+t,Yr.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Yr),e.getHSL(Xr);let n=An(Yr.h,Xr.h,t),r=An(Yr.s,Xr.s,t),i=An(Yr.l,Xr.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$r=new Qr;Qr.NAMES=Jr;var ei=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new Qr(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},ti=class extends Wr{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Dr,this.environmentIntensity=1,this.environmentRotation=new Dr,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},ni=new q,ri=new q,ii=new q,ai=new q,oi=new q,si=new q,ci=new q,li=new q,ui=new q,di=new q,fi=new fr,pi=new fr,mi=new fr,hi=class e{constructor(e=new q,t=new q,n=new q){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),ni.subVectors(e,t),r.cross(ni);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){ni.subVectors(r,t),ri.subVectors(n,t),ii.subVectors(e,t);let a=ni.dot(ni),o=ni.dot(ri),s=ni.dot(ii),c=ri.dot(ri),l=ri.dot(ii),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,ai)!==null&&ai.x>=0&&ai.y>=0&&ai.x+ai.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,ai)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,ai.x),s.addScaledVector(a,ai.y),s.addScaledVector(o,ai.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return fi.setScalar(0),pi.setScalar(0),mi.setScalar(0),fi.fromBufferAttribute(e,t),pi.fromBufferAttribute(e,n),mi.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(fi,i.x),a.addScaledVector(pi,i.y),a.addScaledVector(mi,i.z),a}static isFrontFacing(e,t,n,r){return ni.subVectors(n,t),ri.subVectors(e,t),ni.cross(ri).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ni.subVectors(this.c,this.b),ri.subVectors(this.a,this.b),ni.cross(ri).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;oi.subVectors(r,n),si.subVectors(i,n),li.subVectors(e,n);let s=oi.dot(li),c=si.dot(li);if(s<=0&&c<=0)return t.copy(n);ui.subVectors(e,r);let l=oi.dot(ui),u=si.dot(ui);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(oi,a);di.subVectors(e,i);let f=oi.dot(di),p=si.dot(di);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(si,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return ci.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(ci,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(oi,a).addScaledVector(si,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},gi=class{constructor(e=new q(1/0,1/0,1/0),t=new q(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(vi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(vi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=vi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,vi):vi.fromBufferAttribute(r,t),vi.applyMatrix4(e.matrixWorld),this.expandByPoint(vi);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),yi.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),yi.copy(e.boundingBox)),yi.applyMatrix4(e.matrixWorld),this.union(yi)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,vi),vi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ei),Di.subVectors(this.max,Ei),bi.subVectors(e.a,Ei),xi.subVectors(e.b,Ei),Si.subVectors(e.c,Ei),Ci.subVectors(xi,bi),wi.subVectors(Si,xi),Ti.subVectors(bi,Si);let t=[0,-Ci.z,Ci.y,0,-wi.z,wi.y,0,-Ti.z,Ti.y,Ci.z,0,-Ci.x,wi.z,0,-wi.x,Ti.z,0,-Ti.x,-Ci.y,Ci.x,0,-wi.y,wi.x,0,-Ti.y,Ti.x,0];return!Ai(t,bi,xi,Si,Di)||(t=[1,0,0,0,1,0,0,0,1],!Ai(t,bi,xi,Si,Di))?!1:(Oi.crossVectors(Ci,wi),t=[Oi.x,Oi.y,Oi.z],Ai(t,bi,xi,Si,Di))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,vi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(vi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(_i[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),_i[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),_i[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),_i[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),_i[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),_i[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),_i[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),_i[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(_i)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},_i=[new q,new q,new q,new q,new q,new q,new q,new q],vi=new q,yi=new gi,bi=new q,xi=new q,Si=new q,Ci=new q,wi=new q,Ti=new q,Ei=new q,Di=new q,Oi=new q,ki=new q;function Ai(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){ki.fromArray(e,a);let o=i.x*Math.abs(ki.x)+i.y*Math.abs(ki.y)+i.z*Math.abs(ki.z),s=t.dot(ki),c=n.dot(ki),l=r.dot(ki);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var ji=new q,Mi=new G,Ni=0,Pi=class extends bn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ni++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=sn,this.updateRanges=[],this.gpuType=Je,this.version=0,this._normalizationScale=e===void 0?void 0:Gn(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Mi.fromBufferAttribute(this,t),Mi.applyMatrix3(e),this.setXY(t,Mi.x,Mi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyMatrix3(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyMatrix4(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyNormalMatrix(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.transformDirection(e),this.setXYZ(t,ji.x,ji.y,ji.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?Kn(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?qn(e,this.array):Math.round(e*t)}},Fi=class extends Pi{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Ii=class extends Pi{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Li=class extends Pi{constructor(e,t,n){super(new Float32Array(e),t,n)}},Ri=new gi,zi=new q,Bi=new q,Vi=class{constructor(e=new q,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Ri.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;zi.subVectors(e,this.center);let t=zi.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(zi,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Bi.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(zi.copy(e.center).add(Bi)),this.expandByPoint(zi.copy(e.center).sub(Bi))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Hi=0,Ui=new _r,Wi=new Wr,Gi=new q,Ki=new gi,qi=new gi,Ji=new q,Yi=class e extends bn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Hi++}),this.uuid=Tn(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(un(e)?Ii:Fi)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new Xn().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ui.makeRotationFromQuaternion(e),this.applyMatrix4(Ui),this}rotateX(e){return Ui.makeRotationX(e),this.applyMatrix4(Ui),this}rotateY(e){return Ui.makeRotationY(e),this.applyMatrix4(Ui),this}rotateZ(e){return Ui.makeRotationZ(e),this.applyMatrix4(Ui),this}translate(e,t,n){return Ui.makeTranslation(e,t,n),this.applyMatrix4(Ui),this}scale(e,t,n){return Ui.makeScale(e,t,n),this.applyMatrix4(Ui),this}lookAt(e){return Wi.lookAt(e),Wi.updateMatrix(),this.applyMatrix4(Wi.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Gi).negate(),this.translate(Gi.x,Gi.y,Gi.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Li(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&H(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new gi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)U(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new q(-1/0,-1/0,-1/0),new q(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Ki.setFromBufferAttribute(n),this.morphTargetsRelative?(Ji.addVectors(this.boundingBox.min,Ki.min),this.boundingBox.expandByPoint(Ji),Ji.addVectors(this.boundingBox.max,Ki.max),this.boundingBox.expandByPoint(Ji)):(this.boundingBox.expandByPoint(Ki.min),this.boundingBox.expandByPoint(Ki.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&U(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Vi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)U(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new q,1/0);else if(e){let n=this.boundingSphere.center;if(Ki.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];qi.setFromBufferAttribute(n),this.morphTargetsRelative?(Ji.addVectors(Ki.min,qi.min),Ki.expandByPoint(Ji),Ji.addVectors(Ki.max,qi.max),Ki.expandByPoint(Ji)):(Ki.expandByPoint(qi.min),Ki.expandByPoint(qi.max))}Ki.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Ji.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Ji));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Ji.fromBufferAttribute(a,t),o&&(Gi.fromBufferAttribute(e,t),Ji.add(Gi)),r=Math.max(r,n.distanceToSquared(Ji))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&U(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){U(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Pi(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new q,s[e]=new q;let l=new q,u=new q,d=new q,f=new G,p=new G,m=new G,h=new q,g=new q;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new q,b=new q,x=new q,S=new q;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Pi(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new q,i=new q,a=new q,o=new q,s=new q,c=new q,l=new q,u=new q;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ji.fromBufferAttribute(e,t),Ji.normalize(),e.setXYZ(t,Ji.x,Ji.y,Ji.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Pi(a,r,i)}if(this.index===null)return H(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Xi=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=sn,this.updateRanges=[],this.version=0,this.uuid=Tn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=Zi(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);let n=new this.array.constructor(e.arrayBuffers[t]),r=new this.constructor(n,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=Zi(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}};function Zi(e){return e.buffer._uuid===void 0&&(e.buffer._uuid=Tn()),e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer._uuid:e.buffer._uuid+`:`+e.byteOffset+`:`+e.byteLength}var Qi=new q,$i=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r,this._normalizationScale=e===void 0?void 0:Gn(e.array)}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Qi.fromBufferAttribute(this,t),Qi.applyMatrix4(e),this.setXYZ(t,Qi.x,Qi.y,Qi.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Qi.fromBufferAttribute(this,t),Qi.applyNormalMatrix(e),this.setXYZ(t,Qi.x,Qi.y,Qi.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Qi.fromBufferAttribute(this,t),Qi.transformDirection(e),this.setXYZ(t,Qi.x,Qi.y,Qi.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){hn(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Pi(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){hn(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){let t=this._normalizationScale;return t===void 0?Kn(e,this.data.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?qn(e,this.data.array):Math.round(e*t)}},ea=new q,ta=new q,na=new Xn,ra=class{constructor(e=new q(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=ea.subVectors(n,t).cross(ta.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(ea),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||na.getNormalMatrix(e),r=this.coplanarPoint(ea).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},ia=0,aa=class extends bn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ia++}),this.uuid=Tn(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Qr(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=on,this.stencilZFail=on,this.stencilZPass=on,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){H(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?H(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Qr().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new ra().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new G().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new G().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},oa=class extends aa{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new Qr(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},sa,ca=new q,la=new q,ua=new q,da=new G,fa=new G,pa=new _r,ma=new q,ha=new q,ga=new q,_a=new G,va=new G,ya=new G,ba=class extends Wr{constructor(e=new oa){if(super(),this.isSprite=!0,this.type=`Sprite`,sa===void 0){sa=new Yi;let e=new Xi(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);sa.setIndex([0,1,2,0,2,3]),sa.setAttribute(`position`,new $i(e,3,0,!1)),sa.setAttribute(`uv`,new $i(e,2,3,!1))}this.geometry=sa,this.material=e,this.center=new G(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&U(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),la.setFromMatrixScale(this.matrixWorld),pa.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ua.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&la.multiplyScalar(-ua.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;xa(ma.set(-.5,-.5,0),ua,a,la,r,i),xa(ha.set(.5,-.5,0),ua,a,la,r,i),xa(ga.set(.5,.5,0),ua,a,la,r,i),_a.set(0,0),va.set(1,0),ya.set(1,1);let o=e.ray.intersectTriangle(ma,ha,ga,!1,ca);if(o===null&&(xa(ha.set(-.5,.5,0),ua,a,la,r,i),va.set(0,1),o=e.ray.intersectTriangle(ma,ga,ha,!1,ca),o===null))return;let s=e.ray.origin.distanceTo(ca);s<e.near||s>e.far||t.push({distance:s,point:ca.clone(),uv:hi.getInterpolation(ca,ma,ha,ga,_a,va,ya,new G),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}toJSON(e){let t=super.toJSON(e);return t.object.center=this.center.toArray(),t}};function xa(e,t,n,r,i,a){da.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?fa.copy(da):(fa.x=a*da.x-i*da.y,fa.y=i*da.x+a*da.y),e.copy(t),e.x+=fa.x,e.y+=fa.y,e.applyMatrix4(pa)}var Sa=new q,Ca=new q,wa=new q,Ta=new q,Ea=class{constructor(e=new q,t=new q(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Sa)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Sa.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Sa.copy(this.origin).addScaledVector(this.direction,t),Sa.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Ca.copy(e).add(t).multiplyScalar(.5),wa.copy(t).sub(e).normalize(),Ta.copy(this.origin).sub(Ca);let i=e.distanceTo(t)*.5,a=-this.direction.dot(wa),o=Ta.dot(this.direction),s=-Ta.dot(wa),c=Ta.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Ca).addScaledVector(wa,d),f}intersectSphere(e,t){if(e.radius<0)return null;Sa.subVectors(e.center,this.origin);let n=Sa.dot(this.direction),r=Sa.dot(Sa)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Sa)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,M,N;if(y>=b&&y>=x?(w=s,D=u,A=p,N=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,M=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,M=_)):b>=x?(w=c,D=d,A=m,N=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,M=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,M=v)):(w=l,D=f,A=h,N=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,M=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,M=g)),w===0)return null;let P=S/w,F=C/w,I=1/w,L=T-P*D,ee=E-F*D,te=O-P*A,ne=k-F*A,re=j-P*N,ie=M-F*N,ae=re*ne-ie*te,oe=L*ie-ee*re,se=te*ee-ne*L;if(r){if(ae<0||oe<0||se<0)return null}else if((ae<0||oe<0||se<0)&&(ae>0||oe>0||se>0))return null;let ce=ae+oe+se;if(ce===0)return null;let le=I*(ae*D+oe*A+se*N);return(ce>0?le<0:le>0)?null:this.at(le/ce,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Da=class extends aa{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Qr(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dr,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Oa=new _r,ka=new Ea,Aa=new Vi,ja=new q,Ma=new q,Na=new q,Pa=new q,Fa=new q,Ia=new q,La=new q,Ra=new q,za=class extends Wr{constructor(e=new Yi,t=new Da){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Ia.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Fa.fromBufferAttribute(s,e),a?Ia.addScaledVector(Fa,r):Ia.addScaledVector(Fa.sub(t),r))}t.add(Ia)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Aa.copy(n.boundingSphere),Aa.applyMatrix4(i),ka.copy(e.ray).recast(e.near),Aa.containsPoint(ka.origin)===!1&&(ka.intersectSphere(Aa,ja)===null||ka.origin.distanceToSquared(ja)>(e.far-e.near)**2)||(Oa.copy(i).invert(),ka.copy(e.ray).applyMatrix4(Oa),(n.boundingBox===null||ka.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,ka)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Va(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Va(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Va(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Va(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Ba(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Ra.copy(s),Ra.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Ra);return l<n.near||l>n.far?null:{distance:l,point:Ra.clone(),object:e}}function Va(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Ma),e.getVertexPosition(c,Na),e.getVertexPosition(l,Pa);let u=Ba(e,t,n,r,Ma,Na,Pa,La);if(u){let e=new q;hi.getBarycoord(La,Ma,Na,Pa,e),i&&(u.uv=hi.getInterpolatedAttribute(i,s,c,l,e,new G)),a&&(u.uv1=hi.getInterpolatedAttribute(a,s,c,l,e,new G)),o&&(u.normal=hi.getInterpolatedAttribute(o,s,c,l,e,new q),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new q,materialIndex:0};hi.getNormal(Ma,Na,Pa,t.normal),u.face=t,u.barycoord=e}return u}var Ha=class extends dr{constructor(e=null,t=1,n=1,r,i,a,o,s,c=Ie,l=Ie,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ua=class extends Pi{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Wa=new _r,Ga=new _r,Ka=[],qa=new gi,Ja=new _r,Ya=new za,Xa=new Vi,Za=class extends za{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ua(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Ja)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new gi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Wa),qa.copy(e.boundingBox).applyMatrix4(Wa),this.boundingBox.union(qa)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Vi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Wa),Xa.copy(e.boundingSphere).applyMatrix4(Wa),this.boundingSphere.union(Xa)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Ya.geometry=this.geometry,Ya.material=this.material,Ya.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xa.copy(this.boundingSphere),Xa.applyMatrix4(n),e.ray.intersectsSphere(Xa)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Wa),Ga.multiplyMatrices(n,Wa),Ya.matrixWorld=Ga,Ya.raycast(e,Ka);for(let e=0,n=Ka.length;e<n;e++){let n=Ka[e];n.instanceId=i,n.object=this,t.push(n)}Ka.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ua(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ha(new Float32Array(r*this.count),r,this.count,ot,Je));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Qa=new Vi,$a=new G(.5,.5),eo=new q,to=class{constructor(e=new ra,t=new ra,n=new ra,r=new ra,i=new ra,a=new ra){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=ln,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Qa.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Qa.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Qa)}intersectsSprite(e){return Qa.center.set(0,0,0),Qa.radius=.7071067811865476+$a.distanceTo(e.center),Qa.applyMatrix4(e.matrixWorld),this.intersectsSphere(Qa)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(eo.x=r.normal.x>0?e.max.x:e.min.x,eo.y=r.normal.y>0?e.max.y:e.min.y,eo.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(eo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},no=new _r,ro=class e{constructor(){this.coordinateSystem=ln,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];no.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new to),n[e].setFromProjectionMatrix(no,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new to),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},io=class extends aa{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new Qr(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},ao=new q,oo=new q,so=new _r,co=new Ea,lo=new Vi,uo=new q,fo=new q,po=class extends Wr{constructor(e=new Yi,t=new io){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)ao.fromBufferAttribute(t,e-1),oo.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=ao.distanceTo(oo);e.setAttribute(`lineDistance`,new Li(n,1))}else H(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),lo.copy(n.boundingSphere),lo.applyMatrix4(r),lo.radius+=i,e.ray.intersectsSphere(lo)===!1)return;so.copy(r).invert(),co.copy(e.ray).applyMatrix4(so);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=mo(this,e,co,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=mo(this,e,co,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=mo(this,e,co,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=mo(this,e,co,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function mo(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(ao.fromBufferAttribute(s,i),oo.fromBufferAttribute(s,a),n.distanceSqToSegment(ao,oo,uo,fo)>r)return;uo.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(uo);if(!(c<t.near||c>t.far))return{distance:c,point:fo.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var ho=new q,go=new q,_o=class extends po{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)ho.fromBufferAttribute(t,e),go.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+ho.distanceTo(go);e.setAttribute(`lineDistance`,new Li(n,1))}else H(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},vo=class extends aa{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new Qr(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},yo=new _r,bo=new Ea,xo=new Vi,So=new q,Co=class extends Wr{constructor(e=new Yi,t=new vo){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),xo.copy(n.boundingSphere),xo.applyMatrix4(r),xo.radius+=i,e.ray.intersectsSphere(xo)===!1)return;yo.copy(r).invert(),bo.copy(e.ray).applyMatrix4(yo);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);So.fromBufferAttribute(l,n),wo(So,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)So.fromBufferAttribute(l,a),wo(So,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function wo(e,t,n,r,i,a,o){let s=bo.distanceSqToPoint(e);if(s<n){let n=new q;bo.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var To=class extends dr{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Eo=class extends dr{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Do=class extends dr{constructor(e,t,n=qe,r,i,a,o=Ie,s=Ie,c,l=it,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new sr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Oo=class extends Do{constructor(e,t=qe,n=301,r,i,a=Ie,o=Ie,s,c=it){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ko=class extends dr{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Ao=class e extends Yi{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Li(c,3)),this.setAttribute(`normal`,new Li(l,3)),this.setAttribute(`uv`,new Li(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new q;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},jo=class e extends Yi{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new q,l=new G;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new Li(a,3)),this.setAttribute(`normal`,new Li(o,3)),this.setAttribute(`uv`,new Li(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Mo=class e extends Yi{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Li(u,3)),this.setAttribute(`normal`,new Li(d,3)),this.setAttribute(`uv`,new Li(f,2));function _(){let a=new q,_=new q,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new G,m=new q,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},No=class e extends Mo{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Po=class e extends Yi{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Li(i,3)),this.setAttribute(`normal`,new Li(i.slice(),3)),this.setAttribute(`uv`,new Li(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new q,r=new q,i=new q;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new q;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new q;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new q,t=new q,n=new q,r=new q,o=new G,s=new G,c=new G;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},Fo=new q,Io=new q,Lo=new q,Ro=new hi,zo=class extends Yi{constructor(e=null,t=1){if(super(),this.type=`EdgesGeometry`,this.parameters={geometry:e,thresholdAngle:t},e!==null){let n=1e4,r=Math.cos(Cn*t),i=e.getIndex(),a=e.getAttribute(`position`),o=i?i.count:a.count,s=[0,0,0],c=[`a`,`b`,`c`],l=[,,,],u=new Map,d=[];for(let e=0;e<o;e+=3){i?(s[0]=i.getX(e),s[1]=i.getX(e+1),s[2]=i.getX(e+2)):(s[0]=e,s[1]=e+1,s[2]=e+2);let{a:t,b:o,c:f}=Ro;if(t.fromBufferAttribute(a,s[0]),o.fromBufferAttribute(a,s[1]),f.fromBufferAttribute(a,s[2]),Ro.getNormal(Lo),l[0]=`${Math.round(t.x*n)},${Math.round(t.y*n)},${Math.round(t.z*n)}`,l[1]=`${Math.round(o.x*n)},${Math.round(o.y*n)},${Math.round(o.z*n)}`,l[2]=`${Math.round(f.x*n)},${Math.round(f.y*n)},${Math.round(f.z*n)}`,l[0]!==l[1]&&l[1]!==l[2]&&l[2]!==l[0])for(let e=0;e<3;e++){let t=(e+1)%3,n=l[e],i=l[t],a=Ro[c[e]],o=Ro[c[t]],f=`${n}_${i}`,p=`${i}_${n}`,m=u.get(p);m?(Lo.dot(m.normal)<=r&&(d.push(a.x,a.y,a.z),d.push(o.x,o.y,o.z)),u.set(p,null)):u.has(f)||u.set(f,{index0:s[e],index1:s[t],normal:Lo.clone()})}}for(let e of u.values())if(e){let{index0:t,index1:n}=e;Fo.fromBufferAttribute(a,t),Io.fromBufferAttribute(a,n),d.push(Fo.x,Fo.y,Fo.z),d.push(Io.x,Io.y,Io.z)}this.setAttribute(`position`,new Li(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Bo=class{constructor(){this.type=`Curve`,this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){H(`Curve: .getPoint() not implemented.`)}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,r=this.getPoint(0),i=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),i+=n.distanceTo(r),t.push(i),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),r=0,i=n.length,a;a=t||e*n[i-1];let o=0,s=i-1,c;for(;o<=s;)if(r=Math.floor(o+(s-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)s=r-1;else{s=r;break}if(r=s,n[r]===a)return r/(i-1);let l=n[r],u=n[r+1]-l,d=(a-l)/u;return(r+d)/(i-1)}getTangent(e,t){let n=1e-4,r=e-n,i=e+n;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),o=this.getPoint(i),s=t||(a.isVector2?new G:new q);return s.copy(o).sub(a).normalize(),s}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new q,r=[],i=[],a=[],o=new q,s=new _r;for(let t=0;t<=e;t++){let n=t/e;r[t]=this.getTangentAt(n,new q)}i[0]=new q,a[0]=new q;let c=Number.MAX_VALUE,l=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);l<=c&&(c=l,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),i[0].crossVectors(r[0],o),a[0].crossVectors(r[0],i[0]);for(let t=1;t<=e;t++){if(i[t]=i[t-1].clone(),a[t]=a[t-1].clone(),o.crossVectors(r[t-1],r[t]),o.length()>2**-52){o.normalize();let e=Math.acos(En(r[t-1].dot(r[t]),-1,1));i[t].applyMatrix4(s.makeRotationAxis(o,e))}a[t].crossVectors(r[t],i[t])}if(t===!0){let t=Math.acos(En(i[0].dot(i[e]),-1,1));t/=e,r[0].dot(o.crossVectors(i[0],i[e]))>0&&(t=-t);for(let n=1;n<=e;n++)i[n].applyMatrix4(s.makeRotationAxis(r[n],t*n)),a[n].crossVectors(r[n],i[n])}return{tangents:r,normals:i,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let e={metadata:{version:4.7,type:`Curve`,generator:`Curve.toJSON`}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}},Vo=class extends Bo{constructor(e=0,t=0,n=1,r=1,i=0,a=Math.PI*2,o=!1,s=0){super(),this.isEllipseCurve=!0,this.type=`EllipseCurve`,this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=i,this.aEndAngle=a,this.aClockwise=o,this.aRotation=s}getPoint(e,t=new G){let n=t,r=Math.PI*2,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<2**-52;for(;i<0;)i+=r;for(;i>r;)i-=r;i<2**-52&&(i=a?0:r),this.aClockwise===!0&&!a&&(i===r?i=-r:i-=r);let o=this.aStartAngle+e*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let e=Math.cos(this.aRotation),t=Math.sin(this.aRotation),n=s-this.aX,r=c-this.aY;s=n*e-r*t+this.aX,c=n*t+r*e+this.aY}return n.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ho=class extends Vo{constructor(e,t,n,r,i,a){super(e,t,n,n,r,i,a),this.isArcCurve=!0,this.type=`ArcCurve`}};function Uo(){let e=0,t=0,n=0,r=0;function i(i,a,o,s){e=i,t=o,n=-3*i+3*a-2*o-s,r=2*i-2*a+o+s}return{initCatmullRom:function(e,t,n,r,a){i(t,n,a*(n-e),a*(r-t))},initNonuniformCatmullRom:function(e,t,n,r,a,o,s){let c=(t-e)/a-(n-e)/(a+o)+(n-t)/o,l=(n-t)/o-(r-t)/(o+s)+(r-n)/s;c*=o,l*=o,i(t,n,c,l)},calc:function(i){let a=i*i,o=a*i;return e+t*i+n*a+r*o}}}var Wo=new q,Go=new q,Ko=new Uo,qo=new Uo,Jo=new Uo,Yo=class extends Bo{constructor(e=[],t=!1,n=`centripetal`,r=.5){super(),this.isCatmullRomCurve3=!0,this.type=`CatmullRomCurve3`,this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new q){let n=t,r=this.points,i=r.length,a=(i-+!this.closed)*e,o=Math.floor(a),s=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/i)+1)*i:s===0&&o===i-1&&(o=i-2,s=1);let c,l;this.closed||o>0?c=r[(o-1)%i]:(Go.subVectors(r[0],r[1]).add(r[0]),c=Go);let u=r[o%i],d=r[(o+1)%i];if(this.closed||o+2<i?l=r[(o+2)%i]:(Wo.subVectors(r[i-1],r[i-2]).add(r[i-1]),l=Wo),this.curveType===`centripetal`||this.curveType===`chordal`){let e=this.curveType===`chordal`?.5:.25,t=c.distanceToSquared(u)**+e,n=u.distanceToSquared(d)**+e,r=d.distanceToSquared(l)**+e;n<1e-4&&(n=1),t<1e-4&&(t=n),r<1e-4&&(r=n),Ko.initNonuniformCatmullRom(c.x,u.x,d.x,l.x,t,n,r),qo.initNonuniformCatmullRom(c.y,u.y,d.y,l.y,t,n,r),Jo.initNonuniformCatmullRom(c.z,u.z,d.z,l.z,t,n,r)}else this.curveType===`catmullrom`&&(Ko.initCatmullRom(c.x,u.x,d.x,l.x,this.tension),qo.initCatmullRom(c.y,u.y,d.y,l.y,this.tension),Jo.initCatmullRom(c.z,u.z,d.z,l.z,this.tension));return n.set(Ko.calc(s),qo.calc(s),Jo.calc(s)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new q().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Xo(e,t,n,r,i){let a=(r-t)*.5,o=(i-n)*.5,s=e*e,c=e*s;return(2*n-2*r+a+o)*c+(-3*n+3*r-2*a-o)*s+a*e+n}function Zo(e,t){let n=1-e;return n*n*t}function Qo(e,t){return 2*(1-e)*e*t}function $o(e,t){return e*e*t}function es(e,t,n,r){return Zo(e,t)+Qo(e,n)+$o(e,r)}function ts(e,t){let n=1-e;return n*n*n*t}function ns(e,t){let n=1-e;return 3*n*n*e*t}function rs(e,t){return 3*(1-e)*e*e*t}function is(e,t){return e*e*e*t}function as(e,t,n,r,i){return ts(e,t)+ns(e,n)+rs(e,r)+is(e,i)}var os=class extends Bo{constructor(e=new G,t=new G,n=new G,r=new G){super(),this.isCubicBezierCurve=!0,this.type=`CubicBezierCurve`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new G){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(as(e,r.x,i.x,a.x,o.x),as(e,r.y,i.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ss=class extends Bo{constructor(e=new q,t=new q,n=new q,r=new q){super(),this.isCubicBezierCurve3=!0,this.type=`CubicBezierCurve3`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new q){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(as(e,r.x,i.x,a.x,o.x),as(e,r.y,i.y,a.y,o.y),as(e,r.z,i.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},cs=class extends Bo{constructor(e=new G,t=new G){super(),this.isLineCurve=!0,this.type=`LineCurve`,this.v1=e,this.v2=t}getPoint(e,t=new G){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new G){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ls=class extends Bo{constructor(e=new q,t=new q){super(),this.isLineCurve3=!0,this.type=`LineCurve3`,this.v1=e,this.v2=t}getPoint(e,t=new q){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new q){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},us=class extends Bo{constructor(e=new G,t=new G,n=new G){super(),this.isQuadraticBezierCurve=!0,this.type=`QuadraticBezierCurve`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new G){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(es(e,r.x,i.x,a.x),es(e,r.y,i.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ds=class extends Bo{constructor(e=new q,t=new q,n=new q){super(),this.isQuadraticBezierCurve3=!0,this.type=`QuadraticBezierCurve3`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new q){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(es(e,r.x,i.x,a.x),es(e,r.y,i.y,a.y),es(e,r.z,i.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fs=class extends Bo{constructor(e=[]){super(),this.isSplineCurve=!0,this.type=`SplineCurve`,this.points=e}getPoint(e,t=new G){let n=t,r=this.points,i=(r.length-1)*e,a=Math.floor(i),o=i-a,s=r[a===0?a:a-1],c=r[a],l=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return n.set(Xo(o,s.x,c.x,l.x,u.x),Xo(o,s.y,c.y,l.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new G().fromArray(n))}return this}},ps=Object.freeze({__proto__:null,ArcCurve:Ho,CatmullRomCurve3:Yo,CubicBezierCurve:os,CubicBezierCurve3:ss,EllipseCurve:Vo,LineCurve:cs,LineCurve3:ls,QuadraticBezierCurve:us,QuadraticBezierCurve3:ds,SplineCurve:fs}),ms=class extends Bo{constructor(){super(),this.type=`CurvePath`,this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?`LineCurve`:`LineCurve3`;this.curves.push(new ps[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),r=this.getCurveLengths(),i=0;for(;i<r.length;){if(r[i]>=n){let e=r[i]-n,a=this.curves[i],o=a.getLength(),s=o===0?0:1-e/o;return a.getPointAt(s,t)}i++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let r=0,i=this.curves;r<i.length;r++){let a=i[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,s=a.getPoints(o);for(let e=0;e<s.length;e++){let r=s[e];n&&n.equals(r)||(t.push(r),n=r)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(n.clone())}return this.autoClose=e.autoClose,this.cacheLengths=null,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let n=this.curves[t];e.curves.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(new ps[n.type]().fromJSON(n))}return this.cacheLengths=null,this}},hs=class extends ms{constructor(e){super(),this.type=`Path`,this.currentPoint=new G,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new cs(this.currentPoint.clone(),new G(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){let i=new us(this.currentPoint.clone(),new G(e,t),new G(n,r));return this.curves.push(i),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,i,a){let o=new os(this.currentPoint.clone(),new G(e,t),new G(n,r),new G(i,a));return this.curves.push(o),this.currentPoint.set(i,a),this}splineThru(e){let t=new fs([this.currentPoint.clone()].concat(e));return this.curves.push(t),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,i,a){let o=this.currentPoint.x,s=this.currentPoint.y;return this.absarc(e+o,t+s,n,r,i,a),this}absarc(e,t,n,r,i,a){return this.absellipse(e,t,n,n,r,i,a),this}ellipse(e,t,n,r,i,a,o,s){let c=this.currentPoint.x,l=this.currentPoint.y;return this.absellipse(e+c,t+l,n,r,i,a,o,s),this}absellipse(e,t,n,r,i,a,o,s){let c=new Vo(e,t,n,r,i,a,o,s);if(this.curves.length>0){let e=c.getPoint(0);e.equals(this.currentPoint)||this.lineTo(e.x,e.y)}this.curves.push(c);let l=c.getPoint(1);return this.currentPoint.copy(l),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},gs=class extends hs{constructor(e){super(e),this.uuid=Tn(),this.type=`Shape`,this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let n=this.holes[t];e.holes.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(new hs().fromJSON(n))}return this}};function _s(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=vs(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l;if(r&&(a=Ts(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return bs(a,o,n,s,c,l,0),o}function vs(e,t,n,r,i){let a;if(i===Ys(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=Ks(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=Ks(i/r|0,e[i],e[i+1],a);return a&&Rs(a,a.next)&&(qs(a),a=a.next),a}function ys(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&(Rs(n,n.next)||Ls(n.prev,n,n.next)===0)){if(qs(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function bs(e,t,n,r,i,a,o){if(!e)return;!o&&a&&As(e,r,i,a);let s=e;for(;e.prev!==e.next;){let c=e.prev,l=e.next;if(a?Ss(e,r,i,a):xs(e))t.push(c.i,e.i,l.i),qs(e),e=l.next,s=l.next;else if(e=l,e===s){o?o===1?(e=Cs(ys(e),t),bs(e,t,n,r,i,a,2)):o===2&&ws(e,t,n,r,i,a):bs(ys(e),t,n,r,i,a,1);break}}}function xs(e){let t=e.prev,n=e,r=e.next;if(Ls(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&Fs(i,s,a,c,o,l,m.x,m.y)&&Ls(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Ss(e,t,n,r){let i=e.prev,a=e,o=e.next;if(Ls(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=Ms(p,m,t,n,r),v=Ms(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Fs(s,u,c,d,l,f,y.x,y.y)&&Ls(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Fs(s,u,c,d,l,f,b.x,b.y)&&Ls(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Fs(s,u,c,d,l,f,y.x,y.y)&&Ls(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Fs(s,u,c,d,l,f,b.x,b.y)&&Ls(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function Cs(e,t){let n=e;do{let r=n.prev,i=n.next.next;!Rs(r,i)&&zs(r,n,n.next,i)&&Us(r,i)&&Us(i,r)&&(t.push(r.i,n.i,i.i),qs(n),qs(n.next),n=e=i),n=n.next}while(n!==e);return ys(n)}function ws(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&Is(o,e)){let s=Gs(o,e);o=ys(o,o.next),s=ys(s,s.next),bs(o,t,n,r,i,a,0),bs(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function Ts(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=vs(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&(o.steiner=!0),i.push(Ns(o))}i.sort(Es);for(let e=0;e<i.length;e++)n=Ds(i[e],n);return n}function Es(e,t){let n=e.x-t.x;return n===0&&(n=e.y-t.y,n===0&&(n=(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x))),n}function Ds(e,t){let n=Os(e,t);if(!n)return t;let r=Gs(n,e);return ys(r,r.next),ys(n,n.next)}function Os(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(Rs(e,n))return n;do{if(Rs(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}n=n.next}while(n!==t);if(!o)return null;let s=o,c=o.x,l=o.y,u=1/0;n=o;do{if(r>=n.x&&n.x>=c&&r!==n.x&&Ps(i<l?r:a,i,c,l,i<l?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);Us(n,e)&&(t<u||t===u&&(n.x>o.x||n.x===o.x&&ks(o,n)))&&(o=n,u=t)}n=n.next}while(n!==s);return o}function ks(e,t){return Ls(e.prev,e,t.prev)<0&&Ls(t.next,e,e.next)<0}function As(e,t,n,r){let i=e;do i.z===0&&(i.z=Ms(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,js(i)}function js(e){let t,n=1;do{let r=e,i;e=null;let a=null;for(t=0;r;){t++;let o=r,s=0;for(let e=0;e<n&&(s++,o=o.nextZ,o);e++);let c=n;for(;s>0||c>0&&o;)s!==0&&(c===0||!o||r.z<=o.z)?(i=r,r=r.nextZ,s--):(i=o,o=o.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;r=o}a.nextZ=null,n*=2}while(t>1);return e}function Ms(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function Ns(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Ps(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function Fs(e,t,n,r,i,a,o,s){return(e!==o||t!==s)&&Ps(e,t,n,r,i,a,o,s)}function Is(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!Hs(e,t)&&(Us(e,t)&&Us(t,e)&&Ws(e,t)&&(Ls(e.prev,e,t.prev)||Ls(e,t.prev,t))||Rs(e,t)&&Ls(e.prev,e,e.next)>0&&Ls(t.prev,t,t.next)>0)}function Ls(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Rs(e,t){return e.x===t.x&&e.y===t.y}function zs(e,t,n,r){let i=Vs(Ls(e,t,n)),a=Vs(Ls(e,t,r)),o=Vs(Ls(n,r,e)),s=Vs(Ls(n,r,t));return!!(i!==a&&o!==s||i===0&&Bs(e,n,t)||a===0&&Bs(e,r,t)||o===0&&Bs(n,e,r)||s===0&&Bs(n,t,r))}function Bs(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function Vs(e){return e>0?1:e<0?-1:0}function Hs(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&zs(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function Us(e,t){return Ls(e.prev,e,e.next)<0?Ls(e,t,e.next)>=0&&Ls(e,e.prev,t)>=0:Ls(e,t,e.prev)<0||Ls(e,e.next,t)<0}function Ws(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function Gs(e,t){let n=Js(e.i,e.x,e.y),r=Js(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function Ks(e,t,n,r){let i=Js(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function qs(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Js(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Ys(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var Xs=class{static triangulate(e,t,n=2){return _s(e,t,n)}},Zs=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];Qs(e),$s(n,e);let a=e.length;t.forEach(Qs);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,$s(n,t[e]);let o=Xs.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function Qs(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function $s(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var ec=class e extends Yi{constructor(e=new gs([new G(.5,.5),new G(-.5,.5),new G(-.5,-.5),new G(.5,-.5)]),t={}){super(),this.type=`ExtrudeGeometry`,this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,r=[],i=[];for(let t=0,n=e.length;t<n;t++){let n=e[t];a(n)}this.setAttribute(`position`,new Li(r,3)),this.setAttribute(`uv`,new Li(i,2)),this.computeVertexNormals();function a(e){let a=[],o=t.curveSegments===void 0?12:t.curveSegments,s=t.steps===void 0?1:t.steps,c=t.depth===void 0?1:t.depth,l=t.bevelEnabled===void 0||t.bevelEnabled,u=t.bevelThickness===void 0?.2:t.bevelThickness,d=t.bevelSize===void 0?u-.1:t.bevelSize,f=t.bevelOffset===void 0?0:t.bevelOffset,p=t.bevelSegments===void 0?3:t.bevelSegments,m=t.extrudePath,h=t.UVGenerator===void 0?tc:t.UVGenerator,g,_=!1,v,y,b,x;if(m){g=m.getSpacedPoints(s),_=!0,l=!1;let e=m.isCatmullRomCurve3?m.closed:!1;v=m.computeFrenetFrames(s,e),y=new q,b=new q,x=new q}l||(p=0,u=0,d=0,f=0);let S=e.extractPoints(o),C=S.shape,w=S.holes;if(!Zs.isClockWise(C)){C=C.reverse();for(let e=0,t=w.length;e<t;e++){let t=w[e];Zs.isClockWise(t)&&(w[e]=t.reverse())}}function T(e){let t=e[0];for(let n=1;n<=e.length;n++){let r=n%e.length,i=e[r],a=i.x-t.x,o=i.y-t.y,s=a*a+o*o,c=Math.max(Math.abs(i.x),Math.abs(i.y),Math.abs(t.x),Math.abs(t.y));s<=10000000000000001e-36*c*c?(e.splice(r,1),n--):t=i}}T(C),w.forEach(T);let E=w.length,D=C;for(let e=0;e<E;e++){let t=w[e];C=C.concat(t)}function O(e,t,n){return t||U(`ExtrudeGeometry: vec does not exist`),e.clone().addScaledVector(t,n)}let k=C.length;function A(e,t,n){let r,i,a,o=e.x-t.x,s=e.y-t.y,c=n.x-e.x,l=n.y-e.y,u=o*o+s*s,d=o*l-s*c;if(Math.abs(d)>2**-52){let d=Math.sqrt(u),f=Math.sqrt(c*c+l*l),p=t.x-s/d,m=t.y+o/d,h=n.x-l/f,g=n.y+c/f,_=((h-p)*l-(g-m)*c)/(o*l-s*c);r=p+o*_-e.x,i=m+s*_-e.y;let v=r*r+i*i;if(v<=2)return new G(r,i);a=Math.sqrt(v/2)}else{let e=!1;o>2**-52?c>2**-52&&(e=!0):o<-(2**-52)?c<-(2**-52)&&(e=!0):Math.sign(s)===Math.sign(l)&&(e=!0),e?(r=-s,i=o,a=Math.sqrt(u)):(r=o,i=s,a=Math.sqrt(u/2))}return new G(r/a,i/a)}let j=[];for(let e=0,t=D.length,n=t-1,r=e+1;e<t;e++,n++,r++)n===t&&(n=0),r===t&&(r=0),j[e]=A(D[e],D[n],D[r]);let M=[],N,P=j.concat();for(let e=0,t=E;e<t;e++){let t=w[e];N=[];for(let e=0,n=t.length,r=n-1,i=e+1;e<n;e++,r++,i++)r===n&&(r=0),i===n&&(i=0),N[e]=A(t[e],t[r],t[i]);M.push(N),P=P.concat(N)}let F;if(p===0)F=Zs.triangulateShape(D,w);else{let e=[],t=[];for(let n=0;n<p;n++){let r=n/p,i=u*Math.cos(r*Math.PI/2),a=d*Math.sin(r*Math.PI/2)+f;for(let t=0,n=D.length;t<n;t++){let n=O(D[t],j[t],a);re(n.x,n.y,-i),r===0&&e.push(n)}for(let e=0,n=E;e<n;e++){let n=w[e];N=M[e];let o=[];for(let e=0,t=n.length;e<t;e++){let t=O(n[e],N[e],a);re(t.x,t.y,-i),r===0&&o.push(t)}r===0&&t.push(o)}}F=Zs.triangulateShape(e,t)}let I=F.length,L=d+f;for(let e=0;e<k;e++){let t=l?O(C[e],P[e],L):C[e];_?(b.copy(v.normals[0]).multiplyScalar(t.x),y.copy(v.binormals[0]).multiplyScalar(t.y),x.copy(g[0]).add(b).add(y),re(x.x,x.y,x.z)):re(t.x,t.y,0)}for(let e=1;e<=s;e++)for(let t=0;t<k;t++){let n=l?O(C[t],P[t],L):C[t];_?(b.copy(v.normals[e]).multiplyScalar(n.x),y.copy(v.binormals[e]).multiplyScalar(n.y),x.copy(g[e]).add(b).add(y),re(x.x,x.y,x.z)):re(n.x,n.y,c/s*e)}for(let e=p-1;e>=0;e--){let t=e/p,n=u*Math.cos(t*Math.PI/2),r=d*Math.sin(t*Math.PI/2)+f;for(let e=0,t=D.length;e<t;e++){let t=O(D[e],j[e],r);re(t.x,t.y,c+n)}for(let e=0,t=w.length;e<t;e++){let t=w[e];N=M[e];for(let e=0,i=t.length;e<i;e++){let i=O(t[e],N[e],r);_?re(i.x,i.y+g[s-1].y,g[s-1].x+n):re(i.x,i.y,c+n)}}}ee(),te();function ee(){let e=r.length/3;if(l){let e=0,t=k*e;for(let e=0;e<I;e++){let n=F[e];ie(n[2]+t,n[1]+t,n[0]+t)}e=s+p*2,t=k*e;for(let e=0;e<I;e++){let n=F[e];ie(n[0]+t,n[1]+t,n[2]+t)}}else{for(let e=0;e<I;e++){let t=F[e];ie(t[2],t[1],t[0])}for(let e=0;e<I;e++){let t=F[e];ie(t[0]+k*s,t[1]+k*s,t[2]+k*s)}}n.addGroup(e,r.length/3-e,0)}function te(){let e=r.length/3,t=0;ne(D,t),t+=D.length;for(let e=0,n=w.length;e<n;e++){let n=w[e];ne(n,t),t+=n.length}n.addGroup(e,r.length/3-e,1)}function ne(e,t){let n=e.length;for(;--n>=0;){let r=n,i=n-1;i<0&&(i=e.length-1);for(let e=0,n=s+p*2;e<n;e++){let n=k*e,a=k*(e+1);ae(t+r+n,t+i+n,t+i+a,t+r+a)}}}function re(e,t,n){a.push(e),a.push(t),a.push(n)}function ie(e,t,i){oe(e),oe(t),oe(i);let a=r.length/3,o=h.generateTopUV(n,r,a-3,a-2,a-1);se(o[0]),se(o[1]),se(o[2])}function ae(e,t,i,a){oe(e),oe(t),oe(a),oe(t),oe(i),oe(a);let o=r.length/3,s=h.generateSideWallUV(n,r,o-6,o-3,o-2,o-1);se(s[0]),se(s[1]),se(s[3]),se(s[1]),se(s[2]),se(s[3])}function oe(e){r.push(a[e*3+0]),r.push(a[e*3+1]),r.push(a[e*3+2])}function se(e){i.push(e.x),i.push(e.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return nc(t,n,e)}static fromJSON(t,n){let r=[];for(let e=0,i=t.shapes.length;e<i;e++){let i=n[t.shapes[e]];r.push(i)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new ps[i.type]().fromJSON(i)),new e(r,t.options)}},tc={generateTopUV:function(e,t,n,r,i){let a=t[n*3],o=t[n*3+1],s=t[r*3],c=t[r*3+1],l=t[i*3],u=t[i*3+1];return[new G(a,o),new G(s,c),new G(l,u)]},generateSideWallUV:function(e,t,n,r,i,a){let o=t[n*3],s=t[n*3+1],c=t[n*3+2],l=t[r*3],u=t[r*3+1],d=t[r*3+2],f=t[i*3],p=t[i*3+1],m=t[i*3+2],h=t[a*3],g=t[a*3+1],_=t[a*3+2];return Math.abs(s-u)<Math.abs(o-l)?[new G(o,1-c),new G(l,1-d),new G(f,1-m),new G(h,1-_)]:[new G(s,1-c),new G(u,1-d),new G(p,1-m),new G(g,1-_)]}};function nc(e,t,n){if(n.shapes=[],Array.isArray(e))for(let t=0,r=e.length;t<r;t++){let r=e[t];n.shapes.push(r.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}var rc=class e extends Po{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},ic=class e extends Po{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type=`OctahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},ac=class e extends Yi{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Li(p,3)),this.setAttribute(`normal`,new Li(m,3)),this.setAttribute(`uv`,new Li(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},oc=class e extends Yi{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new q,p=new G;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new Li(s,3)),this.setAttribute(`normal`,new Li(c,3)),this.setAttribute(`uv`,new Li(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},sc=class e extends Yi{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new q,d=new q,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new Li(p,3)),this.setAttribute(`normal`,new Li(m,3)),this.setAttribute(`uv`,new Li(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},cc=class e extends Yi{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new q,f=new q,p=new q;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new Li(c,3)),this.setAttribute(`normal`,new Li(l,3)),this.setAttribute(`uv`,new Li(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function lc(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(dc(i))i.isRenderTargetTexture?(H(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(dc(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function uc(e){let t={};for(let n=0;n<e.length;n++){let r=lc(e[n]);for(let e in r)t[e]=r[e]}return t}function dc(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function fc(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function pc(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:tr.workingColorSpace}var mc={clone:lc,merge:uc},hc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,gc=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,_c=class extends aa{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=hc,this.fragmentShader=gc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=lc(e.uniforms),this.uniformsGroups=fc(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new Qr().setHex(r.value);break;case`v2`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new q().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new fr().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new Xn().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new _r().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},vc=class extends _c{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},yc=class extends aa{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new Qr(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Qr(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new G(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dr,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},bc=class extends aa{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=en,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},xc=class extends aa{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Sc(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Cc(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var wc=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Tc=class extends wc{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Zt,endingEnd:Zt}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Qt:i=e,o=2*t-n;break;case $t:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Qt:a=e,s=2*n-t;break;case $t:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Ec=class extends wc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Dc=class extends wc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Oc=class extends wc{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=jc(n,t,g,y,r);i[p]=kc(x,o,_,b,m)}return i}};function kc(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Ac(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function jc(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=kc(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Ac(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Mc=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Sc(t,this.TimeBufferType),this.values=Sc(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Sc(e.times,Array),values:Sc(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),Cc(e.settings)&&(n.settings={inTangents:Sc(e.settings.inTangents,Array),outTangents:Sc(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Dc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ec(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Tc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Oc(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case qt:t=this.InterpolantFactoryMethodDiscrete;break;case Jt:t=this.InterpolantFactoryMethodLinear;break;case Yt:t=this.InterpolantFactoryMethodSmooth;break;case Xt:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return H(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return qt;case this.InterpolantFactoryMethodLinear:return Jt;case this.InterpolantFactoryMethodSmooth:return Yt;case this.InterpolantFactoryMethodBezier:return Xt}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;Cc(this.settings)&&(Nc(this.settings.inTangents,e),Nc(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;Cc(this.settings)&&(Pc(this.settings.inTangents,e),Pc(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(U(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(U(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){U(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){U(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&dn(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){U(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Yt,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,Cc(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Nc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function Pc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Mc.prototype.ValueTypeName=``,Mc.prototype.TimeBufferType=Float32Array,Mc.prototype.ValueBufferType=Float32Array,Mc.prototype.DefaultInterpolation=Jt;var Fc=class extends Mc{constructor(e,t,n){super(e,t,n)}};Fc.prototype.ValueTypeName=`bool`,Fc.prototype.ValueBufferType=Array,Fc.prototype.DefaultInterpolation=qt,Fc.prototype.InterpolantFactoryMethodLinear=void 0,Fc.prototype.InterpolantFactoryMethodSmooth=void 0;var Ic=class extends Mc{constructor(e,t,n,r){super(e,t,n,r)}};Ic.prototype.ValueTypeName=`color`;var Lc=class extends Mc{constructor(e,t,n,r){super(e,t,n,r)}};Lc.prototype.ValueTypeName=`number`;var Rc=class extends wc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)K.slerpFlat(i,0,a,c-o,a,c,s);return i}},zc=class extends Mc{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Rc(this.times,this.values,this.getValueSize(),e)}};zc.prototype.ValueTypeName=`quaternion`,zc.prototype.InterpolantFactoryMethodSmooth=void 0;var Bc=class extends Mc{constructor(e,t,n){super(e,t,n)}};Bc.prototype.ValueTypeName=`string`,Bc.prototype.ValueBufferType=Array,Bc.prototype.DefaultInterpolation=qt,Bc.prototype.InterpolantFactoryMethodLinear=void 0,Bc.prototype.InterpolantFactoryMethodSmooth=void 0;var Vc=class extends Mc{constructor(e,t,n,r){super(e,t,n,r)}};Vc.prototype.ValueTypeName=`vector`;var Hc=class extends Wr{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new Qr(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Uc=class extends Hc{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Wr.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Qr(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Wc=new _r,Gc=new q,Kc=new q,qc=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new G(512,512),this.mapType=He,this.map=null,this.mapPass=null,this.matrix=new _r,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new to,this._frameExtents=new G(1,1),this._viewportCount=1,this._viewports=[new fr(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Gc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Gc),Kc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Kc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){Wc.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Wc,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Wc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Jc=new q,Yc=new K,Xc=new q,Zc=class extends Wr{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new _r,this.projectionMatrix=new _r,this.projectionMatrixInverse=new _r,this.coordinateSystem=ln,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Jc,Yc,Xc),Xc.x===1&&Xc.y===1&&Xc.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Jc,Yc,Xc.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Jc,Yc,Xc),Xc.x===1&&Xc.y===1&&Xc.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Jc,Yc,Xc.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Qc=new q,$c=new G,el=new G,tl=class extends Zc{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=wn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Cn*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return wn*2*Math.atan(Math.tan(Cn*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Qc.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Qc.x,Qc.y).multiplyScalar(-e/Qc.z),Qc.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Qc.x,Qc.y).multiplyScalar(-e/Qc.z)}getViewSize(e,t){return this.getViewBounds(e,$c,el),t.subVectors(el,$c)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Cn*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},nl=class extends Zc{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},rl=class extends qc{constructor(){super(new nl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},il=class extends Hc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Wr.DEFAULT_UP),this.updateMatrix(),this.target=new Wr,this.shadow=new rl}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},al=-90,ol=1,sl=class extends Wr{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new tl(al,ol,e,t);r.layers=this.layers,this.add(r);let i=new tl(al,ol,e,t);i.layers=this.layers,this.add(i);let a=new tl(al,ol,e,t);a.layers=this.layers,this.add(a);let o=new tl(al,ol,e,t);o.layers=this.layers,this.add(o);let s=new tl(al,ol,e,t);s.layers=this.layers,this.add(s);let c=new tl(al,ol,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},cl=class extends tl{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},ll=`\\[\\]\\.:\\/`,ul=RegExp(`[\\[\\]\\.:\\/]`,`g`),dl=`[^\\[\\]\\.:\\/]`,fl=`[^`+ll.replace(`\\.`,``)+`]`,pl=`((?:WC+[\\/:])*)`.replace(`WC`,dl),ml=`(WCOD+)?`.replace(`WCOD`,fl),hl=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,dl),gl=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,dl),_l=RegExp(`^`+pl+ml+hl+gl+`$`),vl=[`material`,`materials`,`bones`,`map`],yl=class{constructor(e,t,n){let r=n||bl.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},bl=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(ul,``)}static parseTrackName(e){let t=_l.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);vl.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){H(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){U(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){U(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){U(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){U(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){U(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;U(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};bl.Composite=yl,bl.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},bl.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},bl.prototype.GetterByBindingType=[bl.prototype._getValue_direct,bl.prototype._getValue_array,bl.prototype._getValue_arrayElement,bl.prototype._getValue_toArray],bl.prototype.SetterByBindingTypeAndVersioning=[[bl.prototype._setValue_direct,bl.prototype._setValue_direct_setNeedsUpdate,bl.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[bl.prototype._setValue_array,bl.prototype._setValue_array_setNeedsUpdate,bl.prototype._setValue_array_setMatrixWorldNeedsUpdate],[bl.prototype._setValue_arrayElement,bl.prototype._setValue_arrayElement_setNeedsUpdate,bl.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[bl.prototype._setValue_fromArray,bl.prototype._setValue_fromArray_setNeedsUpdate,bl.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};function xl(e,t,n,r){let i=Sl(r);switch(n){case tt:return e*t;case ot:return e*t/i.components*i.byteLength;case st:return e*t/i.components*i.byteLength;case ct:return e*t*2/i.components*i.byteLength;case lt:return e*t*2/i.components*i.byteLength;case nt:return e*t*3/i.components*i.byteLength;case rt:return e*t*4/i.components*i.byteLength;case ut:return e*t*4/i.components*i.byteLength;case dt:case ft:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case pt:case mt:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case gt:case vt:return Math.max(e,16)*Math.max(t,8)/4;case ht:case _t:return Math.max(e,8)*Math.max(t,8)/2;case yt:case bt:case St:case Ct:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case xt:case wt:case Tt:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Et:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Dt:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Ot:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case kt:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case At:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case jt:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Mt:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Nt:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Pt:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Ft:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case It:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Lt:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Rt:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case zt:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Bt:case Vt:case Ht:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Ut:case Wt:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Gt:case Kt:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Sl(e){switch(e){case He:case Ue:return{byteLength:1,components:1};case Ge:case We:case Ye:return{byteLength:2,components:1};case Xe:case Ze:return{byteLength:2,components:4};case qe:case Ke:case Je:return{byteLength:4,components:1};case $e:case et:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?H(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function Cl(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function wl(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Tl={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},J={common:{diffuse:{value:new Qr(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xn},alphaMap:{value:null},alphaMapTransform:{value:new Xn},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xn}},envmap:{envMap:{value:null},envMapRotation:{value:new Xn},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xn}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xn}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xn},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xn},normalScale:{value:new G(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xn},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xn}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xn}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xn}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Qr(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Qr(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xn},alphaTest:{value:0},uvTransform:{value:new Xn}},sprite:{diffuse:{value:new Qr(16777215)},opacity:{value:1},center:{value:new G(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xn},alphaMap:{value:null},alphaMapTransform:{value:new Xn},alphaTest:{value:0}}},El={basic:{uniforms:uc([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.fog]),vertexShader:Tl.meshbasic_vert,fragmentShader:Tl.meshbasic_frag},lambert:{uniforms:uc([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.fog,J.lights,{emissive:{value:new Qr(0)},envMapIntensity:{value:1}}]),vertexShader:Tl.meshlambert_vert,fragmentShader:Tl.meshlambert_frag},phong:{uniforms:uc([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.fog,J.lights,{emissive:{value:new Qr(0)},specular:{value:new Qr(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Tl.meshphong_vert,fragmentShader:Tl.meshphong_frag},standard:{uniforms:uc([J.common,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.roughnessmap,J.metalnessmap,J.fog,J.lights,{emissive:{value:new Qr(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Tl.meshphysical_vert,fragmentShader:Tl.meshphysical_frag},toon:{uniforms:uc([J.common,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.gradientmap,J.fog,J.lights,{emissive:{value:new Qr(0)}}]),vertexShader:Tl.meshtoon_vert,fragmentShader:Tl.meshtoon_frag},matcap:{uniforms:uc([J.common,J.bumpmap,J.normalmap,J.displacementmap,J.fog,{matcap:{value:null}}]),vertexShader:Tl.meshmatcap_vert,fragmentShader:Tl.meshmatcap_frag},points:{uniforms:uc([J.points,J.fog]),vertexShader:Tl.points_vert,fragmentShader:Tl.points_frag},dashed:{uniforms:uc([J.common,J.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Tl.linedashed_vert,fragmentShader:Tl.linedashed_frag},depth:{uniforms:uc([J.common,J.displacementmap]),vertexShader:Tl.depth_vert,fragmentShader:Tl.depth_frag},normal:{uniforms:uc([J.common,J.bumpmap,J.normalmap,J.displacementmap,{opacity:{value:1}}]),vertexShader:Tl.meshnormal_vert,fragmentShader:Tl.meshnormal_frag},sprite:{uniforms:uc([J.sprite,J.fog]),vertexShader:Tl.sprite_vert,fragmentShader:Tl.sprite_frag},background:{uniforms:{uvTransform:{value:new Xn},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Tl.background_vert,fragmentShader:Tl.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Xn}},vertexShader:Tl.backgroundCube_vert,fragmentShader:Tl.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Tl.cube_vert,fragmentShader:Tl.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Tl.equirect_vert,fragmentShader:Tl.equirect_frag},distance:{uniforms:uc([J.common,J.displacementmap,{referencePosition:{value:new q},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Tl.distance_vert,fragmentShader:Tl.distance_frag},shadow:{uniforms:uc([J.lights,J.fog,{color:{value:new Qr(0)},opacity:{value:1}}]),vertexShader:Tl.shadow_vert,fragmentShader:Tl.shadow_frag}};El.physical={uniforms:uc([El.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xn},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xn},clearcoatNormalScale:{value:new G(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xn},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Xn},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xn},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xn},sheen:{value:0},sheenColor:{value:new Qr(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xn},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xn},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xn},transmissionSamplerSize:{value:new G},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xn},attenuationDistance:{value:0},attenuationColor:{value:new Qr(0)},specularColor:{value:new Qr(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xn},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xn},anisotropyVector:{value:new G},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xn}}]),vertexShader:Tl.meshphysical_vert,fragmentShader:Tl.meshphysical_frag};var Dl={r:0,b:0,g:0},Ol=new _r,kl=new Xn;kl.set(-1,0,0,0,1,0,0,0,1);function Al(e,t,n,r,i,a){let o=new Qr(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new za(new Ao(1,1,1),new _c({name:`BackgroundCubeMaterial`,uniforms:lc(El.backgroundCube.uniforms),vertexShader:El.backgroundCube.vertexShader,fragmentShader:El.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Ol.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(kl),l.material.toneMapped=tr.getTransfer(i.colorSpace)!==an,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new za(new ac(2,2),new _c({name:`BackgroundMaterial`,uniforms:lc(El.background.uniforms),vertexShader:El.background.vertexShader,fragmentShader:El.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=tr.getTransfer(i.colorSpace)!==an,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Dl,pc(e)),n.buffers.color.setClear(Dl.r,Dl.g,Dl.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function jl(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Ml(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Nl(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(H(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&H(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&H(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Pl(e){let t=this,n=null,r=0,i=!1,a=!1,o=new ra,s=new Xn,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Fl=class extends mr{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new To(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ao(5,5,5),i=new _c({name:`CubemapFromEquirect`,uniforms:lc(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new za(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=ze),new sl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},Il=256,Ll=3,Rl=20,zl=256,Bl=16,Vl=3,Hl=new q,Ul=new Qr,Wl=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new sl(1,10,null),this._boxMesh=new za(new Ao(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Hl}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(Ul));let h=new sl(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Zl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Xl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Il,Un(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?Il:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Gl(e,!1,!1),n=Math.log2(e)-Ll;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Gl(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=Zl()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Xl()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=ql(),this._integrationMaterial=Jl());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/Bl);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-Vl)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(zl*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Yl());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Gl(e,t,n){return new Fl(e,{minFilter:Ve,generateMipmaps:t,type:Ye,colorSpace:nn,depthBuffer:n})}function Kl(e,t,n){return new _c({name:e,uniforms:t,vertexShader:Tl.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function ql(){return Kl(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${zl}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Jl(){return Kl(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Bl}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Yl(){return Kl(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Rl}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Xl(){return Kl(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Zl(){return Kl(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function Ql(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Fl(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Wl(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Wl(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function $l(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&_n(`WebGLRenderer: `+e+` extension not supported.`),t}}}function eu(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?Ii:Fi)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function tu(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function nu(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:U(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function ru(e,t,n){let r=new WeakMap,i=new fr;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new hr(h,p,m,u);g.type=Je,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new G(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function iu(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var au={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function ou(e,t,n,r,i,a){let o=new mr(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new Yi;u.setAttribute(`position`,new Li([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new Li([0,2,0,0,2,0],2));let d=new vc({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new za(u,d),p=new nl(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new mr(t,n,{type:Ye,depthBuffer:!1,stencilBuffer:!1}),c=new mr(t,n,{type:Ye,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new Do(t,n),a===!0&&(l.format=at,l.type=Qe)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},tr.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=au[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var su=new dr,cu=new Do(1,1),lu=new Oo(1),uu=new hr,du=new gr,fu=new To,pu=[],mu=[],hu=new Float32Array(16),gu=new Float32Array(9),_u=new Float32Array(4);function vu(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=pu[i];if(a===void 0&&(a=new Float32Array(i),pu[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function yu(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function bu(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function xu(e,t){let n=mu[t];n===void 0&&(n=new Int32Array(t),mu[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Su(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Cu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(yu(n,t))return;e.uniform2fv(this.addr,t),bu(n,t)}}function wu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(yu(n,t))return;e.uniform3fv(this.addr,t),bu(n,t)}}function Tu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(yu(n,t))return;e.uniform4fv(this.addr,t),bu(n,t)}}function Eu(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(yu(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),bu(n,t)}else{if(yu(n,r))return;_u.set(r),e.uniformMatrix2fv(this.addr,!1,_u),bu(n,r)}}function Du(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(yu(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),bu(n,t)}else{if(yu(n,r))return;gu.set(r),e.uniformMatrix3fv(this.addr,!1,gu),bu(n,r)}}function Ou(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(yu(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),bu(n,t)}else{if(yu(n,r))return;hu.set(r),e.uniformMatrix4fv(this.addr,!1,hu),bu(n,r)}}function ku(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Au(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(yu(n,t))return;e.uniform2iv(this.addr,t),bu(n,t)}}function ju(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(yu(n,t))return;e.uniform3iv(this.addr,t),bu(n,t)}}function Mu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(yu(n,t))return;e.uniform4iv(this.addr,t),bu(n,t)}}function Nu(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Pu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(yu(n,t))return;e.uniform2uiv(this.addr,t),bu(n,t)}}function Fu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(yu(n,t))return;e.uniform3uiv(this.addr,t),bu(n,t)}}function Iu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(yu(n,t))return;e.uniform4uiv(this.addr,t),bu(n,t)}}function Lu(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function Ru(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?Lu(cu):su,n.setTexture2D(t||a,i)}function zu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||du,i)}function Bu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?Lu(lu):fu,n.setTextureCube(t||a,i)}function Vu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||uu,i)}function Hu(e){switch(e){case 5126:return Su;case 35664:return Cu;case 35665:return wu;case 35666:return Tu;case 35674:return Eu;case 35675:return Du;case 35676:return Ou;case 5124:case 35670:return ku;case 35667:case 35671:return Au;case 35668:case 35672:return ju;case 35669:case 35673:return Mu;case 5125:return Nu;case 36294:return Pu;case 36295:return Fu;case 36296:return Iu;case 35678:case 36198:case 36298:case 36306:case 35682:return Ru;case 35679:case 36299:case 36307:return zu;case 35680:case 36300:case 36308:case 36293:return Bu;case 36289:case 36303:case 36311:case 36292:return Vu}}function Uu(e,t){e.uniform1fv(this.addr,t)}function Wu(e,t){let n=vu(t,this.size,2);e.uniform2fv(this.addr,n)}function Gu(e,t){let n=vu(t,this.size,3);e.uniform3fv(this.addr,n)}function Ku(e,t){let n=vu(t,this.size,4);e.uniform4fv(this.addr,n)}function qu(e,t){let n=vu(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Ju(e,t){let n=vu(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Yu(e,t){let n=vu(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Xu(e,t){e.uniform1iv(this.addr,t)}function Zu(e,t){e.uniform2iv(this.addr,t)}function Qu(e,t){e.uniform3iv(this.addr,t)}function $u(e,t){e.uniform4iv(this.addr,t)}function ed(e,t){e.uniform1uiv(this.addr,t)}function td(e,t){e.uniform2uiv(this.addr,t)}function nd(e,t){e.uniform3uiv(this.addr,t)}function rd(e,t){e.uniform4uiv(this.addr,t)}function id(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Lu(cu):su;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function ad(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||du,a[e])}function od(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?Lu(lu):fu;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function sd(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||uu,a[e])}function cd(e){switch(e){case 5126:return Uu;case 35664:return Wu;case 35665:return Gu;case 35666:return Ku;case 35674:return qu;case 35675:return Ju;case 35676:return Yu;case 5124:case 35670:return Xu;case 35667:case 35671:return Zu;case 35668:case 35672:return Qu;case 35669:case 35673:return $u;case 5125:return ed;case 36294:return td;case 36295:return nd;case 36296:return rd;case 35678:case 36198:case 36298:case 36306:case 35682:return id;case 35679:case 36299:case 36307:return ad;case 35680:case 36300:case 36308:case 36293:return od;case 36289:case 36303:case 36311:case 36292:return sd}}var ld=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Hu(t.type)}},ud=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=cd(t.type)}},dd=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},fd=/(\w+)(\])?(\[|\.)?/g;function pd(e,t){e.seq.push(t),e.map[t.id]=t}function md(e,t,n){let r=e.name,i=r.length;for(fd.lastIndex=0;;){let a=fd.exec(r),o=fd.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){pd(n,l===void 0?new ld(s,e,t):new ud(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new dd(s),pd(n,e)),n=e}}}var hd=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);md(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function gd(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var _d=37297,vd=0;function yd(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var bd=new Xn;function xd(e){tr._getMatrix(bd,tr.workingColorSpace,e);let t=`mat3( ${bd.elements.map(e=>e.toFixed(4))} )`;switch(tr.getTransfer(e)){case rn:return[t,`LinearTransferOETF`];case an:return[t,`sRGBTransferOETF`];default:return H(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Sd(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+yd(e.getShaderSource(t),r)}return i}function Cd(e,t){let n=xd(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var wd={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Td(e,t){let n=wd[t];return n===void 0?(H(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Ed=new q;function Dd(){return tr.getLuminanceCoefficients(Ed),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Ed.x.toFixed(4)}, ${Ed.y.toFixed(4)}, ${Ed.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Od(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(jd).join(`
`)}function kd(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Ad(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function jd(e){return e!==``}function Md(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Nd(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Pd=/^[ \t]*#include +<([\w\d./]+)>/gm;function Fd(e){return e.replace(Pd,Id)}function Id(e,t){let n=Tl[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return Fd(n)}var Ld=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rd(e){return e.replace(Ld,zd)}function zd(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Bd(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Vd={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Hd(e){return Vd[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ud={302:`ENVMAP_MODE_REFRACTION`};function Wd(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Ud[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Gd={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Kd(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Gd[e.combine]||`ENVMAP_BLENDING_NONE`}function qd(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Hd(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=Wd(n),d=Kd(n),f=Od(n),p=kd(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(jd).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(jd).join(`
`),g.length>0&&(g+=`
`)):(h=[Bd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(jd).join(`
`),g=[Bd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Tl.tonemapping_pars_fragment,n.toneMapping===0?``:Td(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Tl.colorspace_pars_fragment,Cd(`linearToOutputTexel`,n.outputColorSpace),Dd(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(jd).join(`
`)),o=Fd(o),o=Md(o,n),o=Nd(o,n),s=Fd(s),s=Md(s,n),s=Nd(s,n),o=Rd(o),s=Rd(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=gd(i,i.VERTEX_SHADER,v),x=gd(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=Sd(i,b,`vertex`),n=Sd(i,x,`fragment`);U(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):H(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new hd(i,m),w=Ad(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,_d)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=vd++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var Jd=0,Yd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Xd(e),t.set(e,n)),n}},Xd=class{constructor(e){this.id=Jd++,this.code=e,this.usedTimes=0}};function Zd(e){return e===1030||e===37490||e===36285}function Qd(e,t,n,r,i,a){let o=new Or,s=new Yd,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&H(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=El[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),M=m.isInstancedMesh===!0,N=m.isBatchedMesh===!0,P=!!i.map,F=!!i.matcap,I=!!b,L=I&&b.isPMREMTexture===!0,ee=!!i.aoMap,te=!!i.lightMap,ne=!!i.bumpMap&&i.wireframe===!1,re=!!i.normalMap,ie=!!i.displacementMap,ae=!!i.emissiveMap,oe=!!i.metalnessMap,se=!!i.roughnessMap,ce=i.anisotropy>0,le=i.clearcoat>0,ue=i.diffuseRoughness>0,de=i.dispersion>0,fe=i.retroreflectivity>0,pe=i.iridescence>0,me=i.sheen>0,he=i.transmission>0,ge=ce&&!!i.anisotropyMap,_e=le&&!!i.clearcoatMap,ve=le&&!!i.clearcoatNormalMap,ye=le&&!!i.clearcoatRoughnessMap,R=ue&&!!i.diffuseRoughnessMap,z=pe&&!!i.iridescenceMap,be=pe&&!!i.iridescenceThicknessMap,xe=me&&!!i.sheenColorMap,Se=me&&!!i.sheenRoughnessMap,B=!!i.specularMap,Ce=!!i.specularColorMap,V=!!i.specularIntensityMap,we=he&&!!i.transmissionMap,Te=he&&!!i.thicknessMap,Ee=!!i.gradientMap,De=!!i.alphaMap,Oe=i.alphaTest>0,ke=!!i.alphaHash,Ae=!!i.extensions,je=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(je=e.toneMapping);let Me=L?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,Ne={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:N,batchingColor:N&&m._colorsTexture!==null,instancing:M,instancingColor:M&&m.instanceColor!==null,instancingMorph:M&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:tr.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:P,matcap:F,envMap:I,envMapMode:I&&b.mapping,envMapPMREM:L,envMapMaxLod:L?Me.length-1:null,envMapSize:L?Me[0].width:null,aoMap:ee,lightMap:te,bumpMap:ne,normalMap:re,displacementMap:ie,emissiveMap:ae,normalMapObjectSpace:re&&i.normalMapType===1,normalMapTangentSpace:re&&i.normalMapType===0,packedNormalMap:re&&i.normalMapType===0&&Zd(i.normalMap.format),metalnessMap:oe,roughnessMap:se,anisotropy:ce,anisotropyMap:ge,clearcoat:le,clearcoatMap:_e,clearcoatNormalMap:ve,clearcoatRoughnessMap:ye,diffuseRoughness:ue,diffuseRoughnessMap:R,dispersion:de,retroreflection:fe,iridescence:pe,iridescenceMap:z,iridescenceThicknessMap:be,sheen:me,sheenColorMap:xe,sheenRoughnessMap:Se,specularMap:B,specularColorMap:Ce,specularIntensityMap:V,transmission:he,transmissionMap:we,thicknessMap:Te,gradientMap:Ee,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:De,alphaTest:Oe,alphaHash:ke,combine:i.combine,mapUv:P&&p(i.map.channel),aoMapUv:ee&&p(i.aoMap.channel),lightMapUv:te&&p(i.lightMap.channel),bumpMapUv:ne&&p(i.bumpMap.channel),normalMapUv:re&&p(i.normalMap.channel),displacementMapUv:ie&&p(i.displacementMap.channel),emissiveMapUv:ae&&p(i.emissiveMap.channel),metalnessMapUv:oe&&p(i.metalnessMap.channel),roughnessMapUv:se&&p(i.roughnessMap.channel),anisotropyMapUv:ge&&p(i.anisotropyMap.channel),clearcoatMapUv:_e&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:ve&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ye&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:R&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:z&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:be&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:xe&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:Se&&p(i.sheenRoughnessMap.channel),specularMapUv:B&&p(i.specularMap.channel),specularColorMapUv:Ce&&p(i.specularColorMap.channel),specularIntensityMapUv:V&&p(i.specularIntensityMap.channel),transmissionMapUv:we&&p(i.transmissionMap.channel),thicknessMapUv:Te&&p(i.thicknessMap.channel),alphaMapUv:De&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(re||ce),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(P||De),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&re===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:je,decodeVideoTexture:P&&i.map.isVideoTexture===!0&&tr.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:ae&&i.emissiveMap.isVideoTexture===!0&&tr.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ae&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ae&&i.extensions.multiDraw===!0||N)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Ne.vertexUv1s=c.has(1),Ne.vertexUv2s=c.has(2),Ne.vertexUv3s=c.has(3),c.clear(),Ne}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=El[t];n=mc.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new qd(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function $d(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function ef(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function tf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function nf(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||ef),r.length>1&&r.sort(t||tf),i.length>1&&i.sort(t||tf)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function rf(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new nf,e.set(t,[i])):n>=r.length?(i=new nf,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function af(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new q,color:new Qr};break;case`SpotLight`:n={position:new q,direction:new q,color:new Qr,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new q,color:new Qr,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new q,skyColor:new Qr,groundColor:new Qr};break;case`RectAreaLight`:n={color:new Qr,position:new q,halfWidth:new q,halfHeight:new q}}return e[t.id]=n,n}}}function of(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var sf=0;function cf(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function lf(e){let t=new af,n=of(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new q);let i=new q,a=new _r,o=new _r;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(cf);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=J.LTC_FLOAT_1,r.rectAreaLTC2=J.LTC_FLOAT_2):(r.rectAreaLTC1=J.LTC_HALF_1,r.rectAreaLTC2=J.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=sf++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function uf(e){let t=new lf(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function df(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new uf(e),t.set(n,[a])):r>=i.length?(a=new uf(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var ff=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,pf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,mf=[new q(1,0,0),new q(-1,0,0),new q(0,1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1)],hf=[new q(0,-1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1),new q(0,-1,0),new q(0,-1,0)],gf=new _r,_f=new q,vf=new q;function yf(e,t,n){let r=new to,i=new G,a=new G,o=new fr,s=new bc,c=new xc,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new _c({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new G},radius:{value:4}},vertexShader:ff,fragmentShader:pf}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Yi;m.setAttribute(`position`,new Pi(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new za(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(H(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){H(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){H(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new mr(i.x,i.y,{format:ct,type:Ye,minFilter:ze,magFilter:ze,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Do(i.x,i.y,Je),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=it,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=Ie,d.map.depthTexture.magFilter=Ie}else l.isPointLight?(d.map=new Fl(i.x),d.map.depthTexture=new Oo(i.x,qe)):(d.map=new mr(i.x,i.y),d.map.depthTexture=new Do(i.x,i.y,qe)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=it,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=ze,d.map.depthTexture.magFilter=ze):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=Ie,d.map.depthTexture.magFilter=Ie);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),_f.setFromMatrixPosition(l.matrixWorld),e.position.copy(_f),vf.copy(e.position),vf.add(mf[t]),e.up.copy(hf[t]),e.lookAt(vf),e.updateMatrixWorld(),n.makeTranslation(-_f.x,-_f.y,-_f.z),gf.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(gf,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new mr(i.x,i.y,{format:ct,type:Ye}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function bf(e,t){function n(){let t=!1,n=new fr,r=null,i=new fr(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?oe(e.DEPTH_TEST):se(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=yn[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?oe(e.STENCIL_TEST):se(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Qr(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,M=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),N=!1,P=0,F=e.getParameter(e.VERSION);F.indexOf(`WebGL`)===-1?F.indexOf(`OpenGL ES`)!==-1&&(P=parseFloat(/^OpenGL ES (\d)/.exec(F)[1]),N=P>=2):(P=parseFloat(/^WebGL (\d)/.exec(F)[1]),N=P>=1);let I=null,L={},ee=e.getParameter(e.SCISSOR_BOX),te=e.getParameter(e.VIEWPORT),ne=new fr().fromArray(ee),re=new fr().fromArray(te);function ie(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let ae={};ae[e.TEXTURE_2D]=ie(e.TEXTURE_2D,e.TEXTURE_2D,1),ae[e.TEXTURE_CUBE_MAP]=ie(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ae[e.TEXTURE_2D_ARRAY]=ie(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ae[e.TEXTURE_3D]=ie(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),oe(e.DEPTH_TEST),o.setFunc(3),he(!1),ge(1),oe(e.CULL_FACE),pe(0);function oe(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function se(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ce(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function le(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function ue(t){return h!==t&&(e.useProgram(t),h=t,!0)}let de={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};de[103]=e.MIN,de[104]=e.MAX;let fe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function pe(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(se(e.BLEND),g=!1);else if(g===!1&&(oe(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:U(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:U(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:U(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:U(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(de[n],de[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(fe[r],fe[i],fe[o],fe[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function me(t,n){t.side===2?se(e.CULL_FACE):oe(e.CULL_FACE);let r=t.side===1;n&&(r=!r),he(r),t.blending===1&&t.transparent===!1?pe(0):pe(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ve(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?oe(e.SAMPLE_ALPHA_TO_COVERAGE):se(e.SAMPLE_ALPHA_TO_COVERAGE)}function he(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ge(t){t===0?se(e.CULL_FACE):(oe(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function _e(t){t!==k&&(N&&e.lineWidth(t),k=t)}function ve(t,n,r){t?(oe(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):se(e.POLYGON_OFFSET_FILL)}function ye(t){t?oe(e.SCISSOR_TEST):se(e.SCISSOR_TEST)}function R(t){t===void 0&&(t=e.TEXTURE0+M-1),I!==t&&(e.activeTexture(t),I=t)}function z(t,n,r){r===void 0&&(r=I===null?e.TEXTURE0+M-1:I);let i=L[r];i===void 0&&(i={type:void 0,texture:void 0},L[r]=i),(i.type!==t||i.texture!==n)&&(I!==r&&(e.activeTexture(r),I=r),e.bindTexture(t,n||ae[t]),i.type=t,i.texture=n)}function be(){let t=L[I];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function xe(){try{e.compressedTexImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Se(){try{e.compressedTexImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function B(){try{e.texSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ce(){try{e.texSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function V(){try{e.compressedTexSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function we(){try{e.compressedTexSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Te(){try{e.texStorage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ee(){try{e.texStorage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function De(){try{e.texImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Oe(){try{e.texImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function ke(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ae(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function je(t){ne.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ne.copy(t))}function Me(t){re.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),re.copy(t))}function Ne(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function Pe(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function Fe(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},I=null,L={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Qr(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ne.set(0,0,e.canvas.width,e.canvas.height),re.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:oe,disable:se,bindFramebuffer:ce,drawBuffers:le,useProgram:ue,setBlending:pe,setMaterial:me,setFlipSided:he,setCullFace:ge,setLineWidth:_e,setPolygonOffset:ve,setScissorTest:ye,activeTexture:R,bindTexture:z,unbindTexture:be,compressedTexImage2D:xe,compressedTexImage3D:Se,texImage2D:De,texImage3D:Oe,pixelStorei:Ae,getParameter:ke,updateUBOMapping:Ne,uniformBlockBinding:Pe,texStorage2D:Te,texStorage3D:Ee,texSubImage2D:B,texSubImage3D:Ce,compressedTexSubImage2D:V,compressedTexSubImage3D:we,scissor:je,viewport:Me,reset:Fe}}function xf(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new G,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):fn(`canvas`)}function v(e,t,n){let r=1,i=Te(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),H(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&H(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function b(t){e.generateMipmap(t)}function x(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function S(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];H(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||H(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?rn:tr.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function C(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,H(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function w(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function T(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function E(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function D(e){k(e.target)}function O(e){A(e.target)}function k(e){e.removeEventListener(`dispose`,D),E(e),M(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function A(e){e.removeEventListener(`dispose`,O),E(e),P(e)}function j(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?A(t):k(t))}m.clear(),d.clear()}function M(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&N(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function N(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function P(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&k(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let F=0;function I(){F=0}function L(){return F}function ee(e){F=e}function te(){let e=F;return e>=i.maxTextures&&H(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),F+=1,e}function ne(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function re(t,i){let a=r.get(t);if(t.isVideoTexture&&V(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)H(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)H(`WebGLRenderer: Texture marked for update but image is incomplete`);else{me(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function ie(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?me(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function ae(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?me(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function oe(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?he(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let se={[Ne]:e.REPEAT,[Pe]:e.CLAMP_TO_EDGE,[Fe]:e.MIRRORED_REPEAT},ce={[Ie]:e.NEAREST,[Le]:e.NEAREST_MIPMAP_NEAREST,[Re]:e.NEAREST_MIPMAP_LINEAR,[ze]:e.LINEAR,[Be]:e.LINEAR_MIPMAP_NEAREST,[Ve]:e.LINEAR_MIPMAP_LINEAR},le={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function ue(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&H(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,se[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,se[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,se[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ce[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ce[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,le[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function de(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,D),T(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=ne(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&N(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function fe(e,t,n){return Math.floor(Math.floor(e/n)/t)}function pe(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=fe(n.start,r.width,4),c=fe(t.start,r.width,4);n.start<=i+1&&a===c&&fe(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function me(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=de(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=tr.getPrimaries(tr.workingColorSpace),r=o.colorSpace===``?null:tr.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=we(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=S(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);ue(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,x=f.__version===void 0||l===!0,T=u.dataReady,E=w(o,t);if(o.isDepthTexture)m=C(o.format===at,o.type),x&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(x&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&pe(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(T){if(o.layerUpdates.size>0){let t=xl(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=xl(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(x&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(x){if(_)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&x){let t=Te(g[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(x){let r=Te(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&b(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function he(t,o,s){if(o.image.length!==6)return;let c=de(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=tr.getPrimaries(tr.workingColorSpace),r=o.colorSpace===``?null:tr.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=we(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),x=S(o.internalFormat,g,_,o.normalized,o.colorSpace),T=o.isVideoTexture!==!0,E=u.__version===void 0||c===!0,D=l.dataReady,O=w(o,h);ue(e.TEXTURE_CUBE_MAP,o);let k;if(o.isDepthTexture){if(x=C(o.format===at,o.type),E){if(T)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,x,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,h.width,h.height,0,g,_,null)}}else if(f){T&&E&&n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,h.width,h.height);for(let t=0;t<6;t++){k=m[t].mipmaps;for(let r=0;r<k.length;r++){let i=k[r];o.format===1023?T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,g,_,i.data):g===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):T?D&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,i.data)}}}else{if(k=o.mipmaps,T&&E){k.length>0&&O++;let t=Te(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,t.width,t.height)}for(let t=0;t<6;t++)if(p){T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<k.length;r++){let i=k[r].image[t].image;T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,i.width,i.height,0,g,_,i.data)}}else{T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,g,_,m[t]);for(let r=0;r<k.length;r++){let i=k[r];T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ge(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=S(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),Ce(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,B(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function _e(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=C(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Ce(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,B(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,B(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=S(o.internalFormat,c,l,o.normalized,o.colorSpace);Ce(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,B(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,B(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function ve(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?oe(i.depthTexture,0):re(i.depthTexture,0);let u=c.__webglTexture,d=B(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)Ce(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)Ce(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function ye(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)ve(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?ve(i.__webglFramebuffer[0],t,0):ve(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),_e(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),_e(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function R(t,n,i){let a=r.get(t);n!==void 0&&ge(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&ye(t)}function z(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,O),T(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&Ce(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=S(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=B(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),_e(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),ue(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)ge(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else ge(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?b(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),ue(c,a),ge(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&b(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),ue(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)ge(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else ge(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?b(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&ye(t)}function be(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=x(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),b(t),n.unbindTexture()}}}let xe=[];function Se(t){if(t.samples>0){if(Ce(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(xe.length=0,xe.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&xe.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,xe))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function B(e){return Math.min(i.maxSamples,e.samples)}function Ce(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function V(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function we(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(tr.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&H(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):U(`WebGLTextures: Unsupported texture color space:`,n)),t}function Te(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=te,this.resetTextureUnits=I,this.getTextureUnits=L,this.setTextureUnits=ee,this.setTexture2D=re,this.setTexture2DArray=ie,this.setTexture3D=ae,this.setTextureCube=oe,this.rebindTextures=R,this.setupRenderTarget=z,this.updateRenderTargetMipmap=be,this.updateMultisampleRenderTarget=Se,this.setupDepthRenderbuffer=ye,this.setupFrameBufferTexture=ge,this.useMultisampledRTT=Ce,this.dispose=j}function Sf(e,t){function n(n,r=``){let i,a=tr.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Cf=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,wf=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Tf=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ko(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new _c({vertexShader:Cf,fragmentShader:wf,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new za(new ac(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ef=class extends bn{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new Tf,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new G,C=null,w=null,T=new tl;T.viewport=new fr;let E=new tl;E.viewport=new fr;let D=[T,E],O=new cl,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new qr,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new qr,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new qr,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function M(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,M),r.removeEventListener(`inputsourceschange`,N);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,ee.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,M),r.addEventListener(`inputsourceschange`,N),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?at:it,a=_.stencil?Qe:qe);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new mr(d.textureWidth,d.textureHeight,{format:rt,type:He,depthTexture:new Do(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new mr(f.framebufferWidth,f.framebufferHeight,{format:rt,type:He,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ee.setContext(r),ee.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function N(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function P(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;P(O,i);for(let e=0;e<a.length;e++)P(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),F(e,O,i)};function F(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=wn*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let I=null;function L(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new tl,o.layers.enable(n),o.viewport=new fr,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new ko,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}I&&I(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ee=new Cl;ee.setAnimationLoop(L),this.setAnimationLoop=function(e){I=e},this.dispose=function(){}}},Df=new _r,Of=new Xn;Of.set(-1,0,0,0,1,0,0,0,1);function kf(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,pc(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Df.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Of),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Af(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?H(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):H(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var jf=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Mf=null;function Nf(){return Mf===null&&(Mf=new Ha(jf,16,16,ct,Ye),Mf.name=`DFG_LUT`,Mf.minFilter=ze,Mf.magFilter=ze,Mf.wrapS=Pe,Mf.wrapT=Pe,Mf.generateMipmaps=!1,Mf.needsUpdate=!0),Mf}var Pf=class{constructor(e={}){let{canvas:t=pn(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=He}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([ut,lt,st]),g=new Set([He,qe,Ge,Qe,Xe,Ze]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=tn;let j=0,M=0,N=null,P=-1,F=null,I=new fr,L=new fr,ee=null,te=new Qr(0),ne=0,re=t.width,ie=t.height,ae=1,oe=null,se=null,ce=new fr(0,0,re,ie),le=new fr(0,0,re,ie),ue=!1,de=new to,fe=new ro,pe=!1,me=!1,he=new _r,ge=new q,_e=new fr,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ye=!1;function R(){return N===null?ae:1}let z=n;function be(e,n){return t.getContext(e,n)}let xe,Se,B,Ce,V,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be,Ue;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,Je,!1),t.addEventListener(`webglcontextrestored`,$e,!1),t.addEventListener(`webglcontextcreationerror`,et,!1),z===null){let t=`webgl2`;if(z=be(t,e),z===null)throw be(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}We()}catch(e){throw t.removeEventListener(`webglcontextlost`,Je,!1),t.removeEventListener(`webglcontextrestored`,$e,!1),t.removeEventListener(`webglcontextcreationerror`,et,!1),U(`WebGLRenderer: `+e.message),e}function We(){xe=new $l(z),xe.init(),ze=new Sf(z,xe),Se=new Nl(z,xe,e,ze),B=new bf(z,xe),Se.reversedDepthBuffer&&d&&B.buffers.depth.setReversed(!0),O=z.createFramebuffer(),k=z.createFramebuffer(),A=z.createFramebuffer(),Ce=new nu(z),V=new $d,we=new xf(z,xe,B,V,Se,ze,Ce),Te=new Ql(T),Ee=new wl(z),Be=new jl(z,Ee),De=new eu(z,Ee,Ce,Be),Oe=new iu(z,De,Ee,Be,Ce),Ie=new ru(z,Se,we),Ne=new Pl(V),ke=new Qd(T,Te,xe,Se,Be,Ne),Ae=new kf(T,V),je=new rf,Me=new df(xe),Fe=new Al(T,Te,B,Oe,p,s),Pe=new yf(T,Oe,Se),Ue=new Af(z,Ce,Se,B),Le=new Ml(z,xe,Ce),Re=new tu(z,xe,Ce),Ce.programs=ke.programs,T.capabilities=Se,T.extensions=xe,T.properties=V,T.renderLists=je,T.shadowMap=Pe,T.state=B,T.info=Ce}m!==1009&&(w=new ou(m,t.width,t.height,o,r,i));let Ke=new Ef(T,z);this.xr=Ke,this.getContext=function(){return z},this.getContextAttributes=function(){return z.getContextAttributes()},this.forceContextLoss=function(){let e=xe.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=xe.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return ae},this.setPixelRatio=function(e){e!==void 0&&(ae=e,this.setSize(re,ie,!1))},this.getSize=function(e){return e.set(re,ie)},this.setSize=function(e,n,r=!0){Ke.isPresenting?H(`WebGLRenderer: Can't change size while VR device is presenting.`):(re=e,ie=n,t.width=Math.floor(e*ae),t.height=Math.floor(n*ae),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(re*ae,ie*ae).floor()},this.setDrawingBufferSize=function(e,n,r){re=e,ie=n,ae=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)U(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){H(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(I)},this.getViewport=function(e){return e.copy(ce)},this.setViewport=function(e,t,n,r){e.isVector4?ce.set(e.x,e.y,e.z,e.w):ce.set(e,t,n,r),B.viewport(I.copy(ce).multiplyScalar(R()).round())},this.getScissor=function(e){return e.copy(le)},this.setScissor=function(e,t,n,r){e.isVector4?le.set(e.x,e.y,e.z,e.w):le.set(e,t,n,r),B.scissor(L.copy(le).multiplyScalar(R()).round())},this.getScissorTest=function(){return ue},this.setScissorTest=function(e){B.setScissorTest(ue=e)},this.setOpaqueSort=function(e){oe=e},this.setTransparentSort=function(e){se=e},this.getClearColor=function(e){return e.copy(Fe.getClearColor())},this.setClearColor=function(){Fe.setClearColor(...arguments)},this.getClearAlpha=function(){return Fe.getClearAlpha()},this.setClearAlpha=function(){Fe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=Fe.getClearColor(),r=Fe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,z.clearBufferuiv(z.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,z.clearBufferiv(z.COLOR,0,v))}else r|=z.COLOR_BUFFER_BIT}t&&(r|=z.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=z.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&z.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Je,!1),t.removeEventListener(`webglcontextrestored`,$e,!1),t.removeEventListener(`webglcontextcreationerror`,et,!1),Fe.dispose(),je.dispose(),Me.dispose(),we.dispose(),V.dispose(),Te.dispose(),Oe.dispose(),De.dispose(),Be.dispose(),Ue.dispose(),ke.dispose(),Ke.dispose(),Ke.removeEventListener(`sessionstart`,ct),Ke.removeEventListener(`sessionend`,dt),ft.stop()};function Je(e){e.preventDefault(),hn(`WebGLRenderer: Context Lost.`),E=!0}function $e(){hn(`WebGLRenderer: Context Restored.`),E=!1;let e=Ce.autoReset,t=Pe.enabled,n=Pe.autoUpdate,r=Pe.needsUpdate,i=Pe.type;We(),Ce.autoReset=e,Pe.enabled=t,Pe.autoUpdate=n,Pe.needsUpdate=r,Pe.type=i}function et(e){U(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function tt(e){let t=e.target;t.removeEventListener(`dispose`,tt),nt(t)}function nt(e){rt(e),V.remove(e)}function rt(e){let t=V.get(e).programs;t!==void 0&&(t.forEach(function(e){ke.releaseProgram(e)}),e.isShaderMaterial&&ke.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ve);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Ct(e,t,n,r,i);B.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=De.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Be.setup(i,r,s,n,c);let h,g=Le;if(c!==null&&(h=Ee.get(c),g=Re,g.setIndex(h)),i.isMesh)r.wireframe===!0?(B.setLineWidth(r.wireframeLinewidth*R()),g.setMode(z.LINES)):g.setMode(z.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),B.setLineWidth(e*R()),i.isLineSegments?g.setMode(z.LINES):i.isLineLoop?g.setMode(z.LINE_LOOP):g.setMode(z.LINE_STRIP)}else i.isPoints?g.setMode(z.POINTS):i.isSprite&&g.setMode(z.TRIANGLES);if(i.isBatchedMesh){if(xe.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ee.get(c).bytesPerElement:1,o=V.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(z,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function it(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),pe===!0&&Ne.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,yt(e,t,r),e.side=0,e.needsUpdate=!0,yt(e,t,r),e.side=2):yt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Me.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),me=this.localClippingEnabled,pe=Ne.init(this.clippingPlanes,me),pe===!0&&Ne.setGlobalState(this.clippingPlanes,t),D!==null&&Pe.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];it(o,n,t,e),r.add(o)}else it(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=V.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}xe.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let at=null;function ot(e){at&&at(e)}function ct(){ft.stop()}function dt(){ft.start()}let ft=new Cl;ft.setAnimationLoop(ot),typeof self<`u`&&ft.setContext(self),this.setAnimationLoop=function(e){at=e,Ke.setAnimationLoop(e),e===null?ft.stop():ft.start()},Ke.addEventListener(`sessionstart`,ct),Ke.addEventListener(`sessionend`,dt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){U(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=Ke.enabled===!0&&Ke.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Ke.enabled===!0&&Ke.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Ke.cameraAutoUpdate===!0&&Ke.updateCamera(t),t=Ke.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=Me.get(e,C.length),x.init(t),x.state.textureUnits=we.getTextureUnits(),C.push(x),he.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?fe.setFromArrayCamera(t):de.setFromProjectionMatrix(he,ln,t.reversedDepth),me=this.localClippingEnabled,pe=Ne.init(this.clippingPlanes,me),b=je.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,Ke.enabled===!0&&Ke.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&pt(e,t,-1/0,T.sortObjects)}pt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(oe,se),ye=Ke.enabled===!1||Ke.isPresenting===!1||Ke.hasDepthSensing()===!1,ye&&Fe.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),pe===!0&&Ne.beginShadows();let i=x.state.shadowsArray;if(Pe.render(i,e,t),pe===!0&&Ne.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];ht(n,r,e,a)}ye&&Fe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];mt(b,e,n,n.viewport)}}else r.length>0&&ht(n,r,e,t),ye&&Fe.render(e),mt(b,e,t)}N!==null&&M===0&&(we.updateMultisampleRenderTarget(N),we.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Be.resetDefaultState(),P=-1,F=null,C.pop(),C.length>0?(x=C[C.length-1],we.setTextureUnits(x.state.textureUnits),pe===!0&&Ne.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function pt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?fe:de;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&_e.setFromMatrixPosition(e.matrixWorld).applyMatrix4(he);let i=Oe.update(e),a=e.material;a.visible&&b.push(e,i,a,n,_e.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?fe:de;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Oe.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),_e.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),_e.copy(e.boundingSphere.center)),_e.applyMatrix4(e.matrixWorld).applyMatrix4(he)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,_e.z,s,t)}}else a.visible&&b.push(e,i,a,n,_e.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)pt(i[e],t,n,r)}function mt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),pe===!0&&Ne.setGlobalState(T.clippingPlanes,n),r&&B.viewport(I.copy(r)),i.length>0&&gt(i,t,n),a.length>0&&gt(a,t,n),o.length>0&&gt(o,t,n),B.buffers.depth.setTest(!0),B.buffers.depth.setMask(!0),B.buffers.color.setMask(!0),B.setPolygonOffset(!1)}function ht(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=xe.has(`EXT_color_buffer_half_float`)||xe.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new mr(1,1,{generateMipmaps:!0,type:e?Ye:He,minFilter:Ve,samples:Math.max(4,Se.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:tr.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||I;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(te),ne=T.getClearAlpha(),ne<1&&T.setClearColor(16777215,.5),T.clear(),ye&&Fe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),pe===!0&&Ne.setGlobalState(T.clippingPlanes,r),gt(e,n,r),we.updateMultisampleRenderTarget(a),we.updateRenderTargetMipmap(a),xe.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,_t(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(we.updateMultisampleRenderTarget(a),we.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(te,ne),d!==void 0&&(r.viewport=d),T.toneMapping=u}function gt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&_t(o,t,n,s,l,c)}}function _t(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function vt(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function yt(e,t,n){t.isScene!==!0&&(t=ve);let r=V.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=ke.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=ke.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Te.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,tt),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return St(e,s),d}else s.uniforms=ke.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=ke.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ne.uniform),St(e,s),r.needsLights=Tt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=vt(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function bt(e,t,n,r,i){let a=V.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=yt(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function xt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=hd.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function St(e,t){let n=V.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Ct(e,t,n,r,i){t.isScene!==!0&&(t=ve),we.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:tr.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Te.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=V.get(r),b=x.state.lights;if(pe===!0&&(me===!0||e!==F)){let t=e===F&&r.id===P;Ne.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ne.numPlanes||v.numIntersection!==Ne.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===vt(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?bt(r,t,i,s,h):yt(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(B.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==P&&(P=r.id,O=!0),E||F!==e){B.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(z,`projectionMatrix`,e.projectionMatrix),A.setValue(z,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(z,ge.setFromMatrixPosition(e.matrixWorld)),Se.logarithmicDepthBuffer&&A.setValue(z,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(z,`isOrthographic`,e.isOrthographicCamera===!0),F!==e&&(F=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(z,`sunShadowMap`,b.state.sunShadowMap,we),b.state.directionalShadowMap.length>0&&A.setValue(z,`directionalShadowMap`,b.state.directionalShadowMap,we),b.state.spotShadowMap.length>0&&A.setValue(z,`spotShadowMap`,b.state.spotShadowMap,we),b.state.pointShadowMap.length>0&&A.setValue(z,`pointShadowMap`,b.state.pointShadowMap,we)),i.isSkinnedMesh){A.setOptional(z,i,`bindMatrix`),A.setOptional(z,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(z,`boneTexture`,e.boneTexture,we))}i.isBatchedMesh&&(A.setOptional(z,i,`batchingTexture`),A.setValue(z,`batchingTexture`,i._matricesTexture,we),A.setOptional(z,i,`batchingIdTexture`),A.setValue(z,`batchingIdTexture`,i._indirectTexture,we),A.setOptional(z,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(z,`batchingColorTexture`,i._colorsTexture,we));let M=n.morphAttributes;if((M.position!==void 0||M.normal!==void 0||M.color!==void 0)&&Ie.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(z,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=Nf()),O){if(A.setValue(z,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&wt(j,k),a&&r.fog===!0&&Ae.refreshFogUniforms(j,a),Ae.refreshMaterialUniforms(j,r,ae,ie,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}hd.upload(z,xt(v),j,we)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(hd.upload(z,xt(v),j,we),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(z,`center`,i.center),A.setValue(z,`modelViewMatrix`,i.modelViewMatrix),A.setValue(z,`normalMatrix`,i.normalMatrix),A.setValue(z,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Ue.update(n,w),Ue.bind(n,w)}}return w}function wt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Tt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=V.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),V.get(e.texture).__webglTexture=t,V.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=V.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,j=t,M=n;let r=null,i=!1,a=!1;if(e){let o=V.get(e);if(o.__useDefaultFramebuffer!==void 0){B.bindFramebuffer(z.FRAMEBUFFER,o.__webglFramebuffer),I.copy(e.viewport),L.copy(e.scissor),ee=e.scissorTest,B.viewport(I),B.scissor(L),B.setScissorTest(ee),P=-1;return}if(o.__webglFramebuffer===void 0)we.setupRenderTarget(e);else if(o.__hasExternalTextures)we.rebindTextures(e,V.get(e.texture).__webglTexture,V.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&V.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);we.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=V.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&we.useMultisampledRTT(e)===!1?V.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,I.copy(e.viewport),L.copy(e.scissor),ee=e.scissorTest}else I.copy(ce).multiplyScalar(ae).floor(),L.copy(le).multiplyScalar(ae).floor(),ee=ue;if(n!==0&&(r=O),B.bindFramebuffer(z.FRAMEBUFFER,r)&&B.drawBuffers(e,r),B.viewport(I),B.scissor(L),B.setScissorTest(ee),i){let r=V.get(e.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=V.get(e.textures[t]);z.framebufferTextureLayer(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=V.get(e.texture);z.framebufferTexture2D(z.FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,t.__webglTexture,n)}P=-1};function Et(e){let t=V.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Se.textureFormatReadable(e.format),t.__typeReadable=Se.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=V.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){B.bindFramebuffer(z.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&z.readBuffer(z.COLOR_ATTACHMENT0+s);let u=Et(o);if(u.__formatReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&z.readPixels(t,n,r,i,ze.convert(c),ze.convert(l),a)}finally{let e=N===null?null:V.get(N).__webglFramebuffer;B.bindFramebuffer(z.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=V.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){B.bindFramebuffer(z.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&z.readBuffer(z.COLOR_ATTACHMENT0+s);let d=Et(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=z.createBuffer();z.bindBuffer(z.PIXEL_PACK_BUFFER,f),z.bufferData(z.PIXEL_PACK_BUFFER,a.byteLength,z.STREAM_READ),z.readPixels(t,n,r,i,ze.convert(l),ze.convert(u),0),z.bindBuffer(z.PIXEL_PACK_BUFFER,null);let p=N===null?null:V.get(N).__webglFramebuffer;B.bindFramebuffer(z.FRAMEBUFFER,p);let m=z.fenceSync(z.SYNC_GPU_COMMANDS_COMPLETE,0);return z.flush(),await vn(z,m,4),z.bindBuffer(z.PIXEL_PACK_BUFFER,f),z.getBufferSubData(z.PIXEL_PACK_BUFFER,0,a),z.bindBuffer(z.PIXEL_PACK_BUFFER,null),z.deleteBuffer(f),z.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;we.setTexture2D(e,0),z.copyTexSubImage2D(z.TEXTURE_2D,n,0,0,o,s,i,a),B.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=ze.convert(t.format),_=ze.convert(t.type),v;t.isData3DTexture?(we.setTexture3D(t,0),v=z.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(we.setTexture2DArray(t,0),v=z.TEXTURE_2D_ARRAY):(we.setTexture2D(t,0),v=z.TEXTURE_2D),B.activeTexture(z.TEXTURE0),B.pixelStorei(z.UNPACK_FLIP_Y_WEBGL,t.flipY),B.pixelStorei(z.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),B.pixelStorei(z.UNPACK_ALIGNMENT,t.unpackAlignment);let y=B.getParameter(z.UNPACK_ROW_LENGTH),b=B.getParameter(z.UNPACK_IMAGE_HEIGHT),x=B.getParameter(z.UNPACK_SKIP_PIXELS),S=B.getParameter(z.UNPACK_SKIP_ROWS),C=B.getParameter(z.UNPACK_SKIP_IMAGES);B.pixelStorei(z.UNPACK_ROW_LENGTH,h.width),B.pixelStorei(z.UNPACK_IMAGE_HEIGHT,h.height),B.pixelStorei(z.UNPACK_SKIP_PIXELS,l),B.pixelStorei(z.UNPACK_SKIP_ROWS,u),B.pixelStorei(z.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=V.get(e),r=V.get(t),h=V.get(n.__renderTarget),g=V.get(r.__renderTarget);B.bindFramebuffer(z.READ_FRAMEBUFFER,h.__webglFramebuffer),B.bindFramebuffer(z.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,V.get(e).__webglTexture,i,d+n),z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,V.get(t).__webglTexture,a,m+n)),z.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,z.DEPTH_BUFFER_BIT,z.NEAREST);B.bindFramebuffer(z.READ_FRAMEBUFFER,null),B.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||V.has(e)){let n=V.get(e),r=V.get(t);B.bindFramebuffer(z.READ_FRAMEBUFFER,k),B.bindFramebuffer(z.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?z.framebufferTextureLayer(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):z.framebufferTexture2D(z.READ_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,n.__webglTexture,i),T?z.framebufferTextureLayer(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):z.framebufferTexture2D(z.DRAW_FRAMEBUFFER,z.COLOR_ATTACHMENT0,z.TEXTURE_2D,r.__webglTexture,a),i===0?T?z.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):z.copyTexSubImage2D(v,a,f,p,l,u,o,s):z.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,z.COLOR_BUFFER_BIT,z.NEAREST);B.bindFramebuffer(z.READ_FRAMEBUFFER,null),B.bindFramebuffer(z.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?z.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?z.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):z.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?z.texSubImage2D(z.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?z.compressedTexSubImage2D(z.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):z.texSubImage2D(z.TEXTURE_2D,a,f,p,o,s,g,_,h);B.pixelStorei(z.UNPACK_ROW_LENGTH,y),B.pixelStorei(z.UNPACK_IMAGE_HEIGHT,b),B.pixelStorei(z.UNPACK_SKIP_PIXELS,x),B.pixelStorei(z.UNPACK_SKIP_ROWS,S),B.pixelStorei(z.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&z.generateMipmap(v),B.unbindTexture()},this.initRenderTarget=function(e){V.get(e).__webglFramebuffer===void 0&&we.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?we.setTextureCube(e,0):e.isData3DTexture?we.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?we.setTexture2DArray(e,0):we.setTexture2D(e,0),B.unbindTexture()},this.resetState=function(){j=0,M=0,N=null,B.reset(),Be.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return ln}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=tr._getDrawingBufferColorSpace(e),t.unpackColorSpace=tr._getUnpackColorSpace()}},Ff=e=>e&&[e.x,e.y,e.z].every(Number.isFinite),If=e=>e&&[e.left,e.right,e.top,e.bottom].every(Number.isFinite)&&e.left<e.right&&e.top<e.bottom,Lf=(e,t,n)=>Math.min(n,Math.max(t,e)),Rf=180/Math.PI,zf=e=>((e+180)%360+360)%360-180;function Bf(e,t){if(!Ff(e)||!Math.hypot(e.x,e.y,e.z)||!t||![`commandedYawDegrees`,`yawErrorDegrees`,`commandedClimbDegrees`,`climbErrorDegrees`,`minClimbDegrees`,`maxClimbDegrees`].every(e=>Number.isFinite(t[e])))return!1;let n=Math.atan2(e.x,-e.z)*Rf,r=Math.atan2(e.y,Math.hypot(e.x,e.z))*Rf,i=t.commandedYawDegrees-t.yawErrorDegrees,a=t.commandedClimbDegrees-t.climbErrorDegrees,o=zf(n-i),s=r-a,c=1e-6,l=t.mode===`recover`&&t.criticalRecovery!==!1?0:Math.min(15,Math.abs(t.yawErrorDegrees)),u=Math.min(10,Math.abs(t.climbErrorDegrees));if(Math.abs(o)>l+c||o*t.yawErrorDegrees<-1e-6||Math.abs(s)>u+c||s*t.climbErrorDegrees<-1e-6)return!1;let d=t.minClimbDegrees,f=t.maxClimbDegrees;return t.mode===`recover`&&(d=Math.min(d,t.commandedClimbDegrees),f=Math.max(f,t.commandedClimbDegrees)),r>=d-c&&r<=f+c}function Vf(e,t){if(!Ff(e)||!t||![`commandedYawDegrees`,`yawErrorDegrees`,`commandedClimbDegrees`,`climbErrorDegrees`,`minClimbDegrees`,`maxClimbDegrees`].every(e=>Number.isFinite(t[e])))return null;let n=(e,t)=>({x:Math.sin(e/Rf)*Math.cos(t/Rf),y:Math.sin(t/Rf),z:-Math.cos(e/Rf)*Math.cos(t/Rf)});if(t.mode===`recover`&&t.criticalRecovery!==!1)return n(t.commandedYawDegrees,t.commandedClimbDegrees);let r=t.commandedYawDegrees-t.yawErrorDegrees,i=t.commandedClimbDegrees-t.climbErrorDegrees,a=Lf(t.yawErrorDegrees,-15,15),o=Lf(t.climbErrorDegrees,-10,10),s=t.minClimbDegrees,c=t.maxClimbDegrees;if(t.mode===`recover`&&(s=Math.min(s,t.commandedClimbDegrees),c=Math.max(c,t.commandedClimbDegrees)),s=Math.max(s,i+Math.min(0,o)),c=Math.min(c,i+Math.max(0,o)),s>c+1e-6)return null;let l=Lf(zf(Math.atan2(e.x,-e.z)*Rf-r),Math.min(0,a),Math.max(0,a)),u=Lf(Math.atan2(e.y,Math.hypot(e.x,e.z))*Rf,s,c);return n(r+l,u)}function Hf(e){if(!e)return[];let t=[];for(let n of[0,.25,.5,.75,1])for(let r of[0,.25,.5,.75,1]){let i=(e.commandedYawDegrees-e.yawErrorDegrees*(1-n))/Rf,a=(e.commandedClimbDegrees-e.climbErrorDegrees*(1-r))/Rf,o={x:Math.sin(i)*Math.cos(a),y:Math.sin(a),z:-Math.cos(i)*Math.cos(a)};Bf(o,e)&&t.push(o)}return t}function Uf(e){if(!e||![e.x,e.y,e.z,e.w].every(Number.isFinite))return null;let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z),Math.abs(e.w));return t?new K(e.x/t,e.y/t,e.z/t,e.w/t).normalize():null}function Wf(e,t,n){let r=e?.fieldOfView?.vertical;if(![t,n,r].every(Number.isFinite)||t<=0||n<=0||r<=0||r>=180)return null;let i=Uf(e.worldQuaternion),a=Uf(e.cameraQuaternion??{x:0,y:0,z:0,w:1});if(!i||!a)return null;let o=a.invert().multiply(i).normalize(),s=o.clone().invert(),c=n/2/Math.tan(r*Math.PI/360);if(!Number.isFinite(c)||c<=0)return null;let l=e=>{let r=e.z<-1e-8;return{local:{x:e.x,y:e.y,z:e.z},inFront:r,x:r?t/2+c*e.x/-e.z:null,y:r?n/2-c*e.y/-e.z:null}};return{width:t,height:n,focal:c,rotation:o,projectDirection(e){return!Ff(e)||!Math.hypot(e.x,e.y,e.z)?null:l(new q(e.x,e.y,e.z).applyQuaternion(o))},rayFromPixel(e,r){if(![e,r].every(Number.isFinite))return null;let i=new q((e-t/2)/c,-(r-n/2)/c,-1).normalize().applyQuaternion(s);return{x:i.x,y:i.y,z:i.z}},target(){if(!Ff(e.targetLocal))return null;let r=l(e.targetLocal),i=r.inFront&&r.x>=0&&r.x<=t&&r.y>=0&&r.y<=n,a=e.cameraClipping?.near??.1,o=e.cameraClipping?.far??250,s=-e.targetLocal.z,c=Number.isFinite(a)&&Number.isFinite(o)&&a>0&&o>a;return{...r,inViewport:i,visible:i&&c&&s>=a&&s<=o}}}}function Gf(e,t,n=[],{width:r=48,height:i=48,padding:a=5,accept:o=()=>!0,candidates:s=[]}={}){if(!e||![e.x,e.y,r,i,a].every(Number.isFinite)||r<=0||i<=0||a<0||!If(t))return null;let c=r/2,l=i/2,u={left:t.left+c,right:t.right-c,top:t.top+l,bottom:t.bottom-l};if(u.left>u.right||u.top>u.bottom)return null;let d=n.filter(If),f=e=>o(e)&&!d.some(t=>e.x+c>t.left-a&&e.x-c<t.right+a&&e.y+l>t.top-a&&e.y-l<t.bottom+a),p=e=>({x:Lf(e.x,u.left,u.right),y:Lf(e.y,u.top,u.bottom)}),m=p(e);if(f(m))return m;let h=s.filter(e=>e&&Number.isFinite(e.x)&&Number.isFinite(e.y));for(let e of d){let t=e.left-c-a,n=e.right+c+a,r=e.top-l-a,i=e.bottom+l+a;h.push({x:t,y:m.y},{x:n,y:m.y},{x:m.x,y:r},{x:m.x,y:i},{x:t,y:r},{x:n,y:r},{x:t,y:i},{x:n,y:i})}for(let e of[u.left,(u.left+u.right)/2,u.right])for(let t of[u.top,(u.top+u.bottom)/2,u.bottom])h.push({x:e,y:t});let g=h.map(p).filter(f);return g.sort((t,n)=>Math.hypot(t.x-e.x,t.y-e.y)-Math.hypot(n.x-e.x,n.y-e.y)),g[0]??null}var Kf=e=>document.getElementById(e),qf=(e,t)=>e?.toggleAttribute(`hidden`,!t),Jf=(e,t)=>{let n=Kf(e);n&&n.textContent!==t&&(n.textContent=t)},Yf=e=>e&&!e.hasAttribute(`hidden`)&&e.getClientRects().length?e.getBoundingClientRect():null,Xf=(e,t,n)=>({left:e.x-t/2,right:e.x+t/2,top:e.y-n/2,bottom:e.y+n/2});function Zf(){qf(Kf(`stage-boundary-warning`),!1);let e=Kf(`app`);e&&(e.dataset.boundaryWarning=`clear`,delete e.dataset.boundaryReturnBearing)}function Qf(){return[...[`radar`,`flight-essential-speed`,`flight-essential-altitude`,`bottom-panel`,`practice-panel`,`cockpit-speed`,`cockpit-altitude`,`cockpit-vario`,`cockpit-heading`,`cockpit-target-height`,`cockpit-exit-notice`,`cockpit-power`,`target-edge-marker`,`cockpit-objective-label`,`guidance-director`,`guidance-flight-path`,`guidance-target-point`,`guidance-edge-arrow`,`guidance-edge-label`,`guidance-next-notice`,`guidance-heading`,`guidance-status`,`toast`].map(e=>Yf(Kf(e))),...[`.navigation`,`.topbar .brand`,`.topbar .version`,`.topbar .feedback-metrics`,`.topbar .mode-tag`].map(e=>Yf(document.querySelector(e)))].filter(Boolean)}function $f(e,{phase:t=`running`,settings:n={}}={}){let r=Kf(`stage-boundary-warning`),i=Kf(`app`);if(!r||t!==`running`||e?.complete)return Zf(),null;let a=e?.boundary,o=a&&Number.isFinite(a.clearance)&&typeof a.near==`boolean`&&typeof a.outside==`boolean`?a:Me(e?.position,{heading:e?.heading,speed:e?.speed,velocity:e?.velocity,turnGravity:n?.turnGravity??e?.turnGravity,maxBank:n?.maxBank,halfExtent:e?.stageHalfExtent??e?.halfExtent??350});if(!o)return Zf(),null;if(r.dataset.level=o.level,r.dataset.clearance=String(o.clearance),r.dataset.motion=o.motion??`unknown`,i&&(i.dataset.boundaryWarning=o.level),!o.near||!Number.isFinite(o.returnBearingDeg))return qf(r,!1),i&&delete i.dataset.boundaryReturnBearing,{...o,visible:!1,panel:null};let s=P(n?.hudLanguage),c=innerWidth,l=innerHeight,u=getComputedStyle(document.documentElement),d=Math.max(0,parseFloat(u.getPropertyValue(`--screen-safe-left`))||0),f=Math.max(0,parseFloat(u.getPropertyValue(`--screen-safe-right`))||0),p={left:d+12,right:c-f-12,top:12,bottom:l-12},m=Qf(),h=Yf(document.querySelector(`.navigation`)),g={x:c/2,y:Math.max((h?.bottom??40)+32,l*.23)},_=null,v=0,y=0;for(let[e,t]of[[240,52],[180,44],[136,40]]){let n=Gf(g,p,m,{width:e,height:t,padding:7});if(n){_=n,v=e,y=t;break}}if(!_)return qf(r,!1),i&&delete i.dataset.boundaryReturnBearing,{...o,visible:!1,panel:null,reason:`no-free-area`};let b=Xf(_,v,y),x=o.outside,S=Math.round(x?Math.max(0,-o.clearance):Math.max(0,o.clearance));Jf(`boundary-title`,s===`ja`?x?`内側へ戻る`:`嵐に接近`:x?`TURN BACK`:`STORM`),Jf(`boundary-detail`,s===`ja`?x?`外側 ${S}m`:`境界まで ${S}m`:x?`STORM · ${S}m OUT`:`TURN BACK · ${S}m`);let C=Kf(`boundary-return-arrow`);return C&&(C.style.transform=`rotate(${o.returnBearingDeg}deg)`),r.dataset.returnBearing=String(o.returnBearingDeg),r.dataset.compact=String(v<240),r.dataset.hudLanguage=s,r.setAttribute(`aria-label`,s===`ja`?`嵐の境界。${x?`内側へ戻ってください。`:`境界に接近しています。`}矢印の方向へ。`:`STORM. TURN BACK. ${S}m${x?` OUT`:``}.`),Object.assign(r.style,{left:`${b.left}px`,top:`${b.top}px`,width:`${v}px`,height:`${y}px`}),qf(r,!0),i&&(i.dataset.boundaryReturnBearing=String(o.returnBearingDeg)),{...o,visible:!0,panel:b}}var ep=Math.PI/180,tp=(e,t,n)=>Math.min(n,Math.max(t,e)),np=e=>e&&[e.x,e.y,e.z].every(Number.isFinite),rp=e=>((e+180)%360+360)%360-180,ip=e=>{if(!np(e))return null;let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));if(!t)return null;let n=e.x/t,r=e.y/t,i=e.z/t,a=Math.hypot(n,r,i);return{x:n/a,y:r/a,z:i/a}};function ap(e,t={}){if(!t||typeof t!=`object`)return null;let{spanDegrees:n=20,width:r=180}=t;if(!Number.isFinite(e)||!Number.isFinite(n)||n<=0||n>180||!Number.isFinite(r)||r<=0)return null;let i=rp(e),a=i===-180?180:i,o=Math.abs(a)<=n;return{inside:o,x:r/2+tp(a/n,-1,1)*r/2,side:o?null:a<0?`left`:`right`,angleDegrees:a}}function op(e,t,n,r=24){if(!np(e)||![t,n,r].every(Number.isFinite)||t<=0||n<=0||r<0||r>=Math.min(t,n)/2||!ip(e))return null;let i=e.z>0,a=e.x,o=i?e.z:-e.y,s=a,c=o,l=Math.max(Math.abs(s),Math.abs(c));if(!l)return null;s/=l,c/=l;let u=Math.min(s?(t/2-r)/Math.abs(s):1/0,c?(n/2-r)/Math.abs(c):1/0);return{x:tp(t/2+s*u,r,t-r),y:tp(n/2+c*u,r,n-r),rotation:(Math.atan2(s,-c)/ep+360)%360,behind:i}}function sp(e){if(e.orientation!=null){let t=e.orientation;if(![t.x,t.y,t.z,t.w].every(Number.isFinite))return null;let n=Math.max(Math.abs(t.x),Math.abs(t.y),Math.abs(t.z),Math.abs(t.w));if(!n)return null;let r=Math.hypot(t.x/n,t.y/n,t.z/n,t.w/n),i=t.x/n/r,a=t.y/n/r,o=t.z/n/r,s=t.w/n/r;return{x:-2*(i*o+s*a),y:2*(s*i-a*o),z:2*(i*i+a*a)-1}}let t=e.heading??0,n=e.pitch??0;return[t,n].every(Number.isFinite)?{x:Math.sin(t)*Math.cos(n),y:Math.sin(n),z:-Math.cos(t)*Math.cos(n)}:null}function cp(e,t={}){if(!t||typeof t!=`object`)return null;let{maxPitch:n=15,maxBank:r=40,turnGravity:i=e?.turnGravity??de.defaultGravity,turnState:a=null}=t;if(!e||!np(e.position)||!np(e.targetPosition)||![n,r,i].every(Number.isFinite)||n<=0||n>=90||r<=0||r>=90||e.velocity!=null&&!np(e.velocity)||[`bank`,`angleOfAttack`,`speed`,`throttle`].some(t=>e[t]!=null&&!Number.isFinite(e[t]))||a!=null&&(typeof a!=`object`||![`target`,`go-around`].includes(a.mode)||!Number.isFinite(a.yawDegrees)||a.climbDegrees!=null&&!Number.isFinite(a.climbDegrees)))return null;let o={x:e.targetPosition.x-e.position.x,y:e.targetPosition.y-e.position.y,z:e.targetPosition.z-e.position.z},s=ip(o);if(!s)return null;let c=Math.hypot(o.x,o.y,o.z),l=e.velocity?Math.hypot(e.velocity.x,e.velocity.y,e.velocity.z):e.speed??0;if(!Number.isFinite(l)||l<0||!Number.isFinite(c))return null;let u=sp(e),d=l>.05&&e.velocity?ip(e.velocity):u;if(!d)return null;let f=Math.hypot(d.x,d.z),p=f>1e-8?Math.atan2(d.x,-d.z):u?Math.atan2(u.x,-u.z):0,m=Math.atan2(d.y,f)/ep,h=rp(((Math.hypot(s.x,s.z)>1e-8?Math.atan2(s.x,-s.z):p)-p)/ep);Math.abs(h)>=175&&(h=(Math.abs(e.bank??0)>3*ep?Math.sign(e.bank):1)*Math.abs(h));let g=h<0?-1:1,_=_e(l,r*ep,i);if(!Number.isFinite(_))return null;let v=Math.hypot(o.x,o.z),y=Number.isFinite(e.targetRadius)&&e.targetRadius>0?e.targetRadius:0,b=.8*Math.sqrt(Math.max(0,y*y-o.y*o.y)),x=_*Math.sin(Math.abs(h)*ep),S=x*x-2*_*b+b*b,C=S>0?x+Math.sqrt(S):0,w=S>0?Math.max(0,x-Math.sqrt(S)):0,T=b>0&&v<=w+.1,E=!T&&v<C-.1,D=!T&&C>1e-6?v/C:null,O=E||Math.abs(h)>90?`go-around`:`target`,k=O===`go-around`?(E?-g:g)*15:tp(h,-15,15),A=a?.mode??O,j=a?tp(a.yawDegrees,-15,15):k,M=Math.min(Math.abs(e.bank??0),r*ep),N=Math.max(0,((10/Math.max(l,.01))**2/Math.cos(M)-1)/4.5)/ep,P=Math.min(N,17),F=e.throttle===0,I=Math.min(F?0:10,tp(n-P,-Math.min(10,n),10)),L=-Math.min(10,n),ee=(e.angleOfAttack??0)/ep,te=A===`go-around`?0:Math.atan2(o.y,Math.hypot(o.x,o.z))/ep,ne=F||N>=17||Math.abs(ee)>=17||I<0,re=ne||m<L||m>I;re&&(A=`recover`,ne&&(j=0,O=`recover`,k=0,te=Math.min(te,0,I)),ee>17&&(te=Math.min(te,m-Math.min(10,ee-17+2))),ee<-17&&(te=Math.max(te,m+Math.min(10,-ee-17+2)))),te=tp(te,L,I);let ie=tp(te-m,-10,10),ae=Math.max(0,17-ee),oe=Math.max(0,17+ee),se=m+(ie>0?Math.min(ie,ae):Math.max(ie,-oe));if(!re&&a?.climbDegrees!=null){let e=Math.max(L,m-10,m-oe),t=Math.min(I,m+10,m+ae);se=tp(a.climbDegrees,e,t)}let ce=p+j*ep,le=se*ep,ue={x:Math.sin(ce)*Math.cos(le),y:Math.sin(le),z:-Math.cos(ce)*Math.cos(le)},fe=Math.acos(tp(d.x*ue.x+d.y*ue.y+d.z*ue.z,-1,1))/ep;return{direction:ue,mode:A,rawMode:O,rawYawErrorDegrees:k,criticalRecovery:ne,aligned:l>.05&&fe<=2,yawErrorDegrees:j,climbErrorDegrees:se-m,angularErrorDegrees:fe,targetBearingDegrees:h,commandedYawDegrees:rp(ce/ep),commandedClimbDegrees:se,maxClimbDegrees:I,minClimbDegrees:L,trimDegrees:P,stallMarginDegrees:17-Math.abs(ee),insideTurnCircle:E,turnCircleRatio:D,turnRadius:_,distance:c}}var lp=(e,t,n)=>Math.min(n,Math.max(t,e));function up(e,t,{now:n=0,dt:r=0,targetChanged:i=!1}={}){let a=Number.isFinite(n)?n:0,o=e?.rawMode??e?.mode,s=lp(e?.rawYawErrorDegrees??e?.yawErrorDegrees??0,-15,15),c=s<0?-1:1,l=Number.isFinite(r)?lp(r,0,.05):0,u=e?.commandedClimbDegrees,d=t?.climbDegrees,f=Number.isFinite(u)?Number.isFinite(d)&&o!==`recover`?d+lp(u-d,-150*l,150*l):u:void 0;if(o===`recover`)return{mode:`recover`,yawDegrees:0,climbDegrees:f,turnSign:t?.turnSign??c,changedAt:a};if(!t)return{mode:o===`go-around`?`go-around`:`target`,yawDegrees:s,climbDegrees:f,turnSign:c,changedAt:a};let p=Number.isFinite(e?.turnCircleRatio)?e.turnCircleRatio:null,m=Number.isFinite(e?.targetBearingDegrees)?e.targetBearingDegrees:0,h=t.mode===`go-around`?`go-around`:`target`,g=t.changedAt,_=t.turnSign??c,v=a-g>=600;i||t.mode===`recover`?(h=o===`go-around`?`go-around`:`target`,g=a,_=c):h===`target`&&v&&(p!==null&&p<.9||Math.abs(m)>95)?(h=`go-around`,g=a,_=c):h===`go-around`&&v&&(p===null||p>1.1)&&Math.abs(m)<85&&(h=`target`,g=a);let y=h===`go-around`?_*15:lp(m,-15,15),b=Number.isFinite(t.yawDegrees)?t.yawDegrees:0,x=b+Math.sign(y-b)*Math.min(Math.abs(y-b),150*l);return{mode:h,yawDegrees:lp(x,-15,15),climbDegrees:f,turnSign:_,changedAt:g}}var dp=180/Math.PI,fp=[`flightDirector`,`targetHeadingCue`,`edgeGuidance`,`nextTargetNotice`,`audioGuidance`],pp=e=>document.getElementById(e),mp=(e,t)=>e?.toggleAttribute(`hidden`,!t),hp=(e,t)=>{let n=pp(e);n&&n.textContent!==t&&(n.textContent=t)},gp=(e,t,n)=>{e&&Object.assign(e.style,{left:`${t}px`,top:`${n}px`})},_p=(e,t,n,r=0)=>e?.setAttribute(`transform`,`translate(${t} ${n}) rotate(${r})`),vp=e=>e&&[e.x,e.y,e.z].every(Number.isFinite)?new q(e.x,e.y,e.z):null,yp=e=>({x:e.x,y:e.y,z:e.z}),bp=e=>((e+180)%360+360)%360-180,xp=e=>Number.isInteger(e)&&e>=3&&e<=8,Sp=(e,t)=>Number.isInteger(e)&&e>=0&&e<=t,Cp=e=>e&&!e.hasAttribute(`hidden`)&&e.getClientRects().length?e.getBoundingClientRect():null,wp=(e,t,n)=>({left:e.x-t/2,right:e.x+t/2,top:e.y-n/2,bottom:e.y+n/2}),Tp=(e,t)=>e.left<t.right&&e.right>t.left&&e.top<t.bottom&&e.bottom>t.top;function Ep(e,t,n){let r=0,i=1,a=t.x-e.x,o=t.y-e.y;for(let[t,s]of[[e.x+22-n.left,a+14],[n.right-e.x+22,14-a],[e.y+20-n.top,o+16],[n.bottom-e.y+20,16-o]]){if(Math.abs(s)<1e-9){if(t<=0)return!1}else s>0?r=Math.max(r,-t/s):i=Math.min(i,-t/s);if(r>=i-1e-9)return!1}return i>0&&r<1}var Dp=null;function Op(){Dp=null,mp(pp(`guidance-panel`),!1);let e=pp(`toast`);e&&(e.style.left=``,e.style.top=``,e.style.transform=``);let t=pp(`guidance-panel`);t&&(delete t.dataset.guidanceDirection,delete t.dataset.aligned,delete t.dataset.guidanceReady);let n=pp(`app`);n&&(delete n.dataset.guidanceEdge,delete n.dataset.guidanceDirector,delete n.dataset.guidanceDirection,delete n.dataset.guidanceAligned,delete n.dataset.guidanceReady)}function kp(e){let t=[`radar`,`flight-essential-speed`,`flight-essential-altitude`,`bottom-panel`,`practice-panel`,`cockpit-speed`,`cockpit-altitude`,`cockpit-vario`,`cockpit-heading`,`cockpit-target-height`,`cockpit-exit-notice`,`cockpit-power`,`target-edge-marker`,`cockpit-objective-label`];return e!==`cockpit`&&t.push(`toast`),[...t.map(e=>Cp(pp(e))),Cp(document.querySelector(`.navigation`)),...[`.topbar .brand`,`.topbar .version`,`.topbar .feedback-metrics`].map(e=>Cp(document.querySelector(e)))].filter(Boolean)}function Ap(e,t,n){return e?.inFront&&Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:e&&op(e.local,t,n,18)||{x:t/2,y:n/2}}function jp(e,t,n,r){if(!e)return null;let i=[e],a=Math.abs(e.x-18)<.01||Math.abs(e.x-(t-18))<.01,o=Math.abs(e.y-18)<.01||Math.abs(e.y-(n-18))<.01;for(let s of r){if(a)for(let t of[s.top-21,s.bottom+21])i.push({...e,y:Math.max(18,Math.min(n-18,t))});if(o)for(let n of[s.left-21,s.right+21])i.push({...e,x:Math.max(18,Math.min(t-18,n))})}return a&&i.push({...e,y:18},{...e,y:n-18}),o&&i.push({...e,x:18},{...e,x:t-18}),i.filter(e=>!r.some(t=>Tp(wp(e,42,42),t))).sort((t,n)=>Math.hypot(t.x-e.x,t.y-e.y)-Math.hypot(n.x-e.x,n.y-e.y))[0]??null}function Mp(e,t){let n=getComputedStyle(document.documentElement),r=Math.max(0,parseFloat(n.getPropertyValue(`--screen-safe-left`))||0),i=Math.max(0,parseFloat(n.getPropertyValue(`--screen-safe-right`))||0);return{left:r+12,right:e-i-12,top:12,bottom:t-12}}function Np(e,t,n=`en`){let r=Math.round(Math.abs(e)),i=Math.round(Math.abs(t));return n===`en`?`${[`↑`,`↗`,`→`,`↘`,`↓`,`↙`,`←`,`↖`][(Math.round(e/45)%8+8)%8]}${r?`${r}°`:``} · ${L(t,n,{digits:0})}`:`${r<1?`正面`:`${e<0?`左`:`右`}${r}°`}・${i<1?`同じ高さ`:`${t<0?`下`:`上`}${i}m`}`}function Pp(e,t,n,r,i,a){let o=pp(`guidance-heading`),s=pp(`guidance-heading-scale`),c=pp(`guidance-heading-pointer`),l=e===`cockpit`?Cp(pp(`cockpit-heading`)):null;if(e!==`cockpit`){let e=Cp(document.querySelector(`.navigation`)),t=Gf({x:innerWidth/2,y:(e?.bottom??54)+24},r,i,{width:180,height:28});t&&(l=wp(t,180,28))}if(!l)return mp(o,!1),null;let u=l.right-l.left,d=l.bottom-l.top,f=ap(t,{spanDegrees:10,width:Math.max(1,u-16)});if(!f)return mp(o,!1),null;mp(o,!0),mp(s,e!==`cockpit`),o.dataset.camera=e,gp(o,l.left,l.top),Object.assign(o.style,{width:`${u}px`,height:`${d}px`});let p=(Math.round(n)%360+360)%360;return hp(`guidance-heading-scale`,`${(p+350)%360} ┃ ${(p+355)%360} ┃ ${p}° ┃ ${(p+5)%360} ┃ ${(p+10)%360}`),hp(`guidance-heading-pointer`,f.inside?`▼`:`${f.side===`left`?`←`:`→`}${Math.round(Math.abs(f.angleDegrees))}°`),c.dataset.side=f.side??`inside`,c.style.left=`${8+f.x}px`,o.setAttribute(`aria-label`,`${F(a,`heading`)} ${Np(t,0,a).split(a===`ja`?`・`:` · `)[0]}`),l}function Fp(e,{phase:t=`running`,camera:n=`overlay`,settings:r={},now:i,dt:a}={}){let o=pp(`guidance-panel`),s=pp(`app`);if(!o||e?.mode!==`flight`||t!==`running`)return Op(),null;let c=e.total===void 0?3:e.total;if(!xp(c))return Op(),null;let l=typeof e.course?.id==`string`?e.course.id:e.courseId??``,u=innerWidth,d=innerHeight,f=Wf(e,u,d),p={maxPitch:r?.maxPitch??15,maxBank:r?.maxBank??40,turnGravity:r?.turnGravity??9.8},m=cp(e,p),h=f?.target();if(!f||!m||!h)return Op(),null;let g=Object.fromEntries(fp.map(e=>[e,r?.[e]!==!1])),_=P(r?.hudLanguage),v=Number.isFinite(i)?i:performance.now(),y=Dp?.total===c&&Dp?.courseId===l,b=Sp(e.collected,c)?e.collected:y?Dp.count:0,x=Dp&&b<Dp.count,S=!Dp||!y||x||Dp.camera!==n||Dp.width!==u||Dp.height!==d||Math.abs(Dp.rotation.dot(f.rotation))<Math.cos(Math.PI/8),C=Number.isFinite(a)&&a>=0?Math.min(a,.25):Math.max(0,Math.min(.25,(v-(Dp?.now??v))/1e3)),w=up(m,S?null:Dp.turn,{now:v,dt:C,targetChanged:!!(Dp&&b!==Dp.count)}),T=w.mode===`recover`?m:cp(e,{...p,turnState:{mode:w.mode,yawDegrees:w.yawDegrees,climbDegrees:w.climbDegrees}});if(!T)return Op(),null;let E=vp(T.direction),D=!S&&Dp.direction?Dp.direction.clone():null;if(D){let e=1-Math.exp(-C/.2),t=Math.atan2(D.x,-D.z)*dp,n=(t+bp(Math.atan2(E.x,-E.z)*dp-t)*e)/dp,r=Math.atan2(D.y,Math.hypot(D.x,D.z)),i=r+(Math.atan2(E.y,Math.hypot(E.x,E.z))-r)*e;E.set(Math.sin(n)*Math.cos(i),Math.sin(i),-Math.cos(n)*Math.cos(i))}(T.criticalRecovery||!Bf(E,T))&&(E=vp(Vf(E,T)??T.direction));let O=e.targetPosition.y-e.position.y,k=Math.atan2(e.targetPosition.x-e.position.x,-(e.targetPosition.z-e.position.z))*dp,A=Number.isFinite(e.heading)?e.heading:0,j=bp(k-A*dp);j===-180&&(j=180);let M=S?null:Dp.notice;Dp&&y&&!x&&b>Dp.count&&g.nextTargetNotice&&!e.complete&&(M={until:v+1800,bearing:j,height:O,target:{collected:b,total:c,targetLabel:e.targetLabel}}),(!g.nextTargetNotice||M?.until<=v)&&(M=null),Dp={count:b,total:c,courseId:l,camera:n,width:u,height:d,now:v,direction:E.clone(),rotation:f.rotation.clone(),notice:M,turn:w};let N=h.visible,L={...T,bearingDeg:j,travelBearingDeg:T.targetBearingDegrees,targetVisible:N,flags:g,direction:yp(E),rawDirection:{...T.direction},geometricDirection:{...m.direction},aligned:!1,driverReady:!1,director:null,directorReason:null,flightPath:null,flightPathReason:null,edge:null};if(e.complete)return mp(o,!1),delete o.dataset.guidanceDirection,delete o.dataset.aligned,delete o.dataset.guidanceReady,s&&(delete s.dataset.guidanceEdge,delete s.dataset.guidanceDirector,delete s.dataset.guidanceDirection,delete s.dataset.guidanceAligned,delete s.dataset.guidanceReady),L;mp(o,!(!g.flightDirector&&!g.targetHeadingCue&&!g.edgeGuidance&&!M)),o.dataset.camera=n,o.dataset.target=b===c?`exit`:`light`,o.dataset.hudLanguage=_,o.setAttribute(`aria-label`,_===`ja`?`次の目標への案内`:`Flight guidance`),hp(`guidance-path-caption`,F(_,`flightPath`)),s.dataset.guidanceEdge=g.edgeGuidance?`on`:`off`,s.dataset.guidanceDirector=g.flightDirector?`on`:`off`,pp(`guidance-symbols`).setAttribute(`viewBox`,`0 0 ${u} ${d}`);let ee=Mp(u,d),te=pp(`toast`);if(te&&g.flightDirector&&n!==`cockpit`){let t=Cp(te),r=Cp(pp(`bottom-panel`));if(t){let i=kp(n).filter(e=>e!==t&&(e.left!==t.left||e.top!==t.top));for(let t of[E,vp(e.velocity)]){let e=t&&f.projectDirection(t);e?.inFront&&i.push(wp(e,70,70))}let a=Gf({x:u/2,y:(r?.top??d)-t.height/2-12},ee,i,{width:t.width,height:t.height});a&&(te.style.transform=`translateX(-50%)`,te.style.left=`${a.x}px`,te.style.top=`${a.y-t.height/2}px`)}}else te&&(te.style.left=``,te.style.top=``,te.style.transform=``);let ne=kp(n),re=[...ne];for(let t of[E,vp(e.velocity)]){let e=t&&f.projectDirection(t);e?.inFront&&re.push(wp(e,76,76))}let ie=g.targetHeadingCue?Pp(n,j,A*dp,ee,re,_):null;g.targetHeadingCue||mp(pp(`guidance-heading`),!1),ie&&ne.push(ie);let ae=f.projectDirection(E),oe=Ap(ae,u,d),se=vp(e.velocity),ce=se&&se.length()>.05?f.projectDirection(se):null,le=ce?.inFront&&ce.x>=0&&ce.x<=u&&ce.y>=0&&ce.y<=d&&!ne.some(e=>Tp(wp(ce,44,40),e)),ue=g.flightDirector?Gf(oe,ee,ne,{width:62,height:62,accept:e=>Bf(f.rayFromPixel(e.x,e.y),T)&&(!le||!ne.some(t=>Ep(ce,e,t))),candidates:[...Hf(T),...D?[Vf(D,T)].filter(Boolean):[]].map(e=>f.projectDirection(e)).filter(e=>e?.inFront)}):null,de=pp(`guidance-director`);if(mp(de,g.flightDirector&&!!ue),ue){let t=f.rayFromPixel(ue.x,ue.y),n=vp(e.velocity),r=!!(n&&n.length()>.05&&n.normalize().dot(vp(t))>=Math.cos(2/dp)),i=!ae.inFront||Math.hypot(ae.x-ue.x,ae.y-ue.y)>.1;L.direction=t,L.aligned=r,L.director={...ue,clamped:i},L.driverReady=!0,_p(de,ue.x,ue.y),de.dataset.aligned=String(r),de.dataset.clamped=String(i)}else g.flightDirector&&(L.directorReason=F(_,`guidanceLevel`));let fe=vp(e.velocity),pe=fe&&fe.length()>.05,me=pe?f.projectDirection(fe.normalize()):null,he=me?.inFront&&me.x>=0&&me.x<=u&&me.y>=0&&me.y<=d,ge=he&&ne.some(e=>Tp(wp(me,44,40),e)),_e=g.flightDirector&&he&&!ge?{x:me.x,y:me.y}:null,ve=pp(`guidance-flight-path`);mp(ve,g.flightDirector&&!!_e),s.dataset.guidanceDirector=g.flightDirector?`on`:`off`,_e?(_p(ve,_e.x,_e.y),ve.dataset.clamped=`false`,ve.dataset.moving=`true`,L.flightPath={..._e,clamped:!1,moving:!0}):g.flightDirector&&(L.flightPathReason=F(_,pe?he?`flightPathCovered`:`flightPathOut`:`flightPathWaiting`)),_e||(L.driverReady=!1,L.aligned=!1,L.director=null,ue=null,L.direction=yp(E),mp(de,!1)),mp(pp(`guidance-path-caption`),!1);let ye=JSON.stringify(L.direction);o.dataset.guidanceReady=String(L.driverReady),s.dataset.guidanceReady=String(L.driverReady),L.driverReady?(Dp.direction=vp(L.direction),o.dataset.guidanceDirection=ye,o.dataset.aligned=String(L.aligned),s.dataset.guidanceDirection=ye,s.dataset.guidanceAligned=String(L.aligned)):(delete o.dataset.guidanceDirection,delete o.dataset.aligned,delete s.dataset.guidanceDirection,delete s.dataset.guidanceAligned),mp(pp(`guidance-target-point`),g.edgeGuidance&&N),_p(pp(`guidance-target-point`),h.x??0,h.y??0),mp(pp(`guidance-target-diamond`),b!==c),mp(pp(`guidance-exit-gate`),b===c);let R=jp(g.edgeGuidance&&!h.inViewport?op(h.local,u,d,18):null,u,d,[...ne,...ue?[wp(ue,68,68)]:[],..._e?[wp(_e,50,50)]:[]]),z=pp(`guidance-edge-arrow`);if(mp(z,!!R),mp(pp(`guidance-edge-label`),!1),R){L.edge={...R},_p(z,R.x,R.y,R.rotation),z.dataset.x=String(R.x),z.dataset.y=String(R.y),z.dataset.behind=String(R.behind);let t=pp(`guidance-edge-label`),n=Math.min(126,u-48),r=Gf({x:R.x<u/3?R.x+n/2+22:R.x>u*2/3?R.x-n/2-22:R.x,y:R.y<d/3?R.y+22+22:R.y>d*2/3?R.y-22-22:R.y},ee,[...ne,...ue?[wp(ue,68,68)]:[],..._e?[wp(_e,50,50)]:[]],{width:n,height:44});r&&(mp(t,!0),gp(t,r.x-n/2,r.y-22),t.style.width=`${n}px`,hp(`guidance-edge-title`,`${I(e,_)}${_===`ja`&&R.behind?`・後ろ`:``}`),hp(`guidance-edge-detail`,`${Math.round(T.distance)}m　${Np(j,O,_)}`),L.edge.label={x:r.x-n/2,y:r.y-22,width:n,height:44})}let be=pp(`guidance-next-notice`);if(mp(be,!1),M){let e=Cp(document.querySelector(`.navigation`)),t=L.edge?.label,n=[...ne,...ue?[wp(ue,68,68)]:[],..._e?[wp(_e,50,50)]:[],...t?[{left:t.x,right:t.x+t.width,top:t.y,bottom:t.y+t.height}]:[]],r=null,i=0,a=0,o=!1;for(let t of[{width:Math.min(290,u-40),height:62,compact:!1},{width:Math.min(220,u-40),height:48,compact:!0}])if(r=Gf({x:u/2,y:(e?.bottom??50)+42},ee,n,t),r){i=t.width,a=t.height,o=t.compact;break}if(r){mp(be,!0),gp(be,r.x-i/2,r.y-a/2),be.style.width=`${i}px`,be.style.height=`${a}px`,be.dataset.compact=String(o);let e=I(M.target,_),t=_===`ja`?`${F(_,`nextTarget`)} ${Np(M.bearing,M.height,_)}`:Np(M.bearing,M.height,_);hp(`guidance-notice-target`,_===`ja`?e:`${F(_,`nextTarget`)} ${e}`),hp(`guidance-notice-text`,t),L.notice={message:t,until:M.until,x:r.x-i/2,y:r.y-a/2}}}let xe=pp(`guidance-status`);if(mp(xe,!!(L.directorReason||L.flightPathReason)),L.directorReason||L.flightPathReason){hp(`guidance-director-reason`,L.directorReason??``),hp(`guidance-path-reason`,L.flightPathReason??``);let e=Math.min(290,u-40),t=L.directorReason&&L.flightPathReason?46:28,n=Cp(document.querySelector(`.navigation`)),r={x:u/2,y:(n?.bottom??50)+t/2+12},i=Gf(r,ee,ne,{width:e,height:t})??r;gp(xe,i.x-e/2,Math.max(12,Math.min(d-t-12,i.y-t/2))),xe&&Object.assign(xe.style,{width:`${e}px`,minHeight:`${t}px`})}return o.dataset.mode=T.mode,o.dataset.targetVisible=String(N),L}var Ip=`twist.flight-settings.v1`,Lp=Object.freeze({deadzone:{label:`機首の中立範囲`,min:0,max:8,step:1,initial:3,unit:`°`},maxTilt:{label:`機首が最大になるスマホの傾き`,min:10,max:30,step:1,initial:25,unit:`°`},maxPitch:{label:`機首の最大角度`,min:5,max:35,step:1,initial:15,unit:`°`},timeConstant:{label:`機首が追いつく時間の目安`,min:.1,max:1,step:.1,initial:.3,unit:`秒`},steerTiltDeadzone:{label:`旋回の中立範囲（ひねる）`,min:0,max:8,step:1,initial:3,unit:`°`},maxSteerTilt:{label:`旋回が最大になるひねり`,min:5,max:30,step:1,initial:15,unit:`°`},steerTwistDeadzone:{label:`旋回の中立範囲（回す）`,min:0,max:8,step:1,initial:5,unit:`°`},maxSteerTwist:{label:`旋回が最大になる回し`,min:8,max:40,step:1,initial:20,unit:`°`},steerCurve:{label:`旋回の効き方のカーブ`,min:1,max:2,step:.1,initial:1,unit:``},maxBank:{label:`翼の最大角度`,min:5,max:40,step:1,initial:40,unit:`°`},turnGravity:{label:`旋回の強さ`,min:3,max:15,step:.1,initial:9.8,unit:``},displayTimeConstant:{label:`固定表示の回転のならし`,min:0,max:.3,step:.01,initial:.05,unit:`秒`},chaseTimeConstant:{label:`追尾カメラの遅れ`,min:0,max:.5,step:.01,initial:.15,unit:`秒`},ladderRange:{label:`操縦席の角度線の範囲（機首から前後）`,min:5,max:30,step:5,initial:10,unit:`°`},cockpitFov:{label:`操縦席の上下の視野`,min:60,max:100,step:.1,initial:0,auto:!0,unit:`°`},radarRange:{label:`レーダーの半径`,min:20,max:500,step:10,initial:180,unit:`m`},streakAmount:{label:`空気の流線の量`,min:0,max:2,step:.1,initial:1,unit:``},groundPatternStrength:{label:`地面の模様の濃さ`,min:0,max:1,step:.1,initial:.8,unit:``},speedFov:{label:`速度による視野の広がり`,min:0,max:15,step:1,initial:10,unit:`°`},highSpeedShake:{label:`高速時の小さな揺れ`,initial:!0},speedUnit:{label:`速度の単位`,initial:`km/h`,options:{"m/s":`m/s`,"km/h":`km/h`,kt:`kt（ノット）`},unit:``},autoAfterburner:{label:`大きな機首下げ入力でAB`,initial:!1},autoAfterburnerAngle:{label:`自動ABの機首下げ入力`,min:25,max:60,step:1,initial:35,unit:`°`},targetHeightGuide:{label:`目標高度の目印`,initial:!0},flightDirector:{label:`目標へ向かう輪`,initial:!0},targetHeadingCue:{label:`方位目盛りの目標の印`,initial:!0},edgeGuidance:{label:`画面の縁の目標案内`,initial:!0},nextTargetNotice:{label:`次の目標の合図`,initial:!0},audioGuidance:{label:`左右から聞こえる案内音`,initial:!0},hudLanguage:{label:`HUDの表記`,initial:`en`,options:{en:`英語`,ja:`日本語`},unit:``}}),Rp=Object.freeze(Object.fromEntries(Object.entries(Lp).map(([e,t])=>[e,t.initial])));function zp(e){let t=Object.fromEntries(Object.entries(Lp).map(([t,n])=>{let r=e?.[t];return[t,n.options?typeof r==`string`&&Object.hasOwn(n.options,r)?r:n.initial:typeof n.initial==`boolean`?typeof r==`boolean`?r:n.initial:n.auto&&r===0?0:Number.isFinite(r)?Math.max(n.min,Math.min(n.max,r)):n.initial]}));return t.steerTiltDeadzone=Math.min(t.steerTiltDeadzone,t.maxSteerTilt-1),t.steerTwistDeadzone=Math.min(t.steerTwistDeadzone,t.maxSteerTwist-1),t}function Bp(e,t){return zp(Object.hasOwn(Lp,t)?{...e,[t]:Lp[t].initial}:e)}function Vp(e){try{return zp(JSON.parse(e.getItem(Ip)))}catch{return{...Rp}}}function Hp(e,t){try{return e.setItem(Ip,JSON.stringify(zp(t))),!0}catch{return!1}}var Up=Object.freeze({tiltDeadzone:3,tiltMaximum:25,twistDeadzone:5,twistMaximum:32,throttleMaximum:12,pitchRate:.65,yawRate:.8,speed:10,acceleration:3.5,brake:6.5,flightBankAngle:W.degToRad(40)}),Wp=new q(0,0,1),Gp=1e-12,Kp=()=>({pitch:0,steer:0,twist:0});function qp(e){if(!e||![e.x,e.y,e.z,e.w].every(Number.isFinite))return null;let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z),Math.abs(e.w));return t===0?null:new K(e.x/t,e.y/t,e.z/t,e.w/t).normalize()}function Jp(e,t=0){return!e||![e.alpha,e.beta,e.gamma,t].every(Number.isFinite)?null:new K().setFromEuler(new Dr(W.degToRad(e.beta),W.degToRad(e.gamma),W.degToRad(e.alpha),`ZXY`)).multiply(new K().setFromAxisAngle(Wp,-W.degToRad(t))).normalize()}function Yp(e,t){let n=qp(e),r=qp(t);if(!n||!r)return Kp();let i=n.invert().multiply(r).normalize();i.w<0&&i.set(-i.x,-i.y,-i.z,-i.w);let a=Math.hypot(i.z,i.w);if(a<Gp)return Kp();let o=new K(0,0,i.z/a,i.w/a),s=i.clone().multiply(o.clone().invert()).normalize(),c=Math.hypot(s.x,s.y),l=c>Gp?2*Math.atan2(c,Math.max(0,s.w))/c:0;return{pitch:W.radToDeg(s.x*l),steer:W.radToDeg(s.y*l),twist:-W.radToDeg(2*Math.atan2(o.z,o.w))}}function Xp(e,t){let n=qp(e),r=qp(t);return!n||!r?new K:r.invert().multiply(n).normalize()}function Zp(e,t,n=0){let r=qp(e),i=qp(t),a=()=>({pitch:0,steer:0,twist:0,valid:!1});if(!r||!i||!Number.isFinite(n))return a();let o=i.clone().invert().multiply(r).normalize(),s=new q(0,0,1).applyQuaternion(o).applyAxisAngle(Wp,W.degToRad(n));return s.z<=.08?a():{pitch:W.radToDeg(Math.atan2(s.y,s.z)),steer:-W.radToDeg(Math.atan2(s.x,s.z)),twist:Yp(r,i).twist,valid:!0}}function Qp(e,t){return t?.valid!==!1&&[`pitch`,`steer`,`twist`].every(e=>Number.isFinite(t?.[e]))?{...t,held:!1}:{pitch:Number.isFinite(e?.pitch)?e.pitch:0,steer:Number.isFinite(e?.steer)?e.steer:0,twist:Number.isFinite(e?.twist)?e.twist:0,valid:!0,held:!0}}function $p(e,t=e){let n=qp(e),r=qp(t),i=()=>({pitch:0,steer:0,valid:!1});if(!n||!r)return i();let a=new q(0,1,0).applyQuaternion(n),o=Math.hypot(a.x,a.y),s=new q(0,0,1).applyQuaternion(r);if(o<1e-4||s.z<=.08)return i();a.set(a.x/o,a.y/o,0);let c=new q(a.y,-a.x,0);return{pitch:W.radToDeg(Math.atan2(s.dot(a),s.z)),steer:-W.radToDeg(Math.atan2(s.dot(c),s.z)),valid:!0}}function em(e){let t=Number.isFinite(e?.pitch)?W.degToRad(e.pitch):0,n=Number.isFinite(e?.steer)?W.degToRad(e.steer):0,r=Number.isFinite(e?.twist)?W.degToRad(e.twist):0,i=Math.hypot(t,n),a=i>0?new K().setFromAxisAngle(new q(t/i,n/i,0),i):new K;return new K().setFromAxisAngle(Wp,-r).multiply(a).normalize()}function tm(e,t,n,r){if(!Number.isFinite(e))return 0;let i=W.clamp((Math.abs(e)-n)/(r-n)*t,0,1);return Math.sign(e)*i}function nm(e){return Number.isFinite(e)?W.radToDeg(Math.asin(Math.sin(W.degToRad(e)))):0}function rm(e,t=1){let n=Number.isFinite(t)?Math.max(0,t):1,r=tm(e?.pitch,n,Up.tiltDeadzone,Up.throttleMaximum);return{pitchRate:tm(nm(e?.twist),n,Up.twistDeadzone,Up.twistMaximum)*Up.pitchRate,yawRate:tm(e?.steer,n,Up.tiltDeadzone,Up.tiltMaximum)*Up.yawRate,acceleration:Math.max(0,-r)*Up.acceleration,brake:Math.max(0,r)*Up.brake}}function im(e,t=1,n=`tilt`,r){let i=zp(r),a=Number.isFinite(t)?Math.max(0,t):1,o=i.deadzone,s=i.maxTilt,c=n===`twist`?tm(nm(e?.twist),a,i.steerTwistDeadzone,i.maxSteerTwist):tm(e?.steer,a,i.steerTiltDeadzone,i.maxSteerTilt),l=Math.sign(c)*Math.abs(c)**i.steerCurve;return{pitchRate:tm(e?.pitch,a,o,s)*Up.pitchRate,bankAngle:l*i.maxBank*Math.PI/180,acceleration:0,brake:0}}function am(e,t){return Number.isFinite(e)?W.clamp(e,0,t):0}function om(e,t,n){let r=am(e,Up.speed),i=Number.isFinite(t)?Math.max(0,t):0,a=am(n?.acceleration,Up.acceleration),o=am(n?.brake,Up.brake);return W.clamp(r+(a-o)*i,0,Up.speed)}var sm=Math.PI/180,cm=(e,t,n)=>Math.min(n,Math.max(t,e)),lm=e=>Number.isFinite(e)&&e>0?e:0,um=e=>e===!0||e?.active===!0,dm=e=>e*e*(3-2*e),fm=e=>Number.isFinite(e)?Math.max(0,e)%3600:0;function pm(e,t={},n={active:!1},r=0,i=`overlay`){let a=lm(e),o=um(n)&&a>0,s=Number.isFinite(t?.speedFov)?cm(t.speedFov,0,15):10,c=s*dm(cm((a-10)/20,0,1))+(o?3*s/10:0),l={x:0,y:0,z:0};if(t?.highSpeedShake!==!1){let e=cm((a-18)/27*(o?1.15:1),0,1),t=(i===`cockpit`?.035:.12)*sm*e,n=fm(r);t>0&&(l.x=t*(.65*Math.sin(n*17.3)+.35*Math.sin(n*29.7+.4)),l.y=t*(.6*Math.sin(n*19.1+1.2)+.4*Math.sin(n*31.3+.2)),l.z=t*.45*(.7*Math.sin(n*23.7+.8)+.3*Math.sin(n*37.1)))}return{extraFov:c,shake:l}}var mm=80,hm=.72,gm=2;function _m(){let e=new Gr;e.name=`camera-speed-streaks`,e.visible=!1,e.userData.collisions=!1;let t=new Float32Array(480),n=new Float32Array(480),r=new Float32Array(160),i=new Float32Array(mm);for(let e=0;e<mm;e++){let t=e*2.399963229728653+.31,n=Math.cos(t),a=Math.sin(t),o=Math.max(Math.abs(n),Math.abs(a));r[e*2]=n/o,r[e*2+1]=a/o,i[e]=e*.6180339887498949%1}let a=new Yi;a.setAttribute(`position`,new Pi(t,3).setUsage(cn)),a.setAttribute(`color`,new Pi(n,3).setUsage(cn)),a.setDrawRange(0,0);let o=new io({color:13496063,vertexColors:!0,transparent:!0,opacity:.3,depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1,blending:2}),s=new _o(a,o);s.name=`peripheral-speed-lines`,s.frustumCulled=!1,s.renderOrder=8,e.add(s);let c=!1,l=0,u=!1,d=1,f=0,p=0,m=64,h=1;function g(s={}){l=lm(s?.speed),u=um(s?.afterburner)&&l>0,d=Number.isFinite(s?.amount)?cm(s.amount,0,2):1,m=Number.isFinite(s?.verticalFov)?cm(s.verticalFov,20,115):64,h=Number.isFinite(s?.aspect)&&s.aspect>0?cm(s.aspect,.1,10):1;let g=cm((l-4)/26,0,1.6);if(f=s?.visible===!1?0:Math.min(mm,Math.floor(48*g*d*(u?1.35:1))),c=f>0,e.visible=c,a.setDrawRange(0,f*2),p=c?(.014+cm(l/45,0,1.5)*.1)*(u?1.35:1):0,!c)return;let _=fm(s?.timeSeconds),v=.65+Math.min(l,90)*.045,y=Math.tan(m*sm/2)*gm,b=y*h;o.opacity=u?.42:.3;for(let e=0;e<f;e++){let a=(i[e]+_*v)%1,o=hm+a*.31,s=o+p,c=r[e*2],l=r[e*2+1],u=e*6;t[u]=c*o*b,t[u+1]=l*o*y,t[u+2]=-2,t[u+3]=c*s*b,t[u+4]=l*s*y,t[u+5]=-2;let d=Math.sin(Math.PI*a),f=.07*d,m=.8*d;n[u]=f,n[u+1]=f,n[u+2]=f,n[u+3]=m,n[u+4]=m,n[u+5]=m}a.attributes.position.needsUpdate=!0,a.attributes.color.needsUpdate=!0}return{group:e,update:g,snapshot:()=>({visible:c,speed:l,afterburner:u,amount:d,lineCount:f,capacity:mm,lineLength:p,centralClear:hm,verticalFov:m,aspect:h})}}var vm=Math.PI/180,ym=e=>[`classic`,`legacy`].includes(e)?`classic`:`assisted`,bm=180/Math.PI,xm=(e,t,n)=>Math.min(n,Math.max(t,e)),Sm=e=>Number.isFinite(e)&&e>0,Cm=e=>e&&[e.left,e.top,e.right,e.bottom].every(Number.isFinite)&&e.left<e.right&&e.top<e.bottom,wm=(e,t,n)=>t>=e.left&&t<=e.right&&n>=e.top&&n<=e.bottom,Tm=()=>({visible:!1,x:0,y:0,rotation:0,behind:!1,inView:!1});function Em(e,t,n=`assisted`){let r=Sm(e)&&Sm(t),i=r?e:1,a=r?t:1,o=2*Math.atan(Math.tan(22.5*vm)*a/i)*bm,s=ym(n)===`classic`?64:xm(o,64,100);return{vertical:s,horizontal:2*Math.atan(Math.tan(s*vm/2)*i/a)*bm}}function Dm(e,t,n,r,i){let a=-1/0,o=1/0;for(let[s,c,l,u]of[[e,n,i.left,i.right],[t,r,i.top,i.bottom]]){if(c===0){if(s<l||s>u)return null;continue}let e=(l-s)/c,t=(u-s)/c;a=Math.max(a,Math.min(e,t)),o=Math.min(o,Math.max(e,t))}if(o<Math.max(a,0))return null;let s=wm(i,e,t)?o:Math.max(0,a);if(!Number.isFinite(s))return null;let c=e+n*s,l=t+r*s;return!Number.isFinite(c)||!Number.isFinite(l)?null:{x:xm(c,i.left,i.right),y:xm(l,i.top,i.bottom)}}function Om(e,t,n,r,i){let a=Math.max(Math.abs(i.left-e),Math.abs(i.right-e),Math.abs(i.top-t),Math.abs(i.bottom-t),1),o=xm(e+n*a,i.left,i.right),s=xm(t+r*a,i.top,i.bottom),c=[{x:i.left,y:s},{x:i.right,y:s},{x:o,y:i.top},{x:o,y:i.bottom}];return c.sort((e,t)=>Math.hypot(e.x-o,e.y-s)-Math.hypot(t.x-o,t.y-s)),c[0]}function km(e){let{target:t,width:n,height:r,verticalFov:i,bounds:a,avoid:o}=e??{};if(!t||![t.x,t.y,t.z].every(Number.isFinite)||!Sm(n)||!Sm(r)||!Number.isFinite(i)||i<=0||i>=180||!Cm(a))return Tm();let s=Math.max(Math.abs(t.x),Math.abs(t.y),Math.abs(t.z));if(s===0)return Tm();let c=t.x/s,l=t.y/s,u=t.z/s,d=n/2,f=r/2,p=t.z>=0,m,h;if(p){let e=Math.atan2(c,-u);Math.abs(e)>=175*vm&&(e=Math.PI),m=e,h=-Math.atan2(l,Math.hypot(c,u))}else{let e=r/2/Math.tan(i*vm/2),t=c===0?d:d+c/-u*e,n=l===0?f:f-l/-u*e;if(Number.isFinite(t)&&Number.isFinite(n)&&wm(a,t,n))return{visible:!1,x:t,y:n,rotation:0,behind:!1,inView:!0};m=c,h=-l}let g=Math.max(Math.abs(m),Math.abs(h));g>0?(m/=g,h/=g):(m=0,h=-1);let _=(Math.atan2(m,-h)*bm+360)%360,v=Dm(d,f,m,h,a)??Om(d,f,m,h,a);if(!Number.isFinite(v.x)||!Number.isFinite(v.y))return{...Tm(),behind:p};if(Cm(o)&&wm(o,v.x,v.y)){let e=[{x:a.left,y:a.top},{x:a.right,y:a.top},{x:a.left,y:a.bottom},{x:a.right,y:a.bottom}].filter(e=>!wm(o,e.x,e.y));if(e.length===0)return{...Tm(),behind:p};e.sort((e,t)=>Math.hypot(e.x-v.x,e.y-v.y)-Math.hypot(t.x-v.x,t.y-v.y)),v=e[0]}return{visible:!0,x:v.x,y:v.y,rotation:_,behind:p,inView:!1}}var Am=W.clamp,jm=(e,t,n)=>W.smoothstep(e,t,n),Mm=(e,t=0)=>Number.isFinite(e)?e:t,Nm=new q(0,1,0),Pm=new q(1,0,0),Fm=new q(0,0,1);function Im({orientation:e,altitude:t,velocity:n,bank:r}={}){let i=new K;if(e&&[e.x,e.y,e.z,e.w].every(Number.isFinite)){let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z),Math.abs(e.w));t>0&&i.set(e.x/t,e.y/t,e.z/t,e.w/t).normalize()}let a=Math.max(0,Mm(t)),o=new q(Mm(n?.x),Mm(n?.y),Mm(n?.z)),s=1-jm(a,5,12),c=jm(-o.y,.1,.8),l=Math.max(s,c),u=i.clone().multiply(new K().setFromAxisAngle(Fm,Mm(r))),d=new q(1,0,0).applyQuaternion(u),f=Math.atan2(d.z,d.x),p=Math.atan2(o.x,-o.z),m=f+Math.atan2(Math.sin(p-f),Math.cos(p-f))*jm(Math.hypot(o.x,o.z),.1,1),h=-W.degToRad(W.lerp(12,18,1-Am(a/5,0,1))),g=Math.atan2(o.y,Math.hypot(o.x,o.z)),_=Math.min(h,Am(g,-W.degToRad(35),-W.degToRad(10))),v=c>0?W.lerp(_,h,s):h,y=new K().setFromAxisAngle(Nm,-m).multiply(new K().setFromAxisAngle(Pm,v)).multiply(new K().setFromAxisAngle(Fm,-Am(Mm(r),-Math.PI/12,Math.PI/12))),b=i.clone().slerp(y,l).normalize(),x=new q(0,0,-1).applyQuaternion(b);return{orientation:b,assistance:l,pitch:Math.atan2(x.y,Math.hypot(x.x,x.z)),offset:new q(-Math.sin(m)*6,1.8,Math.cos(m)*6).multiplyScalar(l)}}function Lm(e,t,n){if(!e)return{...t,orientation:t.orientation.clone(),offset:t.offset.clone()};let r=Math.max(0,Mm(n)),i=e.orientation.clone().rotateTowards(t.orientation,Math.PI/6*r),a=e.offset.clone(),o=a.distanceTo(t.offset);o>0&&a.lerp(t.offset,Math.min(1,3*r/o));let s=new q(0,0,-1).applyQuaternion(i);return{...t,orientation:i,offset:a,pitch:Math.atan2(s.y,Math.hypot(s.x,s.z))}}var Rm=new q(0,0,1),zm=new q(1,0,0),Bm=new q(0,1,0),Vm=(e,t=0)=>Number.isFinite(e)?e:t,Hm=e=>Math.atan2(Math.sin(Vm(e)),Math.cos(Vm(e)));function Um(e,t,n,r=.05){let i=Hm(e),a=Hm(t),o=Math.max(0,Math.min(.3,Vm(r,.05)));return o===0?a:!Number.isFinite(n)||n<=0?i:Hm(i+Hm(a-i)*-Math.expm1(-n/o))}function Wm({display:e=`bank`,bank:t,phoneRoll:n,screenOffset:r}={}){let i=e===`fixed`,a=i?Hm(Vm(n)+Vm(r)):0;return{roll:a,camera:new K().setFromAxisAngle(Rm,-a),craft:new K().setFromAxisAngle(Rm,i?0:-Vm(t)),worldBank:new K().setFromAxisAngle(Rm,i?Vm(t):0)}}function Gm(e={}){let t=e?.orientation,n=t&&[t.x,t.y,t.z,t.w].every(Number.isFinite)?new K(t.x,t.y,t.z,t.w):new K,r=Math.max(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z),Math.abs(n.w));r>0?n.set(n.x/r,n.y/r,n.z/r,n.w/r).normalize():n.identity();let i=zm.clone().applyQuaternion(n),a=new q(0,0,-1).applyQuaternion(n),o=Math.hypot(a.x,a.z),s=o>1e-9?Math.atan2(a.x,-a.z):Math.atan2(i.z,i.x),c=o;o>1e-9&&i.x*Math.cos(s)+i.z*Math.sin(s)<0&&(s=Hm(s+Math.PI),c=-o);let l=Math.atan2(a.y,c);return{...e,pitch:l,orientation:new K().setFromAxisAngle(Bm,-s).multiply(new K().setFromAxisAngle(zm,l))}}var Km=e=>[`chase`,`cockpit`].includes(e)?e:`overlay`,qm=e=>Math.atan2(Math.sin(e),Math.cos(e)),Jm=(e,t=0)=>Number.isFinite(e)?e:t;function Ym(e,t,n,r=.15){let i={heading:Jm(t?.heading),pitch:Jm(t?.pitch)};if(!e)return i;let a=W.clamp(Jm(r,.15),0,.5),o=a===0?1:-Math.expm1(-Math.max(0,Jm(n))/a);return Object.fromEntries([`heading`,`pitch`].map(t=>[t,qm(e[t]+qm(i[t]-e[t])*o)]))}function Xm(e){let t=new q(1,0,0).applyQuaternion(e);return{heading:Math.atan2(t.z,t.x),pitch:Math.atan2(2*(e.w*e.x-e.y*e.z),1-2*(e.x**2+e.z**2))}}function Zm(e,t,n=0){let r=new K().setFromAxisAngle(new q(0,1,0),-e.heading).multiply(new K().setFromAxisAngle(new q(1,0,0),e.pitch)),i=new q(0,9+2*n,25).applyQuaternion(r);i.y=Math.max(i.y,1.2-t);let a=new q(0,1,0).applyQuaternion(r),o=new K().setFromRotationMatrix(new _r().lookAt(i,new q,a)),s=new q(0,0,-1).applyQuaternion(o);return{orientation:o,offset:i,assistance:n,pitch:Math.atan2(s.y,Math.hypot(s.x,s.z))}}function Qm(){let e=new Gr;e.name=`original-twin-jet`;let t=new yc({color:15001833,roughness:.55,metalness:.2}),n=new yc({color:2506064,roughness:.65,metalness:.3}),r=new yc({color:3168361,roughness:.2,metalness:.55}),i=new yc({color:1056555,roughness:.6,metalness:.6}),a=new Da({color:9692671,transparent:!0,opacity:.8,depthWrite:!1}),o=(t,n,r,i,a,o=1,s=1,c=1)=>{let l=new za(t,n);return l.position.set(r,i,a),l.scale.set(o,s,c),e.add(l),l};o(new sc(1,12,8),t,0,0,-.15,.38,.3,2.05);let s=o(new No(.26,1.5,12),n,0,-.015,-2.15);s.rotation.x=-Math.PI/2,o(new sc(1,12,8),r,0,.31,-1.05,.23,.23,.66);function c(t,n,r=0){let i=new ec(new gs(t.map(([e,t])=>new G(e,-t))),{depth:.075,bevelEnabled:!1});i.rotateX(-Math.PI/2),i.translate(0,r,0),e.add(new za(i,n))}for(let e of[-1,1]){c([[e*.2,-1.8],[e*.65,-.75],[e*.82,.65],[e*.25,.8]],t,.02),c([[e*.35,-.7],[e*2.05,.85],[e*1.9,1.3],[e*.45,.9]],t),c([[e*.35,1.15],[e*1.25,1.85],[e*1.05,2.1],[e*.32,1.85]],n,.1);let r=o(new Mo(.29,.32,2.6,12),t,e*.42,-.16,.62);r.rotation.x=Math.PI/2;let a=o(new Mo(.24,.29,.38,12,1,!0),i,e*.42,-.16,2.05);a.rotation.x=Math.PI/2;let s=o(new ec(new gs([new G(-.75,0),new G(-1.3,.95),new G(-1.7,1.1),new G(-2.05,.05)]),{depth:.07,bevelEnabled:!1}),n,e*.43,.05,0);s.rotation.y=Math.PI/2,s.rotateX(e*.18)}let l=[-1,1].map(e=>{let t=o(new No(.2,1,10),a,e*.42,-.16,2.25);return t.rotation.x=Math.PI/2,t}),u=0,d=!1;function f(e,t=!1){u=W.clamp(Number.isFinite(e)?e:0,0,1),d=t===!0&&u>0,a.opacity=d?.82+.18*u:.3+.65*u,a.color.setHex(d?16773296:9692671),l.forEach(e=>{e.visible=u>0,e.scale.set(d?1.55:1,(.15+1.35*u)*(d?2.1:1),d?1.55:1),e.position.z=2.2+e.scale.y/2})}return f(0),{group:e,setPower:f,diagnostics:()=>({engines:2,power:u,exhaustVisible:u>0,exhaustLength:u>0?(.15+1.35*u)*(d?2.1:1):0,exhaustOpacity:u>0?a.opacity:0,afterburner:d})}}function $m({halfExtent:e=350,avoidPoints:t=[],coursePoints:n=[],abStraights:r=[]}={}){let i=Number.isFinite(e)&&e>0?e:350,a=Math.max(1,i/110),o=Array.isArray(t)?t.filter(e=>Number.isFinite(e?.x)&&Number.isFinite(e?.z)):[],s=(e,t,n)=>{for(let r=0;r<o.length;r++)if(Math.hypot(e-o[r].x,t-o[r].z)<n)return!1;return!0},c=2605325,l=()=>(c=Math.imul(c,1664525)+1013904223>>>0,c/4294967296),u=new Gr;u.name=`assisted-scenery`,u.userData.collisions=!1;let d=[],f=(e,t,n,r,i)=>d.push(Object.freeze({id:e,position:Object.freeze({x:t,y:n,z:r}),radius:i})),p=new _r,m=new K,h=new q,g=new q,_=(e,t,n,r)=>{let i=new Za(e,t,n.length);return i.name=r??`scenery-batch`,i.userData.collisions=!1,n.forEach((e,t)=>{h.fromArray(e.p),g.fromArray(e.s),m.setFromAxisAngle(new q(0,1,0),e.turn||0),p.compose(h,m,g),i.setMatrixAt(t,p)}),i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),u.add(i),i},v=new Da({color:9876671,fog:!1}),y=new Da({color:11782606,fog:!1}),b=new Da({color:8559773,fog:!1}),x=[],S=[],C=[];for(let e=0;e<12;e++){let t=e*Math.PI/6,n=560+e%3*85,r=Math.sin(t)*n,i=-Math.cos(t)*n,a=32+e%4*23;x.push({p:[r,a,i],s:[64+e%3*12,35+e%4*9,50+e%2*22],turn:t});let o=2+e%4;for(let e=0;e<o;e++){let n=(e-(o-1)/2)*18;S.push({p:[r+Math.cos(t)*n,a+28+e%2*10,i-Math.sin(t)*n],s:[7,45+e%3*18,7],turn:t})}e%3==0&&C.push({p:[r,a+44,i],s:[44,6,10],turn:t})}let w=new No(1,1,5);w.rotateZ(Math.PI),_(w,v,x,`far-floating-islands`),_(new Ao(1,1,1),y,S,`far-island-ruins`),_(new Ao(1,1,1),y,C,`far-island-arches`);let T=[];for(let e of[12,38,64,90]){for(let t of[-2.2,2.2])T.push({p:[-36+t,e,-18],s:[1.4,22,2.8]});T.push({p:[-36,e+10,-18],s:[7.5,2.5,5]})}_(new Ao(1,1,1),b,T,`central-tower`),f(`central-tower`,-36,28,-18,4);let E=new za(new No(4.5,14,4),b);E.position.set(-36,109,-18),E.rotation.y=Math.PI/4,u.add(E);let D=new Da({color:16773036,fog:!1}),O=new za(new sc(25,12,8),D);O.position.set(-420,300,-740),u.add(O);let k=new za(new sc(42,12,8),new Da({color:16773832,transparent:!0,opacity:.25,depthWrite:!1,fog:!1}));k.position.copy(O.position),u.add(k);let A=[],j=[],M=[],N=(e,t,n)=>{for(let r=0;e.length<t&&r<t*12;r++){let t=(l()*2-1)*i*.92,r=(l()*2-1)*i*.92;if(!s(t,r,17))continue;let a=n===`grass`?.15+l()*.24:n===`rock`?.2+l()*.55:.45+l()*.95,o=n===`grass`?.3+l()*.5:n===`rock`?.15+l()*.5:.12+l()*.38,c=n===`grass`?.12+l()*.2:n===`rock`?.2+l()*.5:.35+l()*.55;e.push({p:[t,o/2+.03,r],s:[a,o,c],turn:l()*Math.PI*2})}};N(A,240,`rock`),N(j,280,`grass`),N(M,120,`ruin`),_(new rc(1,0),new Da({color:9140325,fog:!1}),A,`speed-ground-rocks`),_(new No(1,1,3),new Da({color:7441253,fog:!1}),j,`speed-ground-grass`),_(new Ao(1,1,1),new Da({color:12893341,fog:!1}),M,`speed-ground-ruins`);let P=[],F=[],I=[],L=[],ee=Array.isArray(n)?n.filter(e=>[e?.x,e?.y,e?.z].every(Number.isFinite)):[];for(let e=1;e<ee.length;e++){let t=ee[e-1],n=ee[e],r=n.x-t.x,a=n.z-t.z,o=Math.hypot(r,a);if(o<=0)continue;let c=Math.floor(o/36);for(let l=0;l<c;l++)for(let u of[-1,1]){let d=(l+.5)/Math.max(1,c),p=t.x+r*d-a/o*18*u,m=t.z+a*d+r/o*18*u;if(Math.abs(p)>i-3||Math.abs(m)>i-3||!s(p,m,14))continue;let h=t.y+(n.y-t.y)*d,g=h+5;P.push({p:[p,g/2,m],s:[1.4,g,1.4]}),F.push({p:[p,g,m],s:[3.4,.7,3.4]}),f(`route-${e}-${l}-${u}`,p,h,m,1.7)}}let te=Array.isArray(r)?r.slice(0,4):[];te.forEach(e=>{if(!e?.from||!e?.to)return;let t=e.to.x-e.from.x,n=e.to.z-e.from.z,r=Math.hypot(t,n);if(r>0)for(let[a,o]of[e.from,e.to].entries()){let s=e.width/2+3,c=o.y+9,l=Math.atan2(-t,-n);for(let u of[-1,1]){let d=o.x-n/r*s*u,p=o.z+t/r*s*u;Math.abs(d)>i-2||Math.abs(p)>i-2||(I.push({p:[d,c/2,p],s:[2,c,2],turn:l}),f(`ab-${e.id}-${a?`exit`:`entry`}-${u}`,d,o.y,p,2))}for(let e=0;e<(a===0?2:1);e++)L.push({p:[o.x,c+e*1.8,o.z],s:[s*2+2,.9,2],turn:l})}}),P.length&&_(new Mo(1,1,1,6),new Da({color:10926512,fog:!1}),P,`course-speed-pillars`),F.length&&_(new Ao(1,1,1),new Da({color:5730159,fog:!1}),F,`course-speed-pillar-caps`),I.length&&_(new Ao(1,1,1),new Da({color:5083020,fog:!1}),I,`ab-straight-gate-pillars`),L.length&&_(new Ao(1,1,1),new Da({color:15782291,fog:!1}),L,`ab-straight-gate-lintels`);let ne=[],re=[];[[-55,12,26],[38,22,4],[-48,34,-48],[48,46,-72],[15,18,65],[-58,55,62],[65,8,-36],[-70,72,-10],[12,68,-82],[66,30,58],[-15,40,-80],[-60,22,-85]].forEach(([e,t,n],r)=>{let i=e*a,o=n*a;s(i,o,26)&&re.push([i,t,o,r])});let ie=0;for(let e=0;ie<24&&e<480;e++){let e=(l()*2-1)*i*.9,t=(l()*2-1)*i*.9,n=8+l()*32;s(e,t,26)&&(re.push([e,n,t,12+ie]),ie++)}re.forEach(([e,t,n,r])=>{for(let i=0;i<3;i++)ne.push({p:[e+(i-1)*4,t+(i===1?1.2:0),n+(r%2?1:-1)*i],s:[5+i%2,1.7+i%2*.7,3.5],turn:r*.7})}),_(new rc(1,1),new Da({color:16120566,fog:!1,transparent:!0,opacity:.42,depthWrite:!1}),ne,`noncolliding-cloud-puffs`);let ae=[P,F,I,L].filter(e=>e.length).length;return{group:u,details:Object.freeze({islands:12,towerHeight:116,clouds:re.length,suns:1,fogless:!0,collisions:!1,batches:11+ae,nearClouds:ie,cloudPuffs:ne.length,groundDetails:A.length+j.length+M.length,groundBatches:3,...ee.length?{routePillars:P.length,abGates:L.length?te.length*2:0,passObjects:d.length}:{},groundCounts:Object.freeze({rocks:A.length,grass:j.length,ruins:M.length})}),passObjects:Object.freeze(d)}}var eh=Object.freeze({repeatMetres:64,coarseMetres:16,fineMetres:4,textureSize:512,coverageMetres:2e4}),th=[154,80,47],nh=e=>Math.max(0,Math.min(1,e)),rh=(e,t)=>(e%t+t)%t,ih=(e,t)=>{let n=(Math.floor(e/16)+Math.floor(t/16))%2==0?17:-12,r=(Math.floor(e/4)+Math.floor(t/4))%2==0?5:-4,i=Math.min(rh(e,16),rh(t,16))<.25?-27:Math.min(rh(e,4),rh(t,4))<.125?10:0;return n+r+i};function ah({maxAnisotropy:e=1,strength:t=.8}={}){let{textureSize:n,repeatMetres:r}=eh,i=new Uint8Array(n*n*4),a=new Ha(i,n,n,rt);a.name=`assisted-world-ground-pattern`,a.colorSpace=tn,a.wrapS=a.wrapT=Ne,a.minFilter=Ve,a.magFilter=ze,a.generateMipmaps=!0,a.anisotropy=Math.max(1,Math.min(8,Math.floor(Number.isFinite(e)?e:1)));let o=new Da({color:16777215,map:a,fog:!1}),s=null,c=0,l=!1;function u(e){if(l||!Number.isFinite(e))return!1;let t=nh(e);if(t===s)return!1;s=t;for(let e=0;e<n;e++)for(let a=0;a<n;a++){let o=ih((a+.5)/n*r,(e+.5)/n*r)*t,s=(e*n+a)*4;i[s]=Math.round(th[0]+o),i[s+1]=Math.round(th[1]+o*.92),i[s+2]=Math.round(th[2]+o*.72),i[s+3]=255}return a.needsUpdate=!0,c++,!0}u(Number.isFinite(t)?t:.8);function d(e){let t=e.geometry.getAttribute(`position`),n=e.geometry.getAttribute(`uv`);for(let i=0;i<t.count;i++)n.setXY(i,(t.getX(i)*e.scale.x+e.position.x)/r,(-t.getY(i)*e.scale.y+e.position.z)/r);n.needsUpdate=!0}let f=()=>({...eh,strength:s,updates:c,mipmaps:a.generateMipmaps,minFilter:`linear-mipmap-linear`,anisotropy:a.anisotropy,repeatWrapping:!0,coverage:{minX:-1e4,maxX:1e4,minZ:-1e4,maxZ:1e4},textureCount:1});function p(){l||(l=!0,a.dispose(),o.dispose())}return{texture:a,material:o,setStrength:u,applyWorldUV:d,snapshot:f,dispose:p}}function oh(e,t){if(!Array.isArray(e)||!t||![t.x,t.y,t.z].every(Number.isFinite))return null;let n=null;for(let r of e){let e=r.to.x-r.from.x,i=r.to.z-r.from.z,a=Math.hypot(e,i);if(!Number.isFinite(a)||a<=0)continue;let o=((t.x-r.from.x)*e+(t.z-r.from.z)*i)/a/a,s=Math.max(0,Math.min(1,o)),c=r.from.x+e*s,l=r.from.z+i*s,u=r.from.y+(r.to.y-r.from.y)*s,d=Math.hypot(t.x-c,t.z-l),f=Math.hypot(t.x-r.from.x,t.y-r.from.y,t.z-r.from.z),p=o>=0&&o<=1&&d<=r.width/2&&Math.abs(t.y-u)<=r.heightTolerance,m={id:r.id,inside:p,progress:o,length:a,centerDistance:d,entryDistance:f};(n===null||d<n.centerDistance)&&(n=m)}return n}var sh=84,ch=68;function lh({altitude:e=14}={}){let t=new Gr;t.name=`assisted-exit`,t.visible=!1;let n={transparent:!0,depthTest:!1,depthWrite:!1,fog:!1},r=new Da({...n,color:16772474,opacity:.32}),i=new Da({...n,color:16777215,opacity:.24}),a=new cc(3.1,.24,10,64),o=new cc(2.78,.065,8,64),s=Array.from({length:3},(e,n)=>{let s=new Gr,c=new za(a,r),l=new za(o,i);return c.renderOrder=10,l.renderOrder=11,s.add(c,l),n===1&&(s.rotation.y=Math.PI/2),n===2&&(s.rotation.x=Math.PI/2),t.add(s),s}),c=Math.max(50,e+32),l=new Gr;l.name=`exit-column`,l.position.y=c/2-e;let u=new Da({...n,color:16770127,opacity:.2}),d=new Da({...n,color:16775115,opacity:.8}),f=new za(new Mo(.38,.55,c,12),u),p=new za(new Mo(.1,.14,c,12),d);f.renderOrder=8,p.renderOrder=9,l.add(f,p),l.visible=!1,t.add(l);let m=document.createElement(`canvas`);m.width=m.height=128;let h=m.getContext(`2d`);h.beginPath(),h.arc(64,64,48,0,Math.PI*2),h.strokeStyle=`#78520c`,h.lineWidth=20,h.stroke(),h.strokeStyle=`#ffe44f`,h.lineWidth=14,h.stroke(),h.beginPath(),h.arc(64,64,42,0,Math.PI*2),h.strokeStyle=`#ffffff`,h.lineWidth=4,h.stroke();let g=new Eo(m);g.colorSpace=tn;let _=new ba(new oa({...n,map:g,sizeAttenuation:!1}));_.name=`exit-screen-halo`,_.renderOrder=12,_.visible=!1,t.add(_);let v=!1,y=!1,b=!1;return{group:t,update({visible:e,unlocked:n,time:a=0,fov:o=64,height:c=844}){y=!!e,v=!!n,t.visible=y,l.visible=_.visible=y&&v;let f=(1+Math.sin(a*4))/2;for(let e of s)e.scale.setScalar(v?1+.06*f:1);r.color.setHex(v?16772474:8550998),i.color.setHex(v?16777215:10721654),r.opacity=v?.78+.22*f:.32,i.opacity=v?.75+.25*f:.24,u.opacity=.15+.12*f,d.opacity=.65+.25*f;let p=sh*(v?1+.04*f:1)*2*Math.tan(W.degToRad(o)/2)/Math.max(1,c);_.scale.set(p,p,1),_.material.opacity=1},snapshot:()=>({assisted:y,open:v,rings:y?3:1,color:y?v?`#ffed7a`:`#827a56`:null,minPixels:y&&v?ch:0,column:y&&v,columnTop:c}),dispose(){b||(b=!0,g.dispose())}}}function uh(e={}){let t=e?.halfExtent,n=Number.isFinite(t)&&t>0?t:350,r=new Gr;r.name=`stage-storm-boundary`,r.userData.halfExtent=n,r.userData.collisions=!1;let i=new rc(1,1),a=new Da({color:5859970,transparent:!0,opacity:.84,depthWrite:!1,fog:!1}),o=new Za(i,a,64);o.name=`storm-perimeter-puffs`;let s=new _r,c=new q,l=new q,u=new K,d=new Qr;for(let e=0;e<4;e++)for(let t=0;t<16;t++){let r=e*16+t,i=-n+(t+.5)*n/8,a=28+r%5*3;c.set(e===0?n:e===1?-n:i,a,e===2?n:e===3?-n:i);let f=n/16+9+r%3*3,p=18+r%4*2,m=34+r%4*5;l.set(e<2?p:f,m,e<2?f:p),u.setFromAxisAngle(new q(0,1,0),(r%3-1)*.08),s.compose(c,u,l),o.setMatrixAt(r,s),d.setHSL(.61+r%3*.008,.17,.34+r%4*.025),o.setColorAt(r,d)}return o.instanceMatrix.needsUpdate=!0,o.instanceColor&&(o.instanceColor.needsUpdate=!0),o.computeBoundingSphere(),r.add(o),{group:r,update(e){Number.isFinite(e)&&(a.opacity=.84+.025*Math.sin(e*.3))},snapshot:()=>({kind:`storm`,halfExtent:n,stormPuffs:64,instances:64,batches:1,collisions:!1,animatedGeometry:!1,opacity:a.opacity})}}var dh=3.2,fh=4,ph=14478321,mh=W.degToRad(40),hh=[{id:`north`,label:`北の三角塔`,color:`#2c81b7`,shape:`triangle`,position:{x:0,y:16,z:-315}},{id:`east`,label:`東の四角塔`,color:`#bf6559`,shape:`square`,position:{x:295,y:16,z:0}},{id:`south`,label:`南のひし形`,color:`#8b6bb3`,shape:`diamond`,position:{x:0,y:16,z:315}},{id:`west`,label:`西のアーチ`,color:`#478f73`,shape:`arch`,position:{x:-295,y:16,z:0}}],gh=(e,t=0)=>Number.isFinite(e)?e:t;function _h(e,{visibility:t=`assisted`,display:n=`bank`,cameraMode:r=`overlay`,course:i=xe,turnGravity:a=de.defaultGravity}={}){let o=i&&Array.isArray(i.lights)&&i.lights.length>=3?i:xe,s=new q(o.start.x,o.start.y,o.start.z),c=o.lights.map(e=>new q(e.x,e.y,e.z)),l=new q(o.exit.x,o.exit.y,o.exit.z),u=he(a),d=40,f=0;r=Km(r),n=n===`fixed`?`fixed`:`bank`,t=ym(t);let p;try{p=new Pf({canvas:e,antialias:!0,alpha:!1,powerPreference:`high-performance`})}catch{throw Error(`3D画面を開けませんでした。WebGL 2が使えるブラウザで開き直してください。`)}p.outputColorSpace=tn,p.autoClear=!1,p.setClearColor(ph,1);let h=new ti;h.background=new Qr(ph),h.fog=new ei(ph,220,1100);let g=new tl(64,1,.1,250),S=new Gr;h.add(S);let C=$m({halfExtent:350,avoidPoints:[o.start,...o.lights,o.exit],coursePoints:[o.start,...o.lights,o.exit],abStraights:o.abStraights});S.add(C.group);let w=_m();g.add(w.group),h.add(g);let T=uh({halfExtent:350});S.add(T.group),h.add(new Uc(16055551,7902882,2.4));let E=new il(16775399,2.6);E.position.set(-35,65,30),h.add(E);let D=new yc({color:16053744,roughness:.95}),O=new yc({color:12110800,roughness:1}),k=new yc({color:13098209,roughness:.9}),A=new Da({color:10113071,fog:!1}),j=new Da({color:12547906,fog:!1}),N=new Da({color:15845515,fog:!1}),P=new Da({color:14917945}),F=new Da({color:16774336}),I=new Da({color:1146775}),L=new Da({color:9355205}),ee=new Ao(1,1,1);function te(e,t,n,r,i,a,o,s=D){let c=new za(ee,s);return c.position.set(t,n,r),c.scale.set(i,a,o),e.add(c),c}let ne=new Gr;ne.name=`assisted-direction-landmarks`,S.add(ne);function re(e){let t=new gs;return e.forEach(([e,n],r)=>r===0?t.moveTo(e,n):t.lineTo(e,n)),t.closePath(),t}for(let e of hh){let t,n=28;e.shape===`triangle`?(n=30,t=re([[-5.5,0],[0,30],[5.5,0]]),t.holes.push(re([[-3.5,1.5],[3.5,1.5],[0,22.5]]))):e.shape===`square`?(t=re([[-5,0],[5,0],[5,28],[-5,28]]),t.holes.push(re([[-3.4,1.6],[-3.4,26.4],[3.4,26.4],[3.4,1.6]]))):e.shape===`diamond`?(t=re([[0,0],[5.5,14],[0,28],[-5.5,14]]),t.holes.push(re([[0,4],[-3.6,14],[0,24],[3.6,14]]))):(t=new gs,t.moveTo(-6,0),t.lineTo(-6,22),t.absarc(0,22,6,Math.PI,0,!0),t.lineTo(6,0),t.lineTo(4.4,0),t.lineTo(4.4,22),t.absarc(0,22,4.4,0,Math.PI,!1),t.lineTo(-4.4,0),t.closePath());let r=new Gr;r.name=`direction-${e.id}`,r.position.set(e.position.x,e.position.y,e.position.z),e.id===`east`?r.rotation.y=-Math.PI/2:e.id===`south`?r.rotation.y=Math.PI:e.id===`west`&&(r.rotation.y=Math.PI/2);let i=new ec(t,{depth:3,steps:1,bevelEnabled:!0,bevelSize:.12,bevelThickness:.12,bevelSegments:1,curveSegments:16});i.translate(0,-n/2,-1.5);let a=new Da({color:e.color,fog:!1});r.add(new za(i,a));let o=new _o(new zo(i,25),new io({color:15398135,fog:!1,transparent:!0,opacity:.72}));r.add(o),te(r,0,-n/2-.6,0,12.6,1,5,D),ne.add(r)}let ie=new za(new Mo(84,77,6,64),O);ie.position.set(0,-3.1,-24),ie.scale.z=1.1,S.add(ie);let ae=new za(new jo(83.8,64),A);ae.name=`ground-surface`,ae.rotation.x=-Math.PI/2,ae.position.set(0,0,-24),ae.scale.y=1.1,S.add(ae);let oe=new za(new ac(2e4,2e4),A);oe.name=`ground-outer-surface`,oe.rotation.x=-Math.PI/2,oe.position.y=-.08,S.add(oe);let se=ah({maxAnisotropy:p.capabilities.getMaxAnisotropy()});se.applyWorldUV(ae),se.applyWorldUV(oe);let ce=new za(new sc(220,64,16,0,Math.PI*2,Math.PI/2,Math.PI/2),new Da({color:10113071,side:1,fog:!1,depthWrite:!1}));ce.renderOrder=-10,S.add(ce);let le=[];for(let e=-700;e<=700;e+=8)le.push(e,-.045,-700,e,-.045,700),le.push(-700,-.045,e,700,-.045,e);let ue=new Yi;ue.setAttribute(`position`,new Li(le,3));let fe=new _o(ue,new io({color:4859158,transparent:!0,opacity:.55,fog:!1}));fe.name=`ground-outer-grid`,S.add(fe);let pe=[];for(let e=-80;e<=80;e+=8){let t=Math.sqrt(6889-e*e);pe.push(e,.035,-24-t*1.1,e,.035,-24+t*1.1),pe.push(-t,.035,-24+e*1.1,t,.035,-24+e*1.1)}let me=new Yi;me.setAttribute(`position`,new Li(pe,3));let _e=new _o(me,new io({color:4859158,transparent:!0,opacity:.7,fog:!1}));_e.name=`ground-grid`,S.add(_e),te(S,0,.025,-25,.15,.05,106,N);let ye=new Za(ee,N,14),R=new _r,z=new q,be=new q(3.6,.04,.16),Se=new K;for(let e=0;e<14;e+=1)z.set(0,.04,28-e*8),R.compose(z,Se,be),ye.setMatrixAt(e,R);S.add(ye);let B=[];for(let e=-21;e<=20;e+=1)for(let t=-23;t<=22;t+=1){if((e+t)%2!=0)continue;let n=e*4+2,r=t*4+2;n*n+(r/1.1)**2>6400||B.push([n,r-24])}let Ce=new Za(ee,j,B.length);Ce.name=`ground-paving`,B.forEach(([e,t],n)=>{R.compose(z.set(e,.012,t),Se,be.set(3.7,.02,3.7)),Ce.setMatrixAt(n,R)}),S.add(Ce);let V=new Gr;V.name=`craft-ground-projection`,V.rotation.x=-Math.PI/2;let we=new Da({color:2365198,transparent:!0,opacity:.18,depthWrite:!1,fog:!1}),Te=new Da({color:16769716,transparent:!0,opacity:.32,depthWrite:!1,fog:!1});V.add(new za(new jo(.85,32),we)),V.add(new za(new oc(.96,1.15,32),Te)),S.add(V);let Ee=new Mo(.68,.85,1,10),De=[[-14,7,15],[14,7,15],[-24,13,-7],[27,17,-12],[-31,10,-31],[35,12,-37],[-28,17,-56],[25,9,-70],[-52,22,-18],[56,25,-45],[-58,15,19],[57,13,9],[-47,12,-83],[46,19,-87],[-65,10,-55],[67,16,-10]],Oe=new Za(Ee,D,De.length),ke=new Za(ee,D,De.length*2);for(let e=0;e<De.length;e+=1){let[t,n,r]=De[e];R.compose(z.set(t,n/2,r),Se,be.set(1,n,1)),Oe.setMatrixAt(e,R),R.compose(z.set(t,.35,r),Se,be.set(2.25,.7,2.25)),ke.setMatrixAt(e*2,R),R.compose(z.set(t,n,r),Se,be.set(1.9,.65,1.9)),ke.setMatrixAt(e*2+1,R)}S.add(Oe,ke),te(S,-19,13.4,-7,12,1.4,2.2),te(S,31,12.5,-37,10,1.5,2.4),[[-36,4,5,13,17],[36,8,-18,14,15],[-34,12,-48,14,12],[87,-1,-34,17,24],[-88,1,-64,17,19],[54,3,-100,20,12]].forEach(([e,t,n,r,i])=>{te(S,e,t-1,n,r,2,i,O),te(S,e,t+.08,n,r+.35,.25,i+.35)});let Ae=new Za(new Mo(.3,.45,3,8),k,36);for(let e=0;e<36;e+=1){let t=e/36*Math.PI*2;R.compose(z.set(Math.cos(t)*81,1.5,-24+Math.sin(t)*89),Se,be.set(1,1,1)),Ae.setMatrixAt(e,R)}S.add(Ae);let je=new Da({color:7449274}),Ne=new Da({color:9617097,transparent:!0,opacity:.32,depthWrite:!1}),Pe=new Za(new cc(1.8,.045,4,6),Ne,36),Fe=new K,Ie=new Dr;for(let e=0;e<3;e+=1){let t=66+e*8,n=12+e*13;for(let r=0;r<8;r+=1){let i=r/8*Math.PI*2+Math.PI/8+e*Math.PI/16;Fe.setFromEuler(Ie.set(0,-i-Math.PI/2,0)),R.compose(z.set(Math.cos(i)*t,n,-24+Math.sin(i)*t),Fe,be.set(1,1,1)),Pe.setMatrixAt(e*8+r,R)}}Fe.setFromEuler(Ie.set(-Math.PI/2,0,0));for(let e=0;e<12;e+=1){let t=e/12*Math.PI*2,n=e%2==0?24:46;R.compose(z.set(Math.cos(t)*n,52,-24+Math.sin(t)*n),Fe,be.set(1.2,1.2,1.2)),Pe.setMatrixAt(24+e,R)}S.add(Pe);let Le=new Za(ee,je,8),Re=new Za(ee,je,24),ze=new Za(new ic(1.1),D,8);for(let e=0;e<8;e+=1){let t=e/8*Math.PI*2+Math.PI/8,n=Math.cos(t)*76,r=-24+Math.sin(t)*76;Fe.setFromEuler(Ie.set(0,-t-Math.PI/2,0)),R.compose(z.set(n,21,r),Se,be.set(.16,42,.16)),Le.setMatrixAt(e,R),R.compose(z.set(n,43,r),Se,be.set(1,1.6,1)),ze.setMatrixAt(e,R);for(let t=0;t<3;t+=1)R.compose(z.set(n,12+t*12,r),Fe,be.set(2.4+t,.16,.16)),Re.setMatrixAt(e*3+t,R)}S.add(Le,Re,ze);let Be=[s,...c,l],Ve=[];for(let e=0;e<Be.length-1;e+=1)for(let t=0;t<7;t+=1)z.copy(Be[e]).lerp(Be[e+1],(t+1)/8),Ve.push(z.x,z.y,z.z);let He=new Yi;He.setAttribute(`position`,new Li(Ve,3));let Ue=new Co(He,new vo({color:3247269,size:4,sizeAttenuation:!1,transparent:!0,opacity:.65,depthWrite:!1}));S.add(Ue);let We=[[-17,17,10],[22,25,3],[-24,31,-16],[9,38,-14],[-8,29,-37],[31,34,-51],[-28,21,-72],[15,45,-69],[-31,48,16],[33,46,23],[-49,35,33],[49,27,-76]],Ge=new Za(new ic(1),k,We.length);We.forEach(([e,t,n],r)=>{Fe.setFromEuler(Ie.set(r*.3,r*.6,.2)),R.compose(z.set(e,t,n),Fe,be.set(.7+r%3*.2,1.1,.7)),Ge.setMatrixAt(r,R)}),S.add(Ge);let Ke=new cc(1.5,.075,6,40),qe=new sc(.43,16,12),Je=new sc(.85,16,12),Ye=new Da({color:16766074,transparent:!0,opacity:.18,depthWrite:!1}),Xe=new Da({color:15739803,fog:!1}),Ze=new Da({color:16775935,fog:!1}),Qe=new Da({color:16743371,transparent:!0,opacity:.22,depthWrite:!1,fog:!1}),$e=new Da({color:16411073,transparent:!0,opacity:.85,depthWrite:!1,fog:!1}),et=document.createElement(`canvas`);et.width=et.height=64;let tt=et.getContext(`2d`);tt.strokeStyle=`#fffaff`,tt.lineWidth=9,tt.beginPath(),tt.arc(32,32,26,0,Math.PI*2),tt.stroke(),tt.strokeStyle=`#eb228f`,tt.lineWidth=3,tt.beginPath(),tt.arc(32,32,26,0,Math.PI*2),tt.stroke();let nt=new Eo(et);nt.colorSpace=tn;let rt=c.map((e,t)=>{let n=new Gr;n.position.copy(e);let r=new za(Ke,P),i=new za(qe,F),a=new za(Je,Ye);n.add(r,i,a);let o=new ba(new oa({map:nt,transparent:!0,depthTest:!1,depthWrite:!1,sizeAttenuation:!1,fog:!1}));o.renderOrder=8,n.add(o);for(let e=0;e<=t;e+=1)te(n,(e-t/2)*.42,-2.05,0,.15,.4,.15,P);let s=new za(new Mo(.035,.035,e.y,5),new Da({color:14917945,transparent:!0,opacity:.28}));s.userData.legacyMaterial=s.material,s.position.set(e.x,e.y/2,e.z),S.add(s,n);let c=new za(new Mo(2.2,2.6,.45,20),D);return c.position.set(e.x,.25,e.z),S.add(c),{group:n,stem:s,ring:r,orb:i,halo:a,hint:o}}),it=new Gr;it.position.copy(l);let at=new za(new cc(3.1,.15,8,48),L);it.add(at);let ot=lh({altitude:l.y});it.add(ot.group),S.add(it);let st=new Gr;st.position.copy(l),S.add(st),te(st,-4.7,-1,0,1.5,12,2),te(st,4.7,-1,0,1.5,12,2),te(st,0,5.7,0,11,1.5,2.2),te(st,0,-6.7,0,12,.6,7,k);let ct=new ti,lt=new nl(-1,1,1,-1,.1,500);lt.position.z=200,ct.add(new Uc(16777215,5404809,2.2));let ut=new il(16777215,2.1);ut.position.set(-40,70,100),ct.add(ut);let dt=new Gr,ft=new Gr;dt.add(ft);let pt=new gs;pt.moveTo(0,24),pt.lineTo(8,-3),pt.lineTo(31,-11),pt.lineTo(30,-17),pt.lineTo(7,-12),pt.lineTo(5,-24),pt.lineTo(-5,-24),pt.lineTo(-7,-12),pt.lineTo(-30,-17),pt.lineTo(-31,-11),pt.lineTo(-8,-3),pt.closePath();let mt=new ec(pt,{depth:5,bevelEnabled:!0,bevelSegments:1,steps:1,bevelSize:.9,bevelThickness:.9}),ht=new za(mt,new yc({color:16383224,roughness:.52,metalness:.12}));ft.add(ht);let gt=new _o(new zo(mt,25),new io({color:4618635,transparent:!0,opacity:.6}));ft.add(gt);let _t=new za(new sc(1,16,12),new yc({color:3640487,roughness:.3,metalness:.2}));_t.position.set(0,2.5,5.3),_t.scale.set(4,9,3),ft.add(_t),te(ft,0,-17,5.5,3,7,1,I);let vt=Qm();vt.group.rotation.x=Math.PI/2,vt.group.scale.setScalar(13),dt.add(vt.group);let yt=Qm();S.add(yt.group),ct.add(dt);let bt=s.clone(),xt=new q,St=new K,Ct=new K,wt=new K,Tt=s.clone(),Et=new q,Dt=new K,Ot=new q(0,0,1),kt=new K,At=new K,jt=new K,Mt=new K,Nt=new K,Pt=new K,Ft=new q(0,1,0),It=new q(1,0,0),Lt=new K,Rt=new K,zt=new q,Bt=new q,Vt=new q,Ht=new q,Ut=new q,Wt=new q,Gt=new q,Kt=new q,qt=new q,Jt=`explore`,Yt=0,Xt=0,Zt=0,Qt=0,$t=m(),en=!1,nn=Object.freeze([]),rn={streakAmount:0,speedFov:0,highSpeedShake:!1,autoAfterburner:!1,autoAfterburnerAngle:35},an=0,on=64,sn=new K,cn=new Dr,ln=0,un=0,dn=!1,fn=0,pn=!1,mn=1,hn=1,gn={vertical:64,horizontal:64},H=0,U=!1,_n=0,vn=0,yn=null,bn=null,xn=null,Sn=.15,Cn=0,wn=0,Tn=0,En=0,Dn=new K;function On(e=0){En+=Math.max(0,e);let i=Jt===`flight`?pm(Zt,rn,$t,En,r):{extraFov:0,shake:{x:0,y:0,z:0}};if(Math.abs(i.extraFov-an)>1e-6&&(an=i.extraFov,Fn()),Ct.copy(St),Jt===`flight`&&(Dt.setFromAxisAngle(Ot,-Yt),Ct.multiply(Dt),dt.quaternion.setFromAxisAngle(Ot,-Yt)),Jt===`flight`){let t=Im({orientation:Ct,altitude:bt.y,velocity:dn?Et:Ht,bank:Yt});(!yn||e>0)&&(yn=Lm(yn,t,e));let i=yn;if(n===`fixed`){let t=Gm(Im({orientation:St,altitude:bt.y,velocity:dn?Et:Ht,bank:0}));(!bn||e>0)&&(bn=Gm(Lm(bn,t,e))),i=bn}let a=Wm({display:n,bank:Yt,phoneRoll:Cn,screenOffset:wn});if(Tn=a.roll,g.quaternion.copy(a.camera),lt.quaternion.copy(a.camera),dt.quaternion.copy(a.craft),r===`chase`?(xn=Ym(xn,Xm(St),e,Sn),i=Zm(xn,bt.y,t.assistance),n===`fixed`&&(i=Gm(i))):r===`cockpit`&&(i={orientation:Ct.clone(),offset:new q(0,.3,-.8).applyQuaternion(Ct),assistance:0,pitch:Xm(St).pitch}),wt.copy(i.orientation).invert().premultiply(a.worldBank),r===`cockpit`&&wt.copy(i.orientation).invert(),Tt.copy(bt).add(i.offset),_n=i.assistance,vn=i.pitch,yt.group.position.copy(bt),yt.group.quaternion.copy(Ct),r===`chase`&&n===`fixed`){let e=Gm({orientation:i.orientation.clone().invert().multiply(St)}).orientation;yt.group.quaternion.copy(i.orientation).multiply(a.worldBank.clone().invert()).multiply(e)}}else g.quaternion.identity(),lt.quaternion.identity(),Tn=0,yn=null,bn=null,xn=null,wt.copy(Ct).invert(),Tt.copy(bt),_n=0,Bt.set(0,0,-1).applyQuaternion(Ct),vn=Math.atan2(Bt.y,Math.hypot(Bt.x,Bt.z));sn.setFromEuler(cn.set(i.shake.x,i.shake.y,i.shake.z)),g.quaternion.multiply(sn),lt.quaternion.multiply(sn),Dn.copy(g.quaternion).invert(),w.update({speed:Zt,afterburner:$t,amount:rn.streakAmount,timeSeconds:En,verticalFov:g.fov,aspect:mn/hn,visible:t===`assisted`&&!dn&&!pn}),S.quaternion.copy(wt),S.position.copy(Tt).negate().applyQuaternion(wt),ce.position.copy(Tt),ce.visible=Jt===`flight`&&r!==`overlay`,ft.visible=Jt!==`flight`,vt.group.visible=Jt===`flight`,dt.visible=Jt!==`flight`||r===`overlay`,yt.group.visible=Jt===`flight`&&r===`chase`,vt.setPower(Qt,$t.active),yt.setPower(Qt,$t.active);let a=bt.x**2+((bt.z+24)/1.1)**2<83.5**2;V.position.set(bt.x,a?.075:-.025,bt.z),V.scale.setScalar(1.1+bt.y*.045),V.visible=!0,we.opacity=W.clamp(.22-bt.y*.003,.08,.22),Te.opacity=W.clamp(.36-bt.y*.004,.14,.36)}function kn(){$t=v($t),en=!1,Ht.set(0,0,0),Zt=0,Qt=0,ln=0,un=0,Xt=0}function An(){U||dn||pn||(nn=Object.freeze([]),Jt!==`flight`&&(St.copy(Ct),Yt=0),Jt=`flight`,Fn(),Bt.set(0,0,-1).applyQuaternion(St),Ht.copy(Bt).multiplyScalar(x.cruiseSpeed),Zt=Ht.length(),Qt=x.defaultThrottle,Xt=0,On(),jn())}function jn(){if(U)return;let e=48*Math.tan(W.degToRad(g.fov)/2)/hn;rt.forEach(t=>t.hint.scale.set(e,e,1)),ot.update({visible:t===`assisted`,unlocked:fn===c.length,time:En,fov:g.fov,height:hn}),p.clear(),p.render(h,g),p.clearDepth(),p.render(ct,lt)}function Mn(){rt.forEach((e,n)=>{e.group.visible=n>=fn;let r=t===`assisted`;e.stem.visible=n>=fn&&(!r||n===fn),e.stem.material=r?$e:e.stem.userData.legacyMaterial,e.stem.scale.set(r?2:1,1,r?2:1),e.ring.material=r?Ze:P,e.orb.material=r?Xe:F,e.halo.material=r?Qe:Ye,e.hint.visible=r&&n>=fn,e.hint.material.opacity=n===fn?1:.65;for(let t of e.group.children)[e.ring,e.orb,e.halo,e.hint].includes(t)||(t.material=r?Xe:P);e.ring.scale.setScalar(n===fn?1.1:1),e.halo.scale.setScalar(n===fn?1.25:.85)}),at.material=fn===c.length?I:L,at.visible=t!==`assisted`,st.visible=t!==`assisted`}function Nn(e,t){Wt.subVectors(t,e);let n=Wt.lengthSq(),r=0;for(;!pn;){let t=fn<c.length?c[fn]:l,i=fn<c.length?dh:fh,a=n>0?W.clamp(Gt.subVectors(t,e).dot(Wt)/n,r,1):0;if(qt.copy(e).addScaledVector(Wt,a),qt.distanceToSquared(t)>i*i)break;r=a,fn<c.length?fn+=1:pn=!0,Mn()}}function Pn(e,t,n=1){U||(mn=Math.max(1,gh(e,1)),hn=Math.max(1,gh(t,1)),p.setPixelRatio(W.clamp(gh(n,1),.5,1.6)),p.setSize(mn,hn,!1),Fn(),lt.left=-mn/2,lt.right=mn/2,lt.top=hn/2,lt.bottom=-hn/2,lt.updateProjectionMatrix(),jn())}function Fn(){gn=Em(mn,hn,t),Jt===`flight`&&r===`cockpit`&&H>=60&&(gn.vertical=Math.min(gn.vertical,H),gn.horizontal=W.radToDeg(2*Math.atan(Math.tan(W.degToRad(gn.vertical)/2)*mn/hn))),on=gn.vertical,an>0&&(gn.vertical=Math.min(115,on+an),gn.horizontal=W.radToDeg(2*Math.atan(Math.tan(W.degToRad(gn.vertical)/2)*mn/hn))),g.aspect=mn/hn,g.fov=gn.vertical,g.far=1800,g.updateProjectionMatrix(),C.group.visible=t===`assisted`,ae.material=oe.material=t===`assisted`?se.material:A,Ce.visible=t!==`assisted`,ne.visible=t===`assisted`,Mn()}function In(e){if(U)return;let t=e===`fixed`?`fixed`:`bank`;n!==t&&(bn=null),n=t,On(),jn()}function Ln(){Cn=0,wn=0,On(),jn()}function Rn(e){U||(t=ym(e),Fn(),jn())}function zn(e){U||se.setStrength(e)&&jn()}let Bn=Object.freeze([]);function Vn(){return t===`assisted`?C.passObjects:Bn}function Hn(e,t={}){if(U)return;nn=[];let n=t.craftQuaternion;if(n&&[n.x,n.y,n.z,n.w].every(Number.isFinite)){let e=Math.max(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z),Math.abs(n.w));e>0?dt.quaternion.set(n.x/e,n.y/e,n.z/e,n.w/e).normalize():dt.quaternion.identity()}else dt.quaternion.identity();let r=Math.max(0,gh(e));t.speedSettings&&typeof t.speedSettings==`object`&&(rn={...rn,...t.speedSettings}),f+=r,T.update(f),Number.isFinite(t.turnGravity)&&(u=he(t.turnGravity)),Number.isFinite(t.maxBank)&&(d=W.clamp(t.maxBank,5,40));let i=t.mode===`flight`?`flight`:`explore`;i!==Jt&&(St.copy(Ct),Yt=0,kn(),dn=!1,Jt=i,Fn()),Jt===`flight`&&(Number.isFinite(t.cockpitFov)&&t.cockpitFov!==H&&(H=t.cockpitFov===0?0:W.clamp(t.cockpitFov,60,100),Fn()),Number.isFinite(t.chaseTimeConstant)&&(Sn=W.clamp(t.chaseTimeConstant,0,.5)),Number.isFinite(t.displayTwist)&&(Cn=Um(Cn,W.degToRad(t.displayTwist),r,t.displayTimeConstant)),Number.isFinite(t.displayScreenOffset)&&(wn=W.degToRad(t.displayScreenOffset)));let a=gh(t.pitchRate),o=gh(t.yawRate),s=W.clamp(gh(t.bankAngle),-mh,mh),c=W.clamp(gh(t.throttle,x.defaultThrottle),0,1);if(r===0||Jt===`flight`&&(dn||pn)){nn=Object.freeze(nn),kn(),On(),jn();return}Jt===`explore`&&(Zt=pn?0:Math.max(0,gh(t.speed)),Qt=0);let l=Math.max(1,Math.ceil(r*60)),p=Jt===`flight`?l:Math.min(240,l),m=r/p;for(let e=0;e<p;e+=1){let e=o,n=0;if(Jt===`flight`){let t=Yt;Yt=W.damp(Yt,s,4,m),n=(t+Yt)/2,e=ge(n,Zt,u),Xt=ge(Yt,Zt,u)}else Yt=0,Xt=o;if(Jt===`flight`)jt.setFromAxisAngle(Ft,-e*m/2),Mt.setFromAxisAngle(Ft,-e*m),Nt.setFromAxisAngle(It,a*m/2),Pt.setFromAxisAngle(It,a*m),Lt.copy(St).premultiply(jt).multiply(Nt);else{let t=zt.set(a,-e,0).length();t>0&&zt.multiplyScalar(1/t),kt.setFromAxisAngle(zt,t*m/2),At.setFromAxisAngle(zt,t*m),Lt.copy(St).multiply(kt)}if(Bt.set(0,0,-1).applyQuaternion(Lt),xt.copy(bt),Jt===`flight`){Dt.setFromAxisAngle(Ot,-n),Rt.copy(Lt).multiply(Dt),Bt.set(0,0,-1).applyQuaternion(Rt),Vt.set(0,1,0).applyQuaternion(Rt),Ut.copy(Ht);let r=b($t,m,{running:!0,flight:!0,manualRequest:t.manualAfterburner===!0,autoEnabled:rn.autoAfterburner===!0,pitchInputDegrees:t.pitchInputDegrees,autoAngle:rn.autoAfterburnerAngle,groundClearance:bt.y,speed:Zt,grounded:dn});$t=r.state;let i=Math.max(0,Math.min(m,r.activeSeconds)),a=i>0?M(Ht,i,{forward:Bt,up:Vt,throttle:1,afterburner:!0}):null;i>0&&(en=!0),m-i>1e-12&&(a=M(a?.velocity??Ht,m-i,{forward:Bt,up:Vt,throttle:c,preserveOverspeed:en})),a.speed<=x.maxSpeed+1e-8&&(en=!1);let o=e-ge(n,Zt,x.gravity),s=o===0?a.velocity:ve(a.velocity,a.velocity,o,m);if(Ht.set(s.x,s.y,s.z),$t=y($t,Ht.length()),Qt=a.throttle,ln=a.recoveryAssist,un=a.angleOfAttack,bt.addScaledVector(Ut,m/2).addScaledVector(Ht,m/2),bt.y<=0&&Ht.y<0){let e=xt.y/(xt.y-bt.y);bt.lerpVectors(xt,bt,W.clamp(e,0,1)),bt.y=0,Et.copy(Ht),dn=!0,kn()}if(bt.y=W.clamp(bt.y,0,45),bt.y>=45&&Ht.y>0&&(Ht.y=0),Zt=Ht.length(),Xt=dn?0:ge(Yt,Zt,u),i>0){let e=i/m;nn.push(Object.freeze({from:Object.freeze({x:xt.x,y:xt.y,z:xt.z}),to:Object.freeze({x:xt.x+(bt.x-xt.x)*e,y:xt.y+(bt.y-xt.y)*e,z:xt.z+(bt.z-xt.z)*e}),seconds:i}))}}else bt.addScaledVector(Bt,Zt*m),bt.y=W.clamp(bt.y,2,45),Ht.subVectors(bt,xt).divideScalar(m);Jt===`flight`?St.premultiply(Mt).multiply(Pt).normalize():St.multiply(At).normalize();let r=fn,i=pn;if(Nn(xt,bt),Jt===`flight`&&($t=_($t,{targets:fn-r,exit:pn&&!i})),pn&&(Jt===`flight`?kn():(Zt=0,Ht.set(0,0,0))),Jt===`flight`&&(dn||pn))break}nn=Object.freeze(nn),On(r),jn()}function Un(){let e=fn<c.length?c[fn]:l;return Gt.subVectors(e,bt),Kt.subVectors(e,Tt).applyQuaternion(wt).applyQuaternion(Dn),Bt.set(0,0,-1).applyQuaternion(Ct),{collected:fn,total:c.length,course:{id:o.id??`legacy`,name:o.name??`比較用（旧配置）`,targetCount:c.length},stageSize:{halfExtent:350,width:700,depth:700},turnGravity:u,boundary:Me(bt,{heading:Math.atan2(Bt.x,-Bt.z),velocity:Ht,speed:Zt,turnGravity:u,maxBank:d}),boundaryAppearance:T.snapshot(),afterburner:{...$t},afterburnerMotion:nn,speedEffects:{...w.snapshot(),extraFov:an,baseVerticalFov:on,highSpeedShake:rn.highSpeedShake===!0},complete:pn,radarHeading:Math.hypot(Ht.x,Ht.z)>.1?Math.atan2(Ht.x,-Ht.z):Math.atan2(Bt.x,-Bt.z),navigationTargets:pn?[]:fn<c.length?c.slice(fn).map((e,t)=>({id:`light-${fn+t+1}`,kind:`light`,number:fn+t+1,label:`光 ${fn+t+1}`,next:t===0,position:{x:e.x,y:e.y,z:e.z}})):[{id:`exit`,kind:`exit`,label:`出口`,next:!0,position:{x:l.x,y:l.y,z:l.z}}],beaconAppearance:{core:`#${(t===`assisted`?Xe:F).color.getHexString()}`,ring:`#${(t===`assisted`?Ze:P).color.getHexString()}`,minPixels:t===`assisted`?22:0,columnTarget:t===`assisted`&&fn<c.length?fn+1:null},targetLabel:fn<c.length?`光 ${fn+1}`:`出口`,exitAppearance:{...ot.snapshot(),position:{x:l.x,y:l.y,z:l.z},radius:fh,stoneFrame:st.visible},distance:Gt.length(),bearing:Math.atan2(Kt.x,-Kt.z),elevation:Math.atan2(Kt.y,Math.hypot(Kt.x,Kt.z)),altitude:bt.y,groundClearance:bt.y,viewAssistance:_n,viewPitch:vn,viewPosition:{x:Tt.x,y:Tt.y,z:Tt.z},display:n,cameraMode:Jt===`flight`?r:`overlay`,craftVisible:dt.visible||yt.group.visible,worldCraftQuaternion:yt.group.quaternion.toArray(),worldCraftScreenQuaternion:Dn.clone().multiply(wt).multiply(yt.group.quaternion).toArray(),aircraft:yt.diagnostics(),chaseAngles:xn?{...xn}:null,displayRoll:Tn,cameraQuaternion:{x:g.quaternion.x,y:g.quaternion.y,z:g.quaternion.z,w:g.quaternion.w},worldQuaternion:{x:S.quaternion.x,y:S.quaternion.y,z:S.quaternion.z,w:S.quaternion.w},craftScreenQuaternion:(()=>{let e=lt.quaternion.clone().invert().multiply(dt.quaternion);return{x:e.x,y:e.y,z:e.z,w:e.w}})(),speed:Zt,throttle:Qt,recoveryAssist:ln,angleOfAttack:un,verticalSpeed:Ht.y,velocity:{x:Ht.x,y:Ht.y,z:Ht.z},grounded:dn,mode:Jt,bank:Yt,yawRate:Xt,position:{x:bt.x,y:bt.y,z:bt.z},heading:Math.atan2(Bt.x,-Bt.z),pitch:Math.atan2(Bt.y,Math.hypot(Bt.x,Bt.z)),controlPitch:Math.atan2(2*(St.w*St.x-St.y*St.z),1-2*(St.x**2+St.z**2)),orientation:{x:Ct.x,y:Ct.y,z:Ct.z,w:Ct.w},craftQuaternion:{x:dt.quaternion.x,y:dt.quaternion.y,z:dt.quaternion.z,w:dt.quaternion.w},craftScreen:{x:mn/2,y:hn/2},cameraPosition:{x:g.position.x,y:g.position.y,z:g.position.z},targetPosition:{x:e.x,y:e.y,z:e.z},targetRadius:fn<c.length?dh:fh,visibility:t,fieldOfView:{...gn},cameraClipping:{near:g.near,far:g.far},scenery:{visible:C.group.visible,...C.details},groundPattern:{...se.snapshot(),visible:t===`assisted`,centralPavingVisible:Ce.visible},abLane:oh(o.abStraights,bt),targetLocal:{x:Kt.x,y:Kt.y,z:Kt.z},landmarks:t===`assisted`?hh.map(e=>({...e,position:{...e.position}})):[]}}function Wn(){$t=m(),en=!1,nn=Object.freeze([]),bt.copy(s),St.identity(),Ct.identity(),dt.quaternion.identity(),Yt=0,kn(),dn=!1,Et.set(0,0,0),yn=null,bn=null,xn=null,Cn=0,wn=0,fn=0,pn=!1,Mn(),On(),jn()}function Gn(){if(U)return;U=!0;let e=new Set,t=new Set([A,I,L,P,F,Ye,Xe,Ze,Qe,$e,...rt.map(e=>e.stem.userData.legacyMaterial)]);[h,ct].forEach(n=>n.traverse(n=>{n.isInstancedMesh&&n.dispose(),n.geometry&&e.add(n.geometry),n.material&&(Array.isArray(n.material)?n.material:[n.material]).forEach(e=>t.add(e))})),e.forEach(e=>e.dispose()),t.delete(se.material),t.forEach(e=>e.dispose()),se.dispose(),nt.dispose(),ot.dispose(),p.dispose()}Fn(),Wn();function Kn(e){r=Km(e),xn=null,Fn(),On(),jn()}return{resize:Pn,update:Hn,getStatus:Un,reset:Wn,launchFlight:An,setVisibility:Rn,setGroundPatternStrength:zn,getPassObjects:Vn,setDisplay:In,setCameraMode:Kn,resetDisplayRotation:Ln,dispose:Gn}}var vh=e=>e&&[e.x,e.y,e.z].every(Number.isFinite);function yh({position:e,target:t,heading:n=0,range:r=60}={}){if(!vh(e)||!vh(t))return null;let i=Number.isFinite(n)?n:0,a=Number.isFinite(r)&&r>0?r:60,o=t.x-e.x,s=t.z-e.z,c=Math.hypot(o,s),l=Math.max(a,c),u=(o*Math.cos(i)+s*Math.sin(i))/l,d=(-o*Math.sin(i)+s*Math.cos(i))/l,f=t.y-e.y;return[u,d,c,f].every(Number.isFinite)?{x:u,y:d,distance:c,outside:c>a,height:f,elevation:Math.abs(f)<=1?`level`:f>0?`above`:`below`}:null}function bh(e,t,n=0){return e.left<t.right+n&&e.right>t.left-n&&e.top<t.bottom+n&&e.bottom>t.top-n}function xh({width:e,height:t,obstacles:n=[],size:r=100,inset:i=12}){let a=[i,e-i-r],o=[i,...n.flatMap(e=>[e.bottom+8,e.top-r-8]),t-i-r];for(let s of[...new Set(o)].sort((e,t)=>e-t))for(let o of a){let a={left:o,top:s,right:o+r,bottom:s+r};if(o>=i&&s>=i&&a.right<=e-i&&a.bottom<=t-i&&!n.some(e=>bh(a,e,6)))return a}return null}var Sh=`http://www.w3.org/2000/svg`,Ch=e=>document.getElementById(e),wh=(e,t)=>{let n=document.createElementNS(Sh,e);for(let[e,r]of Object.entries(t))n.setAttribute(e,r);return n};function Th(e,{visibility:t,phase:n,range:r,language:i=`en`}){let a=Ch(`radar`),o=document.getElementById(`app`).dataset.camera===`cockpit`;if(a.hidden=t!==`assisted`||n!==`running`||e.complete,a.hidden)return;let s=P(i)===`ja`;a.setAttribute(`aria-label`,s?`進行方向が上のレーダー。▲は上、▼は下`:`RADAR TRK UP. ▲ + ALT, ▼ − ALT`),a.querySelector(`.radar-heading`).textContent=F(i,`radarTrack`);let c=[`flight-essential-speed`,`flight-essential-altitude`,`bottom-panel`,`toast`,`practice-panel`].map(Ch).filter(e=>e&&!e.hidden&&e.getClientRects().length&&!(o&&e.id===`toast`)).map(e=>e.getBoundingClientRect());c.push(document.querySelector(`.navigation`).getBoundingClientRect(),document.querySelector(`.topbar`).getBoundingClientRect(),{left:innerWidth/2-40,right:innerWidth/2+40,top:innerHeight/2-40,bottom:innerHeight/2+40});let l=o?ce():{left:0,right:0},u=xh({width:innerWidth,height:innerHeight,obstacles:c,inset:Math.max(12,l.left+8,l.right+8)});if(!u){a.hidden=!0;return}a.style.left=`${u.left}px`,a.style.top=`${u.top}px`,a.dataset.range=r,a.dataset.heading=e.radarHeading,Ch(`radar-range`).textContent=`${r}m`;let d=Ch(`radar-targets`);d.replaceChildren();let f=[...e.navigationTargets||[]].sort((e,t)=>Number(e.next)-Number(t.next));for(let t of f){let n=yh({position:e.position,target:t.position,heading:e.radarHeading,range:r});if(!n)continue;let a=n.x*36,o=n.y*36,c=wh(`g`,{class:`radar-target${t.next?` radar-next`:``}${t.kind===`exit`?` radar-exit`:``}`,"data-id":t.id,"data-next":t.next,"data-outside":n.outside,"data-x":a,"data-y":o}),l=t.kind===`exit`?wh(`path`,{d:`M${a},${o-7}l7,7 -7,7 -7,-7Z`}):wh(`circle`,{cx:a,cy:o,r:t.next?4.5:2.5}),u=n.elevation===`above`?`▲`:n.elevation===`below`?`▼`:`＝`,f=t.kind===`exit`?`${F(i,`exit`)}${u}`:e.total>3&&!t.next?String(t.number):`${t.number}${u}${t.next?Math.round(Math.abs(n.height))+`m`:``}`,p=wh(`text`,{x:Math.max(-40,Math.min(40,a)),y:Math.max(-29,Math.min(32,o+(o<-20?12:-8))),"text-anchor":a>15?`end`:a<-15?`start`:`middle`});p.textContent=f;let m=wh(`title`,{});m.textContent=s?`${t.label}・${n.elevation===`level`?`同じ高さ`:(n.height>0?`上`:`下`)+Math.round(Math.abs(n.height))+`m`}・水平距離${Math.round(n.distance)}m`:`${I(t,i)} ${L(n.height,i,{digits:0})} ${Math.round(n.distance)}m`,c.append(m,l,p),d.append(c)}}function Eh(e,t,n=[]){let r=Ch(`radar`),i=[`flight-essential-speed`,`flight-essential-altitude`].map(Ch).filter(e=>e&&!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect()),a=[...r.hidden?[]:[r.getBoundingClientRect()],...i,...n],o=e=>({left:e.x-50,right:e.x+50,top:e.y-25,bottom:e.y+25});if(!a.some(t=>bh(o(e),t,6)))return e;let s=[...a.flatMap(t=>[{x:t.right+56,y:e.y},{x:t.left-56,y:e.y},{x:e.x,y:t.bottom+31},{x:e.x,y:t.top-31}]),{x:t.left,y:t.top},{x:t.right,y:t.top},{x:t.left,y:t.bottom},{x:t.right,y:t.bottom}].map(e=>({x:Math.max(t.left,Math.min(t.right,e.x)),y:Math.max(t.top,Math.min(t.bottom,e.y))}));return s.sort((t,n)=>Math.hypot(t.x-e.x,t.y-e.y)-Math.hypot(n.x-e.x,n.y-e.y)),s.find(e=>!a.some(t=>bh(o(e),t,6))&&!(e.x>innerWidth/2-100&&e.x<innerWidth/2+100&&e.y>innerHeight/2-75&&e.y<innerHeight/2+75))||e}var Dh=Object.freeze({stopClearance:0,lowClearance:5,dangerClearance:3.5,lowSeconds:3,dangerSeconds:1.5,meterClearance:12});function Oh(e){let t=Number.isFinite(e?.altitude),n=Number.isFinite(e?.verticalSpeed),r=t?Math.max(0,e.altitude):0,i=n&&e.verticalSpeed<0,a=t&&i?Math.min(Number.MAX_VALUE,Math.max(0,r-Dh.stopClearance)/-e.verticalSpeed):null,o;return o=e?.grounded===!0?`stopped`:t?r<=Dh.dangerClearance||a!==null&&a<=Dh.dangerSeconds?`danger`:r<=Dh.lowClearance||a!==null&&a<=Dh.lowSeconds?`low`:`clear`:`unknown`,{clearance:r,level:o,ratio:Math.max(0,Math.min(1,r/Dh.meterClearance)),known:t,descentKnown:n,descending:i,secondsToStop:a}}var kh=`0.1.29`,Ah=e=>e*Math.PI/180;function jh(e,t){let{deadzone:n,maxTilt:r,maxPitch:i}=zp(t);return Number.isFinite(e)?Math.sign(e)*Math.min(1,Math.max(0,(Math.abs(e)-n)/(r-n)))*Ah(i):0}function Mh(e,t,n,r=.3){if(![e,t,n].every(Number.isFinite)||n<=0)return 0;let i=zp({timeConstant:r}).timeConstant,a=Math.atan2(Math.sin(t-e),Math.cos(t-e))*-Math.expm1(-n/i)/n;return Math.max(-Up.pitchRate,Math.min(Up.pitchRate,a))}function Nh(e,{pitchMode:t=`angle`,steering:n=`tilt`,settings:r,currentPitch:i=0,dt:a=0}={}){let o=zp(r),s=im(e,1,n,o);if(t===`rate`)return s;let c=jh(e?.pitch,o);return{...s,pitchTarget:c,pitchRate:Mh(i,c,a,o.timeConstant)}}function Ph(e,t){return Object.keys(e).filter(n=>t[n]!==e[n].initial)}function Fh(e){return e.auto&&e.initial===0?`自動`:e.options?e.options[e.initial]:typeof e.initial==`boolean`?e.initial?`オン`:`オフ`:`${e.initial}${e.unit??``}`}function Ih(){let e=()=>({elapsedSeconds:0,groundContacts:0,recoverySeconds:0}),t={...e(),legs:0},n=e(),r=!0,i=!1,a=()=>{r&&(t.legs++,n=e(),r=!1,i=!1)};return{start:a,advance(e,r){if(!(!Number.isFinite(e)||e<=0)){a();for(let a of[t,n])a.elapsedSeconds+=e,r.recoveryAssist>0&&(a.recoverySeconds+=e),r.grounded&&!i&&a.groundContacts++;i=!!r.grounded}},restartLeg(){r=!0,i=!1},reset(){t={...e(),legs:0},n=e(),r=!0,i=!1},snapshot(){return{...t}},lastLegSnapshot(){return{...n}}}}function Lh({version:e,pitch:t,steer:n,display:r=`bank`,camera:i=`overlay`,result:a,settings:o,stats:s,lastLeg:c,mode:l=`flight`,view:u=`assisted`,feedback:d,input:f,segments:p,approaches:m,abStraights:h,passbys:g,courseTime:_,exitDiscovery:v,targetViews:y,course:b,stageSize:x,afterburner:S,launch:C=`browser`,fullscreen:w=!1}){let T=zp(o),E=[...t===`rate`?[...l===`flight`&&T.flightDirector?[]:[`maxPitch`],`timeConstant`]:[],...r===`fixed`?[]:[`displayTimeConstant`],...u===`assisted`?[]:[`radarRange`],...i!==`chase`||l!==`flight`?[`chaseTimeConstant`]:[]];if(E.push(...n===`twist`?[`maxSteerTilt`,`steerTiltDeadzone`]:[`maxSteerTwist`,`steerTwistDeadzone`]),(l!==`flight`||i!==`cockpit`)&&E.push(`ladderRange`,`cockpitFov`),u!==`assisted`&&E.push(`targetHeightGuide`,`streakAmount`,`groundPatternStrength`),l===`flight`&&!T.autoAfterburner&&E.push(`autoAfterburnerAngle`),l!==`flight`&&E.push(`speedFov`,`highSpeedShake`,`autoAfterburner`,`autoAfterburnerAngle`),l!==`flight`&&E.push(`flightDirector`,`targetHeadingCue`,`edgeGuidance`,`nextTargetNotice`,`audioGuidance`),l===`explore`)for(let e of[`deadzone`,`maxTilt`,`maxPitch`,`timeConstant`,`maxBank`,`turnGravity`,`displayTimeConstant`,`maxSteerTilt`,`maxSteerTwist`,`steerTiltDeadzone`,`steerTwistDeadzone`,`steerCurve`])E.includes(e)||E.push(e);return{version:e,mode:l,view:u,pitch:t,steer:n,launch:C===`installed`?`installed`:`browser`,fullscreen:!!w,camera:l===`flight`&&[`chase`,`cockpit`].includes(i)?i:`overlay`,display:r===`fixed`?`fixed`:`bank`,...[`clear`,`grounded`].includes(a)?{result:a}:{},settings:T,changedSettings:Ph(Lp,T),inactiveSettings:E,...d?{feedback:structuredClone(d)}:{},...f?{input:structuredClone(f)}:{},...p?{segments:structuredClone(p)}:{},...m?{approaches:structuredClone(m)}:{},...h?{abStraights:structuredClone(h)}:{},...g?{passbys:structuredClone(g)}:{},..._?{courseTime:structuredClone(_)}:{},...v?{exitDiscovery:structuredClone(v)}:{},...y?{targetViews:structuredClone(y)}:{},...b?{course:structuredClone(b)}:{},...x?{stageSize:structuredClone(x)}:{},...S?{afterburner:structuredClone(S)}:{},...s?{stats:{...s}}:{},...c?{lastLeg:{...c}}:{}}}var Rh=e=>JSON.stringify(e);function zh(e,{name:t,unit:n=``,initial:r=0,onReset:i,showValue:a=!1,readValue:o,restoreValue:s,formatValue:c,canUndo:l,isRestorable:u}={}){let d=Number(e.value),f=o?o():d,p=null,m=null,h=`twist.range-before.${e.id}`;try{let e=JSON.parse(localStorage.getItem(h));typeof e==`number`&&Number.isFinite(e)&&(p=e)}catch{}let g=document.createElement(`div`);g.className=`range-adjuster`,e.replaceWith(g);let _=(e,t,n)=>{let r=document.createElement(`button`);return r.type=`button`,r.textContent=e,r.setAttribute(`aria-label`,t),r.addEventListener(`click`,n),r},v=t=>{s?(t!==f&&(p=f),s(t),D(),O()):(e.value=String(t),e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})))},y=_(`−`,`${t}を1段階下げる`,()=>v(d-Number(e.step||1))),b=_(`＋`,`${t}を1段階上げる`,()=>v(d+Number(e.step||1)));g.append(y,e,b);let x=document.createElement(`div`);x.className=`range-drag-surface`,x.setAttribute(`aria-hidden`,`true`),g.append(x);let S=document.createElement(`div`);S.className=`range-history`;let C=document.createElement(`span`);C.dataset.rangeBefore=e.id;let w=document.createElement(`output`);w.htmlFor=e.id,w.hidden=!a;let T=_(`変更前へ`,`${t}を変更前の値へ戻す`,()=>v(p));T.dataset.rangeUndo=e.id;let E=_(`初期値`,`${t}だけ初期値へ戻す`,()=>{i?(p=f,i(),D(),O()):v(r)});E.dataset.rangeReset=e.id,S.append(w,C,T,E),g.after(S);function D(){try{localStorage.setItem(h,JSON.stringify(p))}catch{}}function O(){d=Number(e.value),f=o?o():d,w.textContent=`${Number(d.toFixed(2))}${n}`,C.textContent=p===null?`変更前：—`:`変更前：${c?c(p):Number(p.toFixed(2))+n}`,y.disabled=e.disabled||d<=Number(e.min),b.disabled=e.disabled||d>=Number(e.max);let t=p!==null&&(u?u(p):p>=Number(e.min)&&p<=Number(e.max));T.disabled=!(l?l():!e.disabled)||!t,E.disabled=e.disabled||f===r}e.addEventListener(`input`,()=>{let t=Number(e.value);t!==d&&(p=m?.logical??f),d=t,m||D(),O()}),x.addEventListener(`click`,e=>e.preventDefault()),x.addEventListener(`pointerdown`,t=>{e.disabled||t.button!==0||(t.preventDefault(),e.focus({preventScroll:!0}),x.setPointerCapture(t.pointerId),m={pointer:t.pointerId,x:t.clientX,y:t.clientY,value:d,logical:f,started:!1})}),x.addEventListener(`pointermove`,t=>{if(!m||m.pointer!==t.pointerId)return;let n=t.clientX-m.x,r=t.clientY-m.y;if(!m.started){if(Math.abs(n)<5||Math.abs(r)>Math.abs(n))return;m.started=!0}let i=Number(e.max)-Number(e.min),a=Math.max(20,e.getBoundingClientRect().width-20),o=Number(e.step||1);e.value=String(Math.round((m.value+n/a*i)/o)*o),e.dispatchEvent(new Event(`input`,{bubbles:!0}))});let k=t=>{m?.pointer===t.pointerId&&(m=null,D(),e.dispatchEvent(new Event(`change`,{bubbles:!0})))};return x.addEventListener(`pointerup`,k),x.addEventListener(`pointercancel`,k),x.addEventListener(`lostpointercapture`,k),e.addEventListener(`change`,D),O(),{sync:O,remember(){p=f,D(),O()}}}var Bh=Object.freeze({deadzone:`上げると小さな手ぶれを無視。下げると小さな傾きにも反応します。`,maxTilt:`上げると大きく傾けて操縦。下げると少しの傾きで最大になります。`,maxPitch:`上げると機首の動く幅が広がります。急な機首上げは速度を失いやすくなります。`,timeConstant:`上げるとなめらかにゆっくり追従。下げると素早く反応します。角度方式で使用します。`,steerTiltDeadzone:`上げると中立でまっすぐ飛びやすくなります。下げると小さなひねりにも反応します。`,maxSteerTilt:`上げると穏やかな旋回入力。下げると小さなひねりで翼が最大まで傾きます。`,steerTwistDeadzone:`回す方式の中立範囲です。上げると小さな回しを無視し、下げると敏感になります。`,maxSteerTwist:`回す方式で使用。上げると大きく回して操縦、下げると少しの回しで最大になります。`,steerCurve:`上げると中立近くを細かく操縦できます。1なら入力に比例して効きます。`,maxBank:`上げると翼が大きく傾き、鋭く旋回できます。下げると穏やかに曲がります。`,turnGravity:`大きいほど同じ翼の傾きで鋭く曲がります。初期値9.8。揚力や落下に使う重力3は変えません。`,displayTimeConstant:`固定表示の景色だけを調整。上げるとなめらかで遅め、下げるとすぐ追いつきます。`,chaseTimeConstant:`追尾3Dだけに使用。上げると斜めから機体を見やすく、0なら真後ろへすぐ追従します。`,ladderRange:`上げると角度線を多く表示。下げると機首の近くの線だけになり、すっきりします。`,cockpitFov:`自動を外して狭めると、機首の上下が大きく見えます。広げると見える範囲が増えます。`,radarRange:`上げると遠くまで表示。下げると近くの位置を細かく読めます。`,streakAmount:`空気が流れる線の量。0で消します。景色だけが変わり、飛行の計算には影響しません。`,groundPatternStrength:`地面の16m・4mの模様の濃さです。0で消します。見失い対策で使用し、接触の判定や飛行には影響しません。`,speedFov:`基準の視野に速度分だけ加えます。AB中はさらに広がります。0で両方停止。操縦席の基準設定は保持します。`,highSpeedShake:`高速時のごく小さな揺れです。操縦席では控えめ。酔いやすい場合はオフにできます。`,speedUnit:`実際の速さを換算します。10m/sは36km/h、約19.4kt。昇降はm/s、記録の最高速もm/sです。`,autoAfterburner:`初期値はオフ。大きな機首下げ入力を0.18秒保つとABが作動します。普段は画面の110%までドラッグします。`,autoAfterburnerAngle:`自動ABが作動するスマホの機首下げ角度。5度戻すと解除。機体の姿勢そのものではなく操縦入力を使います。`,targetHeightGuide:`目標の高さと、取れる高さの帯を表示します。高さに加えて左右の進路も合わせます。`,flightDirector:`進行方向の印を輪へ近づけて操縦します。輪は一度に左右15度・上下10度までを目安に導きます。自動操縦ではありません。`,targetHeadingCue:`方位の目盛りに次の目標を示します。目盛りの外は矢印と角度で知らせます。`,edgeGuidance:`画面の外の目標を、大きな矢印と距離で画面の縁に示します。`,nextTargetNotice:`光を取った直後、次の目標の方向と高さを1.8秒表示します。`,audioGuidance:`目標の左右から短い音を鳴らします。正面に近いほど間隔が短くなります。警告・昇降音・取得音を優先します。イヤホン向けです。`,hudLanguage:`飛行中の表示だけを切り替えます。開始・一時停止・調整・説明・結果は日本語のままです。`}),Vh=Object.freeze({sound:`すべての音のオン・オフです。開始前には音は出ません。`,volume:`全体の音量です。上げると効果音とBGMの両方が大きくなります。`,sfx:`エンジン・風・警告・取得・出口開放などの音を切り替えます。`,vario:`上昇は高く短い音、速い下降は低く長い音で知らせます。警告と取得音を優先します。`,bgm:`飛行中の曲のオン・オフです。ゴールの合図は効果音の設定に従います。`,bgmVolume:`BGMだけの音量です。警告が聞きづらいときは下げます。`,musicSet:`曲を選びます。追加3案はIgnition Sky・Steel Advance・Overdrive Horizonです。順番に聴く設定は飛び直すごとに次の曲へ進み、一時停止では同じ曲に戻ります。既存曲も残し、全10曲から選べます。`,abMusic:`AB中に次の拍から打楽器を重ねます。3秒以上保って小節の区切りで戻り、元の曲と再生位置は続きます。`,passbySound:`高速で柱や目標のそばを通ると短い風切り音が鳴ります。警告や取得音を優先します。振動は増えません。`,vibration:`ゲームの振動を切り替えます。対応する端末・ブラウザーで使えます。`,vibrationScale:`振動する時間の倍率です。モーターの強度を直接変える設定ではありません。`,engineVibration:`通常飛行とABの継続する震えを切り替えます。失速・取得・接地の振動は残ります。`,flightVibration:`細かな震えと従来の間隔を比較します。区別しづらいときは従来へ戻せます。`}),Hh=Object.freeze([{label:`高速の揺れが気になる → 揺れをオフ`,key:`highSpeedShake`,flight:!0},{label:`視野の変化が気になる → 速度による広がりを下げる`,key:`speedFov`,flight:!0},{label:`機首が敏感すぎる → 最大になる傾きを上げる`,key:`maxTilt`,flight:!0},{label:`大きく傾けないと機首が動かない → 最大になる傾きを下げる`,key:`maxTilt`,flight:!0},{label:`機首の反応が遅い → 追いつく時間を下げる`,key:`timeConstant`,angle:!0},{label:`機首が小刻みに動く → 追いつく時間を上げる`,key:`timeConstant`,angle:!0},{label:`上昇が難しい → 機首の最大角度を確認（出力も必要）`,key:`maxPitch`,angle:!0},{label:`失速しやすい → 機首の最大角度を下げる`,key:`maxPitch`,angle:!0},{label:`中立でも機首が動く → 中立範囲を上げる`,key:`deadzone`,flight:!0},{label:`旋回が敏感 → 最大になるひねり/回しを上げる`,key:`steerMaximum`,flight:!0},{label:`大きく傾けないと曲がらない → 最大になる入力を下げる`,key:`steerMaximum`,flight:!0},{label:`中立近くの旋回が難しい → カーブを上げる`,key:`steerCurve`,flight:!0},{label:`曲がりが急すぎる → 翼の最大角度を下げる`,key:`maxBank`,flight:!0},{label:`最大でも旋回が穏やか → 翼の最大角度を確認（上限40°）`,key:`maxBank`,flight:!0},{label:`固定表示の景色がガタガタ → ならしを上げる`,key:`displayTimeConstant`,fixed:!0},{label:`固定表示の景色が遅れる → ならしを下げる`,key:`displayTimeConstant`,fixed:!0},{label:`操縦席で機首の上下が読みにくい → 視野を狭める`,key:`cockpitFov`,cockpit:!0},{label:`角度線が多すぎる → 線の範囲を下げる`,key:`ladderRange`,cockpit:!0},{label:`近くの目標を細かく見たい → レーダーの半径を下げる`,key:`radarRange`,assisted:!0},{label:`遠い目標がレーダーの縁に集まる → 半径を上げる`,key:`radarRange`,assisted:!0},{label:`目標の高さを合わせたい → 高度の目印をオン`,key:`targetHeightGuide`,assisted:!0}]),Uh=`twist.course-bests.v1`,Wh=e=>e&&[e.x,e.y,e.z].every(Number.isFinite);function Gh(e,t=`flight`){if(!e||typeof e.id!=`string`||!/^[a-z][a-z0-9-]{0,31}$/.test(e.id)||!Array.isArray(e.lights)||![e.start,...e.lights,e.exit].every(Wh))return null;let n=JSON.stringify([e.start,...e.lights,e.exit]),r=2166136261;for(let e=0;e<n.length;e++)r=Math.imul(r^n.charCodeAt(e),16777619)>>>0;return`${t===`explore`?`explore`:`flight`}:${e.id}:${r.toString(16).padStart(8,`0`)}`}var Kh=e=>e&&Number.isFinite(e.seconds)&&e.seconds>0&&typeof e.completedAt==`string`;function qh(e,{now:t=()=>new Date().toISOString()}={}){let n=Object.create(null);try{let t=JSON.parse(e?.getItem(Uh));if(t?.version===1&&t.records&&typeof t.records==`object`&&!Array.isArray(t.records))for(let[e,r]of Object.entries(t.records))/^(flight|explore):[a-z][a-z0-9-]{0,31}:[0-9a-f]{8}$/.test(e)&&Kh(r)&&(n[e]={seconds:r.seconds,completedAt:r.completedAt})}catch{}return{best(e,t){let r=Gh(e,t);return r&&n[r]?n[r].seconds:null},complete(r,i,a){let o=Gh(r,i);if(!o||!Number.isFinite(a)||a<=0)return null;let s=n[o]?.seconds??null,c=s===null||a<s;c&&(n[o]={seconds:a,completedAt:t()});let l=!0;try{if(!e?.setItem)throw Error(`Storage unavailable`);e.setItem(Uh,JSON.stringify({version:1,records:n}))}catch{l=!1}return{courseId:r.id,courseKey:o,mode:i===`explore`?`explore`:`flight`,seconds:a,bestSeconds:n[o].seconds,previousBestSeconds:s,newBest:c,saved:l}}}}function Jh(e){if(!Number.isFinite(e)||e<0)return`—`;let t=Math.round(e*10);return`${Math.floor(t/600)}:${(t%600/10).toFixed(1).padStart(4,`0`)}`}var Y=e=>document.getElementById(e),Yh=e=>Object.entries(Lp).map(([t,n])=>`${n.label} ${n.options?n.options[e.settings[t]]:typeof n.initial==`boolean`?e.settings[t]?`オン`:`オフ`:n.auto&&e.settings[t]===0?`自動`:e.settings[t]+n.unit}${e.inactiveSettings.includes(t)?`（未使用）`:``}`).join(` / `);function Xh(e){let t;try{t=window.localStorage}catch{}let n=Vp(t),r=null,i={},a=null,o=document.createElement(`input`);o.type=`checkbox`,o.id=`cockpit-fov-auto`;for(let[t,r]of Object.entries(Lp)){let a=document.createElement(`label`);a.htmlFor=`setting-${t}`,a.dataset.settingKey=t;let s=document.createElement(`span`);s.textContent=r.label;let c=document.createElement(`output`);c.id=`setting-value-${t}`,c.htmlFor=a.htmlFor;let l=document.createElement(r.options?`select`:`input`);if(r.options){l.id=a.htmlFor;for(let[e,t]of Object.entries(r.options)){let n=document.createElement(`option`);n.value=e,n.textContent=t,l.append(n)}}else typeof r.initial==`boolean`?Object.assign(l,{type:`checkbox`,id:a.htmlFor}):Object.assign(l,{type:`range`,id:a.htmlFor,min:r.min,max:r.max,step:r.step});if(a.append(s,c,l),Y(`flight-settings-fields`).append(a),l.value=n[t],l.type===`range`&&(i[t]=zh(l,{name:r.label,unit:r.unit,initial:r.initial,...t===`cockpitFov`?{readValue:()=>n.cockpitFov,restoreValue:e=>{n={...n,cockpitFov:e},f()},formatValue:e=>e===0?`自動`:`${e}°`,canUndo:()=>e().mode===`flight`&&e().camera===`cockpit`,isRestorable:e=>e===0||e>=r.min&&e<=r.max}:{},onReset:()=>{n=Bp(n,t),f()}})),t===`cockpitFov`){let e=document.createElement(`label`);e.className=`cockpit-fov-auto`,e.dataset.settingKey=t,e.append(o,document.createTextNode(`視野を自動計算する`)),Y(`flight-settings-fields`).append(e)}l.addEventListener(`input`,()=>{n=zp({...n,[t]:r.options?l.value:l.type===`checkbox`?l.checked:Number(l.value)}),f()});let u=document.createElement(`small`);u.textContent=Bh[t],u.className=`setting-explanation`,u.id=`setting-help-${t}`,l.setAttribute(`aria-describedby`,u.id);let d=document.createElement(`small`);if(d.className=`setting-initial`,d.id=`setting-initial-${t}`,a.append(u,d),l.type===`checkbox`||r.options){let e=document.createElement(`button`);e.type=`button`,e.className=`setting-checkbox-reset`,e.textContent=`この項目だけ初期値へ`,e.dataset.checkboxReset=t,e.addEventListener(`click`,()=>{n=Bp(n,t),f()}),a.append(e)}}function l(){let t=e(),r=Em(innerWidth,innerHeight,t.view).vertical,a=Y(`setting-cockpitFov`);a.max=String(Math.floor(r*10)/10),a.value=String(n.cockpitFov===0?r:Math.min(r,n.cockpitFov)),o.checked=n.cockpitFov===0;let s=t.mode!==`flight`||t.camera!==`cockpit`;o.disabled=s,a.disabled=s||o.checked,Y(`setting-ladderRange`).disabled=s,Y(`setting-targetHeightGuide`).disabled=t.view!==`assisted`,Y(`setting-streakAmount`).disabled=t.view!==`assisted`,Y(`setting-groundPatternStrength`).disabled=t.view!==`assisted`,Y(`setting-autoAfterburnerAngle`).disabled=t.mode!==`flight`||!n.autoAfterburner,Y(`setting-value-cockpitFov`).textContent=o.checked?`自動（${r.toFixed(1)}°）`:`${Math.min(r,n.cockpitFov).toFixed(1)}°`;for(let e of Object.values(i))e.sync()}o.addEventListener(`change`,()=>{i.cockpitFov.remember(),n={...n,cockpitFov:o.checked?0:Math.floor(Em(innerWidth,innerHeight,e().view).vertical*10)/10},f()});function u(){for(let[e,t]of Object.entries(Lp)){typeof t.initial==`boolean`?Y(`setting-${e}`).checked=n[e]:Y(`setting-${e}`).value=n[e],Y(`setting-value-${e}`).textContent=typeof t.initial==`boolean`||t.options?``:`${n[e]}${t.unit}`;let r=n[e]!==t.initial,i=Y(`setting-initial-${e}`);i.hidden=!r,i.textContent=`● 初期値 ${Fh(t)}`,Y(`setting-${e}`).closest(`label`).dataset.changed=String(r);let a=document.querySelector(`[data-checkbox-reset="${e}"]`);a&&(a.hidden=!r)}l()}function d(){let t=e(),n=Y(`settings-troubles-list`);n.replaceChildren();for(let e of Hh){if((e.flight||e.angle||e.fixed||e.cockpit)&&t.mode!==`flight`||e.angle&&t.pitch!==`angle`||e.fixed&&t.display!==`fixed`||e.cockpit&&t.camera!==`cockpit`||e.assisted&&t.view!==`assisted`)continue;let r=e.key===`steerMaximum`?t.steer===`twist`?`maxSteerTwist`:`maxSteerTilt`:e.key,i=document.createElement(`button`);i.type=`button`,i.textContent=e.label,i.dataset.jumpSetting=r,i.addEventListener(`click`,()=>{let e=Y(`setting-${r}`),t=e.closest(`label`);for(let e of document.querySelectorAll(`.setting-highlight`))e.classList.remove(`setting-highlight`);t.classList.add(`setting-highlight`),t.scrollIntoView({block:`center`,behavior:`instant`}),r===`cockpitFov`&&e.disabled?o.focus({preventScroll:!0}):e.focus({preventScroll:!0})}),n.append(i)}}function f(){let e=Hp(t,n);Y(`settings-status`).textContent=e?`このブラウザーに保存しました。`:`保存できません。この画面を開いている間だけ使えます。`,u()}async function p(e,t){let n=Rh(e),r=Y(`${t}-copy-text`),i=Y(`${t}-copy-status`);try{await navigator.clipboard.writeText(n),i.textContent=`コピーしました。`,r.hidden=!0}catch{r.value=n,r.hidden=!1,r.focus(),r.select(),i.textContent=`自動コピーできません。下の文字列を選択してコピーしてください。`}}return Y(`settings-reset`).addEventListener(`click`,()=>{a={...n},Y(`settings-undo-reset`).hidden=!1,n=e().mode===`explore`?{...n,radarRange:Rp.radarRange,targetHeightGuide:!0,hudLanguage:`en`,speedUnit:Rp.speedUnit,streakAmount:Rp.streakAmount,groundPatternStrength:Rp.groundPatternStrength}:{...Rp},f()}),Y(`settings-undo-reset`).addEventListener(`click`,()=>{a&&(n=a,a=null,f(),Y(`settings-undo-reset`).hidden=!0)}),Y(`settings-copy`).addEventListener(`click`,()=>p(Lh({version:kh,...e(),settings:n,result:r?.result}),`settings`)),Y(`result-copy`).addEventListener(`click`,()=>{r&&p(r,`result`)}),u(),{getSettings:()=>n,setSetting(e,t){Object.hasOwn(Lp,e)&&(n=zp({...n,[e]:t}),f())},refreshLayout:()=>{l(),d()},report:(t,r,i)=>Lh({version:kh,...e(),settings:n,stats:t,lastLeg:i,result:r}),showResult(e){if(r=e,Y(`flight-result`).hidden=!e,Y(`result-copy-text`).hidden=!0,Y(`result-copy-status`).textContent=``,!e)return;let t=e.stats??{elapsedSeconds:0,groundContacts:0,recoverySeconds:0},n=e.mode===`flight`;Y(`result-flight-stats`).hidden=!n,Y(`result-title`).textContent=n?`今回の飛行記録`:`今回の探索記録`,Y(`flight-result`).setAttribute(`aria-label`,Y(`result-title`).textContent);let i=e.courseTime;Y(`result-course-time`).textContent=Number.isFinite(i?.seconds)?Jh(i.seconds):`未完了`,Y(`result-best-time`).textContent=Jh(i?.bestSeconds),Y(`result-best-status`).textContent=i?.newBest?i.saved===!1?`自己ベスト更新（この画面内のみ）`:`自己ベスト更新`:Number.isFinite(i?.bestSeconds)?`このコース・遊び方の記録`:`クリアすると自己ベストを保存します。`,Y(`result-record-note`).textContent=n?`合計は飛び直しも含み、最後の1回は飛び直しで区切ります。一時停止では区切りません。設定は到着・接地時点の値です。`:`コース時間は一時停止を除きます。自己ベストは探索モードの記録として、この端末に保存します。`;let a=e.exitDiscovery;Y(`result-exit-discovery`).textContent=a?.opened?a.firstVisibleSeconds===null?`未表示`:`${a.firstVisibleSeconds.toFixed(1)}秒`:`出口未開放`;let o=e.lastLeg||t;Y(`result-legs`).textContent=`${t.legs||1}回`,Y(`result-last-elapsed`).textContent=`${o.elapsedSeconds.toFixed(1)}秒`,Y(`result-last-contacts`).textContent=`${o.groundContacts}回`,Y(`result-last-recovery`).textContent=`${o.recoverySeconds.toFixed(1)}秒`,Y(`result-elapsed`).textContent=`${t.elapsedSeconds.toFixed(1)}秒`,Y(`result-contacts`).textContent=`${t.groundContacts}回`,Y(`result-recovery`).textContent=`${t.recoverySeconds.toFixed(1)}秒`,Y(`result-outcome`).textContent=e.result===`clear`?`クリア`:`墜落`,Y(`result-modes`).textContent=`pitch=${e.pitch} / steer=${e.steer} / display=${e.display} / camera=${e.camera}`,Y(`result-settings`).textContent=Yh(e);let l=e.afterburner,u=s(e.settings.speedUnit);Y(`result-afterburner`).hidden=!l,Y(`result-afterburner`).textContent=l?`AB ${l.uses}回・${l.seconds.toFixed(1)}秒 / ゲージ獲得 ${l.earned.toFixed(1)} / 最高速 ${c(l.maxSpeed,u).toFixed(1)} ${u}`:``,Y(`result-segments`).replaceChildren(...(e.segments??[]).map(e=>{let t=document.createElement(`div`);t.dataset.segmentId=e.id;let n=document.createElement(`dt`);n.textContent=e.label;let r=document.createElement(`dd`);return r.textContent=e.seconds===null?`未完了`:`${e.seconds.toFixed(1)}秒`,t.append(n,r),t})),Y(`result-approaches`).replaceChildren(...(e.segments??[]).map(e=>{let t=document.createElement(`div`);t.dataset.approachId=e.id;let n=document.createElement(`dt`);n.textContent=e.label;let r=document.createElement(`dd`);return r.textContent=`最接近 ${Number.isFinite(e.closestDistance)?e.closestDistance.toFixed(1)+`m`:`未到達`} / 近くの未取得通過 ${e.nearMisses??0}回`,t.append(n,r),t})),Y(`result-straights-heading`).hidden=!n||!e.abStraights?.length,Y(`result-straights`).hidden=!n||!e.abStraights?.length,Y(`result-straights`).replaceChildren(...(n?e.abStraights??[]:[]).map((e,t)=>{let n=document.createElement(`div`);n.dataset.straightId=e.id;let r=document.createElement(`dt`);r.textContent=`直線${t+1}（${Math.round(e.length)}m）`;let i=document.createElement(`dd`);return i.textContent=e.usedAfterburner?`AB ${e.afterburnerSeconds.toFixed(2)}秒`:`AB未使用`,n.append(r,i),n})),Y(`result-target-views`).replaceChildren(...(e.targetViews??[]).map((t,n)=>{let r=document.createElement(`div`);r.dataset.targetViewId=t.id;let i=document.createElement(`dt`);i.textContent=e.segments?.find(e=>e.id===t.id)?.label??`区間${n+1}`;let a=document.createElement(`dd`);return a.textContent=t.firstVisibleSeconds===null?`未表示`:`${t.firstVisibleSeconds.toFixed(1)}秒`,r.append(i,a),r}))},setPhase(t,n){Y(`flight-adjustments`).hidden=t!==`paused`;let r=e().steer===`twist`?[`maxSteerTilt`,`steerTiltDeadzone`]:[`maxSteerTwist`,`steerTwistDeadzone`];for(let e of Y(`flight-settings-fields`).querySelectorAll(`:scope > label`))e.hidden=n!==`flight`&&![`radarRange`,`targetHeightGuide`,`hudLanguage`,`speedUnit`,`streakAmount`,`groundPatternStrength`].includes(e.dataset.settingKey)||r.includes(e.dataset.settingKey);Y(`setting-chaseTimeConstant`).disabled=n!==`flight`||e().camera!==`chase`,l(),d(),Y(`flight-settings-help`).hidden=n!==`flight`,Y(`settings-reset`).textContent=n===`flight`?`操縦をすべて初期値へ`:`目印をすべて初期値へ`,Y(`adjustment-scope-note`).textContent=n===`flight`?`機首と旋回の入力角度を別々に調整します。選んだ旋回方式の項目だけ表示します。`:`レーダー・目標高度・速度単位・流線・地面の模様を調整します。探索の操縦には影響しません。`,t!==`paused`&&(Y(`flight-adjustments`).open=!1),[`running`,`intro`,`waiting`,`ready`].includes(t)&&this.showResult(null)}}}var Zh=(e,t,n)=>Math.min(n,Math.max(t,e));function Qh(e=0,t=10){let n=Math.asin(Math.sin((Number.isFinite(e)?e:0)*Math.PI/180))*180/Math.PI,r=Number.isFinite(t)?Zh(t,5,30):10;return Array.from({length:35},(e,t)=>t*5-85).filter(e=>e!==0&&Math.abs(e-n)<=r+1e-8)}function $h(e=0){let t=Number.isFinite(e)?e:0;return{speed:t,direction:Math.abs(t)<.15?`level`:t>0?`up`:`down`,length:Math.abs(t)<.15?0:Zh(Math.abs(t)/5*46,6,46)}}function eg(e=0,t=!0){if(!t||!Number.isFinite(e))return{active:!1,hz:0,periodMs:1e3,onMs:0};if(e>=.3){let t=Zh(e,.3,8),n=Zh(720-t*75,150,700);return{active:!0,hz:480+t*95,periodMs:n,onMs:Math.min(110,n*.4)}}return e<=-2?{active:!0,hz:Zh(170+(e+2)*8,90,170),periodMs:1500,onMs:1150}:{active:!1,hz:0,periodMs:1e3,onMs:0}}var tg=e=>Number.isFinite(e)?e:0,ng=e=>new q(tg(e?.x),tg(e?.y),tg(e?.z)),rg=e=>new K(tg(e?.x),tg(e?.y),tg(e?.z),Number.isFinite(e?.w)?e.w:1).normalize();function ig(e={}){return{speed:tg(e.speed),altitude:tg(e.groundClearance),heading:(W.radToDeg(tg(e.heading))%360+360)%360,pitch:W.radToDeg(tg(e.controlPitch)),verticalSpeed:tg(e.verticalSpeed),power:Math.round(tg(e.throttle)*100)}}function ag(e,t,n,{ladderRange:r=10}={}){let i=rg(e.cameraQuaternion).invert().multiply(rg(e.worldQuaternion)),a=n/(2*Math.tan(W.degToRad(e.fieldOfView.vertical)/2));function o(e){let r=ng(e).applyQuaternion(i);return{x:t/2+a*r.x/-r.z,y:n/2-a*r.y/-r.z,inFront:r.z<-1e-6,local:r}}let s=new q(0,1,0).applyQuaternion(i),c={a:s.x,b:-s.y,c:-a*s.z},l=o(new q(0,0,-1).applyQuaternion(rg(e.orientation))),u=ng(e.velocity),d=u.length()>.05?o(u):null,f=[];for(let t of Qh(W.radToDeg(tg(e.controlPitch)),r)){let n=W.degToRad(t);for(let r of[-1,1]){let i=[];for(let t=0;t<=10;t++){let a=tg(e.heading)+r*W.degToRad(2+t*.5),s=o({x:Math.sin(a)*Math.cos(n),y:Math.sin(n),z:-Math.cos(a)*Math.cos(n)});s.inFront&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&i.push(s)}i.length===11&&f.push({degrees:t,side:r,points:i})}}return{f:a,q:i,horizon:c,nose:l,flightPath:d,lines:f}}function og({a:e,b:t,c:n},r,i){let a=[],o=(e,t)=>{Number.isFinite(e)&&Number.isFinite(t)&&e>=-.01&&e<=r+.01&&t>=-.01&&t<=i+.01&&!a.some(n=>Math.hypot(n.x-e,n.y-t)<.01)&&a.push({x:e,y:t})};if(Math.abs(t)>1e-9)for(let a of[0,r])o(a,i/2-(e*(a-r/2)+n)/t);if(Math.abs(e)>1e-9)for(let a of[0,i])o(r/2-(t*(a-i/2)+n)/e,a);return a.slice(0,2)}var sg=e=>e&&[`x`,`y`,`z`].every(t=>Number.isFinite(e[t]));function cg(e={}){let{position:t,targetPosition:n,targetRadius:r,velocity:i}=e;if(!sg(t)||!sg(n)||!Number.isFinite(r)||r<=0||t.y<0||n.y<0)return null;let a=t.y,o=Math.max(0,n.y-r),s=n.y+r,c=n.y-a,l=a>=o&&a<=s,u=l?`level`:a<o?`up`:`down`,d=n.x-t.x,f=n.z-t.z,p=Math.hypot(d,f),m=null,h=null,g=!1;if(sg(i)){let e=p>1e-6?(i.x*d+i.z*f)/p:0;p<=r?m=0:e>.2&&(m=(p-r)/e);let t=u===`up`?o-a:a-s,n=u===`up`?i.y:-i.y;h=l?0:n>0?t/n:null,g=!l&&m!==null&&m<=10&&(h===null||h>m)}let _=Math.max(0,Math.floor(Math.min(a-10,o-2)/5)*5),v=Math.ceil(Math.max(a+10,s+2,_+20)/5)*5,y=e=>95-(e-_)/(v-_)*90;return{target:n.y,radius:r,lower:o,upper:s,altitude:a,delta:c,inside:l,direction:u,urgent:g,arrivalSeconds:m,entrySeconds:h,scale:{min:_,max:v,currentY:y(a),targetY:y(n.y),upperY:y(s),lowerY:y(o)}}}var lg=e=>document.getElementById(e),ug=e=>Number.isInteger(e)?String(e):e.toFixed(1);function dg(e,t=!1){let n=e.scale;return`<svg class="height-band" viewBox="0 0 58 100" preserveAspectRatio="none" aria-hidden="true"><path class="height-axis" d="M44,4V96"/><rect class="height-band-range" x="44" y="${n.upperY}" width="12" height="${n.lowerY-n.upperY}"/><path class="height-target" d="M42,${n.targetY}H58"/><path class="height-current" d="M35,${n.currentY}L43,${n.currentY-4}V${n.currentY+4}Z"/>${t?``:`<text x="2" y="${Math.min(92,n.upperY+3)}">${ug(e.upper)}</text><text x="2" y="${Math.max(10,n.lowerY+3)}">${ug(e.lower)}</text>`}</svg>`}function fg(e,{phase:t,visibility:n,enabled:r,cockpit:i,language:a=`en`,inlineParent:o=null}){let s=r&&n===`assisted`&&t===`running`&&!e.complete?cg(e):null,c=lg(`target-height-inline`),l=lg(`cockpit-target-height`),u=o||(e.mode===`flight`?document.querySelector(`.throttle-heading`):document.querySelector(`.flight-line`));if(c.parentElement!==u&&u.append(c),c.hidden=!s||i,l.hidden=!s||!i,lg(`app`).dataset.targetHeight=JSON.stringify(s),!s)return null;let d=P(a)===`ja`,f=L(s.delta,a),p=s.inside?F(a,`heightOkay`):s.urgent?F(a,s.direction===`up`?`climb`:`descend`):f;for(let e of[c,l]){e.dataset.heightState=s.inside?`inside`:s.urgent?`urgent`:`outside`,e.setAttribute(`aria-label`,d?`現在高度 ${s.altitude.toFixed(1)}m、目標高度 ${ug(s.target)}m、取得できる高さの範囲 ${ug(s.lower)}〜${ug(s.upper)}m、差 ${f}。${p}。進路も目標へ合わせてください。`:`ALT ${s.altitude.toFixed(1)}m, TGT ALT ${ug(s.target)}m, ALT BAND ${ug(s.lower)}–${ug(s.upper)}m, ${f}. ${p}.`);let t=s.inside?F(a,`heightOkay`):s.urgent?d?`早めに${s.direction===`up`?`▲`:`▼`}`:F(a,s.direction===`up`?`climb`:`descend`):``,n=e===c&&o?``:`<strong class="current-height">${d?`現在`:`ALT `}${s.altitude.toFixed(1)}m</strong>　`,r=`${e===c?dg(s,!0):``}<span><b>${n}${F(a,`targetAltitude`)} ${ug(s.target)}m</b><small>${f}${t?`　${t}`:``}</small></span>`;e._heightMarkup!==r&&(e.innerHTML=r,e._heightMarkup=r)}return s}var pg=e=>document.getElementById(e),mg=e=>`${e.x.toFixed(2)},${e.y.toFixed(2)}`,hg=e=>e.map((e,t)=>`${t?`L`:`M`}${mg(e)}`).join(` `),gg=e=>e.toFixed(1),_g=(e,t,n,r,i)=>Object.assign(e.style,{left:`${t}px`,top:`${n}px`,width:`${r}px`,height:`${i}px`});function vg(e){let t=pg(`cockpit-hud`);if(t.hidden=!e,!e)return;let n=innerWidth,r=innerHeight,i=ce(),a=pg(`bottom-panel`).getBoundingClientRect(),o=pg(`radar`).getBoundingClientRect(),s=!pg(`radar`).hidden,c=document.querySelector(`.navigation`).getBoundingClientRect().bottom+10,l=Math.max(r/2-65,s?o.bottom+10:0),u=Math.max(60,Math.min(130,a.top-l-12)),d=a.top-30,f=n/2-90;return s&&o.top<c+28&&o.bottom>c&&o.left<f+180&&o.right>f&&(f=o.left<n/2?o.right+10:o.left-190),f=Math.max(i.left+12,Math.min(n-i.right-192,f)),_g(pg(`cockpit-heading`),f,c,180,28),_g(pg(`cockpit-target-height`),f,c+32,180,32),_g(pg(`cockpit-exit-notice`),f,c+68,180,24),_g(pg(`cockpit-speed`),i.left+12,l,58,u),_g(pg(`cockpit-altitude`),n-i.right-92,l,58,u),_g(pg(`cockpit-vario`),n-i.right-28,l,16,u),_g(pg(`cockpit-power`),n/2-104,d,208,24),{w:n,h:r,compassY:c,powerY:d,insets:i}}function yg(e,t,n=vg(t),r={},i=null){if(!t||!n)return;let a=pg(`cockpit-hud`),o=P(r.hudLanguage);a.setAttribute(`aria-label`,o===`ja`?`操縦席の飛行表示`:`FLIGHT HUD`);let{w:l,h:u,compassY:d,powerY:f,insets:p}=n,m=ig(e),h=(e,t,n,r,i=``)=>{let a=Math.round(e/t)*t;return`<span>${n} ${r}</span><small>${Math.max(0,a+t)}</small><strong>${gg(e)}</strong><small>${Math.max(0,a-t)}</small>${i}`};pg(`cockpit-speed`).innerHTML=h(c(m.speed,r.speedUnit),s(r.speedUnit)===`km/h`?10:s(r.speedUnit)===`kt`?5:2,F(o,`speed`),s(r.speedUnit)),pg(`cockpit-altitude`).innerHTML=i?`<span>${F(o,`altitude`)} m</span><div class="height-tape-scale">${dg(i)}<strong style="top:${Math.max(16,Math.min(84,i.scale.currentY))}%">${gg(m.altitude)}</strong></div>`:h(m.altitude,5,F(o,`altitude`),`m`),pg(`cockpit-altitude`).dataset.heightState=i?.inside?`inside`:i?.urgent?`urgent`:`outside`;let g=$h(m.verticalSpeed),_=50+(g.direction===`up`?-g.length:g.length),v=g.length?`<path class="vario-bar" d="M8,50V${_}"/><path d="M3,${_+(g.direction===`up`?6:-6)}L8,${_}L13,${_+(g.direction===`up`?6:-6)}"/>`:``;pg(`cockpit-vario`).innerHTML=`<svg viewBox="0 0 16 100" preserveAspectRatio="none" aria-hidden="true"${o===`ja`?``:` style="height:calc(100% - 34px)"`}><path class="vario-axis" d="M8,3V97M1,50H15"/>${v}</svg><span>${g.speed>=0?`+`:``}${gg(g.speed)}</span><small>${o===`ja`?`m/s`:`V/S<br>m/s`}</small>`,pg(`cockpit-vario`).dataset.direction=g.direction,pg(`cockpit-vario`).dataset.length=String(g.length),pg(`cockpit-vario`).setAttribute(`aria-label`,o===`ja`?`昇降速度 ${g.direction===`up`?`上昇`:g.direction===`down`?`下降`:`水平`} ${gg(Math.abs(g.speed))}m/s`:`V/S ${g.speed>=0?`+`:`−`}${gg(Math.abs(g.speed))}m/s`);let y=Math.round(m.heading);pg(`cockpit-heading`).innerHTML=o===`ja`?`<span>${(y+350)%360} ┃ ${(y+355)%360} ┃ <strong>${y%360}°</strong> ┃ ${(y+5)%360} ┃ ${(y+10)%360}</span>`:`<span>HDG ${(y+350)%360}│${(y+355)%360}│<strong>${y%360}°</strong>│${(y+5)%360}│${(y+10)%360}</span>`;let b=re(e,Oh(e),o),x=pg(`cockpit-power`),S=`<span>${b}</span>`;x.innerHTML!==S&&(x.innerHTML=S);let C=ag(e,l,u,r),w=og(C.horizon,l,u),T=p.left+82,E=l-p.right-102,D=d+(pg(`cockpit-exit-notice`).hidden?pg(`cockpit-target-height`).hidden?38:70:98),O=Math.max(D+20,f-8),k=`M${T},${D}H${E}V${O}H${T}Z`;for(let e of[pg(`target-edge-marker`),pg(`cockpit-objective-label`),pg(`practice-panel`)].filter(e=>!e.hidden&&e.getClientRects().length)){let t=e.getBoundingClientRect(),n=Math.max(T,t.left-4),r=Math.min(E,t.right+4),i=Math.max(D,t.top-4),a=Math.min(O,t.bottom+4);n<r&&i<a&&(k+=`M${n},${i}H${r}V${a}H${n}Z`)}let A=C.lines.map(e=>{let t=e.points[0],n=e.points.at(-1),r=Math.atan2(n.y-t.y,n.x-t.x)*180/Math.PI;return r>90&&(r-=180),r<-90&&(r+=180),`<g class="cockpit-ladder${e.degrees<0?` cockpit-ladder-below`:``}" data-pitch-level="${e.degrees}"><path d="${hg(e.points)}" ${e.degrees<0?`stroke-dasharray="4 5"`:``}/><text x="${n.x}" y="${n.y-4}" transform="rotate(${r} ${n.x} ${n.y})">${e.degrees}</text></g>`}).join(``),j=C.nose,M=``;if(C.flightPath){let e=C.flightPath,t=e.x,n=e.y,r=e.inFront&&t>=T+22&&t<=E-22&&n>=D+22&&n<=O-22;if(!r){let r=Math.hypot(e.local.x,e.local.y)<1e-6?1:e.local.x,i=-e.local.y,a=Math.hypot(r,i)||1,o=Math.max(10,Math.min((E-T)/2-24,(O-D)/2-24));t=(T+E)/2+r/a*o,n=(D+O)/2+i/a*o}let i=Math.atan2(C.horizon.a,-C.horizon.b)*180/Math.PI;M=`<g class="flight-path${Math.hypot(e.x-j.x,e.y-j.y)>24?` flight-path-separated`:``}" data-flight-path="${r?`visible`:`edge`}" transform="translate(${t} ${n}) rotate(${i})"><circle r="10"/><path d="M-21,0H-10M10,0H21M0,-10V-19"/>${r?``:`<text x="14" y="-14">${F(o,`flightPath`)}</text>`}</g>`}pg(`cockpit-conformal`).setAttribute(`viewBox`,`0 0 ${l} ${u}`),pg(`cockpit-conformal`).innerHTML=`<defs><clipPath id="cockpit-clip"><path d="${k}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#cockpit-clip)">${w.length===2?`<path id="cockpit-horizon" d="${hg(w)}"/>`:``}${A}<g data-boresight transform="translate(${j.x} ${j.y})"><path d="M-17,0H-6L0,5L6,0H17M0,-6V-2"/></g>${M}</g>`,a.dataset.readings=JSON.stringify(m),a.dataset.horizon=JSON.stringify(C.horizon)}var bg=e=>Number.isInteger(e)&&e>=3&&e<=8,xg=e=>Array.from({length:e+1},(t,n)=>({id:n===0?`start-light1`:n===e?`light${e}-exit`:`light${n}-light${n+1}`,label:n===0?`開始→光1`:n===e?`光${e}→出口`:`光${n}→光${n+1}`}));Object.freeze(xg(3));function Sg(e=3){let t=bg(e)?e:3,n=xg(t),r=0,i=Array(t+1).fill(null),a=!1,o=0,s=null,c=0,l=0,u=Array(t+1).fill(null),d=!1;return{reset(e=t){bg(e)&&(t=e),n=xg(t),r=0,i=Array(t+1).fill(null),a=!1,o=0,s=null,c=0,l=0,u=Array(t+1).fill(null),d=!1},advance(e,n={}){if(!Number.isFinite(e)||e<0||i[t]!==null||(typeof n==`object`&&n||(n={}),n.total!==void 0&&n.total!==t))return;let f=Number.isInteger(n.collected)&&n.collected>=0&&n.collected<=t,p=f?n.collected:0;if(!d){let r=f&&p===c;if(f&&p>c?(c=p,l=0):l+=e,f&&p>=c){let e=p===t&&n.complete===!0;(!e||r)&&u[c]===null&&n.targetVisible===!0&&(u[c]=l),e&&(d=!0)}}if(a&&s===null&&(o+=e),p===t&&(a=!0),a&&s===null&&n.exitVisible===!0&&(s=o),e!==0){r+=e;for(let e=0;e<p;e++)i[e]===null&&(i[e]=r);n.complete&&p===t&&(i[t]=r)}},snapshot:()=>n.map((e,t)=>({...e,seconds:i[t]===null?null:i[t]-(t?i[t-1]:0)})),exitSnapshot:()=>({opened:a,firstVisibleSeconds:s}),targetViewsSnapshot:()=>n.map(({id:e},t)=>({id:e,firstVisibleSeconds:u[t]}))}}var Cg=e=>e&&[e.x,e.y,e.z].every(Number.isFinite),wg=(e,t)=>Math.hypot(e.x-t.x,e.y-t.y,e.z-t.z);function Tg(e,t,n){if(!Cg(e)||!Cg(t)||!Cg(n))return null;let r=t.x-e.x,i=t.y-e.y,a=t.z-e.z,o=r*r+i*i+a*a,s=o?Math.max(0,Math.min(1,((n.x-e.x)*r+(n.y-e.y)*i+(n.z-e.z)*a)/o)):0;return Math.hypot(e.x+r*s-n.x,e.y+i*s-n.y,e.z+a*s-n.z)}function Eg(e=3){let t=e,n=[],r=null,i=!1,a=e=>{t=Number.isInteger(e)&&e>=3&&e<=8?e:3,n=Array.from({length:t+1},()=>({closestDistance:null,nearMisses:0,nearMissRadius:15,visiting:!1})),r=null,i=!1};a(t);function o(e,t,r,i,a){let o=n[e];if(!o||!Cg(i))return;let s=Tg(t,r,i);s!==null&&(o.closestDistance=o.closestDistance===null?s:Math.min(o.closestDistance,s),a?o.visiting=!1:(s<=15&&(o.visiting=!0),o.visiting&&wg(r,i)>=18&&(o.nearMisses++,o.visiting=!1)))}return{reset:a,advance(e,n={}){if(i||!Number.isFinite(e)||e<0||n.total!==t||!Cg(n.position)||!Cg(n.targetPosition)||!Number.isInteger(n.collected)||n.collected<0||n.collected>t)return;let a=n.collected,s={...n.position},c={...n.targetPosition};if(r){let e=a>r.index||n.complete===!0;o(r.index,r.position,s,r.target,e),a!==r.index&&!n.complete&&o(a,s,s,c,!1)}else o(a,s,s,c,n.complete===!0);r={index:a,position:s,target:c},i=n.complete===!0},snapshot:()=>n.map(({visiting:e,...t})=>({...t}))}}var Dg=e=>e&&[e.x,e.y,e.z].every(Number.isFinite);function Og(e,t,n){if(!e||!Dg(e.from)||!Dg(e.to)||!Dg(t)||!Dg(n)||!Number.isFinite(e.width)||e.width<=0||!Number.isFinite(e.heightTolerance)||e.heightTolerance<=0)return 0;let r=e.to.x-e.from.x,i=e.to.z-e.from.z,a=Math.hypot(r,i);if(!a)return 0;let o=t=>{let n=t.x-e.from.x,o=t.z-e.from.z,s=(n*r+o*i)/a;return[s,(n*i-o*r)/a,t.y-e.from.y-(e.to.y-e.from.y)*s/a]},s=o(t),c=o(n),l=[[0,a],[-e.width/2,e.width/2],[-e.heightTolerance,e.heightTolerance]],u=0,d=1;for(let e=0;e<3;e++){let t=c[e]-s[e],[n,r]=l[e];if(Math.abs(t)<1e-12){if(s[e]<n||s[e]>r)return 0;continue}let i=(n-s[e])/t,a=(r-s[e])/t;if(u=Math.max(u,Math.min(i,a)),d=Math.min(d,Math.max(i,a)),u>=d)return 0}return Math.max(0,d-u)}function kg(e=[]){let t=[],n=[],r=null,i=e=>{t=Array.isArray(e)?e:[],n=t.map(e=>({id:e.id,length:Math.hypot(e.to.x-e.from.x,e.to.z-e.from.z),usedAfterburner:!1,afterburnerSeconds:0})),r=null};return i(e),{reset:i,advance({position:e,afterburner:i,afterburnerMotion:a=[]}={}){if(!Dg(e))return;let o=Number.isFinite(i?.seconds)?Math.max(0,i.seconds):0;if(r&&Array.isArray(a)){let e=Math.max(0,o-r.seconds);for(let r of a){if(!e)break;if(!Dg(r?.from)||!Dg(r.to)||!Number.isFinite(r.seconds)||r.seconds<=0)continue;let i=Math.min(e,r.seconds);e-=i,t.forEach((e,t)=>{let a=Og(e,r.from,r.to);a>0&&(n[t].usedAfterburner=!0,n[t].afterburnerSeconds+=i*a)})}}r={position:{...e},seconds:o}},snapshot:()=>n.map(e=>({...e}))}}var Ag=e=>e&&[e.x,e.y,e.z].every(Number.isFinite);function jg(){let e=null,t=new Map,n=0,r=-1/0,i=0;return{reset(){e=null,t=new Map,n=0,r=-1/0,i=0},advance(a,{position:o,speed:s=0,velocity:c={x:0,z:-1},objects:l=[]}={}){if(!Number.isFinite(a)||a<0||!Ag(o))return[];n+=a;let u=e??o;e={...o};let d=new Set,f=[];for(let e of l){if(typeof e?.id!=`string`||!Ag(e.position))continue;d.add(e.id);let n=20+(Number.isFinite(e.radius)?Math.max(0,e.radius):0),r=Tg(u,o,e.position),i=Math.hypot(o.x-e.position.x,o.y-e.position.y,o.z-e.position.z),l=t.get(e.id);if(l||(l={used:!1},t.set(e.id,l)),r<=n&&!l.used&&(l.used=!0,a>0&&Number.isFinite(s)&&s>=12)){let t=Number.isFinite(c.x)?c.x:0,n=Number.isFinite(c.z)?c.z:-1,i=Math.sign((e.position.x-o.x)*-n+(e.position.z-o.z)*t);f.push({id:e.id,speed:s,distance:r,side:i})}i>n+4&&(l.used=!1)}for(let e of t.keys())d.has(e)||t.delete(e);return!f.length||n-r<.3?[]:(f.sort((e,t)=>e.distance-t.distance),r=n,i++,[f[0]])},snapshot:()=>({count:i})}}var Mg=`twist.radar-upgrade.v1`;function Ng(e,t=e){let n,r=!1;try{n=JSON.parse(e?.getItem(`twist.flight-settings.v1`)),r=t?.getItem(Mg)===`shown`}catch{}if(r||n?.radarRange!==60)return null;let i=!1;return{current:60,next:180,shown(){if(!i){i=!0;try{t?.setItem(Mg,`shown`)}catch{}}}}}function Pg(e){let{target:t,verticalFov:n,width:r,height:i,bounds:a,near:o=.1,far:s=250}=e??{};if(!t||![t.x,t.y,t.z].every(Number.isFinite)||!Number.isFinite(r)||r<=0||!Number.isFinite(i)||i<=0||!Number.isFinite(n)||n<=0||n>=180||!a||![a.left,a.right,a.top,a.bottom].every(Number.isFinite)||a.left>=a.right||a.top>=a.bottom||!Number.isFinite(o)||o<=0||!Number.isFinite(s)||s<=o)return!1;let c=-t.z;if(c<o||c>s)return!1;let l=i/2/Math.tan(n*Math.PI/360);if(!Number.isFinite(l))return!1;let u=r/2+t.x/c*l,d=i/2-t.y/c*l;return Number.isFinite(u)&&Number.isFinite(d)&&u>=0&&u<=r&&d>=0&&d<=i&&u>=a.left&&u<=a.right&&d>=a.top&&d<=a.bottom}var Fg=(e,t,n=4)=>e.left<t.right+n&&e.right>t.left-n&&e.top<t.bottom+n&&e.bottom>t.top-n,Ig=(e,t,n,r)=>({left:e-n/2,right:e+n/2,top:t-r/2,bottom:t+r/2}),Lg=e=>e&&[`left`,`right`,`top`,`bottom`].every(t=>Number.isFinite(e[t]))&&e.left<e.right&&e.top<e.bottom;function Rg({target:e,width:t,height:n,verticalFov:r,bounds:i,obstacles:a=[]}={}){if(!Lg(i))return null;let o=km({target:e,width:t,height:n,verticalFov:r,bounds:i}),s=o.inView&&a.some(e=>Fg(Ig(o.x,o.y,32,32),e));if(o.inView&&!s)return{...o,kind:`point`};if(!o.visible&&!s)return null;let c=[o];if(s)for(let e of a)c.push({x:e.left-22,y:o.y},{x:e.right+22,y:o.y},{x:o.x,y:e.top-22},{x:o.x,y:e.bottom+22});for(let e=i.left;e<=i.right;e+=20)c.push({x:e,y:i.top},{x:e,y:i.bottom});for(let e=i.top;e<=i.bottom;e+=20)c.push({x:i.left,y:e},{x:i.right,y:e});c.push({x:i.right,y:i.bottom},{x:i.right,y:i.top}),c.sort((e,t)=>Math.hypot(e.x-o.x,e.y-o.y)-Math.hypot(t.x-o.x,t.y-o.y));let l=c.find(e=>e.x>=i.left&&e.x<=i.right&&e.y>=i.top&&e.y<=i.bottom&&!a.some(t=>Fg(Ig(e.x,e.y,32,32),t)));if(!l)return null;let u=s?(Math.atan2(o.x-l.x,-(o.y-l.y))*180/Math.PI+360)%360:o.rotation;return{...o,visible:!0,x:l.x,y:l.y,rotation:u,kind:`edge`,occluded:s}}function zg(e,{bounds:t,obstacles:n=[],width:r=116,height:i=34}={}){if(!e||!Lg(t))return null;let a=[{x:e.x+22,y:e.y-i/2},{x:e.x-22-r,y:e.y-i/2},{x:e.x-r/2,y:e.y-22-i},{x:e.x-r/2,y:e.y+22}],o=Ig(e.x,e.y,34,34),s=e=>e.x>=t.left&&e.x+r<=t.right&&e.y>=t.top&&e.y+i<=t.bottom&&![o,...n].some(t=>Fg({left:e.x,right:e.x+r,top:e.y,bottom:e.y+i},t)),c=a.find(s);if(c)return c;for(let e=t.top;e+i<=t.bottom;e+=24)for(let n=t.left;n+r<=t.right;n+=24)if(s({x:n,y:e}))return{x:n,y:e};return null}var Bg=e=>document.getElementById(e),Vg=null,Hg=``;function Ug(e){if(Vg=null,!e)return;let{w:t,h:n,compassY:r,powerY:i,insets:a}=e,o=r+(Bg(`cockpit-exit-notice`).hidden?70:98),s={left:a.left+82,right:t-a.right-102,top:o,bottom:i-8};Vg={w:t,h:n,area:s,bounds:{left:s.left+17,right:s.right-17,top:s.top+17,bottom:s.bottom-17},obstacles:[`radar`,`flight-essential-speed`,`flight-essential-altitude`,`cockpit-speed`,`cockpit-altitude`,`cockpit-vario`,`cockpit-heading`,`cockpit-target-height`,`cockpit-exit-notice`,`practice-panel`].map(Bg).filter(e=>e&&!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect())}}function Wg(e,t,{language:n=`en`}={}){let r=Bg(`cockpit-objective`),i=Bg(`cockpit-objective-label`);if(!t||!Vg||e.visibility!==`assisted`||e.complete){r.setAttribute(`hidden`,``),i.hidden=!0;return}let{w:a,h:o,area:s,bounds:c,obstacles:l}=Vg,u=Rg({target:e.targetLocal,width:a,height:o,verticalFov:e.fieldOfView.vertical,bounds:c,obstacles:l});if(!u){r.setAttribute(`hidden`,``),i.hidden=!0;return}let d=e.collected===e.total;r.removeAttribute(`hidden`),r.setAttribute(`viewBox`,`0 0 ${a} ${o}`),r.dataset.kind=u.kind,r.dataset.target=d?`exit`:`light`,r.dataset.x=String(u.x),r.dataset.y=String(u.y),r.dataset.behind=String(u.behind),r.dataset.occluded=String(!!u.occluded);let f=u.kind===`edge`?`<path d="M0,-14L10,8 0,3 -10,8Z"/>`:d?`<path d="M-14,-6V-14H-6M6,-14H14V-6M14,6V14H6M-6,14H-14V6M-7,9V-8H7V9"/>`:`<path d="M0,-14L14,0 0,14 -14,0Z"/><path class="objective-center" d="M-3,0H3M0,-3V3"/>`;Hg!==f&&(r.innerHTML=`<g>${f}</g>`,Hg=f),r.firstElementChild.setAttribute(`transform`,`translate(${u.x} ${u.y}) rotate(${u.kind===`edge`?P(n)===`en`&&u.behind?Math.atan2(e.targetLocal.x,-e.targetLocal.z)*180/Math.PI:u.rotation:0})`);let p=L(e.targetPosition.y-e.position.y,n),m=P(n)===`ja`?u.behind?`・後ろ`:u.occluded?`・表示の奥`:u.kind===`edge`?`・表示域外`:``:``,h=`${I(e,n)}${m}`,g=`${Math.round(e.distance)}m　${p}`,_=`${h} ${g}`;r.setAttribute(`aria-label`,_);let v=zg(u,{bounds:s,obstacles:l});i.hidden=!v,v&&(i.dataset.target=d?`exit`:`light`,i.querySelector(`strong`).textContent=h,i.querySelector(`span`).textContent=g,i.style.transform=`translate(${v.x}px,${v.y}px)`)}var Gg=`twist.feedback-settings.v1`,Kg=Object.freeze({sound:{label:`音`,initial:!0},volume:{label:`全体の音量`,initial:25,min:0,max:100,step:1,unit:`%`},sfx:{label:`効果音`,initial:!0},vario:{label:`上昇・下降の音（バリオ）`,initial:!0},bgm:{label:`BGM`,initial:!0},bgmVolume:{label:`BGMの音量`,initial:50,min:0,max:100,step:1,unit:`%`},musicSet:{label:`飛行中の曲`,initial:`current`,options:{current:`これまでの2曲`,brave:`勇進の航路`,rock:`ロック：黒曜の翼`,newrock:`鋼翼・黎明・嵐の3曲`,steel:`鋼翼の鼓動`,horizon:`黎明の航跡`,storm:`嵐を越えて`,proposals:`追加3案を順番に`,ignition:`Ignition Sky`,advance:`Steel Advance`,overdrive:`Overdrive Horizon`,all:`10曲を順番に`}},abMusic:{label:`ABでBGMを切り替える`,initial:!0},passbySound:{label:`すれ違う音`,initial:!0},vibration:{label:`振動`,initial:!0,group:`vibration`},vibrationScale:{label:`振動の強さ（振動する時間の倍率）`,initial:1,min:0,max:2,step:.1,unit:`倍`,group:`vibration`},engineVibration:{label:`通常飛行の震え`,initial:!0,group:`vibration`},flightVibration:{label:`通常飛行の振動間隔`,initial:`fine`,options:{fine:`細かな震え（新）`,classic:`これまでの間隔`},group:`vibration`}});function qg(e){return Object.fromEntries(Object.entries(Kg).map(([t,n])=>[t,n.options?Object.hasOwn(n.options,e?.[t])?e[t]:n.initial:typeof n.initial==`boolean`?typeof e?.[t]==`boolean`?e[t]:n.initial:Number.isFinite(e?.[t])?Math.max(n.min,Math.min(n.max,e[t])):n.initial]))}function Jg(e){try{return qg(JSON.parse(e.getItem(Gg)))}catch{return qg()}}function Yg(e,t){try{return e.setItem(Gg,JSON.stringify(qg(t))),!0}catch{return!1}}var Xg=new URL(`audio-worklet-fArVOqzl.js`,import.meta.url).href;function Zg(){let e=null,t=null,n=null,r=null,i=`idle`,a=null,o=!1,s=null,c=0,l=!1,u=0,d=0,f=0,p=!1,m=!1,h=null,g=null,_=null,v=null,y=null,b=[],x=!1,S=null,C=new Set,w=e=>t?.port.postMessage(e);async function T(){if(l)return;let s=window.AudioContext||window.webkitAudioContext;if(!s)i=`unsupported`;else try{e&&e.state!==`closed`||(e=new s),n||=(async()=>{if(await e.resume(),!l){if(!t){if(await e.audioWorklet.addModule(Xg),l)return;t=new AudioWorkletNode(e,`twist-audio`,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]}),t.connect(e.destination),t.port.onmessage=({data:e})=>{e.type===`metrics`&&(u=e.load,d=Math.max(d,u),f=e.peak,p=!!e.music,m=o&&!!e.vario,h=e.musicSchedule??null),e.navigation&&(_=e.navigation),e.afterburner&&(v=e.afterburner),e.passby&&(y=e.passby)},r=setInterval(()=>w({type:`poll`}),1e3)}i=`ready`,o?a&&w(a):await e.suspend()}})().catch(()=>{i=`unavailable`,clearInterval(r),t?.disconnect(),t=null}).finally(()=>{n=null}),await n}catch{i=`unavailable`}}function E(e,n,r,i=`base`){t&&!C.has(i)&&(b.push({addr:e,value:n,at:r,tag:i}),x||(x=!0,queueMicrotask(()=>{x=!1;let e=b.filter(e=>!C.has(e.tag));b=[],e.length&&w({type:`musicReg`,writes:e})})))}return{unlock:T,async waitForReady(){return n&&await n,!!t},musicReady:()=>!!t,resume:()=>e?e.resume():Promise.resolve(),suspendIfIdle(){o||e?.suspend().catch(()=>{})},musicClock:{now:()=>e?.currentTime||0,setScheduleTime(e){S=e},write(e,t){E(e,t,S)}},createMusicLayerClock(t){let n=null;return{now:()=>e?.currentTime||0,setScheduleTime(e){n=e},write(e,r){E(e,r,n,t)}}},cancelMusicLayer(e){C.add(e),b=b.filter(t=>t.tag!==e),w({type:`musicCancel`,tag:e})},stopMusic(){b=[],S=null,C.clear(),w({type:`musicStop`})},setMusicGain(e){w({type:`musicGain`,gain:e})},configure(e){w({type:`settings`,settings:e})},start(){o=!0,e&&e.resume().catch(()=>{}),a&&w(a)},update(e,t,n,r=null){a={type:`state`,model:e,settings:t,phase:n,navigation:r},o&&w(a)},event(n,r){if(!t||!r.sound||!r.sfx)return;let i=c,a=()=>{i===c&&(g=n,w({type:`event`,kind:n,settings:r}))};clearTimeout(s),e.state===`running`&&o?a():e.resume().then(a).catch(()=>{}),o||(s=setTimeout(()=>{w({type:`stop`}),e.suspend().catch(()=>{})},1400))},passBy(e,n){t&&o&&n.sound&&n.sfx&&n.passbySound!==!1&&e&&[`speed`,`distance`,`side`].every(t=>Number.isFinite(e[t]))&&w({type:`passby`,payload:{id:String(e.id??``),speed:e.speed,distance:e.distance,side:e.side},settings:n})},stop(){c++,b=[],o=!1,m=!1,a=null,clearTimeout(s),w({type:`stop`}),e?.suspend().catch(()=>{})},snapshot:()=>({status:i,load:u,maxLoad:d,peak:f,musicActive:p,varioActive:m,lastEvent:g,contextState:e?.state||`none`,workletReady:!!t,musicSchedule:h?{...h}:null,afterburner:{requested:a?.model?.afterburner?{...a.model.afterburner}:null,acknowledged:v?{...v}:null},passby:y?{...y}:null,navigation:{requested:a?.navigation?{...a.navigation}:null,acknowledged:_?{..._}:null}}),resetMetrics(){u=0,d=0,f=0,w({type:`resetMetrics`})},dispose(){return l=!0,c++,o=!1,b=[],clearInterval(r),clearTimeout(s),t?.disconnect(),t=null,e?.close().catch(()=>{})??Promise.resolve()}}}var Qg=(e,t,n)=>Math.max(t,Math.min(n,Number.isFinite(e)?e:t)),$g=Object.freeze({buffetStart:14,stallStart:20,stallEnd:70,engineCycle:400,enginePulse:5,groundPattern:[85,100,85,430],stallPattern:[100,45,55,90,160,110],fineCycle:60,finePulses:4,strongStallPattern:[180,30,120,40,260,50],afterburner:Object.freeze({ignitionSeconds:.12,attackSeconds:.01,releaseSeconds:.15,roarVolume:8,ignitionVolume:15,duckVolume:5,noiseStart:31,noiseEnd:6,roarNoise:8,fineOn:30,classicOn:120})}),e_=Object.freeze({collect:{priority:2,duration:300,pattern:[30,80,70]},exitOpen:{priority:2,duration:650,pattern:[]},clear:{priority:3,duration:1300,pattern:[90,90,160,100,260]},crash:{priority:3,duration:800,pattern:[320]}});function t_(e,t=1){let n=[];for(let r=0;r<e.length;r+=2){let i=e[r]+(e[r+1]||0),a=Math.round(Qg(e[r]*t,0,i));n.push(a),r+1<e.length&&n.push(i-a)}return n}function n_(e){let t=e?.active===!0&&Number.isFinite(e.burstSeconds)&&e.burstSeconds>=0;return{active:t,burstSeconds:t?e.burstSeconds:0}}function r_(e={},t={}){let n=Qg(Math.abs(e.angleOfAttack||0)*180/Math.PI,0,180),r=Qg(e.throttle,0,1),i=Qg(e.speed,0,45),a=n_(e.afterburner),o=$g.afterburner,s=`quiet`,c=[];if(e.mode!==`explore`&&Oh(e).level===`danger`)s=`ground`,c=[...$g.groundPattern];else if(n>=$g.stallStart)s=`stall`,c=t_($g.stallPattern,.6+.4*Qg((n-$g.stallStart)/($g.stallEnd-$g.stallStart),0,1));else if(n>=$g.buffetStart){s=`buffet`;let e=Math.round(15+(n-$g.buffetStart)/($g.stallStart-$g.buffetStart)*70);c=[e,300-e]}else if(a.active&&t.engineVibration!==!1)s=`afterburner`,c=[o.classicOn,$g.engineCycle-o.classicOn];else if(r>0&&t.engineVibration!==!1){s=`engine`;let e=Math.max(1,Math.round($g.enginePulse*r));c=[e,$g.engineCycle-e]}let l=c;if(s===`engine`&&t.flightVibration!==`classic`){let e=Math.round(8+6*r);l=Array.from({length:$g.finePulses},()=>[e,$g.fineCycle-e]).flat()}else s===`afterburner`&&t.flightVibration!==`classic`?l=Array.from({length:$g.finePulses},()=>[o.fineOn,$g.fineCycle-o.fineOn]).flat():s===`stall`&&(l=t_($g.strongStallPattern,.75+.25*Qg((n-20)/50,0,1)));let u=t_(l,Qg(t.vibrationScale??1,0,2));return{cue:s,pattern:u,soundPattern:c,cycle:l.reduce((e,t)=>e+t,0),angleOfAttack:n,power:r,speed:i,engineHz:55+r*120,wind:i/45,vario:eg(e.verticalSpeed,t.vario!==!1&&e.mode===`flight`),afterburner:a}}function i_(e){let t=!1,n=0,r=``,i=0,a=null,o=0,s=t=>{try{e?.(t)}catch{}};return{arm(){t=!0},update(c,l,u){if(!t||!e)return;if(!l.vibration||l.vibrationScale===0){(r||i)&&this.stop();return}if(u<i)return;if(i&&(clearTimeout(a),i=0,r=``,n=0),!c.pattern.some(e=>e>0)){r&&this.stop();return}let d=r!==c.cue||u>=n;if(d){s(c.pattern);let e=c.cycle===c.soundPattern.reduce((e,t)=>e+t,0);(r!==c.cue||e)&&(o=u),r=c.cue,n=u+c.cycle}return{restarted:d,elapsedMs:u-o}},event(o,c,l){let u=e_[o];t&&e&&c.vibration&&c.vibrationScale&&u&&(l<i&&e_[r]?.priority>u.priority||(s(0),s(t_(u.pattern,c.vibrationScale)),i=l+u.duration,r=o,n=i,clearTimeout(a),a=setTimeout(()=>this.stop(),u.duration)))},stop(){clearTimeout(a),t&&s(0),n=0,r=``,i=0}}}var a_=(e,t)=>Math.atan2(Math.sin((e-t)*Math.PI/180),Math.cos((e-t)*Math.PI/180))*180/Math.PI;function o_(){let e=[],t=0,n=0,r=0,i=0,a=0,o=null,s=()=>{if(!e.length)return{pitch:0,steer:0};let t=e.map(t=>a_(t.pitch,e[0].pitch)),n=e.map(t=>a_(t.steer,e[0].steer));return{pitch:Math.max(...t)-Math.min(...t),steer:Math.max(...n)-Math.min(...n)}};return{add(c,l,u){if([c,l,u].every(Number.isFinite)){for(e.push({time:c,pitch:l,steer:u});e.length>0&&e[0].time<c-1e3;)e.shift();if(o===null&&(o=c),c-o>=1e3){let e=s();t++,n+=e.pitch,r+=e.steer,i=Math.max(i,e.pitch),a=Math.max(a,e.steer),o=c}}},clearWindow(){e=[],o=null},reset(){e=[],t=0,n=0,r=0,i=0,a=0,o=null},snapshot(){return{window:s(),windows:t,meanPitchRange:t?n/t:0,maxPitchRange:i,meanSteerRange:t?r/t:0,maxSteerRange:a}}}}function s_(e=``){return typeof e==`string`&&/\biPhone\b/i.test(e)}var c_=(e=``)=>typeof e==`string`&&/\bAndroid\b/i.test(e),l_=[`portrait-primary`,`portrait-secondary`,`landscape-primary`,`landscape-secondary`];function u_({standalone:e=!1,displayModes:t=[]}={}){return e||t.some(e=>[`standalone`,`fullscreen`,`minimal-ui`].includes(e))?`installed`:`browser`}function d_({userAgent:e=``,launch:t=`browser`}={}){return s_(e)&&t===`browser`?`共有メニュー →「ホーム画面に追加」でアプリとして開けます。`:``}function f_({type:e,legacyAngle:t,width:n,height:r}={}){return l_.includes(e)?e:Number.isFinite(t)?{0:`portrait-primary`,90:`landscape-primary`,180:`portrait-secondary`,270:`landscape-secondary`}[(t%360+360)%360]??(n>r?`landscape`:`portrait`):n>r?`landscape`:`portrait`}function p_(){let e=null,t=!1,n=!1;return{begin(r){e=r,t=!1,n=!1},clear(){e=null,t=!1,n=!1},canResume:n=>!t||n===e,check(r,i){return e?i&&r!==e?(t=!0,n=!1,`changed`):t?r===e?n?null:(n=!0,`returned`):(n=!1,`waiting`):null:null}}}function m_({userAgent:e=``,landscape:t=!1}={}){return s_(e)?t?{title:`iPhoneの画面の向き`,text:`「画面縦向きのロック」は縦向き用です。横向きで遊ぶときは、開始した向きを保ってください。`}:{title:`iPhoneは縦向きロックがおすすめ`,text:`コントロールセンターで「画面縦向きのロック」をオンにすると、画面の自動回転を防げます。`}:null}var h_=Object.freeze({channelCount:5,waveBankCount:4,channelWaveBank:Object.freeze([0,1,2,3,3]),clock:3579545}),g_=Object.freeze([`square`,`saw`,`triangle`,`sine`,`pulse25`]),__=32,v_=__/2,y_={square:e=>e<v_?127:-128,saw:e=>Math.round(-128+255*e/(__-1)),triangle:e=>Math.round(e<v_?-128+255*e/(v_-1):127-255*(e-v_)/(v_-1)),sine:e=>Math.round(127*Math.sin(2*Math.PI*e/__)),pulse25:e=>e<__/4?127:-128};function b_(e){let t=y_[e];if(!Object.hasOwn(y_,e))throw RangeError(`不明なプリセット波形です：${e}`);let n=new Int8Array(__);for(let e=0;e<__;e++)n[e]=t(e);return n}function x_(e){if(e<5)return{freqLo:128+e*2,freqHi:129+e*2,volume:138+e,key:null};let t=256+(e-5)*4;return{freqLo:t,freqHi:t+1,volume:t+2,key:t+3}}function S_(e,t){return e<4?e*32+t:512+(e-4)*32+t}var C_=class{constructor(e){this.slots=Array(e).fill(null),this.seq=0}noteOn(e,t,{part:n=0,partLimit:r=1/0,canUse:i=()=>!0}={}){let a=this.slots.findIndex(t=>t!==null&&t.note===e&&t.part===n),o=null;if(a===-1){let e=this.slots.filter(e=>e!==null&&e.part===n);if(e.length>=r){let t=e.reduce((e,t)=>t.startedAt<e.startedAt?t:e);a=t.ch,o=t}else if(a=this.slots.findIndex((e,t)=>e===null&&i(t)),a===-1){for(let e=0;e<this.slots.length;e++)i(e)&&(a===-1||this.slots[e].startedAt<this.slots[a].startedAt)&&(a=e);if(a===-1)return null;o=this.slots[a]}}let s={ch:a,note:e,velocity:t,part:n,startedAt:this.seq++};return this.slots[a]=s,{voice:s,stolen:o}}noteOff(e,t=0){let n=this.slots.findIndex(n=>n!==null&&n.note===e&&n.part===t);if(n===-1)return null;let r=this.slots[n];return this.slots[n]=null,r}allOff(e){let t=this.active().filter(t=>e===void 0||t.part===e);for(let e of t)this.slots[e.ch]=null;return t}active(){return this.slots.filter(e=>e!==null)}},w_=1024,T_=1152,E_=e=>Object.freeze({len:.2,vol:15,decay:.2,f0:0,f1:0,sweep:.05,toneLen:0,noise:0,noiseLen:0,...e}),D_=E_({len:.25,decay:.24,f0:170,f1:45,sweep:.045,toneLen:.25,noise:12,noiseLen:.008}),O_=E_({len:.2,decay:.19,f0:240,f1:180,sweep:.03,toneLen:.035,noise:5,noiseLen:.2}),k_=E_({len:.04,vol:13,decay:.04,f0:900,f1:800,toneLen:.04,noise:3,noiseLen:.01}),A_=E_({len:.15,vol:14,decay:.15,noise:3,noiseLen:.15}),j_=E_({len:.05,vol:12,decay:.05,noise:1,noiseLen:.05}),M_=E_({len:.04,vol:10,decay:.04,noise:1,noiseLen:.04}),N_=E_({len:.35,vol:12,decay:.35,noise:1,noiseLen:.35}),P_=E_({len:1,vol:14,decay:1,noise:2,noiseLen:1}),F_=E_({len:.5,vol:11,decay:.5,noise:1,noiseLen:.5}),I_=E_({len:.12,vol:11,decay:.12,noise:1,noiseLen:.12}),L_=E_({len:.18,vol:13,decay:.2,f0:560,f1:545,toneLen:.18}),R_=e=>E_({len:.3,decay:.28,f0:e,f1:e*.6,sweep:.12,toneLen:.3,noise:10,noiseLen:.006}),z_=R_(85),B_=R_(105),V_=R_(125),H_=R_(150),U_=R_(180),W_=R_(215);Object.freeze({35:D_,36:D_,37:k_,38:O_,39:A_,40:O_,41:z_,42:j_,43:B_,44:M_,45:V_,46:N_,47:H_,48:U_,49:P_,50:W_,51:F_,52:P_,53:F_,54:I_,55:P_,56:L_,57:P_,58:I_,59:F_,60:W_,61:U_,62:U_,63:U_,64:H_,65:W_,66:H_,67:L_,68:L_,69:I_,70:I_,71:L_,72:L_,73:I_,74:I_,75:k_,76:k_,77:k_,78:W_,79:U_,80:L_,81:F_});var G_=new Uint8Array(128);for(let[e,t]of[[1,[42,44,46]],[2,[71,72]],[3,[73,74]],[4,[78,79]]])for(let n of t)G_[n]=e;var K_=`custom`,q_=143,J_=2;function Y_(e,t=h_.clock){let n=440*2**((e-69)/12),r=Math.round(t/(32*n))-1;return Math.min(4095,Math.max(0,r))}function X_(e,t=127){return e<=0||t<=0?0:Math.max(1,Math.round(e/127*(t/127)*15))}var Z_=class{constructor(e,{config:t=h_,onVoices:n=()=>{},drums:r=!1}={}){this.sink=e,this.clock=t.clock,this.channelCount=t.channelCount,this.waveBankCount=t.waveBankCount,this.channelBank=t.channelWaveBank,this.addr=Array.from({length:this.channelCount},(e,t)=>x_(t)),this.onVoices=n,this.drums=r,this.voices=new C_(this.channelCount),this.keyMask=0,this.parts=Array.from({length:8},()=>({waveName:g_[0],cc7:127,bend:0})),this.drumCc7=127,this.customWave=null,this.customVersion=0,this.bankKey=Array(this.waveBankCount).fill(null)}get waveName(){return this.parts[0].waveName}set waveName(e){this.parts[0].waveName=e}init(){this.bankKey.fill(null),this.voices.allOff(),this.#r(),this.keyMask=0,this.sink.write(q_,0);for(let e=0;e<this.channelCount;e++)this.sink.write(this.addr[e].volume,0),this.addr[e].key!==null&&this.sink.write(this.addr[e].key,0);this.onVoices([])}handle(e){let t=e.channel??0;if(t===9)this.#a(e);else if(!(t>=8))switch(e.type){case`noteOn`:this.noteOn(e.note,e.velocity,t);break;case`noteOff`:this.noteOff(e.note,t);break;case`pitchBend`:this.setPitchBend(e.value,t);break;case`cc`:e.controller===7?this.setChannelVolume(e.value,t):(e.controller===123||e.controller===120)&&this.allNotesOff(t)}}noteOn(e,t,n=0){if(t<=0){this.noteOff(e,n);return}let r=this.parts[n];if(Y_(e+r.bend,this.clock)<=8)return;let i=this.#e(n),a=this.voices.noteOn(e,t,{part:n,canUse:e=>this.#i(e,i)});if(!a)return;let{voice:o,stolen:s}=a;s&&s.ch===o.ch&&this.sink.write(this.addr[o.ch].volume,0),this.#n(this.channelBank[o.ch],n),this.#o(o.ch,e,r.bend),this.sink.write(this.addr[o.ch].volume,X_(t,r.cc7)),this.#c(o.ch,!0),this.onVoices(this.voices.active())}noteOff(e,t=0){let n=this.voices.noteOff(e,t);n&&(this.#s(n.ch),this.onVoices(this.voices.active()))}allNotesOff(e){for(let t of this.voices.allOff(e))this.#s(t.ch);e===void 0&&this.drums&&this.sink.write(T_,0),this.onVoices(this.voices.active())}resetControllers(){for(let e=0;e<8;e++)this.setPitchBend(0,e),this.setChannelVolume(127,e);this.drumCc7=127}setPitchBend(e,t=0){let n=this.parts[t];n.bend=e/8192*J_;for(let e of this.voices.active())e.part===t&&this.#o(e.ch,e.note,n.bend)}setChannelVolume(e,t=0){this.parts[t].cc7=e;for(let n of this.voices.active())n.part===t&&this.sink.write(this.addr[n.ch].volume,X_(n.velocity,e))}setWave(e,t=0){e!==`custom`&&b_(e),this.parts[t].waveName=e,this.#r()}setWaveData(e,t=0){this.customWave=Int8Array.from(e),this.customVersion++,this.setWave(K_,t)}partWaves(){return this.parts.map(e=>e.waveName)}#e(e){let t=this.parts[e].waveName;return t===`custom`?`${K_}#${this.customVersion}`:t}#t(e){let t=this.parts[e].waveName;return t===`custom`?this.customWave??b_(g_[0]):b_(t)}#n(e,t){let n=this.#e(t);if(this.bankKey[e]===n)return;let r=this.#t(t);for(let t=0;t<r.length;t++)this.sink.write(S_(e,t),r[t]&255);this.bankKey[e]=n}#r(){let e=Array(this.waveBankCount).fill(-1),t=Array(this.waveBankCount).fill(-1);for(let n of this.voices.active()){let r=this.channelBank[n.ch];n.startedAt>t[r]&&(t[r]=n.startedAt,e[r]=n.part)}for(let t=0;t<this.waveBankCount;t++)this.#n(t,e[t]===-1?0:e[t])}#i(e,t){let n=this.channelBank[e];for(let r=0;r<this.channelCount;r++){if(r===e||this.channelBank[r]!==n)continue;let i=this.voices.slots[r];if(i!==null&&this.#e(i.part)!==t)return!1}return!0}#a(e){if(this.drums){if(e.type===`noteOn`){let t=Math.round(e.velocity*this.drumCc7/127);t>0&&this.sink.write(w_+(e.note&127),t)}else e.type===`cc`&&(e.controller===7?this.drumCc7=e.value:(e.controller===123||e.controller===120)&&this.sink.write(T_,0))}}#o(e,t,n){let r=Y_(t+n,this.clock);this.sink.write(this.addr[e].freqLo,r&255),this.sink.write(this.addr[e].freqHi,r>>8)}#s(e){this.sink.write(this.addr[e].volume,0),this.#c(e,!1)}#c(e,t){e>=5?this.sink.write(this.addr[e].key,+!!t):(this.keyMask=t?this.keyMask|1<<e:this.keyMask&~(1<<e),this.sink.write(q_,this.keyMask))}},Q_=class{constructor({synth:e,clock:t,onEnd:n=()=>{},lookahead:r=.15,interval:i=25}){this.synth=e,this.clock=t,this.onEnd=n,this.lookahead=r,this.interval=i,this.events=[],this.duration=0,this.index=0,this.startTime=0,this.timer=0,this.playing=!1}load(e){this.stop(),this.events=e.events,this.duration=e.duration}play(){this.stop(),this.index=0,this.synth.resetControllers(),this.startTime=this.clock.now()+.1,this.playing=!0,this.timer=setInterval(()=>this.pump(),this.interval),this.pump()}pump(){if(!this.playing)return;let e=this.clock.now()-this.startTime;for(;this.index<this.events.length&&this.events[this.index].time<=e+this.lookahead;){let e=this.events[this.index++];this.clock.setScheduleTime(this.startTime+e.time),this.#e(e)}this.clock.setScheduleTime(null),this.index>=this.events.length&&e>this.duration+.3&&(this.stop(),this.onEnd())}get position(){return this.playing?Math.max(0,Math.min(this.duration,this.clock.now()-this.startTime)):0}stop(){clearInterval(this.timer),this.timer=0,this.playing&&this.synth.allNotesOff(),this.playing=!1}#e(e){this.synth.handle(e)}},$_=class extends Error{constructor(e){super(e),this.name=`SmfError`}};function ev(e){let t=0;return{get pos(){return t},set pos(e){t=e},eof:()=>t>=e.length,u8(){if(t>=e.length)throw new $_(`ファイルが途中で終わっています`);return e[t++]},u16(){return this.u8()<<8|this.u8()},u32(){return(this.u8()<<24>>>0)+(this.u8()<<16)+(this.u8()<<8)+this.u8()},vlq(){let e=0;for(let t=0;t<4;t++){let t=this.u8();if(e=e<<7|t&127,!(t&128))return e}throw new $_(`可変長の数が長すぎます`)},tag(){return String.fromCharCode(this.u8(),this.u8(),this.u8(),this.u8())}}}function tv(e){return e.length>=14&&String.fromCharCode(e[0],e[1],e[2],e[3])===`MThd`}function nv(e){if(!tv(e))throw new $_(`SMF（MIDI ファイル）ではありません`);let t=ev(e);t.tag();let n=t.u32(),r=t.u16(),i=t.u16(),a=t.u16();if(t.pos=8+n,r>1)throw new $_(`形式${r}には対応していません（形式0・1だけ）`);if(a&32768)throw new $_(`SMPTE の時間単位には対応していません`);if(a===0)throw new $_(`4分音符あたりの tick 数が0です`);let o=[],s=[],c=``,l=0;for(let n=0;n<i&&!t.eof();n++){let r=t.tag(),i=t.u32(),a=t.pos+i;if(r!==`MTrk`){t.pos=a,n--;continue}let u=0,d=0;for(;t.pos<a;){u+=t.vlq();let r=t.u8();if(r<128){if(!d)throw new $_(`ランニングステータスの前にステータスがありません`);t.pos--,r=d}if(r===255){let r=t.u8(),i=t.vlq(),a=t.pos;if(r===81&&i===3&&s.push({tick:u,usPerQuarter:e[a]<<16|e[a+1]<<8|e[a+2]}),r===3&&!c&&n===0&&(c=new TextDecoder(`shift_jis`).decode(e.subarray(a,a+i)).trim()),t.pos=a+i,r===47)break;continue}if(r===240||r===247){t.pos+=t.vlq(),d=0;continue}d=r;let i=r&240,a=r&15,f=t.u8(),p=i===192||i===208?0:t.u8(),m=null;i===144?m=p===0?{type:`noteOff`,note:f,channel:a}:{type:`noteOn`,note:f,velocity:p,channel:a}:i===128?m={type:`noteOff`,note:f,channel:a}:i===176?m={type:`cc`,controller:f,value:p,channel:a}:i===224?m={type:`pitchBend`,value:(p<<7|f)-8192,channel:a}:i===192&&(m={type:`program`,program:f,channel:a}),m&&o.push({tick:u,order:l++,ev:m})}t.pos=a}s.sort((e,t)=>e.tick-t.tick),o.sort((e,t)=>e.tick-t.tick||e.order-t.order);let u=(()=>{let e=[{tick:0,sec:0,us:5e5}];for(let t of s){let n=e[e.length-1],r=n.sec+(t.tick-n.tick)*n.us/(a*1e6);t.tick===n.tick?n.us=t.usPerQuarter:e.push({tick:t.tick,sec:r,us:t.usPerQuarter})}return t=>{let n=e.length-1;for(;n>0&&e[n].tick>t;)n--;return e[n].sec+(t-e[n].tick)*e[n].us/(a*1e6)}})(),d=o.map(({tick:e,ev:t})=>({...t,time:u(e)}));return d.sort((e,t)=>e.time-t.time||(e.type===`noteOff`?-1:0)-(t.type===`noteOff`?-1:0)),{format:r,division:a,events:d,duration:d.length?d[d.length-1].time:0,title:c}}function rv(e){if(!e||typeof e.file!=`string`||!e.file.endsWith(`.mid`)||/[:?#\\]/.test(e.file)||e.file.startsWith(`/`)||e.file.split(`/`).includes(`..`))throw Error(`Invalid MIDI path`);let t={};for(let[n,r]of Object.entries(e.parts||{})){let e=Number(n);if(!Number.isInteger(e)||e<1||e>10||e===9)throw Error(`Invalid MIDI channel`);let i=r.waveform??0,a=r.volume??100;if(!Number.isInteger(i)||i<0||i>=g_.length||!Number.isFinite(a)||a<0||a>127)throw Error(`Invalid part`);t[e]={waveform:i,volume:a}}if(e.loop&&(!Number.isFinite(e.loop.start)||!Number.isFinite(e.loop.end)||e.loop.start<0||e.loop.end>3600||e.loop.end-e.loop.start<.1))throw Error(`Invalid loop`);return{file:e.file,title:typeof e.title==`string`?e.title:e.file,parts:t,loop:e.loop?{...e.loop}:null}}function iv(e,t){let n=nv(e),r=t.loop?.start??0,i=t.loop?.end??n.duration;if(!Number.isFinite(i)||r>=i)throw Error(`Invalid MIDI interval`);let a=new Map,o=new Map;for(let e of n.events){if(e.time>=r)break;let t=`${e.channel}:${e.note}`;if(e.type===`noteOn`&&e.channel!==9&&a.set(t,e),e.type===`noteOff`&&a.delete(t),e.type===`cc`&&(o.set(`${e.channel}:cc:${e.controller}`,e),e.controller===120||e.controller===123))for(let[t,n]of a)n.channel===e.channel&&a.delete(t);e.type===`pitchBend`&&o.set(`${e.channel}:bend`,e)}let s=[];for(let e of[0,1,2,3,4,5,6,7,9])s.push({type:`cc`,channel:e,controller:7,value:127,time:0}),e!==9&&s.push({type:`pitchBend`,channel:e,value:0,time:0});let c=[...s,...[...o.values(),...a.values()].map(e=>({...e,time:0})),...n.events.filter(e=>e.time>=r&&e.time<i).map(e=>({...e,time:e.time-r}))];if(!c.some(e=>e.type===`noteOn`))throw Error(`No notes in MIDI interval`);let l=i-r;for(let e of[0,1,2,3,4,5,6,7,9])c.push({type:`cc`,channel:e,controller:123,value:0,time:l});return{events:c,duration:l,title:t.title}}function av(e){let t=[],n=0;return{events:t,extend(r){for(;n*e.duration<r;){let r=n++*e.duration;for(let n of e.events)t.push({...n,time:n.time+r})}return n*e.duration},trim(n){n.index>e.events.length*2&&(t.splice(0,n.index),n.index=0)}}}function ov(e){let t=e.flightPlaylist??[`flight`];if(!Array.isArray(t)||t.length<1||t.length>16||t.some(t=>typeof t!=`string`||!/^[a-z][a-z0-9_-]{0,31}$/i.test(t)||t===`clear`||t===`afterburner`||!Object.hasOwn(e,t)))throw Error(`Invalid flight playlist`);return[...new Set(t)]}function sv(e){let t=ov(e);if(e.flightSets===void 0)return{current:t};if(!e.flightSets||typeof e.flightSets!=`object`||Array.isArray(e.flightSets))throw Error(`Invalid flight sets`);return Object.fromEntries(Object.entries(e.flightSets).map(([t,n])=>{if(![`brave`,`rock`,`steel`,`horizon`,`storm`,`newrock`,`ignition`,`advance`,`overdrive`,`proposals`,`all`].includes(t))throw Error(`Invalid flight set`);return[t,ov({...e,flightPlaylist:n})]}).concat([[`current`,t]]))}function cv(e,t=1){return e.length?e[((Number.isFinite(t)?Math.max(1,Math.floor(t)):1)-1)%e.length]:null}var lv=e=>Number.isFinite(e)&&e>=30&&e<=300,uv=(e,t,n)=>t+Math.max(0,Math.ceil((e-t-1e-8)/n))*n;function dv(e){let t=null,n=!0,r=!1,i=null,a=0,o=0,s=()=>e.musicClock?.now()??0;function c(){i&&e.cancelMusicLayer?.(i.tag),i=null}function l(){if(!t||!n||!r||i||!e.createMusicLayerClock)return;let o=60/t.bpm,c=uv(s()+.03,t.baseStart,o),l=`afterburner-${++a}`;i={tag:l,clock:e.createMusicLayerClock(l),startAt:c,stopAt:null,index:0,cycle:0,counted:!1}}function u(){if(!i)return;let e=s(),n=i,r=t;if(e>=n.startAt&&!n.counted&&(n.counted=!0,o++),n.stopAt!==null&&e>=n.stopAt){c();return}let a=e+.15,l=60/r.bpm;for(;i===n;){let t=r.events[n.index],i=n.startAt+(n.cycle*r.loopBeats+t.beat)*l;if(i>a||n.stopAt!==null&&i>=n.stopAt)break;i>=e-.025&&t.velocity>0&&(n.clock.setScheduleTime(i),n.clock.write(w_+t.note,t.velocity)),++n.index===r.events.length&&(n.index=0,n.cycle++)}n.clock.setScheduleTime(null)}return{attach({track:e,score:n,bpm:i,baseStart:a}){if(c(),r=!1,t=null,!e||!n||!lv(e.bpm)||!lv(i)||!Number.isFinite(a))return;let o=n.events.filter(e=>e.type===`noteOn`&&e.velocity>0);if(!o.length||o.some(e=>e.channel!==9||!Number.isFinite(e.time)||!Number.isInteger(e.note)||e.note<35||e.note>81||!Number.isFinite(e.velocity)))return;let s=e.parts?.[`10`]?.volume??100,l=n.duration*e.bpm/60;!Number.isFinite(l)||l<=0||(t={title:e.title,bpm:i,baseStart:a,loopBeats:l,minSeconds:Number.isFinite(e.minSeconds)?Math.max(2,Math.min(10,e.minSeconds)):3,events:o.map(t=>({beat:t.time*e.bpm/60,note:t.note,velocity:Math.max(0,Math.min(127,Math.round(t.velocity*s/127)))})).sort((e,t)=>e.beat-t.beat)})},setEnabled(e){n=e!==!1,n||(r=!1,c())},setRequested(e){r=e===!0,n&&(r?i?i.stopAt=null:l():i&&i.stopAt===null&&(i.stopAt=uv(Math.max(s()+.03,i.startAt+t.minSeconds),t.baseStart,60/t.bpm*4)),u())},pump:u,stop(){r=!1,c(),t=null},reset(){r=!1,c(),t=null,o=0},snapshot(){let e=s();return{requested:r,enabled:n,available:!!t,active:!!(i&&e>=i.startAt&&(i.stopAt===null||e<i.stopAt)),pending:!!(i&&e<i.startAt),track:t?.title??null,bpm:t?.bpm??null,startCount:o,startAt:i?.startAt??null,stopAt:i?.stopAt??null,minSeconds:t?.minSeconds??null,holdRemaining:i?Math.max(0,i.startAt+t.minSeconds-e):0}}}}function fv(e,{fetchFile:t=fetch,base:n=new URL(`./music/`,document.baseURI)}={}){let r=null,i=null,a=null,o=null,s=0,c=null,l=`idle`,u=null,d={},f=[],p=1,m=0,h=null,g=dv(e);async function _(){return i||(r||=(async()=>{let e=new URL(`tracks.json`,n);e.searchParams.set(`v`,kh);let r=await t(e);if(!r.ok)throw Error(`No track config`);let a=await r.json(),o=sv(a),s=[...new Set(Object.values(o).flat())],c=Object.create(null);for(let e of[...s,`clear`,...a.afterburner?[`afterburner`]:[]])try{let r=rv(a[e]),i=new URL(r.file,n);if(e===`afterburner`&&Object.assign(r,{bpm:a[e].bpm,minSeconds:a[e].minSeconds}),i.origin!==n.origin||!i.pathname.startsWith(n.pathname))throw Error(`MIDI must be local`);i.searchParams.set(`v`,kh);let o=await t(i);if(!o.ok)throw Error(`No MIDI`);c[e]={track:r,score:iv(new Uint8Array(await o.arrayBuffer()),r)}}catch{}if(!Object.keys(c).length)throw Error(`No usable MIDI`);return i={entries:c,flightTempos:a.flightTempos??{},sets:Object.fromEntries(Object.entries(o).map(([e,t])=>[e,t.filter(e=>c[e])]))},l=`ready`,i})().catch(()=>(l=`unavailable`,r=null,null)),r)}function v(){s++,clearInterval(o),o=null,g.stop(),a?.stop(),a=null,e.stopMusic(),c=null,h=null,m=0,l===`playing`&&(l=`ready`)}async function y(t){if(!d.sound||(t===`flight`?!d.bgm:!d.sfx))return`cancelled`;if(c===t&&a?.playing)return`played`;v();let n=s,r=await _();if(n!==s)return`cancelled`;let i=await e.waitForReady();if(n!==s)return`cancelled`;let y=t===`flight`?cv(b(r),p):t;if(!r?.entries[y]||!i)return`unavailable`;try{await e.resume()}catch{return n===s?(l=`unavailable`,`unavailable`):`cancelled`}if(n!==s)return`cancelled`;let{track:x,score:S}=r.entries[y],C=e.musicClock;e.stopMusic(),e.configure(d),e.setMusicGain((d.bgmVolume??50)/100);let w=new Z_(C,{drums:!0});w.init();for(let[e,t]of Object.entries(x.parts))Number(e)<=8&&w.setWave(g_[t.waveform],Number(e)-1);let T={handle(e){let t=x.parts[(e.channel??0)+1]?.volume??127;w.handle(e.type===`cc`&&e.controller===7?{...e,value:Math.round(e.value*t/127)}:e)},resetControllers(){w.resetControllers();for(let[e,t]of Object.entries(x.parts))w.handle({type:`cc`,channel:Number(e)-1,controller:7,value:t.volume})},allNotesOff:()=>w.allNotesOff()},E=t===`flight`&&x.loop?av(S):null;a=new Q_({synth:T,clock:C,onEnd:()=>{n===s&&(clearInterval(o),o=null,g.stop(),e.stopMusic(),c=null,l=`ready`,t===`clear`&&e.suspendIfIdle())}});let D=E?E.extend(S.duration*2):S.duration;if(a.load({events:E?E.events:S.events,duration:D}),a.play(),t===`flight`&&r.entries.afterburner){let e=r.entries.afterburner,t=r.flightTempos[y],n=Number.isFinite(t)&&t>=30&&t<=300?t:120;g.attach({...e,bpm:n,baseStart:a.startTime})}return t===`flight`&&(o=setInterval(()=>{n===s&&a?.playing&&(E&&(a.duration=E.extend(Math.max(S.duration*2,C.now()-a.startTime+S.duration)),E.trim(a)),g.pump())},100)),c=t,h=y,m=E?S.duration:0,u=x.title,f.includes(x.title)||f.push(x.title),l=`playing`,`played`}function b(e=i){return e?.sets[d.musicSet]?.length?e.sets[d.musicSet]:e?.sets.current??[]}return{preload:_,play:y,stop:v,setAfterburner(e){g.setRequested(c===`flight`&&!!a?.playing&&e===!0)},setFlightNumber(e){p=Number.isFinite(e)?Math.max(1,Math.floor(e)):1},setSettings(t){let n=d.musicSet!==t.musicSet;d=t,g.setEnabled(!!(d.sound&&d.bgm&&d.abMusic!==!1)),e.setMusicGain((d.bgmVolume??50)/100),(!d.sound||c===`flight`&&(!d.bgm||n)||c===`clear`&&!d.sfx)&&v()},reset(){f=[],u=null,p=1,g.reset()},snapshot:()=>({status:l,playing:!!a?.playing,track:u,playedTracks:[...f],current:c,clearTrack:i?.entries.clear?.track.title??null,position:a?.position??0,flightNumber:p,trackId:h,musicSet:d.musicSet??`current`,flightTracks:b().map(e=>i.entries[e].track.title),afterburnerMusic:g.snapshot(),loopCount:c===`flight`&&m?Math.floor((a?.position||0)/m):0})}}function pv(){let e;try{e=localStorage}catch{}let t=Jg(e),n=!1,r=0,i=null,a=null,o=null,s=null,c=!1,l=0,u=``,d=Promise.resolve(),f=new URL(location.href).searchParams.get(`music`);Object.hasOwn(Kg.musicSet.options,f)&&(t={...t,musicSet:f});let p=0,m=0,h=0,g=Zg(),_=o_(),v=fv(g);v.setSettings(t);let y=!s_(navigator.userAgent)&&typeof navigator.vibrate==`function`,b=i_(y?navigator.vibrate.bind(navigator):null),x=document.getElementById(`feedback-settings-fields`),S={};for(let[r,i]of Object.entries(Kg)){let a=document.createElement(`label`);a.htmlFor=`feedback-${r}`;let l=document.createElement(`span`);l.textContent=i.label;let u=document.createElement(i.options?`select`:`input`);u.id=a.htmlFor;let d=document.createElement(`output`);if(d.htmlFor=u.id,i.options)for(let[e,t]of Object.entries(i.options))u.add(new Option(t,e));else u.type=typeof i.initial==`boolean`?`checkbox`:`range`;u.type===`range`&&Object.assign(u,{min:i.min,max:i.max,step:i.step}),a.dataset.feedbackSetting=r,a.append(l,d,u),x.append(a),u.value=t[r],u.type===`range`&&(S[r]=zh(u,{name:i.label,unit:i.unit,initial:i.initial}));let f=document.createElement(`small`);f.className=`setting-explanation`,f.textContent=Vh[r],f.id=`feedback-help-${r}`,u.setAttribute(`aria-describedby`,f.id);let p=document.createElement(`small`);p.dataset.feedbackInitial=r,p.className=`setting-initial`,a.append(f,p),i.group===`vibration`&&(a.hidden=!y),u.addEventListener(`input`,()=>{if(t=qg({...t,[r]:i.options?u.value:u.type===`checkbox`?u.checked:Number(u.value)}),r===`musicSet`){let e=new URL(location.href);e.searchParams.set(`music`,t.musicSet),history.replaceState(null,``,e);let n=document.getElementById(`home-link`),r=new URL(n.href);r.searchParams.set(`music`,t.musicSet),n.href=r.href}i.group===`vibration`&&_.reset(),b.stop(),g.configure(t),v.setSettings(t),t.sound?n&&(g.start(),v.play(`flight`)):g.stop(),c&&(t.sound?(o?.configure(k()),s?.setSettings(k()),r===`musicSet`&&M()):j()),document.getElementById(`feedback-save-status`).textContent=Yg(e,t)?`このブラウザーに保存しました。`:`保存できません。この画面を開いている間だけ使います。`,N()})}document.getElementById(`vibration-support`).textContent=y?`振動は端末・ブラウザーの設定によって使えないことがあります。`:`この端末ではゲームの振動を利用できません。音と表示でお知らせします。`;let C=document.createElement(`div`);C.className=`music-preview-controls`;let w=document.createElement(`button`);w.type=`button`,w.id=`music-preview-start`,w.textContent=`▶ 試聴`;let T=document.createElement(`button`);T.type=`button`,T.id=`music-preview-stop`,T.textContent=`■ 停止`;let E=document.createElement(`span`);E.id=`music-preview-title`;let D=document.createElement(`small`);D.id=`music-preview-status`,D.setAttribute(`role`,`status`),C.append(w,T,E,D),x.querySelector(`[data-feedback-setting="musicSet"]`).after(C),w.addEventListener(`click`,()=>{M()}),T.addEventListener(`click`,j);let O=document.getElementById(`flight-adjustments`);O.addEventListener(`toggle`,()=>{O.open||j()});function k(){return{...t,bgm:!0,sfx:!1,abMusic:!1}}function A(){let e=s?.snapshot();w.disabled=!t.sound||n,T.disabled=!c,E.textContent=e?.playing?`試聴中：${e.track}`:``,D.textContent=t.sound?u||`飛行を再開せず、選んだ曲の先頭を試聴します。`:`試聴は「音」をオンにすると使えます。`,C.dataset.playing=String(!!e?.playing),C.dataset.status=e?.status??`idle`,C.dataset.music=JSON.stringify(e??{playing:!1}),C.dataset.audio=JSON.stringify(o?.snapshot()??{contextState:`none`,workletReady:!1})}function j(){l++,c=!1,u=``,s?.stop(),o?.stop(),o&&(d=o.dispose()),s=null,o=null,A()}async function M(){if(n||!t.sound||O.hidden||!O.open)return;c=!0;let e=++l;if(u=`曲を準備しています。`,A(),!o){if(await d,e!==l||!c)return;o=Zg(),s=fv(o)}let r=o,i=s;if(i.setSettings(k()),i.setFlightNumber(1),A(),r.musicReady()||await r.unlock(),e!==l||!c)return;let a=await i.play(`flight`);e===l&&c&&(u=a===`played`?`試聴中です。`:a===`unavailable`?`曲を試聴できませんでした。`:`試聴は停止しています。`,A())}function N(){for(let[e,n]of Object.entries(Kg)){let r=document.getElementById(`feedback-${e}`);r.type===`checkbox`?r.checked=t[e]:r.value=t[e],r.closest(`label`).querySelector(`output`).textContent=n.options||r.type===`checkbox`?``:`${t[e]}${n.unit||``}`,S[e]?.sync();let i=x.querySelector(`[data-feedback-initial="${e}"]`);i.hidden=t[e]===n.initial,i.textContent=`● 初期値 ${Fh(n)}`}A()}return N(),{unlock(){j(),b.arm(),t.sound&&(g.unlock(),v.preload())},start({flightNumber:e=1}={}){j(),n=!0,i=null,a=null,v.setFlightNumber(e),g.start(),g.configure(t),v.play(`flight`)},stop(){j(),n=!1,i=null,a=null,v.stop(),g.stop(),b.stop(),_.clearWindow()},event(e){b.event(e,t,performance.now()),e===`clear`?v.play(`clear`).then(n=>{n===`unavailable`&&g.event(e,t)}):g.event(e,t)},passBy(e){n&&t.sound&&t.sfx&&t.passbySound!==!1&&![`ground`,`stall`,`buffet`].includes(a?.cue)&&g.passBy(e,t)},update(e,o,s,c,l,u=null){if(!n)return;s===`sensor`&&_.add(l,o.pitch,c===`twist`?o.twist:o.steer);let d=r_(e,t),f=b.update(d,t,l),p=a?.cue!==d.cue;a=d,v.setAfterburner(e.mode===`flight`&&e.afterburner?.active===!0);let m=i!==d.afterburner.active;i=d.afterburner.active,(l-r>=40||f?.restarted||m||p)&&(g.update(d,t,f,u),r=l)},frameTiming(e){n&&Number.isFinite(e)&&(p++,m+=e,h=Math.max(h,e))},reset(){_.reset(),v.reset(),g.resetMetrics(),p=0,m=0,h=0},exitOpened(){n&&g.event(`exitOpen`,t)},report(){return{settings:{...t},changedSettings:Ph(Kg,t),vibrationSupported:y,sensorJitter:_.snapshot(),audio:g.snapshot(),music:v.snapshot(),frameCpu:{meanMs:p?m/p:0,maxMs:h}}},updateDiagnostics(){O.hidden||A();let e=g.snapshot(),n=_.snapshot();document.getElementById(`feedback-diagnostics`).textContent=`入力の揺れ幅（操作も含む）1秒：機首 ${n.window.pitch.toFixed(1)}° / 旋回 ${n.window.steer.toFixed(1)}° ｜ 音源 ${(e.load*100).toFixed(1)}%・最大 ${(e.maxLoad*100).toFixed(1)}% ｜ 描画・操作CPU ${p?(m/p).toFixed(1):`0.0`}ms ｜ 曲：${v.snapshot().track||`なし`}`,document.getElementById(`feedback-diagnostics`).dataset.audio=JSON.stringify(e),document.getElementById(`feedback-diagnostics`).dataset.music=JSON.stringify(v.snapshot()),document.getElementById(`feedback-audio-status`).textContent=t.sound?e.status===`ready`?`音源の準備完了`:e.status===`idle`?`音は開始ボタンを押した後に準備します。`:`この環境では音を開始できません。音なしで遊べます。`:`音はオフです。`}}}function mv({root:e,userAgent:t,duration:n=1e4}){let r;function i(){clearTimeout(r),e.hidden=!0}function a(){let a=m_({userAgent:t,landscape:innerWidth>innerHeight});a?(e.querySelector(`[data-notice-title]`).textContent=a.title,e.querySelector(`[data-notice-copy]`).textContent=a.text,e.hidden=!1,clearTimeout(r),r=setTimeout(i,n)):i()}return e.querySelector(`button`).addEventListener(`click`,i),{show:a,hide:i,refresh(){e.hidden||a()}}}var hv=e=>document.getElementById(e);function gv({getPhase:e,pause:t,showDialog:n}){let r=navigator.userAgent,i=s_(r),a=c_(r),o=u_({standalone:navigator.standalone===!0,displayModes:[`standalone`,`fullscreen`,`minimal-ui`].filter(e=>matchMedia(`(display-mode: ${e})`).matches)}),s=p_(),c=mv({root:hv(`orientation-notice`),userAgent:r}),l=null,u=o===`installed`,d=0,f=!1,p=null,m=!1,h=()=>f_({type:screen.orientation?.type,legacyAngle:window.orientation,width:innerWidth,height:innerHeight}),g=()=>!!(document.fullscreenElement||matchMedia(`(display-mode: fullscreen)`).matches),_=()=>!p&&(!i||s.canResume(h()));function v(){let t=e();hv(`app`).dataset.launch=o,hv(`app`).dataset.fullscreen=String(g()),hv(`install-button`).hidden=u||!a||!l||t!==`intro`;let n=d_({userAgent:r,launch:u?`installed`:o});hv(`installation-advice`).textContent=n,hv(`installation-advice`).hidden=!n||t!==`intro`,hv(`release-screen-button`).hidden=!a||t!==`paused`||!(g()||f),_()?hv(`practice-button`).disabled=!1:(hv(`start-button`).disabled=!0,hv(`practice-button`).disabled=!0),t!==`intro`&&c.hide()}function y(){if(i){let r=s.check(h(),e()===`running`);r===`changed`&&t(`画面の向きが変わりました。開始したときの向きに戻してください。`),r===`waiting`&&([`waiting`,`ready`].includes(e())&&t(`開始したときの向きに戻してください。`),e()===`paused`&&n({title:`画面の向きを戻してください`,description:`開始したときの向きに戻してください。その後、持ち方を合わせ直して再開します。`,action:`開始時の向きを待っています…`})),r===`returned`&&n({title:`元の向きに戻りました`,description:`持ち方を合わせ直してから、ボタンで再開してください。自動では動き出しません。`,action:`この持ち方で再開する`})}c.refresh(),v()}async function b(){if(c.hide(),!a)return;let e=++d,t=screen.orientation?.type;try{g()||await document.documentElement.requestFullscreen?.()}catch{}if(e===d){try{l_.includes(t)&&screen.orientation?.lock&&(await screen.orientation.lock(t),e===d?f=!0:screen.orientation.unlock?.())}catch{}v()}}async function x(){d++;try{screen.orientation?.unlock?.()}catch{}f=!1;try{document.fullscreenElement&&await document.exitFullscreen?.()}catch{}v(),hv(`installed-screen-advice`).hidden=!(o===`installed`&&g())}hv(`release-screen-button`).addEventListener(`click`,x),window.addEventListener(`beforeinstallprompt`,e=>{a&&!u&&(e.preventDefault(),l=e,v())}),window.addEventListener(`appinstalled`,()=>{u=!0,l=null,v()}),hv(`install-button`).addEventListener(`click`,async()=>{let e=l;if(l=null,v(),e)try{await e.prompt(),await e.userChoice}catch{}}),document.addEventListener(`fullscreenchange`,()=>{a&&!g()&&e()===`running`&&(x(),t(`全画面を終了したため停止しました。持ち方を合わせて再開してください。`)),v()});async function S(){if(!(m||document.hidden)){m=!0;try{let e=await fetch(`./version.json?v=${kh}&t=${Date.now()}`,{cache:`no-store`});if(!e.ok)return;let n=(await e.json()).version;/^\d+\.\d+\.\d+$/.test(n)&&_v(n,`0.1.29`)>0&&(p=n,t(`新しい版を公開しました。「最新版を開く」で更新してください。`),hv(`update-notice`).hidden=!1,hv(`update-version`).textContent=`v${n}`,v())}catch{}finally{m=!1}}}return hv(`update-button`).addEventListener(`click`,()=>{if(!p)return;let e=new URL(location.href);e.searchParams.set(`v`,p),location.replace(e)}),document.addEventListener(`visibilitychange`,()=>{document.hidden||S()}),{render:v,enter:b,release:x,orientationChanged:y,canResume:_,cancelEntry(){d++},begin(){return _()?(s.begin(h()),!0):!1},clearOrientation(){s.clear()},report:()=>({launch:o,fullscreen:g()}),initialize(){v(),c.show(),`serviceWorker`in navigator&&navigator.serviceWorker.register(`./sw.js?v=${kh}`,{scope:`./`,updateViaCache:`none`}).catch(()=>{}),S()}}}function _v(e,t){let n=e.split(`.`).map(Number),r=t.split(`.`).map(Number);for(let e=0;e<3;e++)if(n[e]!==r[e])return n[e]-r[e];return 0}var X=e=>document.getElementById(e),Z=X(`app`),vv=X(`world`),yv,bv;try{bv=localStorage}catch{}var xv=V(Oe(bv,location.search)),Q=`intro`,$=new URLSearchParams(location.search).get(`mode`)===`flight`?`flight`:`explore`,Sv=ym(new URLSearchParams(location.search).get(`view`)),Cv=new URLSearchParams(location.search).get(`steer`)===`twist`?`twist`:`tilt`,wv=new URLSearchParams(location.search).get(`pitch`)===`rate`?`rate`:`angle`,Tv=new URLSearchParams(location.search).get(`display`)===`fixed`?`fixed`:`bank`,Ev=Km(new URLSearchParams(location.search).get(`camera`)),Dv=Ih(),Ov=i(),kv=Sg(xv.lights.length),Av=Eg(xv.lights.length),jv=kg(xv.abStraights),Mv=jg(),Nv=qh(bv),Pv=null,Fv=Ng(bv),Iv=null,Lv=null,Rv=[],zv=pv(),Bv=gv({getPhase:()=>Q,pause:eb,showDialog:Xy}),Vv=null,Hv=!1,Uv=``,Wv=0,Gv=0,Kv=[];function qv(){let e=Av.snapshot();return kv.snapshot().map((t,n)=>({...t,...e[n]}))}function Jv(){return Pv?{...Pv}:{courseId:xv.id,courseKey:Gh(xv,$),mode:$,seconds:null,bestSeconds:Nv.best(xv,$),newBest:!1,saved:null}}var Yv=Xh(()=>({pitch:wv,steer:Cv,display:Tv,camera:Ev,mode:$,view:Sv,feedback:zv.report(),input:{basis:$===`flight`?`screen`:`craft`,screenAngle:Vv===`sensor`?screen.orientation?.angle??window.orientation??0:0,current:Vv,transitions:Kv,held:Hv,lastPauseReason:Uv},segments:qv(),approaches:Av.snapshot(),abStraights:jv.snapshot(),passbys:Mv.snapshot(),courseTime:Jv(),exitDiscovery:kv.exitSnapshot(),targetViews:kv.targetViewsSnapshot(),course:{id:xv.id,name:xv.name,targetCount:xv.lights.length},stageSize:{halfExtent:350,width:700,depth:700},...$===`flight`?{afterburner:{...Ov.snapshot(),remainingFuel:yv?.getStatus().afterburner?.fuel??0,lastLeg:Ov.lastLegSnapshot()}}:{},...Bv.report()})),Xv=X(`radar-upgrade-notice`),Zv=X(`flight-adjustments`),Qv=!1;X(`setting-radarRange`).closest(`label`).after(Xv);function $v(){kv.reset(xv.lights.length),Av.reset(xv.lights.length),jv.reset(xv.abStraights),Mv.reset(),Pv=null,Iv=null,Lv=null,Rv=[]}function ey(){yv.reset(),Ov.beginLeg(),$v(),Wv=0}function ty(e){let t=yv.getPassObjects(),n=e.collected<e.total?`target-${xv.id}-${e.collected+1}`:null;return(t!==Iv||n!==Lv)&&(Iv=t,Lv=n,Rv=n?[...t,{id:n,position:{...e.targetPosition},radius:e.targetRadius}]:t),Rv}function ny(){let e=Q===`paused`&&!Zv.hidden&&Zv.open;Fv&&(!e&&Qv||Yv.getSettings().radarRange!==Fv.current)&&(Fv=null),Xv.hidden=!(Fv&&e)}function ry(){Fv&&Q===`paused`&&Zv.open&&!Xv.hidden&&(Fv.shown(),Qv=!0)}if(typeof IntersectionObserver==`function`)new IntersectionObserver(e=>{e.some(e=>e.isIntersecting&&e.intersectionRatio>=.8)&&ry()},{threshold:.8}).observe(Xv.querySelector(`p`));else{let e=()=>{let e=Xv.querySelector(`p`).getBoundingClientRect(),t=X(`veil`).getBoundingClientRect();e.height>0&&e.top>=Math.max(0,t.top)&&e.bottom<=Math.min(innerHeight,t.bottom)&&e.left>=Math.max(0,t.left)&&e.right<=Math.min(innerWidth,t.right)&&ry()};X(`veil`).addEventListener(`scroll`,e,{passive:!0}),window.addEventListener(`resize`,e),Zv.addEventListener(`toggle`,()=>requestAnimationFrame(e))}Zv.addEventListener(`toggle`,ny),X(`setting-radarRange`).addEventListener(`input`,ny),X(`radar-upgrade-accept`).addEventListener(`click`,()=>{Fv&&Q===`paused`&&Zv.open&&(ry(),Yv.setSetting(`radarRange`,Fv.next),Fv=null,ny())}),X(`radar-upgrade-keep`).addEventListener(`click`,()=>{Fv&&Q===`paused`&&Zv.open&&(ry(),Fv=null,ny())});function iy(e,t){Vv!==e&&(Kv.push({from:Vv,to:e,reason:t,phase:Q,at:new Date().toISOString()}),Kv.length>8&&Kv.shift()),Vv=e,Z.dataset.input=e??``}var ay=null,oy=null,sy=0,cy=null,ly=null,uy=null,dy=0,fy=!1,py=0,my=0,hy=null,gy=!1,_y=null,vy={pitch:0,steer:0,twist:0},yy={pitchRate:0,yawRate:0,bankAngle:0,acceleration:0,brake:0},by=0,xy=0,Sy=!1,Cy=null,wy=new K,Ty=new K,Ey={pitch:0,steer:0,twist:0},Dy=new Set,Oy=!1,ky=0,Ay=0,jy=0,My=null,Ny=()=>screen.orientation?.angle??window.orientation??0,Py=[`pitch`,`steer`,`twist`];function Fy(e){Q=e,e!==`running`&&(X(`flight-essential-hud`).hidden=!0),Z.dataset.phase=e,Yv.setPhase(e,$),X(`pause-button`).disabled=e!==`running`,X(`recenter-button`).disabled=e!==`running`,X(`recenter-button`).textContent=Vv===`practice`?`スマホの傾きに切替`:`持ち方を合わせ直す`,X(`veil`).hidden=e===`running`;for(let t of[`explore`,`flight`])X(`mode-${t}`).disabled=[`waiting`,`ready`,`running`].includes(e);X(`throttle-input`).disabled=e!==`running`||$!==`flight`;for(let t of[`bank`,`fixed`])X(`display-${t}`).disabled=[`waiting`,`ready`].includes(e);for(let t of[`overlay`,`chase`,`cockpit`])X(`camera-${t}`).disabled=[`waiting`,`ready`].includes(e);for(let t of[`assisted`,`classic`])X(`view-${t}`).disabled=[`waiting`,`ready`].includes(e);for(let t of[`angle`,`rate`])X(`pitch-${t}`).disabled=[`waiting`,`ready`,`running`].includes(e);for(let t of[`twist`,`tilt`])X(`steering-${t}`).disabled=[`waiting`,`ready`,`running`].includes(e);X(`course-select`).disabled=[`waiting`,`ready`,`running`].includes(e),Bv.render(),ny()}var Iy=()=>$===`flight`?wv===`angle`?`中立で機首も水平へ戻ります。上昇で減速、下降で加速。出力50%で出発します。`:`中立でも機首の角度は残ります。逆へ倒して水平へ戻し、出力を上げて失速から復帰。`:`先端側の傾き${Up.throttleMaximum}°で加減速が最大。中立で速度を保ちます。`,Ly=()=>Sv===`assisted`?`ピンクの`:`金色の`,Ry=()=>$===`flight`?`${Yv.getSettings().flightDirector?`白い進行方向の印を輪へ近づけます。重なると輪が緑になります。`:Tv===`fixed`?`自機の上向きを保ち、景色が回ります。`:`自機は画面中央。右へ曲がると機体も右へ傾きます。`}${Ly()}光を${xv.lights.length}つ集めて出口へ。`:`自機はスマホと一緒に傾かず、最初の上向きを保ちます。${Ly()}光を${xv.lights.length}つ集めて出口へ。`;function zy(e){xy=Number.isFinite(e)?W.clamp(e,0,1.2):0,xy>=1.1?Sy=!0:xy<=1&&(Sy=!1),X(`throttle-input`).value=String(Math.round(xy*100)),X(`throttle-value`).textContent=Sy?`100% AB`:`${Math.round(Math.min(1,xy)*100)}%`,Cy?.sync(xy)}function By(){let e=Sv===`assisted`;Q===`intro`&&(X(`dialog-description`).textContent=Ry()),Z.dataset.visibility=Sv,Z.dataset.display=Tv,Z.dataset.camera=$===`flight`?Ev:`overlay`;for(let e of[`overlay`,`chase`,`cockpit`])X(`camera-${e}`).setAttribute(`aria-pressed`,String(Ev===e));X(`camera-note`).textContent={overlay:`今までの景色と上向きの自機。`,chase:`立体機を後ろから少し遅れて追います。`,cockpit:`操縦席から見る。地面の近さは高度と警告で確認。`}[Ev],X(`display-bank`).setAttribute(`aria-pressed`,String(Tv===`bank`)),X(`display-fixed`).setAttribute(`aria-pressed`,String(Tv===`fixed`)),X(`display-note`).textContent=Tv===`fixed`?`面内回転を打ち消す。地平線で翼の傾きを表示。`:`機体を旋回側へ傾ける、今までの表示。`,X(`play-mode-label`).textContent=`${$===`flight`?`飛行機`:`探索`}・${e?`対策`:`従来`}`,X(`view-assisted`).setAttribute(`aria-pressed`,String(e)),X(`view-classic`).setAttribute(`aria-pressed`,String(!e)),X(`view-note`).textContent=e?`レーダー、ピンクの光と白い輪、画面端の目標マーク。`:`従来の視野と景色。同じ位置で見え方を比べられます。`,X(`home-link`).href=`./?mode=${$}&view=${Sv}&steer=${Cv}&pitch=${wv}&display=${Tv}&camera=${Ev}&course=${xv.id}&music=${zv.report().settings.musicSet}&v=${kh}`}function Vy(e){if(!yv||e===Sv||![`assisted`,`classic`].includes(e)||[`waiting`,`ready`].includes(Q))return;Sv=e,yv.setVisibility(Sv),By(),Yv.refreshLayout();let t=new URL(location.href);t.searchParams.set(`view`,Sv),t.searchParams.set(`steer`,Cv),t.searchParams.set(`pitch`,wv),t.searchParams.set(`display`,Tv),t.searchParams.set(`v`,kh),history.replaceState(null,``,t)}X(`view-assisted`).addEventListener(`click`,()=>Vy(`assisted`)),X(`view-classic`).addEventListener(`click`,()=>Vy(`classic`));function Hy(e){if(!yv||e===Tv||![`bank`,`fixed`].includes(e)||[`waiting`,`ready`].includes(Q))return;Tv=e,yv.setDisplay(e),By(),Yv.refreshLayout(),Q===`intro`&&(X(`dialog-description`).textContent=Ry());let t=new URL(location.href);t.searchParams.set(`display`,Tv),t.searchParams.set(`v`,kh),history.replaceState(null,``,t)}X(`display-bank`).addEventListener(`click`,()=>Hy(`bank`)),X(`display-fixed`).addEventListener(`click`,()=>Hy(`fixed`));function Uy(e){if(!yv||[`waiting`,`ready`].includes(Q)||e===Ev)return;Ev=Km(e),yv.setCameraMode(Ev),By(),Yv.setPhase(Q,$);let t=new URL(location.href);t.searchParams.set(`camera`,Ev),t.searchParams.set(`v`,kh),history.replaceState(null,``,t)}for(let e of[`overlay`,`chase`,`cockpit`])X(`camera-${e}`).addEventListener(`click`,()=>Uy(e));function Wy(){let e=X(`course-select`);if(xv.id===`legacy`&&!e.querySelector(`option[value="legacy"]`)){let t=document.createElement(`option`);t.value=`legacy`,t.hidden=!0,t.textContent=`比較用（旧配置）`,e.append(t)}e.value=xv.id;let t=Te.difficulties?.[xv.id]?.cruiseTimeRange;X(`course-note`).textContent=xv.id===`legacy`?`v0.1.25 比較用（旧配置）`:`光${xv.lights.length}個${t?`・約${t[0]}〜${t[1]}秒`:``}`}function Gy(){Wy();let e=$===`flight`,t=Cv===`twist`,n=X(`basic-controls`),r=X(`control-guide`);e?n.append(r):n.before(r),n.hidden=!e||r.hidden;for(let t of[`pitch`,`steer`])X(`practice-${t}`).min=e?`-30`:`-25`,X(`practice-${t}`).max=e?`30`:`25`;Q===`intro`&&(X(`dialog-description`).textContent=Ry()),Z.dataset.playMode=$,Z.dataset.controlBasis=e?`screen`:`craft`,Z.dataset.flightSteering=Cv,Z.dataset.pitchMode=wv,X(`flight-pitch-picker`).hidden=!e,X(`flight-display-picker`).hidden=!e,X(`flight-camera-picker`).hidden=!e,X(`basic-controls`).open=!e,X(`pitch-angle`).setAttribute(`aria-pressed`,String(wv===`angle`)),X(`pitch-rate`).setAttribute(`aria-pressed`,String(wv===`rate`)),X(`pitch-note`).textContent=wv===`angle`?`中立へ戻すと、機首も水平へ`:`中立でも機首角度を保つ。逆へ倒して戻す`,X(`play-mode-label`).textContent=e?`飛行機モード`:`探索モード`,X(`flight-attitude`).hidden=!e,X(`flight-throttle`).hidden=!e,X(`steer-control-meter`).hidden=e&&t,X(`twist-control-meter`).hidden=e&&!t,X(`pitch-label`).textContent=e?`画面上辺の傾き`:`先端側の傾き`,X(`steer-label`).textContent=e?`左右のひねり`:`自機の左右`,X(`twist-label`).textContent=`左右に回す角度`,X(`flight-steering-picker`).hidden=!e,X(`motion-explanation`).hidden=!e,X(`steering-twist`).setAttribute(`aria-pressed`,String(t)),X(`steering-tilt`).setAttribute(`aria-pressed`,String(!t)),X(`steering-note`).textContent=t?`スマホの面を保って回す。時計回りで右旋回。`:`右端・左端を上下にひねる。下げた側へ旋回。`,X(`practice-panel`).open=!e,X(`practice-summary`).hidden=!1,X(`mode-explore`).setAttribute(`aria-pressed`,String(!e)),X(`mode-flight`).setAttribute(`aria-pressed`,String(e)),X(`pitch-caption`).textContent=e?wv===`angle`?`画面上辺で機首角度・中立で水平`:`画面上辺を起こすと機首上げ`:`先端側で加速・逆で制動`,X(`steer-caption`).textContent=e?`下げた側へ旋回`:`下げた側へ曲がる`,X(`twist-caption`).textContent=e?`右回しで右・左回しで左旋回`:`右回しで上・左回しで下`,X(`stop-hint`).textContent=e?`停止は一時停止ボタン`:`加減速は${Up.throttleMaximum}°で最大`,X(`stop-hint`).hidden=e,X(`ground-clearance`).textContent=e?`地面まで`:`高さ`,X(`ground-height-meter`).hidden=!e,X(`ground-warning-text`).hidden=!e,X(`guide-pitch-title`).textContent=e?`画面の上辺を起こす・倒す`:`自機の先端側へ倒す`,X(`guide-pitch-text`).textContent=e?wv===`angle`?`起こすと上、倒すと下。中立で水平へ`:`起こすと機首上げ、前へ倒すと機首下げ`:`先端側で加速、逆側でブレーキ`,X(`guide-steer-title`).textContent=e?t?`面を保って左右に回す`:`左右の端を上下にひねる`:`自機の左右へ倒す`,X(`guide-steer-text`).textContent=e?t?`回した側へ旋回。戻すと翼が水平へ`:`下げた側へ旋回。戻すと翼が水平へ`:`下げた側へ曲がり続ける`,X(`guide-steer-glyph`).textContent=e&&t?`↻`:`↔`,X(`guide-steer-glyph`).classList.toggle(`twist-glyph`,e&&t),X(`guide-steer-glyph`).classList.toggle(`steer-glyph`,!e||!t),X(`guide-twist-title`).textContent=e?`画面下のスロットル`:`スマホを左右に回して保つ`,X(`guide-twist-text`).textContent=e?`光・低空でAB補充／110%点火・100%解除`:`右回しで上、左回しで下へ曲がる`,X(`guide-third-glyph`).textContent=e?`⇄`:`↻`,X(`guide-third-glyph`).classList.toggle(`twist-glyph`,!e),X(`keyboard-guide`).textContent=e?`W・S 機首の上・下
A・D 旋回 / Q・E 出力の弱・強`:`W 加速 / S ブレーキ
A・D 左右 / Q・E 下・上`,X(`practice-brake`).textContent=e?`出力0%`:`ブレーキ`,X(`dialog-note`).textContent=Iy(),X(`dialog-note`).hidden=!1,By()}function Ky(e){if(!yv||e===Cv||![`twist`,`tilt`].includes(e)||[`waiting`,`ready`,`running`].includes(Q))return;Cv=e,Gy(),Yv.setPhase(Q,$);let t=new URL(location.href);t.searchParams.set(`steer`,Cv),t.searchParams.set(`pitch`,wv),t.searchParams.set(`display`,Tv),t.searchParams.set(`v`,kh),history.replaceState(null,``,t)}X(`steering-twist`).addEventListener(`click`,()=>Ky(`twist`)),X(`steering-tilt`).addEventListener(`click`,()=>Ky(`tilt`));function qy(e){if(!yv||e===wv||![`angle`,`rate`].includes(e)||[`waiting`,`ready`,`running`].includes(Q))return;wv=e,Gy(),Yv.refreshLayout();let t=new URL(location.href);t.searchParams.set(`pitch`,wv),t.searchParams.set(`display`,Tv),t.searchParams.set(`v`,kh),history.replaceState(null,``,t)}X(`pitch-angle`).addEventListener(`click`,()=>qy(`angle`)),X(`pitch-rate`).addEventListener(`click`,()=>qy(`rate`));function Jy(e){if(!yv||e===$||[`waiting`,`ready`,`running`].includes(Q))return;let t=!!Vv&&Q!==`error`;py++,$y(),Bv.clearOrientation(),ey(),ay=null,Ay=0,X(`toast`).hidden=!0,$=e,Dv.reset(),Ov.reset(),zv.reset(),Yv.showResult(null),Yv.setPhase(Q,$),Gy(),yv.update(0,{mode:$,speed:0,craftQuaternion:wy});let n=new URL(location.href);n.searchParams.set(`mode`,$),n.searchParams.set(`view`,Sv),n.searchParams.set(`steer`,Cv),n.searchParams.set(`pitch`,wv),n.searchParams.set(`display`,Tv),n.searchParams.set(`v`,kh),history.replaceState(null,``,n),t?(Fy(`paused`),Xy({title:`${$===`flight`?`飛行機`:`探索`}モードに切り替えました`,description:`ステージを最初からにしました。持ち方を決めて始めましょう。`,note:Iy(),action:Vv===`sensor`?`この持ち方で再開する`:`画面操作を再開する`,guide:!0})):(iy(null,`mode-reset`),Fy(`intro`),Xy({title:`自分はそのまま。世界を動かそう。`,description:Ry(),note:Iy(),action:`スマホの傾きで始める`,guide:!0}))}function Yy(e){let t=V(e);if(!yv||t.id===xv.id||[`waiting`,`ready`,`running`].includes(Q))return;let n=!!Vv&&Q!==`error`;py++,$y(),Bv.clearOrientation(),xv=t,ke(bv,t.id),yv.dispose();try{yv=_h(vv,{visibility:Sv,display:Tv,cameraMode:Ev,course:xv,turnGravity:Yv.getSettings().turnGravity})}catch(e){yv=null,Fy(`error`),Xy({title:`コースを開けませんでした`,description:`ページを再読み込みして、もう一度お試しください。`,action:`再読み込みする`,error:e.message});return}ay=null,Ay=0,Wv=0,$v(),Dv.reset(),Ov.reset(),zv.reset(),X(`toast`).hidden=!0,Yv.showResult(null),_b(),yv.update(0,{mode:$,speed:0,craftQuaternion:wy});let r=new URL(location.href);r.searchParams.set(`course`,t.id),r.searchParams.set(`v`,kh),history.replaceState(null,``,r),Gy(),n?(Fy(`paused`),Xy({title:`コースを変更しました`,description:`${t.name}。光${t.lights.length}個を集めて出口へ。最初から始めます。`,note:Iy(),action:Vv===`sensor`?`この持ち方で再開する`:`画面操作を再開する`,guide:!0})):(iy(null,`course-reset`),Fy(`intro`),Xy({title:`自分はそのまま。世界を動かそう。`,description:Ry(),note:Iy(),action:`スマホの傾きで始める`,guide:!0}))}X(`course-select`).addEventListener(`change`,e=>Yy(e.target.value)),X(`mode-explore`).addEventListener(`click`,()=>Jy(`explore`)),X(`mode-flight`).addEventListener(`click`,()=>Jy(`flight`));function Xy({title:e,description:t,note:n=``,action:r=`再開する`,guide:i=!1,error:a=``}){X(`motion-explanation`).open=!1,X(`dialog-title`).textContent=e,X(`dialog-description`).textContent=t,X(`dialog-note`).textContent=n,X(`dialog-note`).hidden=!n,X(`control-guide`).hidden=!i,X(`basic-controls`).hidden=!i||$!==`flight`,X(`start-button`).textContent=r,X(`start-button`).disabled=!1,X(`error-message`).textContent=a,X(`error-message`).hidden=!a,X(`reset-button`).hidden=!Vv,X(`practice-button`).hidden=!1,X(`practice-button`).textContent=Vv===`practice`?`スマホの傾きに切り替える`:`画面で操縦（スマホ傾きは無効）`,X(`dialog-kicker`).textContent=Vv===`practice`?`画面操作・センサー未使用`:$===`flight`?`傾き操縦と画面スロットル`:`傾きと回転の操作検証`,Bv.render()}function Zy(e){gy=!1,$y(),Fy(`error`),Xy({title:`傾きを確認できませんでした`,description:`停止しています。下の内容を確認して、もう一度試してください。`,action:`もう一度センサーを確認する`,error:e})}function Qy(){Dy.clear(),Oy=!1,ky=0;for(let e of Py)Ey[e]=0,X(`practice-${e}`).value=`0`,pb[e]?.sync()}function $y(){Hv=!1,Cy?.cancel(),zv.stop(),gy=!1,clearTimeout(hy),yy={pitchRate:0,yawRate:0,bankAngle:0,acceleration:0,brake:0},by=0,zy(0),vy={pitch:0,steer:0,twist:0},Qy(),yv&&yv.update(0,{...yy,mode:$,speed:by,craftQuaternion:wy}),_y?.release().catch(()=>{}),_y=null}function eb(e=`止まっています。スマホを楽な持ち方に戻してから再開してください。`){[`running`,`ready`,`waiting`].includes(Q)&&(Uv=e,py++,gy=!1,clearTimeout(hy),$y(),ay=null,Fy(`paused`),yv&&Tb(performance.now(),yv.getStatus()),Xy({title:`一時停止`,description:e,note:Iy(),action:Vv===`sensor`?`この持ち方で再開する`:`画面操作を再開する`,guide:!1}))}async function tb(){try{if(`wakeLock`in navigator&&!document.hidden&&Q===`running`){let e=await navigator.wakeLock.request(`screen`);Q===`running`?_y=e:await e.release()}}catch{}}function nb(e,t){if(document.hidden||!Bv.begin())return;My=null,$===`flight`&&Dv.start(),iy(e,t),X(`practice-panel`).hidden=e!==`practice`,X(`input-mode`).textContent=e===`sensor`?`スマホの傾きで操作中`:`画面操作・センサー未使用`,Qy(),by=0,$===`flight`&&(yv.resetDisplayRotation(),zy(.5),yv.launchFlight()),e===`sensor`&&oy&&cy?wy.copy(Xp(oy,cy)):wy.identity(),Fy(`running`),Gv=performance.now();let n=yv.getStatus();kv.advance(0,{...n,targetVisible:wb(n)}),Av.advance(0,n),jv.advance(n),Mv.advance(0,{...n,objects:ty(n)}),zv.start({flightNumber:Dv.snapshot().legs}),X(`pause-button`).focus({preventScroll:!0}),tb()}function rb(){cy=Jp(uy,Ny()),ly=Jp(uy,$===`flight`?0:sy)}function ib(e,t,n,r){return wy.copy(Xp(r,e)),$===`flight`?Zp(n,t,Vv===`sensor`?Ny():0):{...$p(wy,Xp(n,e)),twist:Yp(n,t).twist}}function ab(e){let t={alpha:e.alpha,beta:e.beta,gamma:e.gamma};Jp(t,Ny())?(uy=t,rb(),dy=performance.now(),gy&&Q===`waiting`?(gy=!1,clearTimeout(hy),lb()):Q===`waiting`&&(clearTimeout(hy),Fy(`ready`),Xy({title:`持ち方を決めましょう`,description:`画面が見やすい角度で、スマホを動かさずに持ってください。この持ち方を操作の中立にします。`,note:Iy(),action:$===`flight`?`この持ち方で飛ぶ`:`この持ち方で始める`,guide:!1}))):(cy=null,ly=null,uy=null,Q===`running`&&Vv===`sensor`&&eb(`3方向すべての傾きが読めなくなったため停止しました。`))}function ob(){fy||=(window.addEventListener(`deviceorientation`,ab),!0)}async function sb(){Vv!==`sensor`&&(oy=null),$y();let e=++py;if(gy=!1,cy=null,ly=null,uy=null,dy=0,ay=null,iy(`sensor`,`request-sensors`),!window.isSecureContext)Zy(`センサーにはHTTPSのページが必要です。公開URLをSafariやChromeで直接開いてください。`);else if(!(`DeviceOrientationEvent`in window))Zy(`この端末・ブラウザーでは傾きを取得できません。スマホのSafariやChromeで公開URLを直接開いてください。`);else{Fy(`waiting`),Xy({title:`傾きを確認しています`,description:`センサー利用を許可したら、スマホを少し動かしてください。`,action:`センサーを待っています…`}),X(`start-button`).disabled=!0;try{let t=[];typeof DeviceOrientationEvent.requestPermission==`function`&&t.push(DeviceOrientationEvent.requestPermission()),typeof window.DeviceMotionEvent?.requestPermission==`function`&&t.push(DeviceMotionEvent.requestPermission());let n=await Promise.all(t);if(e!==py)return;if(n.some(e=>e!==`granted`)){Zy(`動きと向きへのアクセスが許可されていません。ブラウザーのサイト設定を確認してから、もう一度試してください。`);return}ob(),hy=setTimeout(()=>{e===py&&Q===`waiting`&&Zy(`3方向の傾きデータが届きませんでした。アプリ内ブラウザーではなく、SafariやChromeで直接開いて試してください。`)},6e3)}catch{e===py&&Zy(`センサー利用を開始できませんでした。ページを開き直して、開始ボタンからもう一度許可してください。`)}}}function cb(){Bv.canResume()&&(!cy||performance.now()-dy>1200?(gy=!0,Fy(`waiting`),Xy({title:`持ち方を確認しています`,description:`今の持ち方の近くでスマホを少し動かしてください。新しい傾きが届いたら始まります。`,note:Iy(),action:`新しい傾きを待っています…`}),X(`start-button`).disabled=!0,clearTimeout(hy),hy=setTimeout(()=>{gy&&Zy(`新しい傾きが届きませんでした。ページを開き直して試してください。`)},6e3)):lb())}function lb(){Bv.canResume()&&(gy=!1,clearTimeout(hy),sy=Ny(),rb(),ay=($===`flight`?ly:cy).clone(),oy||=cy.clone(),vy={pitch:0,steer:0,twist:0},nb(`sensor`,`held-pose-start`),ub($===`flight`?`画面の上辺を起こすと機首上げ。${Cv===`twist`?`面を保って左右に回して`:`左右の端を上下にひねって`}旋回します。`:`自機の先端側を下げると加速、逆側を下げるとブレーキ。持ち直しても自機の向きは保ちます。`,4300))}function ub(e,t=2600){X(`toast`).textContent=e,X(`toast`).hidden=!1,jy=performance.now()+t}function db(e=`resume-screen`){Bv.canResume()&&(py++,gy=!1,clearTimeout(hy),$y(),ay=null,oy=null,nb(`practice`,e),ub(`画面操作の練習です。スマホの傾きは使っていません。`))}X(`start-button`).addEventListener(`click`,async()=>{if(!yv)location.reload();else if(Bv.canResume()){if(zv.unlock(),[`ready`,`paused`,`complete`].includes(Q)){let e=py,t=++my;if(await Bv.enter(),e!==py||t!==my||document.hidden||!Bv.canResume())return}yv.getStatus().grounded?(mb({preserveSession:!0}),Vv===`sensor`&&cb()):Q===`complete`?mb():Q===`ready`||Q===`paused`&&Vv===`sensor`?cb():Q===`paused`&&Vv===`practice`?db():sb()}}),X(`practice-button`).addEventListener(`click`,async()=>{if(!yv||!Bv.canResume()||Q===`running`||Vv===`sensor`&&!window.confirm(`画面操作へ切り替えると、スマホを傾けても操縦できなくなります。画面のゲージで操縦するモードへ切り替えますか？`))return;let e=Q,t=Vv;if(zv.unlock(),Vv!==`practice`){let n=py,r=++my;if(await Bv.enter(),n!==py||r!==my||Q!==e||Vv!==t||document.hidden||!Bv.canResume())return}(Q===`complete`||yv.getStatus().grounded)&&(Bv.clearOrientation(),Q===`complete`?(Dv.reset(),Ov.reset(),zv.reset()):Dv.restartLeg(),ey(),Ay=0,oy=null),Vv===`practice`?sb():db(`screen-button-confirmed`)}),X(`pause-button`).addEventListener(`click`,()=>eb()),X(`recenter-button`).addEventListener(`click`,()=>{Vv===`practice`?(eb(`画面操作を止めました。スマホの傾きへの切替を確認します。`),X(`practice-button`).click()):(eb($===`flight`?`一度停止しました。今の持ち方を操作の中立に合わせ直します。`:`一度停止しました。自機の向きは保ったまま、今の持ち方を操作の中立に合わせ直します。`),Bv.enter())}),X(`help-button`).addEventListener(`click`,()=>{Q===`running`&&(eb($===`flight`?`画面の上辺を起こすと機首上げ、前へ倒すと機首下げ。${Cv===`twist`?`面を保って時計回りに回すと右旋回、反時計回りで左旋回。`:`左右の端を上下にひねり、右端を下げると右旋回、左端を下げると左旋回。`}中立で翼は水平へ戻り、${wv===`angle`?`機首も水平へ戻ります。`:`機首は今の角度を保ちます。`}画面のスロットルで出力を調整。出力0%でも滑空します。停止は一時停止を使います。`:`自機の先端側を下げると加速、逆側でブレーキ。自機の右側・左側を下げて旋回します。中立で速さを保ち、スマホを右へ回すと上、左へ回すと下へ曲がります。半回転付近では上下操作は中立に戻ります。`),X(`control-guide`).hidden=!1,X(`basic-controls`).hidden=$!==`flight`,X(`basic-controls`).open=!0,X(`motion-explanation`).open=$===`flight`)}),X(`practice-neutral`).addEventListener(`click`,Qy);function fb(e,t,n=Ey.twist){let r=$===`flight`?0:W.degToRad(n);Ey.pitch=Math.round(e*Math.cos(r)-t*Math.sin(r)),Ey.steer=Math.round(e*Math.sin(r)+t*Math.cos(r)),Ey.twist=n;for(let e of Py)X(`practice-${e}`).value=Ey[e],pb[e]?.sync()}X(`practice-brake`).addEventListener(`click`,()=>{Dy.clear(),$===`flight`?zy(0):(Oy=!1,fb(25,0))}),Cy=n(X(`throttle-input`),{getValue:()=>xy,onChange:e=>{Q===`running`&&$===`flight`?zy(e):Cy?.sync(xy)}});var pb=Object.fromEntries(Py.map(e=>[e,zh(X(`practice-${e}`),{name:e===`pitch`?`画面の上辺`:e===`steer`?`画面の右辺`:`回し角度`,unit:`°`,initial:0,showValue:!0})]));for(let e of Py)X(`practice-${e}`).addEventListener(`input`,t=>{Oy=!1,Dy.clear(),Ey[e]=Number(t.target.value)});function mb({preserveSession:e=!1}={}){Bv.clearOrientation(),e?Dv.restartLeg():(Dv.reset(),Ov.reset(),zv.reset()),Yv.showResult(null),py++,$y(),ay=null,oy=null,ey(),Ay=0,X(`toast`).hidden=!0,Vv===`practice`?db():(Fy(`paused`),Xy({title:`もう一度、出発しましょう`,description:`持ち方を決めて、${xv.lights.length}つの光を集めに行きましょう。`,note:Iy(),action:$===`flight`?`この持ち方で飛ぶ`:`この持ち方で始める`}))}X(`reset-button`).addEventListener(`click`,()=>mb());function hb(e,{blur:t=!1}={}){my++,Bv.cancelEntry(),zv.stop(),Dy.clear(),(!t||Q===`running`||gy)&&eb(e)}document.addEventListener(`visibilitychange`,()=>{document.hidden&&hb(`画面が隠れたため停止しました。持ち方を合わせて再開してください。`)}),window.addEventListener(`blur`,()=>hb(`画面から離れたため停止しました。`,{blur:!0})),window.addEventListener(`pagehide`,()=>hb(`画面から離れたため停止しました。`));var gb=()=>{rb(),_b(),Bv.orientationChanged()};screen.orientation?.addEventListener(`change`,gb),window.addEventListener(`orientationchange`,gb),window.addEventListener(`keydown`,e=>{if(Q!==`running`||Vv!==`practice`||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;let t=e.key.toLowerCase();[`w`,`s`,`a`,`d`,`e`,`q`].includes(t)&&(Oy||(ky=Ey.twist),Dy.add(t),Oy=!0,e.preventDefault()),e.code===`Space`&&(e.preventDefault(),eb())}),window.addEventListener(`keyup`,e=>Dy.delete(e.key.toLowerCase())),vv.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),eb(`3Dの表示が中断しました。ページを再読み込みしてください。`)});function _b(){yv?.resize(window.innerWidth,window.innerHeight,Math.min(window.devicePixelRatio||1,1.6)),Yv.refreshLayout()}window.addEventListener(`resize`,()=>{_b(),Bv.orientationChanged()});function vb(e,t){let n=Number.isFinite(vy[e])?vy[e]:0,r=e===`twist`?W.radToDeg(Math.asin(Math.sin(W.degToRad(n)))):n;X(`${e}-value`).textContent=`${Math.round(r)}°`;let i=X(`${e}-meter`);i.style.left=`${r<0?50-Math.min(-r/t,1)*50:50}%`,i.style.width=`${Math.min(Math.abs(r)/t,1)*50}%`}var yb=0,bb=null;function xb(e,t=`en`){let n=Oh({altitude:e.groundClearance,verticalSpeed:e.verticalSpeed,grounded:e.grounded}),r=$===`flight`,i=r?n.level:`clear`;X(`ground-proximity`).dataset.level=i,X(`ground-height-meter`).style.setProperty(`--clearance-ratio`,String(n.ratio)),X(`altitude-value`).textContent=n.known?n.clearance.toFixed(1):`—`;let a=te(i,t);X(`ground-warning-text`).textContent!==a&&(X(`ground-warning-text`).textContent=a),X(`ground-warning-text`).dataset.level!==i&&(X(`ground-warning-text`).dataset.level=i);let o=!r||![`low`,`danger`,`stopped`,`unknown`].includes(i);X(`ground-warning-text`).hidden!==o&&(X(`ground-warning-text`).hidden=o);let s=X(`ground-edge-warning`);s.dataset.level=i,s.hidden=!r||Q!==`running`||![`low`,`danger`].includes(i),Z.dataset.groundLevel=r?i:`hidden`,Z.dataset.groundClearance=n.known?String(n.clearance):``}function Sb(e,t=`en`){let n=X(`target-edge-marker`);if(n.dataset.target=e.collected===e.total?`exit`:`light`,$===`flight`&&Ev===`cockpit`&&Sv===`assisted`&&Q===`running`){n.hidden=!0,Z.dataset.edgeStatus=`hud`;return}if(Sv!==`assisted`||Q!==`running`||e.complete||!e.targetLocal){n.hidden=!0,Z.dataset.edgeStatus=`hidden`;return}let r=window.innerWidth,i=window.innerHeight,a=r/2,o=i/2,s=12,c=r-12,l=12,u=i-12,d=document.querySelector(`.navigation`).getBoundingClientRect(),f=X(`bottom-panel`).getBoundingClientRect();if(l=Math.max(l,d.bottom+12),f.left<a&&f.right>a?u=Math.min(u,f.top-12):f.left>=a?c=Math.min(c,f.left-12):s=Math.max(s,f.right+12),!X(`practice-panel`).hidden&&r>=600&&i<=500){let e=X(`practice-panel`).getBoundingClientRect();e.right<a&&(s=Math.max(s,e.right+12))}X(`toast`).hidden||(l=Math.max(l,X(`toast`).getBoundingClientRect().bottom+12));let p=km({target:e.targetLocal,width:r,height:i,verticalFov:e.fieldOfView.vertical,bounds:{left:s+50,top:l+25,right:c-50,bottom:u-25},avoid:{left:a-100,top:o-75,right:a+100,bottom:o+75}});if(n.hidden=!p.visible,Z.dataset.edgeStatus=p.visible?`shown`:p.inView?`onscreen`:`hidden`,Z.dataset.edgeBehind=String(p.behind),!p.visible)return;let m=Ev===`cockpit`&&$===`flight`?[`cockpit-speed`,`cockpit-altitude`,`cockpit-heading`,`cockpit-target-height`,`cockpit-power`,`cockpit-vario`].filter(e=>!X(e).hidden).map(e=>X(e).getBoundingClientRect()):[],h=Eh(p,{left:s+50,top:l+25,right:c-50,bottom:u-25},m);n.style.left=`${h.x}px`,n.style.top=`${h.y}px`,X(`edge-arrow`).style.transform=`rotate(${t===`en`&&p.behind?Math.atan2(e.targetLocal.x,-e.targetLocal.z)*180/Math.PI:p.rotation}deg)`,X(`edge-label`).textContent=I(e,t);let g=Math.abs(e.elevation)>.13?e.elevation>0?`上`:`下`:``;X(`edge-detail`).textContent=t===`ja`?`${[p.behind?`後ろ`:``,g].filter(Boolean).join(`・`)} ${Math.round(e.distance)}m`.trim():`${Math.round(e.distance)}m ${L(e.targetPosition.y-e.position.y,t)}`,n.setAttribute(`aria-label`,`${I(e,t)} ${X(`edge-detail`).textContent}`)}function Cb(e){return Pg({target:e.targetLocal,verticalFov:e.fieldOfView.vertical,near:e.cameraClipping.near,far:e.cameraClipping.far,width:innerWidth,height:innerHeight,bounds:{left:0,right:innerWidth,top:document.querySelector(`.navigation`).getBoundingClientRect().bottom,bottom:X(`bottom-panel`).getBoundingClientRect().top}})}function wb(e){return Pg({target:e.targetLocal,verticalFov:e.fieldOfView.vertical,near:e.cameraClipping.near,far:e.cameraClipping.far,width:innerWidth,height:innerHeight,bounds:{left:0,right:innerWidth,top:0,bottom:innerHeight}})}function Tb(e,t){if(e-yb<80&&Q===bb)return;yb=e,bb=Q,zv.updateDiagnostics();let n=Yv.getSettings(),i=Q===`running`?P(n.hudLanguage):`ja`;X(`speed-value`).parentElement.firstChild.textContent=i===`ja`?$===`flight`?`速度 `:`移動速度 `:`SPD `,X(`ground-clearance`).textContent=F(i,$===`flight`?`groundClearance`:`altitudeShort`),X(`nose-value`).parentElement.firstChild.textContent=`${F(i,`nose`)} `,X(`bank-value`).parentElement.firstChild.textContent=`${F(i,`bank`)} `,X(`climb-value`).parentElement.firstChild.textContent=`${F(i,`climbShort`)} `,document.querySelector(`.throttle-heading label`).textContent=F(i,`throttle`),Vv&&(X(`input-mode`).textContent=i===`ja`?Vv===`sensor`?`スマホの傾きで操作中`:`画面操作・センサー未使用`:Vv===`sensor`?`TILT CTRL`:`SCREEN CTRL`),X(`play-mode-label`).textContent=i===`ja`?`${$===`flight`?`飛行機`:`探索`}・${Sv===`assisted`?`対策`:`従来`}`:`${$===`flight`?`FLIGHT`:`EXPLORE`} · ${Sv===`assisted`?`ASSIST`:`CLASSIC`}`,document.querySelector(`.navigation`).setAttribute(`aria-label`,i===`ja`?`次の目的地`:`NEXT TGT`),document.querySelector(`.collection`).setAttribute(`aria-label`,i===`ja`?`集めた光`:`TGT COLLECTED`);for(let e of Py)vb(e,$===`flight`?e===`pitch`?n.maxTilt:e===`steer`?n.maxSteerTilt:n.maxSteerTwist:e===`pitch`?Up.throttleMaximum:e===`twist`?Up.twistMaximum:Up.tiltMaximum);X(`speed-value`).textContent=c(t.speed,Yv.getSettings().speedUnit).toFixed(1),X(`speed-unit`).textContent=s(Yv.getSettings().speedUnit),r(t,Yv.getSettings()),xb(t,i),X(`nose-value`).textContent=`${Math.round(W.radToDeg(t.pitch))}°`,X(`bank-value`).textContent=`${Math.round(W.radToDeg(t.bank||0))}°`,X(`climb-value`).textContent=`${(t.verticalSpeed||0)>0?`+`:``}${(t.verticalSpeed||0).toFixed(1)}`;let a=t.recoveryAssist>.05?`失速からの復帰補助中`:t.viewAssistance>.05?`地面を見る補助中`:`中立で翼を戻す`;X(`view-assist-note`).textContent=ae(a,i);let o=Q!==`running`||t.speed<.01?`停止中`:$===`flight`?t.verticalSpeed>.1?`上昇中`:t.verticalSpeed<-.1?`下降中`:`巡航中`:yy.brake>0?`ブレーキ`:yy.acceleration>0?`加速中`:`速度維持`;X(`motion-state`).textContent=ae(o,i),X(`target-label`).textContent=t.complete?F(i,`arrived`):I(t,i),X(`target-distance`).textContent=`${Math.round(t.distance)} m`,X(`collection-count`).textContent=t.collected,X(`collection-total`).textContent=`/ `+t.total,X(`objective`).textContent=oe(t,i),X(`nav-arrow`).style.transform=`rotate(${t.bearing*180/Math.PI}deg)`,X(`target-direction`).textContent=ee(t,i,{assisted:Sv===`assisted`}),Z.dataset.speed=t.speed.toFixed(3),Z.dataset.position=JSON.stringify(t.position),Z.dataset.craftQuaternion=JSON.stringify(t.craftQuaternion),Z.dataset.craftScreenQuaternion=JSON.stringify(t.craftScreenQuaternion),Z.dataset.cameraQuaternion=JSON.stringify(t.cameraQuaternion),Z.dataset.worldQuaternion=JSON.stringify(t.worldQuaternion),Z.dataset.displayRoll=String(t.displayRoll||0),Z.dataset.targetLocal=JSON.stringify(t.targetLocal),Z.dataset.bank=String(t.bank||0),Z.dataset.flightPitch=String(t.pitch),Z.dataset.heading=String(t.heading),Z.dataset.yawRate=String(t.yawRate||0),Z.dataset.verticalSpeed=String(t.verticalSpeed||0),Z.dataset.throttle=String(t.throttle||0),Z.dataset.afterburner=JSON.stringify(t.afterburner??{}),Z.dataset.speedEffects=JSON.stringify(t.speedEffects??{}),Z.dataset.recoveryAssist=String(t.recoveryAssist||0),Z.dataset.session=JSON.stringify(Dv.snapshot()),Z.dataset.pitchTarget=String(yy.pitchTarget||0),Z.dataset.grounded=String(!!t.grounded),Z.dataset.viewPitch=String(t.viewPitch||0),Z.dataset.viewAssistance=String(t.viewAssistance||0),Z.dataset.horizontalFov=String(t.fieldOfView?.horizontal||0),Z.dataset.landmarkCount=String(t.landmarks?.length||0),Z.dataset.beaconAppearance=JSON.stringify(t.beaconAppearance),Z.dataset.scenery=JSON.stringify(t.scenery),Z.dataset.aircraft=JSON.stringify(t.aircraft),Z.dataset.worldCraftScreenQuaternion=JSON.stringify(t.worldCraftScreenQuaternion),Z.dataset.craftVisible=String(t.craftVisible),Z.dataset.orientation=JSON.stringify(t.orientation),Z.dataset.velocity=JSON.stringify(t.velocity),Z.dataset.viewPosition=JSON.stringify(t.viewPosition),Z.dataset.verticalFov=String(t.fieldOfView.vertical),Z.dataset.navigationTargets=JSON.stringify(t.navigationTargets),Z.dataset.exitAppearance=JSON.stringify(t.exitAppearance),Z.dataset.inputHeld=String(Hv),Z.dataset.segments=JSON.stringify(qv()),Z.dataset.approaches=JSON.stringify(Av.snapshot()),Z.dataset.abStraights=JSON.stringify(jv.snapshot()),Z.dataset.passbys=JSON.stringify(Mv.snapshot()),Z.dataset.courseTime=JSON.stringify(Jv()),Z.dataset.groundPattern=JSON.stringify(t.groundPattern),Z.dataset.abLane=JSON.stringify(t.abLane),Z.dataset.exitDiscovery=JSON.stringify(kv.exitSnapshot()),Z.dataset.targetViews=JSON.stringify(kv.targetViewsSnapshot()),Z.dataset.course=JSON.stringify(t.course),Z.dataset.stageSize=JSON.stringify(t.stageSize),Z.dataset.turnGravity=String(t.turnGravity),Z.dataset.boundary=JSON.stringify(t.boundary);let l=$===`flight`&&Ev===`cockpit`&&Q===`running`;X(`cockpit-exit-notice`).hidden=!(l&&Sv===`assisted`&&t.collected===t.total&&e<Wv),X(`cockpit-exit-notice`).textContent=F(i,`exitOpen`);let u=fg(t,{phase:Q,visibility:Sv,enabled:n.targetHeightGuide,cockpit:l,language:i,inlineParent:X(`flight-essential-height`)});ue({...t,inputHeld:Hv},{phase:Q,mode:$,camera:Ev,language:i}),Th(t,{phase:Q,visibility:Sv,range:n.radarRange,language:i});let d=vg(l);Sb(t,i),yg({...t,inputHeld:Hv},l,d,{...n,hudLanguage:i},u),Ug(d)}var Eb=performance.now();function Db(e){let t=performance.now(),n=Math.min((e-Eb)/1e3,.05);if(Eb=e,yv){if(yv.setGroundPatternStrength(Yv.getSettings().groundPatternStrength),Q===`running`){if(Vv===`sensor`)ay&&oy&&uy&&(rb(),vy=Qp(vy,ib(cy,ly,ay,oy)),Hv=vy.held);else{if(Oy){let e=wv===`angle`?Yv.getSettings().maxTilt:18,t=$===`flight`?(Dy.has(`w`)?e:0)-(Dy.has(`s`)?e:0):(Dy.has(`s`)?22:0)-(Dy.has(`w`)?18:0),r=(Dy.has(`d`)?18:0)-(Dy.has(`a`)?18:0),i=$===`flight`&&Cv===`twist`?0:r,a=$===`flight`?Cv===`twist`?r:ky:ky+(Dy.has(`e`)?22:0)-(Dy.has(`q`)?22:0);$===`flight`&&(Dy.has(`e`)||Dy.has(`q`))&&zy(xy+(+!!Dy.has(`e`)-!!Dy.has(`q`))*n*.4),fb(t,i,((a+180)%360+360)%360-180)}let e=em(Ey);vy=Qp(vy,ib(e,e,Ty,Ty)),Hv=vy.held}}yy=Q===`running`?$===`flight`?Nh(vy,{pitchMode:wv,steering:Cv,settings:Yv.getSettings(),currentPitch:yv.getStatus().controlPitch,dt:n}):rm(vy):{pitchRate:0,yawRate:0,bankAngle:0,acceleration:0,brake:0};let t=Q===`running`,r=t&&$===`flight`;Q===`running`&&($===`explore`&&(by=om(by,n,yy)),yv.update(n,{...yy,mode:$,speed:by,throttle:Math.min(1,xy),manualAfterburner:Sy,pitchInputDegrees:vy.pitch,speedSettings:Yv.getSettings(),craftQuaternion:wy,...$===`flight`?{displayTwist:vy.twist,displayScreenOffset:Vv===`sensor`?Ny()-sy:0,displayTimeConstant:Yv.getSettings().displayTimeConstant,chaseTimeConstant:Yv.getSettings().chaseTimeConstant,cockpitFov:Yv.getSettings().cockpitFov,turnGravity:Yv.getSettings().turnGravity,maxBank:Yv.getSettings().maxBank}:{}}));let i=yv.getStatus(),a=t?Math.max(0,(e-Gv)/1e3):0;if(t){let t=wb(i);kv.advance(a,{...i,targetVisible:t,exitVisible:i.collected===i.total&&Cb(i)}),Gv=e,Av.advance(a,i),jv.advance(i)}if(r&&(Dv.advance(a,i),Ov.advance(i.afterburner)),Q===`running`&&$===`flight`&&!i.grounded&&(My={throttle:i.throttle,pitch:i.pitch,verticalSpeed:i.verticalSpeed,inputPitch:vy.pitch,deadzone:Yv.getSettings().deadzone}),i.collected>Ay){Ay=i.collected,zv.event(`collect`);let t=P(Yv.getSettings().hudLanguage);i.collected===i.total&&Sv===`assisted`?(Wv=e+3500,zv.exitOpened(),ub(t===`ja`?`出口が開きました。黄色と白の門へ向かいましょう。`:F(t,`exitOpen`))):ub(se(i,t))}if(i.complete&&Q===`running`){let e=kv.snapshot();e.every(e=>Number.isFinite(e.seconds))&&(Pv=Nv.complete(xv,$,e.reduce((e,t)=>e+t.seconds,0))),$y(),Fy(`complete`),zv.event(`clear`),Xy({title:`出口に到着しました`,description:$===`flight`?`${i.total}つの光を集めて飛行クリア。傾きとスロットルは操作しやすかったですか？`:`${i.total}つの光を集めて、探索クリア。傾きと回転は操作しやすかったですか？`,note:`楽な持ち方に戻してから、もう一度試せます。`,action:`もう一度遊ぶ`}),Yv.showResult(Yv.report(Dv.snapshot(),`clear`,Dv.lastLegSnapshot()))}if(i.grounded&&Q===`running`){let e=`地面まで0mで接触しました。`;if(My){let t=My,n=Math.round(W.radToDeg(t.pitch)),r=Math.abs(n)<1?`機首ほぼ水平`:`機首${n>0?`上`:`下`}${Math.abs(n)}°`,i=Math.abs(t.inputPitch)<=t.deadzone?`中立`:`${t.inputPitch<0?`前倒し`:`手前へ起こし`}${Math.round(Math.abs(t.inputPitch))}°`;e=`接地直前：出力${Math.round(t.throttle*100)}%・${r}・下降${Math.max(0,-t.verticalSpeed).toFixed(1)}m/s。前後操作：${i}。`}eb(`地面に接触して停止しました。最初から飛び直せます。`),zv.event(`crash`),Xy({title:`地面に接触して停止`,description:e,note:`飛び直すと出発地点から出力50%で始まります。`,action:`最初から飛び直す`}),Yv.showResult(Yv.report(Dv.snapshot(),`grounded`,Dv.lastLegSnapshot()))}Tb(e,i),Wg(i,$===`flight`&&Ev===`cockpit`&&Q===`running`,{language:Q===`running`?Yv.getSettings().hudLanguage:`ja`});let o=Fp(i,{phase:Q,camera:Ev,settings:Yv.getSettings(),now:e,dt:n});if($f(i,{phase:Q,settings:Yv.getSettings()}),zv.update(i,vy,Vv,Cv,e,{enabled:Q===`running`&&$===`flight`&&Yv.getSettings().audioGuidance,bearingDeg:o?.bearingDeg}),Q===`running`)for(let e of Mv.advance(a,{...i,objects:ty(i)}))zv.passBy(e)}zv.frameTiming(performance.now()-t),e>jy&&(X(`toast`).hidden=!0),requestAnimationFrame(Db)}Gy();try{yv=_h(vv,{visibility:Sv,display:Tv,cameraMode:Ev,course:xv,turnGravity:Yv.getSettings().turnGravity}),yv.update(0,{mode:$,speed:0,craftQuaternion:wy}),yv.setGroundPatternStrength(Yv.getSettings().groundPatternStrength),ny(),_b(),Bv.initialize(),requestAnimationFrame(Db)}catch(e){Fy(`error`),Xy({title:`3D画面を表示できません`,description:`WebGLに対応したSafariやChromeで開き直してください。`,action:`再読み込みする`,error:e.message||`3D描画の開始に失敗しました。`}),X(`practice-button`).hidden=!0}