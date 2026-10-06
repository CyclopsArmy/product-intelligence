import {DatabaseSync} from 'node:sqlite';
import {exportArchive} from './archive.ts';
import * as queries from './queries.ts';
import * as watchlist from './watchlist.ts';
import {mkdirSync,existsSync,chmodSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {evaluate} from './engine.ts';
import {validateCapture,canonicalUrl,identityKey} from './validation.ts';
import type {Status,Capture,Evaluation} from './types.ts';

function stable(v:unknown):string {
  if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
export class ObservationStore {
  #db:DatabaseSync;
  constructor(path:string) {
    const fresh=!existsSync(path);
    mkdirSync(dirname(path),{recursive:true,mode:0o700});
    this.#db=new DatabaseSync(path);
    if(fresh && path!==':memory:')chmodSync(path,0o600);
    const version=this.#db.prepare('PRAGMA user_version').get()!.user_version;
    if(version!==0 && version!==1 && version!==2){this.#db.close();throw new Error('UNSUPPORTED_DATABASE_VERSION');}
    this.#db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY, content_hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)),
        evaluation TEXT NOT NULL CHECK(json_valid(evaluation)), observed_at TEXT NOT NULL,
        synthetic INTEGER NOT NULL CHECK(synthetic IN (0,1)), offer_key TEXT,
        price_minor INTEGER CHECK(price_minor > 0), purchasable INTEGER NOT NULL CHECK(purchasable IN (0,1))
      ) STRICT;
      CREATE TABLE IF NOT EXISTS decisions (
        sequence INTEGER PRIMARY KEY, observation_id TEXT NOT NULL REFERENCES observations(id),
        status TEXT NOT NULL CHECK(status IN ('accepted','uncertain','rejected')),
        reason TEXT NOT NULL, decided_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS decisions_observation ON decisions(observation_id,sequence DESC);
      CREATE INDEX IF NOT EXISTS observations_history ON observations(offer_key,observed_at);
      CREATE TRIGGER IF NOT EXISTS observations_no_update BEFORE UPDATE ON observations BEGIN SELECT RAISE(ABORT,'IMMUTABLE_OBSERVATION'); END;
      CREATE TRIGGER IF NOT EXISTS observations_no_delete BEFORE DELETE ON observations BEGIN SELECT RAISE(ABORT,'IMMUTABLE_OBSERVATION'); END;
      CREATE TRIGGER IF NOT EXISTS decisions_no_update BEFORE UPDATE ON decisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DECISION'); END;
      CREATE TRIGGER IF NOT EXISTS decisions_no_delete BEFORE DELETE ON decisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DECISION'); END;
      PRAGMA user_version=1;`);
    this.#db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS watch_targets(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,label TEXT NOT NULL,target_minor INTEGER CHECK(target_minor>0),archived INTEGER NOT NULL CHECK(archived IN(0,1)),created_at TEXT NOT NULL,updated_at TEXT NOT NULL) STRICT;
      PRAGMA user_version=2; COMMIT;`);
  }
  ingest(input:unknown,now:string) {
    const capture=validateCapture(input,now);
    const payload=stable(capture),hash=createHash('sha256').update(payload).digest('hex');
    const evaluation=evaluate(capture,now),offer=evaluation.offer;
    const offerKey=offer?stable([canonicalUrl(capture.url),identityKey(offer.product),offer.seller,offer.condition,offer.currency,offer.fulfillment,offer.eligibility]):null;
    this.#db.exec('BEGIN IMMEDIATE');
    try {
      const existing=this.#db.prepare('SELECT content_hash FROM observations WHERE id=?').get(capture.id);
      if(existing){if(existing.content_hash!==hash)throw new Error('CAPTURE_ID_CONFLICT');}
      else {
        this.#db.prepare('INSERT INTO observations (id,content_hash,payload,evaluation,observed_at,synthetic,offer_key,price_minor,purchasable) VALUES (?,?,?,?,?,?,?,?,?)').run(capture.id,hash,payload,JSON.stringify(evaluation),capture.observedAt,Number(capture.synthetic),offerKey,offer?.priceMinor??null,Number(offer?.purchasable??false));
        this.#db.prepare('INSERT INTO decisions(observation_id,status,reason,decided_at) VALUES (?,?,?,?)').run(capture.id,evaluation.status,evaluation.reasons.join(','),now);
      }
      this.#db.exec('COMMIT');
      return {id:capture.id,duplicate:!!existing,evaluation};
    }catch(e){this.#db.exec('ROLLBACK');throw e;}
  }
  inspect(id:string,options:queries.PageOptions={}) {
    const row=this.#db.prepare('SELECT payload,evaluation FROM observations WHERE id=?').get(id);
    if(!row)throw new Error('NOT_FOUND');
    return {capture:JSON.parse(String(row.payload)) as Capture,evaluation:JSON.parse(String(row.evaluation)) as Evaluation,
      ...queries.decisions(this.#db,id,options)};
  }
  decide(id:string,status:Status,reason:string) {
    if(!['accepted','uncertain','rejected'].includes(status))throw new Error('INVALID_STATUS');
    if(!/^[A-Z][A-Z0-9_]{2,79}$/.test(reason))throw new Error('INVALID_REASON');
    const original=this.inspect(id);
    if(status==='accepted' && original.evaluation.status!=='accepted')throw new Error('ORIGINAL_NOT_ACCEPTED');
    this.#db.prepare('INSERT INTO decisions(observation_id,status,reason,decided_at) VALUES (?,?,?,?)').run(id,status,reason,new Date().toISOString());
    return this.inspect(id);
  }
  history(options:{includeSynthetic?:boolean}={}) {
    const rows=this.#db.prepare(`SELECT o.id,o.payload,o.observed_at,o.offer_key,o.price_minor,o.synthetic FROM observations o
      WHERE o.purchasable=1 AND (?=1 OR o.synthetic=0)
      AND (SELECT d.status FROM decisions d WHERE d.observation_id=o.id ORDER BY d.sequence DESC LIMIT 1)='accepted'
      ORDER BY o.observed_at,o.id LIMIT 10001`).all(Number(options.includeSynthetic??false));
    if(rows.length>10000)throw new Error('HISTORY_LIMIT_REACHED');
    const groups=new Map<string,any>();
    for(const r of rows) {
      const key=String(r.offer_key),price=Number(r.price_minor),c=JSON.parse(String(r.payload));
      let g=groups.get(key);
      if(!g){g={offerKey:key,url:canonicalUrl(c.url),product:c.context.product,seller:c.context.seller,condition:c.context.condition,currency:'USD',fulfillment:c.context.fulfillment,eligibility:c.context.eligibility,priceBasis:'item-only',sampleCount:0,lowestObservedMinor:price,highestObservedMinor:price,latestObservedMinor:price,firstObservedAt:r.observed_at,lastObservedAt:r.observed_at,containsSynthetic:false};groups.set(key,g);}
      g.sampleCount++;g.lowestObservedMinor=Math.min(g.lowestObservedMinor,price);g.highestObservedMinor=Math.max(g.highestObservedMinor,price);g.latestObservedMinor=price;g.lastObservedAt=r.observed_at;g.containsSynthetic ||= !!r.synthetic;
    }
    return [...groups.values()];
  }
  list(options:queries.ListOptions={}){return queries.listObservations(this.#db,options);}
  summary(options:queries.PageOptions={}){return queries.summary(this.#db,options);}
  offerHistory(options:queries.PageOptions={}){return queries.offerHistory(this.#db,options);}
  series(key:string,options:queries.PageOptions={}){return queries.series(this.#db,key,options);}
  targets(options:{includeArchived?:boolean}={}){return watchlist.targets(this.#db,options);}
  saveTarget(input:unknown){return watchlist.saveTarget(this.#db,input);}
  archiveTarget(id:string,archived:boolean){return watchlist.archiveTarget(this.#db,id,archived);}
  exportArchive(){return exportArchive(this.#db);}
  close(){this.#db.close();}
}
