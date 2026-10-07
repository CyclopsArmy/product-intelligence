export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function money(value){
 if(!Number.isSafeInteger(value)||value<=0)return 'Unknown';
 const minor=BigInt(value);
 return '$'+new Intl.NumberFormat('en-US').format(minor/100n)+'.'+String(minor%100n).padStart(2,'0');
}
export const productName=p=>[p?.brand,p?.model??p?.mpn].filter(Boolean).join(' ')||'Unidentified product';
export const date=value=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Unknown';
export const badge=(status,synthetic=false)=>`<span class="badge ${['accepted','uncertain','rejected'].includes(status)?status:''}">${escapeHTML(status)}</span>${synthetic?'<span class="badge synthetic">Synthetic</span>':''}`;
export function ageLabel(value,now=new Date().toISOString()){const age=Date.parse(now)-Date.parse(value);return !Number.isFinite(age)?'Unknown observation time':age<0?'Future observation time':age>86400000?'Historical observation':'Observed within 24 hours';}
export function targetPrice(value){if(value==='')return null;if(!/^\d+(?:\.\d{1,2})?$/.test(value))throw new Error('Enter a positive USD price with at most two decimals.');const [whole,fraction='']=value.split('.');const n=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));if(n<1n||n>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Enter a valid positive USD price.');return Number(n);}
export function priceChart(points){
 const items=points.filter(p=>Number.isSafeInteger(p.priceMinor)&&p.priceMinor>0&&Number.isFinite(Date.parse(p.observedAt)));
 if(!items.length)return '<p class="empty">No price points in this page.</p>';
 const prices=items.map(p=>p.priceMinor),lo=Math.min(...prices),hi=Math.max(...prices),first=Date.parse(items[0].observedAt),last=Date.parse(items.at(-1).observedAt);
 const xy=items.map(p=>[32+(Date.parse(p.observedAt)-first)/(last-first||1)*676,160-(p.priceMinor-lo)/(hi-lo||1)*112]);
 return `<figure class="chart"><svg viewBox="0 0 740 200" role="img" aria-label="Observed item prices from ${escapeHTML(money(lo))} to ${escapeHTML(money(hi))}"><line x1="32" y1="176" x2="708" y2="176" class="axis"/><polyline points="${xy.map(p=>p.join(',')).join(' ')}"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</svg><figcaption>${escapeHTML(money(lo))} – ${escapeHTML(money(hi))} · ${items.length} observations on this page. Gaps between captures are unknown.</figcaption></figure>`;
}
export function observationTable(rows){if(!rows.length)return '<div class="empty"><h2>No observations to show</h2><p>Import a saved capture to start building evidence and history.</p><a class="button" href="#import">Import a capture</a></div>';return `<div class="table-wrap"><table><thead><tr><th>Product / listing</th><th>Item price</th><th>Review status</th><th>Observed</th></tr></thead><tbody>${rows.map(r=>`<tr><td><button class="link" data-observation="${escapeHTML(r.id)}">${escapeHTML(productName(r.product))}</button><small>${escapeHTML(r.seller??'Unknown seller')} · ${escapeHTML(new URL(r.url).hostname)}</small></td><td class="number">${money(r.priceMinor)}</td><td>${badge(r.status,r.synthetic)}</td><td>${escapeHTML(date(r.observedAt))}<small>${escapeHTML(ageLabel(r.observedAt))}</small></td></tr>`).join('')}</tbody></table></div>`;}
