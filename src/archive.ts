import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,mkdirSync,lstatSync,linkSync,openSync,closeSync,fsyncSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {ObservationStore} from './store.ts';
import {timestamp,validateCapture} from './validation.ts';
import {evaluate} from './engine.ts';
import {validateTarget,targets} from './watchlist.ts';

export const ARCHIVE_BYTES=50*1024*1024;
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function fields(v:any,names:string[]) {if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==names.length||names.some(n=>!Object.hasOwn(v,n)))throw new Error('INVALID_ARCHIVE');}
export function exportArchive(db:DatabaseSync) {
 db.exec('BEGIN');try{
  const rows=db.prepare('SELECT id,payload FROM observations ORDER BY rowid LIMIT 5001').all();
  if(rows.length>5000||Number(db.prepare('SELECT count(*) AS n FROM decisions').get()!.n)>50000)throw new Error('ARCHIVE_LIMIT_REACHED');
  const observations=rows.map(r=>({capture:JSON.parse(String(r.payload)),decisions:db.prepare('SELECT status,reason,decided_at AS decidedAt FROM decisions WHERE observation_id=? ORDER BY sequence').all(r.id)}));
  const body={format:'product-intelligence',version:1,createdAt:new Date().toISOString(),observations,targets:targets(db,{includeArchived:true})};
  if(Buffer.byteLength(JSON.stringify(body))>ARCHIVE_BYTES-100)throw new Error('ARCHIVE_LIMIT_REACHED');
  db.exec('COMMIT');return {...body,sha256:hash(body)};
 }catch(e){db.exec('ROLLBACK');throw e;}
}
function validateArchive(input:any) {
 if(Buffer.byteLength(JSON.stringify(input))>ARCHIVE_BYTES)throw new Error('ARCHIVE_LIMIT_REACHED');
 fields(input,['format','version','createdAt','observations','targets','sha256']);
 const {sha256,...body}=input;if(typeof sha256!=='string'||hash(body)!==sha256)throw new Error('ARCHIVE_CHECKSUM_MISMATCH');
 if(body.format!=='product-intelligence'||body.version!==1)throw new Error('INVALID_ARCHIVE_VERSION');
 const created=timestamp(body.createdAt);if(!Array.isArray(body.observations)||!Array.isArray(body.targets)||body.observations.length>5000||body.targets.length>1000)throw new Error('ARCHIVE_LIMIT_REACHED');
 const ids=new Set(),urls=new Set(),targetIds=new Set();let decisionCount=0;
 for(const row of body.observations){
  fields(row,['capture','decisions']);if(!Array.isArray(row.decisions)||row.decisions.length<1||(decisionCount+=row.decisions.length)>50000)throw new Error('INVALID_ARCHIVE_DECISIONS');
  const initial=row.decisions[0];const capture=validateCapture(row.capture,initial.decidedAt),evaluation=evaluate(capture,initial.decidedAt);
  if(ids.has(capture.id))throw new Error('CAPTURE_ID_CONFLICT');ids.add(capture.id);
  for(let i=0;i<row.decisions.length;i++){
   const d=row.decisions[i];fields(d,['status','reason','decidedAt']);timestamp(d.decidedAt); // Replay time and wall-clock review time are different clocks.
   if(!['accepted','uncertain','rejected'].includes(d.status))throw new Error('INVALID_STATUS');
   if(i===0){if(d.status!==evaluation.status||d.reason!==evaluation.reasons.join(','))throw new Error('INVALID_ORIGINAL_DECISION');}
   else{if(typeof d.reason!=='string'||!/^[A-Z][A-Z0-9_]{2,79}$/.test(d.reason))throw new Error('INVALID_REASON');if(d.status==='accepted'&&evaluation.status!=='accepted')throw new Error('ORIGINAL_NOT_ACCEPTED');}
  }
 }
 for(const target of body.targets){
  fields(target,['id','url','label','targetMinor','archived','createdAt','updatedAt']);const clean=validateTarget(target);
  if(clean.url!==target.url||clean.label!==target.label||typeof target.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(target.id)||typeof target.archived!=='boolean')throw new Error('INVALID_TARGET');
  if(timestamp(target.createdAt)>timestamp(target.updatedAt)||timestamp(target.updatedAt)>created)throw new Error('INVALID_TARGET_TIME');
  if(urls.has(target.url)||targetIds.has(target.id))throw new Error('DUPLICATE_TARGET');urls.add(target.url);targetIds.add(target.id);
 }
 return body;
}
export function restoreArchive(input:unknown,path:string) {
 const body=validateArchive(input);if(path===':memory:')throw new Error('INVALID_DESTINATION');
 const occupied=()=>{for(const suffix of ['', '-wal', '-shm', '-journal']){try{lstatSync(path+suffix);}catch(e){if(e.code==='ENOENT')continue;throw e;}throw new Error('DESTINATION_EXISTS');}};
 occupied();mkdirSync(dirname(path),{recursive:true,mode:0o700});
 const staging=mkdtempSync(join(dirname(path),'.pi-restore-')),stagedPath=join(staging,'restored.sqlite');
 let store:ObservationStore|undefined,db:DatabaseSync|undefined;
 try{
  store=new ObservationStore(stagedPath);db=new DatabaseSync(stagedPath);db.exec('PRAGMA foreign_keys=ON');
  for(const row of body.observations){store.ingest(row.capture,row.decisions[0].decidedAt);for(const d of row.decisions.slice(1))db.prepare('INSERT INTO decisions(observation_id,status,reason,decided_at) VALUES (?,?,?,?)').run(row.capture.id,d.status,d.reason,d.decidedAt);}
  for(const t of body.targets)db.prepare('INSERT INTO watch_targets(id,url,label,target_minor,archived,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').run(t.id,t.url,t.label,t.targetMinor,Number(t.archived),t.createdAt,t.updatedAt);
  if(db.prepare('PRAGMA integrity_check').get()!.integrity_check!=='ok')throw new Error('RESTORE_INTEGRITY_FAILED');
  db.close();db=undefined;store.close();store=undefined;
  const fd=openSync(stagedPath,'r');try{fsyncSync(fd);}finally{closeSync(fd);}
  occupied();linkSync(stagedPath,path); // Atomic, same-filesystem publication; never overwrites.
  return {restored:true,observations:body.observations.length,targets:body.targets.length};
 }catch(e){if(e.code==='EEXIST')throw new Error('DESTINATION_EXISTS');throw e;}
 finally{db?.close();store?.close();rmSync(staging,{recursive:true,force:true});}
}
