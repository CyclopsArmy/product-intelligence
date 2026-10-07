import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {capture,NOW} from './helpers.ts';
import {ObservationStore} from '../src/store.ts';
const run=(args:string[])=>spawnSync(process.execPath,['src/cli.ts',...args],{encoding:'utf8'});
const output=(args:string[])=>{const result=run(args);assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);};

test('CLI pages exact-offer history and tied timeline points with corrections and synthetic exclusion',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-cli-history-')),db=join(dir,'db.sqlite');
 const store=new ObservationStore(db);
 try{
  store.ingest(capture({id:'b'}),NOW);
  const low=capture({id:'a'});for(const candidate of low.candidates)candidate.price='799.00';store.ingest(low,NOW);
  const other=capture({id:'c'});other.context.seller='Other Retail';for(const candidate of other.candidates)candidate.seller='Other Retail';store.ingest(other,NOW);
  const base=['--db',db,'--include-synthetic','--limit','1'];
  assert.deepEqual(output(['history-page','--db',db]),{items:[],nextCursor:null});
  const first=output(['history-page',...base]);assert.equal(first.items.length,1);assert.equal(first.items[0].seller,'Example Retail');assert.equal(first.items[0].sampleCount,2);assert.equal(first.items[0].lowestObservedMinor,79900);assert.equal(first.items[0].latestObservedMinor,89999);assert.equal(first.nextCursor,first.items[0].offerKey);
  const second=output(['history-page',...base,'--after',first.nextCursor]);assert.equal(second.items.length,1);assert.equal(second.items[0].seller,'Other Retail');assert.equal(second.nextCursor,null);
  const key=first.items[0].offerKey;
  assert.deepEqual(output(['series','--db',db,'--offer-key',key]),{items:[],nextCursor:null});
  const points=output(['series',...base,'--offer-key',key]);assert.equal(points.items[0].id,'a');assert.equal(points.items[0].priceMinor,79900);assert.ok(points.nextCursor);
  const next=output(['series',...base,'--offer-key',key,'--after',points.nextCursor]);assert.equal(next.items[0].id,'b');assert.equal(next.nextCursor,null);
  store.decide('b','rejected','WRONG_PRODUCT');
  const corrected=output(['history-page',...base]);assert.equal(corrected.items[0].sampleCount,1);assert.equal(corrected.items[0].latestObservedMinor,79900);
  assert.deepEqual(output(['series',...base,'--offer-key',key,'--after',points.nextCursor]),{items:[],nextCursor:null});
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('CLI paged history aggregates all observations beyond the legacy guard',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-cli-volume-')),db=join(dir,'db.sqlite'),store=new ObservationStore(db);
 try{
  for(let i=0;i<10001;i++){
   const input=capture({id:'sample-'+String(i).padStart(5,'0')});
   if(i===10000)for(const candidate of input.candidates)candidate.price='10.00';
   store.ingest(input,NOW);
  }
  const legacy=run(['history','--db',db,'--include-synthetic']);assert.equal(legacy.status,1);assert.match(legacy.stderr,/HISTORY_LIMIT_REACHED/);
  const result=output(['history-page','--db',db,'--include-synthetic','--limit','1']);
  assert.equal(result.items.length,1);assert.equal(result.nextCursor,null);
  assert.equal(result.items[0].sampleCount,10001);assert.equal(result.items[0].lowestObservedMinor,1000);assert.equal(result.items[0].highestObservedMinor,89999);assert.equal(result.items[0].latestObservedMinor,1000);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('CLI history pages reject malformed bounds and series cursors without echoing inputs',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-cli-bounds-')),db=join(dir,'db.sqlite');
 try{
  const cases:[string[],string][]=[
   [['history-page','--limit','201'],'INVALID_LIMIT'],[['history-page','--limit','0'],'INVALID_ARGUMENT'],
   [['history-page','--limit','1.5'],'INVALID_ARGUMENT'],[['history-page','--limit','1e2'],'INVALID_ARGUMENT'],
   [['history-page','--limit','9007199254740992'],'INVALID_LIMIT'],[['series'],'MISSING_ARGUMENT'],
   [['series','--offer-key','example','--after','private-cursor'],'INVALID_CURSOR'],[['series','--offer-key','example','--after','[1,2]'],'INVALID_CURSOR']
  ];
  for(const [args,error] of cases){
   const result=run([...args,'--db',db]);assert.equal(result.status,1);assert.equal(JSON.parse(result.stderr).error,error);assert.doesNotMatch(result.stderr,/private-cursor/);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI imports, inspects, filters and corrects observation',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-cli-')),db=join(dir,'db.sqlite'),file=join(dir,'capture.json');writeFileSync(file,JSON.stringify(capture()));
 try {
  const imported=run(['import-json','--file',file,'--db',db,'--at',NOW]);assert.equal(imported.status,0,imported.stderr);assert.equal(JSON.parse(imported.stdout).evaluation.status,'accepted');
  assert.equal(JSON.parse(run(['inspect','--id','fixture-001','--db',db]).stdout).capture.synthetic,true);
  assert.deepEqual(JSON.parse(run(['history','--db',db]).stdout),[]);
  assert.equal(JSON.parse(run(['history','--include-synthetic','--db',db]).stdout).length,1);
  assert.equal(run(['decide','--id','fixture-001','--status','uncertain','--reason','RECHECK_REQUIRED','--db',db]).status,0);
  assert.deepEqual(JSON.parse(run(['history','--include-synthetic','--db',db]).stdout),[]);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI rejects malformed flags',()=>{for(const args of [[],['fetch','https://amazon.com/x'],['history','--secret','x'],['import-json'],['history','--db','--include-synthetic']]){const r=run(args);assert.notEqual(r.status,0);assert.match(r.stderr,/"error"/);}});
test('CLI does not echo raw private input on parse error',()=>{const dir=mkdtempSync(join(tmpdir(),'pi-invalid-')),file=join(dir,'input.json');writeFileSync(file,'private-account-token: INVALID');try{const r=run(['evaluate','--file',file]);assert.notEqual(r.status,0);assert.ok(!r.stderr.includes('private-account-token'));assert.ok(!r.stderr.includes(dir));}finally{rmSync(dir,{recursive:true,force:true});}});
test('benchmark labels synthetic results and passes expected decisions',()=>{const r=spawnSync(process.execPath,['scripts/benchmark.ts'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const b=JSON.parse(r.stdout);assert.equal(b.provenance,'synthetic');assert.equal(b.liveRetailerClaims,false);assert.equal(b.failures,0);assert.ok(b.total>=10);assert.ok(b.coverage<1);});
test('CLI inspect can page through correction events',()=>{const dir=mkdtempSync(join(tmpdir(),'pi-cli-page-')),db=join(dir,'db.sqlite'),file=join(dir,'capture.json');writeFileSync(file,JSON.stringify(capture()));try{assert.equal(run(['import-json','--file',file,'--db',db,'--at',NOW]).status,0);assert.equal(run(['decide','--id','fixture-001','--status','uncertain','--reason','RECHECK_REQUIRED','--db',db]).status,0);const first=run(['inspect','--id','fixture-001','--db',db,'--limit','1']);assert.equal(first.status,0,first.stderr);const page=JSON.parse(first.stdout);assert.equal(page.decisions.length,1);const second=run(['inspect','--id','fixture-001','--db',db,'--limit','1','--after',String(page.nextCursor)]);assert.equal(second.status,0,second.stderr);assert.equal(JSON.parse(second.stdout).decisions[0].reason,'RECHECK_REQUIRED');assert.equal(run(['inspect','--id','fixture-001','--db',db,'--limit','-1']).status,1);}finally{rmSync(dir,{recursive:true,force:true});}});
