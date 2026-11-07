(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=Object.freeze({defaultGravity:9.8,minGravity:3,maxGravity:15,yawCap:2.5,minSpeed:6}),t=(e,t,n)=>Math.min(n,Math.max(t,e)),n=e=>Number.isFinite(e)?e:0,r=e=>({x:n(e?.x),y:n(e?.y),z:n(e?.z)});function i(n){return Number.isFinite(n)?t(n,e.minGravity,e.maxGravity):e.defaultGravity}function a(n,r,a=e.defaultGravity){if(!Number.isFinite(r)||r<=0||!Number.isFinite(n))return 0;let o=t(n,-Math.PI/2+1e-8,Math.PI/2-1e-8);return t(i(a)*Math.tan(o)/Math.max(r,e.minSpeed),-e.yawCap,e.yawCap)}function o(t,n,r=e.defaultGravity){if(!Number.isFinite(t)||t<=0)return 0;let i=Math.abs(a(n,t,r));return i>0?t/i:1/0}function s(i,a,o,s){let c=r(i);if(!Number.isFinite(s)||s<=0)return c;let l=Math.hypot(c.x,c.z);if(!l||!Number.isFinite(l))return c;let u=r(a),d=Math.hypot(u.x,u.z)>1e-10?u:c,f=t(n(o),-e.yawCap,e.yawCap)*s,p=Math.atan2(d.x,-d.z)+(Number.isFinite(f)?f:0);return{x:Math.sin(p)*l,y:c.y,z:-Math.cos(p)*l}}var c=(e,t,n)=>Object.freeze({x:e,y:t,z:n}),l=(e,t,n,r,i)=>Object.freeze({id:e,name:t,start:Object.freeze(n),lights:Object.freeze(r.map(Object.freeze)),exit:Object.freeze(i)}),u=l(`legacy`,`v0.1.25 比較用`,c(0,14,26),[c(0,14,0),c(4,16,-34),c(4,18,-68)],c(8,20,-96)),d=u,f=`easy`,p=Object.freeze({easy:l(`easy`,`やさしい・おおきな半周`,c(-125,22,160),[c(-125,24,120),c(-62.5,30,11.747),c(62.5,24,11.747)],c(125,28,120)),normal:l(`normal`,`ふつう・右から左へ`,c(-140,22,240),[c(-140,24,170),c(-85,30,74.737),c(25,24,74.737),c(135,32,74.737),c(190,24,-20.526)],c(135,30,-115.788)),hard:l(`hard`,`むずかしい・二つのうず`,c(-190,24,80),[c(-190,28,20),c(-147.5,38,-53.612),c(-62.5,28,-53.612),c(-20,38,20),c(-62.5,28,93.612),c(-105,38,167.224),c(-62.5,28,240.836),c(22.5,38,240.836)],c(65,28,167.224))});function m(e){return typeof e==`string`&&(e===`legacy`||Object.hasOwn(p,e))?e:f}function h(e){let t=m(e);return t===`legacy`?u:p[t]}var g=(e,t,n,r)=>Object.freeze({lightCountRange:Object.freeze(e),utilizationBand:Object.freeze(t),minSignificantTurns:n,cruiseTimeRange:Object.freeze(r)}),_=Object.freeze({speeds:Object.freeze([10,20]),difficultySpeed:20,cruiseSpeed:10,bankDegrees:30,turnGravity:e.defaultGravity,minimumTurnDegrees:45,maximumUtilization:1,limits:Object.freeze({horizontal:350,minHeight:2,maxHeight:45,heightChange:10,minLights:3,maxLights:8}),difficulties:Object.freeze({easy:g([3,4],[.3,.6],2,[30,45]),normal:g([5,6],[.4,.8],3,[45,75]),hard:g([7,8],[.6,.9],6,[60,90])})}),v=`twist.course.v1`,y=e=>typeof e==`string`&&m(e)===e&&h(e).id===e;function b(e,t=``){try{let e=(typeof t==`string`?new URLSearchParams(t):t instanceof URL?t.searchParams:t instanceof URLSearchParams?t:null)?.get(`course`);if(y(e))return e}catch{}try{let t=e?.getItem(v);if(y(t))return t}catch{}return m()}function x(e,t){if(!y(t))return!1;try{return e.setItem(v,t),!0}catch{return!1}}var S=(e,t,n)=>Math.min(n,Math.max(t,e)),C=e=>((e+180)%360+360)%360-180;function w(e,t={}){if(!e||![e.x,e.z].every(Number.isFinite)||!t||typeof t!=`object`)return null;let{halfExtent:n=350}=t;if(!Number.isFinite(n)||n<=0)return null;let r=Number.isFinite(t.heading)?t.heading%(Math.PI*2):0,a=Number.isFinite(t.speed)?Math.max(0,t.speed):0,s=i(t.turnGravity),c=Number.isFinite(t.maxBank)&&t.maxBank>=0&&t.maxBank<90?t.maxBank:40,l=o(a,c*Math.PI/180,s),u=Math.min(60,n*.6),d=Math.max(u,n*.75),f=S(Number.isFinite(l)?Math.max(u,l*1.3+a*2):d,u,d),p=n-Math.max(Math.abs(e.x),Math.abs(e.z)),m=p<0,h=p<=f,g=Math.max(0,n-f-10),_={x:S(e.x,-g,g),y:Number.isFinite(e.y)?e.y:0,z:S(e.z,-g,g)},v=_.x-e.x,y=_.z-e.z;v===0&&y===0&&(_={x:0,y:_.y,z:0},v=-e.x,y=-e.z);let b=Math.max(Math.abs(v),Math.abs(y)),x=null,w=null,T=null;if(b>0){let e=v/b,t=y/b,n=Math.hypot(e,t);x={x:e/n,y:0,z:t/n},w=Math.atan2(x.x,-x.z),T=C((w-r)*180/Math.PI),T===-180&&(T=180)}let E=Math.abs(e.x)>=Math.abs(e.z)?e.x<0?`west`:`east`:e.z<0?`north`:`south`,D=t.velocity,O=D&&[D.x,D.z].every(Number.isFinite)?D:{x:Math.sin(r)*a,z:-Math.cos(r)*a},k=[{distance:n-e.x,outward:O.x},{distance:n+e.x,outward:-O.x},{distance:n-e.z,outward:O.z},{distance:n+e.z,outward:-O.z}].filter(e=>Math.abs(e.distance-p)<=1e-7),A=Math.max(...k.map(e=>e.outward)),j=A>.1,ee=A<-.1,M=j?`outward`:ee?`inward`:Math.hypot(O.x,O.z)>.1?`parallel`:`stopped`,te=j?Math.max(0,p)/A:null;return{halfExtent:n,clearance:p,near:h,outside:m,level:m?`outside`:h?`near`:`clear`,warningDistance:f,turnRadius:Number.isFinite(l)?l:null,turnGravity:s,maxBank:c,returnPosition:_,returnDirection:x,returnHeading:w,returnBearingDeg:T,nearestEdge:E,outwardSpeed:A,motion:M,approaching:j,returning:ee,timeToEdge:te}}var T=1e3,E=1001,D=1002,O=1003,k=1004,A=1005,j=1006,ee=1007,M=1008,te=1009,N=1010,P=1011,ne=1012,re=1013,ie=1014,ae=1015,F=1016,oe=1017,se=1018,ce=1020,I=35902,le=35899,ue=1021,de=1022,fe=1023,pe=1026,L=1027,me=1028,he=1029,ge=1030,_e=1031,ve=1033,ye=33776,be=33777,xe=33778,Se=33779,Ce=35840,we=35841,Te=35842,Ee=35843,De=36196,Oe=37492,ke=37496,Ae=37488,je=37489,R=37490,Me=37491,Ne=37808,Pe=37809,z=37810,Fe=37811,B=37812,Ie=37813,Le=37814,Re=37815,ze=37816,Be=37817,Ve=37818,He=37819,Ue=37820,We=37821,Ge=36492,Ke=36494,qe=36495,Je=36283,Ye=36284,Xe=36285,Ze=36286,Qe=2300,$e=2301,et=2302,tt=2303,nt=2400,rt=2401,it=2402,at=3200,ot=`srgb`,st=`srgb-linear`,ct=`linear`,lt=`srgb`,ut=7680,dt=35044,ft=2e3;function pt(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function mt(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function ht(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function gt(){let e=ht(`canvas`);return e.style.display=`block`,e}var _t={};function vt(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function yt(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function V(...e){e=yt(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function H(...e){e=yt(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function bt(...e){let t=e.join(` `);t in _t||(_t[t]=!0,V(...e))}function xt(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var St={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},Ct=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},wt=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),Tt=1234567,Et=Math.PI/180,Dt=180/Math.PI;function Ot(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(wt[e&255]+wt[e>>8&255]+wt[e>>16&255]+wt[e>>24&255]+`-`+wt[t&255]+wt[t>>8&255]+`-`+wt[t>>16&15|64]+wt[t>>24&255]+`-`+wt[n&63|128]+wt[n>>8&255]+`-`+wt[n>>16&255]+wt[n>>24&255]+wt[r&255]+wt[r>>8&255]+wt[r>>16&255]+wt[r>>24&255]).toLowerCase()}function kt(e,t,n){return Math.max(t,Math.min(n,e))}function At(e,t){return(e%t+t)%t}function jt(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function Mt(e,t,n){return e===t?0:(n-e)/(t-e)}function Nt(e,t,n){return(1-n)*e+n*t}function Pt(e,t,n,r){return Nt(e,t,1-Math.exp(-n*r))}function Ft(e,t=1){return t-Math.abs(At(e,t*2)-t)}function It(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function Lt(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function Rt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function zt(e,t){return e+Math.random()*(t-e)}function Bt(e){return e*(.5-Math.random())}function Vt(e){e!==void 0&&(Tt=e);let t=Tt+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ht(e){return e*Et}function Ut(e){return e*Dt}function Wt(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Gt(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Kt(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function qt(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:V(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Jt(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Yt(e,t){if(t.constructor===Float32Array)return e;let n=Jt(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function Xt(e,t){if(t.constructor===Float32Array)return e;let n=Jt(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var U={DEG2RAD:Et,RAD2DEG:Dt,generateUUID:Ot,clamp:kt,euclideanModulo:At,mapLinear:jt,inverseLerp:Mt,lerp:Nt,damp:Pt,pingpong:Ft,smoothstep:It,smootherstep:Lt,randInt:Rt,randFloat:zt,randFloatSpread:Bt,seededRandom:Vt,degToRad:Ht,radToDeg:Ut,isPowerOfTwo:Wt,ceilPowerOfTwo:Gt,floorPowerOfTwo:Kt,setQuaternionFromProperEuler:qt,normalize:Xt,denormalize:Yt},W=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=kt(this.x,e.x,t.x),this.y=kt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=kt(this.x,e,t),this.y=kt(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(kt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(kt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},G=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:V(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(kt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},K=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Qt.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Qt.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=kt(this.x,e.x,t.x),this.y=kt(this.y,e.y,t.y),this.z=kt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=kt(this.x,e,t),this.y=kt(this.y,e,t),this.z=kt(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(kt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Zt.copy(this).projectOnVector(e),this.sub(Zt)}reflect(e){return this.sub(Zt.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(kt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Zt=new K,Qt=new G,q=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return bt(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply($t.makeScale(e,t)),this}rotate(e){return bt(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply($t.makeRotation(-e)),this}translate(e,t){return bt(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply($t.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},$t=new q,en=new q().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),tn=new q().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function nn(){let e={enabled:!0,workingColorSpace:st,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=an(e.r),e.g=an(e.g),e.b=an(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=on(e.r),e.g=on(e.g),e.b=on(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?ct:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[st]:{primaries:t,whitePoint:r,transfer:ct,toXYZ:en,fromXYZ:tn,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:ot},outputColorSpaceConfig:{drawingBufferColorSpace:ot}},[ot]:{primaries:t,whitePoint:r,transfer:lt,toXYZ:en,fromXYZ:tn,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:ot}}}),e}var rn=nn();function an(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function on(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var sn,cn=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{sn===void 0&&(sn=ht(`canvas`)),sn.width=e.width,sn.height=e.height;let t=sn.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=sn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=ht(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=an(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(an(t[e]/255)*255):t[e]=an(t[e]);return{data:t,width:e.width,height:e.height}}return V(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},ln=0,un=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ln++}),this.uuid=Ot(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(dn(r[t].image)):e.push(dn(r[t]))}else e=dn(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function dn(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?cn.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(V(`Texture: Unable to serialize Texture.`),{})}var fn=0,pn=new K,mn=class e extends Ct{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=E,i=E,a=j,o=M,s=fe,c=te,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:fn++}),this.uuid=Ot(),this.name=``,this.source=new un(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new W(0,0),this.repeat=new W(1,1),this.center=new W(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new q,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(pn).x}get height(){return this.source.getSize(pn).y}get depth(){return this.source.getSize(pn).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){V(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?V(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case T:e.x-=Math.floor(e.x);break;case E:e.x=e.x<0?0:1;break;case D:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case T:e.y-=Math.floor(e.y);break;case E:e.y=e.y<0?0:1;break;case D:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};mn.DEFAULT_IMAGE=null,mn.DEFAULT_MAPPING=300,mn.DEFAULT_ANISOTROPY=1;var hn=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=kt(this.x,e.x,t.x),this.y=kt(this.y,e.y,t.y),this.z=kt(this.z,e.z,t.z),this.w=kt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=kt(this.x,e,t),this.y=kt(this.y,e,t),this.z=kt(this.z,e,t),this.w=kt(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(kt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},gn=class extends Ct{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:j,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new hn(0,0,e,t),this.scissorTest=!1,this.viewport=new hn(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new mn({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:j,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new un(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},_n=class extends gn{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},vn=class extends mn{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=O,this.minFilter=O,this.wrapR=E,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},yn=class extends mn{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=O,this.minFilter=O,this.wrapR=E,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},bn=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/xn.setFromMatrixColumn(e,0).length(),i=1/xn.setFromMatrixColumn(e,1).length(),a=1/xn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Cn,e,wn)}lookAt(e,t,n){let r=this.elements;return Dn.subVectors(e,t),Dn.lengthSq()===0&&(Dn.z=1),Dn.normalize(),Tn.crossVectors(n,Dn),Tn.lengthSq()===0&&(Math.abs(n.z)===1?Dn.x+=1e-4:Dn.z+=1e-4,Dn.normalize(),Tn.crossVectors(n,Dn)),Tn.normalize(),En.crossVectors(Dn,Tn),r[0]=Tn.x,r[4]=En.x,r[8]=Dn.x,r[1]=Tn.y,r[5]=En.y,r[9]=Dn.y,r[2]=Tn.z,r[6]=En.z,r[10]=Dn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],te=r[7],N=r[11],P=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*j+c*N,i[12]=a*w+o*O+s*ee+c*P,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*j+f*N,i[13]=l*w+u*O+d*ee+f*P,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*j+g*N,i[14]=p*w+m*O+h*ee+g*P,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*j+b*N,i[15]=_*w+v*O+y*ee+b*P,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=xn.set(r[0],r[1],r[2]).length(),o=xn.set(r[4],r[5],r[6]).length(),s=xn.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Sn.copy(this);let c=1/a,l=1/o,u=1/s;return Sn.elements[0]*=c,Sn.elements[1]*=c,Sn.elements[2]*=c,Sn.elements[4]*=l,Sn.elements[5]*=l,Sn.elements[6]*=l,Sn.elements[8]*=u,Sn.elements[9]*=u,Sn.elements[10]*=u,t.setFromRotationMatrix(Sn),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=ft,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=ft,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},xn=new K,Sn=new bn,Cn=new K(0,0,0),wn=new K(1,1,1),Tn=new K,En=new K,Dn=new K,On=new bn,kn=new G,An=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(kt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-kt(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(kt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-kt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(kt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-kt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:V(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return On.makeRotationFromQuaternion(e),this.setFromRotationMatrix(On,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return kn.setFromEuler(this),this.setFromQuaternion(kn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};An.DEFAULT_ORDER=`XYZ`;var jn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Mn=0,Nn=new K,Pn=new G,Fn=new bn,In=new K,Ln=new K,Rn=new K,zn=new G,Bn=new K(1,0,0),Vn=new K(0,1,0),Hn=new K(0,0,1),Un={type:`added`},Wn={type:`removed`},Gn={type:`childadded`,child:null},Kn={type:`childremoved`,child:null},qn=class e extends Ct{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Mn++}),this.uuid=Ot(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new K,n=new An,r=new G,i=new K(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new bn},normalMatrix:{value:new q}}),this.matrix=new bn,this.matrixWorld=new bn,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new jn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Pn.setFromAxisAngle(e,t),this.quaternion.multiply(Pn),this}rotateOnWorldAxis(e,t){return Pn.setFromAxisAngle(e,t),this.quaternion.premultiply(Pn),this}rotateX(e){return this.rotateOnAxis(Bn,e)}rotateY(e){return this.rotateOnAxis(Vn,e)}rotateZ(e){return this.rotateOnAxis(Hn,e)}translateOnAxis(e,t){return Nn.copy(e).applyQuaternion(this.quaternion),this.position.add(Nn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Bn,e)}translateY(e){return this.translateOnAxis(Vn,e)}translateZ(e){return this.translateOnAxis(Hn,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Fn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?In.copy(e):In.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Ln.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Fn.lookAt(Ln,In,this.up):Fn.lookAt(In,Ln,this.up),this.quaternion.setFromRotationMatrix(Fn),r&&(Fn.extractRotation(r.matrixWorld),Pn.setFromRotationMatrix(Fn),this.quaternion.premultiply(Pn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(H(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Un),Gn.child=e,this.dispatchEvent(Gn),Gn.child=null):H(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Wn),Kn.child=e,this.dispatchEvent(Kn),Kn.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Fn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Fn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Fn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Un),Gn.child=e,this.dispatchEvent(Gn),Gn.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ln,e,Rn),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ln,zn,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};qn.DEFAULT_UP=new K(0,1,0),qn.DEFAULT_MATRIX_AUTO_UPDATE=!0,qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Jn=class extends qn{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Yn={type:`move`},Xn=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Jn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Jn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new K,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new K),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Jn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new K,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new K,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Yn)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Jn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Zn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Qn={h:0,s:0,l:0},$n={h:0,s:0,l:0};function er(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var tr=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ot){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,rn.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=rn.workingColorSpace){return this.r=e,this.g=t,this.b=n,rn.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=rn.workingColorSpace){if(e=At(e,1),t=kt(t,0,1),n=kt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=er(i,r,e+1/3),this.g=er(i,r,e),this.b=er(i,r,e-1/3)}return rn.colorSpaceToWorking(this,r),this}setStyle(e,t=ot){function n(t){t!==void 0&&parseFloat(t)<1&&V(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:V(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);V(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ot){let n=Zn[e.toLowerCase()];return n===void 0?V(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=an(e.r),this.g=an(e.g),this.b=an(e.b),this}copyLinearToSRGB(e){return this.r=on(e.r),this.g=on(e.g),this.b=on(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ot){return rn.workingToColorSpace(nr.copy(this),e),Math.round(kt(nr.r*255,0,255))*65536+Math.round(kt(nr.g*255,0,255))*256+Math.round(kt(nr.b*255,0,255))}getHexString(e=ot){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=rn.workingColorSpace){rn.workingToColorSpace(nr.copy(this),t);let n=nr.r,r=nr.g,i=nr.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=rn.workingColorSpace){return rn.workingToColorSpace(nr.copy(this),t),e.r=nr.r,e.g=nr.g,e.b=nr.b,e}getStyle(e=ot){rn.workingToColorSpace(nr.copy(this),e);let t=nr.r,n=nr.g,r=nr.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Qn),this.setHSL(Qn.h+e,Qn.s+t,Qn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Qn),e.getHSL($n);let n=Nt(Qn.h,$n.h,t),r=Nt(Qn.s,$n.s,t),i=Nt(Qn.l,$n.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},nr=new tr;tr.NAMES=Zn;var rr=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new tr(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},ir=class extends qn{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new An,this.environmentIntensity=1,this.environmentRotation=new An,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},ar=new K,or=new K,sr=new K,cr=new K,lr=new K,ur=new K,dr=new K,fr=new K,pr=new K,mr=new K,hr=new hn,gr=new hn,_r=new hn,vr=class e{constructor(e=new K,t=new K,n=new K){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),ar.subVectors(e,t),r.cross(ar);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){ar.subVectors(r,t),or.subVectors(n,t),sr.subVectors(e,t);let a=ar.dot(ar),o=ar.dot(or),s=ar.dot(sr),c=or.dot(or),l=or.dot(sr),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,cr)!==null&&cr.x>=0&&cr.y>=0&&cr.x+cr.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,cr)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,cr.x),s.addScaledVector(a,cr.y),s.addScaledVector(o,cr.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return hr.setScalar(0),gr.setScalar(0),_r.setScalar(0),hr.fromBufferAttribute(e,t),gr.fromBufferAttribute(e,n),_r.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(hr,i.x),a.addScaledVector(gr,i.y),a.addScaledVector(_r,i.z),a}static isFrontFacing(e,t,n,r){return ar.subVectors(n,t),or.subVectors(e,t),ar.cross(or).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ar.subVectors(this.c,this.b),or.subVectors(this.a,this.b),ar.cross(or).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;lr.subVectors(r,n),ur.subVectors(i,n),fr.subVectors(e,n);let s=lr.dot(fr),c=ur.dot(fr);if(s<=0&&c<=0)return t.copy(n);pr.subVectors(e,r);let l=lr.dot(pr),u=ur.dot(pr);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(lr,a);mr.subVectors(e,i);let f=lr.dot(mr),p=ur.dot(mr);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(ur,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return dr.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(dr,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(lr,a).addScaledVector(ur,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},yr=class{constructor(e=new K(1/0,1/0,1/0),t=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(xr.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(xr.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=xr.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,xr):xr.fromBufferAttribute(r,t),xr.applyMatrix4(e.matrixWorld),this.expandByPoint(xr);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Sr.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Sr.copy(e.boundingBox)),Sr.applyMatrix4(e.matrixWorld),this.union(Sr)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,xr),xr.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(kr),Ar.subVectors(this.max,kr),Cr.subVectors(e.a,kr),wr.subVectors(e.b,kr),Tr.subVectors(e.c,kr),Er.subVectors(wr,Cr),Dr.subVectors(Tr,wr),Or.subVectors(Cr,Tr);let t=[0,-Er.z,Er.y,0,-Dr.z,Dr.y,0,-Or.z,Or.y,Er.z,0,-Er.x,Dr.z,0,-Dr.x,Or.z,0,-Or.x,-Er.y,Er.x,0,-Dr.y,Dr.x,0,-Or.y,Or.x,0];return!Nr(t,Cr,wr,Tr,Ar)||(t=[1,0,0,0,1,0,0,0,1],!Nr(t,Cr,wr,Tr,Ar))?!1:(jr.crossVectors(Er,Dr),t=[jr.x,jr.y,jr.z],Nr(t,Cr,wr,Tr,Ar))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,xr).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(xr).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(br[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),br[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),br[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),br[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),br[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),br[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),br[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),br[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(br)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},br=[new K,new K,new K,new K,new K,new K,new K,new K],xr=new K,Sr=new yr,Cr=new K,wr=new K,Tr=new K,Er=new K,Dr=new K,Or=new K,kr=new K,Ar=new K,jr=new K,Mr=new K;function Nr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Mr.fromArray(e,a);let o=i.x*Math.abs(Mr.x)+i.y*Math.abs(Mr.y)+i.z*Math.abs(Mr.z),s=t.dot(Mr),c=n.dot(Mr),l=r.dot(Mr);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Pr=new K,Fr=new W,Ir=0,Lr=class extends Ct{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ir++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=dt,this.updateRanges=[],this.gpuType=ae,this.version=0,this._normalizationScale=e===void 0?void 0:Jt(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Fr.fromBufferAttribute(this,t),Fr.applyMatrix3(e),this.setXY(t,Fr.x,Fr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Pr.fromBufferAttribute(this,t),Pr.applyMatrix3(e),this.setXYZ(t,Pr.x,Pr.y,Pr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Pr.fromBufferAttribute(this,t),Pr.applyMatrix4(e),this.setXYZ(t,Pr.x,Pr.y,Pr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Pr.fromBufferAttribute(this,t),Pr.applyNormalMatrix(e),this.setXYZ(t,Pr.x,Pr.y,Pr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Pr.fromBufferAttribute(this,t),Pr.transformDirection(e),this.setXYZ(t,Pr.x,Pr.y,Pr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?Yt(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?Xt(e,this.array):Math.round(e*t)}},Rr=class extends Lr{constructor(e,t,n){super(new Uint16Array(e),t,n)}},zr=class extends Lr{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Br=class extends Lr{constructor(e,t,n){super(new Float32Array(e),t,n)}},Vr=new yr,Hr=new K,Ur=new K,Wr=class{constructor(e=new K,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Vr.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Hr.subVectors(e,this.center);let t=Hr.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(Hr,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ur.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Hr.copy(e.center).add(Ur)),this.expandByPoint(Hr.copy(e.center).sub(Ur))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Gr=0,Kr=new bn,qr=new qn,Jr=new K,Yr=new yr,Xr=new yr,Zr=new K,Qr=class e extends Ct{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Gr++}),this.uuid=Ot(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(pt(e)?zr:Rr)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new q().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Kr.makeRotationFromQuaternion(e),this.applyMatrix4(Kr),this}rotateX(e){return Kr.makeRotationX(e),this.applyMatrix4(Kr),this}rotateY(e){return Kr.makeRotationY(e),this.applyMatrix4(Kr),this}rotateZ(e){return Kr.makeRotationZ(e),this.applyMatrix4(Kr),this}translate(e,t,n){return Kr.makeTranslation(e,t,n),this.applyMatrix4(Kr),this}scale(e,t,n){return Kr.makeScale(e,t,n),this.applyMatrix4(Kr),this}lookAt(e){return qr.lookAt(e),qr.updateMatrix(),this.applyMatrix4(qr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Jr).negate(),this.translate(Jr.x,Jr.y,Jr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Br(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&V(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new yr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)H(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Yr.setFromBufferAttribute(n),this.morphTargetsRelative?(Zr.addVectors(this.boundingBox.min,Yr.min),this.boundingBox.expandByPoint(Zr),Zr.addVectors(this.boundingBox.max,Yr.max),this.boundingBox.expandByPoint(Zr)):(this.boundingBox.expandByPoint(Yr.min),this.boundingBox.expandByPoint(Yr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&H(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Wr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)H(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new K,1/0);else if(e){let n=this.boundingSphere.center;if(Yr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Xr.setFromBufferAttribute(n),this.morphTargetsRelative?(Zr.addVectors(Yr.min,Xr.min),Yr.expandByPoint(Zr),Zr.addVectors(Yr.max,Xr.max),Yr.expandByPoint(Zr)):(Yr.expandByPoint(Xr.min),Yr.expandByPoint(Xr.max))}Yr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Zr.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Zr));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Zr.fromBufferAttribute(a,t),o&&(Jr.fromBufferAttribute(e,t),Zr.add(Jr)),r=Math.max(r,n.distanceToSquared(Zr))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&H(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){H(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Lr(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new K,s[e]=new K;let l=new K,u=new K,d=new K,f=new W,p=new W,m=new W,h=new K,g=new K;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new K,b=new K,x=new K,S=new K;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Lr(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new K,i=new K,a=new K,o=new K,s=new K,c=new K,l=new K,u=new K;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Zr.fromBufferAttribute(e,t),Zr.normalize(),e.setXYZ(t,Zr.x,Zr.y,Zr.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Lr(a,r,i)}if(this.index===null)return V(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},$r=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=dt,this.updateRanges=[],this.version=0,this.uuid=Ot()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=ei(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);let n=new this.array.constructor(e.arrayBuffers[t]),r=new this.constructor(n,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=ei(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}};function ei(e){return e.buffer._uuid===void 0&&(e.buffer._uuid=Ot()),e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer._uuid:e.buffer._uuid+`:`+e.byteOffset+`:`+e.byteLength}var ti=new K,ni=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r,this._normalizationScale=e===void 0?void 0:Jt(e.array)}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)ti.fromBufferAttribute(this,t),ti.applyMatrix4(e),this.setXYZ(t,ti.x,ti.y,ti.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ti.fromBufferAttribute(this,t),ti.applyNormalMatrix(e),this.setXYZ(t,ti.x,ti.y,ti.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ti.fromBufferAttribute(this,t),ti.transformDirection(e),this.setXYZ(t,ti.x,ti.y,ti.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){vt(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Lr(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){vt(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){let t=this._normalizationScale;return t===void 0?Yt(e,this.data.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?Xt(e,this.data.array):Math.round(e*t)}},ri=new K,ii=new K,ai=new q,oi=class{constructor(e=new K(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=ri.subVectors(n,t).cross(ii.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(ri),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||ai.getNormalMatrix(e),r=this.coplanarPoint(ri).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},si=0,ci=class extends Ct{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:si++}),this.uuid=Ot(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new tr(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ut,this.stencilZFail=ut,this.stencilZPass=ut,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){V(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?V(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new tr().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new oi().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new W().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new W().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},li=class extends ci{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new tr(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ui,di=new K,fi=new K,pi=new K,mi=new W,hi=new W,gi=new bn,_i=new K,vi=new K,yi=new K,bi=new W,xi=new W,Si=new W,Ci=class extends qn{constructor(e=new li){if(super(),this.isSprite=!0,this.type=`Sprite`,ui===void 0){ui=new Qr;let e=new $r(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);ui.setIndex([0,1,2,0,2,3]),ui.setAttribute(`position`,new ni(e,3,0,!1)),ui.setAttribute(`uv`,new ni(e,2,3,!1))}this.geometry=ui,this.material=e,this.center=new W(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&H(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),fi.setFromMatrixScale(this.matrixWorld),gi.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),pi.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&fi.multiplyScalar(-pi.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;wi(_i.set(-.5,-.5,0),pi,a,fi,r,i),wi(vi.set(.5,-.5,0),pi,a,fi,r,i),wi(yi.set(.5,.5,0),pi,a,fi,r,i),bi.set(0,0),xi.set(1,0),Si.set(1,1);let o=e.ray.intersectTriangle(_i,vi,yi,!1,di);if(o===null&&(wi(vi.set(-.5,.5,0),pi,a,fi,r,i),xi.set(0,1),o=e.ray.intersectTriangle(_i,yi,vi,!1,di),o===null))return;let s=e.ray.origin.distanceTo(di);s<e.near||s>e.far||t.push({distance:s,point:di.clone(),uv:vr.getInterpolation(di,_i,vi,yi,bi,xi,Si,new W),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}toJSON(e){let t=super.toJSON(e);return t.object.center=this.center.toArray(),t}};function wi(e,t,n,r,i,a){mi.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?hi.copy(mi):(hi.x=a*mi.x-i*mi.y,hi.y=i*mi.x+a*mi.y),e.copy(t),e.x+=hi.x,e.y+=hi.y,e.applyMatrix4(gi)}var Ti=new K,Ei=new K,Di=new K,Oi=new K,ki=class{constructor(e=new K,t=new K(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ti)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Ti.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ti.copy(this.origin).addScaledVector(this.direction,t),Ti.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Ei.copy(e).add(t).multiplyScalar(.5),Di.copy(t).sub(e).normalize(),Oi.copy(this.origin).sub(Ei);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Di),o=Oi.dot(this.direction),s=-Oi.dot(Di),c=Oi.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Ei).addScaledVector(Di,d),f}intersectSphere(e,t){if(e.radius<0)return null;Ti.subVectors(e.center,this.origin);let n=Ti.dot(this.direction),r=Ti.dot(Ti)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Ti)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let te=S/w,N=C/w,P=1/w,ne=T-te*D,re=E-N*D,ie=O-te*A,ae=k-N*A,F=j-te*M,oe=ee-N*M,se=F*ae-oe*ie,ce=ne*oe-re*F,I=ie*re-ae*ne;if(r){if(se<0||ce<0||I<0)return null}else if((se<0||ce<0||I<0)&&(se>0||ce>0||I>0))return null;let le=se+ce+I;if(le===0)return null;let ue=P*(se*D+ce*A+I*M);return(le>0?ue<0:ue>0)?null:this.at(ue/le,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ai=class extends ci{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new tr(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new An,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ji=new bn,Mi=new ki,Ni=new Wr,Pi=new K,Fi=new K,Ii=new K,Li=new K,Ri=new K,zi=new K,Bi=new K,Vi=new K,Hi=class extends qn{constructor(e=new Qr,t=new Ai){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){zi.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Ri.fromBufferAttribute(s,e),a?zi.addScaledVector(Ri,r):zi.addScaledVector(Ri.sub(t),r))}t.add(zi)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ni.copy(n.boundingSphere),Ni.applyMatrix4(i),Mi.copy(e.ray).recast(e.near),Ni.containsPoint(Mi.origin)===!1&&(Mi.intersectSphere(Ni,Pi)===null||Mi.origin.distanceToSquared(Pi)>(e.far-e.near)**2)||(ji.copy(i).invert(),Mi.copy(e.ray).applyMatrix4(ji),(n.boundingBox===null||Mi.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Mi)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Wi(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Wi(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Wi(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Wi(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Ui(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Vi.copy(s),Vi.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Vi);return l<n.near||l>n.far?null:{distance:l,point:Vi.clone(),object:e}}function Wi(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Fi),e.getVertexPosition(c,Ii),e.getVertexPosition(l,Li);let u=Ui(e,t,n,r,Fi,Ii,Li,Bi);if(u){let e=new K;vr.getBarycoord(Bi,Fi,Ii,Li,e),i&&(u.uv=vr.getInterpolatedAttribute(i,s,c,l,e,new W)),a&&(u.uv1=vr.getInterpolatedAttribute(a,s,c,l,e,new W)),o&&(u.normal=vr.getInterpolatedAttribute(o,s,c,l,e,new K),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new K,materialIndex:0};vr.getNormal(Fi,Ii,Li,t.normal),u.face=t,u.barycoord=e}return u}var Gi=class extends mn{constructor(e=null,t=1,n=1,r,i,a,o,s,c=O,l=O,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ki=class extends Lr{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},qi=new bn,Ji=new bn,Yi=[],Xi=new yr,Zi=new bn,Qi=new Hi,$i=new Wr,ea=class extends Hi{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ki(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Zi)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new yr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,qi),Xi.copy(e.boundingBox).applyMatrix4(qi),this.boundingBox.union(Xi)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Wr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,qi),$i.copy(e.boundingSphere).applyMatrix4(qi),this.boundingSphere.union($i)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Qi.geometry=this.geometry,Qi.material=this.material,Qi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),$i.copy(this.boundingSphere),$i.applyMatrix4(n),e.ray.intersectsSphere($i)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,qi),Ji.multiplyMatrices(n,qi),Qi.matrixWorld=Ji,Qi.raycast(e,Yi);for(let e=0,n=Yi.length;e<n;e++){let n=Yi[e];n.instanceId=i,n.object=this,t.push(n)}Yi.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ki(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Gi(new Float32Array(r*this.count),r,this.count,me,ae));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},ta=new Wr,na=new W(.5,.5),ra=new K,ia=class{constructor(e=new oi,t=new oi,n=new oi,r=new oi,i=new oi,a=new oi){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=ft,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ta.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ta.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ta)}intersectsSprite(e){return ta.center.set(0,0,0),ta.radius=.7071067811865476+na.distanceTo(e.center),ta.applyMatrix4(e.matrixWorld),this.intersectsSphere(ta)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(ra.x=r.normal.x>0?e.max.x:e.min.x,ra.y=r.normal.y>0?e.max.y:e.min.y,ra.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ra)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},aa=new bn,oa=class e{constructor(){this.coordinateSystem=ft,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];aa.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new ia),n[e].setFromProjectionMatrix(aa,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new ia),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},sa=class extends ci{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new tr(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},ca=new K,la=new K,ua=new bn,da=new ki,fa=new Wr,pa=new K,ma=new K,ha=class extends qn{constructor(e=new Qr,t=new sa){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)ca.fromBufferAttribute(t,e-1),la.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=ca.distanceTo(la);e.setAttribute(`lineDistance`,new Br(n,1))}else V(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),fa.copy(n.boundingSphere),fa.applyMatrix4(r),fa.radius+=i,e.ray.intersectsSphere(fa)===!1)return;ua.copy(r).invert(),da.copy(e.ray).applyMatrix4(ua);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=ga(this,e,da,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=ga(this,e,da,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=ga(this,e,da,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=ga(this,e,da,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ga(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(ca.fromBufferAttribute(s,i),la.fromBufferAttribute(s,a),n.distanceSqToSegment(ca,la,pa,ma)>r)return;pa.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(pa);if(!(c<t.near||c>t.far))return{distance:c,point:ma.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var _a=new K,va=new K,ya=class extends ha{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)_a.fromBufferAttribute(t,e),va.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+_a.distanceTo(va);e.setAttribute(`lineDistance`,new Br(n,1))}else V(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},ba=class extends ci{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new tr(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},xa=new bn,Sa=new ki,Ca=new Wr,wa=new K,Ta=class extends qn{constructor(e=new Qr,t=new ba){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ca.copy(n.boundingSphere),Ca.applyMatrix4(r),Ca.radius+=i,e.ray.intersectsSphere(Ca)===!1)return;xa.copy(r).invert(),Sa.copy(e.ray).applyMatrix4(xa);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);wa.fromBufferAttribute(l,n),Ea(wa,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)wa.fromBufferAttribute(l,a),Ea(wa,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Ea(e,t,n,r,i,a,o){let s=Sa.distanceSqToPoint(e);if(s<n){let n=new K;Sa.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var Da=class extends mn{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Oa=class extends mn{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},ka=class extends mn{constructor(e,t,n=ie,r,i,a,o=O,s=O,c,l=pe,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new un(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Aa=class extends ka{constructor(e,t=ie,n=301,r,i,a=O,o=O,s,c=pe){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ja=class extends mn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Ma=class e extends Qr{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Br(c,3)),this.setAttribute(`normal`,new Br(l,3)),this.setAttribute(`uv`,new Br(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new K;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Na=class e extends Qr{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new K,l=new W;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new Br(a,3)),this.setAttribute(`normal`,new Br(o,3)),this.setAttribute(`uv`,new Br(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Pa=class e extends Qr{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Br(u,3)),this.setAttribute(`normal`,new Br(d,3)),this.setAttribute(`uv`,new Br(f,2));function _(){let a=new K,_=new K,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new W,m=new K,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Fa=class e extends Pa{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ia=class e extends Qr{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Br(i,3)),this.setAttribute(`normal`,new Br(i.slice(),3)),this.setAttribute(`uv`,new Br(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new K,r=new K,i=new K;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new K;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new K;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new K,t=new K,n=new K,r=new K,o=new W,s=new W,c=new W;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},La=new K,Ra=new K,za=new K,Ba=new vr,Va=class extends Qr{constructor(e=null,t=1){if(super(),this.type=`EdgesGeometry`,this.parameters={geometry:e,thresholdAngle:t},e!==null){let n=1e4,r=Math.cos(Et*t),i=e.getIndex(),a=e.getAttribute(`position`),o=i?i.count:a.count,s=[0,0,0],c=[`a`,`b`,`c`],l=[,,,],u=new Map,d=[];for(let e=0;e<o;e+=3){i?(s[0]=i.getX(e),s[1]=i.getX(e+1),s[2]=i.getX(e+2)):(s[0]=e,s[1]=e+1,s[2]=e+2);let{a:t,b:o,c:f}=Ba;if(t.fromBufferAttribute(a,s[0]),o.fromBufferAttribute(a,s[1]),f.fromBufferAttribute(a,s[2]),Ba.getNormal(za),l[0]=`${Math.round(t.x*n)},${Math.round(t.y*n)},${Math.round(t.z*n)}`,l[1]=`${Math.round(o.x*n)},${Math.round(o.y*n)},${Math.round(o.z*n)}`,l[2]=`${Math.round(f.x*n)},${Math.round(f.y*n)},${Math.round(f.z*n)}`,l[0]!==l[1]&&l[1]!==l[2]&&l[2]!==l[0])for(let e=0;e<3;e++){let t=(e+1)%3,n=l[e],i=l[t],a=Ba[c[e]],o=Ba[c[t]],f=`${n}_${i}`,p=`${i}_${n}`,m=u.get(p);m?(za.dot(m.normal)<=r&&(d.push(a.x,a.y,a.z),d.push(o.x,o.y,o.z)),u.set(p,null)):u.has(f)||u.set(f,{index0:s[e],index1:s[t],normal:za.clone()})}}for(let e of u.values())if(e){let{index0:t,index1:n}=e;La.fromBufferAttribute(a,t),Ra.fromBufferAttribute(a,n),d.push(La.x,La.y,La.z),d.push(Ra.x,Ra.y,Ra.z)}this.setAttribute(`position`,new Br(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Ha=class{constructor(){this.type=`Curve`,this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){V(`Curve: .getPoint() not implemented.`)}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,r=this.getPoint(0),i=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),i+=n.distanceTo(r),t.push(i),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),r=0,i=n.length,a;a=t||e*n[i-1];let o=0,s=i-1,c;for(;o<=s;)if(r=Math.floor(o+(s-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)s=r-1;else{s=r;break}if(r=s,n[r]===a)return r/(i-1);let l=n[r],u=n[r+1]-l,d=(a-l)/u;return(r+d)/(i-1)}getTangent(e,t){let n=1e-4,r=e-n,i=e+n;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),o=this.getPoint(i),s=t||(a.isVector2?new W:new K);return s.copy(o).sub(a).normalize(),s}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new K,r=[],i=[],a=[],o=new K,s=new bn;for(let t=0;t<=e;t++){let n=t/e;r[t]=this.getTangentAt(n,new K)}i[0]=new K,a[0]=new K;let c=Number.MAX_VALUE,l=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);l<=c&&(c=l,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),i[0].crossVectors(r[0],o),a[0].crossVectors(r[0],i[0]);for(let t=1;t<=e;t++){if(i[t]=i[t-1].clone(),a[t]=a[t-1].clone(),o.crossVectors(r[t-1],r[t]),o.length()>2**-52){o.normalize();let e=Math.acos(kt(r[t-1].dot(r[t]),-1,1));i[t].applyMatrix4(s.makeRotationAxis(o,e))}a[t].crossVectors(r[t],i[t])}if(t===!0){let t=Math.acos(kt(i[0].dot(i[e]),-1,1));t/=e,r[0].dot(o.crossVectors(i[0],i[e]))>0&&(t=-t);for(let n=1;n<=e;n++)i[n].applyMatrix4(s.makeRotationAxis(r[n],t*n)),a[n].crossVectors(r[n],i[n])}return{tangents:r,normals:i,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let e={metadata:{version:4.7,type:`Curve`,generator:`Curve.toJSON`}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}},Ua=class extends Ha{constructor(e=0,t=0,n=1,r=1,i=0,a=Math.PI*2,o=!1,s=0){super(),this.isEllipseCurve=!0,this.type=`EllipseCurve`,this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=i,this.aEndAngle=a,this.aClockwise=o,this.aRotation=s}getPoint(e,t=new W){let n=t,r=Math.PI*2,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<2**-52;for(;i<0;)i+=r;for(;i>r;)i-=r;i<2**-52&&(i=a?0:r),this.aClockwise===!0&&!a&&(i===r?i=-r:i-=r);let o=this.aStartAngle+e*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let e=Math.cos(this.aRotation),t=Math.sin(this.aRotation),n=s-this.aX,r=c-this.aY;s=n*e-r*t+this.aX,c=n*t+r*e+this.aY}return n.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Wa=class extends Ua{constructor(e,t,n,r,i,a){super(e,t,n,n,r,i,a),this.isArcCurve=!0,this.type=`ArcCurve`}};function Ga(){let e=0,t=0,n=0,r=0;function i(i,a,o,s){e=i,t=o,n=-3*i+3*a-2*o-s,r=2*i-2*a+o+s}return{initCatmullRom:function(e,t,n,r,a){i(t,n,a*(n-e),a*(r-t))},initNonuniformCatmullRom:function(e,t,n,r,a,o,s){let c=(t-e)/a-(n-e)/(a+o)+(n-t)/o,l=(n-t)/o-(r-t)/(o+s)+(r-n)/s;c*=o,l*=o,i(t,n,c,l)},calc:function(i){let a=i*i,o=a*i;return e+t*i+n*a+r*o}}}var Ka=new K,qa=new K,Ja=new Ga,Ya=new Ga,Xa=new Ga,Za=class extends Ha{constructor(e=[],t=!1,n=`centripetal`,r=.5){super(),this.isCatmullRomCurve3=!0,this.type=`CatmullRomCurve3`,this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new K){let n=t,r=this.points,i=r.length,a=(i-+!this.closed)*e,o=Math.floor(a),s=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/i)+1)*i:s===0&&o===i-1&&(o=i-2,s=1);let c,l;this.closed||o>0?c=r[(o-1)%i]:(qa.subVectors(r[0],r[1]).add(r[0]),c=qa);let u=r[o%i],d=r[(o+1)%i];if(this.closed||o+2<i?l=r[(o+2)%i]:(Ka.subVectors(r[i-1],r[i-2]).add(r[i-1]),l=Ka),this.curveType===`centripetal`||this.curveType===`chordal`){let e=this.curveType===`chordal`?.5:.25,t=c.distanceToSquared(u)**+e,n=u.distanceToSquared(d)**+e,r=d.distanceToSquared(l)**+e;n<1e-4&&(n=1),t<1e-4&&(t=n),r<1e-4&&(r=n),Ja.initNonuniformCatmullRom(c.x,u.x,d.x,l.x,t,n,r),Ya.initNonuniformCatmullRom(c.y,u.y,d.y,l.y,t,n,r),Xa.initNonuniformCatmullRom(c.z,u.z,d.z,l.z,t,n,r)}else this.curveType===`catmullrom`&&(Ja.initCatmullRom(c.x,u.x,d.x,l.x,this.tension),Ya.initCatmullRom(c.y,u.y,d.y,l.y,this.tension),Xa.initCatmullRom(c.z,u.z,d.z,l.z,this.tension));return n.set(Ja.calc(s),Ya.calc(s),Xa.calc(s)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new K().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Qa(e,t,n,r,i){let a=(r-t)*.5,o=(i-n)*.5,s=e*e,c=e*s;return(2*n-2*r+a+o)*c+(-3*n+3*r-2*a-o)*s+a*e+n}function $a(e,t){let n=1-e;return n*n*t}function eo(e,t){return 2*(1-e)*e*t}function to(e,t){return e*e*t}function no(e,t,n,r){return $a(e,t)+eo(e,n)+to(e,r)}function ro(e,t){let n=1-e;return n*n*n*t}function io(e,t){let n=1-e;return 3*n*n*e*t}function ao(e,t){return 3*(1-e)*e*e*t}function oo(e,t){return e*e*e*t}function so(e,t,n,r,i){return ro(e,t)+io(e,n)+ao(e,r)+oo(e,i)}var co=class extends Ha{constructor(e=new W,t=new W,n=new W,r=new W){super(),this.isCubicBezierCurve=!0,this.type=`CubicBezierCurve`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new W){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(so(e,r.x,i.x,a.x,o.x),so(e,r.y,i.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},lo=class extends Ha{constructor(e=new K,t=new K,n=new K,r=new K){super(),this.isCubicBezierCurve3=!0,this.type=`CubicBezierCurve3`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new K){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(so(e,r.x,i.x,a.x,o.x),so(e,r.y,i.y,a.y,o.y),so(e,r.z,i.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},uo=class extends Ha{constructor(e=new W,t=new W){super(),this.isLineCurve=!0,this.type=`LineCurve`,this.v1=e,this.v2=t}getPoint(e,t=new W){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new W){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fo=class extends Ha{constructor(e=new K,t=new K){super(),this.isLineCurve3=!0,this.type=`LineCurve3`,this.v1=e,this.v2=t}getPoint(e,t=new K){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new K){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},po=class extends Ha{constructor(e=new W,t=new W,n=new W){super(),this.isQuadraticBezierCurve=!0,this.type=`QuadraticBezierCurve`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new W){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(no(e,r.x,i.x,a.x),no(e,r.y,i.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},mo=class extends Ha{constructor(e=new K,t=new K,n=new K){super(),this.isQuadraticBezierCurve3=!0,this.type=`QuadraticBezierCurve3`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new K){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(no(e,r.x,i.x,a.x),no(e,r.y,i.y,a.y),no(e,r.z,i.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ho=class extends Ha{constructor(e=[]){super(),this.isSplineCurve=!0,this.type=`SplineCurve`,this.points=e}getPoint(e,t=new W){let n=t,r=this.points,i=(r.length-1)*e,a=Math.floor(i),o=i-a,s=r[a===0?a:a-1],c=r[a],l=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return n.set(Qa(o,s.x,c.x,l.x,u.x),Qa(o,s.y,c.y,l.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new W().fromArray(n))}return this}},go=Object.freeze({__proto__:null,ArcCurve:Wa,CatmullRomCurve3:Za,CubicBezierCurve:co,CubicBezierCurve3:lo,EllipseCurve:Ua,LineCurve:uo,LineCurve3:fo,QuadraticBezierCurve:po,QuadraticBezierCurve3:mo,SplineCurve:ho}),_o=class extends Ha{constructor(){super(),this.type=`CurvePath`,this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?`LineCurve`:`LineCurve3`;this.curves.push(new go[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),r=this.getCurveLengths(),i=0;for(;i<r.length;){if(r[i]>=n){let e=r[i]-n,a=this.curves[i],o=a.getLength(),s=o===0?0:1-e/o;return a.getPointAt(s,t)}i++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let r=0,i=this.curves;r<i.length;r++){let a=i[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,s=a.getPoints(o);for(let e=0;e<s.length;e++){let r=s[e];n&&n.equals(r)||(t.push(r),n=r)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(n.clone())}return this.autoClose=e.autoClose,this.cacheLengths=null,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let n=this.curves[t];e.curves.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(new go[n.type]().fromJSON(n))}return this.cacheLengths=null,this}},vo=class extends _o{constructor(e){super(),this.type=`Path`,this.currentPoint=new W,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new uo(this.currentPoint.clone(),new W(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){let i=new po(this.currentPoint.clone(),new W(e,t),new W(n,r));return this.curves.push(i),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,i,a){let o=new co(this.currentPoint.clone(),new W(e,t),new W(n,r),new W(i,a));return this.curves.push(o),this.currentPoint.set(i,a),this}splineThru(e){let t=new ho([this.currentPoint.clone()].concat(e));return this.curves.push(t),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,i,a){let o=this.currentPoint.x,s=this.currentPoint.y;return this.absarc(e+o,t+s,n,r,i,a),this}absarc(e,t,n,r,i,a){return this.absellipse(e,t,n,n,r,i,a),this}ellipse(e,t,n,r,i,a,o,s){let c=this.currentPoint.x,l=this.currentPoint.y;return this.absellipse(e+c,t+l,n,r,i,a,o,s),this}absellipse(e,t,n,r,i,a,o,s){let c=new Ua(e,t,n,r,i,a,o,s);if(this.curves.length>0){let e=c.getPoint(0);e.equals(this.currentPoint)||this.lineTo(e.x,e.y)}this.curves.push(c);let l=c.getPoint(1);return this.currentPoint.copy(l),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},yo=class extends vo{constructor(e){super(e),this.uuid=Ot(),this.type=`Shape`,this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let n=this.holes[t];e.holes.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(new vo().fromJSON(n))}return this}};function bo(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=xo(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l;if(r&&(a=Oo(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return Co(a,o,n,s,c,l,0),o}function xo(e,t,n,r,i){let a;if(i===Qo(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=Yo(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=Yo(i/r|0,e[i],e[i+1],a);return a&&Vo(a,a.next)&&(Xo(a),a=a.next),a}function So(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&(Vo(n,n.next)||Bo(n.prev,n,n.next)===0)){if(Xo(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function Co(e,t,n,r,i,a,o){if(!e)return;!o&&a&&No(e,r,i,a);let s=e;for(;e.prev!==e.next;){let c=e.prev,l=e.next;if(a?To(e,r,i,a):wo(e))t.push(c.i,e.i,l.i),Xo(e),e=l.next,s=l.next;else if(e=l,e===s){o?o===1?(e=Eo(So(e),t),Co(e,t,n,r,i,a,2)):o===2&&Do(e,t,n,r,i,a):Co(So(e),t,n,r,i,a,1);break}}}function wo(e){let t=e.prev,n=e,r=e.next;if(Bo(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&Ro(i,s,a,c,o,l,m.x,m.y)&&Bo(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function To(e,t,n,r){let i=e.prev,a=e,o=e.next;if(Bo(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=Fo(p,m,t,n,r),v=Fo(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Ro(s,u,c,d,l,f,y.x,y.y)&&Bo(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Ro(s,u,c,d,l,f,b.x,b.y)&&Bo(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&Ro(s,u,c,d,l,f,y.x,y.y)&&Bo(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&Ro(s,u,c,d,l,f,b.x,b.y)&&Bo(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function Eo(e,t){let n=e;do{let r=n.prev,i=n.next.next;!Vo(r,i)&&Ho(r,n,n.next,i)&&Ko(r,i)&&Ko(i,r)&&(t.push(r.i,n.i,i.i),Xo(n),Xo(n.next),n=e=i),n=n.next}while(n!==e);return So(n)}function Do(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&zo(o,e)){let s=Jo(o,e);o=So(o,o.next),s=So(s,s.next),Co(o,t,n,r,i,a,0),Co(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function Oo(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=xo(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&(o.steiner=!0),i.push(Io(o))}i.sort(ko);for(let e=0;e<i.length;e++)n=Ao(i[e],n);return n}function ko(e,t){let n=e.x-t.x;return n===0&&(n=e.y-t.y,n===0&&(n=(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x))),n}function Ao(e,t){let n=jo(e,t);if(!n)return t;let r=Jo(n,e);return So(r,r.next),So(n,n.next)}function jo(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(Vo(e,n))return n;do{if(Vo(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}n=n.next}while(n!==t);if(!o)return null;let s=o,c=o.x,l=o.y,u=1/0;n=o;do{if(r>=n.x&&n.x>=c&&r!==n.x&&Lo(i<l?r:a,i,c,l,i<l?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);Ko(n,e)&&(t<u||t===u&&(n.x>o.x||n.x===o.x&&Mo(o,n)))&&(o=n,u=t)}n=n.next}while(n!==s);return o}function Mo(e,t){return Bo(e.prev,e,t.prev)<0&&Bo(t.next,e,e.next)<0}function No(e,t,n,r){let i=e;do i.z===0&&(i.z=Fo(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,Po(i)}function Po(e){let t,n=1;do{let r=e,i;e=null;let a=null;for(t=0;r;){t++;let o=r,s=0;for(let e=0;e<n&&(s++,o=o.nextZ,o);e++);let c=n;for(;s>0||c>0&&o;)s!==0&&(c===0||!o||r.z<=o.z)?(i=r,r=r.nextZ,s--):(i=o,o=o.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;r=o}a.nextZ=null,n*=2}while(t>1);return e}function Fo(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function Io(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Lo(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function Ro(e,t,n,r,i,a,o,s){return(e!==o||t!==s)&&Lo(e,t,n,r,i,a,o,s)}function zo(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!Go(e,t)&&(Ko(e,t)&&Ko(t,e)&&qo(e,t)&&(Bo(e.prev,e,t.prev)||Bo(e,t.prev,t))||Vo(e,t)&&Bo(e.prev,e,e.next)>0&&Bo(t.prev,t,t.next)>0)}function Bo(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Vo(e,t){return e.x===t.x&&e.y===t.y}function Ho(e,t,n,r){let i=Wo(Bo(e,t,n)),a=Wo(Bo(e,t,r)),o=Wo(Bo(n,r,e)),s=Wo(Bo(n,r,t));return!!(i!==a&&o!==s||i===0&&Uo(e,n,t)||a===0&&Uo(e,r,t)||o===0&&Uo(n,e,r)||s===0&&Uo(n,t,r))}function Uo(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function Wo(e){return e>0?1:e<0?-1:0}function Go(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&Ho(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function Ko(e,t){return Bo(e.prev,e,e.next)<0?Bo(e,t,e.next)>=0&&Bo(e,e.prev,t)>=0:Bo(e,t,e.prev)<0||Bo(e,e.next,t)<0}function qo(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function Jo(e,t){let n=Zo(e.i,e.x,e.y),r=Zo(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function Yo(e,t,n,r){let i=Zo(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function Xo(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Zo(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Qo(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var $o=class{static triangulate(e,t,n=2){return bo(e,t,n)}},es=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];ts(e),ns(n,e);let a=e.length;t.forEach(ts);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,ns(n,t[e]);let o=$o.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function ts(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function ns(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var rs=class e extends Qr{constructor(e=new yo([new W(.5,.5),new W(-.5,.5),new W(-.5,-.5),new W(.5,-.5)]),t={}){super(),this.type=`ExtrudeGeometry`,this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,r=[],i=[];for(let t=0,n=e.length;t<n;t++){let n=e[t];a(n)}this.setAttribute(`position`,new Br(r,3)),this.setAttribute(`uv`,new Br(i,2)),this.computeVertexNormals();function a(e){let a=[],o=t.curveSegments===void 0?12:t.curveSegments,s=t.steps===void 0?1:t.steps,c=t.depth===void 0?1:t.depth,l=t.bevelEnabled===void 0||t.bevelEnabled,u=t.bevelThickness===void 0?.2:t.bevelThickness,d=t.bevelSize===void 0?u-.1:t.bevelSize,f=t.bevelOffset===void 0?0:t.bevelOffset,p=t.bevelSegments===void 0?3:t.bevelSegments,m=t.extrudePath,h=t.UVGenerator===void 0?is:t.UVGenerator,g,_=!1,v,y,b,x;if(m){g=m.getSpacedPoints(s),_=!0,l=!1;let e=m.isCatmullRomCurve3?m.closed:!1;v=m.computeFrenetFrames(s,e),y=new K,b=new K,x=new K}l||(p=0,u=0,d=0,f=0);let S=e.extractPoints(o),C=S.shape,w=S.holes;if(!es.isClockWise(C)){C=C.reverse();for(let e=0,t=w.length;e<t;e++){let t=w[e];es.isClockWise(t)&&(w[e]=t.reverse())}}function T(e){let t=e[0];for(let n=1;n<=e.length;n++){let r=n%e.length,i=e[r],a=i.x-t.x,o=i.y-t.y,s=a*a+o*o,c=Math.max(Math.abs(i.x),Math.abs(i.y),Math.abs(t.x),Math.abs(t.y));s<=10000000000000001e-36*c*c?(e.splice(r,1),n--):t=i}}T(C),w.forEach(T);let E=w.length,D=C;for(let e=0;e<E;e++){let t=w[e];C=C.concat(t)}function O(e,t,n){return t||H(`ExtrudeGeometry: vec does not exist`),e.clone().addScaledVector(t,n)}let k=C.length;function A(e,t,n){let r,i,a,o=e.x-t.x,s=e.y-t.y,c=n.x-e.x,l=n.y-e.y,u=o*o+s*s,d=o*l-s*c;if(Math.abs(d)>2**-52){let d=Math.sqrt(u),f=Math.sqrt(c*c+l*l),p=t.x-s/d,m=t.y+o/d,h=n.x-l/f,g=n.y+c/f,_=((h-p)*l-(g-m)*c)/(o*l-s*c);r=p+o*_-e.x,i=m+s*_-e.y;let v=r*r+i*i;if(v<=2)return new W(r,i);a=Math.sqrt(v/2)}else{let e=!1;o>2**-52?c>2**-52&&(e=!0):o<-(2**-52)?c<-(2**-52)&&(e=!0):Math.sign(s)===Math.sign(l)&&(e=!0),e?(r=-s,i=o,a=Math.sqrt(u)):(r=o,i=s,a=Math.sqrt(u/2))}return new W(r/a,i/a)}let j=[];for(let e=0,t=D.length,n=t-1,r=e+1;e<t;e++,n++,r++)n===t&&(n=0),r===t&&(r=0),j[e]=A(D[e],D[n],D[r]);let ee=[],M,te=j.concat();for(let e=0,t=E;e<t;e++){let t=w[e];M=[];for(let e=0,n=t.length,r=n-1,i=e+1;e<n;e++,r++,i++)r===n&&(r=0),i===n&&(i=0),M[e]=A(t[e],t[r],t[i]);ee.push(M),te=te.concat(M)}let N;if(p===0)N=es.triangulateShape(D,w);else{let e=[],t=[];for(let n=0;n<p;n++){let r=n/p,i=u*Math.cos(r*Math.PI/2),a=d*Math.sin(r*Math.PI/2)+f;for(let t=0,n=D.length;t<n;t++){let n=O(D[t],j[t],a);F(n.x,n.y,-i),r===0&&e.push(n)}for(let e=0,n=E;e<n;e++){let n=w[e];M=ee[e];let o=[];for(let e=0,t=n.length;e<t;e++){let t=O(n[e],M[e],a);F(t.x,t.y,-i),r===0&&o.push(t)}r===0&&t.push(o)}}N=es.triangulateShape(e,t)}let P=N.length,ne=d+f;for(let e=0;e<k;e++){let t=l?O(C[e],te[e],ne):C[e];_?(b.copy(v.normals[0]).multiplyScalar(t.x),y.copy(v.binormals[0]).multiplyScalar(t.y),x.copy(g[0]).add(b).add(y),F(x.x,x.y,x.z)):F(t.x,t.y,0)}for(let e=1;e<=s;e++)for(let t=0;t<k;t++){let n=l?O(C[t],te[t],ne):C[t];_?(b.copy(v.normals[e]).multiplyScalar(n.x),y.copy(v.binormals[e]).multiplyScalar(n.y),x.copy(g[e]).add(b).add(y),F(x.x,x.y,x.z)):F(n.x,n.y,c/s*e)}for(let e=p-1;e>=0;e--){let t=e/p,n=u*Math.cos(t*Math.PI/2),r=d*Math.sin(t*Math.PI/2)+f;for(let e=0,t=D.length;e<t;e++){let t=O(D[e],j[e],r);F(t.x,t.y,c+n)}for(let e=0,t=w.length;e<t;e++){let t=w[e];M=ee[e];for(let e=0,i=t.length;e<i;e++){let i=O(t[e],M[e],r);_?F(i.x,i.y+g[s-1].y,g[s-1].x+n):F(i.x,i.y,c+n)}}}re(),ie();function re(){let e=r.length/3;if(l){let e=0,t=k*e;for(let e=0;e<P;e++){let n=N[e];oe(n[2]+t,n[1]+t,n[0]+t)}e=s+p*2,t=k*e;for(let e=0;e<P;e++){let n=N[e];oe(n[0]+t,n[1]+t,n[2]+t)}}else{for(let e=0;e<P;e++){let t=N[e];oe(t[2],t[1],t[0])}for(let e=0;e<P;e++){let t=N[e];oe(t[0]+k*s,t[1]+k*s,t[2]+k*s)}}n.addGroup(e,r.length/3-e,0)}function ie(){let e=r.length/3,t=0;ae(D,t),t+=D.length;for(let e=0,n=w.length;e<n;e++){let n=w[e];ae(n,t),t+=n.length}n.addGroup(e,r.length/3-e,1)}function ae(e,t){let n=e.length;for(;--n>=0;){let r=n,i=n-1;i<0&&(i=e.length-1);for(let e=0,n=s+p*2;e<n;e++){let n=k*e,a=k*(e+1);se(t+r+n,t+i+n,t+i+a,t+r+a)}}}function F(e,t,n){a.push(e),a.push(t),a.push(n)}function oe(e,t,i){ce(e),ce(t),ce(i);let a=r.length/3,o=h.generateTopUV(n,r,a-3,a-2,a-1);I(o[0]),I(o[1]),I(o[2])}function se(e,t,i,a){ce(e),ce(t),ce(a),ce(t),ce(i),ce(a);let o=r.length/3,s=h.generateSideWallUV(n,r,o-6,o-3,o-2,o-1);I(s[0]),I(s[1]),I(s[3]),I(s[1]),I(s[2]),I(s[3])}function ce(e){r.push(a[e*3+0]),r.push(a[e*3+1]),r.push(a[e*3+2])}function I(e){i.push(e.x),i.push(e.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return as(t,n,e)}static fromJSON(t,n){let r=[];for(let e=0,i=t.shapes.length;e<i;e++){let i=n[t.shapes[e]];r.push(i)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new go[i.type]().fromJSON(i)),new e(r,t.options)}},is={generateTopUV:function(e,t,n,r,i){let a=t[n*3],o=t[n*3+1],s=t[r*3],c=t[r*3+1],l=t[i*3],u=t[i*3+1];return[new W(a,o),new W(s,c),new W(l,u)]},generateSideWallUV:function(e,t,n,r,i,a){let o=t[n*3],s=t[n*3+1],c=t[n*3+2],l=t[r*3],u=t[r*3+1],d=t[r*3+2],f=t[i*3],p=t[i*3+1],m=t[i*3+2],h=t[a*3],g=t[a*3+1],_=t[a*3+2];return Math.abs(s-u)<Math.abs(o-l)?[new W(o,1-c),new W(l,1-d),new W(f,1-m),new W(h,1-_)]:[new W(s,1-c),new W(u,1-d),new W(p,1-m),new W(g,1-_)]}};function as(e,t,n){if(n.shapes=[],Array.isArray(e))for(let t=0,r=e.length;t<r;t++){let r=e[t];n.shapes.push(r.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}var os=class e extends Ia{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},ss=class e extends Ia{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type=`OctahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},cs=class e extends Qr{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Br(p,3)),this.setAttribute(`normal`,new Br(m,3)),this.setAttribute(`uv`,new Br(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},ls=class e extends Qr{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new K,p=new W;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new Br(s,3)),this.setAttribute(`normal`,new Br(c,3)),this.setAttribute(`uv`,new Br(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},us=class e extends Qr{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new K,d=new K,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new Br(p,3)),this.setAttribute(`normal`,new Br(m,3)),this.setAttribute(`uv`,new Br(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},ds=class e extends Qr{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new K,f=new K,p=new K;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new Br(c,3)),this.setAttribute(`normal`,new Br(l,3)),this.setAttribute(`uv`,new Br(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function fs(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(ms(i))i.isRenderTargetTexture?(V(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(ms(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function ps(e){let t={};for(let n=0;n<e.length;n++){let r=fs(e[n]);for(let e in r)t[e]=r[e]}return t}function ms(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function hs(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function gs(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:rn.workingColorSpace}var _s={clone:fs,merge:ps},vs=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ys=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,bs=class extends ci{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=vs,this.fragmentShader=ys,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=fs(e.uniforms),this.uniformsGroups=hs(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new tr().setHex(r.value);break;case`v2`:this.uniforms[n].value=new W().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new hn().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new q().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new bn().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},xs=class extends bs{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Ss=class extends ci{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new tr(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new tr(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new An,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Cs=class extends ci{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=at,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ws=class extends ci{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Ts(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Es(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Ds=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Os=class extends Ds{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:nt,endingEnd:nt}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case rt:i=e,o=2*t-n;break;case it:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case rt:a=e,s=2*n-t;break;case it:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},ks=class extends Ds{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},As=class extends Ds{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},js=class extends Ds{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Ps(n,t,g,y,r);i[p]=Ms(x,o,_,b,m)}return i}};function Ms(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Ns(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Ps(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=Ms(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Ns(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Fs=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Ts(t,this.TimeBufferType),this.values=Ts(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Ts(e.times,Array),values:Ts(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),Es(e.settings)&&(n.settings={inTangents:Ts(e.settings.inTangents,Array),outTangents:Ts(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new As(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ks(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Os(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new js(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Qe:t=this.InterpolantFactoryMethodDiscrete;break;case $e:t=this.InterpolantFactoryMethodLinear;break;case et:t=this.InterpolantFactoryMethodSmooth;break;case tt:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return V(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Qe;case this.InterpolantFactoryMethodLinear:return $e;case this.InterpolantFactoryMethodSmooth:return et;case this.InterpolantFactoryMethodBezier:return tt}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;Es(this.settings)&&(Is(this.settings.inTangents,e),Is(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;Es(this.settings)&&(Ls(this.settings.inTangents,e),Ls(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(H(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(H(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){H(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){H(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&mt(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){H(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===et,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,Es(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Is(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function Ls(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Fs.prototype.ValueTypeName=``,Fs.prototype.TimeBufferType=Float32Array,Fs.prototype.ValueBufferType=Float32Array,Fs.prototype.DefaultInterpolation=$e;var Rs=class extends Fs{constructor(e,t,n){super(e,t,n)}};Rs.prototype.ValueTypeName=`bool`,Rs.prototype.ValueBufferType=Array,Rs.prototype.DefaultInterpolation=Qe,Rs.prototype.InterpolantFactoryMethodLinear=void 0,Rs.prototype.InterpolantFactoryMethodSmooth=void 0;var zs=class extends Fs{constructor(e,t,n,r){super(e,t,n,r)}};zs.prototype.ValueTypeName=`color`;var Bs=class extends Fs{constructor(e,t,n,r){super(e,t,n,r)}};Bs.prototype.ValueTypeName=`number`;var Vs=class extends Ds{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)G.slerpFlat(i,0,a,c-o,a,c,s);return i}},Hs=class extends Fs{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Vs(this.times,this.values,this.getValueSize(),e)}};Hs.prototype.ValueTypeName=`quaternion`,Hs.prototype.InterpolantFactoryMethodSmooth=void 0;var Us=class extends Fs{constructor(e,t,n){super(e,t,n)}};Us.prototype.ValueTypeName=`string`,Us.prototype.ValueBufferType=Array,Us.prototype.DefaultInterpolation=Qe,Us.prototype.InterpolantFactoryMethodLinear=void 0,Us.prototype.InterpolantFactoryMethodSmooth=void 0;var Ws=class extends Fs{constructor(e,t,n,r){super(e,t,n,r)}};Ws.prototype.ValueTypeName=`vector`;var Gs=class extends qn{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new tr(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ks=class extends Gs{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(qn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new tr(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},qs=new bn,Js=new K,Ys=new K,Xs=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new W(512,512),this.mapType=te,this.map=null,this.mapPass=null,this.matrix=new bn,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ia,this._frameExtents=new W(1,1),this._viewportCount=1,this._viewports=[new hn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Js.setFromMatrixPosition(e.matrixWorld),t.position.copy(Js),Ys.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ys),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){qs.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(qs,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(qs)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Zs=new K,Qs=new G,$s=new K,ec=class extends qn{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new bn,this.projectionMatrix=new bn,this.projectionMatrixInverse=new bn,this.coordinateSystem=ft,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Zs,Qs,$s),$s.x===1&&$s.y===1&&$s.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Zs,Qs,$s.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Zs,Qs,$s),$s.x===1&&$s.y===1&&$s.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Zs,Qs,$s.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},tc=new K,nc=new W,rc=new W,ic=class extends ec{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Dt*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Et*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Dt*2*Math.atan(Math.tan(Et*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){tc.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(tc.x,tc.y).multiplyScalar(-e/tc.z),tc.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(tc.x,tc.y).multiplyScalar(-e/tc.z)}getViewSize(e,t){return this.getViewBounds(e,nc,rc),t.subVectors(rc,nc)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Et*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ac=class extends ec{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},oc=class extends Xs{constructor(){super(new ac(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},sc=class extends Gs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(qn.DEFAULT_UP),this.updateMatrix(),this.target=new qn,this.shadow=new oc}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},cc=-90,lc=1,uc=class extends qn{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new ic(cc,lc,e,t);r.layers=this.layers,this.add(r);let i=new ic(cc,lc,e,t);i.layers=this.layers,this.add(i);let a=new ic(cc,lc,e,t);a.layers=this.layers,this.add(a);let o=new ic(cc,lc,e,t);o.layers=this.layers,this.add(o);let s=new ic(cc,lc,e,t);s.layers=this.layers,this.add(s);let c=new ic(cc,lc,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},dc=class extends ic{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},fc=`\\[\\]\\.:\\/`,pc=RegExp(`[\\[\\]\\.:\\/]`,`g`),mc=`[^\\[\\]\\.:\\/]`,hc=`[^`+fc.replace(`\\.`,``)+`]`,gc=`((?:WC+[\\/:])*)`.replace(`WC`,mc),_c=`(WCOD+)?`.replace(`WCOD`,hc),vc=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,mc),yc=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,mc),bc=RegExp(`^`+gc+_c+vc+yc+`$`),xc=[`material`,`materials`,`bones`,`map`],Sc=class{constructor(e,t,n){let r=n||Cc.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Cc=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(pc,``)}static parseTrackName(e){let t=bc.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);xc.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){V(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){H(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){H(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){H(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){H(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){H(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){H(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){H(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;H(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){H(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){H(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Cc.Composite=Sc,Cc.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Cc.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Cc.prototype.GetterByBindingType=[Cc.prototype._getValue_direct,Cc.prototype._getValue_array,Cc.prototype._getValue_arrayElement,Cc.prototype._getValue_toArray],Cc.prototype.SetterByBindingTypeAndVersioning=[[Cc.prototype._setValue_direct,Cc.prototype._setValue_direct_setNeedsUpdate,Cc.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Cc.prototype._setValue_array,Cc.prototype._setValue_array_setNeedsUpdate,Cc.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Cc.prototype._setValue_arrayElement,Cc.prototype._setValue_arrayElement_setNeedsUpdate,Cc.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Cc.prototype._setValue_fromArray,Cc.prototype._setValue_fromArray_setNeedsUpdate,Cc.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};function wc(e,t,n,r){let i=Tc(r);switch(n){case ue:return e*t;case me:return e*t/i.components*i.byteLength;case he:return e*t/i.components*i.byteLength;case ge:return e*t*2/i.components*i.byteLength;case _e:return e*t*2/i.components*i.byteLength;case de:return e*t*3/i.components*i.byteLength;case fe:return e*t*4/i.components*i.byteLength;case ve:return e*t*4/i.components*i.byteLength;case ye:case be:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case xe:case Se:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case we:case Ee:return Math.max(e,16)*Math.max(t,8)/4;case Ce:case Te:return Math.max(e,8)*Math.max(t,8)/2;case De:case Oe:case Ae:case je:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ke:case R:case Me:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ne:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Pe:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case z:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Fe:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case B:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Ie:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Le:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Re:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case ze:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Be:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Ve:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case He:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Ue:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case We:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ge:case Ke:case qe:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Je:case Ye:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Xe:case Ze:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Tc(e){switch(e){case te:case N:return{byteLength:1,components:1};case ne:case P:case F:return{byteLength:2,components:1};case oe:case se:return{byteLength:2,components:4};case ie:case re:case ae:return{byteLength:4,components:1};case I:case le:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?V(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function Ec(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function Dc(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Oc={alphahash_fragment:`#ifdef USE_ALPHAHASH
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
}`},J={common:{diffuse:{value:new tr(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new q}},envmap:{envMap:{value:null},envMapRotation:{value:new q},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new q}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new q}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new q},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new q},normalScale:{value:new W(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new q},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new q}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new q}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new q}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new tr(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new tr(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0},uvTransform:{value:new q}},sprite:{diffuse:{value:new tr(16777215)},opacity:{value:1},center:{value:new W(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}}},kc={basic:{uniforms:ps([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.fog]),vertexShader:Oc.meshbasic_vert,fragmentShader:Oc.meshbasic_frag},lambert:{uniforms:ps([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.fog,J.lights,{emissive:{value:new tr(0)},envMapIntensity:{value:1}}]),vertexShader:Oc.meshlambert_vert,fragmentShader:Oc.meshlambert_frag},phong:{uniforms:ps([J.common,J.specularmap,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.fog,J.lights,{emissive:{value:new tr(0)},specular:{value:new tr(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Oc.meshphong_vert,fragmentShader:Oc.meshphong_frag},standard:{uniforms:ps([J.common,J.envmap,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.roughnessmap,J.metalnessmap,J.fog,J.lights,{emissive:{value:new tr(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Oc.meshphysical_vert,fragmentShader:Oc.meshphysical_frag},toon:{uniforms:ps([J.common,J.aomap,J.lightmap,J.emissivemap,J.bumpmap,J.normalmap,J.displacementmap,J.gradientmap,J.fog,J.lights,{emissive:{value:new tr(0)}}]),vertexShader:Oc.meshtoon_vert,fragmentShader:Oc.meshtoon_frag},matcap:{uniforms:ps([J.common,J.bumpmap,J.normalmap,J.displacementmap,J.fog,{matcap:{value:null}}]),vertexShader:Oc.meshmatcap_vert,fragmentShader:Oc.meshmatcap_frag},points:{uniforms:ps([J.points,J.fog]),vertexShader:Oc.points_vert,fragmentShader:Oc.points_frag},dashed:{uniforms:ps([J.common,J.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Oc.linedashed_vert,fragmentShader:Oc.linedashed_frag},depth:{uniforms:ps([J.common,J.displacementmap]),vertexShader:Oc.depth_vert,fragmentShader:Oc.depth_frag},normal:{uniforms:ps([J.common,J.bumpmap,J.normalmap,J.displacementmap,{opacity:{value:1}}]),vertexShader:Oc.meshnormal_vert,fragmentShader:Oc.meshnormal_frag},sprite:{uniforms:ps([J.sprite,J.fog]),vertexShader:Oc.sprite_vert,fragmentShader:Oc.sprite_frag},background:{uniforms:{uvTransform:{value:new q},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Oc.background_vert,fragmentShader:Oc.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new q}},vertexShader:Oc.backgroundCube_vert,fragmentShader:Oc.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Oc.cube_vert,fragmentShader:Oc.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Oc.equirect_vert,fragmentShader:Oc.equirect_frag},distance:{uniforms:ps([J.common,J.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Oc.distance_vert,fragmentShader:Oc.distance_frag},shadow:{uniforms:ps([J.lights,J.fog,{color:{value:new tr(0)},opacity:{value:1}}]),vertexShader:Oc.shadow_vert,fragmentShader:Oc.shadow_frag}};kc.physical={uniforms:ps([kc.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new q},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new q},clearcoatNormalScale:{value:new W(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new q},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new q},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new q},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new q},sheen:{value:0},sheenColor:{value:new tr(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new q},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new q},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new q},transmissionSamplerSize:{value:new W},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new q},attenuationDistance:{value:0},attenuationColor:{value:new tr(0)},specularColor:{value:new tr(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new q},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new q},anisotropyVector:{value:new W},anisotropyMap:{value:null},anisotropyMapTransform:{value:new q}}]),vertexShader:Oc.meshphysical_vert,fragmentShader:Oc.meshphysical_frag};var Ac={r:0,b:0,g:0},jc=new bn,Mc=new q;Mc.set(-1,0,0,0,1,0,0,0,1);function Nc(e,t,n,r,i,a){let o=new tr(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new Hi(new Ma(1,1,1),new bs({name:`BackgroundCubeMaterial`,uniforms:fs(kc.backgroundCube.uniforms),vertexShader:kc.backgroundCube.vertexShader,fragmentShader:kc.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(jc.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Mc),l.material.toneMapped=rn.getTransfer(i.colorSpace)!==lt,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Hi(new cs(2,2),new bs({name:`BackgroundMaterial`,uniforms:fs(kc.background.uniforms),vertexShader:kc.background.vertexShader,fragmentShader:kc.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=rn.getTransfer(i.colorSpace)!==lt,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Ac,gs(e)),n.buffers.color.setClear(Ac.r,Ac.g,Ac.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Pc(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Fc(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Ic(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(V(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&V(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&V(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Lc(e){let t=this,n=null,r=0,i=!1,a=!1,o=new oi,s=new q,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Rc=class extends _n{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Da(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Ma(5,5,5),i=new bs({name:`CubemapFromEquirect`,uniforms:fs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Hi(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=j),new uc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},zc=256,Bc=3,Vc=20,Hc=256,Uc=16,Wc=3,Gc=new K,Kc=new tr,qc=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new uc(1,10,null),this._boxMesh=new Hi(new Ma(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Gc}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(Kc));let h=new uc(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=el(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=$c(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(zc,Kt(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?zc:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Jc(e,!1,!1),n=Math.log2(e)-Bc;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Jc(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=el()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=$c()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Xc(),this._integrationMaterial=Zc());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/Uc);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-Wc)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(Hc*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Qc());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Jc(e,t,n){return new Rc(e,{minFilter:M,generateMipmaps:t,type:F,colorSpace:st,depthBuffer:n})}function Yc(e,t,n){return new bs({name:e,uniforms:t,vertexShader:Oc.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function Xc(){return Yc(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Hc}u

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
	`)}function Zc(){return Yc(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Uc}},`

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
	`)}function Qc(){return Yc(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Vc}
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
	`)}function $c(){return Yc(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

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
	`)}function el(){return Yc(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function tl(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Rc(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new qc(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new qc(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function nl(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&bt(`WebGLRenderer: `+e+` extension not supported.`),t}}}function rl(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?zr:Rr)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function il(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function al(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:H(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function ol(e,t,n){let r=new WeakMap,i=new hn;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new vn(h,p,m,u);g.type=ae,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new W(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function sl(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var cl={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function ll(e,t,n,r,i,a){let o=new _n(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new Qr;u.setAttribute(`position`,new Br([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new Br([0,2,0,0,2,0],2));let d=new xs({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new Hi(u,d),p=new ac(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new _n(t,n,{type:F,depthBuffer:!1,stencilBuffer:!1}),c=new _n(t,n,{type:F,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new ka(t,n),a===!0&&(l.format=L,l.type=ce)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},rn.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=cl[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var ul=new mn,dl=new ka(1,1),fl=new Aa(1),pl=new vn,ml=new yn,hl=new Da,gl=[],_l=[],vl=new Float32Array(16),yl=new Float32Array(9),bl=new Float32Array(4);function xl(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=gl[i];if(a===void 0&&(a=new Float32Array(i),gl[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Sl(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Cl(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function wl(e,t){let n=_l[t];n===void 0&&(n=new Int32Array(t),_l[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Tl(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function El(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Sl(n,t))return;e.uniform2fv(this.addr,t),Cl(n,t)}}function Dl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Sl(n,t))return;e.uniform3fv(this.addr,t),Cl(n,t)}}function Ol(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Sl(n,t))return;e.uniform4fv(this.addr,t),Cl(n,t)}}function kl(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Sl(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Cl(n,t)}else{if(Sl(n,r))return;bl.set(r),e.uniformMatrix2fv(this.addr,!1,bl),Cl(n,r)}}function Al(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Sl(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Cl(n,t)}else{if(Sl(n,r))return;yl.set(r),e.uniformMatrix3fv(this.addr,!1,yl),Cl(n,r)}}function jl(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Sl(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Cl(n,t)}else{if(Sl(n,r))return;vl.set(r),e.uniformMatrix4fv(this.addr,!1,vl),Cl(n,r)}}function Ml(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Nl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Sl(n,t))return;e.uniform2iv(this.addr,t),Cl(n,t)}}function Pl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Sl(n,t))return;e.uniform3iv(this.addr,t),Cl(n,t)}}function Fl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Sl(n,t))return;e.uniform4iv(this.addr,t),Cl(n,t)}}function Il(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Ll(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Sl(n,t))return;e.uniform2uiv(this.addr,t),Cl(n,t)}}function Rl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Sl(n,t))return;e.uniform3uiv(this.addr,t),Cl(n,t)}}function zl(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Sl(n,t))return;e.uniform4uiv(this.addr,t),Cl(n,t)}}function Bl(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function Vl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?Bl(dl):ul,n.setTexture2D(t||a,i)}function Hl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||ml,i)}function Ul(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?Bl(fl):hl,n.setTextureCube(t||a,i)}function Wl(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||pl,i)}function Gl(e){switch(e){case 5126:return Tl;case 35664:return El;case 35665:return Dl;case 35666:return Ol;case 35674:return kl;case 35675:return Al;case 35676:return jl;case 5124:case 35670:return Ml;case 35667:case 35671:return Nl;case 35668:case 35672:return Pl;case 35669:case 35673:return Fl;case 5125:return Il;case 36294:return Ll;case 36295:return Rl;case 36296:return zl;case 35678:case 36198:case 36298:case 36306:case 35682:return Vl;case 35679:case 36299:case 36307:return Hl;case 35680:case 36300:case 36308:case 36293:return Ul;case 36289:case 36303:case 36311:case 36292:return Wl}}function Kl(e,t){e.uniform1fv(this.addr,t)}function ql(e,t){let n=xl(t,this.size,2);e.uniform2fv(this.addr,n)}function Jl(e,t){let n=xl(t,this.size,3);e.uniform3fv(this.addr,n)}function Yl(e,t){let n=xl(t,this.size,4);e.uniform4fv(this.addr,n)}function Xl(e,t){let n=xl(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Zl(e,t){let n=xl(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Ql(e,t){let n=xl(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function $l(e,t){e.uniform1iv(this.addr,t)}function eu(e,t){e.uniform2iv(this.addr,t)}function tu(e,t){e.uniform3iv(this.addr,t)}function nu(e,t){e.uniform4iv(this.addr,t)}function ru(e,t){e.uniform1uiv(this.addr,t)}function iu(e,t){e.uniform2uiv(this.addr,t)}function au(e,t){e.uniform3uiv(this.addr,t)}function ou(e,t){e.uniform4uiv(this.addr,t)}function su(e,t,n){let r=this.cache,i=t.length,a=wl(n,i);Sl(r,a)||(e.uniform1iv(this.addr,a),Cl(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Bl(dl):ul;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function cu(e,t,n){let r=this.cache,i=t.length,a=wl(n,i);Sl(r,a)||(e.uniform1iv(this.addr,a),Cl(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||ml,a[e])}function lu(e,t,n){let r=this.cache,i=t.length,a=wl(n,i);Sl(r,a)||(e.uniform1iv(this.addr,a),Cl(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?Bl(fl):hl;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function uu(e,t,n){let r=this.cache,i=t.length,a=wl(n,i);Sl(r,a)||(e.uniform1iv(this.addr,a),Cl(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||pl,a[e])}function du(e){switch(e){case 5126:return Kl;case 35664:return ql;case 35665:return Jl;case 35666:return Yl;case 35674:return Xl;case 35675:return Zl;case 35676:return Ql;case 5124:case 35670:return $l;case 35667:case 35671:return eu;case 35668:case 35672:return tu;case 35669:case 35673:return nu;case 5125:return ru;case 36294:return iu;case 36295:return au;case 36296:return ou;case 35678:case 36198:case 36298:case 36306:case 35682:return su;case 35679:case 36299:case 36307:return cu;case 35680:case 36300:case 36308:case 36293:return lu;case 36289:case 36303:case 36311:case 36292:return uu}}var fu=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Gl(t.type)}},pu=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=du(t.type)}},mu=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},hu=/(\w+)(\])?(\[|\.)?/g;function gu(e,t){e.seq.push(t),e.map[t.id]=t}function _u(e,t,n){let r=e.name,i=r.length;for(hu.lastIndex=0;;){let a=hu.exec(r),o=hu.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){gu(n,l===void 0?new fu(s,e,t):new pu(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new mu(s),gu(n,e)),n=e}}}var vu=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);_u(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function yu(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var bu=37297,xu=0;function Su(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var Cu=new q;function wu(e){rn._getMatrix(Cu,rn.workingColorSpace,e);let t=`mat3( ${Cu.elements.map(e=>e.toFixed(4))} )`;switch(rn.getTransfer(e)){case ct:return[t,`LinearTransferOETF`];case lt:return[t,`sRGBTransferOETF`];default:return V(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Tu(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Su(e.getShaderSource(t),r)}return i}function Eu(e,t){let n=wu(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var Du={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function Ou(e,t){let n=Du[t];return n===void 0?(V(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var ku=new K;function Au(){return rn.getLuminanceCoefficients(ku),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${ku.x.toFixed(4)}, ${ku.y.toFixed(4)}, ${ku.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function ju(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Pu).join(`
`)}function Mu(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Nu(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Pu(e){return e!==``}function Fu(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Iu(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Lu=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ru(e){return e.replace(Lu,zu)}function zu(e,t){let n=Oc[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return Ru(n)}var Bu=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vu(e){return e.replace(Bu,Hu)}function Hu(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Uu(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}var Wu={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Gu(e){return Wu[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ku={302:`ENVMAP_MODE_REFRACTION`};function qu(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Ku[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Ju={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Yu(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Ju[e.combine]||`ENVMAP_BLENDING_NONE`}function Xu(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Gu(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=qu(n),d=Yu(n),f=ju(n),p=Mu(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(Pu).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(Pu).join(`
`),g.length>0&&(g+=`
`)):(h=[Uu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Pu).join(`
`),g=[Uu(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Oc.tonemapping_pars_fragment,n.toneMapping===0?``:Ou(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Oc.colorspace_pars_fragment,Eu(`linearToOutputTexel`,n.outputColorSpace),Au(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Pu).join(`
`)),o=Ru(o),o=Fu(o,n),o=Iu(o,n),s=Ru(s),s=Fu(s,n),s=Iu(s,n),o=Vu(o),s=Vu(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=yu(i,i.VERTEX_SHADER,v),x=yu(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=Tu(i,b,`vertex`),n=Tu(i,x,`fragment`);H(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):V(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new vu(i,m),w=Nu(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,bu)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=xu++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var Zu=0,Qu=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new $u(e),t.set(e,n)),n}},$u=class{constructor(e){this.id=Zu++,this.code=e,this.usedTimes=0}};function ed(e){return e===1030||e===37490||e===36285}function td(e,t,n,r,i,a){let o=new jn,s=new Qu,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&V(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=kc[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),ee=m.isInstancedMesh===!0,M=m.isBatchedMesh===!0,te=!!i.map,N=!!i.matcap,P=!!b,ne=P&&b.isPMREMTexture===!0,re=!!i.aoMap,ie=!!i.lightMap,ae=!!i.bumpMap&&i.wireframe===!1,F=!!i.normalMap,oe=!!i.displacementMap,se=!!i.emissiveMap,ce=!!i.metalnessMap,I=!!i.roughnessMap,le=i.anisotropy>0,ue=i.clearcoat>0,de=i.diffuseRoughness>0,fe=i.dispersion>0,pe=i.retroreflectivity>0,L=i.iridescence>0,me=i.sheen>0,he=i.transmission>0,ge=le&&!!i.anisotropyMap,_e=ue&&!!i.clearcoatMap,ve=ue&&!!i.clearcoatNormalMap,ye=ue&&!!i.clearcoatRoughnessMap,be=de&&!!i.diffuseRoughnessMap,xe=L&&!!i.iridescenceMap,Se=L&&!!i.iridescenceThicknessMap,Ce=me&&!!i.sheenColorMap,we=me&&!!i.sheenRoughnessMap,Te=!!i.specularMap,Ee=!!i.specularColorMap,De=!!i.specularIntensityMap,Oe=he&&!!i.transmissionMap,ke=he&&!!i.thicknessMap,Ae=!!i.gradientMap,je=!!i.alphaMap,R=i.alphaTest>0,Me=!!i.alphaHash,Ne=!!i.extensions,Pe=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Pe=e.toneMapping);let z=ne?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,Fe={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:M,batchingColor:M&&m._colorsTexture!==null,instancing:ee,instancingColor:ee&&m.instanceColor!==null,instancingMorph:ee&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:rn.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:te,matcap:N,envMap:P,envMapMode:P&&b.mapping,envMapPMREM:ne,envMapMaxLod:ne?z.length-1:null,envMapSize:ne?z[0].width:null,aoMap:re,lightMap:ie,bumpMap:ae,normalMap:F,displacementMap:oe,emissiveMap:se,normalMapObjectSpace:F&&i.normalMapType===1,normalMapTangentSpace:F&&i.normalMapType===0,packedNormalMap:F&&i.normalMapType===0&&ed(i.normalMap.format),metalnessMap:ce,roughnessMap:I,anisotropy:le,anisotropyMap:ge,clearcoat:ue,clearcoatMap:_e,clearcoatNormalMap:ve,clearcoatRoughnessMap:ye,diffuseRoughness:de,diffuseRoughnessMap:be,dispersion:fe,retroreflection:pe,iridescence:L,iridescenceMap:xe,iridescenceThicknessMap:Se,sheen:me,sheenColorMap:Ce,sheenRoughnessMap:we,specularMap:Te,specularColorMap:Ee,specularIntensityMap:De,transmission:he,transmissionMap:Oe,thicknessMap:ke,gradientMap:Ae,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:je,alphaTest:R,alphaHash:Me,combine:i.combine,mapUv:te&&p(i.map.channel),aoMapUv:re&&p(i.aoMap.channel),lightMapUv:ie&&p(i.lightMap.channel),bumpMapUv:ae&&p(i.bumpMap.channel),normalMapUv:F&&p(i.normalMap.channel),displacementMapUv:oe&&p(i.displacementMap.channel),emissiveMapUv:se&&p(i.emissiveMap.channel),metalnessMapUv:ce&&p(i.metalnessMap.channel),roughnessMapUv:I&&p(i.roughnessMap.channel),anisotropyMapUv:ge&&p(i.anisotropyMap.channel),clearcoatMapUv:_e&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:ve&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ye&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:be&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:xe&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:Ce&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:we&&p(i.sheenRoughnessMap.channel),specularMapUv:Te&&p(i.specularMap.channel),specularColorMapUv:Ee&&p(i.specularColorMap.channel),specularIntensityMapUv:De&&p(i.specularIntensityMap.channel),transmissionMapUv:Oe&&p(i.transmissionMap.channel),thicknessMapUv:ke&&p(i.thicknessMap.channel),alphaMapUv:je&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(F||le),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(te||je),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&F===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Pe,decodeVideoTexture:te&&i.map.isVideoTexture===!0&&rn.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:se&&i.emissiveMap.isVideoTexture===!0&&rn.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ne&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ne&&i.extensions.multiDraw===!0||M)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Fe.vertexUv1s=c.has(1),Fe.vertexUv2s=c.has(2),Fe.vertexUv3s=c.has(3),c.clear(),Fe}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=kc[t];n=_s.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new Xu(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function nd(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function rd(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function id(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function ad(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||rd),r.length>1&&r.sort(t||id),i.length>1&&i.sort(t||id)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function od(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new ad,e.set(t,[i])):n>=r.length?(i=new ad,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function sd(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new K,color:new tr};break;case`SpotLight`:n={position:new K,direction:new K,color:new tr,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new K,color:new tr,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new K,skyColor:new tr,groundColor:new tr};break;case`RectAreaLight`:n={color:new tr,position:new K,halfWidth:new K,halfHeight:new K}}return e[t.id]=n,n}}}function cd(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var ld=0;function ud(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function dd(e){let t=new sd,n=cd(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new K);let i=new K,a=new bn,o=new bn;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(ud);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=J.LTC_FLOAT_1,r.rectAreaLTC2=J.LTC_FLOAT_2):(r.rectAreaLTC1=J.LTC_HALF_1,r.rectAreaLTC2=J.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=ld++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function fd(e){let t=new dd(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function pd(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new fd(e),t.set(n,[a])):r>=i.length?(a=new fd(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var md=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,hd=`uniform sampler2D shadow_pass;
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
}`,gd=[new K(1,0,0),new K(-1,0,0),new K(0,1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1)],_d=[new K(0,-1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1),new K(0,-1,0),new K(0,-1,0)],vd=new bn,yd=new K,bd=new K;function xd(e,t,n){let r=new ia,i=new W,a=new W,o=new hn,s=new Cs,c=new ws,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new bs({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new W},radius:{value:4}},vertexShader:md,fragmentShader:hd}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Qr;m.setAttribute(`position`,new Lr(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Hi(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(V(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){V(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){V(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new _n(i.x,i.y,{format:ge,type:F,minFilter:j,magFilter:j,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new ka(i.x,i.y,ae),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=pe,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=O,d.map.depthTexture.magFilter=O}else l.isPointLight?(d.map=new Rc(i.x),d.map.depthTexture=new Aa(i.x,ie)):(d.map=new _n(i.x,i.y),d.map.depthTexture=new ka(i.x,i.y,ie)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=pe,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=j,d.map.depthTexture.magFilter=j):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=O,d.map.depthTexture.magFilter=O);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),yd.setFromMatrixPosition(l.matrixWorld),e.position.copy(yd),bd.copy(e.position),bd.add(gd[t]),e.up.copy(_d[t]),e.lookAt(bd),e.updateMatrixWorld(),n.makeTranslation(-yd.x,-yd.y,-yd.z),vd.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(vd,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new _n(i.x,i.y,{format:ge,type:F}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Sd(e,t){function n(){let t=!1,n=new hn,r=null,i=new hn(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ce(e.DEPTH_TEST):I(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=St[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ce(e.STENCIL_TEST):I(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new tr(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,N=e.getParameter(e.VERSION);N.indexOf(`WebGL`)===-1?N.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(N)[1]),M=te>=1);let P=null,ne={},re=e.getParameter(e.SCISSOR_BOX),ie=e.getParameter(e.VIEWPORT),ae=new hn().fromArray(re),F=new hn().fromArray(ie);function oe(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let se={};se[e.TEXTURE_2D]=oe(e.TEXTURE_2D,e.TEXTURE_2D,1),se[e.TEXTURE_CUBE_MAP]=oe(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),se[e.TEXTURE_2D_ARRAY]=oe(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),se[e.TEXTURE_3D]=oe(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ce(e.DEPTH_TEST),o.setFunc(3),he(!1),ge(1),ce(e.CULL_FACE),L(0);function ce(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function I(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function le(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function ue(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function de(t){return h!==t&&(e.useProgram(t),h=t,!0)}let fe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};fe[103]=e.MIN,fe[104]=e.MAX;let pe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function L(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(I(e.BLEND),g=!1);else if(g===!1&&(ce(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:H(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:H(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:H(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:H(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(fe[n],fe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(pe[r],pe[i],pe[o],pe[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function me(t,n){t.side===2?I(e.CULL_FACE):ce(e.CULL_FACE);let r=t.side===1;n&&(r=!r),he(r),t.blending===1&&t.transparent===!1?L(0):L(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ve(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ce(e.SAMPLE_ALPHA_TO_COVERAGE):I(e.SAMPLE_ALPHA_TO_COVERAGE)}function he(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ge(t){t===0?I(e.CULL_FACE):(ce(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function _e(t){t!==k&&(M&&e.lineWidth(t),k=t)}function ve(t,n,r){t?(ce(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):I(e.POLYGON_OFFSET_FILL)}function ye(t){t?ce(e.SCISSOR_TEST):I(e.SCISSOR_TEST)}function be(t){t===void 0&&(t=e.TEXTURE0+ee-1),P!==t&&(e.activeTexture(t),P=t)}function xe(t,n,r){r===void 0&&(r=P===null?e.TEXTURE0+ee-1:P);let i=ne[r];i===void 0&&(i={type:void 0,texture:void 0},ne[r]=i),(i.type!==t||i.texture!==n)&&(P!==r&&(e.activeTexture(r),P=r),e.bindTexture(t,n||se[t]),i.type=t,i.texture=n)}function Se(){let t=ne[P];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Ce(){try{e.compressedTexImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function we(){try{e.compressedTexImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Te(){try{e.texSubImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Ee(){try{e.texSubImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function De(){try{e.compressedTexSubImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Oe(){try{e.compressedTexSubImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function ke(){try{e.texStorage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Ae(){try{e.texStorage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function je(){try{e.texImage2D(...arguments)}catch(e){H(`WebGLState:`,e)}}function R(){try{e.texImage3D(...arguments)}catch(e){H(`WebGLState:`,e)}}function Me(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ne(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Pe(t){ae.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ae.copy(t))}function z(t){F.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),F.copy(t))}function Fe(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function B(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function Ie(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},P=null,ne={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new tr(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ae.set(0,0,e.canvas.width,e.canvas.height),F.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ce,disable:I,bindFramebuffer:le,drawBuffers:ue,useProgram:de,setBlending:L,setMaterial:me,setFlipSided:he,setCullFace:ge,setLineWidth:_e,setPolygonOffset:ve,setScissorTest:ye,activeTexture:be,bindTexture:xe,unbindTexture:Se,compressedTexImage2D:Ce,compressedTexImage3D:we,texImage2D:je,texImage3D:R,pixelStorei:Ne,getParameter:Me,updateUBOMapping:Fe,uniformBlockBinding:B,texStorage2D:ke,texStorage3D:Ae,texSubImage2D:Te,texSubImage3D:Ee,compressedTexSubImage2D:De,compressedTexSubImage3D:Oe,scissor:Pe,viewport:z,reset:Ie}}function Cd(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new W,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):ht(`canvas`)}function v(e,t,n){let r=1,i=Ie(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),V(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&V(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function b(t){e.generateMipmap(t)}function x(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function S(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];V(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||V(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?ct:rn.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function C(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,V(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function w(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function te(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function N(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function P(e){re(e.target)}function ne(e){ie(e.target)}function re(e){e.removeEventListener(`dispose`,P),N(e),F(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function ie(e){e.removeEventListener(`dispose`,ne),N(e),se(e)}function ae(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?ie(t):re(t))}m.clear(),d.clear()}function F(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&oe(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function oe(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function se(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&re(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let ce=0;function I(){ce=0}function le(){return ce}function ue(e){ce=e}function de(){let e=ce;return e>=i.maxTextures&&V(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),ce+=1,e}function fe(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function pe(t,i){let a=r.get(t);if(t.isVideoTexture&&Fe(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)V(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)V(`WebGLRenderer: Texture marked for update but image is incomplete`);else{we(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function me(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?we(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function he(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?we(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function ge(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?Te(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let _e={[T]:e.REPEAT,[E]:e.CLAMP_TO_EDGE,[D]:e.MIRRORED_REPEAT},ve={[O]:e.NEAREST,[k]:e.NEAREST_MIPMAP_NEAREST,[A]:e.NEAREST_MIPMAP_LINEAR,[j]:e.LINEAR,[ee]:e.LINEAR_MIPMAP_NEAREST,[M]:e.LINEAR_MIPMAP_LINEAR},ye={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function be(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&V(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,_e[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,_e[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,_e[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ve[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ve[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,ye[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function xe(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,P),te(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=fe(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&oe(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function Se(e,t,n){return Math.floor(Math.floor(e/n)/t)}function Ce(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=Se(n.start,r.width,4),c=Se(t.start,r.width,4);n.start<=i+1&&a===c&&Se(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function we(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=xe(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=rn.getPrimaries(rn.workingColorSpace),r=o.colorSpace===``?null:rn.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=B(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=S(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);be(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,x=f.__version===void 0||l===!0,T=u.dataReady,E=w(o,t);if(o.isDepthTexture)m=C(o.format===L,o.type),x&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(x&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&Ce(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(T){if(o.layerUpdates.size>0){let t=wc(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else V(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?V(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=wc(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(x&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(x){if(_)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&x){let t=Ie(g[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(x){let r=Ie(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&b(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function Te(t,o,s){if(o.image.length!==6)return;let c=xe(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=rn.getPrimaries(rn.workingColorSpace),r=o.colorSpace===``?null:rn.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=B(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),x=S(o.internalFormat,g,_,o.normalized,o.colorSpace),T=o.isVideoTexture!==!0,E=u.__version===void 0||c===!0,D=l.dataReady,O=w(o,h);be(e.TEXTURE_CUBE_MAP,o);let k;if(o.isDepthTexture){if(x=C(o.format===L,o.type),E){if(T)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,x,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,h.width,h.height,0,g,_,null)}}else if(f){T&&E&&n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,h.width,h.height);for(let t=0;t<6;t++){k=m[t].mipmaps;for(let r=0;r<k.length;r++){let i=k[r];o.format===1023?T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,g,_,i.data):g===null?V(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):T?D&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,i.data)}}}else{if(k=o.mipmaps,T&&E){k.length>0&&O++;let t=Ie(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,t.width,t.height)}for(let t=0;t<6;t++)if(p){T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<k.length;r++){let i=k[r].image[t].image;T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,i.width,i.height,0,g,_,i.data)}}else{T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,g,_,m[t]);for(let r=0;r<k.length;r++){let i=k[r];T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function Ee(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=S(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),z(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,Pe(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function De(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=C(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;z(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Pe(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Pe(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=S(o.internalFormat,c,l,o.normalized,o.colorSpace);z(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Pe(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Pe(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Oe(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?ge(i.depthTexture,0):pe(i.depthTexture,0);let u=c.__webglTexture,d=Pe(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)z(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)z(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function ke(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)Oe(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?Oe(i.__webglFramebuffer[0],t,0):Oe(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),De(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),De(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Ae(t,n,i){let a=r.get(t);n!==void 0&&Ee(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&ke(t)}function je(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,ne),te(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&z(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=S(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=Pe(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),De(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),be(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)Ee(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else Ee(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?b(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),be(c,a),Ee(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&b(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),be(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)Ee(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else Ee(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?b(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&ke(t)}function R(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=x(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),b(t),n.unbindTexture()}}}let Me=[];function Ne(t){if(t.samples>0){if(z(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(Me.length=0,Me.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&Me.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Me))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function Pe(e){return Math.min(i.maxSamples,e.samples)}function z(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Fe(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function B(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(rn.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&V(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):H(`WebGLTextures: Unsupported texture color space:`,n)),t}function Ie(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=de,this.resetTextureUnits=I,this.getTextureUnits=le,this.setTextureUnits=ue,this.setTexture2D=pe,this.setTexture2DArray=me,this.setTexture3D=he,this.setTextureCube=ge,this.rebindTextures=Ae,this.setupRenderTarget=je,this.updateRenderTargetMipmap=R,this.updateMultisampleRenderTarget=Ne,this.setupDepthRenderbuffer=ke,this.setupFrameBufferTexture=Ee,this.useMultisampledRTT=z,this.dispose=ae}function wd(e,t){function n(n,r=``){let i,a=rn.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Td=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Ed=`
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

}`,Dd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ja(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new bs({vertexShader:Td,fragmentShader:Ed,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Hi(new cs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Od=class extends Ct{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new Dd,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new W,C=null,w=null,T=new ic;T.viewport=new hn;let E=new ic;E.viewport=new hn;let D=[T,E],O=new dc,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Xn,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Xn,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Xn,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,ae.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&V(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&V(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?L:pe,a=_.stencil?ce:ie);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new _n(d.textureWidth,d.textureHeight,{format:fe,type:te,depthTexture:new ka(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new _n(f.framebufferWidth,f.framebufferHeight,{format:fe,type:te,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ae.setContext(r),ae.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function N(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;N(O,i);for(let e=0;e<a.length;e++)N(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),P(e,O,i)};function P(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Dt*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ne=null;function re(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new ic,o.layers.enable(n),o.viewport=new hn,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new ja,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ne&&ne(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ae=new Ec;ae.setAnimationLoop(re),this.setAnimationLoop=function(e){ne=e},this.dispose=function(){}}},kd=new bn,Ad=new q;Ad.set(-1,0,0,0,1,0,0,0,1);function jd(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,gs(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(kd.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(Ad),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Md(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?V(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):V(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var Nd=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Pd=null;function Fd(){return Pd===null&&(Pd=new Gi(Nd,16,16,ge,F),Pd.name=`DFG_LUT`,Pd.minFilter=j,Pd.magFilter=j,Pd.wrapS=E,Pd.wrapT=E,Pd.generateMipmaps=!1,Pd.needsUpdate=!0),Pd}var Id=class{constructor(e={}){let{canvas:t=gt(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=te}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([ve,_e,he]),g=new Set([te,ie,ne,ce,oe,se]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=ot;let j=0,ee=0,N=null,P=-1,re=null,ae=new hn,I=new hn,le=null,ue=new tr(0),de=0,fe=t.width,pe=t.height,L=1,me=null,ge=null,ye=new hn(0,0,fe,pe),be=new hn(0,0,fe,pe),xe=!1,Se=new ia,Ce=new oa,we=!1,Te=!1,Ee=new bn,De=new K,Oe=new hn,ke={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ae=!1;function je(){return N===null?L:1}let R=n;function Me(e,n){return t.getContext(e,n)}let Ne,Pe,z,Fe,B,Ie,Le,Re,ze,Be,Ve,He,Ue,We,Ge,Ke,qe,Je,Ye,Xe,Ze,Qe,$e;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,nt,!1),t.addEventListener(`webglcontextrestored`,rt,!1),t.addEventListener(`webglcontextcreationerror`,it,!1),R===null){let t=`webgl2`;if(R=Me(t,e),R===null)throw Me(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}et()}catch(e){throw t.removeEventListener(`webglcontextlost`,nt,!1),t.removeEventListener(`webglcontextrestored`,rt,!1),t.removeEventListener(`webglcontextcreationerror`,it,!1),H(`WebGLRenderer: `+e.message),e}function et(){Ne=new nl(R),Ne.init(),Ze=new wd(R,Ne),Pe=new Ic(R,Ne,e,Ze),z=new Sd(R,Ne),Pe.reversedDepthBuffer&&d&&z.buffers.depth.setReversed(!0),O=R.createFramebuffer(),k=R.createFramebuffer(),A=R.createFramebuffer(),Fe=new al(R),B=new nd,Ie=new Cd(R,Ne,z,B,Pe,Ze,Fe),Le=new tl(T),Re=new Dc(R),Qe=new Pc(R,Re),ze=new rl(R,Re,Fe,Qe),Be=new sl(R,ze,Re,Qe,Fe),Je=new ol(R,Pe,Ie),Ge=new Lc(B),Ve=new td(T,Le,Ne,Pe,Qe,Ge),He=new jd(T,B),Ue=new od,We=new pd(Ne),qe=new Nc(T,Le,z,Be,p,s),Ke=new xd(T,Be,Pe),$e=new Md(R,Fe,Pe,z),Ye=new Fc(R,Ne,Fe),Xe=new il(R,Ne,Fe),Fe.programs=Ve.programs,T.capabilities=Pe,T.extensions=Ne,T.properties=B,T.renderLists=Ue,T.shadowMap=Ke,T.state=z,T.info=Fe}m!==1009&&(w=new ll(m,t.width,t.height,o,r,i));let tt=new Od(T,R);this.xr=tt,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){let e=Ne.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ne.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return L},this.setPixelRatio=function(e){e!==void 0&&(L=e,this.setSize(fe,pe,!1))},this.getSize=function(e){return e.set(fe,pe)},this.setSize=function(e,n,r=!0){tt.isPresenting?V(`WebGLRenderer: Can't change size while VR device is presenting.`):(fe=e,pe=n,t.width=Math.floor(e*L),t.height=Math.floor(n*L),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(fe*L,pe*L).floor()},this.setDrawingBufferSize=function(e,n,r){fe=e,pe=n,L=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)H(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){V(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(ae)},this.getViewport=function(e){return e.copy(ye)},this.setViewport=function(e,t,n,r){e.isVector4?ye.set(e.x,e.y,e.z,e.w):ye.set(e,t,n,r),z.viewport(ae.copy(ye).multiplyScalar(je()).round())},this.getScissor=function(e){return e.copy(be)},this.setScissor=function(e,t,n,r){e.isVector4?be.set(e.x,e.y,e.z,e.w):be.set(e,t,n,r),z.scissor(I.copy(be).multiplyScalar(je()).round())},this.getScissorTest=function(){return xe},this.setScissorTest=function(e){z.setScissorTest(xe=e)},this.setOpaqueSort=function(e){me=e},this.setTransparentSort=function(e){ge=e},this.getClearColor=function(e){return e.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor(...arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=qe.getClearColor(),r=qe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,R.clearBufferuiv(R.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,R.clearBufferiv(R.COLOR,0,v))}else r|=R.COLOR_BUFFER_BIT}t&&(r|=R.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&R.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,nt,!1),t.removeEventListener(`webglcontextrestored`,rt,!1),t.removeEventListener(`webglcontextcreationerror`,it,!1),qe.dispose(),Ue.dispose(),We.dispose(),Ie.dispose(),B.dispose(),Le.dispose(),Be.dispose(),ze.dispose(),Qe.dispose(),$e.dispose(),Ve.dispose(),tt.dispose(),tt.removeEventListener(`sessionstart`,pt),tt.removeEventListener(`sessionend`,mt),ht.stop()};function nt(e){e.preventDefault(),vt(`WebGLRenderer: Context Lost.`),E=!0}function rt(){vt(`WebGLRenderer: Context Restored.`),E=!1;let e=Fe.autoReset,t=Ke.enabled,n=Ke.autoUpdate,r=Ke.needsUpdate,i=Ke.type;et(),Fe.autoReset=e,Ke.enabled=t,Ke.autoUpdate=n,Ke.needsUpdate=r,Ke.type=i}function it(e){H(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function at(e){let t=e.target;t.removeEventListener(`dispose`,at),st(t)}function st(e){ct(e),B.remove(e)}function ct(e){let t=B.get(e).programs;t!==void 0&&(t.forEach(function(e){Ve.releaseProgram(e)}),e.isShaderMaterial&&Ve.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ke);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=kt(e,t,n,r,i);z.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=ze.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Qe.setup(i,r,s,n,c);let h,g=Ye;if(c!==null&&(h=Re.get(c),g=Xe,g.setIndex(h)),i.isMesh)r.wireframe===!0?(z.setLineWidth(r.wireframeLinewidth*je()),g.setMode(R.LINES)):g.setMode(R.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),z.setLineWidth(e*je()),i.isLineSegments?g.setMode(R.LINES):i.isLineLoop?g.setMode(R.LINE_LOOP):g.setMode(R.LINE_STRIP)}else i.isPoints?g.setMode(R.POINTS):i.isSprite&&g.setMode(R.TRIANGLES);if(i.isBatchedMesh){if(Ne.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Re.get(c).bytesPerElement:1,o=B.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(R,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function lt(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),we===!0&&Ge.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,Tt(e,t,r),e.side=0,e.needsUpdate=!0,Tt(e,t,r),e.side=2):Tt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=We.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),Te=this.localClippingEnabled,we=Ge.init(this.clippingPlanes,Te),we===!0&&Ge.setGlobalState(this.clippingPlanes,t),D!==null&&Ke.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];lt(o,n,t,e),r.add(o)}else lt(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=B.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}Ne.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let ut=null;function dt(e){ut&&ut(e)}function pt(){ht.stop()}function mt(){ht.start()}let ht=new Ec;ht.setAnimationLoop(dt),typeof self<`u`&&ht.setContext(self),this.setAnimationLoop=function(e){ut=e,tt.setAnimationLoop(e),e===null?ht.stop():ht.start()},tt.addEventListener(`sessionstart`,pt),tt.addEventListener(`sessionend`,mt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){H(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=tt.enabled===!0&&tt.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),tt.enabled===!0&&tt.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(tt.cameraAutoUpdate===!0&&tt.updateCamera(t),t=tt.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=We.get(e,C.length),x.init(t),x.state.textureUnits=Ie.getTextureUnits(),C.push(x),Ee.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?Ce.setFromArrayCamera(t):Se.setFromProjectionMatrix(Ee,ft,t.reversedDepth),Te=this.localClippingEnabled,we=Ge.init(this.clippingPlanes,Te),b=Ue.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,tt.enabled===!0&&tt.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&_t(e,t,-1/0,T.sortObjects)}_t(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(me,ge),Ae=tt.enabled===!1||tt.isPresenting===!1||tt.hasDepthSensing()===!1,Ae&&qe.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),we===!0&&Ge.beginShadows();let i=x.state.shadowsArray;if(Ke.render(i,e,t),we===!0&&Ge.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];bt(n,r,e,a)}Ae&&qe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];yt(b,e,n,n.viewport)}}else r.length>0&&bt(n,r,e,t),Ae&&qe.render(e),yt(b,e,t)}N!==null&&ee===0&&(Ie.updateMultisampleRenderTarget(N),Ie.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Qe.resetDefaultState(),P=-1,re=null,C.pop(),C.length>0?(x=C[C.length-1],Ie.setTextureUnits(x.state.textureUnits),we===!0&&Ge.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function _t(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?Ce:Se;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&Oe.setFromMatrixPosition(e.matrixWorld).applyMatrix4(Ee);let i=Be.update(e),a=e.material;a.visible&&b.push(e,i,a,n,Oe.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?Ce:Se;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Be.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),Oe.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),Oe.copy(e.boundingSphere.center)),Oe.applyMatrix4(e.matrixWorld).applyMatrix4(Ee)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,Oe.z,s,t)}}else a.visible&&b.push(e,i,a,n,Oe.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)_t(i[e],t,n,r)}function yt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),we===!0&&Ge.setGlobalState(T.clippingPlanes,n),r&&z.viewport(ae.copy(r)),i.length>0&&St(i,t,n),a.length>0&&St(a,t,n),o.length>0&&St(o,t,n),z.buffers.depth.setTest(!0),z.buffers.depth.setMask(!0),z.buffers.color.setMask(!0),z.setPolygonOffset(!1)}function bt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Ne.has(`EXT_color_buffer_half_float`)||Ne.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new _n(1,1,{generateMipmaps:!0,type:e?F:te,minFilter:M,samples:Math.max(4,Pe.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:rn.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||ae;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ue),de=T.getClearAlpha(),de<1&&T.setClearColor(16777215,.5),T.clear(),Ae&&qe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),we===!0&&Ge.setGlobalState(T.clippingPlanes,r),St(e,n,r),Ie.updateMultisampleRenderTarget(a),Ie.updateRenderTargetMipmap(a),Ne.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,Ct(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(Ie.updateMultisampleRenderTarget(a),Ie.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ue,de),d!==void 0&&(r.viewport=d),T.toneMapping=u}function St(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&Ct(o,t,n,s,l,c)}}function Ct(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function wt(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function Tt(e,t,n){t.isScene!==!0&&(t=ke);let r=B.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Ve.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Ve.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Le.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,at),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return Ot(e,s),d}else s.uniforms=Ve.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Ve.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ge.uniform),Ot(e,s),r.needsLights=jt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=wt(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function Et(e,t,n,r,i){let a=B.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=Tt(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function Dt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=vu.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function Ot(e,t){let n=B.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function kt(e,t,n,r,i){t.isScene!==!0&&(t=ke),Ie.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:rn.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Le.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=B.get(r),b=x.state.lights;if(we===!0&&(Te===!0||e!==re)){let t=e===re&&r.id===P;Ge.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ge.numPlanes||v.numIntersection!==Ge.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===wt(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?Et(r,t,i,s,h):Tt(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(z.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==P&&(P=r.id,O=!0),E||re!==e){z.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(R,`projectionMatrix`,e.projectionMatrix),A.setValue(R,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(R,De.setFromMatrixPosition(e.matrixWorld)),Pe.logarithmicDepthBuffer&&A.setValue(R,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(R,`isOrthographic`,e.isOrthographicCamera===!0),re!==e&&(re=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(R,`sunShadowMap`,b.state.sunShadowMap,Ie),b.state.directionalShadowMap.length>0&&A.setValue(R,`directionalShadowMap`,b.state.directionalShadowMap,Ie),b.state.spotShadowMap.length>0&&A.setValue(R,`spotShadowMap`,b.state.spotShadowMap,Ie),b.state.pointShadowMap.length>0&&A.setValue(R,`pointShadowMap`,b.state.pointShadowMap,Ie)),i.isSkinnedMesh){A.setOptional(R,i,`bindMatrix`),A.setOptional(R,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(R,`boneTexture`,e.boneTexture,Ie))}i.isBatchedMesh&&(A.setOptional(R,i,`batchingTexture`),A.setValue(R,`batchingTexture`,i._matricesTexture,Ie),A.setOptional(R,i,`batchingIdTexture`),A.setValue(R,`batchingIdTexture`,i._indirectTexture,Ie),A.setOptional(R,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(R,`batchingColorTexture`,i._colorsTexture,Ie));let ee=n.morphAttributes;if((ee.position!==void 0||ee.normal!==void 0||ee.color!==void 0)&&Je.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(R,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=Fd()),O){if(A.setValue(R,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&At(j,k),a&&r.fog===!0&&He.refreshFogUniforms(j,a),He.refreshMaterialUniforms(j,r,L,pe,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}vu.upload(R,Dt(v),j,Ie)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(vu.upload(R,Dt(v),j,Ie),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(R,`center`,i.center),A.setValue(R,`modelViewMatrix`,i.modelViewMatrix),A.setValue(R,`normalMatrix`,i.normalMatrix),A.setValue(R,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];$e.update(n,w),$e.bind(n,w)}}return w}function At(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function jt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=B.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),B.get(e.texture).__webglTexture=t,B.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=B.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=B.get(e);if(o.__useDefaultFramebuffer!==void 0){z.bindFramebuffer(R.FRAMEBUFFER,o.__webglFramebuffer),ae.copy(e.viewport),I.copy(e.scissor),le=e.scissorTest,z.viewport(ae),z.scissor(I),z.setScissorTest(le),P=-1;return}if(o.__webglFramebuffer===void 0)Ie.setupRenderTarget(e);else if(o.__hasExternalTextures)Ie.rebindTextures(e,B.get(e.texture).__webglTexture,B.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&B.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);Ie.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=B.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&Ie.useMultisampledRTT(e)===!1?B.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,ae.copy(e.viewport),I.copy(e.scissor),le=e.scissorTest}else ae.copy(ye).multiplyScalar(L).floor(),I.copy(be).multiplyScalar(L).floor(),le=xe;if(n!==0&&(r=O),z.bindFramebuffer(R.FRAMEBUFFER,r)&&z.drawBuffers(e,r),z.viewport(ae),z.scissor(I),z.setScissorTest(le),i){let r=B.get(e.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=B.get(e.textures[t]);R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=B.get(e.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,t.__webglTexture,n)}P=-1};function Mt(e){let t=B.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Pe.textureFormatReadable(e.format),t.__typeReadable=Pe.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){H(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){z.bindFramebuffer(R.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+s);let u=Mt(o);if(u.__formatReadable===!1){H(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){H(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&R.readPixels(t,n,r,i,Ze.convert(c),Ze.convert(l),a)}finally{let e=N===null?null:B.get(N).__webglFramebuffer;z.bindFramebuffer(R.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){z.bindFramebuffer(R.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+s);let d=Mt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,f),R.bufferData(R.PIXEL_PACK_BUFFER,a.byteLength,R.STREAM_READ),R.readPixels(t,n,r,i,Ze.convert(l),Ze.convert(u),0),R.bindBuffer(R.PIXEL_PACK_BUFFER,null);let p=N===null?null:B.get(N).__webglFramebuffer;z.bindFramebuffer(R.FRAMEBUFFER,p);let m=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await xt(R,m,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,f),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,a),R.bindBuffer(R.PIXEL_PACK_BUFFER,null),R.deleteBuffer(f),R.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;Ie.setTexture2D(e,0),R.copyTexSubImage2D(R.TEXTURE_2D,n,0,0,o,s,i,a),z.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ze.convert(t.format),_=Ze.convert(t.type),v;t.isData3DTexture?(Ie.setTexture3D(t,0),v=R.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(Ie.setTexture2DArray(t,0),v=R.TEXTURE_2D_ARRAY):(Ie.setTexture2D(t,0),v=R.TEXTURE_2D),z.activeTexture(R.TEXTURE0),z.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,t.flipY),z.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),z.pixelStorei(R.UNPACK_ALIGNMENT,t.unpackAlignment);let y=z.getParameter(R.UNPACK_ROW_LENGTH),b=z.getParameter(R.UNPACK_IMAGE_HEIGHT),x=z.getParameter(R.UNPACK_SKIP_PIXELS),S=z.getParameter(R.UNPACK_SKIP_ROWS),C=z.getParameter(R.UNPACK_SKIP_IMAGES);z.pixelStorei(R.UNPACK_ROW_LENGTH,h.width),z.pixelStorei(R.UNPACK_IMAGE_HEIGHT,h.height),z.pixelStorei(R.UNPACK_SKIP_PIXELS,l),z.pixelStorei(R.UNPACK_SKIP_ROWS,u),z.pixelStorei(R.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=B.get(e),r=B.get(t),h=B.get(n.__renderTarget),g=B.get(r.__renderTarget);z.bindFramebuffer(R.READ_FRAMEBUFFER,h.__webglFramebuffer),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,B.get(e).__webglTexture,i,d+n),R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,B.get(t).__webglTexture,a,m+n)),R.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,R.DEPTH_BUFFER_BIT,R.NEAREST);z.bindFramebuffer(R.READ_FRAMEBUFFER,null),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||B.has(e)){let n=B.get(e),r=B.get(t);z.bindFramebuffer(R.READ_FRAMEBUFFER,k),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):R.framebufferTexture2D(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,n.__webglTexture,i),T?R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):R.framebufferTexture2D(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,r.__webglTexture,a),i===0?T?R.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):R.copyTexSubImage2D(v,a,f,p,l,u,o,s):R.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,R.COLOR_BUFFER_BIT,R.NEAREST);z.bindFramebuffer(R.READ_FRAMEBUFFER,null),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?R.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?R.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):R.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):R.texSubImage2D(R.TEXTURE_2D,a,f,p,o,s,g,_,h);z.pixelStorei(R.UNPACK_ROW_LENGTH,y),z.pixelStorei(R.UNPACK_IMAGE_HEIGHT,b),z.pixelStorei(R.UNPACK_SKIP_PIXELS,x),z.pixelStorei(R.UNPACK_SKIP_ROWS,S),z.pixelStorei(R.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&R.generateMipmap(v),z.unbindTexture()},this.initRenderTarget=function(e){B.get(e).__webglFramebuffer===void 0&&Ie.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?Ie.setTextureCube(e,0):e.isData3DTexture?Ie.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?Ie.setTexture2DArray(e,0):Ie.setTexture2D(e,0),z.unbindTexture()},this.resetState=function(){j=0,ee=0,N=null,z.reset(),Qe.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return ft}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=rn._getDrawingBufferColorSpace(e),t.unpackColorSpace=rn._getUnpackColorSpace()}},Ld=e=>e&&[e.x,e.y,e.z].every(Number.isFinite),Rd=e=>e&&[e.left,e.right,e.top,e.bottom].every(Number.isFinite)&&e.left<e.right&&e.top<e.bottom,zd=(e,t,n)=>Math.min(n,Math.max(t,e)),Bd=180/Math.PI,Vd=e=>((e+180)%360+360)%360-180;function Hd(e,t){if(!Ld(e)||!Math.hypot(e.x,e.y,e.z)||!t||![`commandedYawDegrees`,`yawErrorDegrees`,`commandedClimbDegrees`,`climbErrorDegrees`,`minClimbDegrees`,`maxClimbDegrees`].every(e=>Number.isFinite(t[e])))return!1;let n=Math.atan2(e.x,-e.z)*Bd,r=Math.atan2(e.y,Math.hypot(e.x,e.z))*Bd,i=t.commandedYawDegrees-t.yawErrorDegrees,a=t.commandedClimbDegrees-t.climbErrorDegrees,o=Vd(n-i),s=r-a,c=1e-6,l=t.mode===`recover`?0:Math.min(15,Math.abs(t.yawErrorDegrees)),u=Math.min(10,Math.abs(t.climbErrorDegrees));if(Math.abs(o)>l+c||o*t.yawErrorDegrees<-1e-6||Math.abs(s)>u+c||s*t.climbErrorDegrees<-1e-6)return!1;let d=t.minClimbDegrees,f=t.maxClimbDegrees;return t.mode===`recover`&&(d=Math.min(d,t.commandedClimbDegrees),f=Math.max(f,t.commandedClimbDegrees)),r>=d-c&&r<=f+c}function Ud(e){if(!e)return[];let t=[];for(let n of[0,.25,.5,.75,1])for(let r of[0,.25,.5,.75,1]){let i=(e.commandedYawDegrees-e.yawErrorDegrees*(1-n))/Bd,a=(e.commandedClimbDegrees-e.climbErrorDegrees*(1-r))/Bd,o={x:Math.sin(i)*Math.cos(a),y:Math.sin(a),z:-Math.cos(i)*Math.cos(a)};Hd(o,e)&&t.push(o)}return t}function Wd(e){if(!e||![e.x,e.y,e.z,e.w].every(Number.isFinite))return null;let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z),Math.abs(e.w));return t?new G(e.x/t,e.y/t,e.z/t,e.w/t).normalize():null}function Gd(e,t,n){let r=e?.fieldOfView?.vertical;if(![t,n,r].every(Number.isFinite)||t<=0||n<=0||r<=0||r>=180)return null;let i=Wd(e.worldQuaternion),a=Wd(e.cameraQuaternion??{x:0,y:0,z:0,w:1});if(!i||!a)return null;let o=a.invert().multiply(i).normalize(),s=o.clone().invert(),c=n/2/Math.tan(r*Math.PI/360);if(!Number.isFinite(c)||c<=0)return null;let l=e=>{let r=e.z<-1e-8;return{local:{x:e.x,y:e.y,z:e.z},inFront:r,x:r?t/2+c*e.x/-e.z:null,y:r?n/2-c*e.y/-e.z:null}};return{width:t,height:n,focal:c,rotation:o,projectDirection(e){return!Ld(e)||!Math.hypot(e.x,e.y,e.z)?null:l(new K(e.x,e.y,e.z).applyQuaternion(o))},rayFromPixel(e,r){if(![e,r].every(Number.isFinite))return null;let i=new K((e-t/2)/c,-(r-n/2)/c,-1).normalize().applyQuaternion(s);return{x:i.x,y:i.y,z:i.z}},target(){if(!Ld(e.targetLocal))return null;let r=l(e.targetLocal),i=r.inFront&&r.x>=0&&r.x<=t&&r.y>=0&&r.y<=n,a=e.cameraClipping?.near??.1,o=e.cameraClipping?.far??250,s=-e.targetLocal.z,c=Number.isFinite(a)&&Number.isFinite(o)&&a>0&&o>a;return{...r,inViewport:i,visible:i&&c&&s>=a&&s<=o}}}}function Kd(e,t,n=[],{width:r=48,height:i=48,padding:a=5,accept:o=()=>!0,candidates:s=[]}={}){if(!e||![e.x,e.y,r,i,a].every(Number.isFinite)||r<=0||i<=0||a<0||!Rd(t))return null;let c=r/2,l=i/2,u={left:t.left+c,right:t.right-c,top:t.top+l,bottom:t.bottom-l};if(u.left>u.right||u.top>u.bottom)return null;let d=n.filter(Rd),f=e=>o(e)&&!d.some(t=>e.x+c>t.left-a&&e.x-c<t.right+a&&e.y+l>t.top-a&&e.y-l<t.bottom+a),p=e=>({x:zd(e.x,u.left,u.right),y:zd(e.y,u.top,u.bottom)}),m=p(e);if(f(m))return m;let h=s.filter(e=>e&&Number.isFinite(e.x)&&Number.isFinite(e.y));for(let e of d){let t=e.left-c-a,n=e.right+c+a,r=e.top-l-a,i=e.bottom+l+a;h.push({x:t,y:m.y},{x:n,y:m.y},{x:m.x,y:r},{x:m.x,y:i},{x:t,y:r},{x:n,y:r},{x:t,y:i},{x:n,y:i})}for(let e of[u.left,(u.left+u.right)/2,u.right])for(let t of[u.top,(u.top+u.bottom)/2,u.bottom])h.push({x:e,y:t});let g=h.map(p).filter(f);return g.sort((t,n)=>Math.hypot(t.x-e.x,t.y-e.y)-Math.hypot(n.x-e.x,n.y-e.y)),g[0]??null}var qd=Object.freeze({speed:[`SPD`,`速度`],altitude:[`ALT`,`現在高度`],verticalSpeed:[`V/S`,`昇降速度`],heading:[`HDG`,`方位`],throttle:[`THR`,`エンジン出力`],targetAltitude:[`TGT ALT`,`目標`],heightSame:[`ALT OK`,`高さ同じ`],heightOkay:[`ALT OK`,`高さOK`],climb:[`CLIMB`,`▲ 早めに上へ`],descend:[`DESCEND`,`▼ 早めに下へ`],nose:[`NOSE`,`機首`],bank:[`BANK`,`翼の傾き`],flightPath:[`FPM`,`進行`],radarTrack:[`TRK`,`進行方向`],terrain:[`TERRAIN`,`地面注意`],pullUp:[`PULL UP`,`地面接近！`],stall:[`STALL`,`失速から復帰補助中`],exit:[`EXIT`,`出口`],exitOpen:[`EXIT OPEN`,`出口開放・黄色と白の門へ`],nextTarget:[`NEXT`,`次は`],flightDirector:[`FD`,`目標へ向かう輪`],aligned:[`ALIGNED`,`合っています`],target:[`TGT`,`目標`],arrived:[`ARRIVED`,`到着`],altitudeShort:[`ALT`,`高さ`],groundClearance:[`ALT`,`地面まで`],climbShort:[`V/S`,`昇降`],guidanceLevel:[`LEVEL TO SHOW GUIDANCE`,`姿勢を水平に戻すと案内を表示`],flightPathOut:[`FPM OUT OF VIEW`,`進行方向は画面外です`],flightPathCovered:[`FPM OBSCURED`,`進行方向の印は計器の奥です`],flightPathWaiting:[`FPM WHEN MOVING`,`移動を始めると進行方向を表示`]}),Jd=e=>e===`ja`?`ja`:`en`;function Yd(e,t){return qd[t]?.[+(Jd(e)===`ja`)]??``}function Xd(e,t=`en`){let n=typeof e?.targetLabel==`string`?e.targetLabel:typeof e?.label==`string`?e.label:``;if(e?.kind===`exit`||n===`出口`||Number.isFinite(e?.collected)&&Number.isFinite(e?.total)&&e.total>0&&e.collected>=e.total)return Yd(t,`exit`);let r=/^光\s*(\d+)$/.exec(n),i=e?.number??(r?Number(r[1]):Number.isInteger(e?.collected)&&e.collected>=0?e.collected+1:null),a=Number.isInteger(i)&&i>0?i:null;return Jd(t)===`ja`?n||(a?`光 ${a}`:`目標`):a?`TGT ${a}`:`TGT`}function Zd(e,t=`en`,{digits:n=1,equal:r=`高さ同じ`}={}){if(!Number.isFinite(e))return`—`;let i=Number.isInteger(n)?Math.max(0,Math.min(3,n)):1;if(Math.abs(e)<.05)return Jd(t)===`ja`?r:`ALT OK`;let a=Math.abs(e).toFixed(i);return Jd(t)===`ja`?`${e>0?`▲上に`:`▼下に`}${a}m`:`${e>0?`▲ +`:`▼ −`}${a}m`}function Qd(e,t=`en`,{assisted:n=!1}={}){let r=Number.isFinite(e?.bearing)?e.bearing:0,i=Number.isFinite(e?.elevation)?e.elevation:0;if(Jd(t)===`en`)return Math.abs(i)>.13?i>0?`▲`:`▼`:``;let a=Math.abs(r)>Math.PI/2?n&&Math.abs(r)>=175*Math.PI/180?`後ろ`:r>0?`右の後ろ`:`左の後ろ`:Math.abs(r)>.25?r>0?`右`:`左`:`正面`,o=Math.abs(i)>.13?i>0?`上`:`下`:``;return`${a}${o?`・${o}`:``}`}function $d(e,t=`en`){let n=Jd(t)===`ja`?{clear:`地面との間隔`,low:`低空に注意`,danger:`地面接近！`,stopped:`地面に接触`,unknown:`高さを確認できません`}:{clear:``,low:`TERRAIN`,danger:`PULL UP`,stopped:`TERRAIN`,unknown:`ALT —`};return n[e]??n.unknown}function ef(e,t,n=`en`){let r=Jd(n)===`ja`;return e?.grounded?r?`地面に接触・停止`:`TERRAIN`:[[`danger`,`low`].includes(t?.level)?r?`地面注意`:t.level===`danger`?`PULL UP`:`TERRAIN`:``,e?.recoveryAssist>0?Yd(n,`stall`):``,e?.inputHeld&&t?.level===`clear`&&!e?.recoveryAssist?r?`入力保持中・傾きを戻すと追従`:`INPUT HOLD`:``].filter(Boolean).join(` / `)||(r?`機首 ┼　進行方向 ⊙`:`NOSE ┼　FPM ⊙`)}var tf=Object.freeze({停止中:`STOP`,上昇中:`CLIMB`,下降中:`DESCEND`,巡航中:`CRUISE`,ブレーキ:`BRAKE`,加速中:`ACCEL`,速度維持:`SPD HOLD`,失速からの復帰補助中:`STALL`,地面を見る補助中:`TERRAIN`,中立で翼を戻す:`WINGS LEVEL`});function nf(e,t=`en`){return Jd(t)===`ja`?e:tf[e]??``}function rf(e,t=`en`){let n=Number.isInteger(e?.total)&&e.total>0?e.total:3,r=Number.isInteger(e?.collected)&&e.collected>=0?Math.min(n,e.collected):0;return Jd(t)===`ja`?r<n?`${n}つの光を集めて、出口へ`:`光がそろいました。出口へ`:r<n?`TGT ${r}/${n} → EXIT`:`EXIT OPEN`}function af(e,t=`en`){let n=Number.isInteger(e?.total)&&e.total>0?e.total:3,r=Number.isInteger(e?.collected)&&e.collected>=0?Math.max(0,n-e.collected):n;return Jd(t)===`ja`?r===0?`${n}つの光がそろいました。出口へ向かいましょう。`:`光を集めました。あと${r}つ。`:r===0?`EXIT OPEN`:`TGT COLLECTED · ${r} REM`}var of=e=>document.getElementById(e),sf=(e,t)=>e?.toggleAttribute(`hidden`,!t),cf=(e,t)=>{let n=of(e);n&&n.textContent!==t&&(n.textContent=t)},lf=e=>e&&!e.hasAttribute(`hidden`)&&e.getClientRects().length?e.getBoundingClientRect():null,uf=(e,t,n)=>({left:e.x-t/2,right:e.x+t/2,top:e.y-n/2,bottom:e.y+n/2});function df(){sf(of(`stage-boundary-warning`),!1);let e=of(`app`);e&&(e.dataset.boundaryWarning=`clear`,delete e.dataset.boundaryReturnBearing)}function ff(){return[...[`radar`,`bottom-panel`,`practice-panel`,`cockpit-speed`,`cockpit-altitude`,`cockpit-vario`,`cockpit-heading`,`cockpit-target-height`,`cockpit-exit-notice`,`cockpit-power`,`target-edge-marker`,`cockpit-objective-label`,`guidance-director`,`guidance-flight-path`,`guidance-target-point`,`guidance-edge-arrow`,`guidance-edge-label`,`guidance-next-notice`,`guidance-heading`,`guidance-status`,`toast`].map(e=>lf(of(e))),...[`.navigation`,`.topbar .brand`,`.topbar .version`,`.topbar .feedback-metrics`,`.topbar .mode-tag`].map(e=>lf(document.querySelector(e)))].filter(Boolean)}function pf(e,{phase:t=`running`,settings:n={}}={}){let r=of(`stage-boundary-warning`),i=of(`app`);if(!r||t!==`running`||e?.complete)return df(),null;let a=e?.boundary,o=a&&Number.isFinite(a.clearance)&&typeof a.near==`boolean`&&typeof a.outside==`boolean`?a:w(e?.position,{heading:e?.heading,speed:e?.speed,velocity:e?.velocity,turnGravity:n?.turnGravity??e?.turnGravity,maxBank:n?.maxBank,halfExtent:e?.stageHalfExtent??e?.halfExtent??350});if(!o)return df(),null;if(r.dataset.level=o.level,r.dataset.clearance=String(o.clearance),r.dataset.motion=o.motion??`unknown`,i&&(i.dataset.boundaryWarning=o.level),!o.near||!Number.isFinite(o.returnBearingDeg))return sf(r,!1),i&&delete i.dataset.boundaryReturnBearing,{...o,visible:!1,panel:null};let s=Jd(n?.hudLanguage),c=innerWidth,l=innerHeight,u=getComputedStyle(document.documentElement),d=Math.max(0,parseFloat(u.getPropertyValue(`--screen-safe-left`))||0),f=Math.max(0,parseFloat(u.getPropertyValue(`--screen-safe-right`))||0),p={left:d+12,right:c-f-12,top:12,bottom:l-12},m=ff(),h=lf(document.querySelector(`.navigation`)),g={x:c/2,y:Math.max((h?.bottom??40)+32,l*.23)},_=null,v=0,y=0;for(let[e,t]of[[240,52],[180,44],[136,40]]){let n=Kd(g,p,m,{width:e,height:t,padding:7});if(n){_=n,v=e,y=t;break}}if(!_)return sf(r,!1),i&&delete i.dataset.boundaryReturnBearing,{...o,visible:!1,panel:null,reason:`no-free-area`};let b=uf(_,v,y),x=o.outside,S=Math.round(x?Math.max(0,-o.clearance):Math.max(0,o.clearance));cf(`boundary-title`,s===`ja`?x?`内側へ戻る`:`嵐に接近`:x?`TURN BACK`:`STORM`),cf(`boundary-detail`,s===`ja`?x?`外側 ${S}m`:`境界まで ${S}m`:x?`STORM · ${S}m OUT`:`TURN BACK · ${S}m`);let C=of(`boundary-return-arrow`);return C&&(C.style.transform=`rotate(${o.returnBearingDeg}deg)`),r.dataset.returnBearing=String(o.returnBearingDeg),r.dataset.compact=String(v<240),r.dataset.hudLanguage=s,r.setAttribute(`aria-label`,s===`ja`?`嵐の境界。${x?`内側へ戻ってください。`:`境界に接近しています。`}矢印の方向へ。`:`STORM. TURN BACK. ${S}m${x?` OUT`:``}.`),Object.assign(r.style,{left:`${b.left}px`,top:`${b.top}px`,width:`${v}px`,height:`${y}px`}),sf(r,!0),i&&(i.dataset.boundaryReturnBearing=String(o.returnBearingDeg)),{...o,visible:!0,panel:b}}var mf=Math.PI/180,hf=(e,t,n)=>Math.min(n,Math.max(t,e)),gf=e=>e&&[e.x,e.y,e.z].every(Number.isFinite),_f=e=>((e+180)%360+360)%360-180,vf=e=>{if(!gf(e))return null;let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));if(!t)return null;let n=e.x/t,r=e.y/t,i=e.z/t,a=Math.hypot(n,r,i);return{x:n/a,y:r/a,z:i/a}};function yf(e,t={}){if(!t||typeof t!=`object`)return null;let{spanDegrees:n=20,width:r=180}=t;if(!Number.isFinite(e)||!Number.isFinite(n)||n<=0||n>180||!Number.isFinite(r)||r<=0)return null;let i=_f(e),a=i===-180?180:i,o=Math.abs(a)<=n;return{inside:o,x:r/2+hf(a/n,-1,1)*r/2,side:o?null:a<0?`left`:`right`,angleDegrees:a}}function bf(e,t,n,r=24){if(!gf(e)||![t,n,r].every(Number.isFinite)||t<=0||n<=0||r<0||r>=Math.min(t,n)/2||!vf(e))return null;let i=e.z>0,a=e.x,o=i?e.z:-e.y,s=a,c=o,l=Math.max(Math.abs(s),Math.abs(c));if(!l)return null;s/=l,c/=l;let u=Math.min(s?(t/2-r)/Math.abs(s):1/0,c?(n/2-r)/Math.abs(c):1/0);return{x:hf(t/2+s*u,r,t-r),y:hf(n/2+c*u,r,n-r),rotation:(Math.atan2(s,-c)/mf+360)%360,behind:i}}function xf(e){if(e.orientation!=null){let t=e.orientation;if(![t.x,t.y,t.z,t.w].every(Number.isFinite))return null;let n=Math.max(Math.abs(t.x),Math.abs(t.y),Math.abs(t.z),Math.abs(t.w));if(!n)return null;let r=Math.hypot(t.x/n,t.y/n,t.z/n,t.w/n),i=t.x/n/r,a=t.y/n/r,o=t.z/n/r,s=t.w/n/r;return{x:-2*(i*o+s*a),y:2*(s*i-a*o),z:2*(i*i+a*a)-1}}let t=e.heading??0,n=e.pitch??0;return[t,n].every(Number.isFinite)?{x:Math.sin(t)*Math.cos(n),y:Math.sin(n),z:-Math.cos(t)*Math.cos(n)}:null}function Sf(t,n={}){if(!n||typeof n!=`object`)return null;let{maxPitch:r=15,maxBank:i=40,turnGravity:a=t?.turnGravity??e.defaultGravity,turnState:s=null}=n;if(!t||!gf(t.position)||!gf(t.targetPosition)||![r,i,a].every(Number.isFinite)||r<=0||r>=90||i<=0||i>=90||t.velocity!=null&&!gf(t.velocity)||[`bank`,`angleOfAttack`,`speed`,`throttle`].some(e=>t[e]!=null&&!Number.isFinite(t[e]))||s!=null&&(typeof s!=`object`||![`target`,`go-around`].includes(s.mode)||!Number.isFinite(s.yawDegrees)))return null;let c={x:t.targetPosition.x-t.position.x,y:t.targetPosition.y-t.position.y,z:t.targetPosition.z-t.position.z},l=vf(c);if(!l)return null;let u=Math.hypot(c.x,c.y,c.z),d=t.velocity?Math.hypot(t.velocity.x,t.velocity.y,t.velocity.z):t.speed??0;if(!Number.isFinite(d)||d<0||!Number.isFinite(u))return null;let f=xf(t),p=d>.05&&t.velocity?vf(t.velocity):f;if(!p)return null;let m=Math.hypot(p.x,p.z),h=m>1e-8?Math.atan2(p.x,-p.z):f?Math.atan2(f.x,-f.z):0,g=Math.atan2(p.y,m)/mf,_=_f(((Math.hypot(l.x,l.z)>1e-8?Math.atan2(l.x,-l.z):h)-h)/mf);Math.abs(_)>=175&&(_=(Math.abs(t.bank??0)>3*mf?Math.sign(t.bank):1)*Math.abs(_));let v=_<0?-1:1,y=o(d,i*mf,a);if(!Number.isFinite(y))return null;let b=Math.hypot(c.x,c.z),x=Number.isFinite(t.targetRadius)&&t.targetRadius>0?t.targetRadius:0,S=.8*Math.sqrt(Math.max(0,x*x-c.y*c.y)),C=y*Math.sin(Math.abs(_)*mf),w=C*C-2*y*S+S*S,T=w>0?C+Math.sqrt(w):0,E=w>0?Math.max(0,C-Math.sqrt(w)):0,D=S>0&&b<=E+.1,O=!D&&b<T-.1,k=!D&&T>1e-6?b/T:null,A=O||Math.abs(_)>90?`go-around`:`target`,j=A===`go-around`?(O?-v:v)*15:hf(_,-15,15),ee=s?.mode??A,M=s?hf(s.yawDegrees,-15,15):j,te=Math.min(Math.abs(t.bank??0),i*mf),N=Math.max(0,((10/Math.max(d,.01))**2/Math.cos(te)-1)/4.5)/mf,P=Math.min(N,17),ne=t.throttle===0,re=Math.min(ne?0:10,hf(r-P,-Math.min(10,r),10)),ie=-Math.min(10,r),ae=(t.angleOfAttack??0)/mf,F=ee===`go-around`?0:Math.atan2(c.y,Math.hypot(c.x,c.z))/mf;(ne||N>=17||Math.abs(ae)>=17||re<0||g<ie||g>re)&&(ee=`recover`,M=0,A=`recover`,j=0,F=Math.min(F,0,re),ae>17&&(F=Math.min(F,g-Math.min(10,ae-17+2))),ae<-17&&(F=Math.max(F,g+Math.min(10,-ae-17+2)))),F=hf(F,ie,re);let oe=hf(F-g,-10,10),se=Math.max(0,17-ae),ce=Math.max(0,17+ae),I=g+(oe>0?Math.min(oe,se):Math.max(oe,-ce)),le=h+M*mf,ue=I*mf,de={x:Math.sin(le)*Math.cos(ue),y:Math.sin(ue),z:-Math.cos(le)*Math.cos(ue)},fe=Math.acos(hf(p.x*de.x+p.y*de.y+p.z*de.z,-1,1))/mf;return{direction:de,mode:ee,rawMode:A,rawYawErrorDegrees:j,aligned:d>.05&&fe<=2,yawErrorDegrees:M,climbErrorDegrees:I-g,angularErrorDegrees:fe,targetBearingDegrees:_,commandedYawDegrees:_f(le/mf),commandedClimbDegrees:I,maxClimbDegrees:re,minClimbDegrees:ie,trimDegrees:P,stallMarginDegrees:17-Math.abs(ae),insideTurnCircle:O,turnCircleRatio:k,turnRadius:y,distance:u}}var Cf=(e,t,n)=>Math.min(n,Math.max(t,e));function wf(e,t,{now:n=0,dt:r=0,targetChanged:i=!1}={}){let a=Number.isFinite(n)?n:0,o=e?.rawMode??e?.mode,s=Cf(e?.rawYawErrorDegrees??e?.yawErrorDegrees??0,-15,15),c=s<0?-1:1;if(o===`recover`)return{mode:`recover`,yawDegrees:0,turnSign:t?.turnSign??c,changedAt:a};if(!t)return{mode:o===`go-around`?`go-around`:`target`,yawDegrees:s,turnSign:c,changedAt:a};let l=Number.isFinite(e?.turnCircleRatio)?e.turnCircleRatio:null,u=Number.isFinite(e?.targetBearingDegrees)?e.targetBearingDegrees:0,d=t.mode===`go-around`?`go-around`:`target`,f=t.changedAt,p=t.turnSign??c,m=a-f>=600;i||t.mode===`recover`?(d=o===`go-around`?`go-around`:`target`,f=a,p=c):d===`target`&&m&&(l!==null&&l<.9||Math.abs(u)>95)?(d=`go-around`,f=a,p=c):d===`go-around`&&m&&(l===null||l>1.1)&&Math.abs(u)<85&&(d=`target`,f=a);let h=d===`go-around`?p*15:Cf(u,-15,15),g=Number.isFinite(r)?Cf(r,0,.05):0,_=Number.isFinite(t.yawDegrees)?t.yawDegrees:0,v=_+Math.sign(h-_)*Math.min(Math.abs(h-_),150*g);return{mode:d,yawDegrees:Cf(v,-15,15),turnSign:p,changedAt:f}}var Tf=180/Math.PI,Ef=[`flightDirector`,`targetHeadingCue`,`edgeGuidance`,`nextTargetNotice`,`audioGuidance`],Df=e=>document.getElementById(e),Of=(e,t)=>e?.toggleAttribute(`hidden`,!t),kf=(e,t)=>{let n=Df(e);n&&n.textContent!==t&&(n.textContent=t)},Af=(e,t,n)=>{e&&Object.assign(e.style,{left:`${t}px`,top:`${n}px`})},jf=(e,t,n,r=0)=>e?.setAttribute(`transform`,`translate(${t} ${n}) rotate(${r})`),Mf=e=>e&&[e.x,e.y,e.z].every(Number.isFinite)?new K(e.x,e.y,e.z):null,Nf=e=>({x:e.x,y:e.y,z:e.z}),Pf=e=>((e+180)%360+360)%360-180,Ff=e=>Number.isInteger(e)&&e>=3&&e<=8,If=(e,t)=>Number.isInteger(e)&&e>=0&&e<=t,Lf=e=>e&&!e.hasAttribute(`hidden`)&&e.getClientRects().length?e.getBoundingClientRect():null,Rf=(e,t,n)=>({left:e.x-t/2,right:e.x+t/2,top:e.y-n/2,bottom:e.y+n/2}),zf=(e,t)=>e.left<t.right&&e.right>t.left&&e.top<t.bottom&&e.bottom>t.top,Bf=null;function Vf(){Bf=null,Of(Df(`guidance-panel`),!1);let e=Df(`toast`);e&&(e.style.left=``,e.style.top=``,e.style.transform=``);let t=Df(`guidance-panel`);t&&(delete t.dataset.guidanceDirection,delete t.dataset.aligned,delete t.dataset.guidanceReady);let n=Df(`app`);n&&(delete n.dataset.guidanceEdge,delete n.dataset.guidanceDirector,delete n.dataset.guidanceDirection,delete n.dataset.guidanceAligned,delete n.dataset.guidanceReady)}function Hf(e){let t=[`radar`,`bottom-panel`,`practice-panel`,`cockpit-speed`,`cockpit-altitude`,`cockpit-vario`,`cockpit-heading`,`cockpit-target-height`,`cockpit-exit-notice`,`cockpit-power`,`target-edge-marker`,`cockpit-objective-label`];return e!==`cockpit`&&t.push(`toast`),[...t.map(e=>Lf(Df(e))),Lf(document.querySelector(`.navigation`)),...[`.topbar .brand`,`.topbar .version`,`.topbar .feedback-metrics`].map(e=>Lf(document.querySelector(e)))].filter(Boolean)}function Uf(e,t,n){return e?.inFront&&Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y}:e&&bf(e.local,t,n,18)||{x:t/2,y:n/2}}function Wf(e,t){let n=getComputedStyle(document.documentElement),r=Math.max(0,parseFloat(n.getPropertyValue(`--screen-safe-left`))||0),i=Math.max(0,parseFloat(n.getPropertyValue(`--screen-safe-right`))||0);return{left:r+12,right:e-i-12,top:12,bottom:t-12}}function Gf(e,t,n=`en`){let r=Math.round(Math.abs(e)),i=Math.round(Math.abs(t));return n===`en`?`${[`↑`,`↗`,`→`,`↘`,`↓`,`↙`,`←`,`↖`][(Math.round(e/45)%8+8)%8]}${r?`${r}°`:``} · ${Zd(t,n,{digits:0})}`:`${r<1?`正面`:`${e<0?`左`:`右`}${r}°`}・${i<1?`同じ高さ`:`${t<0?`下`:`上`}${i}m`}`}function Kf(e,t,n,r,i,a){let o=Df(`guidance-heading`),s=Df(`guidance-heading-scale`),c=Df(`guidance-heading-pointer`),l=e===`cockpit`?Lf(Df(`cockpit-heading`)):null;if(e!==`cockpit`){let e=Lf(document.querySelector(`.navigation`)),t=Kd({x:innerWidth/2,y:(e?.bottom??54)+24},r,i,{width:180,height:28});t&&(l=Rf(t,180,28))}if(!l)return Of(o,!1),null;let u=l.right-l.left,d=l.bottom-l.top,f=yf(t,{spanDegrees:10,width:Math.max(1,u-16)});if(!f)return Of(o,!1),null;Of(o,!0),Of(s,e!==`cockpit`),o.dataset.camera=e,Af(o,l.left,l.top),Object.assign(o.style,{width:`${u}px`,height:`${d}px`});let p=(Math.round(n)%360+360)%360;return kf(`guidance-heading-scale`,`${(p+350)%360} ┃ ${(p+355)%360} ┃ ${p}° ┃ ${(p+5)%360} ┃ ${(p+10)%360}`),kf(`guidance-heading-pointer`,f.inside?`▼`:`${f.side===`left`?`←`:`→`}${Math.round(Math.abs(f.angleDegrees))}°`),c.dataset.side=f.side??`inside`,c.style.left=`${8+f.x}px`,o.setAttribute(`aria-label`,`${Yd(a,`heading`)} ${Gf(t,0,a).split(a===`ja`?`・`:` · `)[0]}`),l}function qf(e,{phase:t=`running`,camera:n=`overlay`,settings:r={},now:i,dt:a}={}){let o=Df(`guidance-panel`),s=Df(`app`);if(!o||e?.mode!==`flight`||t!==`running`)return Vf(),null;let c=e.total===void 0?3:e.total;if(!Ff(c))return Vf(),null;let l=typeof e.course?.id==`string`?e.course.id:e.courseId??``,u=innerWidth,d=innerHeight,f=Gd(e,u,d),p={maxPitch:r?.maxPitch??15,maxBank:r?.maxBank??40,turnGravity:r?.turnGravity??9.8},m=Sf(e,p),h=f?.target();if(!f||!m||!h)return Vf(),null;let g=Object.fromEntries(Ef.map(e=>[e,r?.[e]!==!1])),_=Jd(r?.hudLanguage),v=Number.isFinite(i)?i:performance.now(),y=Bf?.total===c&&Bf?.courseId===l,b=If(e.collected,c)?e.collected:y?Bf.count:0,x=Bf&&b<Bf.count,S=!Bf||!y||x||Bf.camera!==n||Bf.width!==u||Bf.height!==d||Math.abs(Bf.rotation.dot(f.rotation))<Math.cos(Math.PI/8),C=Number.isFinite(a)&&a>=0?Math.min(a,.25):Math.max(0,Math.min(.25,(v-(Bf?.now??v))/1e3)),w=wf(m,S?null:Bf.turn,{now:v,dt:C,targetChanged:!!(Bf&&b!==Bf.count)}),T=w.mode===`recover`?m:Sf(e,{...p,turnState:{mode:w.mode,yawDegrees:w.yawDegrees}});if(!T)return Vf(),null;let E=Mf(T.direction);!S&&Bf.direction&&(E=Bf.direction.clone().lerp(E,1-Math.exp(-C/.2)).normalize()),Hd(E,T)||(E=Mf(T.direction));let D=e.targetPosition.y-e.position.y,O=Math.atan2(e.targetPosition.x-e.position.x,-(e.targetPosition.z-e.position.z))*Tf,k=Number.isFinite(e.heading)?e.heading:0,A=Pf(O-k*Tf);A===-180&&(A=180);let j=S?null:Bf.notice;Bf&&y&&!x&&b>Bf.count&&g.nextTargetNotice&&!e.complete&&(j={until:v+1800,bearing:A,height:D,target:{collected:b,total:c,targetLabel:e.targetLabel}}),(!g.nextTargetNotice||j?.until<=v)&&(j=null),Bf={count:b,total:c,courseId:l,camera:n,width:u,height:d,now:v,direction:E.clone(),rotation:f.rotation.clone(),notice:j,turn:w};let ee=h.visible,M={...T,bearingDeg:A,travelBearingDeg:T.targetBearingDegrees,targetVisible:ee,flags:g,direction:Nf(E),rawDirection:{...T.direction},geometricDirection:{...m.direction},aligned:!1,driverReady:!1,director:null,directorReason:null,flightPath:null,flightPathReason:null,edge:null};if(e.complete)return Of(o,!1),delete o.dataset.guidanceDirection,delete o.dataset.aligned,delete o.dataset.guidanceReady,s&&(delete s.dataset.guidanceEdge,delete s.dataset.guidanceDirector,delete s.dataset.guidanceDirection,delete s.dataset.guidanceAligned,delete s.dataset.guidanceReady),M;Of(o,!(!g.flightDirector&&!g.targetHeadingCue&&!g.edgeGuidance&&!j)),o.dataset.camera=n,o.dataset.target=b===c?`exit`:`light`,o.dataset.hudLanguage=_,o.setAttribute(`aria-label`,_===`ja`?`次の目標への案内`:`Flight guidance`),kf(`guidance-path-caption`,Yd(_,`flightPath`)),s.dataset.guidanceEdge=g.edgeGuidance?`on`:`off`,s.dataset.guidanceDirector=g.flightDirector?`on`:`off`,Df(`guidance-symbols`).setAttribute(`viewBox`,`0 0 ${u} ${d}`);let te=Wf(u,d),N=Df(`toast`);if(N&&g.flightDirector&&n!==`cockpit`){let t=Lf(N),r=Lf(Df(`bottom-panel`));if(t){let i=Hf(n).filter(e=>e!==t&&(e.left!==t.left||e.top!==t.top));for(let t of[E,Mf(e.velocity)]){let e=t&&f.projectDirection(t);e?.inFront&&i.push(Rf(e,70,70))}let a=Kd({x:u/2,y:(r?.top??d)-t.height/2-12},te,i,{width:t.width,height:t.height});a&&(N.style.transform=`translateX(-50%)`,N.style.left=`${a.x}px`,N.style.top=`${a.y-t.height/2}px`)}}else N&&(N.style.left=``,N.style.top=``,N.style.transform=``);let P=Hf(n),ne=[...P];for(let t of[E,Mf(e.velocity)]){let e=t&&f.projectDirection(t);e?.inFront&&ne.push(Rf(e,76,76))}let re=g.targetHeadingCue?Kf(n,A,k*Tf,te,ne,_):null;g.targetHeadingCue||Of(Df(`guidance-heading`),!1),re&&P.push(re);let ie=f.projectDirection(E),ae=Uf(ie,u,d),F=g.flightDirector?Kd(ae,te,P,{width:62,height:62,accept:e=>Hd(f.rayFromPixel(e.x,e.y),T),candidates:Ud(T).map(e=>f.projectDirection(e)).filter(e=>e?.inFront)}):null,oe=Df(`guidance-director`);if(Of(oe,g.flightDirector&&!!F),F){let t=f.rayFromPixel(F.x,F.y),n=Mf(e.velocity),r=!!(n&&n.length()>.05&&n.normalize().dot(Mf(t))>=Math.cos(2/Tf)),i=!ie.inFront||Math.hypot(ie.x-F.x,ie.y-F.y)>.1;M.direction=t,M.aligned=r,M.director={...F,clamped:i},M.driverReady=!0,jf(oe,F.x,F.y),oe.dataset.aligned=String(r),oe.dataset.clamped=String(i)}else g.flightDirector&&(M.directorReason=Yd(_,`guidanceLevel`));let se=Mf(e.velocity),ce=se&&se.length()>.05,I=ce?f.projectDirection(se.normalize()):null,le=I?.inFront&&I.x>=0&&I.x<=u&&I.y>=0&&I.y<=d,ue=le&&P.some(e=>zf(Rf(I,44,40),e)),de=g.flightDirector&&le&&!ue?{x:I.x,y:I.y}:null,fe=Df(`guidance-flight-path`);Of(fe,g.flightDirector&&!!de),s.dataset.guidanceDirector=g.flightDirector?`on`:`off`,de?(jf(fe,de.x,de.y),fe.dataset.clamped=`false`,fe.dataset.moving=`true`,M.flightPath={...de,clamped:!1,moving:!0}):g.flightDirector&&(M.flightPathReason=Yd(_,ce?le?`flightPathCovered`:`flightPathOut`:`flightPathWaiting`)),de||(M.driverReady=!1,M.aligned=!1,M.director=null,F=null,M.direction=Nf(E),Of(oe,!1)),Of(Df(`guidance-path-caption`),!1);let pe=JSON.stringify(M.direction);o.dataset.guidanceReady=String(M.driverReady),s.dataset.guidanceReady=String(M.driverReady),M.driverReady?(o.dataset.guidanceDirection=pe,o.dataset.aligned=String(M.aligned),s.dataset.guidanceDirection=pe,s.dataset.guidanceAligned=String(M.aligned)):(delete o.dataset.guidanceDirection,delete o.dataset.aligned,delete s.dataset.guidanceDirection,delete s.dataset.guidanceAligned),Of(Df(`guidance-target-point`),g.edgeGuidance&&ee),jf(Df(`guidance-target-point`),h.x??0,h.y??0),Of(Df(`guidance-target-diamond`),b!==c),Of(Df(`guidance-exit-gate`),b===c);let L=g.edgeGuidance&&!h.inViewport?bf(h.local,u,d,18):null,me=Df(`guidance-edge-arrow`);if(Of(me,!!L),Of(Df(`guidance-edge-label`),!1),L){M.edge={...L},jf(me,L.x,L.y,L.rotation),me.dataset.x=String(L.x),me.dataset.y=String(L.y),me.dataset.behind=String(L.behind);let t=Df(`guidance-edge-label`),n=Math.min(126,u-48),r=Kd({x:L.x<u/3?L.x+n/2+22:L.x>u*2/3?L.x-n/2-22:L.x,y:L.y<d/3?L.y+22+22:L.y>d*2/3?L.y-22-22:L.y},te,[...P,...F?[Rf(F,68,68)]:[],...de?[Rf(de,50,50)]:[]],{width:n,height:44});r&&(Of(t,!0),Af(t,r.x-n/2,r.y-22),t.style.width=`${n}px`,kf(`guidance-edge-title`,`${Xd(e,_)}${_===`ja`&&L.behind?`・後ろ`:``}`),kf(`guidance-edge-detail`,`${Math.round(T.distance)}m　${Gf(A,D,_)}`),M.edge.label={x:r.x-n/2,y:r.y-22,width:n,height:44})}let he=Df(`guidance-next-notice`);if(Of(he,!1),j){let e=Math.min(290,u-40),t=Lf(document.querySelector(`.navigation`)),n=M.edge?.label,r=[...P,...F?[Rf(F,68,68)]:[],...de?[Rf(de,50,50)]:[],...n?[{left:n.x,right:n.x+n.width,top:n.y,bottom:n.y+n.height}]:[]],i=Kd({x:u/2,y:(t?.bottom??50)+42},te,r,{width:e,height:62});if(i){Of(he,!0),Af(he,i.x-e/2,i.y-31),he.style.width=`${e}px`;let t=Xd(j.target,_),n=_===`ja`?`${Yd(_,`nextTarget`)} ${Gf(j.bearing,j.height,_)}`:Gf(j.bearing,j.height,_);kf(`guidance-notice-target`,_===`ja`?t:`${Yd(_,`nextTarget`)} ${t}`),kf(`guidance-notice-text`,n),M.notice={message:n,until:j.until,x:i.x-e/2,y:i.y-31}}}let ge=Df(`guidance-status`);if(Of(ge,!!(M.directorReason||M.flightPathReason)),M.directorReason||M.flightPathReason){kf(`guidance-director-reason`,M.directorReason??``),kf(`guidance-path-reason`,M.flightPathReason??``);let e=Math.min(290,u-40),t=M.directorReason&&M.flightPathReason?46:28,n=Lf(document.querySelector(`.navigation`)),r={x:u/2,y:(n?.bottom??50)+t/2+12},i=Kd(r,te,P,{width:e,height:t})??r;Af(ge,i.x-e/2,Math.max(12,Math.min(d-t-12,i.y-t/2))),ge&&Object.assign(ge.style,{width:`${e}px`,minHeight:`${t}px`})}return o.dataset.mode=T.mode,o.dataset.targetVisible=String(ee),M}var Jf=`twist.flight-settings.v1`,Yf=Object.freeze({deadzone:{label:`機首の中立範囲`,min:0,max:8,step:1,initial:3,unit:`°`},maxTilt:{label:`機首が最大になるスマホの傾き`,min:10,max:30,step:1,initial:25,unit:`°`},maxPitch:{label:`機首の最大角度`,min:5,max:35,step:1,initial:15,unit:`°`},timeConstant:{label:`機首が追いつく時間の目安`,min:.1,max:1,step:.1,initial:.3,unit:`秒`},steerTiltDeadzone:{label:`旋回の中立範囲（ひねる）`,min:0,max:8,step:1,initial:3,unit:`°`},maxSteerTilt:{label:`旋回が最大になるひねり`,min:5,max:30,step:1,initial:15,unit:`°`},steerTwistDeadzone:{label:`旋回の中立範囲（回す）`,min:0,max:8,step:1,initial:5,unit:`°`},maxSteerTwist:{label:`旋回が最大になる回し`,min:8,max:40,step:1,initial:20,unit:`°`},steerCurve:{label:`旋回の効き方のカーブ`,min:1,max:2,step:.1,initial:1,unit:``},maxBank:{label:`翼の最大角度`,min:5,max:40,step:1,initial:40,unit:`°`},turnGravity:{label:`旋回の強さ`,min:3,max:15,step:.1,initial:9.8,unit:``},displayTimeConstant:{label:`固定表示の回転のならし`,min:0,max:.3,step:.01,initial:.05,unit:`秒`},chaseTimeConstant:{label:`追尾カメラの遅れ`,min:0,max:.5,step:.01,initial:.15,unit:`秒`},ladderRange:{label:`操縦席の角度線の範囲（機首から前後）`,min:5,max:30,step:5,initial:10,unit:`°`},cockpitFov:{label:`操縦席の上下の視野`,min:60,max:100,step:.1,initial:0,auto:!0,unit:`°`},radarRange:{label:`レーダーの半径`,min:20,max:500,step:10,initial:180,unit:`m`},targetHeightGuide:{label:`目標高度の目印`,initial:!0},flightDirector:{label:`目標へ向かう輪`,initial:!0},targetHeadingCue:{label:`方位目盛りの目標の印`,initial:!0},edgeGuidance:{label:`画面の縁の目標案内`,initial:!0},nextTargetNotice:{label:`次の目標の合図`,initial:!0},audioGuidance:{label:`左右から聞こえる案内音`,initial:!0},hudLanguage:{label:`HUDの表記`,initial:`en`,options:{en:`英語`,ja:`日本語`},unit:``}}),Xf=Object.freeze(Object.fromEntries(Object.entries(Yf).map(([e,t])=>[e,t.initial])));function Zf(e){let t=Object.fromEntries(Object.entries(Yf).map(([t,n])=>{let r=e?.[t];return[t,n.options?typeof r==`string`&&Object.hasOwn(n.options,r)?r:n.initial:typeof n.initial==`boolean`?typeof r==`boolean`?r:n.initial:n.auto&&r===0?0:Number.isFinite(r)?Math.max(n.min,Math.min(n.max,r)):n.initial]}));return t.steerTiltDeadzone=Math.min(t.steerTiltDeadzone,t.maxSteerTilt-1),t.steerTwistDeadzone=Math.min(t.steerTwistDeadzone,t.maxSteerTwist-1),t}function Qf(e,t){return Zf(Object.hasOwn(Yf,t)?{...e,[t]:Yf[t].initial}:e)}function $f(e){try{return Zf(JSON.parse(e.getItem(Jf)))}catch{return{...Xf}}}function ep(e,t){try{return e.setItem(Jf,JSON.stringify(Zf(t))),!0}catch{return!1}}var tp=Object.freeze({tiltDeadzone:3,tiltMaximum:25,twistDeadzone:5,twistMaximum:32,throttleMaximum:12,pitchRate:.65,yawRate:.8,speed:10,acceleration:3.5,brake:6.5,flightBankAngle:U.degToRad(40)}),np=new K(0,0,1),rp=1e-12,ip=()=>({pitch:0,steer:0,twist:0});function ap(e){if(!e||![e.x,e.y,e.z,e.w].every(Number.isFinite))return null;let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z),Math.abs(e.w));return t===0?null:new G(e.x/t,e.y/t,e.z/t,e.w/t).normalize()}function op(e,t=0){return!e||![e.alpha,e.beta,e.gamma,t].every(Number.isFinite)?null:new G().setFromEuler(new An(U.degToRad(e.beta),U.degToRad(e.gamma),U.degToRad(e.alpha),`ZXY`)).multiply(new G().setFromAxisAngle(np,-U.degToRad(t))).normalize()}function sp(e,t){let n=ap(e),r=ap(t);if(!n||!r)return ip();let i=n.invert().multiply(r).normalize();i.w<0&&i.set(-i.x,-i.y,-i.z,-i.w);let a=Math.hypot(i.z,i.w);if(a<rp)return ip();let o=new G(0,0,i.z/a,i.w/a),s=i.clone().multiply(o.clone().invert()).normalize(),c=Math.hypot(s.x,s.y),l=c>rp?2*Math.atan2(c,Math.max(0,s.w))/c:0;return{pitch:U.radToDeg(s.x*l),steer:U.radToDeg(s.y*l),twist:-U.radToDeg(2*Math.atan2(o.z,o.w))}}function cp(e,t){let n=ap(e),r=ap(t);return!n||!r?new G:r.invert().multiply(n).normalize()}function lp(e,t,n=0){let r=ap(e),i=ap(t),a=()=>({pitch:0,steer:0,twist:0,valid:!1});if(!r||!i||!Number.isFinite(n))return a();let o=i.clone().invert().multiply(r).normalize(),s=new K(0,0,1).applyQuaternion(o).applyAxisAngle(np,U.degToRad(n));return s.z<=.08?a():{pitch:U.radToDeg(Math.atan2(s.y,s.z)),steer:-U.radToDeg(Math.atan2(s.x,s.z)),twist:sp(r,i).twist,valid:!0}}function up(e,t){return t?.valid!==!1&&[`pitch`,`steer`,`twist`].every(e=>Number.isFinite(t?.[e]))?{...t,held:!1}:{pitch:Number.isFinite(e?.pitch)?e.pitch:0,steer:Number.isFinite(e?.steer)?e.steer:0,twist:Number.isFinite(e?.twist)?e.twist:0,valid:!0,held:!0}}function dp(e,t=e){let n=ap(e),r=ap(t),i=()=>({pitch:0,steer:0,valid:!1});if(!n||!r)return i();let a=new K(0,1,0).applyQuaternion(n),o=Math.hypot(a.x,a.y),s=new K(0,0,1).applyQuaternion(r);if(o<1e-4||s.z<=.08)return i();a.set(a.x/o,a.y/o,0);let c=new K(a.y,-a.x,0);return{pitch:U.radToDeg(Math.atan2(s.dot(a),s.z)),steer:-U.radToDeg(Math.atan2(s.dot(c),s.z)),valid:!0}}function fp(e){let t=Number.isFinite(e?.pitch)?U.degToRad(e.pitch):0,n=Number.isFinite(e?.steer)?U.degToRad(e.steer):0,r=Number.isFinite(e?.twist)?U.degToRad(e.twist):0,i=Math.hypot(t,n),a=i>0?new G().setFromAxisAngle(new K(t/i,n/i,0),i):new G;return new G().setFromAxisAngle(np,-r).multiply(a).normalize()}function pp(e,t,n,r){if(!Number.isFinite(e))return 0;let i=U.clamp((Math.abs(e)-n)/(r-n)*t,0,1);return Math.sign(e)*i}function mp(e){return Number.isFinite(e)?U.radToDeg(Math.asin(Math.sin(U.degToRad(e)))):0}function hp(e,t=1){let n=Number.isFinite(t)?Math.max(0,t):1,r=pp(e?.pitch,n,tp.tiltDeadzone,tp.throttleMaximum);return{pitchRate:pp(mp(e?.twist),n,tp.twistDeadzone,tp.twistMaximum)*tp.pitchRate,yawRate:pp(e?.steer,n,tp.tiltDeadzone,tp.tiltMaximum)*tp.yawRate,acceleration:Math.max(0,-r)*tp.acceleration,brake:Math.max(0,r)*tp.brake}}function gp(e,t=1,n=`tilt`,r){let i=Zf(r),a=Number.isFinite(t)?Math.max(0,t):1,o=i.deadzone,s=i.maxTilt,c=n===`twist`?pp(mp(e?.twist),a,i.steerTwistDeadzone,i.maxSteerTwist):pp(e?.steer,a,i.steerTiltDeadzone,i.maxSteerTilt),l=Math.sign(c)*Math.abs(c)**i.steerCurve;return{pitchRate:pp(e?.pitch,a,o,s)*tp.pitchRate,bankAngle:l*i.maxBank*Math.PI/180,acceleration:0,brake:0}}function _p(e,t){return Number.isFinite(e)?U.clamp(e,0,t):0}function vp(e,t,n){let r=_p(e,tp.speed),i=Number.isFinite(t)?Math.max(0,t):0,a=_p(n?.acceleration,tp.acceleration),o=_p(n?.brake,tp.brake);return U.clamp(r+(a-o)*i,0,tp.speed)}var yp=Object.freeze({cruiseSpeed:10,defaultThrottle:.5,gravity:3,maxThrust:1.8,cruiseDrag:.9,maxSpeed:30,maxLift:9,stallStart:20*Math.PI/180,stallEnd:70*Math.PI/180,recoveryThrust:5.4,recoveryTurnRate:2.5,maxRecoveryAcceleration:12,maxTimeStep:.05,integrationStep:1/120}),bp=(e,t,n)=>Math.min(n,Math.max(t,e)),xp=e=>Number.isFinite(e)?e:0,Sp=(e,t)=>e.x*t.x+e.y*t.y+e.z*t.z,Cp=e=>({x:xp(e?.x),y:xp(e?.y),z:xp(e?.z)}),wp=1e-10,Tp=(e,t,n)=>{let r=bp((e-t)/(n-t),0,1);return r*r*(3-2*r)};function Ep(e){let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));if(t===0)return null;let n=e.x/t,r=e.y/t,i=e.z/t,a=Math.hypot(n,r,i);return{x:n/a,y:r/a,z:i/a}}function Dp(e){let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z));if(t===0)return e;let n=Math.hypot(e.x/t,e.y/t,e.z/t);if(t<=yp.maxSpeed/n)return e;let r=yp.maxSpeed/n;return{x:e.x/t*r,y:e.y/t*r,z:e.z/t*r}}function Op(e){let t=Ep(Cp(e?.forward))??{x:0,y:0,z:-1},n=Ep(Cp(e?.up))??{x:0,y:1,z:0},r=e=>{let n=Sp(e,t);return{x:e.x-t.x*n,y:e.y-t.y*n,z:e.z-t.z*n}},i=r(n);return Math.hypot(i.x,i.y,i.z)<wp&&(i=r(Math.abs(t.y)<.9?{x:0,y:1,z:0}:{x:0,y:0,z:1})),{forward:t,up:Ep(i)}}function kp(e,t,n,r){let i=Math.hypot(e.x,e.y,e.z),a=i>wp?{x:e.x/i,y:e.y/i,z:e.z/i}:{x:0,y:0,z:0},o=i>wp?Math.atan2(-Sp(e,n),Sp(e,t)):0,s=Sp(n,a),c={x:n.x-a.x*s,y:n.y-a.y*s,z:n.z-a.z*s},l=Math.hypot(c.x,c.y,c.z)>wp?Ep(c):null,u=(i/yp.cruiseSpeed)**2,d=bp((Math.abs(o)-yp.stallStart)/(yp.stallEnd-yp.stallStart),0,1),f=1-d**2*(3-2*d),p=l&&i>wp?bp(yp.gravity*u*(1+4.5*o),-yp.maxLift,yp.maxLift)*f:0,m=yp.cruiseDrag*u,h=(1-Tp(Math.abs(t.y),Math.sin(Math.PI/12),Math.sin(Math.PI/4)))*Tp(n.y,.3,.8),g=1-Tp(Sp(e,t),1,4.5),_=Tp(o,yp.stallStart,yp.stallEnd),v=r*h*Math.max(g,_),y=r*(yp.maxThrust+yp.recoveryThrust*h*g),b=Sp(t,a),x={x:t.x-a.x*b,y:t.y-a.y*b,z:t.z-a.z*b},S=Math.hypot(x.x,x.y,x.z),C=S>wp?Ep(x):null,w=C?Math.min(yp.maxRecoveryAcceleration,i*yp.recoveryTurnRate*r*h*_)*Math.min(1,S/.1):0;return{x:t.x*y-a.x*m+(l?.x??0)*p+(C?.x??0)*w,y:t.y*y-a.y*m+(l?.y??0)*p-yp.gravity+(C?.y??0)*w,z:t.z*y-a.z*m+(l?.z??0)*p+(C?.z??0)*w,angleOfAttack:o,lift:p,thrust:y,recoveryAssist:v,recoveryAcceleration:w}}function Ap(e,t,n){let r=Dp(Cp(e)),{forward:i,up:a}=Op(n),o=bp(xp(n?.throttle),0,1),s=bp(xp(t),0,yp.maxTimeStep),c=Math.ceil(s/yp.integrationStep),l=c>0?s/c:0;for(let e=0;e<c;e+=1){let e=kp(r,i,a,o),t=kp(Dp({x:r.x+e.x*l/2,y:r.y+e.y*l/2,z:r.z+e.z*l/2}),i,a,o);r=Dp({x:r.x+t.x*l,y:r.y+t.y*l,z:r.z+t.z*l})}let u=kp(r,i,a,o);return{velocity:r,speed:Math.hypot(r.x,r.y,r.z),verticalSpeed:r.y,angleOfAttack:u.angleOfAttack,lift:u.lift,throttle:o,engineThrust:u.thrust,recoveryAssist:u.recoveryAssist,recoveryAcceleration:u.recoveryAcceleration}}var jp=Math.PI/180,Mp=e=>[`classic`,`legacy`].includes(e)?`classic`:`assisted`,Np=180/Math.PI,Pp=(e,t,n)=>Math.min(n,Math.max(t,e)),Fp=e=>Number.isFinite(e)&&e>0,Ip=e=>e&&[e.left,e.top,e.right,e.bottom].every(Number.isFinite)&&e.left<e.right&&e.top<e.bottom,Lp=(e,t,n)=>t>=e.left&&t<=e.right&&n>=e.top&&n<=e.bottom,Rp=()=>({visible:!1,x:0,y:0,rotation:0,behind:!1,inView:!1});function zp(e,t,n=`assisted`){let r=Fp(e)&&Fp(t),i=r?e:1,a=r?t:1,o=2*Math.atan(Math.tan(22.5*jp)*a/i)*Np,s=Mp(n)===`classic`?64:Pp(o,64,100);return{vertical:s,horizontal:2*Math.atan(Math.tan(s*jp/2)*i/a)*Np}}function Bp(e,t,n,r,i){let a=-1/0,o=1/0;for(let[s,c,l,u]of[[e,n,i.left,i.right],[t,r,i.top,i.bottom]]){if(c===0){if(s<l||s>u)return null;continue}let e=(l-s)/c,t=(u-s)/c;a=Math.max(a,Math.min(e,t)),o=Math.min(o,Math.max(e,t))}if(o<Math.max(a,0))return null;let s=Lp(i,e,t)?o:Math.max(0,a);if(!Number.isFinite(s))return null;let c=e+n*s,l=t+r*s;return!Number.isFinite(c)||!Number.isFinite(l)?null:{x:Pp(c,i.left,i.right),y:Pp(l,i.top,i.bottom)}}function Vp(e,t,n,r,i){let a=Math.max(Math.abs(i.left-e),Math.abs(i.right-e),Math.abs(i.top-t),Math.abs(i.bottom-t),1),o=Pp(e+n*a,i.left,i.right),s=Pp(t+r*a,i.top,i.bottom),c=[{x:i.left,y:s},{x:i.right,y:s},{x:o,y:i.top},{x:o,y:i.bottom}];return c.sort((e,t)=>Math.hypot(e.x-o,e.y-s)-Math.hypot(t.x-o,t.y-s)),c[0]}function Hp(e){let{target:t,width:n,height:r,verticalFov:i,bounds:a,avoid:o}=e??{};if(!t||![t.x,t.y,t.z].every(Number.isFinite)||!Fp(n)||!Fp(r)||!Number.isFinite(i)||i<=0||i>=180||!Ip(a))return Rp();let s=Math.max(Math.abs(t.x),Math.abs(t.y),Math.abs(t.z));if(s===0)return Rp();let c=t.x/s,l=t.y/s,u=t.z/s,d=n/2,f=r/2,p=t.z>=0,m,h;if(p){let e=Math.atan2(c,-u);Math.abs(e)>=175*jp&&(e=Math.PI),m=e,h=-Math.atan2(l,Math.hypot(c,u))}else{let e=r/2/Math.tan(i*jp/2),t=c===0?d:d+c/-u*e,n=l===0?f:f-l/-u*e;if(Number.isFinite(t)&&Number.isFinite(n)&&Lp(a,t,n))return{visible:!1,x:t,y:n,rotation:0,behind:!1,inView:!0};m=c,h=-l}let g=Math.max(Math.abs(m),Math.abs(h));g>0?(m/=g,h/=g):(m=0,h=-1);let _=(Math.atan2(m,-h)*Np+360)%360,v=Bp(d,f,m,h,a)??Vp(d,f,m,h,a);if(!Number.isFinite(v.x)||!Number.isFinite(v.y))return{...Rp(),behind:p};if(Ip(o)&&Lp(o,v.x,v.y)){let e=[{x:a.left,y:a.top},{x:a.right,y:a.top},{x:a.left,y:a.bottom},{x:a.right,y:a.bottom}].filter(e=>!Lp(o,e.x,e.y));if(e.length===0)return{...Rp(),behind:p};e.sort((e,t)=>Math.hypot(e.x-v.x,e.y-v.y)-Math.hypot(t.x-v.x,t.y-v.y)),v=e[0]}return{visible:!0,x:v.x,y:v.y,rotation:_,behind:p,inView:!1}}var Up=U.clamp,Wp=(e,t,n)=>U.smoothstep(e,t,n),Gp=(e,t=0)=>Number.isFinite(e)?e:t,Kp=new K(0,1,0),qp=new K(1,0,0),Jp=new K(0,0,1);function Yp({orientation:e,altitude:t,velocity:n,bank:r}={}){let i=new G;if(e&&[e.x,e.y,e.z,e.w].every(Number.isFinite)){let t=Math.max(Math.abs(e.x),Math.abs(e.y),Math.abs(e.z),Math.abs(e.w));t>0&&i.set(e.x/t,e.y/t,e.z/t,e.w/t).normalize()}let a=Math.max(0,Gp(t)),o=new K(Gp(n?.x),Gp(n?.y),Gp(n?.z)),s=1-Wp(a,5,12),c=Wp(-o.y,.1,.8),l=Math.max(s,c),u=i.clone().multiply(new G().setFromAxisAngle(Jp,Gp(r))),d=new K(1,0,0).applyQuaternion(u),f=Math.atan2(d.z,d.x),p=Math.atan2(o.x,-o.z),m=f+Math.atan2(Math.sin(p-f),Math.cos(p-f))*Wp(Math.hypot(o.x,o.z),.1,1),h=-U.degToRad(U.lerp(12,18,1-Up(a/5,0,1))),g=Math.atan2(o.y,Math.hypot(o.x,o.z)),_=Math.min(h,Up(g,-U.degToRad(35),-U.degToRad(10))),v=c>0?U.lerp(_,h,s):h,y=new G().setFromAxisAngle(Kp,-m).multiply(new G().setFromAxisAngle(qp,v)).multiply(new G().setFromAxisAngle(Jp,-Up(Gp(r),-Math.PI/12,Math.PI/12))),b=i.clone().slerp(y,l).normalize(),x=new K(0,0,-1).applyQuaternion(b);return{orientation:b,assistance:l,pitch:Math.atan2(x.y,Math.hypot(x.x,x.z)),offset:new K(-Math.sin(m)*6,1.8,Math.cos(m)*6).multiplyScalar(l)}}function Xp(e,t,n){if(!e)return{...t,orientation:t.orientation.clone(),offset:t.offset.clone()};let r=Math.max(0,Gp(n)),i=e.orientation.clone().rotateTowards(t.orientation,Math.PI/6*r),a=e.offset.clone(),o=a.distanceTo(t.offset);o>0&&a.lerp(t.offset,Math.min(1,3*r/o));let s=new K(0,0,-1).applyQuaternion(i);return{...t,orientation:i,offset:a,pitch:Math.atan2(s.y,Math.hypot(s.x,s.z))}}var Zp=new K(0,0,1),Qp=new K(1,0,0),$p=new K(0,1,0),em=(e,t=0)=>Number.isFinite(e)?e:t,tm=e=>Math.atan2(Math.sin(em(e)),Math.cos(em(e)));function nm(e,t,n,r=.05){let i=tm(e),a=tm(t),o=Math.max(0,Math.min(.3,em(r,.05)));return o===0?a:!Number.isFinite(n)||n<=0?i:tm(i+tm(a-i)*-Math.expm1(-n/o))}function rm({display:e=`bank`,bank:t,phoneRoll:n,screenOffset:r}={}){let i=e===`fixed`,a=i?tm(em(n)+em(r)):0;return{roll:a,camera:new G().setFromAxisAngle(Zp,-a),craft:new G().setFromAxisAngle(Zp,i?0:-em(t)),worldBank:new G().setFromAxisAngle(Zp,i?em(t):0)}}function im(e={}){let t=e?.orientation,n=t&&[t.x,t.y,t.z,t.w].every(Number.isFinite)?new G(t.x,t.y,t.z,t.w):new G,r=Math.max(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z),Math.abs(n.w));r>0?n.set(n.x/r,n.y/r,n.z/r,n.w/r).normalize():n.identity();let i=Qp.clone().applyQuaternion(n),a=new K(0,0,-1).applyQuaternion(n),o=Math.hypot(a.x,a.z),s=o>1e-9?Math.atan2(a.x,-a.z):Math.atan2(i.z,i.x),c=o;o>1e-9&&i.x*Math.cos(s)+i.z*Math.sin(s)<0&&(s=tm(s+Math.PI),c=-o);let l=Math.atan2(a.y,c);return{...e,pitch:l,orientation:new G().setFromAxisAngle($p,-s).multiply(new G().setFromAxisAngle(Qp,l))}}var am=e=>[`chase`,`cockpit`].includes(e)?e:`overlay`,om=e=>Math.atan2(Math.sin(e),Math.cos(e)),sm=(e,t=0)=>Number.isFinite(e)?e:t;function cm(e,t,n,r=.15){let i={heading:sm(t?.heading),pitch:sm(t?.pitch)};if(!e)return i;let a=U.clamp(sm(r,.15),0,.5),o=a===0?1:-Math.expm1(-Math.max(0,sm(n))/a);return Object.fromEntries([`heading`,`pitch`].map(t=>[t,om(e[t]+om(i[t]-e[t])*o)]))}function lm(e){let t=new K(1,0,0).applyQuaternion(e);return{heading:Math.atan2(t.z,t.x),pitch:Math.atan2(2*(e.w*e.x-e.y*e.z),1-2*(e.x**2+e.z**2))}}function um(e,t,n=0){let r=new G().setFromAxisAngle(new K(0,1,0),-e.heading).multiply(new G().setFromAxisAngle(new K(1,0,0),e.pitch)),i=new K(0,9+2*n,25).applyQuaternion(r);i.y=Math.max(i.y,1.2-t);let a=new K(0,1,0).applyQuaternion(r),o=new G().setFromRotationMatrix(new bn().lookAt(i,new K,a)),s=new K(0,0,-1).applyQuaternion(o);return{orientation:o,offset:i,assistance:n,pitch:Math.atan2(s.y,Math.hypot(s.x,s.z))}}function dm(){let e=new Jn;e.name=`original-twin-jet`;let t=new Ss({color:15001833,roughness:.55,metalness:.2}),n=new Ss({color:2506064,roughness:.65,metalness:.3}),r=new Ss({color:3168361,roughness:.2,metalness:.55}),i=new Ss({color:1056555,roughness:.6,metalness:.6}),a=new Ai({color:9692671,transparent:!0,opacity:.8,depthWrite:!1}),o=(t,n,r,i,a,o=1,s=1,c=1)=>{let l=new Hi(t,n);return l.position.set(r,i,a),l.scale.set(o,s,c),e.add(l),l};o(new us(1,12,8),t,0,0,-.15,.38,.3,2.05);let s=o(new Fa(.26,1.5,12),n,0,-.015,-2.15);s.rotation.x=-Math.PI/2,o(new us(1,12,8),r,0,.31,-1.05,.23,.23,.66);function c(t,n,r=0){let i=new rs(new yo(t.map(([e,t])=>new W(e,-t))),{depth:.075,bevelEnabled:!1});i.rotateX(-Math.PI/2),i.translate(0,r,0),e.add(new Hi(i,n))}for(let e of[-1,1]){c([[e*.2,-1.8],[e*.65,-.75],[e*.82,.65],[e*.25,.8]],t,.02),c([[e*.35,-.7],[e*2.05,.85],[e*1.9,1.3],[e*.45,.9]],t),c([[e*.35,1.15],[e*1.25,1.85],[e*1.05,2.1],[e*.32,1.85]],n,.1);let r=o(new Pa(.29,.32,2.6,12),t,e*.42,-.16,.62);r.rotation.x=Math.PI/2;let a=o(new Pa(.24,.29,.38,12,1,!0),i,e*.42,-.16,2.05);a.rotation.x=Math.PI/2;let s=o(new rs(new yo([new W(-.75,0),new W(-1.3,.95),new W(-1.7,1.1),new W(-2.05,.05)]),{depth:.07,bevelEnabled:!1}),n,e*.43,.05,0);s.rotation.y=Math.PI/2,s.rotateX(e*.18)}let l=[-1,1].map(e=>{let t=o(new Fa(.2,1,10),a,e*.42,-.16,2.25);return t.rotation.x=Math.PI/2,t}),u=0;function d(e){u=U.clamp(Number.isFinite(e)?e:0,0,1),a.opacity=.3+.65*u,l.forEach(e=>{e.visible=u>0,e.scale.y=.15+1.35*u,e.position.z=2.2+e.scale.y/2})}return d(0),{group:e,setPower:d,diagnostics:()=>({engines:2,power:u,exhaustVisible:u>0,exhaustLength:u>0?.15+1.35*u:0,exhaustOpacity:u>0?a.opacity:0})}}function fm({halfExtent:e=350}={}){let t=Number.isFinite(e)?Math.max(1,e/110):350/110,n=new Jn;n.name=`assisted-scenery`;let r=new bn,i=new G,a=new K,o=new K,s=(e,t,s)=>{let c=new ea(e,t,s.length);return s.forEach((e,t)=>{a.fromArray(e.p),o.fromArray(e.s),i.setFromAxisAngle(new K(0,1,0),e.turn||0),r.compose(a,i,o),c.setMatrixAt(t,r)}),c.instanceMatrix.needsUpdate=!0,c.computeBoundingSphere(),n.add(c),c},c=new Ai({color:9876671,fog:!1}),l=new Ai({color:11782606,fog:!1}),u=new Ai({color:8559773,fog:!1}),d=[],f=[],p=[];for(let e=0;e<12;e++){let t=e*Math.PI/6,n=560+e%3*85,r=Math.sin(t)*n,i=-Math.cos(t)*n,a=32+e%4*23;d.push({p:[r,a,i],s:[64+e%3*12,35+e%4*9,50+e%2*22],turn:t});let o=2+e%4;for(let e=0;e<o;e++){let n=(e-(o-1)/2)*18;f.push({p:[r+Math.cos(t)*n,a+28+e%2*10,i-Math.sin(t)*n],s:[7,45+e%3*18,7],turn:t})}e%3==0&&p.push({p:[r,a+44,i],s:[44,6,10],turn:t})}let m=new Fa(1,1,5);m.rotateZ(Math.PI),s(m,c,d),s(new Ma(1,1,1),l,f),s(new Ma(1,1,1),l,p);let h=[];for(let e of[12,38,64,90]){for(let t of[-2.2,2.2])h.push({p:[-36+t,e,-18],s:[1.4,22,2.8]});h.push({p:[-36,e+10,-18],s:[7.5,2.5,5]})}s(new Ma(1,1,1),u,h);let g=new Hi(new Fa(4.5,14,4),u);g.position.set(-36,109,-18),g.rotation.y=Math.PI/4,n.add(g);let _=new Ai({color:16773036,fog:!1}),v=new Hi(new us(25,12,8),_);v.position.set(-420,300,-740),n.add(v);let y=new Hi(new us(42,12,8),new Ai({color:16773832,transparent:!0,opacity:.25,depthWrite:!1,fog:!1}));y.position.copy(v.position),n.add(y);let b=[],x=[[-55,12,26],[38,22,4],[-48,34,-48],[48,46,-72],[15,18,65],[-58,55,62],[65,8,-36],[-70,72,-10],[12,68,-82],[66,30,58],[-15,40,-80],[-60,22,-85]];return x.forEach(([e,n,r],i)=>{for(let a=0;a<3;a++)b.push({p:[e*t+(a-1)*4,n+(a===1?1.2:0),r*t+(i%2?1:-1)*a],s:[5+a%2,1.7+a%2*.7,3.5],turn:i*.7})}),s(new os(1,1),new Ai({color:16120566,fog:!1,transparent:!0,opacity:.42,depthWrite:!1}),b),{group:n,details:{islands:12,towerHeight:116,clouds:x.length,suns:1,fogless:!0,collisions:!1,batches:8}}}var pm=84,mm=68;function hm({altitude:e=14}={}){let t=new Jn;t.name=`assisted-exit`,t.visible=!1;let n={transparent:!0,depthTest:!1,depthWrite:!1,fog:!1},r=new Ai({...n,color:16772474,opacity:.32}),i=new Ai({...n,color:16777215,opacity:.24}),a=new ds(3.1,.24,10,64),o=new ds(2.78,.065,8,64),s=Array.from({length:3},(e,n)=>{let s=new Jn,c=new Hi(a,r),l=new Hi(o,i);return c.renderOrder=10,l.renderOrder=11,s.add(c,l),n===1&&(s.rotation.y=Math.PI/2),n===2&&(s.rotation.x=Math.PI/2),t.add(s),s}),c=Math.max(50,e+32),l=new Jn;l.name=`exit-column`,l.position.y=c/2-e;let u=new Ai({...n,color:16770127,opacity:.2}),d=new Ai({...n,color:16775115,opacity:.8}),f=new Hi(new Pa(.38,.55,c,12),u),p=new Hi(new Pa(.1,.14,c,12),d);f.renderOrder=8,p.renderOrder=9,l.add(f,p),l.visible=!1,t.add(l);let m=document.createElement(`canvas`);m.width=m.height=128;let h=m.getContext(`2d`);h.beginPath(),h.arc(64,64,48,0,Math.PI*2),h.strokeStyle=`#78520c`,h.lineWidth=20,h.stroke(),h.strokeStyle=`#ffe44f`,h.lineWidth=14,h.stroke(),h.beginPath(),h.arc(64,64,42,0,Math.PI*2),h.strokeStyle=`#ffffff`,h.lineWidth=4,h.stroke();let g=new Oa(m);g.colorSpace=ot;let _=new Ci(new li({...n,map:g,sizeAttenuation:!1}));_.name=`exit-screen-halo`,_.renderOrder=12,_.visible=!1,t.add(_);let v=!1,y=!1,b=!1;return{group:t,update({visible:e,unlocked:n,time:a=0,fov:o=64,height:c=844}){y=!!e,v=!!n,t.visible=y,l.visible=_.visible=y&&v;let f=(1+Math.sin(a*4))/2;for(let e of s)e.scale.setScalar(v?1+.06*f:1);r.color.setHex(v?16772474:8550998),i.color.setHex(v?16777215:10721654),r.opacity=v?.78+.22*f:.32,i.opacity=v?.75+.25*f:.24,u.opacity=.15+.12*f,d.opacity=.65+.25*f;let p=pm*(v?1+.04*f:1)*2*Math.tan(U.degToRad(o)/2)/Math.max(1,c);_.scale.set(p,p,1),_.material.opacity=1},snapshot:()=>({assisted:y,open:v,rings:y?3:1,color:y?v?`#ffed7a`:`#827a56`:null,minPixels:y&&v?mm:0,column:y&&v,columnTop:c}),dispose(){b||(b=!0,g.dispose())}}}function gm(e={}){let t=e?.halfExtent,n=Number.isFinite(t)&&t>0?t:350,r=new Jn;r.name=`stage-storm-boundary`,r.userData.halfExtent=n,r.userData.collisions=!1;let i=new os(1,1),a=new Ai({color:5859970,transparent:!0,opacity:.84,depthWrite:!1,fog:!1}),o=new ea(i,a,64);o.name=`storm-perimeter-puffs`;let s=new bn,c=new K,l=new K,u=new G,d=new tr;for(let e=0;e<4;e++)for(let t=0;t<16;t++){let r=e*16+t,i=-n+(t+.5)*n/8,a=28+r%5*3;c.set(e===0?n:e===1?-n:i,a,e===2?n:e===3?-n:i);let f=n/16+9+r%3*3,p=18+r%4*2,m=34+r%4*5;l.set(e<2?p:f,m,e<2?f:p),u.setFromAxisAngle(new K(0,1,0),(r%3-1)*.08),s.compose(c,u,l),o.setMatrixAt(r,s),d.setHSL(.61+r%3*.008,.17,.34+r%4*.025),o.setColorAt(r,d)}return o.instanceMatrix.needsUpdate=!0,o.instanceColor&&(o.instanceColor.needsUpdate=!0),o.computeBoundingSphere(),r.add(o),{group:r,update(e){Number.isFinite(e)&&(a.opacity=.84+.025*Math.sin(e*.3))},snapshot:()=>({kind:`storm`,halfExtent:n,stormPuffs:64,instances:64,batches:1,collisions:!1,animatedGeometry:!1,opacity:a.opacity})}}var _m=3.2,vm=4,ym=14478321,bm=U.degToRad(40),xm=[{id:`north`,label:`北の三角塔`,color:`#2c81b7`,shape:`triangle`,position:{x:0,y:16,z:-315}},{id:`east`,label:`東の四角塔`,color:`#bf6559`,shape:`square`,position:{x:295,y:16,z:0}},{id:`south`,label:`南のひし形`,color:`#8b6bb3`,shape:`diamond`,position:{x:0,y:16,z:315}},{id:`west`,label:`西のアーチ`,color:`#478f73`,shape:`arch`,position:{x:-295,y:16,z:0}}],Sm=(e,t=0)=>Number.isFinite(e)?e:t;function Cm(t,{visibility:n=`assisted`,display:r=`bank`,cameraMode:o=`overlay`,course:c=d,turnGravity:l=e.defaultGravity}={}){let u=c&&Array.isArray(c.lights)&&c.lights.length>=3?c:d,f=new K(u.start.x,u.start.y,u.start.z),p=u.lights.map(e=>new K(e.x,e.y,e.z)),m=new K(u.exit.x,u.exit.y,u.exit.z),h=i(l),g=40,_=0;o=am(o),r=r===`fixed`?`fixed`:`bank`,n=Mp(n);let v;try{v=new Id({canvas:t,antialias:!0,alpha:!1,powerPreference:`high-performance`})}catch{throw Error(`3D画面を開けませんでした。WebGL 2が使えるブラウザで開き直してください。`)}v.outputColorSpace=ot,v.autoClear=!1,v.setClearColor(ym,1);let y=new ir;y.background=new tr(ym),y.fog=new rr(ym,220,1100);let b=new ic(64,1,.1,250),x=new Jn;y.add(x);let S=fm({halfExtent:350});x.add(S.group);let C=gm({halfExtent:350});x.add(C.group),y.add(new Ks(16055551,7902882,2.4));let T=new sc(16775399,2.6);T.position.set(-35,65,30),y.add(T);let E=new Ss({color:16053744,roughness:.95}),D=new Ss({color:12110800,roughness:1}),O=new Ss({color:13098209,roughness:.9}),k=new Ai({color:10113071,fog:!1}),A=new Ai({color:12547906,fog:!1}),j=new Ai({color:15845515,fog:!1}),ee=new Ai({color:14917945}),M=new Ai({color:16774336}),te=new Ai({color:1146775}),N=new Ai({color:9355205}),P=new Ma(1,1,1);function ne(e,t,n,r,i,a,o,s=E){let c=new Hi(P,s);return c.position.set(t,n,r),c.scale.set(i,a,o),e.add(c),c}let re=new Jn;re.name=`assisted-direction-landmarks`,x.add(re);function ie(e){let t=new yo;return e.forEach(([e,n],r)=>r===0?t.moveTo(e,n):t.lineTo(e,n)),t.closePath(),t}for(let e of xm){let t,n=28;e.shape===`triangle`?(n=30,t=ie([[-5.5,0],[0,30],[5.5,0]]),t.holes.push(ie([[-3.5,1.5],[3.5,1.5],[0,22.5]]))):e.shape===`square`?(t=ie([[-5,0],[5,0],[5,28],[-5,28]]),t.holes.push(ie([[-3.4,1.6],[-3.4,26.4],[3.4,26.4],[3.4,1.6]]))):e.shape===`diamond`?(t=ie([[0,0],[5.5,14],[0,28],[-5.5,14]]),t.holes.push(ie([[0,4],[-3.6,14],[0,24],[3.6,14]]))):(t=new yo,t.moveTo(-6,0),t.lineTo(-6,22),t.absarc(0,22,6,Math.PI,0,!0),t.lineTo(6,0),t.lineTo(4.4,0),t.lineTo(4.4,22),t.absarc(0,22,4.4,0,Math.PI,!1),t.lineTo(-4.4,0),t.closePath());let r=new Jn;r.name=`direction-${e.id}`,r.position.set(e.position.x,e.position.y,e.position.z),e.id===`east`?r.rotation.y=-Math.PI/2:e.id===`south`?r.rotation.y=Math.PI:e.id===`west`&&(r.rotation.y=Math.PI/2);let i=new rs(t,{depth:3,steps:1,bevelEnabled:!0,bevelSize:.12,bevelThickness:.12,bevelSegments:1,curveSegments:16});i.translate(0,-n/2,-1.5);let a=new Ai({color:e.color,fog:!1});r.add(new Hi(i,a));let o=new ya(new Va(i,25),new sa({color:15398135,fog:!1,transparent:!0,opacity:.72}));r.add(o),ne(r,0,-n/2-.6,0,12.6,1,5,E),re.add(r)}let ae=new Hi(new Pa(84,77,6,64),D);ae.position.set(0,-3.1,-24),ae.scale.z=1.1,x.add(ae);let F=new Hi(new Na(83.8,64),k);F.name=`ground-surface`,F.rotation.x=-Math.PI/2,F.position.set(0,0,-24),F.scale.y=1.1,x.add(F);let oe=new Hi(new cs(2e4,2e4),k);oe.name=`ground-outer-surface`,oe.rotation.x=-Math.PI/2,oe.position.y=-.08,x.add(oe);let se=new Hi(new us(220,64,16,0,Math.PI*2,Math.PI/2,Math.PI/2),new Ai({color:10113071,side:1,fog:!1,depthWrite:!1}));se.renderOrder=-10,x.add(se);let ce=[];for(let e=-700;e<=700;e+=8)ce.push(e,-.045,-700,e,-.045,700),ce.push(-700,-.045,e,700,-.045,e);let I=new Qr;I.setAttribute(`position`,new Br(ce,3));let le=new ya(I,new sa({color:4859158,transparent:!0,opacity:.55,fog:!1}));le.name=`ground-outer-grid`,x.add(le);let ue=[];for(let e=-80;e<=80;e+=8){let t=Math.sqrt(6889-e*e);ue.push(e,.035,-24-t*1.1,e,.035,-24+t*1.1),ue.push(-t,.035,-24+e*1.1,t,.035,-24+e*1.1)}let de=new Qr;de.setAttribute(`position`,new Br(ue,3));let fe=new ya(de,new sa({color:4859158,transparent:!0,opacity:.7,fog:!1}));fe.name=`ground-grid`,x.add(fe),ne(x,0,.025,-25,.15,.05,106,j);let pe=new ea(P,j,14),L=new bn,me=new K,he=new K(3.6,.04,.16),ge=new G;for(let e=0;e<14;e+=1)me.set(0,.04,28-e*8),L.compose(me,ge,he),pe.setMatrixAt(e,L);x.add(pe);let _e=[];for(let e=-21;e<=20;e+=1)for(let t=-23;t<=22;t+=1){if((e+t)%2!=0)continue;let n=e*4+2,r=t*4+2;n*n+(r/1.1)**2>6400||_e.push([n,r-24])}let ve=new ea(P,A,_e.length);ve.name=`ground-paving`,_e.forEach(([e,t],n)=>{L.compose(me.set(e,.012,t),ge,he.set(3.7,.02,3.7)),ve.setMatrixAt(n,L)}),x.add(ve);let ye=new Jn;ye.name=`craft-ground-projection`,ye.rotation.x=-Math.PI/2;let be=new Ai({color:2365198,transparent:!0,opacity:.18,depthWrite:!1,fog:!1}),xe=new Ai({color:16769716,transparent:!0,opacity:.32,depthWrite:!1,fog:!1});ye.add(new Hi(new Na(.85,32),be)),ye.add(new Hi(new ls(.96,1.15,32),xe)),x.add(ye);let Se=new Pa(.68,.85,1,10),Ce=[[-14,7,15],[14,7,15],[-24,13,-7],[27,17,-12],[-31,10,-31],[35,12,-37],[-28,17,-56],[25,9,-70],[-52,22,-18],[56,25,-45],[-58,15,19],[57,13,9],[-47,12,-83],[46,19,-87],[-65,10,-55],[67,16,-10]],we=new ea(Se,E,Ce.length),Te=new ea(P,E,Ce.length*2);for(let e=0;e<Ce.length;e+=1){let[t,n,r]=Ce[e];L.compose(me.set(t,n/2,r),ge,he.set(1,n,1)),we.setMatrixAt(e,L),L.compose(me.set(t,.35,r),ge,he.set(2.25,.7,2.25)),Te.setMatrixAt(e*2,L),L.compose(me.set(t,n,r),ge,he.set(1.9,.65,1.9)),Te.setMatrixAt(e*2+1,L)}x.add(we,Te),ne(x,-19,13.4,-7,12,1.4,2.2),ne(x,31,12.5,-37,10,1.5,2.4),[[-36,4,5,13,17],[36,8,-18,14,15],[-34,12,-48,14,12],[87,-1,-34,17,24],[-88,1,-64,17,19],[54,3,-100,20,12]].forEach(([e,t,n,r,i])=>{ne(x,e,t-1,n,r,2,i,D),ne(x,e,t+.08,n,r+.35,.25,i+.35)});let Ee=new ea(new Pa(.3,.45,3,8),O,36);for(let e=0;e<36;e+=1){let t=e/36*Math.PI*2;L.compose(me.set(Math.cos(t)*81,1.5,-24+Math.sin(t)*89),ge,he.set(1,1,1)),Ee.setMatrixAt(e,L)}x.add(Ee);let De=new Ai({color:7449274}),Oe=new Ai({color:9617097,transparent:!0,opacity:.32,depthWrite:!1}),ke=new ea(new ds(1.8,.045,4,6),Oe,36),Ae=new G,je=new An;for(let e=0;e<3;e+=1){let t=66+e*8,n=12+e*13;for(let r=0;r<8;r+=1){let i=r/8*Math.PI*2+Math.PI/8+e*Math.PI/16;Ae.setFromEuler(je.set(0,-i-Math.PI/2,0)),L.compose(me.set(Math.cos(i)*t,n,-24+Math.sin(i)*t),Ae,he.set(1,1,1)),ke.setMatrixAt(e*8+r,L)}}Ae.setFromEuler(je.set(-Math.PI/2,0,0));for(let e=0;e<12;e+=1){let t=e/12*Math.PI*2,n=e%2==0?24:46;L.compose(me.set(Math.cos(t)*n,52,-24+Math.sin(t)*n),Ae,he.set(1.2,1.2,1.2)),ke.setMatrixAt(24+e,L)}x.add(ke);let R=new ea(P,De,8),Me=new ea(P,De,24),Ne=new ea(new ss(1.1),E,8);for(let e=0;e<8;e+=1){let t=e/8*Math.PI*2+Math.PI/8,n=Math.cos(t)*76,r=-24+Math.sin(t)*76;Ae.setFromEuler(je.set(0,-t-Math.PI/2,0)),L.compose(me.set(n,21,r),ge,he.set(.16,42,.16)),R.setMatrixAt(e,L),L.compose(me.set(n,43,r),ge,he.set(1,1.6,1)),Ne.setMatrixAt(e,L);for(let t=0;t<3;t+=1)L.compose(me.set(n,12+t*12,r),Ae,he.set(2.4+t,.16,.16)),Me.setMatrixAt(e*3+t,L)}x.add(R,Me,Ne);let Pe=[f,...p,m],z=[];for(let e=0;e<Pe.length-1;e+=1)for(let t=0;t<7;t+=1)me.copy(Pe[e]).lerp(Pe[e+1],(t+1)/8),z.push(me.x,me.y,me.z);let Fe=new Qr;Fe.setAttribute(`position`,new Br(z,3));let B=new Ta(Fe,new ba({color:3247269,size:4,sizeAttenuation:!1,transparent:!0,opacity:.65,depthWrite:!1}));x.add(B);let Ie=[[-17,17,10],[22,25,3],[-24,31,-16],[9,38,-14],[-8,29,-37],[31,34,-51],[-28,21,-72],[15,45,-69],[-31,48,16],[33,46,23],[-49,35,33],[49,27,-76]],Le=new ea(new ss(1),O,Ie.length);Ie.forEach(([e,t,n],r)=>{Ae.setFromEuler(je.set(r*.3,r*.6,.2)),L.compose(me.set(e,t,n),Ae,he.set(.7+r%3*.2,1.1,.7)),Le.setMatrixAt(r,L)}),x.add(Le);let Re=new ds(1.5,.075,6,40),ze=new us(.43,16,12),Be=new us(.85,16,12),Ve=new Ai({color:16766074,transparent:!0,opacity:.18,depthWrite:!1}),He=new Ai({color:15739803,fog:!1}),Ue=new Ai({color:16775935,fog:!1}),We=new Ai({color:16743371,transparent:!0,opacity:.22,depthWrite:!1,fog:!1}),Ge=new Ai({color:16411073,transparent:!0,opacity:.85,depthWrite:!1,fog:!1}),Ke=document.createElement(`canvas`);Ke.width=Ke.height=64;let qe=Ke.getContext(`2d`);qe.strokeStyle=`#fffaff`,qe.lineWidth=9,qe.beginPath(),qe.arc(32,32,26,0,Math.PI*2),qe.stroke(),qe.strokeStyle=`#eb228f`,qe.lineWidth=3,qe.beginPath(),qe.arc(32,32,26,0,Math.PI*2),qe.stroke();let Je=new Oa(Ke);Je.colorSpace=ot;let Ye=p.map((e,t)=>{let n=new Jn;n.position.copy(e);let r=new Hi(Re,ee),i=new Hi(ze,M),a=new Hi(Be,Ve);n.add(r,i,a);let o=new Ci(new li({map:Je,transparent:!0,depthTest:!1,depthWrite:!1,sizeAttenuation:!1,fog:!1}));o.renderOrder=8,n.add(o);for(let e=0;e<=t;e+=1)ne(n,(e-t/2)*.42,-2.05,0,.15,.4,.15,ee);let s=new Hi(new Pa(.035,.035,e.y,5),new Ai({color:14917945,transparent:!0,opacity:.28}));s.userData.legacyMaterial=s.material,s.position.set(e.x,e.y/2,e.z),x.add(s,n);let c=new Hi(new Pa(2.2,2.6,.45,20),E);return c.position.set(e.x,.25,e.z),x.add(c),{group:n,stem:s,ring:r,orb:i,halo:a,hint:o}}),Xe=new Jn;Xe.position.copy(m);let Ze=new Hi(new ds(3.1,.15,8,48),N);Xe.add(Ze);let Qe=hm({altitude:m.y});Xe.add(Qe.group),x.add(Xe);let $e=new Jn;$e.position.copy(m),x.add($e),ne($e,-4.7,-1,0,1.5,12,2),ne($e,4.7,-1,0,1.5,12,2),ne($e,0,5.7,0,11,1.5,2.2),ne($e,0,-6.7,0,12,.6,7,O);let et=new ir,tt=new ac(-1,1,1,-1,.1,500);tt.position.z=200,et.add(new Ks(16777215,5404809,2.2));let nt=new sc(16777215,2.1);nt.position.set(-40,70,100),et.add(nt);let rt=new Jn,it=new Jn;rt.add(it);let at=new yo;at.moveTo(0,24),at.lineTo(8,-3),at.lineTo(31,-11),at.lineTo(30,-17),at.lineTo(7,-12),at.lineTo(5,-24),at.lineTo(-5,-24),at.lineTo(-7,-12),at.lineTo(-30,-17),at.lineTo(-31,-11),at.lineTo(-8,-3),at.closePath();let st=new rs(at,{depth:5,bevelEnabled:!0,bevelSegments:1,steps:1,bevelSize:.9,bevelThickness:.9}),ct=new Hi(st,new Ss({color:16383224,roughness:.52,metalness:.12}));it.add(ct);let lt=new ya(new Va(st,25),new sa({color:4618635,transparent:!0,opacity:.6}));it.add(lt);let ut=new Hi(new us(1,16,12),new Ss({color:3640487,roughness:.3,metalness:.2}));ut.position.set(0,2.5,5.3),ut.scale.set(4,9,3),it.add(ut),ne(it,0,-17,5.5,3,7,1,te);let dt=dm();dt.group.rotation.x=Math.PI/2,dt.group.scale.setScalar(13),rt.add(dt.group);let ft=dm();x.add(ft.group),et.add(rt);let pt=f.clone(),mt=new K,ht=new G,gt=new G,_t=new G,vt=f.clone(),yt=new K,V=new G,H=new K(0,0,1),bt=new G,xt=new G,St=new G,Ct=new G,wt=new G,Tt=new G,Et=new K(0,1,0),Dt=new K(1,0,0),Ot=new G,kt=new G,At=new K,jt=new K,Mt=new K,Nt=new K,Pt=new K,Ft=new K,It=new K,Lt=new K,Rt=new K,zt=`explore`,Bt=0,Vt=0,Ht=0,Ut=0,Wt=0,Gt=0,Kt=!1,qt=0,Jt=!1,Yt=1,Xt=1,W={vertical:64,horizontal:64},Zt=0,Qt=!1,q=0,$t=0,en=null,tn=null,nn=null,rn=.15,an=0,on=0,sn=0,cn=0,ln=new G;function un(e=0){if(cn+=Math.max(0,e),gt.copy(ht),zt===`flight`&&(V.setFromAxisAngle(H,-Bt),gt.multiply(V),rt.quaternion.setFromAxisAngle(H,-Bt)),zt===`flight`){let t=Yp({orientation:gt,altitude:pt.y,velocity:Kt?yt:Nt,bank:Bt});(!en||e>0)&&(en=Xp(en,t,e));let n=en;if(r===`fixed`){let t=im(Yp({orientation:ht,altitude:pt.y,velocity:Kt?yt:Nt,bank:0}));(!tn||e>0)&&(tn=im(Xp(tn,t,e))),n=tn}let i=rm({display:r,bank:Bt,phoneRoll:an,screenOffset:on});if(sn=i.roll,b.quaternion.copy(i.camera),tt.quaternion.copy(i.camera),rt.quaternion.copy(i.craft),o===`chase`?(nn=cm(nn,lm(ht),e,rn),n=um(nn,pt.y,t.assistance),r===`fixed`&&(n=im(n))):o===`cockpit`&&(n={orientation:gt.clone(),offset:new K(0,.3,-.8).applyQuaternion(gt),assistance:0,pitch:lm(ht).pitch}),_t.copy(n.orientation).invert().premultiply(i.worldBank),o===`cockpit`&&_t.copy(n.orientation).invert(),vt.copy(pt).add(n.offset),q=n.assistance,$t=n.pitch,ft.group.position.copy(pt),ft.group.quaternion.copy(gt),o===`chase`&&r===`fixed`){let e=im({orientation:n.orientation.clone().invert().multiply(ht)}).orientation;ft.group.quaternion.copy(n.orientation).multiply(i.worldBank.clone().invert()).multiply(e)}}else b.quaternion.identity(),tt.quaternion.identity(),sn=0,en=null,tn=null,nn=null,_t.copy(gt).invert(),vt.copy(pt),q=0,jt.set(0,0,-1).applyQuaternion(gt),$t=Math.atan2(jt.y,Math.hypot(jt.x,jt.z));ln.copy(b.quaternion).invert(),x.quaternion.copy(_t),x.position.copy(vt).negate().applyQuaternion(_t),se.position.copy(vt),se.visible=zt===`flight`&&o!==`overlay`,it.visible=zt!==`flight`,dt.group.visible=zt===`flight`,rt.visible=zt!==`flight`||o===`overlay`,ft.group.visible=zt===`flight`&&o===`chase`,dt.setPower(Ut),ft.setPower(Ut);let t=pt.x**2+((pt.z+24)/1.1)**2<83.5**2;ye.position.set(pt.x,t?.075:-.025,pt.z),ye.scale.setScalar(1.1+pt.y*.045),ye.visible=!0,be.opacity=U.clamp(.22-pt.y*.003,.08,.22),xe.opacity=U.clamp(.36-pt.y*.004,.14,.36)}function dn(){Nt.set(0,0,0),Ht=0,Ut=0,Wt=0,Gt=0,Vt=0}function fn(){Qt||Kt||Jt||(zt!==`flight`&&(ht.copy(gt),Bt=0),zt=`flight`,_n(),jt.set(0,0,-1).applyQuaternion(ht),Nt.copy(jt).multiplyScalar(yp.cruiseSpeed),Ht=Nt.length(),Ut=yp.defaultThrottle,Vt=0,un(),pn())}function pn(){if(Qt)return;let e=48*Math.tan(U.degToRad(b.fov)/2)/Xt;Ye.forEach(t=>t.hint.scale.set(e,e,1)),Qe.update({visible:n===`assisted`,unlocked:qt===p.length,time:cn,fov:b.fov,height:Xt}),v.clear(),v.render(y,b),v.clearDepth(),v.render(et,tt)}function mn(){Ye.forEach((e,t)=>{e.group.visible=t>=qt;let r=n===`assisted`;e.stem.visible=t>=qt&&(!r||t===qt),e.stem.material=r?Ge:e.stem.userData.legacyMaterial,e.stem.scale.set(r?2:1,1,r?2:1),e.ring.material=r?Ue:ee,e.orb.material=r?He:M,e.halo.material=r?We:Ve,e.hint.visible=r&&t>=qt,e.hint.material.opacity=t===qt?1:.65;for(let t of e.group.children)[e.ring,e.orb,e.halo,e.hint].includes(t)||(t.material=r?He:ee);e.ring.scale.setScalar(t===qt?1.1:1),e.halo.scale.setScalar(t===qt?1.25:.85)}),Ze.material=qt===p.length?te:N,Ze.visible=n!==`assisted`,$e.visible=n!==`assisted`}function hn(e,t){Ft.subVectors(t,e);let n=Ft.lengthSq(),r=0;for(;!Jt;){let t=qt<p.length?p[qt]:m,i=qt<p.length?_m:vm,a=n>0?U.clamp(It.subVectors(t,e).dot(Ft)/n,r,1):0;if(Rt.copy(e).addScaledVector(Ft,a),Rt.distanceToSquared(t)>i*i)break;r=a,qt<p.length?qt+=1:Jt=!0,mn()}}function gn(e,t,n=1){Qt||(Yt=Math.max(1,Sm(e,1)),Xt=Math.max(1,Sm(t,1)),v.setPixelRatio(U.clamp(Sm(n,1),.5,1.6)),v.setSize(Yt,Xt,!1),_n(),tt.left=-Yt/2,tt.right=Yt/2,tt.top=Xt/2,tt.bottom=-Xt/2,tt.updateProjectionMatrix(),pn())}function _n(){W=zp(Yt,Xt,n),zt===`flight`&&o===`cockpit`&&Zt>=60&&(W.vertical=Math.min(W.vertical,Zt),W.horizontal=U.radToDeg(2*Math.atan(Math.tan(U.degToRad(W.vertical)/2)*Yt/Xt))),b.aspect=Yt/Xt,b.fov=W.vertical,b.far=1800,b.updateProjectionMatrix(),S.group.visible=n===`assisted`,re.visible=n===`assisted`,mn()}function vn(e){if(Qt)return;let t=e===`fixed`?`fixed`:`bank`;r!==t&&(tn=null),r=t,un(),pn()}function yn(){an=0,on=0,un(),pn()}function xn(e){Qt||(n=Mp(e),_n(),pn())}function Sn(e,t={}){if(Qt)return;let n=t.craftQuaternion;if(n&&[n.x,n.y,n.z,n.w].every(Number.isFinite)){let e=Math.max(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z),Math.abs(n.w));e>0?rt.quaternion.set(n.x/e,n.y/e,n.z/e,n.w/e).normalize():rt.quaternion.identity()}else rt.quaternion.identity();let r=Math.max(0,Sm(e));_+=r,C.update(_),Number.isFinite(t.turnGravity)&&(h=i(t.turnGravity)),Number.isFinite(t.maxBank)&&(g=U.clamp(t.maxBank,5,40));let o=t.mode===`flight`?`flight`:`explore`;o!==zt&&(ht.copy(gt),Bt=0,dn(),Kt=!1,zt=o,_n()),zt===`flight`&&(Number.isFinite(t.cockpitFov)&&t.cockpitFov!==Zt&&(Zt=t.cockpitFov===0?0:U.clamp(t.cockpitFov,60,100),_n()),Number.isFinite(t.chaseTimeConstant)&&(rn=U.clamp(t.chaseTimeConstant,0,.5)),Number.isFinite(t.displayTwist)&&(an=nm(an,U.degToRad(t.displayTwist),r,t.displayTimeConstant)),Number.isFinite(t.displayScreenOffset)&&(on=U.degToRad(t.displayScreenOffset)));let c=Sm(t.pitchRate),l=Sm(t.yawRate),u=U.clamp(Sm(t.bankAngle),-bm,bm),d=U.clamp(Sm(t.throttle,yp.defaultThrottle),0,1);if(r===0||zt===`flight`&&(Kt||Jt)){dn(),un(),pn();return}zt===`explore`&&(Ht=Jt?0:Math.max(0,Sm(t.speed)),Ut=0);let f=Math.max(1,Math.ceil(r*60)),p=zt===`flight`?f:Math.min(240,f),m=r/p;for(let e=0;e<p;e+=1){let e=l,t=0;if(zt===`flight`){let n=Bt;Bt=U.damp(Bt,u,4,m),t=(n+Bt)/2,e=a(t,Ht,h),Vt=a(Bt,Ht,h)}else Bt=0,Vt=l;if(zt===`flight`)St.setFromAxisAngle(Et,-e*m/2),Ct.setFromAxisAngle(Et,-e*m),wt.setFromAxisAngle(Dt,c*m/2),Tt.setFromAxisAngle(Dt,c*m),Ot.copy(ht).premultiply(St).multiply(wt);else{let t=At.set(c,-e,0).length();t>0&&At.multiplyScalar(1/t),bt.setFromAxisAngle(At,t*m/2),xt.setFromAxisAngle(At,t*m),Ot.copy(ht).multiply(bt)}if(jt.set(0,0,-1).applyQuaternion(Ot),mt.copy(pt),zt===`flight`){V.setFromAxisAngle(H,-t),kt.copy(Ot).multiply(V),jt.set(0,0,-1).applyQuaternion(kt),Mt.set(0,1,0).applyQuaternion(kt),Pt.copy(Nt);let n=Ap(Nt,m,{forward:jt,up:Mt,throttle:d}),r=e-a(t,Ht,yp.gravity),i=r===0?n.velocity:s(n.velocity,n.velocity,r,m);if(Nt.set(i.x,i.y,i.z),Ut=n.throttle,Wt=n.recoveryAssist,Gt=n.angleOfAttack,pt.addScaledVector(Pt,m/2).addScaledVector(Nt,m/2),pt.y<=0&&Nt.y<0){let e=mt.y/(mt.y-pt.y);pt.lerpVectors(mt,pt,U.clamp(e,0,1)),pt.y=0,yt.copy(Nt),Kt=!0,dn()}pt.y=U.clamp(pt.y,0,45),pt.y>=45&&Nt.y>0&&(Nt.y=0),Ht=Nt.length(),Vt=Kt?0:a(Bt,Ht,h)}else pt.addScaledVector(jt,Ht*m),pt.y=U.clamp(pt.y,2,45),Nt.subVectors(pt,mt).divideScalar(m);if(zt===`flight`?ht.premultiply(Ct).multiply(Tt).normalize():ht.multiply(xt).normalize(),hn(mt,pt),Jt&&(zt===`flight`?dn():(Ht=0,Nt.set(0,0,0))),zt===`flight`&&(Kt||Jt))break}un(r),pn()}function Cn(){let e=qt<p.length?p[qt]:m;return It.subVectors(e,pt),Lt.subVectors(e,vt).applyQuaternion(_t).applyQuaternion(ln),jt.set(0,0,-1).applyQuaternion(gt),{collected:qt,total:p.length,course:{id:u.id??`legacy`,name:u.name??`比較用（旧配置）`,targetCount:p.length},stageSize:{halfExtent:350,width:700,depth:700},turnGravity:h,boundary:w(pt,{heading:Math.atan2(jt.x,-jt.z),velocity:Nt,speed:Ht,turnGravity:h,maxBank:g}),boundaryAppearance:C.snapshot(),complete:Jt,radarHeading:Math.hypot(Nt.x,Nt.z)>.1?Math.atan2(Nt.x,-Nt.z):Math.atan2(jt.x,-jt.z),navigationTargets:Jt?[]:qt<p.length?p.slice(qt).map((e,t)=>({id:`light-${qt+t+1}`,kind:`light`,number:qt+t+1,label:`光 ${qt+t+1}`,next:t===0,position:{x:e.x,y:e.y,z:e.z}})):[{id:`exit`,kind:`exit`,label:`出口`,next:!0,position:{x:m.x,y:m.y,z:m.z}}],beaconAppearance:{core:`#${(n===`assisted`?He:M).color.getHexString()}`,ring:`#${(n===`assisted`?Ue:ee).color.getHexString()}`,minPixels:n===`assisted`?22:0,columnTarget:n===`assisted`&&qt<p.length?qt+1:null},targetLabel:qt<p.length?`光 ${qt+1}`:`出口`,exitAppearance:{...Qe.snapshot(),position:{x:m.x,y:m.y,z:m.z},radius:vm,stoneFrame:$e.visible},distance:It.length(),bearing:Math.atan2(Lt.x,-Lt.z),elevation:Math.atan2(Lt.y,Math.hypot(Lt.x,Lt.z)),altitude:pt.y,groundClearance:pt.y,viewAssistance:q,viewPitch:$t,viewPosition:{x:vt.x,y:vt.y,z:vt.z},display:r,cameraMode:zt===`flight`?o:`overlay`,craftVisible:rt.visible||ft.group.visible,worldCraftQuaternion:ft.group.quaternion.toArray(),worldCraftScreenQuaternion:ln.clone().multiply(_t).multiply(ft.group.quaternion).toArray(),aircraft:ft.diagnostics(),chaseAngles:nn?{...nn}:null,displayRoll:sn,cameraQuaternion:{x:b.quaternion.x,y:b.quaternion.y,z:b.quaternion.z,w:b.quaternion.w},worldQuaternion:{x:x.quaternion.x,y:x.quaternion.y,z:x.quaternion.z,w:x.quaternion.w},craftScreenQuaternion:(()=>{let e=tt.quaternion.clone().invert().multiply(rt.quaternion);return{x:e.x,y:e.y,z:e.z,w:e.w}})(),speed:Ht,throttle:Ut,recoveryAssist:Wt,angleOfAttack:Gt,verticalSpeed:Nt.y,velocity:{x:Nt.x,y:Nt.y,z:Nt.z},grounded:Kt,mode:zt,bank:Bt,yawRate:Vt,position:{x:pt.x,y:pt.y,z:pt.z},heading:Math.atan2(jt.x,-jt.z),pitch:Math.atan2(jt.y,Math.hypot(jt.x,jt.z)),controlPitch:Math.atan2(2*(ht.w*ht.x-ht.y*ht.z),1-2*(ht.x**2+ht.z**2)),orientation:{x:gt.x,y:gt.y,z:gt.z,w:gt.w},craftQuaternion:{x:rt.quaternion.x,y:rt.quaternion.y,z:rt.quaternion.z,w:rt.quaternion.w},craftScreen:{x:Yt/2,y:Xt/2},cameraPosition:{x:b.position.x,y:b.position.y,z:b.position.z},targetPosition:{x:e.x,y:e.y,z:e.z},targetRadius:qt<p.length?_m:vm,visibility:n,fieldOfView:{...W},cameraClipping:{near:b.near,far:b.far},scenery:{visible:S.group.visible,...S.details},targetLocal:{x:Lt.x,y:Lt.y,z:Lt.z},landmarks:n===`assisted`?xm.map(e=>({...e,position:{...e.position}})):[]}}function wn(){pt.copy(f),ht.identity(),gt.identity(),rt.quaternion.identity(),Bt=0,dn(),Kt=!1,yt.set(0,0,0),en=null,tn=null,nn=null,an=0,on=0,qt=0,Jt=!1,mn(),un(),pn()}function Tn(){if(Qt)return;Qt=!0;let e=new Set,t=new Set([te,N,ee,M,Ve,He,Ue,We,Ge,...Ye.map(e=>e.stem.userData.legacyMaterial)]);[y,et].forEach(n=>n.traverse(n=>{n.isInstancedMesh&&n.dispose(),n.geometry&&e.add(n.geometry),n.material&&(Array.isArray(n.material)?n.material:[n.material]).forEach(e=>t.add(e))})),e.forEach(e=>e.dispose()),t.forEach(e=>e.dispose()),Je.dispose(),Qe.dispose(),v.dispose()}_n(),wn();function En(e){o=am(e),nn=null,_n(),un(),pn()}return{resize:gn,update:Sn,getStatus:Cn,reset:wn,launchFlight:fn,setVisibility:xn,setDisplay:vn,setCameraMode:En,resetDisplayRotation:yn,dispose:Tn}}var wm=e=>e&&[e.x,e.y,e.z].every(Number.isFinite);function Tm({position:e,target:t,heading:n=0,range:r=60}={}){if(!wm(e)||!wm(t))return null;let i=Number.isFinite(n)?n:0,a=Number.isFinite(r)&&r>0?r:60,o=t.x-e.x,s=t.z-e.z,c=Math.hypot(o,s),l=Math.max(a,c),u=(o*Math.cos(i)+s*Math.sin(i))/l,d=(-o*Math.sin(i)+s*Math.cos(i))/l,f=t.y-e.y;return[u,d,c,f].every(Number.isFinite)?{x:u,y:d,distance:c,outside:c>a,height:f,elevation:Math.abs(f)<=1?`level`:f>0?`above`:`below`}:null}function Em(e,t,n=0){return e.left<t.right+n&&e.right>t.left-n&&e.top<t.bottom+n&&e.bottom>t.top-n}function Dm({width:e,height:t,obstacles:n=[],size:r=100,inset:i=12}){let a=[i,e-i-r],o=[i,...n.flatMap(e=>[e.bottom+8,e.top-r-8]),t-i-r];for(let s of[...new Set(o)].sort((e,t)=>e-t))for(let o of a){let a={left:o,top:s,right:o+r,bottom:s+r};if(o>=i&&s>=i&&a.right<=e-i&&a.bottom<=t-i&&!n.some(e=>Em(a,e,6)))return a}return null}function Om(){let e=getComputedStyle(document.documentElement);return{left:Math.max(0,parseFloat(e.getPropertyValue(`--screen-safe-left`))||0),right:Math.max(0,parseFloat(e.getPropertyValue(`--screen-safe-right`))||0)}}var km=`http://www.w3.org/2000/svg`,Am=e=>document.getElementById(e),jm=(e,t)=>{let n=document.createElementNS(km,e);for(let[e,r]of Object.entries(t))n.setAttribute(e,r);return n};function Mm(e,{visibility:t,phase:n,range:r,language:i=`en`}){let a=Am(`radar`),o=document.getElementById(`app`).dataset.camera===`cockpit`;if(a.hidden=t!==`assisted`||n!==`running`||e.complete,a.hidden)return;let s=Jd(i)===`ja`;a.setAttribute(`aria-label`,s?`進行方向が上のレーダー。▲は上、▼は下`:`RADAR TRK UP. ▲ + ALT, ▼ − ALT`),a.querySelector(`.radar-heading`).textContent=Yd(i,`radarTrack`);let c=[`bottom-panel`,`toast`,`practice-panel`].map(Am).filter(e=>!e.hidden&&e.getClientRects().length&&!(o&&e.id===`toast`)).map(e=>e.getBoundingClientRect());c.push(document.querySelector(`.navigation`).getBoundingClientRect(),document.querySelector(`.topbar`).getBoundingClientRect(),{left:innerWidth/2-40,right:innerWidth/2+40,top:innerHeight/2-40,bottom:innerHeight/2+40});let l=o?Om():{left:0,right:0},u=Dm({width:innerWidth,height:innerHeight,obstacles:c,inset:Math.max(12,l.left+8,l.right+8)});if(!u){a.hidden=!0;return}a.style.left=`${u.left}px`,a.style.top=`${u.top}px`,a.dataset.range=r,a.dataset.heading=e.radarHeading,Am(`radar-range`).textContent=`${r}m`;let d=Am(`radar-targets`);d.replaceChildren();let f=[...e.navigationTargets||[]].sort((e,t)=>Number(e.next)-Number(t.next));for(let t of f){let n=Tm({position:e.position,target:t.position,heading:e.radarHeading,range:r});if(!n)continue;let a=n.x*36,o=n.y*36,c=jm(`g`,{class:`radar-target${t.next?` radar-next`:``}${t.kind===`exit`?` radar-exit`:``}`,"data-id":t.id,"data-next":t.next,"data-outside":n.outside,"data-x":a,"data-y":o}),l=t.kind===`exit`?jm(`path`,{d:`M${a},${o-7}l7,7 -7,7 -7,-7Z`}):jm(`circle`,{cx:a,cy:o,r:t.next?4.5:2.5}),u=n.elevation===`above`?`▲`:n.elevation===`below`?`▼`:`＝`,f=t.kind===`exit`?`${Yd(i,`exit`)}${u}`:e.total>3&&!t.next?String(t.number):`${t.number}${u}${t.next?Math.round(Math.abs(n.height))+`m`:``}`,p=jm(`text`,{x:Math.max(-40,Math.min(40,a)),y:Math.max(-29,Math.min(32,o+(o<-20?12:-8))),"text-anchor":a>15?`end`:a<-15?`start`:`middle`});p.textContent=f;let m=jm(`title`,{});m.textContent=s?`${t.label}・${n.elevation===`level`?`同じ高さ`:(n.height>0?`上`:`下`)+Math.round(Math.abs(n.height))+`m`}・水平距離${Math.round(n.distance)}m`:`${Xd(t,i)} ${Zd(n.height,i,{digits:0})} ${Math.round(n.distance)}m`,c.append(m,l,p),d.append(c)}}function Nm(e,t,n=[]){let r=Am(`radar`),i=[...r.hidden?[]:[r.getBoundingClientRect()],...n],a=e=>({left:e.x-50,right:e.x+50,top:e.y-25,bottom:e.y+25});if(!i.some(t=>Em(a(e),t,6)))return e;let o=[...i.flatMap(t=>[{x:t.right+56,y:e.y},{x:t.left-56,y:e.y},{x:e.x,y:t.bottom+31},{x:e.x,y:t.top-31}]),{x:t.left,y:t.top},{x:t.right,y:t.top},{x:t.left,y:t.bottom},{x:t.right,y:t.bottom}].map(e=>({x:Math.max(t.left,Math.min(t.right,e.x)),y:Math.max(t.top,Math.min(t.bottom,e.y))}));return o.sort((t,n)=>Math.hypot(t.x-e.x,t.y-e.y)-Math.hypot(n.x-e.x,n.y-e.y)),o.find(e=>!i.some(t=>Em(a(e),t,6))&&!(e.x>innerWidth/2-100&&e.x<innerWidth/2+100&&e.y>innerHeight/2-75&&e.y<innerHeight/2+75))||e}var Pm=Object.freeze({stopClearance:0,lowClearance:5,dangerClearance:3.5,lowSeconds:3,dangerSeconds:1.5,meterClearance:12});function Fm(e){let t=Number.isFinite(e?.altitude),n=Number.isFinite(e?.verticalSpeed),r=t?Math.max(0,e.altitude):0,i=n&&e.verticalSpeed<0,a=t&&i?Math.min(Number.MAX_VALUE,Math.max(0,r-Pm.stopClearance)/-e.verticalSpeed):null,o;return o=e?.grounded===!0?`stopped`:t?r<=Pm.dangerClearance||a!==null&&a<=Pm.dangerSeconds?`danger`:r<=Pm.lowClearance||a!==null&&a<=Pm.lowSeconds?`low`:`clear`:`unknown`,{clearance:r,level:o,ratio:Math.max(0,Math.min(1,r/Pm.meterClearance)),known:t,descentKnown:n,descending:i,secondsToStop:a}}var Im=`0.1.26`,Lm=e=>e*Math.PI/180;function Rm(e,t){let{deadzone:n,maxTilt:r,maxPitch:i}=Zf(t);return Number.isFinite(e)?Math.sign(e)*Math.min(1,Math.max(0,(Math.abs(e)-n)/(r-n)))*Lm(i):0}function zm(e,t,n,r=.3){if(![e,t,n].every(Number.isFinite)||n<=0)return 0;let i=Zf({timeConstant:r}).timeConstant,a=Math.atan2(Math.sin(t-e),Math.cos(t-e))*-Math.expm1(-n/i)/n;return Math.max(-tp.pitchRate,Math.min(tp.pitchRate,a))}function Bm(e,{pitchMode:t=`angle`,steering:n=`tilt`,settings:r,currentPitch:i=0,dt:a=0}={}){let o=Zf(r),s=gp(e,1,n,o);if(t===`rate`)return s;let c=Rm(e?.pitch,o);return{...s,pitchTarget:c,pitchRate:zm(i,c,a,o.timeConstant)}}function Vm(e,t){return Object.keys(e).filter(n=>t[n]!==e[n].initial)}function Hm(e){return e.auto&&e.initial===0?`自動`:e.options?e.options[e.initial]:typeof e.initial==`boolean`?e.initial?`オン`:`オフ`:`${e.initial}${e.unit??``}`}function Um(){let e=()=>({elapsedSeconds:0,groundContacts:0,recoverySeconds:0}),t={...e(),legs:0},n=e(),r=!0,i=!1,a=()=>{r&&(t.legs++,n=e(),r=!1,i=!1)};return{start:a,advance(e,r){if(!(!Number.isFinite(e)||e<=0)){a();for(let a of[t,n])a.elapsedSeconds+=e,r.recoveryAssist>0&&(a.recoverySeconds+=e),r.grounded&&!i&&a.groundContacts++;i=!!r.grounded}},restartLeg(){r=!0,i=!1},reset(){t={...e(),legs:0},n=e(),r=!0,i=!1},snapshot(){return{...t}},lastLegSnapshot(){return{...n}}}}function Wm({version:e,pitch:t,steer:n,display:r=`bank`,camera:i=`overlay`,result:a,settings:o,stats:s,lastLeg:c,mode:l=`flight`,view:u=`assisted`,feedback:d,input:f,segments:p,exitDiscovery:m,targetViews:h,course:g,stageSize:_,launch:v=`browser`,fullscreen:y=!1}){let b=Zf(o),x=[...t===`rate`?[...l===`flight`&&b.flightDirector?[]:[`maxPitch`],`timeConstant`]:[],...r===`fixed`?[]:[`displayTimeConstant`],...u===`assisted`?[]:[`radarRange`],...i!==`chase`||l!==`flight`?[`chaseTimeConstant`]:[]];if(x.push(...n===`twist`?[`maxSteerTilt`,`steerTiltDeadzone`]:[`maxSteerTwist`,`steerTwistDeadzone`]),(l!==`flight`||i!==`cockpit`)&&x.push(`ladderRange`,`cockpitFov`),u!==`assisted`&&x.push(`targetHeightGuide`),l!==`flight`&&x.push(`flightDirector`,`targetHeadingCue`,`edgeGuidance`,`nextTargetNotice`,`audioGuidance`),l===`explore`)for(let e of[`deadzone`,`maxTilt`,`maxPitch`,`timeConstant`,`maxBank`,`turnGravity`,`displayTimeConstant`,`maxSteerTilt`,`maxSteerTwist`,`steerTiltDeadzone`,`steerTwistDeadzone`,`steerCurve`])x.includes(e)||x.push(e);return{version:e,mode:l,view:u,pitch:t,steer:n,launch:v===`installed`?`installed`:`browser`,fullscreen:!!y,camera:l===`flight`&&[`chase`,`cockpit`].includes(i)?i:`overlay`,display:r===`fixed`?`fixed`:`bank`,...[`clear`,`grounded`].includes(a)?{result:a}:{},settings:b,changedSettings:Vm(Yf,b),inactiveSettings:x,...d?{feedback:structuredClone(d)}:{},...f?{input:structuredClone(f)}:{},...p?{segments:structuredClone(p)}:{},...m?{exitDiscovery:structuredClone(m)}:{},...h?{targetViews:structuredClone(h)}:{},...g?{course:structuredClone(g)}:{},..._?{stageSize:structuredClone(_)}:{},...s?{stats:{...s}}:{},...c?{lastLeg:{...c}}:{}}}var Gm=e=>JSON.stringify(e);function Km(e,{name:t,unit:n=``,initial:r=0,onReset:i,showValue:a=!1,readValue:o,restoreValue:s,formatValue:c,canUndo:l,isRestorable:u}={}){let d=Number(e.value),f=o?o():d,p=null,m=null,h=`twist.range-before.${e.id}`;try{let e=JSON.parse(localStorage.getItem(h));typeof e==`number`&&Number.isFinite(e)&&(p=e)}catch{}let g=document.createElement(`div`);g.className=`range-adjuster`,e.replaceWith(g);let _=(e,t,n)=>{let r=document.createElement(`button`);return r.type=`button`,r.textContent=e,r.setAttribute(`aria-label`,t),r.addEventListener(`click`,n),r},v=t=>{s?(t!==f&&(p=f),s(t),D(),O()):(e.value=String(t),e.dispatchEvent(new Event(`input`,{bubbles:!0})),e.dispatchEvent(new Event(`change`,{bubbles:!0})))},y=_(`−`,`${t}を1段階下げる`,()=>v(d-Number(e.step||1))),b=_(`＋`,`${t}を1段階上げる`,()=>v(d+Number(e.step||1)));g.append(y,e,b);let x=document.createElement(`div`);x.className=`range-drag-surface`,x.setAttribute(`aria-hidden`,`true`),g.append(x);let S=document.createElement(`div`);S.className=`range-history`;let C=document.createElement(`span`);C.dataset.rangeBefore=e.id;let w=document.createElement(`output`);w.htmlFor=e.id,w.hidden=!a;let T=_(`変更前へ`,`${t}を変更前の値へ戻す`,()=>v(p));T.dataset.rangeUndo=e.id;let E=_(`初期値`,`${t}だけ初期値へ戻す`,()=>{i?(p=f,i(),D(),O()):v(r)});E.dataset.rangeReset=e.id,S.append(w,C,T,E),g.after(S);function D(){try{localStorage.setItem(h,JSON.stringify(p))}catch{}}function O(){d=Number(e.value),f=o?o():d,w.textContent=`${Number(d.toFixed(2))}${n}`,C.textContent=p===null?`変更前：—`:`変更前：${c?c(p):Number(p.toFixed(2))+n}`,y.disabled=e.disabled||d<=Number(e.min),b.disabled=e.disabled||d>=Number(e.max);let t=p!==null&&(u?u(p):p>=Number(e.min)&&p<=Number(e.max));T.disabled=!(l?l():!e.disabled)||!t,E.disabled=e.disabled||f===r}e.addEventListener(`input`,()=>{let t=Number(e.value);t!==d&&(p=m?.logical??f),d=t,m||D(),O()}),x.addEventListener(`click`,e=>e.preventDefault()),x.addEventListener(`pointerdown`,t=>{e.disabled||t.button!==0||(t.preventDefault(),e.focus({preventScroll:!0}),x.setPointerCapture(t.pointerId),m={pointer:t.pointerId,x:t.clientX,y:t.clientY,value:d,logical:f,started:!1})}),x.addEventListener(`pointermove`,t=>{if(!m||m.pointer!==t.pointerId)return;let n=t.clientX-m.x,r=t.clientY-m.y;if(!m.started){if(Math.abs(n)<5||Math.abs(r)>Math.abs(n))return;m.started=!0}let i=Number(e.max)-Number(e.min),a=Math.max(20,e.getBoundingClientRect().width-20),o=Number(e.step||1);e.value=String(Math.round((m.value+n/a*i)/o)*o),e.dispatchEvent(new Event(`input`,{bubbles:!0}))});let k=t=>{m?.pointer===t.pointerId&&(m=null,D(),e.dispatchEvent(new Event(`change`,{bubbles:!0})))};return x.addEventListener(`pointerup`,k),x.addEventListener(`pointercancel`,k),x.addEventListener(`lostpointercapture`,k),e.addEventListener(`change`,D),O(),{sync:O,remember(){p=f,D(),O()}}}var qm=Object.freeze({deadzone:`上げると小さな手ぶれを無視。下げると小さな傾きにも反応します。`,maxTilt:`上げると大きく傾けて操縦。下げると少しの傾きで最大になります。`,maxPitch:`上げると機首の動く幅が広がります。急な機首上げは速度を失いやすくなります。`,timeConstant:`上げるとなめらかにゆっくり追従。下げると素早く反応します。角度方式で使用します。`,steerTiltDeadzone:`上げると中立でまっすぐ飛びやすくなります。下げると小さなひねりにも反応します。`,maxSteerTilt:`上げると穏やかな旋回入力。下げると小さなひねりで翼が最大まで傾きます。`,steerTwistDeadzone:`回す方式の中立範囲です。上げると小さな回しを無視し、下げると敏感になります。`,maxSteerTwist:`回す方式で使用。上げると大きく回して操縦、下げると少しの回しで最大になります。`,steerCurve:`上げると中立近くを細かく操縦できます。1なら入力に比例して効きます。`,maxBank:`上げると翼が大きく傾き、鋭く旋回できます。下げると穏やかに曲がります。`,turnGravity:`大きいほど同じ翼の傾きで鋭く曲がります。初期値9.8。揚力や落下に使う重力3は変えません。`,displayTimeConstant:`固定表示の景色だけを調整。上げるとなめらかで遅め、下げるとすぐ追いつきます。`,chaseTimeConstant:`追尾3Dだけに使用。上げると斜めから機体を見やすく、0なら真後ろへすぐ追従します。`,ladderRange:`上げると角度線を多く表示。下げると機首の近くの線だけになり、すっきりします。`,cockpitFov:`自動を外して狭めると、機首の上下が大きく見えます。広げると見える範囲が増えます。`,radarRange:`上げると遠くまで表示。下げると近くの位置を細かく読めます。`,targetHeightGuide:`目標の高さと、取れる高さの帯を表示します。高さに加えて左右の進路も合わせます。`,flightDirector:`進行方向の印を輪へ近づけて操縦します。輪は一度に左右15度・上下10度までを目安に導きます。自動操縦ではありません。`,targetHeadingCue:`方位の目盛りに次の目標を示します。目盛りの外は矢印と角度で知らせます。`,edgeGuidance:`画面の外の目標を、大きな矢印と距離で画面の縁に示します。`,nextTargetNotice:`光を取った直後、次の目標の方向と高さを1.8秒表示します。`,audioGuidance:`目標の左右から短い音を鳴らします。正面に近いほど間隔が短くなります。警告・昇降音・取得音を優先します。イヤホン向けです。`,hudLanguage:`飛行中の表示だけを切り替えます。開始・一時停止・調整・説明・結果は日本語のままです。`}),Jm=Object.freeze({sound:`すべての音のオン・オフです。開始前には音は出ません。`,volume:`全体の音量です。上げると効果音とBGMの両方が大きくなります。`,sfx:`エンジン・風・警告・取得・出口開放などの音を切り替えます。`,vario:`上昇は高く短い音、速い下降は低く長い音で知らせます。警告と取得音を優先します。`,bgm:`飛行中の曲のオン・オフです。ゴールの合図は効果音の設定に従います。`,bgmVolume:`BGMだけの音量です。警告が聞きづらいときは下げます。`,musicSet:`曲を選びます。全曲では飛び直すごとに順番が進み、一時停止では同じ曲に戻ります。`,vibration:`ゲームの振動を切り替えます。対応する端末・ブラウザーで使えます。`,vibrationScale:`振動する時間の倍率です。モーターの強度を直接変える設定ではありません。`,engineVibration:`通常飛行の震えだけを切り替えます。失速・取得・接地の振動は残ります。`,flightVibration:`細かな震えと従来の間隔を比較します。区別しづらいときは従来へ戻せます。`}),Ym=Object.freeze([{label:`機首が敏感すぎる → 最大になる傾きを上げる`,key:`maxTilt`,flight:!0},{label:`大きく傾けないと機首が動かない → 最大になる傾きを下げる`,key:`maxTilt`,flight:!0},{label:`機首の反応が遅い → 追いつく時間を下げる`,key:`timeConstant`,angle:!0},{label:`機首が小刻みに動く → 追いつく時間を上げる`,key:`timeConstant`,angle:!0},{label:`上昇が難しい → 機首の最大角度を確認（出力も必要）`,key:`maxPitch`,angle:!0},{label:`失速しやすい → 機首の最大角度を下げる`,key:`maxPitch`,angle:!0},{label:`中立でも機首が動く → 中立範囲を上げる`,key:`deadzone`,flight:!0},{label:`旋回が敏感 → 最大になるひねり/回しを上げる`,key:`steerMaximum`,flight:!0},{label:`大きく傾けないと曲がらない → 最大になる入力を下げる`,key:`steerMaximum`,flight:!0},{label:`中立近くの旋回が難しい → カーブを上げる`,key:`steerCurve`,flight:!0},{label:`曲がりが急すぎる → 翼の最大角度を下げる`,key:`maxBank`,flight:!0},{label:`最大でも旋回が穏やか → 翼の最大角度を確認（上限40°）`,key:`maxBank`,flight:!0},{label:`固定表示の景色がガタガタ → ならしを上げる`,key:`displayTimeConstant`,fixed:!0},{label:`固定表示の景色が遅れる → ならしを下げる`,key:`displayTimeConstant`,fixed:!0},{label:`操縦席で機首の上下が読みにくい → 視野を狭める`,key:`cockpitFov`,cockpit:!0},{label:`角度線が多すぎる → 線の範囲を下げる`,key:`ladderRange`,cockpit:!0},{label:`近くの目標を細かく見たい → レーダーの半径を下げる`,key:`radarRange`,assisted:!0},{label:`遠い目標がレーダーの縁に集まる → 半径を上げる`,key:`radarRange`,assisted:!0},{label:`目標の高さを合わせたい → 高度の目印をオン`,key:`targetHeightGuide`,assisted:!0}]),Y=e=>document.getElementById(e),Xm=e=>Object.entries(Yf).map(([t,n])=>`${n.label} ${n.options?n.options[e.settings[t]]:typeof n.initial==`boolean`?e.settings[t]?`オン`:`オフ`:n.auto&&e.settings[t]===0?`自動`:e.settings[t]+n.unit}${e.inactiveSettings.includes(t)?`（未使用）`:``}`).join(` / `);function Zm(e){let t;try{t=window.localStorage}catch{}let n=$f(t),r=null,i={},a=null,o=document.createElement(`input`);o.type=`checkbox`,o.id=`cockpit-fov-auto`;for(let[t,r]of Object.entries(Yf)){let a=document.createElement(`label`);a.htmlFor=`setting-${t}`,a.dataset.settingKey=t;let s=document.createElement(`span`);s.textContent=r.label;let c=document.createElement(`output`);c.id=`setting-value-${t}`,c.htmlFor=a.htmlFor;let l=document.createElement(r.options?`select`:`input`);if(r.options){l.id=a.htmlFor;for(let[e,t]of Object.entries(r.options)){let n=document.createElement(`option`);n.value=e,n.textContent=t,l.append(n)}}else typeof r.initial==`boolean`?Object.assign(l,{type:`checkbox`,id:a.htmlFor}):Object.assign(l,{type:`range`,id:a.htmlFor,min:r.min,max:r.max,step:r.step});if(a.append(s,c,l),Y(`flight-settings-fields`).append(a),l.value=n[t],l.type===`range`&&(i[t]=Km(l,{name:r.label,unit:r.unit,initial:r.initial,...t===`cockpitFov`?{readValue:()=>n.cockpitFov,restoreValue:e=>{n={...n,cockpitFov:e},u()},formatValue:e=>e===0?`自動`:`${e}°`,canUndo:()=>e().mode===`flight`&&e().camera===`cockpit`,isRestorable:e=>e===0||e>=r.min&&e<=r.max}:{},onReset:()=>{n=Qf(n,t),u()}})),t===`cockpitFov`){let e=document.createElement(`label`);e.className=`cockpit-fov-auto`,e.dataset.settingKey=t,e.append(o,document.createTextNode(`視野を自動計算する`)),Y(`flight-settings-fields`).append(e)}l.addEventListener(`input`,()=>{n=Zf({...n,[t]:r.options?l.value:l.type===`checkbox`?l.checked:Number(l.value)}),u()});let d=document.createElement(`small`);d.textContent=qm[t],d.className=`setting-explanation`,d.id=`setting-help-${t}`,l.setAttribute(`aria-describedby`,d.id);let f=document.createElement(`small`);if(f.className=`setting-initial`,f.id=`setting-initial-${t}`,a.append(d,f),l.type===`checkbox`||r.options){let e=document.createElement(`button`);e.type=`button`,e.className=`setting-checkbox-reset`,e.textContent=`この項目だけ初期値へ`,e.dataset.checkboxReset=t,e.addEventListener(`click`,()=>{n=Qf(n,t),u()}),a.append(e)}}function s(){let t=e(),r=zp(innerWidth,innerHeight,t.view).vertical,a=Y(`setting-cockpitFov`);a.max=String(Math.floor(r*10)/10),a.value=String(n.cockpitFov===0?r:Math.min(r,n.cockpitFov)),o.checked=n.cockpitFov===0;let s=t.mode!==`flight`||t.camera!==`cockpit`;o.disabled=s,a.disabled=s||o.checked,Y(`setting-ladderRange`).disabled=s,Y(`setting-targetHeightGuide`).disabled=t.view!==`assisted`,Y(`setting-value-cockpitFov`).textContent=o.checked?`自動（${r.toFixed(1)}°）`:`${Math.min(r,n.cockpitFov).toFixed(1)}°`;for(let e of Object.values(i))e.sync()}o.addEventListener(`change`,()=>{i.cockpitFov.remember(),n={...n,cockpitFov:o.checked?0:Math.floor(zp(innerWidth,innerHeight,e().view).vertical*10)/10},u()});function c(){for(let[e,t]of Object.entries(Yf)){typeof t.initial==`boolean`?Y(`setting-${e}`).checked=n[e]:Y(`setting-${e}`).value=n[e],Y(`setting-value-${e}`).textContent=typeof t.initial==`boolean`||t.options?``:`${n[e]}${t.unit}`;let r=n[e]!==t.initial,i=Y(`setting-initial-${e}`);i.hidden=!r,i.textContent=`● 初期値 ${Hm(t)}`,Y(`setting-${e}`).closest(`label`).dataset.changed=String(r);let a=document.querySelector(`[data-checkbox-reset="${e}"]`);a&&(a.hidden=!r)}s()}function l(){let t=e(),n=Y(`settings-troubles-list`);n.replaceChildren();for(let e of Ym){if((e.flight||e.angle||e.fixed||e.cockpit)&&t.mode!==`flight`||e.angle&&t.pitch!==`angle`||e.fixed&&t.display!==`fixed`||e.cockpit&&t.camera!==`cockpit`||e.assisted&&t.view!==`assisted`)continue;let r=e.key===`steerMaximum`?t.steer===`twist`?`maxSteerTwist`:`maxSteerTilt`:e.key,i=document.createElement(`button`);i.type=`button`,i.textContent=e.label,i.dataset.jumpSetting=r,i.addEventListener(`click`,()=>{let e=Y(`setting-${r}`),t=e.closest(`label`);for(let e of document.querySelectorAll(`.setting-highlight`))e.classList.remove(`setting-highlight`);t.classList.add(`setting-highlight`),t.scrollIntoView({block:`center`,behavior:`instant`}),r===`cockpitFov`&&e.disabled?o.focus({preventScroll:!0}):e.focus({preventScroll:!0})}),n.append(i)}}function u(){let e=ep(t,n);Y(`settings-status`).textContent=e?`このブラウザーに保存しました。`:`保存できません。この画面を開いている間だけ使えます。`,c()}async function d(e,t){let n=Gm(e),r=Y(`${t}-copy-text`),i=Y(`${t}-copy-status`);try{await navigator.clipboard.writeText(n),i.textContent=`コピーしました。`,r.hidden=!0}catch{r.value=n,r.hidden=!1,r.focus(),r.select(),i.textContent=`自動コピーできません。下の文字列を選択してコピーしてください。`}}return Y(`settings-reset`).addEventListener(`click`,()=>{a={...n},Y(`settings-undo-reset`).hidden=!1,n=e().mode===`explore`?{...n,radarRange:Xf.radarRange,targetHeightGuide:!0,hudLanguage:`en`}:{...Xf},u()}),Y(`settings-undo-reset`).addEventListener(`click`,()=>{a&&(n=a,a=null,u(),Y(`settings-undo-reset`).hidden=!0)}),Y(`settings-copy`).addEventListener(`click`,()=>d(Wm({version:Im,...e(),settings:n,result:r?.result}),`settings`)),Y(`result-copy`).addEventListener(`click`,()=>{r&&d(r,`result`)}),c(),{getSettings:()=>n,refreshLayout:()=>{s(),l()},report:(t,r,i)=>Wm({version:Im,...e(),settings:n,stats:t,lastLeg:i,result:r}),showResult(e){if(r=e,Y(`flight-result`).hidden=!e,Y(`result-copy-text`).hidden=!0,Y(`result-copy-status`).textContent=``,!e)return;let{stats:t}=e,n=e.exitDiscovery;Y(`result-exit-discovery`).textContent=n?.opened?n.firstVisibleSeconds===null?`未表示`:`${n.firstVisibleSeconds.toFixed(1)}秒`:`出口未開放`;let i=e.lastLeg||t;Y(`result-legs`).textContent=`${t.legs||1}回`,Y(`result-last-elapsed`).textContent=`${i.elapsedSeconds.toFixed(1)}秒`,Y(`result-last-contacts`).textContent=`${i.groundContacts}回`,Y(`result-last-recovery`).textContent=`${i.recoverySeconds.toFixed(1)}秒`,Y(`result-elapsed`).textContent=`${t.elapsedSeconds.toFixed(1)}秒`,Y(`result-contacts`).textContent=`${t.groundContacts}回`,Y(`result-recovery`).textContent=`${t.recoverySeconds.toFixed(1)}秒`,Y(`result-outcome`).textContent=e.result===`clear`?`クリア`:`墜落`,Y(`result-modes`).textContent=`pitch=${e.pitch} / steer=${e.steer} / display=${e.display} / camera=${e.camera}`,Y(`result-settings`).textContent=Xm(e),Y(`result-segments`).replaceChildren(...(e.segments??[]).map(e=>{let t=document.createElement(`div`);t.dataset.segmentId=e.id;let n=document.createElement(`dt`);n.textContent=e.label;let r=document.createElement(`dd`);return r.textContent=e.seconds===null?`未完了`:`${e.seconds.toFixed(1)}秒`,t.append(n,r),t})),Y(`result-target-views`).replaceChildren(...(e.targetViews??[]).map((t,n)=>{let r=document.createElement(`div`);r.dataset.targetViewId=t.id;let i=document.createElement(`dt`);i.textContent=e.segments?.find(e=>e.id===t.id)?.label??`区間${n+1}`;let a=document.createElement(`dd`);return a.textContent=t.firstVisibleSeconds===null?`未表示`:`${t.firstVisibleSeconds.toFixed(1)}秒`,r.append(i,a),r}))},setPhase(t,n){Y(`flight-adjustments`).hidden=t!==`paused`;let r=e().steer===`twist`?[`maxSteerTilt`,`steerTiltDeadzone`]:[`maxSteerTwist`,`steerTwistDeadzone`];for(let e of Y(`flight-settings-fields`).children)e.hidden=n!==`flight`&&![`radarRange`,`targetHeightGuide`,`hudLanguage`].includes(e.dataset.settingKey)||r.includes(e.dataset.settingKey);Y(`setting-chaseTimeConstant`).disabled=n!==`flight`||e().camera!==`chase`,s(),l(),Y(`flight-settings-help`).hidden=n!==`flight`,Y(`settings-reset`).textContent=n===`flight`?`操縦をすべて初期値へ`:`目印をすべて初期値へ`,Y(`adjustment-scope-note`).textContent=n===`flight`?`機首と旋回の入力角度を別々に調整します。選んだ旋回方式の項目だけ表示します。`:`レーダーの表示範囲と目標高度の目印を調整します。探索の操縦には影響しません。`,t!==`paused`&&(Y(`flight-adjustments`).open=!1),(t===`running`||n!==`flight`)&&this.showResult(null)}}}var Qm=(e,t,n)=>Math.min(n,Math.max(t,e));function $m(e=0,t=10){let n=Math.asin(Math.sin((Number.isFinite(e)?e:0)*Math.PI/180))*180/Math.PI,r=Number.isFinite(t)?Qm(t,5,30):10;return Array.from({length:35},(e,t)=>t*5-85).filter(e=>e!==0&&Math.abs(e-n)<=r+1e-8)}function eh(e=0){let t=Number.isFinite(e)?e:0;return{speed:t,direction:Math.abs(t)<.15?`level`:t>0?`up`:`down`,length:Math.abs(t)<.15?0:Qm(Math.abs(t)/5*46,6,46)}}function th(e=0,t=!0){if(!t||!Number.isFinite(e))return{active:!1,hz:0,periodMs:1e3,onMs:0};if(e>=.3){let t=Qm(e,.3,8),n=Qm(720-t*75,150,700);return{active:!0,hz:480+t*95,periodMs:n,onMs:Math.min(110,n*.4)}}return e<=-2?{active:!0,hz:Qm(170+(e+2)*8,90,170),periodMs:1500,onMs:1150}:{active:!1,hz:0,periodMs:1e3,onMs:0}}var nh=e=>Number.isFinite(e)?e:0,rh=e=>new K(nh(e?.x),nh(e?.y),nh(e?.z)),ih=e=>new G(nh(e?.x),nh(e?.y),nh(e?.z),Number.isFinite(e?.w)?e.w:1).normalize();function ah(e={}){return{speed:nh(e.speed),altitude:nh(e.groundClearance),heading:(U.radToDeg(nh(e.heading))%360+360)%360,pitch:U.radToDeg(nh(e.controlPitch)),verticalSpeed:nh(e.verticalSpeed),power:Math.round(nh(e.throttle)*100)}}function oh(e,t,n,{ladderRange:r=10}={}){let i=ih(e.cameraQuaternion).invert().multiply(ih(e.worldQuaternion)),a=n/(2*Math.tan(U.degToRad(e.fieldOfView.vertical)/2));function o(e){let r=rh(e).applyQuaternion(i);return{x:t/2+a*r.x/-r.z,y:n/2-a*r.y/-r.z,inFront:r.z<-1e-6,local:r}}let s=new K(0,1,0).applyQuaternion(i),c={a:s.x,b:-s.y,c:-a*s.z},l=o(new K(0,0,-1).applyQuaternion(ih(e.orientation))),u=rh(e.velocity),d=u.length()>.05?o(u):null,f=[];for(let t of $m(U.radToDeg(nh(e.controlPitch)),r)){let n=U.degToRad(t);for(let r of[-1,1]){let i=[];for(let t=0;t<=10;t++){let a=nh(e.heading)+r*U.degToRad(2+t*.5),s=o({x:Math.sin(a)*Math.cos(n),y:Math.sin(n),z:-Math.cos(a)*Math.cos(n)});s.inFront&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&i.push(s)}i.length===11&&f.push({degrees:t,side:r,points:i})}}return{f:a,q:i,horizon:c,nose:l,flightPath:d,lines:f}}function sh({a:e,b:t,c:n},r,i){let a=[],o=(e,t)=>{Number.isFinite(e)&&Number.isFinite(t)&&e>=-.01&&e<=r+.01&&t>=-.01&&t<=i+.01&&!a.some(n=>Math.hypot(n.x-e,n.y-t)<.01)&&a.push({x:e,y:t})};if(Math.abs(t)>1e-9)for(let a of[0,r])o(a,i/2-(e*(a-r/2)+n)/t);if(Math.abs(e)>1e-9)for(let a of[0,i])o(r/2-(t*(a-i/2)+n)/e,a);return a.slice(0,2)}var ch=e=>e&&[`x`,`y`,`z`].every(t=>Number.isFinite(e[t]));function lh(e={}){let{position:t,targetPosition:n,targetRadius:r,velocity:i}=e;if(!ch(t)||!ch(n)||!Number.isFinite(r)||r<=0||t.y<0||n.y<0)return null;let a=t.y,o=Math.max(0,n.y-r),s=n.y+r,c=n.y-a,l=a>=o&&a<=s,u=l?`level`:a<o?`up`:`down`,d=n.x-t.x,f=n.z-t.z,p=Math.hypot(d,f),m=null,h=null,g=!1;if(ch(i)){let e=p>1e-6?(i.x*d+i.z*f)/p:0;p<=r?m=0:e>.2&&(m=(p-r)/e);let t=u===`up`?o-a:a-s,n=u===`up`?i.y:-i.y;h=l?0:n>0?t/n:null,g=!l&&m!==null&&m<=10&&(h===null||h>m)}let _=Math.max(0,Math.floor(Math.min(a-10,o-2)/5)*5),v=Math.ceil(Math.max(a+10,s+2,_+20)/5)*5,y=e=>95-(e-_)/(v-_)*90;return{target:n.y,radius:r,lower:o,upper:s,altitude:a,delta:c,inside:l,direction:u,urgent:g,arrivalSeconds:m,entrySeconds:h,scale:{min:_,max:v,currentY:y(a),targetY:y(n.y),upperY:y(s),lowerY:y(o)}}}var uh=e=>document.getElementById(e),dh=e=>Number.isInteger(e)?String(e):e.toFixed(1);function fh(e,t=!1){let n=e.scale;return`<svg class="height-band" viewBox="0 0 58 100" preserveAspectRatio="none" aria-hidden="true"><path class="height-axis" d="M44,4V96"/><rect class="height-band-range" x="44" y="${n.upperY}" width="12" height="${n.lowerY-n.upperY}"/><path class="height-target" d="M42,${n.targetY}H58"/><path class="height-current" d="M35,${n.currentY}L43,${n.currentY-4}V${n.currentY+4}Z"/>${t?``:`<text x="2" y="${Math.min(92,n.upperY+3)}">${dh(e.upper)}</text><text x="2" y="${Math.max(10,n.lowerY+3)}">${dh(e.lower)}</text>`}</svg>`}function ph(e,{phase:t,visibility:n,enabled:r,cockpit:i,language:a=`en`}){let o=r&&n===`assisted`&&t===`running`&&!e.complete?lh(e):null,s=uh(`target-height-inline`),c=uh(`cockpit-target-height`),l=e.mode===`flight`?document.querySelector(`.throttle-heading`):document.querySelector(`.flight-line`);if(s.parentElement!==l&&l.append(s),s.hidden=!o||i,c.hidden=!o||!i,uh(`app`).dataset.targetHeight=JSON.stringify(o),!o)return null;let u=Jd(a)===`ja`,d=Zd(o.delta,a),f=o.inside?Yd(a,`heightOkay`):o.urgent?Yd(a,o.direction===`up`?`climb`:`descend`):d;for(let e of[s,c]){e.dataset.heightState=o.inside?`inside`:o.urgent?`urgent`:`outside`,e.setAttribute(`aria-label`,u?`現在高度 ${o.altitude.toFixed(1)}m、目標高度 ${dh(o.target)}m、取得できる高さの範囲 ${dh(o.lower)}〜${dh(o.upper)}m、差 ${d}。${f}。進路も目標へ合わせてください。`:`ALT ${o.altitude.toFixed(1)}m, TGT ALT ${dh(o.target)}m, ALT BAND ${dh(o.lower)}–${dh(o.upper)}m, ${d}. ${f}.`);let t=o.inside?Yd(a,`heightOkay`):o.urgent?u?`早めに${o.direction===`up`?`▲`:`▼`}`:Yd(a,o.direction===`up`?`climb`:`descend`):``,n=`${e===s?fh(o,!0):``}<span><b><strong class="current-height">${u?`現在`:`ALT `}${o.altitude.toFixed(1)}m</strong>　${Yd(a,`targetAltitude`)} ${dh(o.target)}m</b><small>${d}${t?`　${t}`:``}</small></span>`;e._heightMarkup!==n&&(e.innerHTML=n,e._heightMarkup=n)}return o}var mh=e=>document.getElementById(e),hh=e=>`${e.x.toFixed(2)},${e.y.toFixed(2)}`,gh=e=>e.map((e,t)=>`${t?`L`:`M`}${hh(e)}`).join(` `),_h=e=>e.toFixed(1),vh=(e,t,n,r,i)=>Object.assign(e.style,{left:`${t}px`,top:`${n}px`,width:`${r}px`,height:`${i}px`});function yh(e){let t=mh(`cockpit-hud`);if(t.hidden=!e,!e)return;let n=innerWidth,r=innerHeight,i=Om(),a=mh(`bottom-panel`).getBoundingClientRect(),o=mh(`radar`).getBoundingClientRect(),s=!mh(`radar`).hidden,c=document.querySelector(`.navigation`).getBoundingClientRect().bottom+10,l=Math.max(r/2-65,s?o.bottom+10:0),u=Math.max(60,Math.min(130,a.top-l-12)),d=a.top-30,f=n/2-90;return s&&o.top<c+28&&o.bottom>c&&o.left<f+180&&o.right>f&&(f=o.left<n/2?o.right+10:o.left-190),f=Math.max(i.left+12,Math.min(n-i.right-192,f)),vh(mh(`cockpit-heading`),f,c,180,28),vh(mh(`cockpit-target-height`),f,c+32,180,32),vh(mh(`cockpit-exit-notice`),f,c+68,180,24),vh(mh(`cockpit-speed`),i.left+12,l,58,u),vh(mh(`cockpit-altitude`),n-i.right-92,l,58,u),vh(mh(`cockpit-vario`),n-i.right-28,l,16,u),vh(mh(`cockpit-power`),n/2-104,d,208,24),{w:n,h:r,compassY:c,powerY:d,insets:i}}function bh(e,t,n=yh(t),r={},i=null){if(!t||!n)return;let a=mh(`cockpit-hud`),o=Jd(r.hudLanguage);a.setAttribute(`aria-label`,o===`ja`?`操縦席の飛行表示`:`FLIGHT HUD`);let{w:s,h:c,compassY:l,powerY:u,insets:d}=n,f=ah(e),p=(e,t,n,r,i=``)=>{let a=Math.round(e/t)*t;return`<span>${n} ${r}</span><small>${Math.max(0,a+t)}</small><strong>${_h(e)}</strong><small>${Math.max(0,a-t)}</small>${i}`};mh(`cockpit-speed`).innerHTML=p(f.speed,2,Yd(o,`speed`),`m/s`),mh(`cockpit-altitude`).innerHTML=i?`<span>${Yd(o,`altitude`)} m</span><div class="height-tape-scale">${fh(i)}<strong style="top:${Math.max(16,Math.min(84,i.scale.currentY))}%">${_h(f.altitude)}</strong></div>`:p(f.altitude,5,Yd(o,`altitude`),`m`),mh(`cockpit-altitude`).dataset.heightState=i?.inside?`inside`:i?.urgent?`urgent`:`outside`;let m=eh(f.verticalSpeed),h=50+(m.direction===`up`?-m.length:m.length),g=m.length?`<path class="vario-bar" d="M8,50V${h}"/><path d="M3,${h+(m.direction===`up`?6:-6)}L8,${h}L13,${h+(m.direction===`up`?6:-6)}"/>`:``;mh(`cockpit-vario`).innerHTML=`<svg viewBox="0 0 16 100" preserveAspectRatio="none" aria-hidden="true"${o===`ja`?``:` style="height:calc(100% - 34px)"`}><path class="vario-axis" d="M8,3V97M1,50H15"/>${g}</svg><span>${m.speed>=0?`+`:``}${_h(m.speed)}</span><small>${o===`ja`?`m/s`:`V/S<br>m/s`}</small>`,mh(`cockpit-vario`).dataset.direction=m.direction,mh(`cockpit-vario`).dataset.length=String(m.length),mh(`cockpit-vario`).setAttribute(`aria-label`,o===`ja`?`昇降速度 ${m.direction===`up`?`上昇`:m.direction===`down`?`下降`:`水平`} ${_h(Math.abs(m.speed))}m/s`:`V/S ${m.speed>=0?`+`:`−`}${_h(Math.abs(m.speed))}m/s`);let _=Math.round(f.heading);mh(`cockpit-heading`).innerHTML=o===`ja`?`<span>${(_+350)%360} ┃ ${(_+355)%360} ┃ <strong>${_%360}°</strong> ┃ ${(_+5)%360} ┃ ${(_+10)%360}</span>`:`<span>HDG ${(_+350)%360}│${(_+355)%360}│<strong>${_%360}°</strong>│${(_+5)%360}│${(_+10)%360}</span>`;let v=ef(e,Fm(e),o);mh(`cockpit-power`).innerHTML=`<span>${v}</span>`;let y=oh(e,s,c,r),b=sh(y.horizon,s,c),x=d.left+82,S=s-d.right-102,C=l+(mh(`cockpit-exit-notice`).hidden?mh(`cockpit-target-height`).hidden?38:70:98),w=Math.max(C+20,u-8),T=`M${x},${C}H${S}V${w}H${x}Z`;for(let e of[mh(`target-edge-marker`),mh(`cockpit-objective-label`),mh(`practice-panel`)].filter(e=>!e.hidden&&e.getClientRects().length)){let t=e.getBoundingClientRect(),n=Math.max(x,t.left-4),r=Math.min(S,t.right+4),i=Math.max(C,t.top-4),a=Math.min(w,t.bottom+4);n<r&&i<a&&(T+=`M${n},${i}H${r}V${a}H${n}Z`)}let E=y.lines.map(e=>{let t=e.points[0],n=e.points.at(-1),r=Math.atan2(n.y-t.y,n.x-t.x)*180/Math.PI;return r>90&&(r-=180),r<-90&&(r+=180),`<g class="cockpit-ladder${e.degrees<0?` cockpit-ladder-below`:``}" data-pitch-level="${e.degrees}"><path d="${gh(e.points)}" ${e.degrees<0?`stroke-dasharray="4 5"`:``}/><text x="${n.x}" y="${n.y-4}" transform="rotate(${r} ${n.x} ${n.y})">${e.degrees}</text></g>`}).join(``),D=y.nose,O=``;if(y.flightPath){let e=y.flightPath,t=e.x,n=e.y,r=e.inFront&&t>=x+22&&t<=S-22&&n>=C+22&&n<=w-22;if(!r){let r=Math.hypot(e.local.x,e.local.y)<1e-6?1:e.local.x,i=-e.local.y,a=Math.hypot(r,i)||1,o=Math.max(10,Math.min((S-x)/2-24,(w-C)/2-24));t=(x+S)/2+r/a*o,n=(C+w)/2+i/a*o}let i=Math.atan2(y.horizon.a,-y.horizon.b)*180/Math.PI;O=`<g class="flight-path${Math.hypot(e.x-D.x,e.y-D.y)>24?` flight-path-separated`:``}" data-flight-path="${r?`visible`:`edge`}" transform="translate(${t} ${n}) rotate(${i})"><circle r="10"/><path d="M-21,0H-10M10,0H21M0,-10V-19"/>${r?``:`<text x="14" y="-14">${Yd(o,`flightPath`)}</text>`}</g>`}mh(`cockpit-conformal`).setAttribute(`viewBox`,`0 0 ${s} ${c}`),mh(`cockpit-conformal`).innerHTML=`<defs><clipPath id="cockpit-clip"><path d="${T}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#cockpit-clip)">${b.length===2?`<path id="cockpit-horizon" d="${gh(b)}"/>`:``}${E}<g data-boresight transform="translate(${D.x} ${D.y})"><path d="M-17,0H-6L0,5L6,0H17M0,-6V-2"/></g>${O}</g>`,a.dataset.readings=JSON.stringify(f),a.dataset.horizon=JSON.stringify(y.horizon)}var xh=e=>Number.isInteger(e)&&e>=3&&e<=8,Sh=e=>Array.from({length:e+1},(t,n)=>({id:n===0?`start-light1`:n===e?`light${e}-exit`:`light${n}-light${n+1}`,label:n===0?`開始→光1`:n===e?`光${e}→出口`:`光${n}→光${n+1}`}));Object.freeze(Sh(3));function Ch(e=3){let t=xh(e)?e:3,n=Sh(t),r=0,i=Array(t+1).fill(null),a=!1,o=0,s=null,c=0,l=0,u=Array(t+1).fill(null),d=!1;return{reset(e=t){xh(e)&&(t=e),n=Sh(t),r=0,i=Array(t+1).fill(null),a=!1,o=0,s=null,c=0,l=0,u=Array(t+1).fill(null),d=!1},advance(e,n={}){if(!Number.isFinite(e)||e<0||i[t]!==null||(typeof n==`object`&&n||(n={}),n.total!==void 0&&n.total!==t))return;let f=Number.isInteger(n.collected)&&n.collected>=0&&n.collected<=t,p=f?n.collected:0;if(!d){let r=f&&p===c;if(f&&p>c?(c=p,l=0):l+=e,f&&p>=c){let e=p===t&&n.complete===!0;(!e||r)&&u[c]===null&&n.targetVisible===!0&&(u[c]=l),e&&(d=!0)}}if(a&&s===null&&(o+=e),p===t&&(a=!0),a&&s===null&&n.exitVisible===!0&&(s=o),e!==0){r+=e;for(let e=0;e<p;e++)i[e]===null&&(i[e]=r);n.complete&&p===t&&(i[t]=r)}},snapshot:()=>n.map((e,t)=>({...e,seconds:i[t]===null?null:i[t]-(t?i[t-1]:0)})),exitSnapshot:()=>({opened:a,firstVisibleSeconds:s}),targetViewsSnapshot:()=>n.map(({id:e},t)=>({id:e,firstVisibleSeconds:u[t]}))}}function wh(e){let{target:t,verticalFov:n,width:r,height:i,bounds:a,near:o=.1,far:s=250}=e??{};if(!t||![t.x,t.y,t.z].every(Number.isFinite)||!Number.isFinite(r)||r<=0||!Number.isFinite(i)||i<=0||!Number.isFinite(n)||n<=0||n>=180||!a||![a.left,a.right,a.top,a.bottom].every(Number.isFinite)||a.left>=a.right||a.top>=a.bottom||!Number.isFinite(o)||o<=0||!Number.isFinite(s)||s<=o)return!1;let c=-t.z;if(c<o||c>s)return!1;let l=i/2/Math.tan(n*Math.PI/360);if(!Number.isFinite(l))return!1;let u=r/2+t.x/c*l,d=i/2-t.y/c*l;return Number.isFinite(u)&&Number.isFinite(d)&&u>=0&&u<=r&&d>=0&&d<=i&&u>=a.left&&u<=a.right&&d>=a.top&&d<=a.bottom}var Th=(e,t,n=4)=>e.left<t.right+n&&e.right>t.left-n&&e.top<t.bottom+n&&e.bottom>t.top-n,Eh=(e,t,n,r)=>({left:e-n/2,right:e+n/2,top:t-r/2,bottom:t+r/2}),Dh=e=>e&&[`left`,`right`,`top`,`bottom`].every(t=>Number.isFinite(e[t]))&&e.left<e.right&&e.top<e.bottom;function Oh({target:e,width:t,height:n,verticalFov:r,bounds:i,obstacles:a=[]}={}){if(!Dh(i))return null;let o=Hp({target:e,width:t,height:n,verticalFov:r,bounds:i}),s=o.inView&&a.some(e=>Th(Eh(o.x,o.y,32,32),e));if(o.inView&&!s)return{...o,kind:`point`};if(!o.visible&&!s)return null;let c=[o];if(s)for(let e of a)c.push({x:e.left-22,y:o.y},{x:e.right+22,y:o.y},{x:o.x,y:e.top-22},{x:o.x,y:e.bottom+22});for(let e=i.left;e<=i.right;e+=20)c.push({x:e,y:i.top},{x:e,y:i.bottom});for(let e=i.top;e<=i.bottom;e+=20)c.push({x:i.left,y:e},{x:i.right,y:e});c.push({x:i.right,y:i.bottom},{x:i.right,y:i.top}),c.sort((e,t)=>Math.hypot(e.x-o.x,e.y-o.y)-Math.hypot(t.x-o.x,t.y-o.y));let l=c.find(e=>e.x>=i.left&&e.x<=i.right&&e.y>=i.top&&e.y<=i.bottom&&!a.some(t=>Th(Eh(e.x,e.y,32,32),t)));if(!l)return null;let u=s?(Math.atan2(o.x-l.x,-(o.y-l.y))*180/Math.PI+360)%360:o.rotation;return{...o,visible:!0,x:l.x,y:l.y,rotation:u,kind:`edge`,occluded:s}}function kh(e,{bounds:t,obstacles:n=[],width:r=116,height:i=34}={}){if(!e||!Dh(t))return null;let a=[{x:e.x+22,y:e.y-i/2},{x:e.x-22-r,y:e.y-i/2},{x:e.x-r/2,y:e.y-22-i},{x:e.x-r/2,y:e.y+22}],o=Eh(e.x,e.y,34,34),s=e=>e.x>=t.left&&e.x+r<=t.right&&e.y>=t.top&&e.y+i<=t.bottom&&![o,...n].some(t=>Th({left:e.x,right:e.x+r,top:e.y,bottom:e.y+i},t)),c=a.find(s);if(c)return c;for(let e=t.top;e+i<=t.bottom;e+=24)for(let n=t.left;n+r<=t.right;n+=24)if(s({x:n,y:e}))return{x:n,y:e};return null}var Ah=e=>document.getElementById(e),jh=null,Mh=``;function Nh(e){if(jh=null,!e)return;let{w:t,h:n,compassY:r,powerY:i,insets:a}=e,o=r+(Ah(`cockpit-exit-notice`).hidden?70:98),s={left:a.left+82,right:t-a.right-102,top:o,bottom:i-8};jh={w:t,h:n,area:s,bounds:{left:s.left+17,right:s.right-17,top:s.top+17,bottom:s.bottom-17},obstacles:[`radar`,`cockpit-speed`,`cockpit-altitude`,`cockpit-vario`,`cockpit-heading`,`cockpit-target-height`,`cockpit-exit-notice`,`practice-panel`].map(Ah).filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect())}}function Ph(e,t,{language:n=`en`}={}){let r=Ah(`cockpit-objective`),i=Ah(`cockpit-objective-label`);if(!t||!jh||e.visibility!==`assisted`||e.complete){r.setAttribute(`hidden`,``),i.hidden=!0;return}let{w:a,h:o,area:s,bounds:c,obstacles:l}=jh,u=Oh({target:e.targetLocal,width:a,height:o,verticalFov:e.fieldOfView.vertical,bounds:c,obstacles:l});if(!u){r.setAttribute(`hidden`,``),i.hidden=!0;return}let d=e.collected===e.total;r.removeAttribute(`hidden`),r.setAttribute(`viewBox`,`0 0 ${a} ${o}`),r.dataset.kind=u.kind,r.dataset.target=d?`exit`:`light`,r.dataset.x=String(u.x),r.dataset.y=String(u.y),r.dataset.behind=String(u.behind),r.dataset.occluded=String(!!u.occluded);let f=u.kind===`edge`?`<path d="M0,-14L10,8 0,3 -10,8Z"/>`:d?`<path d="M-14,-6V-14H-6M6,-14H14V-6M14,6V14H6M-6,14H-14V6M-7,9V-8H7V9"/>`:`<path d="M0,-14L14,0 0,14 -14,0Z"/><path class="objective-center" d="M-3,0H3M0,-3V3"/>`;Mh!==f&&(r.innerHTML=`<g>${f}</g>`,Mh=f),r.firstElementChild.setAttribute(`transform`,`translate(${u.x} ${u.y}) rotate(${u.kind===`edge`?Jd(n)===`en`&&u.behind?Math.atan2(e.targetLocal.x,-e.targetLocal.z)*180/Math.PI:u.rotation:0})`);let p=Zd(e.targetPosition.y-e.position.y,n),m=Jd(n)===`ja`?u.behind?`・後ろ`:u.occluded?`・表示の奥`:u.kind===`edge`?`・表示域外`:``:``,h=`${Xd(e,n)}${m}`,g=`${Math.round(e.distance)}m　${p}`,_=`${h} ${g}`;r.setAttribute(`aria-label`,_);let v=kh(u,{bounds:s,obstacles:l});i.hidden=!v,v&&(i.dataset.target=d?`exit`:`light`,i.querySelector(`strong`).textContent=h,i.querySelector(`span`).textContent=g,i.style.transform=`translate(${v.x}px,${v.y}px)`)}var Fh=`twist.feedback-settings.v1`,Ih=Object.freeze({sound:{label:`音`,initial:!0},volume:{label:`全体の音量`,initial:25,min:0,max:100,step:1,unit:`%`},sfx:{label:`効果音`,initial:!0},vario:{label:`上昇・下降の音（バリオ）`,initial:!0},bgm:{label:`BGM`,initial:!0},bgmVolume:{label:`BGMの音量`,initial:50,min:0,max:100,step:1,unit:`%`},musicSet:{label:`飛行中の曲`,initial:`current`,options:{current:`これまでの2曲`,brave:`勇進の航路`,rock:`ロック：黒曜の翼`,all:`4曲を順番に`}},vibration:{label:`振動`,initial:!0,group:`vibration`},vibrationScale:{label:`振動の強さ（振動する時間の倍率）`,initial:1,min:0,max:2,step:.1,unit:`倍`,group:`vibration`},engineVibration:{label:`通常飛行の震え`,initial:!0,group:`vibration`},flightVibration:{label:`通常飛行の振動間隔`,initial:`fine`,options:{fine:`細かな震え（新）`,classic:`これまでの間隔`},group:`vibration`}});function Lh(e){return Object.fromEntries(Object.entries(Ih).map(([t,n])=>[t,n.options?Object.hasOwn(n.options,e?.[t])?e[t]:n.initial:typeof n.initial==`boolean`?typeof e?.[t]==`boolean`?e[t]:n.initial:Number.isFinite(e?.[t])?Math.max(n.min,Math.min(n.max,e[t])):n.initial]))}function Rh(e){try{return Lh(JSON.parse(e.getItem(Fh)))}catch{return Lh()}}function zh(e,t){try{return e.setItem(Fh,JSON.stringify(Lh(t))),!0}catch{return!1}}var Bh=new URL(`audio-worklet-B3pdtA8d.js`,import.meta.url).href;function Vh(){let e=null,t=null,n=null,r=null,i=`idle`,a=null,o=!1,s=null,c=0,l=0,u=0,d=0,f=!1,p=!1,m=null,h=null,g=[],_=!1,v=null,y=e=>t?.port.postMessage(e);async function b(){let s=window.AudioContext||window.webkitAudioContext;if(!s)i=`unsupported`;else try{e&&e.state!==`closed`||(e=new s),n||=(async()=>{await e.resume(),t||(await e.audioWorklet.addModule(Bh),t=new AudioWorkletNode(e,`twist-audio`,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]}),t.connect(e.destination),t.port.onmessage=({data:e})=>{e.type===`metrics`&&(l=e.load,u=Math.max(u,l),d=e.peak,f=!!e.music,p=o&&!!e.vario),e.navigation&&(h=e.navigation)},r=setInterval(()=>y({type:`poll`}),1e3)),i=`ready`,o?a&&y(a):await e.suspend()})().catch(()=>{i=`unavailable`,clearInterval(r),t?.disconnect(),t=null}).finally(()=>{n=null}),await n}catch{i=`unavailable`}}return{unlock:b,async waitForReady(){return n&&await n,!!t},musicReady:()=>!!t,resume:()=>e?e.resume():Promise.resolve(),suspendIfIdle(){o||e?.suspend().catch(()=>{})},musicClock:{now:()=>e?.currentTime||0,setScheduleTime(e){v=e},write(e,n){t&&(g.push({addr:e,value:n,at:v}),_||(_=!0,queueMicrotask(()=>{_=!1,g.length&&y({type:`musicReg`,writes:g}),g=[]})))}},stopMusic(){g=[],v=null,y({type:`musicStop`})},setMusicGain(e){y({type:`musicGain`,gain:e})},configure(e){y({type:`settings`,settings:e})},start(){o=!0,e&&e.resume().catch(()=>{}),a&&y(a)},update(e,t,n,r=null){a={type:`state`,model:e,settings:t,phase:n,navigation:r},o&&y(a)},event(n,r){if(!t||!r.sound||!r.sfx)return;let i=c;clearTimeout(s),e.resume().then(()=>{i===c&&(m=n,y({type:`event`,kind:n,settings:r}))}).catch(()=>{}),o||(s=setTimeout(()=>{y({type:`stop`}),e.suspend().catch(()=>{})},1400))},stop(){c++,g=[],o=!1,p=!1,a=null,clearTimeout(s),y({type:`stop`}),e?.suspend().catch(()=>{})},snapshot:()=>({status:i,load:l,maxLoad:u,peak:d,musicActive:f,varioActive:p,lastEvent:m,contextState:e?.state||`none`,workletReady:!!t,navigation:{requested:a?.navigation?{...a.navigation}:null,acknowledged:h?{...h}:null}}),resetMetrics(){l=0,u=0,d=0,y({type:`resetMetrics`})},dispose(){clearInterval(r),clearTimeout(s),t?.disconnect(),e?.close()}}}var Hh=(e,t,n)=>Math.max(t,Math.min(n,Number.isFinite(e)?e:t)),Uh=Object.freeze({buffetStart:14,stallStart:20,stallEnd:70,engineCycle:400,enginePulse:5,groundPattern:[85,100,85,430],stallPattern:[100,45,55,90,160,110],fineCycle:60,finePulses:4,strongStallPattern:[180,30,120,40,260,50]}),Wh=Object.freeze({collect:{priority:2,duration:300,pattern:[30,80,70]},exitOpen:{priority:2,duration:650,pattern:[]},clear:{priority:3,duration:1300,pattern:[90,90,160,100,260]},crash:{priority:3,duration:800,pattern:[320]}});function Gh(e,t=1){let n=[];for(let r=0;r<e.length;r+=2){let i=e[r]+(e[r+1]||0),a=Math.round(Hh(e[r]*t,0,i));n.push(a),r+1<e.length&&n.push(i-a)}return n}function Kh(e={},t={}){let n=Hh(Math.abs(e.angleOfAttack||0)*180/Math.PI,0,180),r=Hh(e.throttle,0,1),i=Hh(e.speed,0,18),a=`quiet`,o=[];if(e.mode!==`explore`&&Fm(e).level===`danger`)a=`ground`,o=[...Uh.groundPattern];else if(n>=Uh.stallStart)a=`stall`,o=Gh(Uh.stallPattern,.6+.4*Hh((n-Uh.stallStart)/(Uh.stallEnd-Uh.stallStart),0,1));else if(n>=Uh.buffetStart){a=`buffet`;let e=Math.round(15+(n-Uh.buffetStart)/(Uh.stallStart-Uh.buffetStart)*70);o=[e,300-e]}else if(r>0&&t.engineVibration!==!1){a=`engine`;let e=Math.max(1,Math.round(Uh.enginePulse*r));o=[e,Uh.engineCycle-e]}let s=o;if(a===`engine`&&t.flightVibration!==`classic`){let e=Math.round(8+6*r);s=Array.from({length:Uh.finePulses},()=>[e,Uh.fineCycle-e]).flat()}else a===`stall`&&(s=Gh(Uh.strongStallPattern,.75+.25*Hh((n-20)/50,0,1)));let c=Gh(s,Hh(t.vibrationScale??1,0,2));return{cue:a,pattern:c,soundPattern:o,cycle:s.reduce((e,t)=>e+t,0),angleOfAttack:n,power:r,speed:i,engineHz:55+r*120,wind:Math.min(1,i/18),vario:th(e.verticalSpeed,t.vario!==!1&&e.mode===`flight`)}}function qh(e){let t=!1,n=0,r=``,i=0,a=null,o=0,s=t=>{try{e?.(t)}catch{}};return{arm(){t=!0},update(c,l,u){if(!t||!e)return;if(!l.vibration||l.vibrationScale===0){(r||i)&&this.stop();return}if(u<i)return;if(i&&(clearTimeout(a),i=0,r=``,n=0),!c.pattern.some(e=>e>0)){r&&this.stop();return}let d=r!==c.cue||u>=n;if(d){s(c.pattern);let e=c.cycle===c.soundPattern.reduce((e,t)=>e+t,0);(r!==c.cue||e)&&(o=u),r=c.cue,n=u+c.cycle}return{restarted:d,elapsedMs:u-o}},event(o,c,l){let u=Wh[o];t&&e&&c.vibration&&c.vibrationScale&&u&&(l<i&&Wh[r]?.priority>u.priority||(s(0),s(Gh(u.pattern,c.vibrationScale)),i=l+u.duration,r=o,n=i,clearTimeout(a),a=setTimeout(()=>this.stop(),u.duration)))},stop(){clearTimeout(a),t&&s(0),n=0,r=``,i=0}}}var Jh=(e,t)=>Math.atan2(Math.sin((e-t)*Math.PI/180),Math.cos((e-t)*Math.PI/180))*180/Math.PI;function Yh(){let e=[],t=0,n=0,r=0,i=0,a=0,o=null,s=()=>{if(!e.length)return{pitch:0,steer:0};let t=e.map(t=>Jh(t.pitch,e[0].pitch)),n=e.map(t=>Jh(t.steer,e[0].steer));return{pitch:Math.max(...t)-Math.min(...t),steer:Math.max(...n)-Math.min(...n)}};return{add(c,l,u){if([c,l,u].every(Number.isFinite)){for(e.push({time:c,pitch:l,steer:u});e.length>0&&e[0].time<c-1e3;)e.shift();if(o===null&&(o=c),c-o>=1e3){let e=s();t++,n+=e.pitch,r+=e.steer,i=Math.max(i,e.pitch),a=Math.max(a,e.steer),o=c}}},clearWindow(){e=[],o=null},reset(){e=[],t=0,n=0,r=0,i=0,a=0,o=null},snapshot(){return{window:s(),windows:t,meanPitchRange:t?n/t:0,maxPitchRange:i,meanSteerRange:t?r/t:0,maxSteerRange:a}}}}function Xh(e=``){return typeof e==`string`&&/\biPhone\b/i.test(e)}var Zh=(e=``)=>typeof e==`string`&&/\bAndroid\b/i.test(e),Qh=[`portrait-primary`,`portrait-secondary`,`landscape-primary`,`landscape-secondary`];function $h({standalone:e=!1,displayModes:t=[]}={}){return e||t.some(e=>[`standalone`,`fullscreen`,`minimal-ui`].includes(e))?`installed`:`browser`}function eg({userAgent:e=``,launch:t=`browser`}={}){return Xh(e)&&t===`browser`?`共有メニュー →「ホーム画面に追加」でアプリとして開けます。`:``}function tg({type:e,legacyAngle:t,width:n,height:r}={}){return Qh.includes(e)?e:Number.isFinite(t)?{0:`portrait-primary`,90:`landscape-primary`,180:`portrait-secondary`,270:`landscape-secondary`}[(t%360+360)%360]??(n>r?`landscape`:`portrait`):n>r?`landscape`:`portrait`}function ng(){let e=null,t=!1,n=!1;return{begin(r){e=r,t=!1,n=!1},clear(){e=null,t=!1,n=!1},canResume:n=>!t||n===e,check(r,i){return e?i&&r!==e?(t=!0,n=!1,`changed`):t?r===e?n?null:(n=!0,`returned`):(n=!1,`waiting`):null:null}}}function rg({userAgent:e=``,landscape:t=!1}={}){return Xh(e)?t?{title:`iPhoneの画面の向き`,text:`「画面縦向きのロック」は縦向き用です。横向きで遊ぶときは、開始した向きを保ってください。`}:{title:`iPhoneは縦向きロックがおすすめ`,text:`コントロールセンターで「画面縦向きのロック」をオンにすると、画面の自動回転を防げます。`}:null}var ig=Object.freeze({channelCount:5,waveBankCount:4,channelWaveBank:Object.freeze([0,1,2,3,3]),clock:3579545}),ag=Object.freeze([`square`,`saw`,`triangle`,`sine`,`pulse25`]),og=32,sg=og/2,cg={square:e=>e<sg?127:-128,saw:e=>Math.round(-128+255*e/(og-1)),triangle:e=>Math.round(e<sg?-128+255*e/(sg-1):127-255*(e-sg)/(sg-1)),sine:e=>Math.round(127*Math.sin(2*Math.PI*e/og)),pulse25:e=>e<og/4?127:-128};function lg(e){let t=cg[e];if(!Object.hasOwn(cg,e))throw RangeError(`不明なプリセット波形です：${e}`);let n=new Int8Array(og);for(let e=0;e<og;e++)n[e]=t(e);return n}function ug(e){if(e<5)return{freqLo:128+e*2,freqHi:129+e*2,volume:138+e,key:null};let t=256+(e-5)*4;return{freqLo:t,freqHi:t+1,volume:t+2,key:t+3}}function dg(e,t){return e<4?e*32+t:512+(e-4)*32+t}var fg=class{constructor(e){this.slots=Array(e).fill(null),this.seq=0}noteOn(e,t,{part:n=0,partLimit:r=1/0,canUse:i=()=>!0}={}){let a=this.slots.findIndex(t=>t!==null&&t.note===e&&t.part===n),o=null;if(a===-1){let e=this.slots.filter(e=>e!==null&&e.part===n);if(e.length>=r){let t=e.reduce((e,t)=>t.startedAt<e.startedAt?t:e);a=t.ch,o=t}else if(a=this.slots.findIndex((e,t)=>e===null&&i(t)),a===-1){for(let e=0;e<this.slots.length;e++)i(e)&&(a===-1||this.slots[e].startedAt<this.slots[a].startedAt)&&(a=e);if(a===-1)return null;o=this.slots[a]}}let s={ch:a,note:e,velocity:t,part:n,startedAt:this.seq++};return this.slots[a]=s,{voice:s,stolen:o}}noteOff(e,t=0){let n=this.slots.findIndex(n=>n!==null&&n.note===e&&n.part===t);if(n===-1)return null;let r=this.slots[n];return this.slots[n]=null,r}allOff(e){let t=this.active().filter(t=>e===void 0||t.part===e);for(let e of t)this.slots[e.ch]=null;return t}active(){return this.slots.filter(e=>e!==null)}},pg=1024,mg=1152,hg=e=>Object.freeze({len:.2,vol:15,decay:.2,f0:0,f1:0,sweep:.05,toneLen:0,noise:0,noiseLen:0,...e}),gg=hg({len:.25,decay:.24,f0:170,f1:45,sweep:.045,toneLen:.25,noise:12,noiseLen:.008}),_g=hg({len:.2,decay:.19,f0:240,f1:180,sweep:.03,toneLen:.035,noise:5,noiseLen:.2}),vg=hg({len:.04,vol:13,decay:.04,f0:900,f1:800,toneLen:.04,noise:3,noiseLen:.01}),yg=hg({len:.15,vol:14,decay:.15,noise:3,noiseLen:.15}),bg=hg({len:.05,vol:12,decay:.05,noise:1,noiseLen:.05}),xg=hg({len:.04,vol:10,decay:.04,noise:1,noiseLen:.04}),Sg=hg({len:.35,vol:12,decay:.35,noise:1,noiseLen:.35}),Cg=hg({len:1,vol:14,decay:1,noise:2,noiseLen:1}),wg=hg({len:.5,vol:11,decay:.5,noise:1,noiseLen:.5}),Tg=hg({len:.12,vol:11,decay:.12,noise:1,noiseLen:.12}),Eg=hg({len:.18,vol:13,decay:.2,f0:560,f1:545,toneLen:.18}),Dg=e=>hg({len:.3,decay:.28,f0:e,f1:e*.6,sweep:.12,toneLen:.3,noise:10,noiseLen:.006}),Og=Dg(85),kg=Dg(105),Ag=Dg(125),jg=Dg(150),Mg=Dg(180),Ng=Dg(215);Object.freeze({35:gg,36:gg,37:vg,38:_g,39:yg,40:_g,41:Og,42:bg,43:kg,44:xg,45:Ag,46:Sg,47:jg,48:Mg,49:Cg,50:Ng,51:wg,52:Cg,53:wg,54:Tg,55:Cg,56:Eg,57:Cg,58:Tg,59:wg,60:Ng,61:Mg,62:Mg,63:Mg,64:jg,65:Ng,66:jg,67:Eg,68:Eg,69:Tg,70:Tg,71:Eg,72:Eg,73:Tg,74:Tg,75:vg,76:vg,77:vg,78:Ng,79:Mg,80:Eg,81:wg});var Pg=new Uint8Array(128);for(let[e,t]of[[1,[42,44,46]],[2,[71,72]],[3,[73,74]],[4,[78,79]]])for(let n of t)Pg[n]=e;var Fg=`custom`,Ig=143,Lg=2;function Rg(e,t=ig.clock){let n=440*2**((e-69)/12),r=Math.round(t/(32*n))-1;return Math.min(4095,Math.max(0,r))}function zg(e,t=127){return e<=0||t<=0?0:Math.max(1,Math.round(e/127*(t/127)*15))}var Bg=class{constructor(e,{config:t=ig,onVoices:n=()=>{},drums:r=!1}={}){this.sink=e,this.clock=t.clock,this.channelCount=t.channelCount,this.waveBankCount=t.waveBankCount,this.channelBank=t.channelWaveBank,this.addr=Array.from({length:this.channelCount},(e,t)=>ug(t)),this.onVoices=n,this.drums=r,this.voices=new fg(this.channelCount),this.keyMask=0,this.parts=Array.from({length:8},()=>({waveName:ag[0],cc7:127,bend:0})),this.drumCc7=127,this.customWave=null,this.customVersion=0,this.bankKey=Array(this.waveBankCount).fill(null)}get waveName(){return this.parts[0].waveName}set waveName(e){this.parts[0].waveName=e}init(){this.bankKey.fill(null),this.voices.allOff(),this.#r(),this.keyMask=0,this.sink.write(Ig,0);for(let e=0;e<this.channelCount;e++)this.sink.write(this.addr[e].volume,0),this.addr[e].key!==null&&this.sink.write(this.addr[e].key,0);this.onVoices([])}handle(e){let t=e.channel??0;if(t===9)this.#a(e);else if(!(t>=8))switch(e.type){case`noteOn`:this.noteOn(e.note,e.velocity,t);break;case`noteOff`:this.noteOff(e.note,t);break;case`pitchBend`:this.setPitchBend(e.value,t);break;case`cc`:e.controller===7?this.setChannelVolume(e.value,t):(e.controller===123||e.controller===120)&&this.allNotesOff(t)}}noteOn(e,t,n=0){if(t<=0){this.noteOff(e,n);return}let r=this.parts[n];if(Rg(e+r.bend,this.clock)<=8)return;let i=this.#e(n),a=this.voices.noteOn(e,t,{part:n,canUse:e=>this.#i(e,i)});if(!a)return;let{voice:o,stolen:s}=a;s&&s.ch===o.ch&&this.sink.write(this.addr[o.ch].volume,0),this.#n(this.channelBank[o.ch],n),this.#o(o.ch,e,r.bend),this.sink.write(this.addr[o.ch].volume,zg(t,r.cc7)),this.#c(o.ch,!0),this.onVoices(this.voices.active())}noteOff(e,t=0){let n=this.voices.noteOff(e,t);n&&(this.#s(n.ch),this.onVoices(this.voices.active()))}allNotesOff(e){for(let t of this.voices.allOff(e))this.#s(t.ch);e===void 0&&this.drums&&this.sink.write(mg,0),this.onVoices(this.voices.active())}resetControllers(){for(let e=0;e<8;e++)this.setPitchBend(0,e),this.setChannelVolume(127,e);this.drumCc7=127}setPitchBend(e,t=0){let n=this.parts[t];n.bend=e/8192*Lg;for(let e of this.voices.active())e.part===t&&this.#o(e.ch,e.note,n.bend)}setChannelVolume(e,t=0){this.parts[t].cc7=e;for(let n of this.voices.active())n.part===t&&this.sink.write(this.addr[n.ch].volume,zg(n.velocity,e))}setWave(e,t=0){e!==`custom`&&lg(e),this.parts[t].waveName=e,this.#r()}setWaveData(e,t=0){this.customWave=Int8Array.from(e),this.customVersion++,this.setWave(Fg,t)}partWaves(){return this.parts.map(e=>e.waveName)}#e(e){let t=this.parts[e].waveName;return t===`custom`?`${Fg}#${this.customVersion}`:t}#t(e){let t=this.parts[e].waveName;return t===`custom`?this.customWave??lg(ag[0]):lg(t)}#n(e,t){let n=this.#e(t);if(this.bankKey[e]===n)return;let r=this.#t(t);for(let t=0;t<r.length;t++)this.sink.write(dg(e,t),r[t]&255);this.bankKey[e]=n}#r(){let e=Array(this.waveBankCount).fill(-1),t=Array(this.waveBankCount).fill(-1);for(let n of this.voices.active()){let r=this.channelBank[n.ch];n.startedAt>t[r]&&(t[r]=n.startedAt,e[r]=n.part)}for(let t=0;t<this.waveBankCount;t++)this.#n(t,e[t]===-1?0:e[t])}#i(e,t){let n=this.channelBank[e];for(let r=0;r<this.channelCount;r++){if(r===e||this.channelBank[r]!==n)continue;let i=this.voices.slots[r];if(i!==null&&this.#e(i.part)!==t)return!1}return!0}#a(e){if(this.drums){if(e.type===`noteOn`){let t=Math.round(e.velocity*this.drumCc7/127);t>0&&this.sink.write(pg+(e.note&127),t)}else e.type===`cc`&&(e.controller===7?this.drumCc7=e.value:(e.controller===123||e.controller===120)&&this.sink.write(mg,0))}}#o(e,t,n){let r=Rg(t+n,this.clock);this.sink.write(this.addr[e].freqLo,r&255),this.sink.write(this.addr[e].freqHi,r>>8)}#s(e){this.sink.write(this.addr[e].volume,0),this.#c(e,!1)}#c(e,t){e>=5?this.sink.write(this.addr[e].key,+!!t):(this.keyMask=t?this.keyMask|1<<e:this.keyMask&~(1<<e),this.sink.write(Ig,this.keyMask))}},Vg=class{constructor({synth:e,clock:t,onEnd:n=()=>{},lookahead:r=.15,interval:i=25}){this.synth=e,this.clock=t,this.onEnd=n,this.lookahead=r,this.interval=i,this.events=[],this.duration=0,this.index=0,this.startTime=0,this.timer=0,this.playing=!1}load(e){this.stop(),this.events=e.events,this.duration=e.duration}play(){this.stop(),this.index=0,this.synth.resetControllers(),this.startTime=this.clock.now()+.1,this.playing=!0,this.timer=setInterval(()=>this.pump(),this.interval),this.pump()}pump(){if(!this.playing)return;let e=this.clock.now()-this.startTime;for(;this.index<this.events.length&&this.events[this.index].time<=e+this.lookahead;){let e=this.events[this.index++];this.clock.setScheduleTime(this.startTime+e.time),this.#e(e)}this.clock.setScheduleTime(null),this.index>=this.events.length&&e>this.duration+.3&&(this.stop(),this.onEnd())}get position(){return this.playing?Math.max(0,Math.min(this.duration,this.clock.now()-this.startTime)):0}stop(){clearInterval(this.timer),this.timer=0,this.playing&&this.synth.allNotesOff(),this.playing=!1}#e(e){this.synth.handle(e)}},Hg=class extends Error{constructor(e){super(e),this.name=`SmfError`}};function Ug(e){let t=0;return{get pos(){return t},set pos(e){t=e},eof:()=>t>=e.length,u8(){if(t>=e.length)throw new Hg(`ファイルが途中で終わっています`);return e[t++]},u16(){return this.u8()<<8|this.u8()},u32(){return(this.u8()<<24>>>0)+(this.u8()<<16)+(this.u8()<<8)+this.u8()},vlq(){let e=0;for(let t=0;t<4;t++){let t=this.u8();if(e=e<<7|t&127,!(t&128))return e}throw new Hg(`可変長の数が長すぎます`)},tag(){return String.fromCharCode(this.u8(),this.u8(),this.u8(),this.u8())}}}function Wg(e){return e.length>=14&&String.fromCharCode(e[0],e[1],e[2],e[3])===`MThd`}function Gg(e){if(!Wg(e))throw new Hg(`SMF（MIDI ファイル）ではありません`);let t=Ug(e);t.tag();let n=t.u32(),r=t.u16(),i=t.u16(),a=t.u16();if(t.pos=8+n,r>1)throw new Hg(`形式${r}には対応していません（形式0・1だけ）`);if(a&32768)throw new Hg(`SMPTE の時間単位には対応していません`);if(a===0)throw new Hg(`4分音符あたりの tick 数が0です`);let o=[],s=[],c=``,l=0;for(let n=0;n<i&&!t.eof();n++){let r=t.tag(),i=t.u32(),a=t.pos+i;if(r!==`MTrk`){t.pos=a,n--;continue}let u=0,d=0;for(;t.pos<a;){u+=t.vlq();let r=t.u8();if(r<128){if(!d)throw new Hg(`ランニングステータスの前にステータスがありません`);t.pos--,r=d}if(r===255){let r=t.u8(),i=t.vlq(),a=t.pos;if(r===81&&i===3&&s.push({tick:u,usPerQuarter:e[a]<<16|e[a+1]<<8|e[a+2]}),r===3&&!c&&n===0&&(c=new TextDecoder(`shift_jis`).decode(e.subarray(a,a+i)).trim()),t.pos=a+i,r===47)break;continue}if(r===240||r===247){t.pos+=t.vlq(),d=0;continue}d=r;let i=r&240,a=r&15,f=t.u8(),p=i===192||i===208?0:t.u8(),m=null;i===144?m=p===0?{type:`noteOff`,note:f,channel:a}:{type:`noteOn`,note:f,velocity:p,channel:a}:i===128?m={type:`noteOff`,note:f,channel:a}:i===176?m={type:`cc`,controller:f,value:p,channel:a}:i===224?m={type:`pitchBend`,value:(p<<7|f)-8192,channel:a}:i===192&&(m={type:`program`,program:f,channel:a}),m&&o.push({tick:u,order:l++,ev:m})}t.pos=a}s.sort((e,t)=>e.tick-t.tick),o.sort((e,t)=>e.tick-t.tick||e.order-t.order);let u=(()=>{let e=[{tick:0,sec:0,us:5e5}];for(let t of s){let n=e[e.length-1],r=n.sec+(t.tick-n.tick)*n.us/(a*1e6);t.tick===n.tick?n.us=t.usPerQuarter:e.push({tick:t.tick,sec:r,us:t.usPerQuarter})}return t=>{let n=e.length-1;for(;n>0&&e[n].tick>t;)n--;return e[n].sec+(t-e[n].tick)*e[n].us/(a*1e6)}})(),d=o.map(({tick:e,ev:t})=>({...t,time:u(e)}));return d.sort((e,t)=>e.time-t.time||(e.type===`noteOff`?-1:0)-(t.type===`noteOff`?-1:0)),{format:r,division:a,events:d,duration:d.length?d[d.length-1].time:0,title:c}}function Kg(e){if(!e||typeof e.file!=`string`||!e.file.endsWith(`.mid`)||/[:?#\\]/.test(e.file)||e.file.startsWith(`/`)||e.file.split(`/`).includes(`..`))throw Error(`Invalid MIDI path`);let t={};for(let[n,r]of Object.entries(e.parts||{})){let e=Number(n);if(!Number.isInteger(e)||e<1||e>10||e===9)throw Error(`Invalid MIDI channel`);let i=r.waveform??0,a=r.volume??100;if(!Number.isInteger(i)||i<0||i>=ag.length||!Number.isFinite(a)||a<0||a>127)throw Error(`Invalid part`);t[e]={waveform:i,volume:a}}if(e.loop&&(!Number.isFinite(e.loop.start)||!Number.isFinite(e.loop.end)||e.loop.start<0||e.loop.end>3600||e.loop.end-e.loop.start<.1))throw Error(`Invalid loop`);return{file:e.file,title:typeof e.title==`string`?e.title:e.file,parts:t,loop:e.loop?{...e.loop}:null}}function qg(e,t){let n=Gg(e),r=t.loop?.start??0,i=t.loop?.end??n.duration;if(!Number.isFinite(i)||r>=i)throw Error(`Invalid MIDI interval`);let a=new Map,o=new Map;for(let e of n.events){if(e.time>=r)break;let t=`${e.channel}:${e.note}`;if(e.type===`noteOn`&&e.channel!==9&&a.set(t,e),e.type===`noteOff`&&a.delete(t),e.type===`cc`&&(o.set(`${e.channel}:cc:${e.controller}`,e),e.controller===120||e.controller===123))for(let[t,n]of a)n.channel===e.channel&&a.delete(t);e.type===`pitchBend`&&o.set(`${e.channel}:bend`,e)}let s=[];for(let e of[0,1,2,3,4,5,6,7,9])s.push({type:`cc`,channel:e,controller:7,value:127,time:0}),e!==9&&s.push({type:`pitchBend`,channel:e,value:0,time:0});let c=[...s,...[...o.values(),...a.values()].map(e=>({...e,time:0})),...n.events.filter(e=>e.time>=r&&e.time<i).map(e=>({...e,time:e.time-r}))];if(!c.some(e=>e.type===`noteOn`))throw Error(`No notes in MIDI interval`);let l=i-r;for(let e of[0,1,2,3,4,5,6,7,9])c.push({type:`cc`,channel:e,controller:123,value:0,time:l});return{events:c,duration:l,title:t.title}}function Jg(e){let t=[],n=0;return{events:t,extend(r){for(;n*e.duration<r;){let r=n++*e.duration;for(let n of e.events)t.push({...n,time:n.time+r})}return n*e.duration},trim(n){n.index>e.events.length*2&&(t.splice(0,n.index),n.index=0)}}}function Yg(e){let t=e.flightPlaylist??[`flight`];if(!Array.isArray(t)||t.length<1||t.length>8||t.some(t=>typeof t!=`string`||!/^[a-z][a-z0-9_-]{0,31}$/i.test(t)||t===`clear`||!Object.hasOwn(e,t)))throw Error(`Invalid flight playlist`);return[...new Set(t)]}function Xg(e){let t=Yg(e);if(e.flightSets===void 0)return{current:t};if(!e.flightSets||typeof e.flightSets!=`object`||Array.isArray(e.flightSets))throw Error(`Invalid flight sets`);return Object.fromEntries(Object.entries(e.flightSets).map(([t,n])=>{if(![`brave`,`rock`,`all`].includes(t))throw Error(`Invalid flight set`);return[t,Yg({...e,flightPlaylist:n})]}).concat([[`current`,t]]))}function Zg(e,t=1){return e.length?e[((Number.isFinite(t)?Math.max(1,Math.floor(t)):1)-1)%e.length]:null}function Qg(e,{fetchFile:t=fetch,base:n=new URL(`./music/`,document.baseURI)}={}){let r=null,i=null,a=null,o=null,s=0,c=null,l=`idle`,u=null,d={},f=[],p=1,m=0,h=null;async function g(){return i||(r||=(async()=>{let e=new URL(`tracks.json`,n);e.searchParams.set(`v`,Im);let r=await t(e);if(!r.ok)throw Error(`No track config`);let a=await r.json(),o=Xg(a),s=[...new Set(Object.values(o).flat())],c=Object.create(null);for(let e of[...s,`clear`])try{let r=Kg(a[e]),i=new URL(r.file,n);if(i.origin!==n.origin||!i.pathname.startsWith(n.pathname))throw Error(`MIDI must be local`);i.searchParams.set(`v`,Im);let o=await t(i);if(!o.ok)throw Error(`No MIDI`);c[e]={track:r,score:qg(new Uint8Array(await o.arrayBuffer()),r)}}catch{}if(!Object.keys(c).length)throw Error(`No usable MIDI`);return i={entries:c,sets:Object.fromEntries(Object.entries(o).map(([e,t])=>[e,t.filter(e=>c[e])]))},l=`ready`,i})().catch(()=>(l=`unavailable`,r=null,null)),r)}function _(){s++,clearInterval(o),o=null,a?.stop(),a=null,e.stopMusic(),c=null,h=null,m=0,l===`playing`&&(l=`ready`)}async function v(t){if(!d.sound||(t===`flight`?!d.bgm:!d.sfx))return`cancelled`;if(c===t&&a?.playing)return`played`;_();let n=s,r=await g();if(n!==s)return`cancelled`;let i=await e.waitForReady();if(n!==s)return`cancelled`;let v=t===`flight`?Zg(y(r),p):t;if(!r?.entries[v]||!i)return`unavailable`;try{await e.resume()}catch{return n===s?(l=`unavailable`,`unavailable`):`cancelled`}if(n!==s)return`cancelled`;let{track:b,score:x}=r.entries[v],S=e.musicClock;e.stopMusic(),e.configure(d),e.setMusicGain((d.bgmVolume??50)/100);let C=new Bg(S,{drums:!0});C.init();for(let[e,t]of Object.entries(b.parts))Number(e)<=8&&C.setWave(ag[t.waveform],Number(e)-1);let w={handle(e){let t=b.parts[(e.channel??0)+1]?.volume??127;C.handle(e.type===`cc`&&e.controller===7?{...e,value:Math.round(e.value*t/127)}:e)},resetControllers(){C.resetControllers();for(let[e,t]of Object.entries(b.parts))C.handle({type:`cc`,channel:Number(e)-1,controller:7,value:t.volume})},allNotesOff:()=>C.allNotesOff()},T=t===`flight`&&b.loop?Jg(x):null;a=new Vg({synth:w,clock:S,onEnd:()=>{n===s&&(e.stopMusic(),c=null,l=`ready`,t===`clear`&&e.suspendIfIdle())}});let E=T?T.extend(x.duration*2):x.duration;return a.load({events:T?T.events:x.events,duration:E}),a.play(),T&&(o=setInterval(()=>{n===s&&a?.playing&&(a.duration=T.extend(Math.max(x.duration*2,S.now()-a.startTime+x.duration)),T.trim(a))},100)),c=t,h=v,m=T?x.duration:0,u=b.title,f.includes(b.title)||f.push(b.title),l=`playing`,`played`}function y(e=i){return e?.sets[d.musicSet]?.length?e.sets[d.musicSet]:e?.sets.current??[]}return{preload:g,play:v,stop:_,setFlightNumber(e){p=Number.isFinite(e)?Math.max(1,Math.floor(e)):1},setSettings(t){let n=d.musicSet!==t.musicSet;d=t,e.setMusicGain((d.bgmVolume??50)/100),(!d.sound||c===`flight`&&(!d.bgm||n)||c===`clear`&&!d.sfx)&&_()},reset(){f=[],u=null,p=1},snapshot:()=>({status:l,playing:!!a?.playing,track:u,playedTracks:[...f],current:c,clearTrack:i?.entries.clear?.track.title??null,position:a?.position??0,flightNumber:p,trackId:h,musicSet:d.musicSet??`current`,flightTracks:y().map(e=>i.entries[e].track.title),loopCount:c===`flight`&&m?Math.floor((a?.position||0)/m):0})}}function $g(){let e;try{e=localStorage}catch{}let t=Rh(e),n=!1,r=0,i=new URL(location.href).searchParams.get(`music`);Object.hasOwn(Ih.musicSet.options,i)&&(t={...t,musicSet:i});let a=0,o=0,s=0,c=Vh(),l=Yh(),u=Qg(c);u.setSettings(t);let d=!Xh(navigator.userAgent)&&typeof navigator.vibrate==`function`,f=qh(d?navigator.vibrate.bind(navigator):null),p=document.getElementById(`feedback-settings-fields`),m={};for(let[r,i]of Object.entries(Ih)){let a=document.createElement(`label`);a.htmlFor=`feedback-${r}`;let o=document.createElement(`span`);o.textContent=i.label;let s=document.createElement(i.options?`select`:`input`);s.id=a.htmlFor;let g=document.createElement(`output`);if(g.htmlFor=s.id,i.options)for(let[e,t]of Object.entries(i.options))s.add(new Option(t,e));else s.type=typeof i.initial==`boolean`?`checkbox`:`range`;s.type===`range`&&Object.assign(s,{min:i.min,max:i.max,step:i.step}),a.dataset.feedbackSetting=r,a.append(o,g,s),p.append(a),s.value=t[r],s.type===`range`&&(m[r]=Km(s,{name:i.label,unit:i.unit,initial:i.initial}));let _=document.createElement(`small`);_.className=`setting-explanation`,_.textContent=Jm[r],_.id=`feedback-help-${r}`,s.setAttribute(`aria-describedby`,_.id);let v=document.createElement(`small`);v.dataset.feedbackInitial=r,v.className=`setting-initial`,a.append(_,v),i.group===`vibration`&&(a.hidden=!d),s.addEventListener(`input`,()=>{if(t=Lh({...t,[r]:i.options?s.value:s.type===`checkbox`?s.checked:Number(s.value)}),r===`musicSet`){let e=new URL(location.href);e.searchParams.set(`music`,t.musicSet),history.replaceState(null,``,e);let n=document.getElementById(`home-link`),r=new URL(n.href);r.searchParams.set(`music`,t.musicSet),n.href=r.href}i.group===`vibration`&&l.reset(),f.stop(),c.configure(t),u.setSettings(t),t.sound?n&&(c.start(),u.play(`flight`)):c.stop(),document.getElementById(`feedback-save-status`).textContent=zh(e,t)?`このブラウザーに保存しました。`:`保存できません。この画面を開いている間だけ使います。`,h()})}document.getElementById(`vibration-support`).textContent=d?`振動は端末・ブラウザーの設定によって使えないことがあります。`:`この端末ではゲームの振動を利用できません。音と表示でお知らせします。`;function h(){for(let[e,n]of Object.entries(Ih)){let r=document.getElementById(`feedback-${e}`);r.type===`checkbox`?r.checked=t[e]:r.value=t[e],r.closest(`label`).querySelector(`output`).textContent=n.options||r.type===`checkbox`?``:`${t[e]}${n.unit||``}`,m[e]?.sync();let i=p.querySelector(`[data-feedback-initial="${e}"]`);i.hidden=t[e]===n.initial,i.textContent=`● 初期値 ${Hm(n)}`}}return h(),{unlock(){f.arm(),t.sound&&(c.unlock(),u.preload())},start({flightNumber:e=1}={}){n=!0,u.setFlightNumber(e),c.start(),c.configure(t),u.play(`flight`)},stop(){n=!1,u.stop(),c.stop(),f.stop(),l.clearWindow()},event(e){f.event(e,t,performance.now()),e===`clear`?u.play(`clear`).then(n=>{n===`unavailable`&&c.event(e,t)}):c.event(e,t)},update(e,i,a,o,s,u=null){if(!n)return;a===`sensor`&&l.add(s,i.pitch,o===`twist`?i.twist:i.steer);let d=Kh(e,t),p=f.update(d,t,s);(s-r>=40||p?.restarted)&&(c.update(d,t,p,u),r=s)},frameTiming(e){n&&Number.isFinite(e)&&(a++,o+=e,s=Math.max(s,e))},reset(){l.reset(),u.reset(),c.resetMetrics(),a=0,o=0,s=0},exitOpened(){n&&c.event(`exitOpen`,t)},report(){return{settings:{...t},changedSettings:Vm(Ih,t),vibrationSupported:d,sensorJitter:l.snapshot(),audio:c.snapshot(),music:u.snapshot(),frameCpu:{meanMs:a?o/a:0,maxMs:s}}},updateDiagnostics(){let e=c.snapshot(),n=l.snapshot();document.getElementById(`feedback-diagnostics`).textContent=`入力の揺れ幅（操作も含む）1秒：機首 ${n.window.pitch.toFixed(1)}° / 旋回 ${n.window.steer.toFixed(1)}° ｜ 音源 ${(e.load*100).toFixed(1)}%・最大 ${(e.maxLoad*100).toFixed(1)}% ｜ 描画・操作CPU ${a?(o/a).toFixed(1):`0.0`}ms ｜ 曲：${u.snapshot().track||`なし`}`,document.getElementById(`feedback-diagnostics`).dataset.audio=JSON.stringify(e),document.getElementById(`feedback-diagnostics`).dataset.music=JSON.stringify(u.snapshot()),document.getElementById(`feedback-audio-status`).textContent=t.sound?e.status===`ready`?`音源の準備完了`:e.status===`idle`?`音は開始ボタンを押した後に準備します。`:`この環境では音を開始できません。音なしで遊べます。`:`音はオフです。`}}}function e_({root:e,userAgent:t,duration:n=1e4}){let r;function i(){clearTimeout(r),e.hidden=!0}function a(){let a=rg({userAgent:t,landscape:innerWidth>innerHeight});a?(e.querySelector(`[data-notice-title]`).textContent=a.title,e.querySelector(`[data-notice-copy]`).textContent=a.text,e.hidden=!1,clearTimeout(r),r=setTimeout(i,n)):i()}return e.querySelector(`button`).addEventListener(`click`,i),{show:a,hide:i,refresh(){e.hidden||a()}}}var t_=e=>document.getElementById(e);function n_({getPhase:e,pause:t,showDialog:n}){let r=navigator.userAgent,i=Xh(r),a=Zh(r),o=$h({standalone:navigator.standalone===!0,displayModes:[`standalone`,`fullscreen`,`minimal-ui`].filter(e=>matchMedia(`(display-mode: ${e})`).matches)}),s=ng(),c=e_({root:t_(`orientation-notice`),userAgent:r}),l=null,u=o===`installed`,d=0,f=!1,p=null,m=!1,h=()=>tg({type:screen.orientation?.type,legacyAngle:window.orientation,width:innerWidth,height:innerHeight}),g=()=>!!(document.fullscreenElement||matchMedia(`(display-mode: fullscreen)`).matches),_=()=>!p&&(!i||s.canResume(h()));function v(){let t=e();t_(`app`).dataset.launch=o,t_(`app`).dataset.fullscreen=String(g()),t_(`install-button`).hidden=u||!a||!l||t!==`intro`;let n=eg({userAgent:r,launch:u?`installed`:o});t_(`installation-advice`).textContent=n,t_(`installation-advice`).hidden=!n||t!==`intro`,t_(`release-screen-button`).hidden=!a||t!==`paused`||!(g()||f),_()?t_(`practice-button`).disabled=!1:(t_(`start-button`).disabled=!0,t_(`practice-button`).disabled=!0),t!==`intro`&&c.hide()}function y(){if(i){let r=s.check(h(),e()===`running`);r===`changed`&&t(`画面の向きが変わりました。開始したときの向きに戻してください。`),r===`waiting`&&([`waiting`,`ready`].includes(e())&&t(`開始したときの向きに戻してください。`),e()===`paused`&&n({title:`画面の向きを戻してください`,description:`開始したときの向きに戻してください。その後、持ち方を合わせ直して再開します。`,action:`開始時の向きを待っています…`})),r===`returned`&&n({title:`元の向きに戻りました`,description:`持ち方を合わせ直してから、ボタンで再開してください。自動では動き出しません。`,action:`この持ち方で再開する`})}c.refresh(),v()}async function b(){if(c.hide(),!a)return;let e=++d,t=screen.orientation?.type;try{g()||await document.documentElement.requestFullscreen?.()}catch{}if(e===d){try{Qh.includes(t)&&screen.orientation?.lock&&(await screen.orientation.lock(t),e===d?f=!0:screen.orientation.unlock?.())}catch{}v()}}async function x(){d++;try{screen.orientation?.unlock?.()}catch{}f=!1;try{document.fullscreenElement&&await document.exitFullscreen?.()}catch{}v(),t_(`installed-screen-advice`).hidden=!(o===`installed`&&g())}t_(`release-screen-button`).addEventListener(`click`,x),window.addEventListener(`beforeinstallprompt`,e=>{a&&!u&&(e.preventDefault(),l=e,v())}),window.addEventListener(`appinstalled`,()=>{u=!0,l=null,v()}),t_(`install-button`).addEventListener(`click`,async()=>{let e=l;if(l=null,v(),e)try{await e.prompt(),await e.userChoice}catch{}}),document.addEventListener(`fullscreenchange`,()=>{a&&!g()&&e()===`running`&&(x(),t(`全画面を終了したため停止しました。持ち方を合わせて再開してください。`)),v()});async function S(){if(!(m||document.hidden)){m=!0;try{let e=await fetch(`./version.json?v=${Im}&t=${Date.now()}`,{cache:`no-store`});if(!e.ok)return;let n=(await e.json()).version;/^\d+\.\d+\.\d+$/.test(n)&&r_(n,`0.1.26`)>0&&(p=n,t(`新しい版を公開しました。「最新版を開く」で更新してください。`),t_(`update-notice`).hidden=!1,t_(`update-version`).textContent=`v${n}`,v())}catch{}finally{m=!1}}}return t_(`update-button`).addEventListener(`click`,()=>{if(!p)return;let e=new URL(location.href);e.searchParams.set(`v`,p),location.replace(e)}),document.addEventListener(`visibilitychange`,()=>{document.hidden||S()}),{render:v,enter:b,release:x,orientationChanged:y,canResume:_,cancelEntry(){d++},begin(){return _()?(s.begin(h()),!0):!1},clearOrientation(){s.clear()},report:()=>({launch:o,fullscreen:g()}),initialize(){v(),c.show(),`serviceWorker`in navigator&&navigator.serviceWorker.register(`./sw.js?v=${Im}`,{scope:`./`,updateViaCache:`none`}).catch(()=>{}),S()}}}function r_(e,t){let n=e.split(`.`).map(Number),r=t.split(`.`).map(Number);for(let e=0;e<3;e++)if(n[e]!==r[e])return n[e]-r[e];return 0}var X=e=>document.getElementById(e),Z=X(`app`),i_=X(`world`),a_,o_;try{o_=localStorage}catch{}var s_=h(b(o_,location.search)),Q=`intro`,$=new URLSearchParams(location.search).get(`mode`)===`flight`?`flight`:`explore`,c_=Mp(new URLSearchParams(location.search).get(`view`)),l_=new URLSearchParams(location.search).get(`steer`)===`twist`?`twist`:`tilt`,u_=new URLSearchParams(location.search).get(`pitch`)===`rate`?`rate`:`angle`,d_=new URLSearchParams(location.search).get(`display`)===`fixed`?`fixed`:`bank`,f_=am(new URLSearchParams(location.search).get(`camera`)),p_=Um(),m_=Ch(s_.lights.length),h_=$g(),g_=n_({getPhase:()=>Q,pause:yv,showDialog:hv}),__=null,v_=!1,y_=``,b_=0,x_=0,S_=[],C_=Zm(()=>({pitch:u_,steer:l_,display:d_,camera:f_,mode:$,view:c_,feedback:h_.report(),input:{basis:$===`flight`?`screen`:`craft`,screenAngle:__===`sensor`?screen.orientation?.angle??window.orientation??0:0,current:__,transitions:S_,held:v_,lastPauseReason:y_},segments:m_.snapshot(),exitDiscovery:m_.exitSnapshot(),targetViews:m_.targetViewsSnapshot(),course:{id:s_.id,name:s_.name,targetCount:s_.lights.length},stageSize:{halfExtent:350,width:700,depth:700},...g_.report()}));function w_(){a_.reset(),m_.reset(s_.lights.length),b_=0}function T_(e,t){__!==e&&(S_.push({from:__,to:e,reason:t,phase:Q,at:new Date().toISOString()}),S_.length>8&&S_.shift()),__=e,Z.dataset.input=e??``}var E_=null,D_=null,O_=0,k_=null,A_=null,j_=null,M_=0,N_=!1,P_=0,F_=0,I_=null,L_=!1,R_=null,z_={pitch:0,steer:0,twist:0},B_={pitchRate:0,yawRate:0,bankAngle:0,acceleration:0,brake:0},V_=0,H_=0,U_=new G,W_=new G,G_={pitch:0,steer:0,twist:0},K_=new Set,q_=!1,J_=0,Y_=0,X_=0,Z_=null,Q_=()=>screen.orientation?.angle??window.orientation??0,$_=[`pitch`,`steer`,`twist`];function ev(e){Q=e,Z.dataset.phase=e,C_.setPhase(e,$),X(`pause-button`).disabled=e!==`running`,X(`recenter-button`).disabled=e!==`running`,X(`recenter-button`).textContent=__===`practice`?`スマホの傾きに切替`:`持ち方を合わせ直す`,X(`veil`).hidden=e===`running`;for(let t of[`explore`,`flight`])X(`mode-${t}`).disabled=[`waiting`,`ready`,`running`].includes(e);X(`throttle-input`).disabled=e!==`running`||$!==`flight`;for(let t of[`bank`,`fixed`])X(`display-${t}`).disabled=[`waiting`,`ready`].includes(e);for(let t of[`overlay`,`chase`,`cockpit`])X(`camera-${t}`).disabled=[`waiting`,`ready`].includes(e);for(let t of[`assisted`,`classic`])X(`view-${t}`).disabled=[`waiting`,`ready`].includes(e);for(let t of[`angle`,`rate`])X(`pitch-${t}`).disabled=[`waiting`,`ready`,`running`].includes(e);for(let t of[`twist`,`tilt`])X(`steering-${t}`).disabled=[`waiting`,`ready`,`running`].includes(e);X(`course-select`).disabled=[`waiting`,`ready`,`running`].includes(e),g_.render()}var tv=()=>$===`flight`?u_===`angle`?`中立で機首も水平へ戻ります。上昇で減速、下降で加速。出力50%で出発します。`:`中立でも機首の角度は残ります。逆へ倒して水平へ戻し、出力を上げて失速から復帰。`:`先端側の傾き${tp.throttleMaximum}°で加減速が最大。中立で速度を保ちます。`,nv=()=>c_===`assisted`?`ピンクの`:`金色の`,rv=()=>$===`flight`?`${C_.getSettings().flightDirector?`白い進行方向の印を輪へ近づけます。重なると輪が緑になります。`:d_===`fixed`?`自機の上向きを保ち、景色が回ります。`:`自機は画面中央。右へ曲がると機体も右へ傾きます。`}${nv()}光を${s_.lights.length}つ集めて出口へ。`:`自機はスマホと一緒に傾かず、最初の上向きを保ちます。${nv()}光を${s_.lights.length}つ集めて出口へ。`;function iv(e){H_=Number.isFinite(e)?U.clamp(e,0,1):0,X(`throttle-input`).value=String(Math.round(H_*100)),X(`throttle-value`).textContent=`${Math.round(H_*100)}%`}function av(){let e=c_===`assisted`;Q===`intro`&&(X(`dialog-description`).textContent=rv()),Z.dataset.visibility=c_,Z.dataset.display=d_,Z.dataset.camera=$===`flight`?f_:`overlay`;for(let e of[`overlay`,`chase`,`cockpit`])X(`camera-${e}`).setAttribute(`aria-pressed`,String(f_===e));X(`camera-note`).textContent={overlay:`今までの景色と上向きの自機。`,chase:`立体機を後ろから少し遅れて追います。`,cockpit:`操縦席から見る。地面の近さは高度と警告で確認。`}[f_],X(`display-bank`).setAttribute(`aria-pressed`,String(d_===`bank`)),X(`display-fixed`).setAttribute(`aria-pressed`,String(d_===`fixed`)),X(`display-note`).textContent=d_===`fixed`?`面内回転を打ち消す。地平線で翼の傾きを表示。`:`機体を旋回側へ傾ける、今までの表示。`,X(`play-mode-label`).textContent=`${$===`flight`?`飛行機`:`探索`}・${e?`対策`:`従来`}`,X(`view-assisted`).setAttribute(`aria-pressed`,String(e)),X(`view-classic`).setAttribute(`aria-pressed`,String(!e)),X(`view-note`).textContent=e?`レーダー、ピンクの光と白い輪、画面端の目標マーク。`:`従来の視野と景色。同じ位置で見え方を比べられます。`,X(`home-link`).href=`./?mode=${$}&view=${c_}&steer=${l_}&pitch=${u_}&display=${d_}&camera=${f_}&course=${s_.id}&music=${h_.report().settings.musicSet}&v=${Im}`}function ov(e){if(!a_||e===c_||![`assisted`,`classic`].includes(e)||[`waiting`,`ready`].includes(Q))return;c_=e,a_.setVisibility(c_),av(),C_.refreshLayout();let t=new URL(location.href);t.searchParams.set(`view`,c_),t.searchParams.set(`steer`,l_),t.searchParams.set(`pitch`,u_),t.searchParams.set(`display`,d_),t.searchParams.set(`v`,Im),history.replaceState(null,``,t)}X(`view-assisted`).addEventListener(`click`,()=>ov(`assisted`)),X(`view-classic`).addEventListener(`click`,()=>ov(`classic`));function sv(e){if(!a_||e===d_||![`bank`,`fixed`].includes(e)||[`waiting`,`ready`].includes(Q))return;d_=e,a_.setDisplay(e),av(),C_.refreshLayout(),Q===`intro`&&(X(`dialog-description`).textContent=rv());let t=new URL(location.href);t.searchParams.set(`display`,d_),t.searchParams.set(`v`,Im),history.replaceState(null,``,t)}X(`display-bank`).addEventListener(`click`,()=>sv(`bank`)),X(`display-fixed`).addEventListener(`click`,()=>sv(`fixed`));function cv(e){if(!a_||[`waiting`,`ready`].includes(Q)||e===f_)return;f_=am(e),a_.setCameraMode(f_),av(),C_.setPhase(Q,$);let t=new URL(location.href);t.searchParams.set(`camera`,f_),t.searchParams.set(`v`,Im),history.replaceState(null,``,t)}for(let e of[`overlay`,`chase`,`cockpit`])X(`camera-${e}`).addEventListener(`click`,()=>cv(e));function lv(){let e=X(`course-select`);if(s_.id===`legacy`&&!e.querySelector(`option[value="legacy"]`)){let t=document.createElement(`option`);t.value=`legacy`,t.hidden=!0,t.textContent=`比較用（旧配置）`,e.append(t)}e.value=s_.id;let t=_.difficulties?.[s_.id]?.cruiseTimeRange;X(`course-note`).textContent=s_.id===`legacy`?`v0.1.25 比較用（旧配置）`:`光${s_.lights.length}個${t?`・約${t[0]}〜${t[1]}秒`:``}`}function uv(){lv();let e=$===`flight`,t=l_===`twist`,n=X(`basic-controls`),r=X(`control-guide`);e?n.append(r):n.before(r),n.hidden=!e||r.hidden;for(let t of[`pitch`,`steer`])X(`practice-${t}`).min=e?`-30`:`-25`,X(`practice-${t}`).max=e?`30`:`25`;Q===`intro`&&(X(`dialog-description`).textContent=rv()),Z.dataset.playMode=$,Z.dataset.controlBasis=e?`screen`:`craft`,Z.dataset.flightSteering=l_,Z.dataset.pitchMode=u_,X(`flight-pitch-picker`).hidden=!e,X(`flight-display-picker`).hidden=!e,X(`flight-camera-picker`).hidden=!e,X(`basic-controls`).open=!e,X(`pitch-angle`).setAttribute(`aria-pressed`,String(u_===`angle`)),X(`pitch-rate`).setAttribute(`aria-pressed`,String(u_===`rate`)),X(`pitch-note`).textContent=u_===`angle`?`中立へ戻すと、機首も水平へ`:`中立でも機首角度を保つ。逆へ倒して戻す`,X(`play-mode-label`).textContent=e?`飛行機モード`:`探索モード`,X(`flight-attitude`).hidden=!e,X(`flight-throttle`).hidden=!e,X(`steer-control-meter`).hidden=e&&t,X(`twist-control-meter`).hidden=e&&!t,X(`pitch-label`).textContent=e?`画面上辺の傾き`:`先端側の傾き`,X(`steer-label`).textContent=e?`左右のひねり`:`自機の左右`,X(`twist-label`).textContent=`左右に回す角度`,X(`flight-steering-picker`).hidden=!e,X(`motion-explanation`).hidden=!e,X(`steering-twist`).setAttribute(`aria-pressed`,String(t)),X(`steering-tilt`).setAttribute(`aria-pressed`,String(!t)),X(`steering-note`).textContent=t?`スマホの面を保って回す。時計回りで右旋回。`:`右端・左端を上下にひねる。下げた側へ旋回。`,X(`practice-panel`).open=!e,X(`practice-summary`).hidden=!e,X(`mode-explore`).setAttribute(`aria-pressed`,String(!e)),X(`mode-flight`).setAttribute(`aria-pressed`,String(e)),X(`pitch-caption`).textContent=e?u_===`angle`?`画面上辺で機首角度・中立で水平`:`画面上辺を起こすと機首上げ`:`先端側で加速・逆で制動`,X(`steer-caption`).textContent=e?`下げた側へ旋回`:`下げた側へ曲がる`,X(`twist-caption`).textContent=e?`右回しで右・左回しで左旋回`:`右回しで上・左回しで下`,X(`stop-hint`).textContent=e?`停止は一時停止ボタン`:`加減速は${tp.throttleMaximum}°で最大`,X(`stop-hint`).hidden=e,X(`ground-clearance`).textContent=e?`地面まで`:`高さ`,X(`ground-height-meter`).hidden=!e,X(`ground-warning-text`).hidden=!e,X(`guide-pitch-title`).textContent=e?`画面の上辺を起こす・倒す`:`自機の先端側へ倒す`,X(`guide-pitch-text`).textContent=e?u_===`angle`?`起こすと上、倒すと下。中立で水平へ`:`起こすと機首上げ、前へ倒すと機首下げ`:`先端側で加速、逆側でブレーキ`,X(`guide-steer-title`).textContent=e?t?`面を保って左右に回す`:`左右の端を上下にひねる`:`自機の左右へ倒す`,X(`guide-steer-text`).textContent=e?t?`回した側へ旋回。戻すと翼が水平へ`:`下げた側へ旋回。戻すと翼が水平へ`:`下げた側へ曲がり続ける`,X(`guide-steer-glyph`).textContent=e&&t?`↻`:`↔`,X(`guide-steer-glyph`).classList.toggle(`twist-glyph`,e&&t),X(`guide-steer-glyph`).classList.toggle(`steer-glyph`,!e||!t),X(`guide-twist-title`).textContent=e?`画面下のスロットル`:`スマホを左右に回して保つ`,X(`guide-twist-text`).textContent=e?`エンジン出力を調整`:`右回しで上、左回しで下へ曲がる`,X(`guide-third-glyph`).textContent=e?`⇄`:`↻`,X(`guide-third-glyph`).classList.toggle(`twist-glyph`,!e),X(`keyboard-guide`).textContent=e?`W・S 機首の上・下
A・D 旋回 / Q・E 出力の弱・強`:`W 加速 / S ブレーキ
A・D 左右 / Q・E 下・上`,X(`practice-brake`).textContent=e?`出力0%`:`ブレーキ`,X(`dialog-note`).textContent=tv(),X(`dialog-note`).hidden=!1,av()}function dv(e){if(!a_||e===l_||![`twist`,`tilt`].includes(e)||[`waiting`,`ready`,`running`].includes(Q))return;l_=e,uv(),C_.setPhase(Q,$);let t=new URL(location.href);t.searchParams.set(`steer`,l_),t.searchParams.set(`pitch`,u_),t.searchParams.set(`display`,d_),t.searchParams.set(`v`,Im),history.replaceState(null,``,t)}X(`steering-twist`).addEventListener(`click`,()=>dv(`twist`)),X(`steering-tilt`).addEventListener(`click`,()=>dv(`tilt`));function fv(e){if(!a_||e===u_||![`angle`,`rate`].includes(e)||[`waiting`,`ready`,`running`].includes(Q))return;u_=e,uv(),C_.refreshLayout();let t=new URL(location.href);t.searchParams.set(`pitch`,u_),t.searchParams.set(`display`,d_),t.searchParams.set(`v`,Im),history.replaceState(null,``,t)}X(`pitch-angle`).addEventListener(`click`,()=>fv(`angle`)),X(`pitch-rate`).addEventListener(`click`,()=>fv(`rate`));function pv(e){if(!a_||e===$||[`waiting`,`ready`,`running`].includes(Q))return;let t=!!__&&Q!==`error`;P_++,vv(),g_.clearOrientation(),w_(),E_=null,Y_=0,X(`toast`).hidden=!0,$=e,p_.reset(),h_.reset(),C_.showResult(null),C_.setPhase(Q,$),uv(),a_.update(0,{mode:$,speed:0,craftQuaternion:U_});let n=new URL(location.href);n.searchParams.set(`mode`,$),n.searchParams.set(`view`,c_),n.searchParams.set(`steer`,l_),n.searchParams.set(`pitch`,u_),n.searchParams.set(`display`,d_),n.searchParams.set(`v`,Im),history.replaceState(null,``,n),t?(ev(`paused`),hv({title:`${$===`flight`?`飛行機`:`探索`}モードに切り替えました`,description:`ステージを最初からにしました。持ち方を決めて始めましょう。`,note:tv(),action:__===`sensor`?`この持ち方で再開する`:`画面操作を再開する`,guide:!0})):(T_(null,`mode-reset`),ev(`intro`),hv({title:`自分はそのまま。世界を動かそう。`,description:rv(),note:tv(),action:`スマホの傾きで始める`,guide:!0}))}function mv(e){let t=h(e);if(!a_||t.id===s_.id||[`waiting`,`ready`,`running`].includes(Q))return;let n=!!__&&Q!==`error`;P_++,vv(),g_.clearOrientation(),s_=t,x(o_,t.id),a_.dispose();try{a_=Cm(i_,{visibility:c_,display:d_,cameraMode:f_,course:s_,turnGravity:C_.getSettings().turnGravity})}catch(e){a_=null,ev(`error`),hv({title:`コースを開けませんでした`,description:`ページを再読み込みして、もう一度お試しください。`,action:`再読み込みする`,error:e.message});return}E_=null,Y_=0,b_=0,m_.reset(t.lights.length),p_.reset(),h_.reset(),X(`toast`).hidden=!0,C_.showResult(null),Iv(),a_.update(0,{mode:$,speed:0,craftQuaternion:U_});let r=new URL(location.href);r.searchParams.set(`course`,t.id),r.searchParams.set(`v`,Im),history.replaceState(null,``,r),uv(),n?(ev(`paused`),hv({title:`コースを変更しました`,description:`${t.name}。光${t.lights.length}個を集めて出口へ。最初から始めます。`,note:tv(),action:__===`sensor`?`この持ち方で再開する`:`画面操作を再開する`,guide:!0})):(T_(null,`course-reset`),ev(`intro`),hv({title:`自分はそのまま。世界を動かそう。`,description:rv(),note:tv(),action:`スマホの傾きで始める`,guide:!0}))}X(`course-select`).addEventListener(`change`,e=>mv(e.target.value)),X(`mode-explore`).addEventListener(`click`,()=>pv(`explore`)),X(`mode-flight`).addEventListener(`click`,()=>pv(`flight`));function hv({title:e,description:t,note:n=``,action:r=`再開する`,guide:i=!1,error:a=``}){X(`motion-explanation`).open=!1,X(`dialog-title`).textContent=e,X(`dialog-description`).textContent=t,X(`dialog-note`).textContent=n,X(`dialog-note`).hidden=!n,X(`control-guide`).hidden=!i,X(`basic-controls`).hidden=!i||$!==`flight`,X(`start-button`).textContent=r,X(`start-button`).disabled=!1,X(`error-message`).textContent=a,X(`error-message`).hidden=!a,X(`reset-button`).hidden=!__,X(`practice-button`).hidden=!1,X(`practice-button`).textContent=__===`practice`?`スマホの傾きに切り替える`:`画面で操縦（スマホ傾きは無効）`,X(`dialog-kicker`).textContent=__===`practice`?`画面操作・センサー未使用`:$===`flight`?`傾き操縦と画面スロットル`:`傾きと回転の操作検証`,g_.render()}function gv(e){L_=!1,vv(),ev(`error`),hv({title:`傾きを確認できませんでした`,description:`停止しています。下の内容を確認して、もう一度試してください。`,action:`もう一度センサーを確認する`,error:e})}function _v(){K_.clear(),q_=!1,J_=0;for(let e of $_)G_[e]=0,X(`practice-${e}`).value=`0`,Mv[e]?.sync()}function vv(){v_=!1,h_.stop(),L_=!1,clearTimeout(I_),B_={pitchRate:0,yawRate:0,bankAngle:0,acceleration:0,brake:0},V_=0,iv(0),z_={pitch:0,steer:0,twist:0},_v(),a_&&a_.update(0,{...B_,mode:$,speed:V_,craftQuaternion:U_}),R_?.release().catch(()=>{}),R_=null}function yv(e=`止まっています。スマホを楽な持ち方に戻してから再開してください。`){[`running`,`ready`,`waiting`].includes(Q)&&(y_=e,P_++,L_=!1,clearTimeout(I_),vv(),E_=null,ev(`paused`),hv({title:`一時停止`,description:e,note:tv(),action:__===`sensor`?`この持ち方で再開する`:`画面操作を再開する`,guide:!1}))}async function bv(){try{if(`wakeLock`in navigator&&!document.hidden&&Q===`running`){let e=await navigator.wakeLock.request(`screen`);Q===`running`?R_=e:await e.release()}}catch{}}function xv(e,t){!document.hidden&&g_.begin()&&(Z_=null,$===`flight`&&p_.start(),T_(e,t),X(`practice-panel`).hidden=e!==`practice`,X(`input-mode`).textContent=e===`sensor`?`スマホの傾きで操作中`:`画面操作・センサー未使用`,_v(),V_=0,$===`flight`&&(a_.resetDisplayRotation(),iv(.5),a_.launchFlight()),e===`sensor`&&D_&&k_?U_.copy(cp(D_,k_)):U_.identity(),ev(`running`),x_=performance.now(),m_.advance(0,{...a_.getStatus(),targetVisible:Uv(a_.getStatus())}),h_.start({flightNumber:p_.snapshot().legs}),X(`pause-button`).focus({preventScroll:!0}),bv())}function Sv(){k_=op(j_,Q_()),A_=op(j_,$===`flight`?0:O_)}function Cv(e,t,n,r){return U_.copy(cp(r,e)),$===`flight`?lp(n,t,__===`sensor`?Q_():0):{...dp(U_,cp(n,e)),twist:sp(n,t).twist}}function wv(e){let t={alpha:e.alpha,beta:e.beta,gamma:e.gamma};op(t,Q_())?(j_=t,Sv(),M_=performance.now(),L_&&Q===`waiting`?(L_=!1,clearTimeout(I_),Ov()):Q===`waiting`&&(clearTimeout(I_),ev(`ready`),hv({title:`持ち方を決めましょう`,description:`画面が見やすい角度で、スマホを動かさずに持ってください。この持ち方を操作の中立にします。`,note:tv(),action:$===`flight`?`この持ち方で飛ぶ`:`この持ち方で始める`,guide:!1}))):(k_=null,A_=null,j_=null,Q===`running`&&__===`sensor`&&yv(`3方向すべての傾きが読めなくなったため停止しました。`))}function Tv(){N_||=(window.addEventListener(`deviceorientation`,wv),!0)}async function Ev(){__!==`sensor`&&(D_=null),vv();let e=++P_;if(L_=!1,k_=null,A_=null,j_=null,M_=0,E_=null,T_(`sensor`,`request-sensors`),!window.isSecureContext)gv(`センサーにはHTTPSのページが必要です。公開URLをSafariやChromeで直接開いてください。`);else if(!(`DeviceOrientationEvent`in window))gv(`この端末・ブラウザーでは傾きを取得できません。スマホのSafariやChromeで公開URLを直接開いてください。`);else{ev(`waiting`),hv({title:`傾きを確認しています`,description:`センサー利用を許可したら、スマホを少し動かしてください。`,action:`センサーを待っています…`}),X(`start-button`).disabled=!0;try{let t=[];typeof DeviceOrientationEvent.requestPermission==`function`&&t.push(DeviceOrientationEvent.requestPermission()),typeof window.DeviceMotionEvent?.requestPermission==`function`&&t.push(DeviceMotionEvent.requestPermission());let n=await Promise.all(t);if(e!==P_)return;if(n.some(e=>e!==`granted`)){gv(`動きと向きへのアクセスが許可されていません。ブラウザーのサイト設定を確認してから、もう一度試してください。`);return}Tv(),I_=setTimeout(()=>{e===P_&&Q===`waiting`&&gv(`3方向の傾きデータが届きませんでした。アプリ内ブラウザーではなく、SafariやChromeで直接開いて試してください。`)},6e3)}catch{e===P_&&gv(`センサー利用を開始できませんでした。ページを開き直して、開始ボタンからもう一度許可してください。`)}}}function Dv(){g_.canResume()&&(!k_||performance.now()-M_>1200?(L_=!0,ev(`waiting`),hv({title:`持ち方を確認しています`,description:`今の持ち方の近くでスマホを少し動かしてください。新しい傾きが届いたら始まります。`,note:tv(),action:`新しい傾きを待っています…`}),X(`start-button`).disabled=!0,clearTimeout(I_),I_=setTimeout(()=>{L_&&gv(`新しい傾きが届きませんでした。ページを開き直して試してください。`)},6e3)):Ov())}function Ov(){g_.canResume()&&(L_=!1,clearTimeout(I_),O_=Q_(),Sv(),E_=($===`flight`?A_:k_).clone(),D_||=k_.clone(),z_={pitch:0,steer:0,twist:0},xv(`sensor`,`held-pose-start`),kv($===`flight`?`画面の上辺を起こすと機首上げ。${l_===`twist`?`面を保って左右に回して`:`左右の端を上下にひねって`}旋回します。`:`自機の先端側を下げると加速、逆側を下げるとブレーキ。持ち直しても自機の向きは保ちます。`,4300))}function kv(e,t=2600){X(`toast`).textContent=e,X(`toast`).hidden=!1,X_=performance.now()+t}function Av(e=`resume-screen`){g_.canResume()&&(P_++,L_=!1,clearTimeout(I_),vv(),E_=null,D_=null,xv(`practice`,e),kv(`画面操作の練習です。スマホの傾きは使っていません。`))}X(`start-button`).addEventListener(`click`,async()=>{if(!a_)location.reload();else if(g_.canResume()){if(h_.unlock(),[`ready`,`paused`,`complete`].includes(Q)){let e=P_,t=++F_;if(await g_.enter(),e!==P_||t!==F_||document.hidden||!g_.canResume())return}a_.getStatus().grounded?(Nv({preserveSession:!0}),__===`sensor`&&Dv()):Q===`complete`?Nv():Q===`ready`||Q===`paused`&&__===`sensor`?Dv():Q===`paused`&&__===`practice`?Av():Ev()}}),X(`practice-button`).addEventListener(`click`,async()=>{if(!a_||!g_.canResume()||Q===`running`||__===`sensor`&&!window.confirm(`画面操作へ切り替えると、スマホを傾けても操縦できなくなります。画面のゲージで操縦するモードへ切り替えますか？`))return;let e=Q,t=__;if(h_.unlock(),__!==`practice`){let n=P_,r=++F_;if(await g_.enter(),n!==P_||r!==F_||Q!==e||__!==t||document.hidden||!g_.canResume())return}(Q===`complete`||a_.getStatus().grounded)&&(g_.clearOrientation(),Q===`complete`?(p_.reset(),h_.reset()):p_.restartLeg(),w_(),Y_=0,D_=null),__===`practice`?Ev():Av(`screen-button-confirmed`)}),X(`pause-button`).addEventListener(`click`,()=>yv()),X(`recenter-button`).addEventListener(`click`,()=>{__===`practice`?(yv(`画面操作を止めました。スマホの傾きへの切替を確認します。`),X(`practice-button`).click()):(yv($===`flight`?`一度停止しました。今の持ち方を操作の中立に合わせ直します。`:`一度停止しました。自機の向きは保ったまま、今の持ち方を操作の中立に合わせ直します。`),g_.enter())}),X(`help-button`).addEventListener(`click`,()=>{Q===`running`&&(yv($===`flight`?`画面の上辺を起こすと機首上げ、前へ倒すと機首下げ。${l_===`twist`?`面を保って時計回りに回すと右旋回、反時計回りで左旋回。`:`左右の端を上下にひねり、右端を下げると右旋回、左端を下げると左旋回。`}中立で翼は水平へ戻り、${u_===`angle`?`機首も水平へ戻ります。`:`機首は今の角度を保ちます。`}画面のスロットルで出力を調整。出力0%でも滑空します。停止は一時停止を使います。`:`自機の先端側を下げると加速、逆側でブレーキ。自機の右側・左側を下げて旋回します。中立で速さを保ち、スマホを右へ回すと上、左へ回すと下へ曲がります。半回転付近では上下操作は中立に戻ります。`),X(`control-guide`).hidden=!1,X(`basic-controls`).hidden=$!==`flight`,X(`basic-controls`).open=!0,X(`motion-explanation`).open=$===`flight`)}),X(`practice-neutral`).addEventListener(`click`,_v);function jv(e,t,n=G_.twist){let r=$===`flight`?0:U.degToRad(n);G_.pitch=Math.round(e*Math.cos(r)-t*Math.sin(r)),G_.steer=Math.round(e*Math.sin(r)+t*Math.cos(r)),G_.twist=n;for(let e of $_)X(`practice-${e}`).value=G_[e],Mv[e]?.sync()}X(`practice-brake`).addEventListener(`click`,()=>{K_.clear(),$===`flight`?iv(0):(q_=!1,jv(25,0))}),X(`throttle-input`).addEventListener(`input`,e=>{Q===`running`&&$===`flight`&&iv(Number(e.target.value)/100)});var Mv=Object.fromEntries($_.map(e=>[e,Km(X(`practice-${e}`),{name:e===`pitch`?`画面の上辺`:e===`steer`?`画面の右辺`:`回し角度`,unit:`°`,initial:0,showValue:!0})]));for(let e of $_)X(`practice-${e}`).addEventListener(`input`,t=>{q_=!1,K_.clear(),G_[e]=Number(t.target.value)});function Nv({preserveSession:e=!1}={}){g_.clearOrientation(),e?p_.restartLeg():(p_.reset(),h_.reset()),C_.showResult(null),P_++,vv(),E_=null,D_=null,w_(),Y_=0,X(`toast`).hidden=!0,__===`practice`?Av():(ev(`paused`),hv({title:`もう一度、出発しましょう`,description:`持ち方を決めて、${s_.lights.length}つの光を集めに行きましょう。`,note:tv(),action:$===`flight`?`この持ち方で飛ぶ`:`この持ち方で始める`}))}X(`reset-button`).addEventListener(`click`,()=>Nv());function Pv(e,{blur:t=!1}={}){F_++,g_.cancelEntry(),h_.stop(),K_.clear(),(!t||Q===`running`||L_)&&yv(e)}document.addEventListener(`visibilitychange`,()=>{document.hidden&&Pv(`画面が隠れたため停止しました。持ち方を合わせて再開してください。`)}),window.addEventListener(`blur`,()=>Pv(`画面から離れたため停止しました。`,{blur:!0})),window.addEventListener(`pagehide`,()=>Pv(`画面から離れたため停止しました。`));var Fv=()=>{Sv(),Iv(),g_.orientationChanged()};screen.orientation?.addEventListener(`change`,Fv),window.addEventListener(`orientationchange`,Fv),window.addEventListener(`keydown`,e=>{if(Q!==`running`||__!==`practice`||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;let t=e.key.toLowerCase();[`w`,`s`,`a`,`d`,`e`,`q`].includes(t)&&(q_||(J_=G_.twist),K_.add(t),q_=!0,e.preventDefault()),e.code===`Space`&&(e.preventDefault(),yv())}),window.addEventListener(`keyup`,e=>K_.delete(e.key.toLowerCase())),i_.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),yv(`3Dの表示が中断しました。ページを再読み込みしてください。`)});function Iv(){a_?.resize(window.innerWidth,window.innerHeight,Math.min(window.devicePixelRatio||1,1.6)),C_.refreshLayout()}window.addEventListener(`resize`,()=>{Iv(),g_.orientationChanged()});function Lv(e,t){let n=Number.isFinite(z_[e])?z_[e]:0,r=e===`twist`?U.radToDeg(Math.asin(Math.sin(U.degToRad(n)))):n;X(`${e}-value`).textContent=`${Math.round(r)}°`;let i=X(`${e}-meter`);i.style.left=`${r<0?50-Math.min(-r/t,1)*50:50}%`,i.style.width=`${Math.min(Math.abs(r)/t,1)*50}%`}var Rv=0,zv=null;function Bv(e,t=`en`){let n=Fm({altitude:e.groundClearance,verticalSpeed:e.verticalSpeed,grounded:e.grounded}),r=$===`flight`,i=r?n.level:`clear`;X(`ground-proximity`).dataset.level=i,X(`ground-height-meter`).style.setProperty(`--clearance-ratio`,String(n.ratio)),X(`altitude-value`).textContent=n.known?n.clearance.toFixed(1):`—`;let a=$d(i,t);X(`ground-warning-text`).textContent!==a&&(X(`ground-warning-text`).textContent=a),X(`ground-warning-text`).dataset.level=i;let o=X(`ground-edge-warning`);o.dataset.level=i,o.hidden=!r||Q!==`running`||![`low`,`danger`].includes(i),Z.dataset.groundLevel=r?i:`hidden`,Z.dataset.groundClearance=n.known?String(n.clearance):``}function Vv(e,t=`en`){let n=X(`target-edge-marker`);if(n.dataset.target=e.collected===e.total?`exit`:`light`,$===`flight`&&f_===`cockpit`&&c_===`assisted`&&Q===`running`){n.hidden=!0,Z.dataset.edgeStatus=`hud`;return}if(c_!==`assisted`||Q!==`running`||e.complete||!e.targetLocal){n.hidden=!0,Z.dataset.edgeStatus=`hidden`;return}let r=window.innerWidth,i=window.innerHeight,a=r/2,o=i/2,s=12,c=r-12,l=12,u=i-12,d=document.querySelector(`.navigation`).getBoundingClientRect(),f=X(`bottom-panel`).getBoundingClientRect();if(l=Math.max(l,d.bottom+12),f.left<a&&f.right>a?u=Math.min(u,f.top-12):f.left>=a?c=Math.min(c,f.left-12):s=Math.max(s,f.right+12),!X(`practice-panel`).hidden&&r>=600&&i<=500){let e=X(`practice-panel`).getBoundingClientRect();e.right<a&&(s=Math.max(s,e.right+12))}X(`toast`).hidden||(l=Math.max(l,X(`toast`).getBoundingClientRect().bottom+12));let p=Hp({target:e.targetLocal,width:r,height:i,verticalFov:e.fieldOfView.vertical,bounds:{left:s+50,top:l+25,right:c-50,bottom:u-25},avoid:{left:a-100,top:o-75,right:a+100,bottom:o+75}});if(n.hidden=!p.visible,Z.dataset.edgeStatus=p.visible?`shown`:p.inView?`onscreen`:`hidden`,Z.dataset.edgeBehind=String(p.behind),!p.visible)return;let m=f_===`cockpit`&&$===`flight`?[`cockpit-speed`,`cockpit-altitude`,`cockpit-heading`,`cockpit-target-height`,`cockpit-power`,`cockpit-vario`].filter(e=>!X(e).hidden).map(e=>X(e).getBoundingClientRect()):[],h=Nm(p,{left:s+50,top:l+25,right:c-50,bottom:u-25},m);n.style.left=`${h.x}px`,n.style.top=`${h.y}px`,X(`edge-arrow`).style.transform=`rotate(${t===`en`&&p.behind?Math.atan2(e.targetLocal.x,-e.targetLocal.z)*180/Math.PI:p.rotation}deg)`,X(`edge-label`).textContent=Xd(e,t);let g=Math.abs(e.elevation)>.13?e.elevation>0?`上`:`下`:``;X(`edge-detail`).textContent=t===`ja`?`${[p.behind?`後ろ`:``,g].filter(Boolean).join(`・`)} ${Math.round(e.distance)}m`.trim():`${Math.round(e.distance)}m ${Zd(e.targetPosition.y-e.position.y,t)}`,n.setAttribute(`aria-label`,`${Xd(e,t)} ${X(`edge-detail`).textContent}`)}function Hv(e){return wh({target:e.targetLocal,verticalFov:e.fieldOfView.vertical,near:e.cameraClipping.near,far:e.cameraClipping.far,width:innerWidth,height:innerHeight,bounds:{left:0,right:innerWidth,top:document.querySelector(`.navigation`).getBoundingClientRect().bottom,bottom:X(`bottom-panel`).getBoundingClientRect().top}})}function Uv(e){return wh({target:e.targetLocal,verticalFov:e.fieldOfView.vertical,near:e.cameraClipping.near,far:e.cameraClipping.far,width:innerWidth,height:innerHeight,bounds:{left:0,right:innerWidth,top:0,bottom:innerHeight}})}function Wv(e,t){if(e-Rv<80&&Q===zv)return;Rv=e,zv=Q,h_.updateDiagnostics();let n=C_.getSettings(),r=Q===`running`?Jd(n.hudLanguage):`ja`;X(`speed-value`).parentElement.firstChild.textContent=r===`ja`?`速さ `:`SPD `,X(`ground-clearance`).textContent=Yd(r,$===`flight`?`groundClearance`:`altitudeShort`),X(`nose-value`).parentElement.firstChild.textContent=`${Yd(r,`nose`)} `,X(`bank-value`).parentElement.firstChild.textContent=`${Yd(r,`bank`)} `,X(`climb-value`).parentElement.firstChild.textContent=`${Yd(r,`climbShort`)} `,document.querySelector(`.throttle-heading label`).textContent=Yd(r,`throttle`),__&&(X(`input-mode`).textContent=r===`ja`?__===`sensor`?`スマホの傾きで操作中`:`画面操作・センサー未使用`:__===`sensor`?`TILT CTRL`:`SCREEN CTRL`),X(`play-mode-label`).textContent=r===`ja`?`${$===`flight`?`飛行機`:`探索`}・${c_===`assisted`?`対策`:`従来`}`:`${$===`flight`?`FLIGHT`:`EXPLORE`} · ${c_===`assisted`?`ASSIST`:`CLASSIC`}`,document.querySelector(`.navigation`).setAttribute(`aria-label`,r===`ja`?`次の目的地`:`NEXT TGT`),document.querySelector(`.collection`).setAttribute(`aria-label`,r===`ja`?`集めた光`:`TGT COLLECTED`);for(let e of $_)Lv(e,$===`flight`?e===`pitch`?n.maxTilt:e===`steer`?n.maxSteerTilt:n.maxSteerTwist:e===`pitch`?tp.throttleMaximum:e===`twist`?tp.twistMaximum:tp.tiltMaximum);X(`speed-value`).textContent=t.speed.toFixed(1),Bv(t,r),X(`nose-value`).textContent=`${Math.round(U.radToDeg(t.pitch))}°`,X(`bank-value`).textContent=`${Math.round(U.radToDeg(t.bank||0))}°`,X(`climb-value`).textContent=`${(t.verticalSpeed||0)>0?`+`:``}${(t.verticalSpeed||0).toFixed(1)}`;let i=t.recoveryAssist>.05?`失速からの復帰補助中`:t.viewAssistance>.05?`地面を見る補助中`:`中立で翼を戻す`;X(`view-assist-note`).textContent=nf(i,r);let a=Q!==`running`||t.speed<.01?`停止中`:$===`flight`?t.verticalSpeed>.1?`上昇中`:t.verticalSpeed<-.1?`下降中`:`巡航中`:B_.brake>0?`ブレーキ`:B_.acceleration>0?`加速中`:`速度維持`;X(`motion-state`).textContent=nf(a,r),X(`target-label`).textContent=t.complete?Yd(r,`arrived`):Xd(t,r),X(`target-distance`).textContent=`${Math.round(t.distance)} m`,X(`collection-count`).textContent=t.collected,X(`collection-total`).textContent=`/ `+t.total,X(`objective`).textContent=rf(t,r),X(`nav-arrow`).style.transform=`rotate(${t.bearing*180/Math.PI}deg)`,X(`target-direction`).textContent=Qd(t,r,{assisted:c_===`assisted`}),Z.dataset.speed=t.speed.toFixed(3),Z.dataset.position=JSON.stringify(t.position),Z.dataset.craftQuaternion=JSON.stringify(t.craftQuaternion),Z.dataset.craftScreenQuaternion=JSON.stringify(t.craftScreenQuaternion),Z.dataset.cameraQuaternion=JSON.stringify(t.cameraQuaternion),Z.dataset.worldQuaternion=JSON.stringify(t.worldQuaternion),Z.dataset.displayRoll=String(t.displayRoll||0),Z.dataset.targetLocal=JSON.stringify(t.targetLocal),Z.dataset.bank=String(t.bank||0),Z.dataset.flightPitch=String(t.pitch),Z.dataset.heading=String(t.heading),Z.dataset.yawRate=String(t.yawRate||0),Z.dataset.verticalSpeed=String(t.verticalSpeed||0),Z.dataset.throttle=String(t.throttle||0),Z.dataset.recoveryAssist=String(t.recoveryAssist||0),Z.dataset.session=JSON.stringify(p_.snapshot()),Z.dataset.pitchTarget=String(B_.pitchTarget||0),Z.dataset.grounded=String(!!t.grounded),Z.dataset.viewPitch=String(t.viewPitch||0),Z.dataset.viewAssistance=String(t.viewAssistance||0),Z.dataset.horizontalFov=String(t.fieldOfView?.horizontal||0),Z.dataset.landmarkCount=String(t.landmarks?.length||0),Z.dataset.beaconAppearance=JSON.stringify(t.beaconAppearance),Z.dataset.scenery=JSON.stringify(t.scenery),Z.dataset.aircraft=JSON.stringify(t.aircraft),Z.dataset.worldCraftScreenQuaternion=JSON.stringify(t.worldCraftScreenQuaternion),Z.dataset.craftVisible=String(t.craftVisible),Z.dataset.orientation=JSON.stringify(t.orientation),Z.dataset.velocity=JSON.stringify(t.velocity),Z.dataset.viewPosition=JSON.stringify(t.viewPosition),Z.dataset.verticalFov=String(t.fieldOfView.vertical),Z.dataset.navigationTargets=JSON.stringify(t.navigationTargets),Z.dataset.exitAppearance=JSON.stringify(t.exitAppearance),Z.dataset.inputHeld=String(v_),Z.dataset.segments=JSON.stringify(m_.snapshot()),Z.dataset.exitDiscovery=JSON.stringify(m_.exitSnapshot()),Z.dataset.targetViews=JSON.stringify(m_.targetViewsSnapshot()),Z.dataset.course=JSON.stringify(t.course),Z.dataset.stageSize=JSON.stringify(t.stageSize),Z.dataset.turnGravity=String(t.turnGravity),Z.dataset.boundary=JSON.stringify(t.boundary);let o=$===`flight`&&f_===`cockpit`&&Q===`running`;X(`cockpit-exit-notice`).hidden=!(o&&c_===`assisted`&&t.collected===t.total&&e<b_),X(`cockpit-exit-notice`).textContent=Yd(r,`exitOpen`);let s=ph(t,{phase:Q,visibility:c_,enabled:n.targetHeightGuide,cockpit:o,language:r});Mm(t,{phase:Q,visibility:c_,range:n.radarRange,language:r});let c=yh(o);Vv(t,r),bh({...t,inputHeld:v_},o,c,{...n,hudLanguage:r},s),Nh(c)}var Gv=performance.now();function Kv(e){let t=performance.now(),n=Math.min((e-Gv)/1e3,.05);if(Gv=e,a_){if(Q===`running`){if(__===`sensor`)E_&&D_&&j_&&(Sv(),z_=up(z_,Cv(k_,A_,E_,D_)),v_=z_.held);else{if(q_){let e=u_===`angle`?C_.getSettings().maxTilt:18,t=$===`flight`?(K_.has(`w`)?e:0)-(K_.has(`s`)?e:0):(K_.has(`s`)?22:0)-(K_.has(`w`)?18:0),r=(K_.has(`d`)?18:0)-(K_.has(`a`)?18:0),i=$===`flight`&&l_===`twist`?0:r,a=$===`flight`?l_===`twist`?r:J_:J_+(K_.has(`e`)?22:0)-(K_.has(`q`)?22:0);$===`flight`&&(K_.has(`e`)||K_.has(`q`))&&iv(H_+(+!!K_.has(`e`)-!!K_.has(`q`))*n*.4),jv(t,i,((a+180)%360+360)%360-180)}let e=fp(G_);z_=up(z_,Cv(e,e,W_,W_)),v_=z_.held}}B_=Q===`running`?$===`flight`?Bm(z_,{pitchMode:u_,steering:l_,settings:C_.getSettings(),currentPitch:a_.getStatus().controlPitch,dt:n}):hp(z_):{pitchRate:0,yawRate:0,bankAngle:0,acceleration:0,brake:0};let t=Q===`running`,r=t&&$===`flight`;Q===`running`&&($===`explore`&&(V_=vp(V_,n,B_)),a_.update(n,{...B_,mode:$,speed:V_,throttle:H_,craftQuaternion:U_,...$===`flight`?{displayTwist:z_.twist,displayScreenOffset:__===`sensor`?Q_()-O_:0,displayTimeConstant:C_.getSettings().displayTimeConstant,chaseTimeConstant:C_.getSettings().chaseTimeConstant,cockpitFov:C_.getSettings().cockpitFov,turnGravity:C_.getSettings().turnGravity,maxBank:C_.getSettings().maxBank}:{}}));let i=a_.getStatus(),a=t?Math.max(0,(e-x_)/1e3):0;if(t){let t=Uv(i);m_.advance(a,{...i,targetVisible:t,exitVisible:i.collected===i.total&&Hv(i)}),x_=e}if(r&&p_.advance(a,i),Q===`running`&&$===`flight`&&!i.grounded&&(Z_={throttle:i.throttle,pitch:i.pitch,verticalSpeed:i.verticalSpeed,inputPitch:z_.pitch,deadzone:C_.getSettings().deadzone}),i.collected>Y_){Y_=i.collected,h_.event(`collect`);let t=Jd(C_.getSettings().hudLanguage);i.collected===i.total&&c_===`assisted`?(b_=e+3500,h_.exitOpened(),kv(t===`ja`?`出口が開きました。黄色と白の門へ向かいましょう。`:Yd(t,`exitOpen`))):kv(af(i,t))}if(i.complete&&Q===`running`&&(vv(),ev(`complete`),h_.event(`clear`),hv({title:`出口に到着しました`,description:$===`flight`?`${i.total}つの光を集めて飛行クリア。傾きとスロットルは操作しやすかったですか？`:`${i.total}つの光を集めて、探索クリア。傾きと回転は操作しやすかったですか？`,note:`楽な持ち方に戻してから、もう一度試せます。`,action:`もう一度遊ぶ`}),$===`flight`&&C_.showResult(C_.report(p_.snapshot(),`clear`,p_.lastLegSnapshot()))),i.grounded&&Q===`running`){let e=`地面まで0mで接触しました。`;if(Z_){let t=Z_,n=Math.round(U.radToDeg(t.pitch)),r=Math.abs(n)<1?`機首ほぼ水平`:`機首${n>0?`上`:`下`}${Math.abs(n)}°`,i=Math.abs(t.inputPitch)<=t.deadzone?`中立`:`${t.inputPitch<0?`前倒し`:`手前へ起こし`}${Math.round(Math.abs(t.inputPitch))}°`;e=`接地直前：出力${Math.round(t.throttle*100)}%・${r}・下降${Math.max(0,-t.verticalSpeed).toFixed(1)}m/s。前後操作：${i}。`}yv(`地面に接触して停止しました。最初から飛び直せます。`),h_.event(`crash`),hv({title:`地面に接触して停止`,description:e,note:`飛び直すと出発地点から出力50%で始まります。`,action:`最初から飛び直す`}),C_.showResult(C_.report(p_.snapshot(),`grounded`,p_.lastLegSnapshot()))}Wv(e,i),Ph(i,$===`flight`&&f_===`cockpit`&&Q===`running`,{language:Q===`running`?C_.getSettings().hudLanguage:`ja`});let o=qf(i,{phase:Q,camera:f_,settings:C_.getSettings(),now:e,dt:n});pf(i,{phase:Q,settings:C_.getSettings()}),h_.update(i,z_,__,l_,e,{enabled:Q===`running`&&$===`flight`&&C_.getSettings().audioGuidance,bearingDeg:o?.bearingDeg})}h_.frameTiming(performance.now()-t),e>X_&&(X(`toast`).hidden=!0),requestAnimationFrame(Kv)}uv();try{a_=Cm(i_,{visibility:c_,display:d_,cameraMode:f_,course:s_,turnGravity:C_.getSettings().turnGravity}),a_.update(0,{mode:$,speed:0,craftQuaternion:U_}),Iv(),g_.initialize(),requestAnimationFrame(Kv)}catch(e){ev(`error`),hv({title:`3D画面を表示できません`,description:`WebGLに対応したSafariやChromeで開き直してください。`,action:`再読み込みする`,error:e.message||`3D描画の開始に失敗しました。`}),X(`practice-button`).hidden=!0}