import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureHtml} from '../src/extract.ts';
import {evaluate} from '../src/engine.ts';
import {capture,NOW,product} from './helpers.ts';
export const ld={ '@type':'Product',brand:{name:'Example'},model:product.model,mpn:product.mpn,gtin13:product.gtin,sku:product.variant,
  offers:{'@type':'Offer',price:'899.99',priceCurrency:'USD',seller:{name:'Example Retail'},itemCondition:'https://schema.org/NewCondition',availability:'https://schema.org/InStock'}};
export const metadata={id:'html-001',url:capture().url,observedAt:NOW,sourceObservedAt:null,method:'synthetic-fixture',synthetic:true,context:capture().context};
test('JSON-LD extracts without inventing eligibility or fulfillment',()=>{const c=captureHtml(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`,metadata);assert.equal(c.candidates.length,1);assert.equal(c.candidates[0].price,'899.99');assert.equal(c.candidates[0].eligibility,null);assert.equal(evaluate(c,NOW).status,'uncertain');});
test('@graph resolves offer id',()=>{const offer={...ld.offers,'@id':'#offer'};const data={'@graph':[{...ld,offers:{'@id':'#offer'}},offer]};const c=captureHtml(`<script type='application/ld+json'>${JSON.stringify(data)}</script>`,metadata);assert.equal(c.candidates[0].price,'899.99');});
test('bad JSON records issue',()=>{const c=captureHtml('<script type="application/ld+json">{bad}</script>',metadata);assert.ok(c.issues.includes('MALFORMED_JSONLD'));});
test('multiple products quarantine',()=>{const c=captureHtml(`<script type="application/ld+json">${JSON.stringify([ld,{...ld,model:'OTHER'}])}</script>`,metadata);assert.ok(c.issues.includes('MULTIPLE_PRODUCTS'));});
test('aggregate price not selling price',()=>{const c=captureHtml(`<script type="application/ld+json">${JSON.stringify({...ld,offers:{'@type':'AggregateOffer',lowPrice:'10',highPrice:'999'}})}</script>`,metadata);assert.ok(c.issues.includes('AGGREGATE_OFFER'));assert.equal(c.candidates.length,0);});
test('page-global price is ignored',()=>{const c=captureHtml('<meta property="product:price:amount" content="1.00"><span>$1.00</span>',metadata);assert.equal(c.candidates.length,0);});
test('selected DOM retains explicit scope and is never executed',()=>{const html='<div data-pi-selected-offer data-pi-brand="Example" data-pi-model="DISPLAY-27" data-pi-mpn="EX-27" data-pi-gtin="4006381333931" data-pi-variant="black-single" data-pi-seller="Example Retail" data-pi-condition="new" data-pi-availability="in-stock" data-pi-price="899.99" data-pi-currency="USD" data-pi-eligibility="public" data-pi-fulfillment="delivery"></div><script>throw new Error("must not run")</script>';const c=captureHtml(html,metadata);assert.equal(c.candidates[0].seller,'Example Retail');assert.equal(c.candidates[0].source,'selected-dom');});
test('oversized HTML refused',()=>assert.throws(()=>captureHtml('x'.repeat(2*1024*1024+1),metadata),/HTML_TOO_LARGE/));
test('oversized script count quarantines',()=>{const c=captureHtml('<script type="application/ld+json">{}</script>'.repeat(51),metadata);assert.ok(c.issues.includes('TOO_MANY_SCRIPTS'));});
test('unresolved offer reference quarantines',()=>{const c=captureHtml(`<script type="application/ld+json">${JSON.stringify({...ld,offers:{'@id':'#missing'}})}</script>`,metadata);assert.ok(c.issues.includes('UNRESOLVED_REFERENCE'));});
test('JSON-LD inside comments ignored',()=>assert.equal(captureHtml(`<!-- <script type="application/ld+json">${JSON.stringify(ld)}</script> -->`,metadata).candidates.length,0));
