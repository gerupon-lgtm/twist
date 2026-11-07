import {readFile,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
const source=await readFile(new URL('../docs/settings-guide.md',import.meta.url),'utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
const blocks=[];let paragraph=[],table=[],list=[];
function flush(){
  if(paragraph.length){blocks.push(`<p>${inline(paragraph.join(' '))}</p>`);paragraph=[];}
  if(list.length){blocks.push(`<ul>${list.map(s=>`<li>${inline(s)}</li>`).join('')}</ul>`);list=[];}
  if(table.length){const rows=table.filter(cells=>!cells.every(s=>/^:?-+:?$/.test(s)));blocks.push(`<div class="table-wrap"><table>${rows.map((cells,i)=>`<tr>${cells.map(s=>`<${i?'td':'th'}>${inline(s)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table></div>`);table=[];}
}
for(const raw of source.split(/\r?\n/)){
  const line=raw.trim(),heading=line.match(/^(#{1,3})\s+(.+)$/);
  if(!line){flush();continue;}
  if(heading){flush();blocks.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);continue;}
  if(line.startsWith('|')){if(paragraph.length||list.length)flush();table.push(line.split('|').slice(1,-1).map(s=>s.trim()));continue;}
  if(line.startsWith('- ')){if(paragraph.length||table.length)flush();list.push(line.slice(2));continue;}
  if(table.length||list.length)flush();paragraph.push(line);
}flush();
const html=`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>twist 調整の早見表 v${APP_VERSION}</title><style>body{margin:0;background:#eef5f3;color:#214554;font:14px/1.8 system-ui,sans-serif}header,main{max-width:960px;margin:auto;padding:16px}header{display:flex;justify-content:space-between;gap:16px}a{color:#117f97}h1{font-size:23px}h2{font-size:19px;margin-top:32px}h3{font-size:16px}table{border-collapse:collapse;width:100%;table-layout:fixed;background:#fff}th,td{border:1px solid #c5d9d8;padding:8px;vertical-align:top;overflow-wrap:anywhere;font-size:12px}th{background:#deeeea}.table-wrap{max-width:100%;overflow-x:auto}code{overflow-wrap:anywhere}main{padding-top:0}li{margin-bottom:8px}@media(max-width:500px){header,main{padding:12px}h1{font-size:20px}th,td{padding:5px;font-size:11px}}</style><header><a href="./?mode=flight&camera=cockpit&v=${APP_VERSION}">twistへ戻る</a><strong>v${APP_VERSION}</strong></header><main>${blocks.join('\n')}</main></html>\n`;
await writeFile(new URL('../public/settings-guide.html',import.meta.url),html);
console.log(`Built settings guide v${APP_VERSION}`);
