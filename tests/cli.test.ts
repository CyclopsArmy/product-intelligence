import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {capture,NOW} from './helpers.ts';
const run=(args:string[])=>spawnSync(process.execPath,['src/cli.ts',...args],{encoding:'utf8'});
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
