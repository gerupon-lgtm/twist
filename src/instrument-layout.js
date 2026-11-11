const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const HUD_LAYOUTS=Object.freeze({a:'A：左右対称の縦型',b:'B：下部に横一列',c:'C：円形ミニ計器'});
export const normalizeHudLayout=value=>Object.hasOwn(HUD_LAYOUTS,value)?value:'a';
const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const xOverlap=(x,w,r)=>x<r.right&&x+w>r.left;
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
/** One geometry model for all cameras. UI rectangles are the actual rendered controls. */
export function instrumentLayout({width,height,safe={left:0,right:0},top=60,upper=[],controls=[],legend=null,layout='a',sonic=false,vario=true,focusY=height/2,bandAcross=false}={}){
 layout=normalizeHudLayout(layout);const left=12+safe.left,right=width-12-safe.right,cy=focusY,wide=width>=600&&height<=500;
 const valid=r=>r&&r.width!==0&&r.height!==0&&[r.left,r.right,r.top,r.bottom].every(Number.isFinite);
 upper=upper.filter(valid);controls=controls.filter(valid);
 const leftControls=controls.filter(r=>r.right<width/2),rightControls=controls.filter(r=>r.left>width/2);
 const gapLeft=Math.max(left,...leftControls.map(r=>r.right+10)),gapRight=Math.min(right,...rightControls.map(r=>r.left-10));
 if(layout==='b'){
  const slots=sonic?4:vario?3:2,useGap=wide&&!bandAcross&&gapRight-gapLeft>=160;
  const x=useGap?gapLeft:left,w=(useGap?gapRight:right)-x,columns=w/slots>=78?slots:2;
  const compact=!wide&&height<720,rows=Math.ceil(slots/columns),rowHeight=wide?56:compact?42:68,h=rows*rowHeight;
  const bottom=Math.min(height-12,...controls.filter(r=>xOverlap(x,w,r)).map(r=>r.top-(compact?4:12)),legend&&xOverlap(x,w,legend)?legend.top-8:height-12);
  const minimumTop=Math.max(top,...upper.filter(r=>xOverlap(x,w,r)).map(r=>r.bottom+8));
  const bottomY=bottom-h,aboveY=minimumTop;
  const clearance=compact?36:54;
  const lower=box(x,height-12-h,w,h),lowerFree=bandAcross&&[...upper,...controls,...(legend?[legend]:[])].every(r=>!overlap(lower,r));
  const y=lowerFree?lower.top:bottomY>=cy+clearance?bottomY:aboveY+h<=cy-clearance?aboveY:clamp(bottomY,top,Math.max(top,height-h-12));
  const names=sonic?['speed','mach','altitude','vario']:vario?['speed','altitude','vario']:['speed','altitude'];
  const cells=Object.fromEntries(names.map((name,i)=>[name,box(x+(i%columns)*w/columns,y+Math.floor(i/columns)*rowHeight,w/columns,rowHeight)]));
  return {layout,compact:wide||height<720,columns,rows,groups:[box(x,y,w,h)],...cells};
 }
 const w=wide?88:clamp(width*.215,78,120),body=layout==='c'?w:wide?62:height<720?90:126,foot=!vario?0:wide?30:height<720?34:40,total=body+foot;
 const starts=[left,...upper.filter(r=>r.left<width/2).flatMap(r=>[r.right+10,r.left-w-10])];
 const pairs=[...starts.map(x=>[x,left+right-x-w]),[gapLeft,gapRight-w]];
 const candidates=[];
 for(const [x1,x2]of pairs){
  if(x1<left||x2+w>right||x1+w>width/2-54||x2<width/2+54)continue;
  const hits=r=>xOverlap(x1,w,r)||xOverlap(x2,w,r);
  const minTop=Math.max(top,...upper.filter(hits).map(r=>r.bottom+8));
  const maxBottom=Math.min(height-12,...controls.filter(hits).map(r=>r.top-10),legend&&hits(legend)?legend.top-8:height-12);
  if(maxBottom-minTop<total)continue;
  const y=clamp(cy-body/2,minTop,maxBottom-total);
  candidates.push({x1,x2,y,score:Math.abs(y+body/2-cy)+.12*(Math.abs(x1-left)+Math.abs(x2-(right-w)))+Math.abs((x1-left)-(right-w-x2))});
 }
 const p=candidates.sort((a,b)=>a.score-b.score)[0]??{x1:left,x2:right-w,y:Math.max(top,cy-body/2)};
 return {layout,compact:wide||height<720,columns:2,rows:1,groups:[box(p.x1,p.y,w,total),box(p.x2,p.y,w,total)],speed:box(p.x1,p.y,w,body),altitude:box(p.x2,p.y,w,body),mach:box(p.x1,p.y+body,w,foot),vario:box(p.x2,p.y+body,w,foot)};
}
export function layoutIsClear(result,obstacles,width,height){return result.groups.every(r=>r.left>=0&&r.top>=0&&r.right<=width&&r.bottom<=height&&!obstacles.some(o=>overlap(r,o)));}
