import type {Capture, ProductIdentity} from './types.ts';

export function parseMoney(value:unknown):number {
  if(typeof value !== 'string' && typeof value !== 'number') throw new Error('INVALID_PRICE');
  const s=String(value);
  if(!/^(?:\d+|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s))throw new Error('INVALID_PRICE');
  const [whole,fraction='']=s.replaceAll(',','').split('.');
  const minor=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
  if(minor<=0n || minor>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('INVALID_PRICE');
  return Number(minor);
}
export function canonicalUrl(value:unknown):string {
  if(typeof value!=='string' || value.length>2048 || /[\s\\]/.test(value) || /%(?:2f|5c|00)/i.test(value)) throw new Error('UNSAFE_URL');
  const u=new URL(value);
  if(u.protocol!=='https:' || u.username || u.password || u.port || u.search || u.hash)throw new Error('UNSAFE_URL');
  if(!['bestbuy.com','www.bestbuy.com','amazon.com','www.amazon.com','newegg.com','www.newegg.com'].includes(u.hostname))throw new Error('UNSUPPORTED_HOST');
  u.hostname=u.hostname.replace(/^www\./,'');
  u.pathname=u.pathname.replace(/\/$/,'') || '/';
  return u.toString();
}
export function validGtin(value:unknown):boolean {
  if(typeof value!=='string' || !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) || /^0+$/.test(value)) return false;
  const digits=value.slice(0,-1).split('').reverse().map(Number);
  const sum=digits.reduce((n,d,i)=>n+d*(i%2===0?3:1),0);
  return (10-sum%10)%10===Number(value.at(-1));
}
export function timestamp(value:unknown):number {
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) throw new Error('INVALID_TIMESTAMP');
  const n=Date.parse(value);
  if(!Number.isFinite(n) || new Date(n).toISOString()!==value)throw new Error('INVALID_TIMESTAMP');
  return n;
}
function record(value:unknown):asserts value is Record<string,unknown> {
  if(!value || typeof value!=='object' || Array.isArray(value))throw new Error('INVALID_OBJECT');
}
function keys(value:Record<string,unknown>, allowed:string[],required=allowed) {
  if(Object.keys(value).some(k=>!allowed.includes(k)) || required.some(k=>!Object.hasOwn(value,k))) throw new Error('INVALID_FIELDS');
}
function textOrNull(value:unknown,max=160) {
  if(value!==null && (typeof value!=='string' || !value.trim() || value.length>max || /[\x00-\x1f\x7f]/.test(value)))throw new Error('INVALID_TEXT');
}
function identity(value:unknown) {
  record(value);keys(value,['brand','model','mpn','gtin','variant']);
  Object.values(value).forEach(v=>textOrNull(v));
  if(value.gtin!==null && !validGtin(value.gtin))throw new Error('INVALID_GTIN');
}
function context(value:unknown) {
  record(value);identity(value.product);
  for(const field of ['seller','condition','eligibility','fulfillment'])textOrNull(value[field]);
}
export function validateCapture(input:unknown,now:string):Capture {
  record(input);
  const fields=['schemaVersion','id','url','observedAt','sourceObservedAt','method','synthetic','context','candidates','issues'];
  keys(input,[...fields,'contentHash'],fields);
  if(input.schemaVersion!==1 || typeof input.id!=='string' || !/^[A-Za-z0-9_-]{1,80}$/.test(input.id))throw new Error('INVALID_CAPTURE_ID');
  canonicalUrl(input.url);
  if(typeof input.method!=='string' || !['synthetic-fixture','saved-html','api'].includes(input.method) || typeof input.synthetic!=='boolean' || (input.method==='synthetic-fixture')!==input.synthetic)throw new Error('INVALID_PROVENANCE');
  const observed=timestamp(input.observedAt), at=timestamp(now);
  if(observed>at+300000 || observed<at-86400000)throw new Error('STALE_OR_FUTURE_OBSERVATION');
  if(input.sourceObservedAt!==null) {const source=timestamp(input.sourceObservedAt);if(source>observed+300000 || source<observed-86400000)throw new Error('STALE_OR_FUTURE_SOURCE');}
  context(input.context); keys(input.context as Record<string,unknown>,['product','seller','condition','eligibility','fulfillment']);
  if(input.contentHash!==undefined && (typeof input.contentHash!=='string' || !/^[a-f0-9]{64}$/.test(input.contentHash)))throw new Error('INVALID_HASH');
  if(!Array.isArray(input.issues) || input.issues.length>100 || input.issues.some(x=>typeof x!=='string' || !/^[A-Z0-9_]{1,80}$/.test(x)))throw new Error('INVALID_ISSUES');
  if(!Array.isArray(input.candidates) || input.candidates.length>100)throw new Error('INVALID_CANDIDATES');
  for(const c of input.candidates) {
    record(c); keys(c,['product','seller','condition','eligibility','fulfillment','price','currency','availability','role','source','origin','locator']);context(c);
    for(const k of ['currency','availability','role','locator'])textOrNull(c[k],300);
    if(typeof c.role!=='string' || typeof c.locator!=='string')throw new Error('INVALID_EVIDENCE');
    if(c.price!==null && typeof c.price!=='number' && typeof c.price!=='string')throw new Error('INVALID_PRICE');
    if(typeof c.price==='string' && c.price.length>80)throw new Error('INVALID_PRICE');
    const origins={'jsonld':'structured','selected-dom':'rendered','api':'upstream'};
    if(typeof c.source!=='string' || typeof c.origin!=='string' || !Object.hasOwn(origins,c.source) || origins[c.source]!==c.origin)throw new Error('INVALID_ORIGIN');
  }
  return input as unknown as Capture;
}
export function identityKey(p:ProductIdentity):string {
  return JSON.stringify([p.brand?.trim().toLowerCase(),p.gtin?.padStart(14,'0')??null,p.mpn?.trim().toUpperCase(),p.model?.trim().toUpperCase(),p.variant]);
}
