/** Relative dragging avoids a jump on track taps. Keyboard range controls remain native. */
export function createRangeEditor(input,{name,unit='',initial=0,onReset,showValue=false}={}) {
  let accepted=Number(input.value),previous=null,drag=null;
  const historyKey=`twist.range-before.${input.id}`;
  try {const stored=JSON.parse(localStorage.getItem(historyKey));if(typeof stored==='number'&&Number.isFinite(stored))previous=stored;}catch{/* History is optional. */}
  const row=document.createElement('div');row.className='range-adjuster';
  input.replaceWith(row);
  const button=(text,label,action)=>{const el=document.createElement('button');el.type='button';el.textContent=text;el.setAttribute('aria-label',label);el.addEventListener('click',action);return el;};
  const assign=value=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};
  const minus=button('−',`${name}を1段階下げる`,()=>assign(accepted-Number(input.step||1)));
  const plus=button('＋',`${name}を1段階上げる`,()=>assign(accepted+Number(input.step||1)));
  row.append(minus,input,plus);
  // Native touch ranges can jump even after pointerdown is cancelled. Receive gestures above the track.
  const surface=document.createElement('div');surface.className='range-drag-surface';surface.setAttribute('aria-hidden','true');row.append(surface);
  const history=document.createElement('div');history.className='range-history';
  const before=document.createElement('span');before.dataset.rangeBefore=input.id;
  const current=document.createElement('output');current.htmlFor=input.id;current.hidden=!showValue;
  const undo=button('変更前へ',`${name}を変更前の値へ戻す`,()=>assign(previous));undo.dataset.rangeUndo=input.id;
  const reset=button('初期値',`${name}だけ初期値へ戻す`,()=>{
    if(onReset){previous=accepted;onReset();save();sync();}else assign(initial);
  });reset.dataset.rangeReset=input.id;
  history.append(current,before,undo,reset);row.after(history);
  function save(){try{localStorage.setItem(historyKey,JSON.stringify(previous));}catch{/* Current value still works. */}}
  function sync(){
    accepted=Number(input.value);
    current.textContent=`${Number(accepted.toFixed(2))}${unit}`;
    before.textContent=previous===null?'変更前：—':`変更前：${Number(previous.toFixed(2))}${unit}`;
    minus.disabled=input.disabled||accepted<=Number(input.min);plus.disabled=input.disabled||accepted>=Number(input.max);
    undo.disabled=input.disabled||previous===null||previous<Number(input.min)||previous>Number(input.max);reset.disabled=input.disabled||(!onReset&&accepted===initial);
  }
  input.addEventListener('input',()=>{
    const next=Number(input.value);if(next!==accepted)previous=drag?.value??accepted;accepted=next;
    if(!drag)save();sync();
  });
  surface.addEventListener('click',event=>event.preventDefault());
  surface.addEventListener('pointerdown',event=>{
    if(input.disabled||event.button!==0)return;
    event.preventDefault();input.focus({preventScroll:true});surface.setPointerCapture(event.pointerId);
    drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,value:accepted,started:false};
  });
  surface.addEventListener('pointermove',event=>{
    if(!drag||drag.pointer!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.started){if(Math.abs(dx)<5||Math.abs(dy)>Math.abs(dx))return;drag.started=true;}
    const span=Number(input.max)-Number(input.min),width=Math.max(20,input.getBoundingClientRect().width-20),step=Number(input.step||1);
    input.value=String(Math.round((drag.value+dx/width*span)/step)*step);input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const finish=event=>{if(drag?.pointer!==event.pointerId)return;drag=null;save();input.dispatchEvent(new Event('change',{bubbles:true}));};
  surface.addEventListener('pointerup',finish);surface.addEventListener('pointercancel',finish);surface.addEventListener('lostpointercapture',finish);
  input.addEventListener('change',save);sync();
  return {sync};
}
