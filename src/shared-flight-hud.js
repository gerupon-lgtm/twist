/** Screen-space placement shared by the rear and cockpit views. */
export function sharedFlightHudLayout({width,height,navBottom=42,safe={left:0,right:0},controlsTop=height-142,layout='a'}={}){
 const wide=width>=600&&height<=500,left=12+(safe.left??0),right=width-12-(safe.right??0),center=(left+right)/2;
 const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 const heading=box(center-90,navBottom+10,180,28),targetHeight=box(center-90,heading.bottom+6,180,32);
 const radar=box(left,wide?heading.top:targetHeight.bottom+12,100,100);
 const cardWidth=wide?88:Math.max(78,Math.min(120,width*.215));
 const body=layout==='c'?cardWidth:wide?62:height<720?90:126,foot=wide?30:height<720?34:40;
 const legendWidth=Math.min(208,right-heading.right-12);
 const legend=wide?box(right-legendWidth,heading.top,legendWidth,24):layout==='b'&&height<720?box(radar.right+12,radar.top,right-radar.right-12,24):box(center-104,controlsTop-30,208,24);
 return {heading,targetHeight,radar,legend,legendInUpper:wide||layout==='b'&&height<720,
  focusY:wide?height/2:Math.max(height/2,controlsTop-70-foot-body/2)};
}
const $=id=>document.getElementById(id);
export const readSharedFlightHud=()=>{const raw=$('app')?.dataset.sharedFlightHud;return raw?JSON.parse(raw):null;};
export function updateSharedFlightHud({enabled,layout='a',safe={left:0,right:0}}={}){
 const app=$('app');if(!enabled){delete app.dataset.sharedFlightHud;return null;}
 // Reserve the compact navigation before measuring it. Its position must not
 // depend on whether the director found free space in the previous frame.
 if(!app.hasAttribute('data-shared-flight-hud'))app.dataset.sharedFlightHud='';
 const value=sharedFlightHudLayout({width:innerWidth,height:innerHeight,safe,layout,navBottom:document.querySelector('.navigation').getBoundingClientRect().bottom,controlsTop:$('bottom-panel').getBoundingClientRect().top});
 app.dataset.sharedFlightHud=JSON.stringify(value);return value;
}
export function placeHudBox(element,box){Object.assign(element.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});}
