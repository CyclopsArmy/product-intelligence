import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {startApp} from '../src/server.ts';
import {capture} from './helpers.ts';

test('late unauthorized responses from an old session cannot revoke a new session', {timeout:30000}, async()=>{
 const app=await startApp({dbPath:':memory:',port:0});
 let browser;const release=Promise.withResolvers<void>();
 try{
  browser=await chromium.launch({channel:process.env.PI_BROWSER_CHANNEL||undefined});
  const page=await browser.newPage();page.setDefaultTimeout(5000);
  const staleToken='b'.repeat(64),started=Promise.withResolvers<void>(),finished=Promise.withResolvers<void>();
  let requests=0,responses=0;
  page.on('requestfinished',request=>{if(request.headers().authorization==='Bearer '+staleToken&&++responses===3)finished.resolve();});
  await page.route('**/api/**',async route=>{
   if(route.request().headers().authorization==='Bearer '+staleToken){
    if(++requests===3)started.resolve();await release.promise;
    await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'AUTH_REQUIRED'})});
   }else await route.continue();
  });
  await page.goto(app.url+'/#token='+staleToken);
  await started.promise;
  try{await page.goto(app.url+'/#token='+app.token);}catch{throw new Error('SESSION_NAVIGATION_FAILED');}
  await page.getByRole('button',{name:'Load synthetic sample'}).waitFor();
  release.resolve();await finished.promise;
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await page.getByRole('button',{name:'Load synthetic sample'}).waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('pi-session')!==null),true);
 }finally{release.resolve();await browser?.close();await app.close();}
});

