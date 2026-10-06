import type {DatabaseSync} from 'node:sqlite';
export type PageOptions={limit?:number;after?:number|string|null;includeSynthetic?:boolean};
export type ListOptions=PageOptions&{status?:string;query?:string};
export function pageLimit(value:unknown=50):number {if(!Number.isSafeInteger(value)||Number(value)<1||Number(value)>200)throw new Error('INVALID_LIMIT');return Number(value);}
export function integerCursor(value:unknown):number {if(value===undefined||value===null)return 0;if(!Number.isSafeInteger(value)||Number(value)<1)throw new Error('INVALID_CURSOR');return Number(value);}
export function syntheticFlag(value:unknown):number {if(value!==undefined&&typeof value!=='boolean')throw new Error('INVALID_FILTER');return Number(value??false);}
export function page<T>(rows:T[],limit:number,cursor:(row:T)=>unknown) {const more=rows.length>limit;const items=rows.slice(0,limit);return {items,nextCursor:more?cursor(items.at(-1)!):null};}
const latest="(SELECT d.status FROM decisions d WHERE d.observation_id=o.id ORDER BY d.sequence DESC LIMIT 1)";
const accepted=`o.purchasable=1 AND ${latest}='accepted' AND (?=1 OR o.synthetic=0)`;
export function listObservations(db:DatabaseSync,options:ListOptions={}) {
 const limit=pageLimit(options.limit),after=integerCursor(options.after),syn=syntheticFlag(options.includeSynthetic);
 const status=options.status??'',query=options.query??'';
 if(typeof status!=='string'||!['','accepted','uncertain','rejected'].includes(status))throw new Error('INVALID_STATUS');
 if(typeof query!=='string'||query.length>200)throw new Error('INVALID_QUERY');
 const rows=db.prepare(`SELECT o.rowid AS cursor,o.id,o.observed_at AS observedAt,o.synthetic,o.price_minor AS priceMinor,
  json_extract(o.payload,'$.url') AS url,json_extract(o.payload,'$.context.product') AS product,
  json_extract(o.payload,'$.context.seller') AS seller,${latest} AS status,
  (SELECT reason FROM decisions WHERE observation_id=o.id ORDER BY sequence DESC LIMIT 1) AS reason
  FROM observations o WHERE (?=1 OR o.synthetic=0) AND (?=0 OR o.rowid<?) AND (?='' OR ${latest}=?)
  AND (?='' OR instr(lower(json_extract(o.payload,'$.context.product')||' '||json_extract(o.payload,'$.url')),lower(?))>0)
  ORDER BY o.rowid DESC LIMIT ?`).all(syn,after,after,status,status,query,query,limit+1);
 return page(rows.map(r=>({...r,synthetic:!!r.synthetic,product:JSON.parse(String(r.product))})),limit,r=>r.cursor);
}
export function summary(db:DatabaseSync,options:PageOptions={}) {
 const rows=db.prepare(`SELECT ${latest} AS status,count(*) AS count FROM observations o WHERE (?=1 OR o.synthetic=0) GROUP BY status`).all(syntheticFlag(options.includeSynthetic));
 const result={total:0,accepted:0,uncertain:0,rejected:0};for(const r of rows){result[String(r.status)]=Number(r.count);result.total+=Number(r.count);}return result;
}
export function offerHistory(db:DatabaseSync,options:PageOptions={}) {
 const limit=pageLimit(options.limit),after=options.after??'',syn=syntheticFlag(options.includeSynthetic);
 if(typeof after!=='string'||after.length>32768)throw new Error('INVALID_CURSOR');
 const rows=db.prepare(`SELECT o.offer_key AS offerKey,count(*) AS sampleCount,min(o.price_minor) AS lowestObservedMinor,
 max(o.price_minor) AS highestObservedMinor,min(o.observed_at) AS firstObservedAt,max(o.observed_at) AS lastObservedAt,
 max(o.synthetic) AS containsSynthetic FROM observations o WHERE ${accepted} AND o.offer_key>? GROUP BY o.offer_key ORDER BY o.offer_key LIMIT ?`).all(syn,after,limit+1);
 const items=rows.map(r=>{const c=db.prepare(`SELECT o.payload,o.price_minor FROM observations o WHERE ${accepted} AND o.offer_key=? ORDER BY o.observed_at DESC,o.id DESC LIMIT 1`).get(syn,r.offerKey)!;const capture=JSON.parse(String(c.payload));return {...r,url:capture.url,...capture.context,currency:'USD',priceBasis:'item-only',latestObservedMinor:c.price_minor,containsSynthetic:!!r.containsSynthetic};});
 return page(items,limit,r=>r.offerKey);
}
export function series(db:DatabaseSync,key:string,options:PageOptions={}) {
 const limit=pageLimit(options.limit),syn=syntheticFlag(options.includeSynthetic);let after=['',''];
 if(typeof key!=='string'||key.length>32768)throw new Error('INVALID_OFFER_KEY');
 if(options.after!=null){try{after=JSON.parse(String(options.after));}catch{throw new Error('INVALID_CURSOR');}if(!Array.isArray(after)||after.length!==2||after.some(x=>typeof x!=='string'||x.length>200))throw new Error('INVALID_CURSOR');}
 const rows=db.prepare(`SELECT o.id,o.observed_at AS observedAt,o.price_minor AS priceMinor,o.synthetic FROM observations o WHERE ${accepted} AND o.offer_key=? AND (o.observed_at,o.id)>(?,?) ORDER BY o.observed_at,o.id LIMIT ?`).all(syn,key,...after,limit+1);
 return page(rows.map(r=>({...r,synthetic:!!r.synthetic})),limit,r=>JSON.stringify([r.observedAt,r.id]));
}
export function decisions(db:DatabaseSync,id:string,options:PageOptions={}) {
 const limit=pageLimit(options.limit),after=integerCursor(options.after);
 const rows=db.prepare('SELECT sequence,status,reason,decided_at AS decidedAt FROM decisions WHERE observation_id=? AND sequence>? ORDER BY sequence LIMIT ?').all(id,after,limit+1);
 const result=page(rows,limit,r=>r.sequence);
 return {decisions:result.items,nextCursor:result.nextCursor,decisionCount:db.prepare('SELECT count(*) AS n FROM decisions WHERE observation_id=?').get(id)!.n,currentStatus:db.prepare('SELECT status FROM decisions WHERE observation_id=? ORDER BY sequence DESC LIMIT 1').get(id)!.status};
}
