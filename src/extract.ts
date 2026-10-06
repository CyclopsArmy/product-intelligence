import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import type {Capture,Candidate,Context} from './types.ts';
export type CaptureMetadata = Omit<Capture,'schemaVersion'|'candidates'|'issues'|'contentHash'>;
type JsonObject = Record<string,any>;
const text=(v:unknown):string|null=>typeof v==='string'&&v.trim()?v:null;
const name=(v:unknown):string|null=>typeof v==='string'?text(v):v&&typeof v==='object'?text((v as JsonObject).name):null;
const tail=(v:unknown):string=>typeof v==='string'?v.split('/').at(-1)!:'';
const isObject=(v:unknown):v is JsonObject=>!!v&&typeof v==='object'&&!Array.isArray(v);
const hasType=(v:JsonObject,t:string):boolean=>[v['@type']].flat().some(x=>tail(x)===t);

export function captureHtml(html:string,metadata:CaptureMetadata):Capture {
  if(Buffer.byteLength(html,'utf8')>2*1024*1024)throw new Error('HTML_TOO_LARGE');
  const parsed=spawnSync(process.env.PYTHON_BIN||'python3',[fileURLToPath(new URL('../scripts/html_capture.py',import.meta.url))],{input:html,encoding:'utf8',maxBuffer:4*1024*1024,timeout:10000});
  if(parsed.status!==0)throw new Error('HTML_PARSE_FAILED');
  const document=JSON.parse(parsed.stdout);
  const issues:string[]=[...document.issues];
  const nodes:JsonObject[]=[];
  function visit(value:unknown,depth=0) {
    if(depth>40 || nodes.length>10000)throw new Error('JSONLD_LIMIT');
    if(Array.isArray(value)){for(const x of value)visit(x,depth+1);}
    else if(isObject(value)){nodes.push(value);for(const x of Object.values(value))if(x&&typeof x==='object')visit(x,depth+1);}
  }
  for(const script of document.scripts)try{visit(JSON.parse(script));}catch{issues.push('MALFORMED_JSONLD');}
  const references=new Map<string,JsonObject>();
  for(const node of nodes)if(typeof node['@id']==='string' && Object.keys(node).length>1){if(references.has(node['@id']))issues.push('DUPLICATE_REFERENCE');references.set(node['@id'],node);}
  function resolve(v:unknown):JsonObject|null {
    if(!isObject(v))return null;
    if(Object.keys(v).length===1 && v['@id']) {const found=references.get(v['@id']);if(!found)issues.push('UNRESOLVED_REFERENCE');return found||null;}
    return v;
  }
  const products=nodes.filter(n=>hasType(n,'Product'));
  if(products.length>1)issues.push('MULTIPLE_PRODUCTS');
  const candidates:Candidate[]=[];
  for(const [index,p] of products.entries()) {
    const gtins=['gtin','gtin8','gtin12','gtin13','gtin14'].map(k=>text(p[k])).filter(Boolean);
    if(new Set(gtins.map(x=>x!.padStart(14,'0'))).size>1)issues.push('CONFLICTING_GTIN');
    const product={brand:name(resolve(p.brand)??p.brand),model:name(p.model),mpn:text(p.mpn),gtin:gtins[0]??null,variant:text(p.sku)?`sku:${p.sku}`:null};
    const offers=Array.isArray(p.offers)?p.offers:[p.offers];
    for(const [j,value] of offers.entries()) {
      const offer=resolve(value);if(!offer){issues.push('MISSING_OFFER');continue;}
      if(hasType(offer,'AggregateOffer')){issues.push('AGGREGATE_OFFER');continue;}
      if(!hasType(offer,'Offer')){issues.push('UNKNOWN_OFFER_TYPE');continue;}
      const conditions:Record<string,string>={NewCondition:'new',UsedCondition:'used',RefurbishedCondition:'refurbished'};
      const stock:Record<string,string>={InStock:'in-stock',OutOfStock:'out-of-stock',PreOrder:'preorder',BackOrder:'backorder'};
      candidates.push({product,seller:name(resolve(offer.seller)??offer.seller),condition:conditions[tail(offer.itemCondition)]??null,availability:stock[tail(offer.availability)]??null,
        price:typeof offer.price==='string'||typeof offer.price==='number'?offer.price:null,currency:text(offer.priceCurrency),eligibility:null,fulfillment:null,role:'current',source:'jsonld',origin:'structured',locator:`jsonld.product[${index}].offers[${j}]`});
    }
  }
  for(const [i,d] of document.selected.entries()) {
    candidates.push({product:{brand:text(d.brand),model:text(d.model),mpn:text(d.mpn),gtin:text(d.gtin),variant:text(d.variant)},seller:text(d.seller),condition:text(d.condition),availability:text(d.availability),price:text(d.price),currency:text(d.currency),eligibility:text(d.eligibility),fulfillment:text(d.fulfillment),role:text(d.role)??'current',source:'selected-dom',origin:'rendered',locator:`selected-offer[${i}]`});
  }
  if(candidates.length>100)issues.push('TOO_MANY_CANDIDATES');
  return {...metadata,schemaVersion:1,candidates:candidates.slice(0,100),issues:[...new Set(issues)],contentHash:createHash('sha256').update(html).digest('hex')};
}
