export function updateAfterburnerPanel(state,settings={}){
 const root=document.getElementById('afterburner-hud');if(!root)return;
 const ab=state.afterburner??{},fuel=Math.max(0,Math.min(100,Number.isFinite(ab.fuel)?ab.fuel:0));
 const status=ab.active?'ON':ab.needsRelease?'RELEASE':fuel<=0?'EMPTY':'READY';
 root.dataset.status=status.toLowerCase();root.dataset.active=String(ab.active===true);root.dataset.fuel=String(fuel);
 root.querySelector('i').style.width=`${fuel}%`;
 root.querySelector('output').textContent=`${Math.floor(fuel)}`;
 root.title=settings.hudLanguage==='ja'?`AB ${Math.floor(fuel)} / 100。110%まで横に動かすと点火。100%へ戻すと解除。`:`AB ${Math.floor(fuel)} / 100 · ${status} · DRAG TO 110%, RETURN TO 100%`;
 root.setAttribute('aria-label',root.title);root.querySelector('b').textContent=ab.active?'AB ON':'AB';
 const hint=document.getElementById('afterburner-status');
 hint.textContent=settings.hudLanguage==='ja'?ab.active?'作動中':ab.needsRelease?'戻す':fuel<=0?'空':'使用可':status;
}
