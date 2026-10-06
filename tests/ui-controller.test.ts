import {test} from 'node:test';
import assert from 'node:assert/strict';
import {capture} from './helpers.ts';
// A controller-only DOM boundary: no browser rendering or accessibility claim.
type ElementStub={id:string;innerHTML:string;textContent:string;className:string;open:boolean;checked:boolean;onchange?:()=>void;setAttribute:()=>void;removeAttribute:()=>void;addEventListener:(key:string,callback:()=>void)=>void;showModal:()=>void;close:()=>void};
type Click={target:{closest:()=>{dataset:{observation:string};disabled:boolean}}};
type Harness={el:(id:string)=>ElementStub;click:(id:string)=>void;resolve:(index:number,id:string)=>void;navigate:(route:string)=>void;tick:()=>Promise<void>};
async function harness(fn:(h:Harness)=>Promise<void>){
 const saved=new Map<string,PropertyDescriptor|undefined>(),elements=new Map<string,ElementStub>(),handlers:Record<string,(event:Click)=>void>={},windowHandlers:Record<string,()=>void>={},pending:{url:string;resolve:(value:unknown)=>void}[]=[];
 const replace=(key:string,value:unknown)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
 function el(id:string){if(!elements.has(id)){const callbacks:Record<string,()=>void>={};elements.set(id,{id,innerHTML:'',textContent:'',className:'',open:false,checked:false,setAttribute(){},removeAttribute(){},addEventListener(k,f){callbacks[k]=f;},showModal(){this.open=true;},close(){this.open=false;callbacks.close?.();}});}return elements.get(id)!;}
 try{
  replace('document',{getElementById:el,querySelectorAll:()=>[],addEventListener:(k:string,f:(event:Click)=>void)=>handlers[k]=f});replace('window',{addEventListener:(k:string,f:()=>void)=>windowHandlers[k]=f});replace('location',{hash:'#import',pathname:'/'});replace('history',{replaceState(){}});replace('sessionStorage',{getItem:()=> 'a'.repeat(64),removeItem(){},setItem(){}});replace('fetch',(url:string)=>new Promise<unknown>(resolve=>pending.push({url,resolve})));
  await import('../web/app.js?controller-test='+Math.random());
  const click=(id:string)=>handlers.click({target:{closest:()=>({dataset:{observation:id},disabled:false})}});
  const resolve=(index:number,id:string)=>pending[index].resolve({ok:true,status:200,json:async()=>({capture:capture({id,context:{...capture().context,product:{...capture().context.product,model:id}}}),evaluation:{offer:null,reasons:[],supporting:[],excluded:[],status:'uncertain'},currentStatus:'uncertain',decisions:[],decisionCount:0,nextCursor:null})});
  await fn({el,click,resolve,navigate(route){location.hash='#'+route;windowHandlers.hashchange();},tick:()=>new Promise<void>(resolve=>setImmediate(resolve))});
 }finally{for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
}
test('actual UI controller cannot reopen stale evidence after navigation',()=>harness(async h=>{h.click('old');h.navigate('backup');h.resolve(0,'old');await h.tick();assert.equal(h.el('detail').open,false);assert.equal(h.el('page-title').textContent,'Backup & recovery');}));
test('actual UI controller drops synthetic detail after synthetic filter changes',()=>harness(async h=>{h.click('synthetic');h.el('synthetic').checked=false;const onchange=h.el('synthetic').onchange;assert.ok(onchange);onchange();h.resolve(0,'synthetic');await h.tick();assert.equal(h.el('detail').open,false);}));
test('actual UI controller keeps the most recently selected product',()=>harness(async h=>{h.click('first');h.click('second');h.resolve(1,'second');await h.tick();h.resolve(0,'first');await h.tick();assert.equal(h.el('detail-title').textContent,'Example second');assert.equal(h.el('detail').open,true);}));
