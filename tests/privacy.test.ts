import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const script=resolve('scripts/privacy-check.ts');
function repo(fn) {
 const dir=mkdtempSync(join(tmpdir(),'pi-privacy-'));
 const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:'pipe'});
 try{git('init','-b','test');git('config','user.name','Project Maintainers');git('config','user.email','maintainers@example.invalid');git('commit','--allow-empty','-m','test');fn(dir,git,()=>spawnSync(process.execPath,[script],{cwd:dir,encoding:'utf8'}));}
 finally{rmSync(dir,{recursive:true,force:true});}
}
test('privacy scan rejects committed environment variants',()=>repo((dir,git,scan)=>{writeFileSync(join(dir,'.env.production'),'DATABASE_PASSWORD=example-value\n');git('add','.env.production');git('commit','-m','test environment');const r=scan();assert.equal(r.status,1);assert.match(r.stdout,/private artifact path/);}));
test('privacy scan checks staged bytes even with clean working content',()=>repo((dir,git,scan)=>{writeFileSync(join(dir,'config.txt'),'ghp_'+'A'.repeat(36));git('add','config.txt');writeFileSync(join(dir,'config.txt'),'safe example');const r=scan();assert.equal(r.status,1);assert.match(r.stdout,/potential credential/);}));
test('privacy scan permits placeholder env example',()=>repo((dir,git,scan)=>{writeFileSync(join(dir,'.env.example'),'MODE=offline\n');git('add','.env.example');const r=scan();assert.equal(r.status,0,r.stdout+r.stderr);}));
test('privacy scan rejects staged private captures even after deletion',()=>repo((dir,git,scan)=>{writeFileSync(join(dir,'session.har'),'{}');git('add','session.har');rmSync(join(dir,'session.har'));assert.equal(scan().status,1);}));
test('privacy scan checks historical paths even when blob is reused under safe name',()=>repo((dir,git,scan)=>{
 writeFileSync(join(dir,'.env.production'),'example-value');git('add','.env.production');git('commit','-m','environment');
 git('mv','.env.production','settings.txt');git('commit','-m','rename');
 const r=scan();assert.equal(r.status,1);assert.match(r.stdout,/history: private artifact path/);
}));
test('privacy scan permits GitHub web committer with private author email',()=>repo((dir,git,scan)=>{
 git('config','user.name','GitHub');git('config','user.email','noreply@github.com');
 git('commit','--allow-empty','--author=sample-project <12345+sample-project@users.noreply.github.com>','-m','web edit');
 const r=scan();assert.equal(r.status,0,r.stdout+r.stderr);
}));
test('privacy scan rejects a personal display name paired with a noreply email',()=>repo((dir,git,scan)=>{
 git('commit','--allow-empty','--author=Example Person <12345+sample-project@users.noreply.github.com>','-m','bad identity');
 const r=scan();assert.equal(r.status,1);assert.match(r.stdout,/unapproved author metadata/);
}));
test('privacy scan rejects a personal email even for the GitHub display name',()=>repo((dir,git,scan)=>{
 git('commit','--allow-empty','--author=GitHub <example-person@example.com>','-m','bad identity');
 const r=scan();assert.equal(r.status,1);assert.match(r.stdout,/unapproved author metadata/);
}));
test('privacy scan rejects a staged logical backup outside ignored folders',()=>repo((dir,git,scan)=>{writeFileSync(join(dir,'research.pi-backup.json'),'{}');git('add','research.pi-backup.json');assert.equal(scan().status,1);}));

test('privacy scan rejects browser reports, traces and alternate screenshot formats',()=>{
 for(const path of ['playwright-report/index.html','test-results/session.txt','screen.jpeg','screen.webp','session.trace','recording.webm'])repo((dir,git,scan)=>{
  if(path.includes('/'))mkdirSync(join(dir,path.split('/')[0]));
  writeFileSync(join(dir,path),'synthetic private artifact');git('add',path);
  const result=scan();assert.equal(result.status,1,path);assert.match(result.stdout,/private artifact path/);
 });
});
