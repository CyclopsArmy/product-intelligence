export type Status = 'accepted' | 'uncertain' | 'rejected';
export type ProductIdentity = {brand:string|null; model:string|null; mpn:string|null; gtin:string|null; variant:string|null};
export type Context = {product:ProductIdentity; seller:string|null; condition:string|null; eligibility:string|null; fulfillment:string|null};
export type Candidate = Context & {price:string|number|null;currency:string|null;availability:string|null;role:string;source:'jsonld'|'selected-dom'|'api';origin:'structured'|'rendered'|'upstream';locator:string};
export type Capture = {schemaVersion:1;id:string;url:string;observedAt:string;sourceObservedAt:string|null;method:'synthetic-fixture'|'saved-html'|'api';synthetic:boolean;context:Context;candidates:Candidate[];issues:string[];contentHash?:string};
export type Offer = Context & {priceMinor:number;currency:'USD';availability:string;purchasable:boolean;shippingMinor:null;taxMinor:null;priceBasis:'item-only'};
export type Evaluation = {status:Status;reasons:string[];offer:Offer|null;supporting:string[];excluded:{locator:string;reason:string}[]};
export type MatchResult = {match:boolean;reason:string};
