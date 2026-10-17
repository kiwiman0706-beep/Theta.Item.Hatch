const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const out=process.env.CLOSET_TEST_OUTPUT||'/tmp/omoide-ui-check';
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CLOSET_CHROMIUM,args:['--no-sandbox']});
 const errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await context.addInitScript(()=>{
  let items=[{id:'11111111-1111-4111-8111-111111111111',name:'入園式の服',category:'シャツ',child:'長女',note:'春の思い出',favorite:true}];
  let settings={hasKey:false,children:['長女','次女'],speed:24,autoplay:true,consent:false,model:'gemini-3.5-flash-lite',driveAccount:'',driveFolder:'',driveAuto:false,deviceName:'テスト端末'};
  window.bridgeTest={calls:[],createFails:true,syncFails:false};
  window.ClosetNative={request(op,json,token){
   const p=JSON.parse(json);window.bridgeTest.calls.push({op,p});let value,error=null;
   if(op==='bootstrap')value={items,settings,draft:null};
   else if(op==='driveConnect'){settings.driveAccount='parent@example.test';value={connected:true};}
   else if(op==='driveCreate'){
    settings.driveFolder='TestFamilyFolder123';settings.driveFolderName='家族の思い出';
    value={added:0,updated:0};if(window.bridgeTest.createFails){window.bridgeTest.createFails=false;error='通信が途切れました。もう一度同期してください。';}
   }
   else if(op==='driveSync'){
    if(window.bridgeTest.syncFails)error='通信できません。保存した記録は端末に残っています。';
    else {const added=items.length===1?1:0;if(added)items.push({...items[0],id:'22222222-2222-4222-8222-222222222222',name:'入園式の服（同時編集の別版）'});settings.lastSync=Date.now();value={added,updated:0,conflicts:added};}
   }
   else if(op==='driveJoin'){settings.driveFolder=p.folder.split('/').pop();settings.driveFolderName='別の思い出';settings.lastSync=Date.now();value={added:0,updated:0,conflicts:0};}
   else if(op==='settings'){settings={...settings,...p};value=settings;}
   else if(op==='driveDisconnect'){settings.driveAccount='';settings.driveFolder='';settings.driveAuto=false;settings.lastSync=0;value=settings;}
   else error='Unexpected test operation: '+op;
   if(op==='driveSync')setTimeout(()=>window.nativeEvent('syncProgress',{message:'写真を確認しています…'}),20);
   setTimeout(()=>window.nativeReply(token,JSON.parse(JSON.stringify(value||{})),error),op==='driveSync'?200:25);
  }};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/media/**',route=>route.fulfill({path:'app/src/main/assets/samples/stripes.svg',contentType:'image/svg+xml'}));
 await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>state.items.length===1);
 await page.click('[data-tab=settings]');await page.click('#drive-connect');
 await page.waitForSelector('#drive-create');assert.equal(await page.locator('.drive-account').innerText(),'parent@example.test');
 await page.click('#drive-create');await page.waitForSelector('#share-folder');
 await page.waitForFunction(()=>!state.syncing);
 assert.equal(await page.locator('#share-folder').inputValue(),'https://drive.google.com/drive/folders/TestFamilyFolder123');
 assert((await page.locator('#sync-status').innerText()).includes('通信が途切れ'),'Partial failure must remain visible');
 assert.equal(await page.locator('#drive-create').count(),0,'Retry must reuse a folder already created');
 await page.click('#drive-sync');assert(await page.locator('#drive-sync').isDisabled());
 await page.click('[data-tab=closet]');await page.click('#add-closet');assert.equal(await page.locator('#take-photo').count(),0,'Capture must wait for sync');
 await page.waitForFunction(()=>!state.syncing&&state.items.length===2);
 await page.click('[data-tab=settings]');assert((await page.locator('#sync-status').innerText()).includes('前回の同期'),'Completed sync must display its completion time');
 await page.fill('#device-name','お父さんのスマホ');await page.check('#drive-auto');await page.click('#drive-save');
 await page.waitForFunction(()=>state.settings.driveAuto);
 await page.uncheck('#drive-auto');await page.click('#drive-save');await page.waitForFunction(()=>!state.settings.driveAuto);
 const calls=await page.evaluate(()=>bridgeTest.calls.filter(c=>c.op==='driveSync').length);
 await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>bridgeTest.calls.filter(c=>c.op==='driveSync').length),calls,'Disabling auto sync must cancel a pending timer');
 assert.equal(await page.evaluate(()=>state.settings.deviceName),'お父さんのスマホ');
 await page.fill('#drive-folder-input','https://drive.google.com/drive/folders/AnotherFamilyFolder123');await page.click('#drive-join');
 await page.waitForFunction(()=>!state.syncing&&state.settings.driveFolder==='AnotherFamilyFolder123');
 await page.evaluate(()=>bridgeTest.syncFails=true);await page.click('#drive-sync');await page.waitForFunction(()=>!state.syncing);
 assert.equal(await page.evaluate(()=>state.items.length),2);assert((await page.locator('#sync-status').innerText()).includes('端末に残っています'));
 await page.evaluate(()=>bridgeTest.syncFails=false);await page.click('#drive-sync');await page.waitForFunction(()=>!state.syncing);
 await page.locator('#drive-card').screenshot({path:path.join(out,'drive-settings-390.png')});
 await page.click('#drive-disconnect');await page.waitForSelector('#drive-connect');assert.equal(await page.evaluate(()=>state.items.length),2,'Disconnect may not delete local memories');
 await context.close();

 // Create a demonstrator using the same shipped UI and locally embedded SVG samples.
 const preview=await browser.newPage();await preview.goto('http://127.0.0.1:8765');
 const sampleItems=await preview.evaluate(()=>JSON.parse(JSON.stringify(samples)));await preview.close();
 const assetRoot=path.resolve('app/src/main/assets');
 const media={};for(const item of sampleItems){media[item.id]='data:image/svg+xml;base64,'+fs.readFileSync(path.join(assetRoot,item.asset)).toString('base64');delete item.asset;if(item.back?.asset){media[item.back.id]='data:image/svg+xml;base64,'+fs.readFileSync(path.join(assetRoot,item.back.asset)).toString('base64');delete item.back.asset;}for(const m of item.memories||[]){media[m.id]='data:image/svg+xml;base64,'+fs.readFileSync(path.join(assetRoot,m.asset)).toString('base64');delete m.asset;}}
 const demoFamilies=['長女','次女'].map((name,i)=>({id:name,name,avatarId:'sample-face-'+i}));for(const [i,f] of demoFamilies.entries())media[f.avatarId]='data:image/svg+xml;base64,'+fs.readFileSync(path.join(assetRoot,'samples/family-'+(i?'younger':'elder')+'.svg')).toString('base64');
 const demo={sample:true,items:sampleItems,settings:{families:demoFamilies,children:['長女','次女'],autoplay:true,speed:24,driveAuto:false},media,exported:Date.now()};
 const safeJSON=JSON.stringify(demo).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const inline=`<script id="portable-data" type="application/json">${safeJSON}</script><script>window.PortableAlbum=JSON.parse(document.getElementById('portable-data').textContent);</script><script>${fs.readFileSync(path.join(assetRoot,'app.js'),'utf8').replace(/<\/script/g,'<\\/script')}</script>`;
 const demoHTML=fs.readFileSync(path.join(assetRoot,'index.html'),'utf8').replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(assetRoot,'style.css'),'utf8')+'</style>').replace('<script src="app.js"></script>',()=>inline);
 const demoPath=process.env.CLOSET_SAMPLE_HTML||path.join(out,'sample-album.html');fs.writeFileSync(demoPath,demoHTML);

 const nativeHTML=process.env.CLOSET_NATIVE_HTML;
 assert(nativeHTML&&fs.existsSync(nativeHTML),'Pass the HTML exported by real Android code in CLOSET_NATIVE_HTML');
 for(const [html,width] of [[nativeHTML,390],[demoPath,320],[demoPath,430],[demoPath,800]]){
  const offline=await browser.newContext({offline:true,viewport:{width,height:width===800?1000:844},hasTouch:true});
  const album=await offline.newPage();album.on('pageerror',e=>errors.push(e.message));
  const network=[];album.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await album.goto(pathToFileURL(path.resolve(html)).href);await album.waitForFunction(()=>state.items.length>0);
  await album.waitForFunction(()=>[...document.querySelectorAll('.hanging-item img')].every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await album.locator('#count-number').innerText(),html===nativeHTML?'2':'8');
  assert(await album.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(html!==nativeHTML){
   const before=await album.evaluate(()=>lanes.map(l=>l.slots[1].x));await album.waitForTimeout(250);const after=await album.evaluate(()=>lanes.map(l=>l.slots[1].x));assert(after[0]>before[0]&&after[1]<before[1]);
   await album.click('[data-play=top]');const top=await album.evaluate(()=>lanes[0].slots[1].x);await album.waitForTimeout(250);assert.equal(await album.evaluate(()=>lanes[0].slots[1].x),top);
   await album.click('[data-play=bottom]');const bottom=await album.evaluate(()=>lanes[1].slots[1].x);await album.click('[data-step="top:1"]');assert.equal(await album.evaluate(()=>lanes[1].slots[1].x),bottom);
   const box=await album.locator('#bottom-stage').boundingBox();const topAfter=await album.evaluate(()=>lanes[0].slots[1].x);await album.mouse.move(box.x+100,box.y+90);await album.mouse.down();await album.mouse.move(box.x+150,box.y+90,{steps:8});await album.mouse.up();assert.equal(await album.evaluate(()=>lanes[0].slots[1].x),topAfter);
   const keepsake=await album.locator('.keepsake-photo img').getAttribute('src');await album.click('#keepsake-next');await album.waitForTimeout(1000);assert.notEqual(await album.locator('.keepsake-photo img').getAttribute('src'),keepsake);
   await album.screenshot({path:path.join(out,`portable-${width}.png`),fullPage:true});
  }
  await album.click('[data-tab=album]');assert(await album.locator('#add-album').isHidden());
  if(html===nativeHTML){
   await album.fill('#search','大切な日');assert.equal(await album.locator('.album-card').count(),1);
   await album.locator('.album-card h3').click();assert((await album.locator('.memory').innerText()).includes('<script>window.exportAttack=true</script>'));
   assert.equal(await album.evaluate(()=>window.exportAttack),undefined);assert.equal(await album.locator('#detail-edit').count(),0);
   await album.click('#close-sheet');
  }else{
   await album.fill('#search','くまさん');assert.equal(await album.locator('.album-card').count(),1);
   await album.locator('.album-card h3').click();assert((await album.locator('.memory').innerText()).includes('展示用のサンプル'));await album.click('#close-sheet');
  }
  await album.click('[data-tab=settings]');assert.equal(await album.locator('#drive-card').count(),0);assert.equal(await album.locator('#api-key').count(),0);
  await album.fill('#portable-speed','45');assert.equal(await album.evaluate(()=>state.settings.speed),45);
  await album.uncheck('#portable-autoplay');assert(await album.evaluate(()=>lanes.every(l=>!l.playing)));
  assert.deepEqual(network,[],'The single-file viewer must work without any network requests');
  await offline.close();
 }
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: Drive connection/settings/join/retry/disconnect UI, completion status and auto-sync cancellation; Android-exported HTML plus sample album offline, embedded photos, independent lanes, swipes, search, text safety and read-only controls.');
})().catch(e=>{console.error(e);process.exit(1);});
