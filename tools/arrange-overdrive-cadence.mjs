import {checkGuitarArrangements,writeOverdriveCadence} from './arrange-guitar-leads.mjs';
const args=process.argv.slice(2);
if(args.length!==1||!['--check','--write'].includes(args[0])){console.error('Use --check or --write; only overdrive.mid is written.');process.exitCode=2;}
else{
 const result=args[0]==='--write'?await writeOverdriveCadence():(await checkGuitarArrangements()).files.find(row=>row.id==='overdrive');
 console.log(JSON.stringify(result,null,2));if(args[0]==='--check'&&!result.matches)process.exitCode=1;
}
