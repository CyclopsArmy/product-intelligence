import type {ProductIdentity, MatchResult} from './types.ts';
import {validGtin} from './validation.ts';
export function matchIdentity(a:ProductIdentity,b:ProductIdentity):MatchResult {
  if(!a.brand || !b.brand || a.brand.trim().toLowerCase()!==b.brand.trim().toLowerCase())return {match:false,reason:'BRAND_MISMATCH_OR_UNKNOWN'};
  if(!a.variant || !b.variant || a.variant!==b.variant)return {match:false,reason:'VARIANT_MISMATCH_OR_UNKNOWN'};
  for(const field of ['gtin','mpn','model'] as const) {
    if(a[field] && b[field]) {
      const x=field==='gtin'?a[field].padStart(14,'0'):a[field].trim().toUpperCase();
      const y=field==='gtin'?b[field].padStart(14,'0'):b[field].trim().toUpperCase();
      if(x!==y)return {match:false,reason:'IDENTIFIER_CONFLICT'};
    }
  }
  if(a.gtin && b.gtin && validGtin(a.gtin) && validGtin(b.gtin))return {match:true,reason:'EXACT_GTIN_AND_VARIANT'};
  if((a.mpn && b.mpn) || (a.model && b.model))return {match:true,reason:'EXACT_BRAND_MODEL_AND_VARIANT'};
  return {match:false,reason:'INSUFFICIENT_IDENTIFIERS'};
}
