import {readFileSync,statSync,writeFileSync} from 'node:fs';
import {restoreArchive,ARCHIVE_BYTES} from './archive.ts';
import {evaluate} from './engine.ts';
import {captureHtml} from './extract.ts';
import {ObservationStore} from './store.ts';
import type {CaptureMetadata} from './extract.ts';
import type {Status} from './types.ts';

function read(path:string, json=true, maxBytes=2*1024*1024) {
  if(statSync(path).size>maxBytes)throw new Error('FILE_TOO_LARGE');
  const content=readFileSync(path,'utf8');
  if(content.includes('\uFFFD'))throw new Error('INVALID_ENCODING');
  if(!json)return content;
  try{return JSON.parse(content);}catch{throw new Error('INVALID_JSON');}
}
const allowed:Record<string,string[]>={
  evaluate:['file','at'], 'import-json':['file','at','db'], 'import-html':['file','metadata','at','db'],
  backup:['file','db'],restore:['file','db'],inspect:['id','db','after','limit'],history:['include-synthetic','db'],decide:['id','status','reason','db'],help:[]
};
function main() {
  const [command,...args]=process.argv.slice(2);
  if(!command || !Object.hasOwn(allowed,command))throw new Error('INVALID_COMMAND');
  const options:Record<string,string|boolean>={};
  for(let i=0;i<args.length;i++) {
    const key=args[i].startsWith('--')?args[i].slice(2):'';
    if(!allowed[command].includes(key) || Object.hasOwn(options,key))throw new Error('INVALID_ARGUMENT');
    if(key==='include-synthetic'){options[key]=true;continue;}
    if(!args[i+1] || args[i+1].startsWith('--'))throw new Error('MISSING_ARGUMENT');
    options[key]=args[++i];
  }
  const required=(key:string):string=>{if(typeof options[key]!=='string')throw new Error('MISSING_ARGUMENT');return options[key] as string;};
  const now=typeof options.at==='string'?options.at:new Date().toISOString();
  if(command==='help')return {commands:allowed,description:'Offline evidence inspection. No network requests. --at replays a historical capture at an explicit evaluation time; it does not make the price current.'};
  if(command==='evaluate')return {...evaluate(read(required('file')),now),evaluationTime:now,historicalReplay:!!options.at};
  if(command==='restore')return restoreArchive(read(required('file'),true,ARCHIVE_BYTES),required('db'));
  if(command==='backup')required('file');
  let input;
  if(command==='import-json')input=read(required('file'));
  if(command==='import-html')input=captureHtml(read(required('file'),false) as string,read(required('metadata')) as CaptureMetadata);
  if(['inspect','decide'].includes(command))required('id');
  if(command==='decide'){required('status');required('reason');}
  const store=new ObservationStore(typeof options.db==='string'?options.db:'data/observations.sqlite');
  try {
    if(command==='backup'){const data=store.exportArchive();try{writeFileSync(required('file'),JSON.stringify(data),{flag:'wx',mode:0o600});}catch(e){if(e.code==='EEXIST')throw new Error('DESTINATION_EXISTS');throw e;}return {saved:true,observations:data.observations.length,targets:data.targets.length};}
    if(command.startsWith('import-'))return {...store.ingest(input,now),evaluationTime:now,historicalReplay:!!options.at};
    if(command==='inspect'){const pageNumber=(key:string)=>{if(options[key]===undefined)return undefined;const raw=required(key);if(!/^[1-9][0-9]*$/.test(raw))throw new Error('INVALID_ARGUMENT');return Number(raw);};return store.inspect(required('id'),{after:pageNumber('after'),limit:pageNumber('limit')});}
    if(command==='history')return store.history({includeSynthetic:options['include-synthetic']===true});
    if(command==='decide')return store.decide(required('id'),required('status') as Status,required('reason'));
  }finally{store.close();}
}
try{process.stdout.write(JSON.stringify(main(),null,2)+'\n');}
catch(e){const message=e instanceof Error?e.message:'';const code=/^[A-Z][A-Z0-9_]{2,79}$/.test(message)?message:'COMMAND_FAILED';process.stderr.write(JSON.stringify({error:code,hint:'Run npm run cli -- help. Raw input and local paths are omitted from errors.'})+'\n');process.exitCode=1;}
