import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateClearJingles,PROTECTED_MIDI_FILES} from './clear-jingles.mjs';

const defaultDirectory=fileURLToPath(new URL('../public/music/',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const allowlist=Object.freeze(['clear-ignition.mid','clear-advance.mid','clear-overdrive.mid']);
async function protectedHashes(directory){
 return Object.fromEntries(await Promise.all(PROTECTED_MIDI_FILES.map(async file=>[file,hash(await readFile(resolve(directory,file)))])));
}
export async function checkClearJingles(directory=defaultDirectory){
 const files=[];
 for(const [id,generated]of Object.entries(generateClearJingles())){
  const file=id+'.mid';if(!allowlist.includes(file)||PROTECTED_MIDI_FILES.includes(file))throw new Error('Non-allowlisted new MIDI filename');
  let existing=null;try{existing=await readFile(resolve(directory,file));}catch(error){if(error.code!=='ENOENT')throw error;}
  files.push({file,bytes:generated.length,generatedSha256:hash(generated),existingSha256:existing?hash(existing):null,matches:Boolean(existing)&&existing.equals(generated)});
 }
 return {matches:files.every(file=>file.matches),files,readOnly:true};
}
export async function writeClearJingles(directory=defaultDirectory){
 const before=await protectedHashes(directory);await mkdir(directory,{recursive:true});const files=[];
 for(const [id,bytes]of Object.entries(generateClearJingles())){
  const file=id+'.mid';if(!allowlist.includes(file)||PROTECTED_MIDI_FILES.includes(file))throw new Error('Non-allowlisted new MIDI filename');
  await writeFile(resolve(directory,file),bytes);files.push({file,bytes:bytes.length,sha256:hash(bytes)});
 }
 const after=await protectedHashes(directory),protectedUnchanged=PROTECTED_MIDI_FILES.every(file=>before[file]===after[file]);
 if(!protectedUnchanged)throw new Error('Protected original MIDI changed during new-jingle generation');
 return {files,protectedUnchanged,protectedCount:PROTECTED_MIDI_FILES.length,protectedHashes:after};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length!==1||!['--check','--write'].includes(args[0])){
  console.error('Use --check (read only) or --write (only the three new clear MID files). No legacy generator is executed.');process.exitCode=2;
 }else{
  const result=args[0]==='--write'?await writeClearJingles():await checkClearJingles();console.log(JSON.stringify(result,null,2));
  if(args[0]==='--check'&&!result.matches)process.exitCode=1;
 }
}
