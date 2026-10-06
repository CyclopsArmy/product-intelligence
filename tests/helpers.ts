import type {Capture} from '../src/types.ts';
export const NOW = '2026-01-15T12:00:00.000Z';
export const product = {brand:'Example', model:'DISPLAY-27', mpn:'EX-27', gtin:'4006381333931', variant:'black-single'};
export function capture(overrides: Record<string,unknown> = {}):Capture {
  const offer = { product, seller:'Example Retail', condition:'new', availability:'in-stock', currency:'USD', price:'899.99', role:'current', eligibility:'public', fulfillment:'delivery' };
  return {schemaVersion:1, id:'fixture-001', url:'https://www.bestbuy.com/site/example/123.p', observedAt:NOW, sourceObservedAt:null, method:'synthetic-fixture', synthetic:true,
    context:{product,seller:'Example Retail',condition:'new',eligibility:'public',fulfillment:'delivery'},
    candidates:[{...offer, source:'jsonld', origin:'structured', locator:'script[0].offers'}, {...offer,source:'selected-dom',origin:'rendered',locator:'[data-pi-selected-offer]'}], issues:[], ...overrides};
}
