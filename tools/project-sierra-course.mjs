// Read-only conversion CLI. This file prints data and never overwrites a course.
import {readFile} from 'node:fs/promises';
import {projectSierraCoordinates,SIERRA_SOURCE_POINTS} from '../src/courses/sierra50.js';
const args=process.argv.slice(2),options={};let input=null;
const keys={'--earth-radius':'earthRadius','--scale':'horizontalDivisor','--height-exaggeration':'verticalExaggeration','--gate-offset':'gateHeightOffset','--round':'roundDecimals'};
try{
 for(let i=0;i<args.length;i++){const key=args[i];if(key==='--input'){if(!args[i+1])throw Error('Missing local JSON input');input=args[++i];}else if(Object.hasOwn(keys,key)){if(!args[i+1])throw Error('Missing numeric value');options[keys[key]]=Number(args[++i]);}else throw Error('Unknown option: '+key);}
 const source=input?JSON.parse(await readFile(input,'utf8')):SIERRA_SOURCE_POINTS;
 console.log(JSON.stringify(projectSierraCoordinates(source,options),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
