import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { APP_VERSION } from '../src/version.js';

// Rasterize the project's own geometric favicon. Solid backgrounds also work for maskable icons.
const points = [[21,12],[43,12],[52,32],[43,52],[21,52],[12,32],[21,12]];
const lines = [...points.slice(1).map((p,i) => [points[i],p]),[[21,12],[43,52]],[[43,12],[21,52]]];
function distance(x,y,[a,b]) {
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
}
function chunk(type,data) {
  const body=Buffer.concat([Buffer.from(type),data]);
  let crc=0xffffffff;
  for (const byte of body) { crc^=byte; for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  const head=Buffer.alloc(4),tail=Buffer.alloc(4); head.writeUInt32BE(data.length); tail.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([head,body,tail]);
}
function icon(size,maskable=false) {
  const raw=Buffer.alloc((size*3+1)*size),scale=maskable ? .82 : 1;
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const sx=((x+.5)/size*64-32)/scale+32,sy=((y+.5)/size*64-32)/scale+32;
    const d=Math.min(...lines.map(line=>distance(sx,sy,line)));
    const ink=Math.max(0,Math.min(1,(2-d)*size/64+.5));
    const offset=y*(size*3+1)+1+x*3;
    [220,235,241].forEach((bg,i)=>raw[offset+i]=Math.round(bg*(1-ink)+[17,127,151][i]*ink));
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
await mkdir('public/icons',{recursive:true});
for(const [name,size,maskable] of [['icon-192.png',192],['icon-512.png',512],['maskable-512.png',512,true],['apple-touch-icon.png',180]]) await writeFile(`public/icons/${name}`,icon(size,maskable));
const manifest={id:'./',name:'twist',short_name:'twist',lang:'ja',start_url:`./?mode=flight&view=assisted&pitch=angle&steer=tilt&v=${APP_VERSION}`,scope:'./',display:'fullscreen',orientation:'any',theme_color:'#dcebf1',background_color:'#dcebf1',icons:[{src:`./icons/icon-192.png?v=${APP_VERSION}`,sizes:'192x192',type:'image/png',purpose:'any'},{src:`./icons/icon-512.png?v=${APP_VERSION}`,sizes:'512x512',type:'image/png',purpose:'any'},{src:`./icons/maskable-512.png?v=${APP_VERSION}`,sizes:'512x512',type:'image/png',purpose:'maskable'}]};
await writeFile('public/manifest.webmanifest',`${JSON.stringify(manifest,null,2)}\n`);
await writeFile('public/version.json',`${JSON.stringify({version:APP_VERSION})}\n`);
