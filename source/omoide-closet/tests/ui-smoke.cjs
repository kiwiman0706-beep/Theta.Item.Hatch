const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out=process.env.CLOSET_TEST_OUTPUT||'/tmp/omoide-ui-check';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CLOSET_CHROMIUM,args:['--no-sandbox']});
 const errors=[];
 for(const width of [320,390,430,800]){
  const context=await browser.newContext({viewport:{width,height:width===800?1000:844},deviceScaleFactor:1,isMobile:width<600,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765');await page.waitForSelector('.hanging-item img');
  assert.equal(await page.locator('#count-number').innerText(),'0');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');
  const moves=await page.evaluate(()=>lanes.map(l=>l.slots[1].x));await page.waitForTimeout(350);
  const moved=await page.evaluate(()=>lanes.map(l=>l.slots[1].x));assert(moved[0]>moves[0]&&moved[1]<moves[1],'Top and bottom must move in opposite directions');
  await page.screenshot({path:path.join(out,`closet-${width}.png`),fullPage:true});
  await page.click('[data-play=top]');await page.click('[data-play=bottom]');
  await page.waitForTimeout(80);const paused=await page.evaluate(()=>lanes.map(l=>l.slots[1].x));await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>lanes.map(l=>l.slots[1].x)),paused,'Paused rows must stay still');
  const bottomBefore=await page.evaluate(()=>lanes[1].slots[1].x);await page.click('[data-step="top:1"]');assert.equal(await page.evaluate(()=>lanes[1].slots[1].x),bottomBefore,'Changing a top must not move the bottom');
  const dragBox=await page.locator('#bottom-stage').boundingBox();const topBefore=await page.evaluate(()=>lanes[0].slots[1].x);await page.mouse.move(dragBox.x+100,dragBox.y+80);await page.mouse.down();await page.mouse.move(dragBox.x+160,dragBox.y+80,{steps:8});await page.mouse.up();assert.equal(await page.evaluate(()=>lanes[0].slots[1].x),topBefore,'Swiping a bottom must not move the top');await page.waitForTimeout(80);
  const oldKeepsake=await page.locator('.keepsake-photo img').getAttribute('src');await page.click('#keepsake-next');await page.waitForTimeout(1000);assert.notEqual(await page.locator('.keepsake-photo img').getAttribute('src'),oldKeepsake,'Keepsakes must crossfade independently');
  const visible=await page.locator('#add-closet').boundingBox();assert(visible.y+visible.height<=(width===800?1000:844)-68,'Camera must fit above bottom navigation at width '+width);
  await page.click('#filter-favorites');assert(await page.locator('.hanging-item').count()>0);
  await page.locator('.hanging-item').nth(1).click();assert((await page.locator('.sheet-header h2').innerText()).includes('サンプル'));
  await page.click('#close-sheet');await page.click('[data-tab=album]');assert((await page.locator('.empty-state').innerText()).includes('最初の1点'));
  await page.click('[data-tab=settings]');assert(await page.locator('#settings-form').count()===1);assert(await page.locator('#pin-widget').count()===1);assert(await page.locator('#dream-settings').count()===1);
  await page.screenshot({path:path.join(out,`settings-${width}.png`),fullPage:true});
  await page.click('[data-tab=closet]');await page.click('#add-closet');assert(await page.locator('#take-photo').isVisible());
  await page.screenshot({path:path.join(out,`capture-${width}.png`),fullPage:true});await context.close();
 }
 // Exercise the UI against a native-bridge stand-in; device tests cover real persistence.
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>{
  const record={id:'11111111-1111-4111-8111-111111111111',name:'青いシャツ',category:'シャツ',child:'長女',size:'100',period:'3歳の春',note:'入園式 <思い出>',color:'青',favorite:false,asset:'samples/stripes.svg',segmentation:'ready',classification:'ready'};
  let items=[],draft=null,settings={hasKey:true,children:['長女','次女'],model:'gemini-3.5-flash-lite',speed:24,autoplay:true,consent:true};
  window.ClosetNative={request(op,json,token){const p=JSON.parse(json);let value;
   if(op==='bootstrap')value={items,settings,draft};
   else if(op==='gallery'||op==='camera'){draft={...record};value=draft;}
   else if(op==='analyze')value={...draft};
   else if(op==='save'){items=[{...p,asset:undefined}];draft=null;value=items[0];}
   else if(op==='cutout')value={...items.find(x=>x.id===p.id),segmentation:'manual',revision:Date.now()};
   else if(['favorite','archive','restore'].includes(op)){const i=items.find(x=>x.id===p.id);if(op==='favorite')i.favorite=p.value;else i.archived=op==='archive';value={...i};}
   else if(op==='settings'){settings={...settings,...p,hasKey:!!p.apiKey||settings.hasKey};value=settings;}
   else if(op==='export')value={ok:true};
   else if(op==='import')value={added:0,skipped:1};
   else if(op==='pinWidget')value={requested:false};
   else if(op==='dreamPreview'||op==='dreamSettings')value={ok:true};
   else if(op==='discard'){draft=null;value={ok:true};}
   setTimeout(()=>window.nativeReply(token,JSON.parse(JSON.stringify(value)),null),30);
  }};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/media/**',route=>route.fulfill({path:process.env.CLOSET_TEST_PHOTO||'app/src/main/assets/samples/stripes.svg',contentType:'image/svg+xml'}));
 await page.goto('http://127.0.0.1:8765');await page.click('#add-closet');await page.click('#pick-photo');await page.waitForSelector('#f-name');
 await page.waitForFunction(()=>!document.querySelector('#save-garment').disabled);
 await page.fill('#f-name','入園式の服');await page.fill('#f-note','初めての登園 <strong>大切な日</strong>');await page.check('[data-owner=次女]');
 await page.selectOption('#f-category','ヘアアクセサリー');assert.equal(await page.locator('#f-kind').inputValue(),'accessory');assert.equal(await page.locator('#f-wardrobeRole').inputValue(),'none');assert(await page.locator('#f-wardrobeRole').isDisabled());await page.selectOption('#f-category','シャツ');assert.equal(await page.locator('#f-wardrobeRole').inputValue(),'top');
 await page.screenshot({path:path.join(out,'editor-390.png'),fullPage:true});await page.click('#save-garment');
 await page.waitForFunction(()=>document.querySelector('#count-number').textContent==='1');assert(await page.locator('#sample-hint').isHidden());
 await page.click('[data-tab=settings]');await page.selectOption('#ambient-filter','favorites');await page.selectOption('#widget-seconds','60');await page.click('#save-ambient');await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>state.settings.widgetSeconds),60);await page.click('#pin-widget');await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('ホーム画面を長押し'));await page.click('#dream-preview');
 await page.click('[data-tab=album]');assert.equal(await page.locator('.album-card').count(),1);
 await page.click('[data-favorite]');await page.waitForFunction(()=>document.querySelector('.favorite-btn').classList.contains('selected'));
 await page.fill('#search','ない言葉');assert.equal(await page.locator('.album-card').count(),0);
 await page.fill('#search','大切な日');assert.equal(await page.locator('.album-card').count(),1);
 await page.locator('.album-card h3').click();assert.equal(await page.locator('.memory strong').count(),0);assert((await page.locator('.memory').innerText()).includes('<strong>'));
 await page.click('#archive-garment');await page.click('#confirm-ok');await page.waitForSelector('#overlay',{state:'hidden'});
 await page.click('[data-tab=settings]');await page.click('[data-restore]');await page.waitForFunction(()=>state.items.some(x=>!x.archived));await page.click('[data-tab=album]');assert.equal(await page.locator('.album-card').count(),1);
 await page.screenshot({path:path.join(out,'album-390.png'),fullPage:true});
 await page.locator('.album-card h3').click();await page.click('#detail-edit');await page.click('#adjust-cutout');
 await page.waitForFunction(()=>!document.querySelector('#cutout-save').disabled);
 const alphaBefore=await page.evaluate(()=>cutout.ctx.getImageData(Math.floor(cutout.buffer.width/2),Math.floor(cutout.buffer.height/2),1,1).data[3]);
 const box=await page.locator('#cutout-wrap').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.up();
 const alphaAfter=await page.evaluate(()=>cutout.ctx.getImageData(Math.floor(cutout.buffer.width/2),Math.floor(cutout.buffer.height/2),1,1).data[3]);assert(alphaBefore>alphaAfter,'Erase must remove photo pixels');
 await page.click('#cutout-undo');assert.equal(await page.evaluate(()=>cutout.ctx.getImageData(Math.floor(cutout.buffer.width/2),Math.floor(cutout.buffer.height/2),1,1).data[3]),alphaBefore);
 await page.locator('[data-tool=restore]').click();await page.locator('#zoom').fill('2');await page.screenshot({path:path.join(out,'cutout-390.png'),fullPage:true});
 await page.click('#cutout-save');await page.waitForSelector('#edit-form');
 assert.deepEqual(errors,[]);console.log('PASS: four viewport sizes, opposite directions, independent pause/swipe/step, keepsake crossfade, visible camera, item grouping, ambient settings, dialogs, add/edit/save, search, favorite, escaped text, archive and restore.');
 await context.close();await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
