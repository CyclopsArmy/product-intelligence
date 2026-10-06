import {readFileSync} from 'node:fs';
import {evaluate} from '../src/engine.ts';
const dataset=JSON.parse(readFileSync(new URL('../fixtures/benchmark.json',import.meta.url),'utf8'));
let accepted=0,correctAccepted=0,failures=0;
const results=dataset.cases.map((item:any)=>{
  const r=evaluate(item.capture,dataset.evaluationTime);
  const correct=r.status===item.expectedStatus && (item.expectedPriceMinor===undefined || r.offer?.priceMinor===item.expectedPriceMinor);
  if(r.status==='accepted'){accepted++;if(correct)correctAccepted++;}
  if(!correct)failures++;
  return {name:item.name,split:item.split,expected:item.expectedStatus,actual:r.status,correct,reasons:r.reasons};
});
console.log(JSON.stringify({provenance:'synthetic',liveRetailerClaims:false,total:results.length,accepted,coverage:accepted/results.length,acceptedCorrectness:accepted?correctAccepted/accepted:null,failures,warning:'Synthetic regression behavior only. No measured retailer success rate, live latency, acquisition cost, or production accuracy.',results},null,2));
if(failures)process.exitCode=1;
