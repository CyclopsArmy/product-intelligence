import {createServer} from 'node:http';
import type {IncomingMessage} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {ObservationStore} from './store.ts';
import {captureHtml} from './extract.ts';

const MAX_BODY=4*1024*1024;
const assets=new Map([['/', ['index.html','text/html']],['/app.js',['app.js','text/javascript']],['/view.js',['view.js','text/javascript']],['/requests.js',['requests.js','text/javascript']],['/styles.css',['styles.css','text/css']]]);
class HttpError extends Error {status:number;constructor(status:number,code:string){super(code);this.status=status;}}
function fields(value:any,required:string[],optional:string[]=[]) {if(!value||typeof value!=='object'||Array.isArray(value)||required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>![...required,...optional].includes(k)))throw new HttpError(400,'INVALID_FIELDS');}
function body(req:IncomingMessage):Promise<any> {
 if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')throw new HttpError(415,'JSON_REQUIRED');
 if(Number(req.headers['content-length'])>MAX_BODY){req.resume();throw new HttpError(413,'BODY_TOO_LARGE');}
 return new Promise((resolve,reject)=>{const chunks:Buffer[]=[];let size=0,failed=false;
 req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BODY){if(!failed){failed=true;chunks.length=0;reject(new HttpError(413,'BODY_TOO_LARGE'));}}else if(!failed)chunks.push(chunk);});
 req.on('end',()=>{if(failed)return;try{const text=Buffer.concat(chunks).toString('utf8');if(text.includes('\uFFFD'))throw new Error();resolve(JSON.parse(text));}catch{reject(new HttpError(400,'INVALID_JSON'));}});
 req.on('error',()=>reject(new HttpError(400,'INVALID_REQUEST')));req.on('aborted',()=>reject(new HttpError(400,'INVALID_REQUEST')));
 });
}
function numberParam(p:URLSearchParams,key:string):number|undefined {if(!p.has(key))return undefined;const value=p.get(key)!;if(!/^[1-9][0-9]*$/.test(value)||!Number.isSafeInteger(Number(value)))throw new HttpError(400,'INVALID_ARGUMENT');return Number(value);}
function flag(p:URLSearchParams,key:string):boolean {if(p.has(key)&&!['0','1'].includes(p.get(key)!))throw new HttpError(400,'INVALID_FILTER');return p.get(key)==='1';}
function options(p:URLSearchParams,cursor:'integer'|'string'='integer') {return {includeSynthetic:flag(p,'synthetic'),limit:numberParam(p,'limit'),after:cursor==='integer'?numberParam(p,'after'):p.get('after')??undefined};}
function requiredString(value:unknown):string {if(typeof value!=='string'||!value||value.length>32768)throw new HttpError(400,'INVALID_ARGUMENT');return value;}
export async function startApp({dbPath='data/observations.sqlite',port=4317}:{dbPath?:string;port?:number}={}) {
 if(!Number.isInteger(port)||port<0||port>65535)throw new Error('INVALID_PORT');
 const store=new ObservationStore(dbPath),token=randomBytes(32).toString('hex');let origin='';
 const server=createServer({maxHeaderSize:8192,requestTimeout:15000,headersTimeout:10000},async(req,res)=>{
  const json=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  try{
   if(req.headers.host!==new URL(origin).host||req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'ORIGIN_REFUSED');
   if(!['GET','POST'].includes(req.method??''))throw new HttpError(405,'METHOD_NOT_ALLOWED');
   const url=new URL(req.url??'/',origin),path=url.pathname,p=url.searchParams;
   if(path.startsWith('/api/')){
    const supplied=Buffer.from(req.headers.authorization??''),expected=Buffer.from('Bearer '+token);
    if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new HttpError(401,'AUTH_REQUIRED');
    if([...p.keys()].some((k,i,ks)=>ks.indexOf(k)!==i))throw new HttpError(400,'INVALID_ARGUMENT');
    const get=req.method==='GET';let result:any,status=200;
    if(get&&path==='/api/summary')result=store.summary(options(p));
    else if(get&&path==='/api/observations')result=store.list({...options(p),status:p.get('status')??undefined,query:p.get('query')??undefined});
    else if(get&&path==='/api/observation')result=store.inspect(requiredString(p.get('id')),options(p));
    else if(get&&path==='/api/history')result=store.offerHistory(options(p,'string'));
    else if(get&&path==='/api/series')result=store.series(requiredString(p.get('key')),options(p,'string'));
    else if(get&&path==='/api/targets')result=store.targets({includeArchived:flag(p,'archived')});
    else if(!get&&['/api/history','/api/series'].includes(path)){const input=await body(req);fields(input,path==='/api/series'?['key']:[],['after','limit','includeSynthetic']);const {key,...pageOptions}=input;result=path==='/api/series'?store.series(requiredString(key),pageOptions):store.offerHistory(pageOptions);}
    else if(get&&path==='/api/backup'){res.setHeader('Content-Disposition','attachment; filename="product-intelligence.pi-backup.json"');result=store.exportArchive();}
    else if(!get&&['/api/import','/api/import-html','/api/decisions','/api/targets','/api/targets/archive','/api/demo'].includes(path)){
     const input=await body(req);status=201;
     if(path==='/api/import'||path==='/api/import-html'){
      const html=path.endsWith('-html');fields(input,html?['html','metadata']:['capture'],['at']);
      const at=input.at===undefined?new Date().toISOString():requiredString(input.at);
      if(html&&(typeof input.html!=='string'||Buffer.byteLength(input.html)>2*1024*1024))throw new HttpError(413,'HTML_TOO_LARGE');
      result={...store.ingest(html?captureHtml(input.html,input.metadata):input.capture,at),evaluationTime:at,historicalReplay:input.at!==undefined};
     }else if(path==='/api/decisions'){fields(input,['id','status','reason']);result=store.decide(requiredString(input.id),input.status,input.reason);}
     else if(path==='/api/targets'){fields(input,['url','label','targetMinor']);result=store.saveTarget(input);}
     else if(path==='/api/targets/archive'){fields(input,['id','archived']);result=store.archiveTarget(requiredString(input.id),input.archived);}
     else {fields(input,[]);const demo=JSON.parse(readFileSync(new URL('../fixtures/accepted.json',import.meta.url),'utf8'));result=store.ingest(demo,demo.observedAt);}
    }else throw new HttpError(404,'NOT_FOUND');
    json(status,result);return;
   }
   if(req.method!=='GET'||!assets.has(path)||url.search)throw new HttpError(404,'NOT_FOUND');
   const [file,mime]=assets.get(path)!;const bytes=readFileSync(new URL('../web/'+file,import.meta.url));res.writeHead(200,{'Content-Type':mime+'; charset=utf-8'});res.end(bytes);
  }catch(e){const raw=e instanceof Error?e.message:'';const code=/^[A-Z][A-Z0-9_]{2,79}$/.test(raw)?raw:'REQUEST_FAILED';const status=e instanceof HttpError?e.status:code==='NOT_FOUND'?404:code==='CAPTURE_ID_CONFLICT'?409:code==='REQUEST_FAILED'?500:400;if(!res.headersSent)json(status,{error:code});else res.end();}
 });
 server.setTimeout(30000,socket=>socket.destroy());server.maxConnections=32;
 try{await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});}catch(e){store.close();throw e;}
 origin='http://127.0.0.1:'+(server.address() as any).port;
 return {server,url:origin,token,close:()=>new Promise<void>((resolve,reject)=>{server.close(e=>{store.close();e?reject(e):resolve();});server.closeAllConnections();})};
}
