import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.mid':'audio/midi','.txt':'text/plain; charset=utf-8'};
// Verification server only: the same build can be checked at / and /twist/.
http.createServer(async(req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.startsWith('/twist/')) pathname=pathname.slice('/twist'.length);
  if(pathname==='/legacy-test-sw.js') {
    res.writeHead(200,{'content-type':'text/javascript','service-worker-allowed':'/','cache-control':'no-store'});
    res.end(`self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate') e.respondWith(new Response('<!doctype html><h1>twist v0.1.18 fixture</h1>',{headers:{'content-type':'text/html'}}));});`);return;
  }
  const file=path.resolve(root,`.${pathname.endsWith('/') ? pathname+'index.html' : pathname}`);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{const data=await readFile(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);}
  catch{res.writeHead(404);res.end('Not found');}
}).listen(4174,'localhost',()=>console.log('Built verification server http://localhost:4174'));
