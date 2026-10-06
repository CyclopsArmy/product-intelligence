import type {DatabaseSync,SQLOutputValue} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {canonicalUrl} from './validation.ts';
export type TargetInput={url:string;label:string;targetMinor:number|null};
type TargetRow=TargetInput&{id:string;archived:number;createdAt:string;updatedAt:string};
export function validateTarget(input:unknown):TargetInput {
 const v=input as TargetInput;if(!v||typeof v!=='object')throw new Error('INVALID_TARGET');
 const url=canonicalUrl(v.url);if(url.length>2048)throw new Error('UNSAFE_URL');
 if(typeof v.label!=='string'||!v.label.trim()||v.label.length>120||/[\x00-\x1f\x7f]/.test(v.label))throw new Error('INVALID_LABEL');
 if(v.targetMinor!==null&&(!Number.isSafeInteger(v.targetMinor)||v.targetMinor<1))throw new Error('INVALID_TARGET_PRICE');
 return {url,label:v.label.trim(),targetMinor:v.targetMinor};
}
const select='SELECT id,url,label,target_minor AS targetMinor,archived,created_at AS createdAt,updated_at AS updatedAt FROM watch_targets';
function map(row:Record<string,SQLOutputValue>){const r=row as TargetRow;return {...r,archived:!!r.archived};}
export function targets(db:DatabaseSync,options:{includeArchived?:boolean}={}) {if(options.includeArchived!==undefined&&typeof options.includeArchived!=='boolean')throw new Error('INVALID_FILTER');return db.prepare(select+' WHERE (?=1 OR archived=0) ORDER BY created_at,id').all(Number(options.includeArchived??false)).map(map);}
export function saveTarget(db:DatabaseSync,input:unknown) {
 const v=validateTarget(input);const old=db.prepare('SELECT id FROM watch_targets WHERE url=?').get(v.url);
 if(!old&&Number(db.prepare('SELECT count(*) AS n FROM watch_targets').get()!.n)>=1000)throw new Error('TARGET_LIMIT_REACHED');
 const now=new Date().toISOString();db.prepare(`INSERT INTO watch_targets(id,url,label,target_minor,archived,created_at,updated_at) VALUES (?,?,?,?,0,?,?) ON CONFLICT(url) DO UPDATE SET label=excluded.label,target_minor=excluded.target_minor,updated_at=excluded.updated_at`).run(randomUUID(),v.url,v.label,v.targetMinor,now,now);
 return map(db.prepare(select+' WHERE url=?').get(v.url)!);
}
export function archiveTarget(db:DatabaseSync,id:string,archived:boolean) {if(typeof archived!=='boolean')throw new Error('INVALID_ARCHIVE_STATE');const r=db.prepare('UPDATE watch_targets SET archived=?,updated_at=? WHERE id=?').run(Number(archived),new Date().toISOString(),id);if(!r.changes)throw new Error('NOT_FOUND');return map(db.prepare(select+' WHERE id=?').get(id)!);}
