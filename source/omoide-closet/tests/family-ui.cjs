const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.CLOSET_TEST_OUTPUT||'/tmp/omoide-ui-check';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CLOSET_CHROMIUM,args:['--no-sandbox']});const errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>{
  const elder='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',younger='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',bottom='22222222-2222-4222-8222-222222222222',top='11111111-1111-4111-8111-111111111111';
  let items=[{id:bottom,name:'パジャマの下',category:'ズボン',wardrobeRole:'bottom',ownerIds:[elder,younger],children:['長女','次女'],child:'長女',memories:[],relatedIds:[]}],draft=null;
  let settings={families:[{id:elder,name:'長女',avatarId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'},{id:younger,name:'次女'}],children:['長女','次女'],speed:24,autoplay:true,consent:true,hasKey:true,model:'gemini-3.5-flash-lite'};
  let photoSeq=0;window.familyTest={calls:[],elder,younger,top,bottom};
  const get=id=>items.find(i=>i.id===id)||draft;
  window.ClosetNative={request(op,json,token){const p=JSON.parse(json);familyTest.calls.push({op,p});let r={},error=null;
   if(op==='bootstrap')r={items,settings,draft};
   else if(op==='gallery'||op==='camera'){
    if(!p.photoKind){draft={id:top,name:'新しい宝物',category:'その他',ownerIds:p.ownerIds||[],children:[],memories:[],relatedIds:[]};r=draft;}
    else {const id='cccccccc-cccc-4ccc-8ccc-'+String(++photoSeq).padStart(12,'0');if(p.photoKind==='avatar'){r=settings.families.find(x=>x.id===p.id);r.avatarId=id;}else {r=get(p.id);if(p.photoKind==='back')r.back={id,segmentation:'pending'};else r.memories.push({id,caption:''});}}
   }
   else if(op==='analyze'){r=get(p.id);if(p.side==='back')r.back.segmentation='ready';else Object.assign(r,{name:'AIのパジャマ',category:'パジャマ',kind:'clothes',wardrobeRole:'top',segmentation:'ready',classification:'ready'});}
   else if(op==='save'){r={...get(p.id),...p};for(const other of items)if(other.id!==p.id){other.relatedIds=(other.relatedIds||[]).filter(id=>id!==p.id);if(p.relatedIds?.includes(other.id))other.relatedIds.push(p.id);}const at=items.findIndex(x=>x.id===p.id);at<0?items.push(r):items[at]=r;draft=null;}
   else if(op==='cutout'){r=get(p.id);if(p.side==='back')r.back.segmentation='manual';else r.segmentation='manual';}
   else if(op==='removePhoto'){r=get(p.id);if(p.photoKind==='back')delete r.back;else r.memories=r.memories.filter(m=>m.id!==p.photoId);}
   else if(op==='familySave'){r=p.id?settings.families.find(x=>x.id===p.id):{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'};r.name=p.name;if(!p.id)settings.families.push(r);if(p.removeAvatar)delete r.avatarId;}
   else if(op==='avatarCrop'){r=settings.families.find(x=>x.id===p.id);r.avatarId='ffffffff-ffff-4fff-8fff-ffffffffffff';}
   else error='Unexpected operation: '+op;
   setTimeout(()=>window.nativeReply(token,JSON.parse(JSON.stringify(r)),error),30);
  }};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.route('**/media/**',route=>route.fulfill({path:'app/src/main/assets/samples/stripes.svg',contentType:'image/svg+xml'}));
 await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>state.items.length===1);
 await page.click('#add-closet');assert.equal(await page.locator('[data-owner]').count(),2);await page.check('[data-owner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]');await page.check('[data-owner="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]');await page.screenshot({path:path.join(out,'family-capture-390.png')});await page.click('#pick-photo');await page.waitForSelector('#edit-form');await page.waitForFunction(()=>!state.processing);
 assert.equal(await page.locator('[data-owner]:checked').count(),2);assert.deepEqual(await page.evaluate(()=>familyTest.calls.find(c=>c.op==='gallery').p.ownerIds),await page.evaluate(()=>[familyTest.elder,familyTest.younger]));
 await page.fill('#f-name','姉妹のパジャマ（上）');await page.fill('#f-note','お泊まりの日 <思い出>');await page.click('#choose-related');await page.check('[data-related="22222222-2222-4222-8222-222222222222"]');await page.click('#related-done');assert((await page.locator('.related-tags').innerText()).includes('パジャマの下'));
 await page.click('#add-back');await page.click('#attachment-gallery');await page.waitForSelector('#adjust-back');await page.waitForFunction(()=>!state.processing);assert.equal(await page.locator('#f-name').inputValue(),'姉妹のパジャマ（上）');assert.equal(await page.locator('[data-owner]:checked').count(),2);assert((await page.evaluate(()=>editItem.back.segmentation))==='ready');
 await page.click('#adjust-back');await page.waitForFunction(()=>!document.querySelector('#cutout-save').disabled);await page.click('#cutout-save');await page.waitForSelector('#edit-form');assert.equal(await page.evaluate(()=>familyTest.calls.find(c=>c.op==='cutout').p.side),'back');
 await page.click('#add-memory');await page.click('#attachment-gallery');await page.waitForSelector('[data-caption]');await page.fill('[data-caption]','姉妹の思い出 <script>');await page.screenshot({path:path.join(out,'family-editor-390.png')});
 await page.click('#retry-ai');await page.waitForFunction(()=>!state.processing);assert.equal(await page.locator('[data-caption]').inputValue(),'姉妹の思い出 <script>');assert.equal(await page.locator('[data-owner]:checked').count(),2);await page.fill('#f-name','姉妹のパジャマ（上）');await page.click('#save-garment');await page.waitForFunction(()=>state.items.length===2&&!state.modal);
 assert.deepEqual(await page.evaluate(()=>state.items.find(x=>x.id===familyTest.bottom).relatedIds),await page.evaluate(()=>[familyTest.top]),'Reciprocal link must refresh in UI immediately');
 await page.click('[data-play=top]');await page.click('[data-play=bottom]');
 const hanger=page.locator('#top-stage .hanging-item').nth(1);await hanger.scrollIntoViewIfNeeded();const box=await hanger.boundingBox();const xs=await page.evaluate(()=>lanes.map(l=>l.slots[1].x));await page.mouse.move(box.x+box.width/2,box.y+60);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+110,{steps:10});await page.mouse.up();await page.waitForTimeout(450);assert.equal(await hanger.locator('.side-badge').innerText(),'裏 ↕ 表');assert.deepEqual(await page.evaluate(()=>lanes.map(l=>l.slots[1].x)),xs,'Vertical flip must not pan either rail');
 await hanger.click();await page.waitForSelector('#flip-detail');await page.click('#flip-detail');await page.waitForTimeout(450);assert.equal(await page.locator('#flip-detail').innerText(),'裏 → 表を見る ↕');
 await page.screenshot({path:path.join(out,'family-detail-390.png')});assert((await page.locator('.metadata').innerText()).includes('長女・次女'));await page.click('[data-memory]');assert.equal(await page.locator('.memory script').count(),0);assert((await page.locator('.memory').innerText()).includes('<script>'));await page.click('#memory-back');await page.click('[data-related-open]');assert.equal(await page.locator('#flip-detail').count(),0);assert((await page.locator('.detail-related').innerText()).includes('姉妹のパジャマ'));
 await page.click('#close-sheet');await page.click('[data-child="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]');await page.click('[data-tab=album]');assert.equal(await page.locator('.album-card').count(),2,'Both garments should be discoverable under younger sister');await page.fill('#search','姉妹の思い出');assert.equal(await page.locator('.album-card').count(),1,'Related-photo captions should be searchable');
 await page.click('[data-tab=settings]');await page.locator('[data-family]').first().click();await page.fill('#family-name','お姉ちゃん');await page.click('#family-save');await page.waitForFunction(()=>state.settings.families[0].name==='お姉ちゃん');await page.click('#family-photo');await page.click('#face-gallery');await page.waitForSelector('#face-canvas');await page.waitForFunction(()=>!document.querySelector('#face-crop-save').disabled);await page.fill('#face-zoom','1.5');await page.click('#face-crop-save');await page.waitForSelector('#family-photo');assert(await page.evaluate(()=>familyTest.calls.some(c=>c.op==='avatarCrop')));await page.click('#close-sheet');await page.click('#add-family');await page.fill('#family-name','お母さん');await page.click('#family-save');await page.waitForFunction(()=>state.settings.families.length===3);await page.click('#close-sheet');await page.locator('#family-card').screenshot({path:path.join(out,'family-settings-390.png')});
 assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('PASS: face multi-select, captured owner IDs, AI preservation, optional back import, back correction, vertical flip, reciprocal set details, related photos/captions, multi-owner filter, family rename/add and avatar crop.');
})().catch(e=>{console.error(e);process.exit(1);});
