import type {Evaluation, Candidate} from './types.ts';
import {validateCapture,parseMoney} from './validation.ts';
import {matchIdentity} from './identity.ts';
export function evaluate(input:unknown,now:string):Evaluation {
  const result:Evaluation={status:'uncertain',reasons:[],offer:null,supporting:[],excluded:[]};
  let capture;
  try {capture=validateCapture(input,now);}catch(e){return {...result,status:'rejected',reasons:[e instanceof Error && /^[A-Z_]+$/.test(e.message)?e.message:'INVALID_CAPTURE']};}
  result.reasons.push(...capture.issues);
  const current:{candidate:Candidate;minor:number}[]=[];
  for(const candidate of capture.candidates) {
    if(['reference','financing'].includes(candidate.role)){result.excluded.push({locator:candidate.locator,reason:candidate.role.toUpperCase()});continue;}
    if(candidate.role!=='current'){result.reasons.push('UNKNOWN_PRICE_ROLE');continue;}
    let minor;
    try {minor=parseMoney(candidate.price);}catch{result.reasons.push('INVALID_PRICE');continue;}
    const fields=['seller','condition','eligibility','fulfillment'] as const;
    if(!matchIdentity(capture.context.product,candidate.product).match || fields.some(f=>!capture.context[f] || capture.context[f]!==candidate[f])){result.reasons.push('OFFER_CONTEXT_MISMATCH');continue;}
    if(!['new','used','refurbished','open-box'].includes(candidate.condition ?? '') || !['in-stock','out-of-stock','preorder','backorder'].includes(candidate.availability ?? '') || !['delivery','pickup'].includes(candidate.fulfillment ?? '')){result.reasons.push('INCOMPLETE_OFFER');continue;}
    if(candidate.currency!=='USD'){result.reasons.push('UNSUPPORTED_CURRENCY');continue;}
    if(candidate.eligibility!=='public'){result.reasons.push('CONDITIONAL_OFFER');continue;}
    current.push({candidate,minor});
  }
  if(!current.length)result.reasons.push('NO_VALID_CURRENT_OFFER');
  if(current.some((a,i)=>current.slice(i+1).some(b=>!matchIdentity(a.candidate.product,b.candidate.product).match)))result.reasons.push('CANDIDATE_IDENTITY_CONFLICT');
  if(new Set(current.map(x=>x.minor)).size>1)result.reasons.push('PRICE_CONFLICT');
  if(new Set(current.map(x=>x.candidate.availability)).size>1)result.reasons.push('AVAILABILITY_CONFLICT');
  if(new Set(current.map(x=>x.candidate.origin)).size<2)result.reasons.push('INSUFFICIENT_INDEPENDENT_EVIDENCE');
  result.reasons=[...new Set(result.reasons)];
  if(result.reasons.length)return result;
  const {candidate,minor}=current[0];
  result.status='accepted';result.reasons=['SCOPED_EVIDENCE_AGREES'];
  result.supporting=current.map(x=>x.candidate.locator);
  result.offer={...capture.context,priceMinor:minor,currency:'USD',availability:candidate.availability!,purchasable:candidate.availability==='in-stock',shippingMinor:null,taxMinor:null,priceBasis:'item-only'};
  return result;
}