// All data is synthetic, browsers have fresh profiles, and artifacts stay private.
test('rendered private workspace imports, reviews, filters, watches and recovers evidence', {timeout:90000}, async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-browser-'));
 const app=await startApp({dbPath:join(dir,'source.sqlite'),port:0});
 let browser;
 try{
  browser=await chromium.launch({channel:process.env.PI_BROWSER_CHANNEL||undefined});
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-US',timezoneId:'UTC',acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const errors:string[]=[],outbound:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(['error','warning'].includes(message.type())&&!message.location().url.endsWith('/favicon.ico'))errors.push(message.text());});
  await context.route('**/*',async route=>{
   if(new URL(route.request().url()).origin!==app.url){outbound.push('unexpected outbound request');await route.abort();}
   else await route.continue();
  });
  await page.goto(app.url);
  await page.getByRole('heading',{name:'Open your private session'}).waitFor();
  // Do not let navigation errors print the ephemeral session secret.
  try{await page.goto(app.url+'/#token='+app.token);}catch{throw new Error('SESSION_NAVIGATION_FAILED');}
  await page.getByRole('button',{name:'Load synthetic sample'}).waitFor();
  assert.equal(page.url(),app.url+'/#overview');
  assert.equal(await page.title(),'Overview · Product Intelligence');
  assert.equal(await page.getByLabel('Include synthetic data').isChecked(),false);
  await page.getByRole('button',{name:'Load synthetic sample'}).click();
  await page.locator('[data-observation="fixture-001"]').waitFor();
  assert.equal(await page.getByLabel('Include synthetic data').isChecked(),true);
  await page.getByLabel('Include synthetic data').uncheck();
  await page.locator('#screen[aria-busy]').waitFor({state:'detached'});
  assert.equal(await page.locator('[data-observation]').count(),0);
  await page.getByLabel('Include synthetic data').check();
  await page.locator('[data-observation="fixture-001"]').click();
  await page.getByRole('heading',{name:'Candidate evidence'}).waitFor();
  assert.match(await page.locator('#detail-content').innerText(),/899\.99/);
  await page.locator('#decision-form').getByLabel('Review status').selectOption('uncertain');
  await page.getByRole('button',{name:'Save review decision'}).click();
  await page.getByText('Review decision saved.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  const navigate=async(name:string)=>{await page.getByRole('navigation').getByRole('link',{name,exact:true}).click();await page.locator('#screen[aria-busy]').waitFor({state:'detached'});};
  await navigate('Price history');
  await page.getByRole('heading',{name:'No accepted price history yet'}).waitFor();
  await navigate('Observations');
  await page.getByLabel('Product or listing').fill('DISPLAY-27');
  await page.locator('#search-form').getByLabel('Review status').selectOption('uncertain');
  await page.getByRole('button',{name:'Apply filters'}).click();
  await page.locator('[data-observation="fixture-001"]').click();
  await page.locator('#decision-form').getByLabel('Review status').selectOption('accepted');
  await page.locator('#decision-form select[name="reason"]').selectOption('RECHECK_CONFIRMED');
  await page.getByRole('button',{name:'Save review decision'}).click();
  await page.getByText('Review decision saved.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await navigate('Price history');
  await page.locator('[data-history="0"]').click();
  await page.getByRole('button',{name:'Inspect capture'}).waitFor();
  assert.match(await page.locator('#detail-content').innerText(),/899\.99/);
  await page.getByRole('button',{name:'Close',exact:true}).click();

  await navigate('Watch targets');
  await page.getByLabel('Label',{exact:true}).fill('Synthetic display');
  await page.getByLabel('Target item price, USD (optional)').fill('90071992547409.91');
  await page.getByLabel('Clean product URL').fill('https://www.bestbuy.com/site/example/123.p');
  await page.getByRole('button',{name:'Save target'}).click();
  await page.getByText('Target: $90,071,992,547,409.91',{exact:false}).waitFor();
  await page.getByLabel('Label',{exact:true}).fill('Synthetic display');
  await page.getByLabel('Target item price, USD (optional)').fill('799.99');
  await page.getByLabel('Clean product URL').fill('https://www.bestbuy.com/site/example/123.p');
  await page.getByRole('button',{name:'Save target'}).click();
  await page.getByText('Target: $799.99',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Archive',exact:true}).click();
  await page.getByRole('button',{name:'Restore target'}).click();
  await page.getByRole('button',{name:'Archive',exact:true}).waitFor();
  assert.match(await page.locator('.target-item').innerText(),/799\.99/);

  await navigate('Import evidence');
  const upload=async(name:string,body:string)=>page.locator('input[name="capture"]').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(body)});
  await upload('invalid.json','invalid');
  await page.getByRole('button',{name:'Validate and import'}).click();
  await page.getByText('The selected file is not valid JSON.',{exact:true}).waitFor();
  const c=capture({id:'browser-json'});
  await upload('synthetic.json',JSON.stringify(c));
  await page.getByLabel('Historical evaluation time (optional)').fill('2026-01-15T12:00');
  await page.getByRole('button',{name:'Validate and import'}).click();
  await page.getByRole('heading',{name:'Candidate evidence'}).waitFor();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByLabel('Capture format').selectOption('html');
  await page.getByLabel('Metadata JSON').waitFor({state:'visible'});
  const {schemaVersion,candidates,issues,...metadata}=capture({id:'browser-html'});
  const html='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',brand:'Example',model:'DISPLAY-27',sku:'black-single',offers:{'@type':'Offer',price:'899.99',priceCurrency:'USD'}})+'</script>';
  await upload('synthetic.html',html);
  await page.getByLabel('Metadata JSON').setInputFiles({name:'metadata.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(metadata))});
  const htmlResponse=page.waitForResponse(response=>response.url().endsWith('/api/import-html'));
  await page.getByRole('button',{name:'Validate and import'}).click();
  const importedHtml=await htmlResponse;assert.equal(importedHtml.status(),201,await importedHtml.text());
  await page.getByRole('heading',{name:'Candidate evidence'}).waitFor();
  assert.equal(await page.locator('#decision-form option[value="accepted"]').count(),0);
  assert.match(await page.locator('#detail-content').innerText(),/Unknown seller/);
  await page.getByRole('button',{name:'Close',exact:true}).click();

  await navigate('Backup & recovery');
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download backup'}).click();
  const download=await pending,archivePath=join(dir,'recovery.pi-backup.json');
  await download.saveAs(archivePath);
  const archive=JSON.parse(readFileSync(archivePath,'utf8'));
  assert.equal(archive.observations.length,3);
  assert.equal(archive.targets[0].targetMinor,79999);
  const restored=join(dir,'restored.sqlite');
  const result=spawnSync(process.execPath,['src/cli.ts','restore','--file',archivePath,'--db',restored],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const recovered=await startApp({dbPath:restored,port:0});
  try{
   const recoveryContext=await browser.newContext();
   const recoveryPage=await recoveryContext.newPage();
   try{await recoveryPage.goto(recovered.url+'/#token='+recovered.token);}catch{throw new Error('RECOVERY_NAVIGATION_FAILED');}
   await recoveryPage.getByRole('button',{name:'Load synthetic sample'}).waitFor();
   await recoveryPage.getByLabel('Include synthetic data').check();
   await recoveryPage.locator('[data-observation="fixture-001"]').click();
   await recoveryPage.getByRole('heading',{name:'Decision history (3)'}).waitFor();
   await recoveryContext.close();
  }finally{await recovered.close();}

  const screenshotDir=process.env.PI_SCREENSHOT_DIR;
  if(screenshotDir)mkdirSync(screenshotDir,{recursive:true});
  await navigate('Overview');
  if(screenshotDir)await page.screenshot({path:join(screenshotDir,'desktop.png')});
  await page.setViewportSize({width:390,height:844});
  for(const name of ['Overview','Observations','Price history','Watch targets','Import evidence','Backup & recovery']){
   await navigate(name);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile overflow on '+name);
  }
  await navigate('Overview');
  if(screenshotDir)await page.screenshot({path:join(screenshotDir,'mobile.png')});
  assert.deepEqual(outbound,[]);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await app.close();rmSync(dir,{recursive:true,force:true});}
});
