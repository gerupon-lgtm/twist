import {readFile,writeFile} from 'node:fs/promises';
const path=new URL('../public/music/tracks.json',import.meta.url);
const data=JSON.parse(await readFile(path,'utf8'));
for(const track of Object.values(data))if(track?.file?.endsWith('.mid'))for(const [channel,part]of Object.entries(track.parts)){
  part.fmPreset=Number(channel)===10?null:part.sccTimbre==='distortion-guitar-v1'?'distortion-guitar':part.role==='bass'?'bass':part.role==='chords'?'chords':'lead';
}
data.overdrive.parts['1'].fmPreset='minimoog-lead';
data.overdrive.parts['1'].fmTranspose=-12;
data.overdrive.parts['2'].fmPreset='pipe-organ';data.overdrive.parts['2'].fmVolume=90;
await writeFile(path,JSON.stringify(data,null,2)+'\n');
