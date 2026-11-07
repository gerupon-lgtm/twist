const clamp = value => Math.max(0,Math.min(1.2,Number.isFinite(value)?value:0));
const keys = {ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1,PageUp:10,PageDown:-10};

/** A track tap never jumps the throttle; only an explicit drag or native key can enter AB. */
export function createThrottleControl(input,{onChange,getValue}={}) {
  const document=input.ownerDocument;
  let accepted=clamp(Number(input.value)/100),drag=null,disposed=false;
  input.min='0';input.max='120';input.step='1';
  const previousPointerEvents=input.style.pointerEvents;
  const row=document.createElement('div');row.className='throttle-drag-control';
  Object.assign(row.style,{position:'relative',minWidth:'0'});
  input.replaceWith(row);row.append(input);input.style.pointerEvents='none';
  const surface=document.createElement('div');surface.className='throttle-drag-surface';
  surface.setAttribute('aria-hidden','true');
  Object.assign(surface.style,{position:'absolute',inset:'0',touchAction:'pan-y',cursor:'ew-resize'});row.append(surface);
  const listeners=[];
  const listen=(target,type,handler)=>{target.addEventListener(type,handler);listeners.push([target,type,handler]);};
  const current=()=>{const value=getValue?.();return Number.isFinite(value)?clamp(value):accepted;};
  function sync(value=current()) {accepted=clamp(value);input.value=String(Math.round(accepted*100));}
  function apply(value) {sync(Math.round(clamp(value)*100)/100);onChange?.(accepted);}
  function release() {
    const pointer=drag?.pointer;drag=null;
    if(pointer!==undefined)try{surface.releasePointerCapture(pointer);}catch{/* Capture may already be lost. */}
  }
  function cancel() {const value=current();release();if(value>1)apply(1);else sync(value);}
  listen(surface,'click',event=>event.preventDefault());
  listen(surface,'pointerdown',event=>{
    if(disposed||input.disabled||event.button!==0||event.isPrimary===false||!event.isTrusted)return;
    event.preventDefault();input.focus({preventScroll:true});sync(current());
    drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,value:accepted,started:false,scroll:false};
    try{surface.setPointerCapture(event.pointerId);}catch{/* Pointer handling still works while inside the track. */}
  });
  listen(surface,'pointermove',event=>{
    if(!drag||drag.pointer!==event.pointerId||input.disabled||!event.isTrusted)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.started){
      if(Math.abs(dy)>=5&&Math.abs(dy)>Math.abs(dx))drag.scroll=true;
      if(drag.scroll||Math.abs(dx)<5||Math.abs(dy)>Math.abs(dx))return;
      drag.started=true;
    }
    event.preventDefault();
    const width=Math.max(20,input.getBoundingClientRect().width-28);
    apply(drag.value+dx/width*1.2);
  });
  listen(surface,'pointerup',event=>{if(drag?.pointer===event.pointerId)release();});
  for(const type of ['pointercancel','lostpointercapture'])listen(surface,type,event=>{if(drag?.pointer===event.pointerId)cancel();});
  listen(input,'keydown',event=>{
    if(input.disabled||event.altKey||event.ctrlKey||event.metaKey||!event.isTrusted)return;
    if(!Object.hasOwn(keys,event.key)&&event.key!=='Home'&&event.key!=='End')return;
    event.preventDefault();release();
    apply(event.key==='Home'?0:event.key==='End'?1.2:current()+keys[event.key]/100);
  });
  listen(input,'input',event=>{
    if(input.disabled){sync(current());return;}
    const value=Number(input.value)/100;
    // Existing programmatic normal-power inputs remain supported, but cannot ignite AB.
    if(value>1&&!event.isTrusted){sync(current());return;}
    apply(value);
  });
  sync(accepted);
  return {sync,cancel,dispose(){if(disposed)return;cancel();disposed=true;for(const [target,type,handler]of listeners)target.removeEventListener(type,handler);input.style.pointerEvents=previousPointerEvents;row.replaceWith(input);}};
}
