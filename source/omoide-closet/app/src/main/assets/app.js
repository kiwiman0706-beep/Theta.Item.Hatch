'use strict';
const portable=window.PortableAlbum||null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',hanger:'M9 7c0-5 7-5 7 0 0 3-4 3-4 6L2 19q-2 2 1 2h18q3 0 1-2L12 13',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',camera:'M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2 M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',settings:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',album:'M4 3h16v18H4Z M8 7h8v7H8Z M8 18h8',plus:'M12 5v14M5 12h14',close:'M6 6l12 12M18 6 6 18',search:'M18 18l4 4 M19 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',play:'m9 5 11 7-11 7Z',pause:'M8 5v14M16 5v14',shuffle:'M3 7h3q3 0 6 5t6 5h3M17 13l4 4-4 4M3 17h3q3 0 6-5t6-5h3M17 3l4 4-4 4',photo:'M3 3h18v18H3Z M8 8h.1 M3 17l6-6 4 4 3-3 5 5',edit:'m4 16-1 5 5-1L21 7l-4-4Z M14 6l4 4',download:'M12 3v12m-5-5 5 5 5-5 M4 17v4h16v-4',upload:'M12 16V4m-5 5 5-5 5 5 M4 17v4h16v-4',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',back:'m15 5-7 7 7 7',trash:'M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7'};
const icon=(n)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.hanger}"/></svg>`;
const categories=['シャツ','Tシャツ','ズボン','ワンピース','スカート','トレーナー','ニット','カーディガン','上着','ロンパース','オーバーオール','パジャマ','帽子','くつ','バッグ','ヘアアクセサリー','ネックレス','ブレスレット','アクセサリー','ぬいぐるみ','人形','ミニカー','ブロック','おもちゃ','絵本','思い出の品','その他'];
const kinds={clothes:'服',accessory:'アクセサリー',toy:'おもちゃ',other:'その他の品'};
const roles={top:'トップス',bottom:'ボトムス',onepiece:'ワンピース・つなぎ',none:'上下に分けない'};
function inferKind(category){if(['帽子','くつ','バッグ','ヘアアクセサリー','ネックレス','ブレスレット','アクセサリー'].includes(category))return 'accessory';if(['ぬいぐるみ','人形','ミニカー','ブロック','おもちゃ'].includes(category))return 'toy';return ['絵本','思い出の品'].includes(category)?'other':'clothes';}
function itemKind(item){return kinds[item.kind]?item.kind:inferKind(item.category);}
function inferRole(category){if(['シャツ','Tシャツ','トレーナー','ニット','カーディガン','上着'].includes(category))return 'top';if(['ズボン','スカート'].includes(category))return 'bottom';return ['ワンピース','ロンパース','オーバーオール','パジャマ'].includes(category)?'onepiece':'none';}
function itemRole(item){return itemKind(item)==='clothes'?(roles[item.wardrobeRole]?item.wardrobeRole:inferRole(item.category)):'none';}
function displayStand(item){return itemKind(item)==='clothes'?hanger(itemRole(item)==='bottom'):'<div class="item-plinth" aria-hidden="true"></div>';}
function sizeLabel(item){return item.size?(itemKind(item)==='clothes'&&/^\d+$/.test(item.size)?item.size+'cm':item.size):'';}
const hanger=(clip=false)=>`<div class="hanger${clip?' clip':''}"><svg viewBox="0 0 160 65" aria-hidden="true"><path d="M74 6c0-10 17-10 17 0 0 8-11 7-11 18${clip?' M80 24v12 M26 38h108 M34 38v12 M126 38v12':' L20 52q-6 5 1 5h118q7 0 1-5L80 24'}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
const samples=[
 {id:'sample-dress',name:'お花のワンピース',category:'ワンピース',child:'長女',size:'90',period:'2歳のころ',note:'お出かけの日のお気に入り。\nこれは展示用のサンプルです。',asset:'samples/dress.svg',favorite:true},
 {id:'sample-stripes',name:'青いボーダーTシャツ',category:'Tシャツ',child:'長女',size:'100',period:'3歳の夏',note:'公園でたくさん走った、夏の思い出。\nこれは展示用のサンプルです。',asset:'samples/stripes.svg'},
 {id:'sample-romper',name:'はじめてのロンパース',category:'ロンパース',child:'次女',size:'60',period:'0歳のころ',note:'抱っこすると、すっぽり腕におさまったね。\nこれは展示用のサンプルです。',asset:'samples/romper.svg',favorite:true},
 {id:'sample-trousers',name:'ちいさなズボン',category:'ズボン',child:'長女',size:'80',period:'1歳のころ',note:'歩きはじめのころの小さなズボン。\nこれは展示用のサンプルです。',asset:'samples/trousers.svg'},
 {id:'sample-cardigan',name:'あたたかいカーディガン',category:'カーディガン',child:'次女',size:'80',period:'1歳の冬',note:'寒い日もぽかぽか。\nこれは展示用のサンプルです。',asset:'samples/cardigan.svg'},
 {id:'sample-skirt',name:'くるくるスカート',category:'スカート',child:'長女',size:'110',period:'4歳のころ',note:'着ると、くるっと回って見せてくれました。\nこれは展示用のサンプルです。',asset:'samples/skirt.svg'}
];
samples.push({id:'sample-bear',name:'ずっと一緒のくまさん',kind:'toy',category:'ぬいぐるみ',child:'次女',period:'幼稚園のころ',note:'これは展示用のサンプルです。',asset:'samples/bear.svg',favorite:true},{id:'sample-bow',name:'お出かけのリボン',kind:'accessory',category:'ヘアアクセサリー',child:'長女',period:'4歳のころ',note:'これは展示用のサンプルです。',asset:'samples/bow.svg'});
// Illustrations are sample data, never mixed with the family's saved photographs.
const sampleTop=samples.find(i=>i.id==='sample-stripes'),sampleBottom=samples.find(i=>i.id==='sample-trousers');
Object.assign(sampleTop,{name:'姉妹のパジャマ（上）',category:'パジャマ',wardrobeRole:'top',children:['長女','次女'],relatedIds:[sampleBottom.id],back:{id:'sample-back',asset:'samples/stripes-back.svg'},memories:[{id:'sample-memory',asset:'samples/memory.svg',caption:'姉妹で過ごしたお泊まりの日。展示用のイラストです。'}]});
Object.assign(sampleBottom,{name:'姉妹のパジャマ（下）',children:['長女','次女'],relatedIds:[sampleTop.id]});
const state={items:[],settings:{hasKey:false,children:['長女','次女'],model:'gemini-3.5-flash-lite',speed:24,autoplay:true,consent:false,ambientFilter:'all',dreamSeconds:20,widgetSeconds:30},tab:'closet',child:'all',category:'all',favorites:false,playing:true,visible:true,draft:null,modal:null,processing:false,syncing:false};
const callbacks=new Map();let seq=0,toastTimer,editItem=null,previousDetail=null;
function api(op,p={}){
 return new Promise((resolve,reject)=>{
  if(portable){if(op==='bootstrap'){resolve({items:portable.items,settings:{...state.settings,...portable.settings},draft:null});return;}reject(new Error('閲覧用アルバムです。記録の編集はAndroidアプリで行えます。'));return;}
  if(!window.ClosetNative){reject(new Error('これは画面のプレビューです。撮影・AI処理はAndroidアプリで利用できます。'));return;}
  const t=String(++seq);callbacks.set(t,{resolve,reject});window.ClosetNative.request(op,JSON.stringify(p),t);
 });
}
window.nativeReply=(t,result,error)=>{const c=callbacks.get(t);if(!c)return;callbacks.delete(t);error?c.reject(new Error(error)):c.resolve(result);};
window.nativeEvent=(event,p)=>{if(event==='syncProgress'){if($('#sync-status'))$('#sync-status').textContent=p.message;}else if(event==='progress'){$('#process-text')&&($('#process-text').textContent=p.message);}else if(event==='refresh')load();else if(event==='error')toast(p.message);};
window.appVisible=flag=>{state.visible=flag;if(flag)scheduleSync(1500);};
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.remove('hidden');toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),4500);}
function updateItem(item){const at=state.items.findIndex(x=>x.id===item.id);if(at<0)state.items.unshift(item);else state.items[at]=item;scheduleSync(2500);}
function mediaPhoto(id,ext='.jpg',revision=0){if(portable)return portable.media[id]||'';return `media/${encodeURIComponent(id)}${ext}?v=${revision}`;}
function photo(item,kind='display',side='front'){const face=side==='back'?item.back:item;if(!face)return '';if(face.asset)return face.asset;const ext=kind==='original'?'.jpg':kind==='full'?'_full.png':'.png';return mediaPhoto(face.id,ext,item._sync?.revision||face.revision||0);}
function families(){return state.settings.families?.length?state.settings.families.filter(p=>!p.archived):(state.settings.children||[]).map(name=>({id:name,name}));}
function ownerIdsFor(item){if(Array.isArray(item.ownerIds))return item.ownerIds;const names=item.children?.length?item.children:[item.child].filter(Boolean);return families().filter(p=>names.some(n=>p.name===n||p.aliases?.includes(n))).map(p=>p.id);}
function ownerNames(item){const ids=ownerIdsFor(item),names=ids.map(id=>families().find(p=>p.id===id)?.name).filter(Boolean);return names.length?names:item.children?.length?item.children:[item.child].filter(Boolean);}
function faceHTML(person){return `<span class="face">${person.avatarId?`<img src="${esc(mediaPhoto(person.avatarId,'.jpg',person._sync?.revision||0))}" alt="">`:`<span>${esc(person.name.slice(0,1))}</span>`}</span>`;}
function memorySource(item,m){return m.asset||mediaPhoto(m.id,'.jpg',item._sync?.revision||0);}
function ownersHTML(ids=[]){return `<div class="face-choices">${families().map(p=>`<label class="face-choice"><input type="checkbox" data-owner="${esc(p.id)}" ${ids.includes(p.id)?'checked':''}><span class="face-option">${faceHTML(p)}<span class="face-name">${esc(p.name)}</span><span class="face-check" aria-hidden="true">✓</span></span></label>`).join('')}</div>`;}
function selectedOwners(){return $$('[data-owner]:checked').map(el=>el.dataset.owner);}
function preserveForm(result,form){const merged={...result};for(const key of ['name','category','kind','wardrobeRole','ownerIds','children','child','size','period','note','color','favorite','relatedIds'])if(form[key]!==undefined)merged[key]=form[key];merged.memories=(result.memories||[]).map(m=>({...m,caption:form.memories?.find(v=>v.id===m.id)?.caption??m.caption}));return merged;}
function realItems(){return state.items.filter(x=>!x.archived);}
function isDemo(){return !portable&&realItems().length===0;}
function closetItems(){let a=isDemo()?samples:realItems();if(state.child!=='all')a=a.filter(x=>ownerIdsFor(x).includes(state.child));if(state.favorites)a=a.filter(x=>x.favorite);return a;}
async function load(){
 try{const data=await api('bootstrap');state.items=data.items;state.settings=data.settings;state.draft=data.draft;state.playing=data.settings.autoplay;for(const lane of lanes)lane.playing=data.settings.autoplay;render();if(data.draft)openEditor(data.draft);if(!portable&&!autoStarted){autoStarted=true;scheduleSync(1000);}}catch(e){if(window.ClosetNative)toast(e.message);render();}
}
function render(){renderChildren();renderCloset();renderAlbum();if(state.tab==='settings')renderSettings();}
function switchTab(tab){
 state.tab=tab;$$('.page').forEach(p=>p.classList.toggle('active',p.id===`${tab}-page`));$$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 if(tab==='settings')renderSettings();if(tab==='album')renderAlbum();window.scrollTo(0,0);
}
function renderChildren(){
 $('#child-filters').innerHTML=`<button class="chip ${state.child==='all'?'active':''}" data-child="all">みんなの宝物</button>`+families().map(p=>`<button class="chip face-filter ${state.child===p.id?'active':''}" data-child="${esc(p.id)}">${faceHTML(p)}${esc(p.name)}</button>`).join('')+`<button class="chip ${state.favorites?'active':''}" id="filter-favorites">${icon('heart')}お気に入り</button>`;
 $('#count-number').textContent=realItems().length;$('#sample-hint').classList.toggle('hidden',!isDemo());$('#home-hint').textContent=(isDemo()||portable?.sample?'サンプル · ':'')+'横にスライド · 縦に裏返す · タップで思い出';
}
function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const lanes=[{key:'top',stage:$('#top-stage'),conveyor:$('#top-conveyor'),empty:$('#top-empty'),role:'top',direction:1,playing:true},{key:'bottom',stage:$('#bottom-stage'),conveyor:$('#bottom-conveyor'),empty:$('#bottom-empty'),role:'bottom',direction:-1,playing:true}].map(l=>({...l,slots:[],playlist:[],playlistAt:0,slotWidth:180,pointer:null,dragged:false}));
let lastTime=0;
function laneItems(lane){return closetItems().filter(item=>itemRole(item)===lane.role||(lane.role==='top'&&itemRole(item)==='onepiece'));}
function nextGarment(lane){if(!lane.playlist.length)return null;if(lane.playlistAt>=lane.playlist.length){const last=lane.playlist[ lane.playlist.length-1]?.id;lane.playlist=shuffled(laneItems(lane));if(lane.playlist.length>1&&lane.playlist[0].id===last)[lane.playlist[0],lane.playlist[1]]=[lane.playlist[1],lane.playlist[0]];lane.playlistAt=0;}return lane.playlist[lane.playlistAt++];}
function setSlot(slot,item){
 clearTimeout(slot.flipTimer);slot.item=item;slot.side='front';slot.el.classList.toggle('shelf-item',itemKind(item)!=='clothes');slot.el.innerHTML=`<div class="hanger-turn">${displayStand(item)}<div class="garment"><img src="${photo(item)}" alt="${esc(item.name)}・表" draggable="false"></div>${item.back?'<span class="side-badge">表 ↕ 裏</span>':''}</div><div class="hang-tag">${esc(ownerNames(item).join('・')||'おもいで')}<small>${esc(sizeLabel(item))}</small></div>`;
 slot.el.setAttribute('aria-label',item.name+'の思い出を開く');
}
function renderCloset(){
 for(const lane of lanes){
  const items=laneItems(lane);lane.slotWidth=window.innerWidth>=600?220:180;
  lane.playlist=shuffled(items);lane.playlistAt=0;lane.slots=[];lane.pointer=null;lane.dragged=false;lane.conveyor.innerHTML='';lane.empty.classList.toggle('hidden',items.length>0);
  if(items.length){const count=Math.ceil(lane.stage.clientWidth/lane.slotWidth)+3;for(let i=0;i<count;i++){
   const el=document.createElement('button');el.className='hanging-item';el.type='button';lane.conveyor.append(el);
   const slot={el,x:i*lane.slotWidth-55,phase:Math.random()*Math.PI*2,item:null};setSlot(slot,nextGarment(lane));
   el.addEventListener('click',()=>{if(!lane.dragged)openDetail(slot.item);});lane.slots.push(slot);
  }}positionSlots(lane,performance.now());
 }
 renderKeepsakes();updatePlay();lastTime=0;
}
function lanePlaying(lane){return lane.playing;}
function positionSlots(lane,t){for(const slot of lane.slots||[]){const angle=lanePlaying(lane)&&!lane.pointer?Math.sin(t/2200+slot.phase)*1.15:0;slot.el.style.transform=`translate3d(${slot.x}px,0,0) rotate(${angle}deg)`;}}
function updatePlay(){
 $$('[data-play]').forEach(b=>{const lane=lanes.find(l=>l.key===b.dataset.play);b.innerHTML=icon(lane.playing?'pause':'play');b.setAttribute('aria-pressed',String(lane.playing));});
}
function animate(t){const dt=lastTime?Math.min((t-lastTime)/1000,.05):0;lastTime=t;
 if(state.visible&&state.tab==='closet'&&!state.modal){for(const lane of lanes){
  if(lanePlaying(lane)&&!lane.pointer){for(const s of lane.slots)s.x+=lane.direction*state.settings.speed*dt;recycleSlots(lane);}
  positionSlots(lane,t);
 } keepsakes.elapsed+=dt;if(keepsakes.elapsed>=12&&keepsakes.items.length>1){keepsakes.elapsed=0;showKeepsake(true);}}requestAnimationFrame(animate);
}
function recycleSlots(lane){const slots=lane.slots;if(!slots.length)return;const width=lane.stage.clientWidth,slotWidth=lane.slotWidth;
 for(const s of [...slots].sort((a,b)=>a.x-b.x))if(s.x < -slotWidth-65){s.x=Math.max(...slots.map(q=>q.x))+slotWidth;setSlot(s,nextGarment(lane));}
 for(const s of [...slots].sort((a,b)=>b.x-a.x))if(s.x>width+slotWidth+65){s.x=Math.min(...slots.map(q=>q.x))-slotWidth;setSlot(s,nextGarment(lane));}
}
function flipSlot(slot){if(!slot.item.back){toast('この宝物は表の写真だけを登録しています');return;}if(slot.el.querySelector('.flipping'))return;const turn=slot.el.querySelector('.hanger-turn');turn.classList.add('flipping');slot.side=slot.side==='front'?'back':'front';slot.flipTimer=setTimeout(()=>{turn.querySelector('img').src=photo(slot.item,'display',slot.side);turn.querySelector('img').alt=slot.item.name+(slot.side==='back'?'・裏':'・表');turn.querySelector('.side-badge').textContent=slot.side==='back'?'裏 ↕ 表':'表 ↕ 裏';},180);setTimeout(()=>turn.classList.remove('flipping'),400);}
for(const lane of lanes){
 lane.stage.addEventListener('pointerdown',e=>{lane.pointer={x:e.clientX,startX:e.clientX,startY:e.clientY,id:e.pointerId,slot:lane.slots.find(s=>s.el===e.target.closest('.hanging-item')),axis:null,flipped:false};lane.dragged=false;});
 lane.stage.addEventListener('pointermove',e=>{const p=lane.pointer;if(!p||p.id!==e.pointerId)return;const dx=e.clientX-p.startX,dy=e.clientY-p.startY;if(!p.axis&&Math.hypot(dx,dy)>8)p.axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';if(p.axis){lane.dragged=true;if(!lane.stage.hasPointerCapture(e.pointerId))lane.stage.setPointerCapture(e.pointerId);if(p.axis==='x'){for(const s of lane.slots)s.x+=e.clientX-p.x;recycleSlots(lane);positionSlots(lane,performance.now());}else if(p.slot&&!p.flipped&&Math.abs(dy)>32){p.flipped=true;flipSlot(p.slot);}}p.x=e.clientX;});
}
window.addEventListener('pointerup',()=>{for(const lane of lanes)lane.pointer=null;setTimeout(()=>{for(const lane of lanes)lane.dragged=false;},50);});window.addEventListener('pointercancel',()=>{for(const lane of lanes)lane.pointer=null;});
document.addEventListener('visibilitychange',()=>state.visible=!document.hidden);
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!state.modal)renderCloset();},180);});
const keepsakes={items:[],index:-1,elapsed:0};
function renderKeepsakes(){keepsakes.items=shuffled(closetItems().filter(x=>itemKind(x)!=='clothes'||itemRole(x)==='none'));keepsakes.index=-1;keepsakes.elapsed=0;$('#keepsake-visual').innerHTML='';showKeepsake(false);}
function showKeepsake(fade){
 const items=keepsakes.items;$('#keepsake-next').disabled=items.length<2;
 if(!items.length){$('#keepsake-visual').innerHTML=`<span class="keepsake-empty">${portable?'このアルバムには<br>小物・おもちゃがありません':'小物やおもちゃも<br>ここに残せます'}</span>`;$('#keepsake-caption').textContent='';return;}
 keepsakes.index=(keepsakes.index+1)%items.length;const item=items[keepsakes.index];
 const old=$('#keepsake-visual').querySelector('.keepsake-photo');const button=document.createElement('button');button.className='keepsake-photo'+(fade?' entering':'');button.innerHTML=`<img src="${photo(item)}" alt="${esc(item.name)}">`;button.setAttribute('aria-label',item.name+'の思い出を開く');button.onclick=()=>openDetail(item);$('#keepsake-visual').append(button);
 if(fade){requestAnimationFrame(()=>requestAnimationFrame(()=>button.classList.remove('entering')));if(old){old.classList.add('leaving');setTimeout(()=>old.remove(),950);}}else old?.remove();
 $('#keepsake-caption').textContent=item.name;
}
function renderAlbum(){
 const items=realItems(),term=($('#search').value||'').toLowerCase();
 const cats=[...new Set(items.map(x=>x.category))];
 $('#category-filters').innerHTML=`<button class="chip ${state.category==='all'?'active':''}" data-category="all">すべて</button>`+cats.map(c=>`<button class="chip ${state.category===c?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('');
 const filtered=items.filter(x=>(state.child==='all'||ownerIdsFor(x).includes(state.child))&&(!state.favorites||x.favorite)&&(state.category==='all'||x.category===state.category)&&[x.name,...ownerNames(x),x.category,x.size,x.period,x.note,x.color,...(x.memories||[]).map(m=>m.caption)].join(' ').toLowerCase().includes(term));
 $('#album-info').textContent=`${filtered.length}点の思い出${state.child!=='all'?' · '+(families().find(p=>p.id===state.child)?.name||'')+'の宝物':''}`;
 $('#album-grid').innerHTML=filtered.length?filtered.map(x=>`<article class="album-card" data-open="${esc(x.id)}" tabindex="0" role="button" aria-label="${esc(x.name)}の思い出を開く"><button ${portable?'disabled':''} class="favorite-btn ${x.favorite?'selected':''}" data-favorite="${esc(x.id)}" aria-label="お気に入り${x.favorite?'を解除':'にする'}">${icon('heart')}</button><img class="album-image" src="${photo(x)}" alt="${esc(x.name)}"><h3>${esc(x.name)}</h3><small>${esc([ownerNames(x).join("・"),sizeLabel(x),x.period].filter(Boolean).join(' · '))}</small></article>`).join(''):`<div class="empty-state">${icon('hanger')}<h2>${items.length?'品物が見つかりません':portable?'このアルバムは空です':'最初の1点を残しましょう'}</h2><p>${items.length?'別の言葉や種類で探してみてください。':portable?'Androidアプリで思い出を登録して、もう一度書き出してください。':'写真といっしょに、小さな思い出を。'}</p>${items.length||portable?'':'<button class="textbtn" id="empty-add">思い出の写真を追加する</button>'}</div>`;
}
function renderSettings(){
 if(portable){renderPortableSettings();return;}
 const s=state.settings,trash=state.items.filter(x=>x.archived);
 $('#settings-content').innerHTML=`
 <form id="settings-form"><div class="setting-card"><h2>${icon('spark')} <span>思い出の品を見分けるAI</span></h2><span class="key-state ${s.hasKey?'':'missing'}">${s.hasKey?'Geminiキーを保存済み':'Geminiキー未設定'}</span><label class="field"><span>Gemini APIキー</span><input id="api-key" type="password" placeholder="${s.hasKey?'変更するときだけ新しいキーを入力':'APIキーを貼り付け'}" autocomplete="off" autocapitalize="none" spellcheck="false"><small>キーは端末内に暗号化して保存。APKやバックアップには含めません。</small></label><label class="checkline"><input id="ai-consent" type="checkbox" ${s.consent?'checked':''}><span>品物の分類のため、写真をGeminiに送信する<br><small>AIの利用料はご自身のGemini API利用枠に応じます。</small></span></label><details><summary class="textbtn">使用するモデル</summary><label class="field"><span>モデル名</span><input id="model-name" value="${esc(s.model)}" autocapitalize="none" spellcheck="false"><small>標準は gemini-3.5-flash-lite。ご自身の利用可能なモデルに変更できます。</small></label></details><p>背景除去はGoogle Play開発者サービスのAIを使い、端末内で処理します。初回はモデルのダウンロードが必要です。</p>${s.hasKey?'<button class="textbtn" type="button" id="remove-key">保存したAPIキーを削除</button>':''}</div>

 <div class="setting-card"><h2>宝物の流れ方</h2><label class="checkline"><input id="autoplay" type="checkbox" ${s.autoplay?'checked':''}>起動したら自動で宝物を流す</label><label class="field"><span>ゆっくり <span style="float:right">はやく</span></span><input id="speed" type="range" min="5" max="70" value="${s.speed}"></label><button class="primary" type="submit">設定を保存</button></div></form>
 ${familySettingsHTML()}
 <div class="setting-card"><h2>日常に、思い出を飾る</h2><p>保存した写真が、ホーム画面や充電中の画面でそっと切り替わります。</p>
 <label class="field"><span>飾る思い出</span><select id="ambient-filter"><option value="all" ${s.ambientFilter!=='favorites'?'selected':''}>すべての宝物</option><option value="favorites" ${s.ambientFilter==='favorites'?'selected':''}>お気に入りだけ</option></select></label>
 <div class="two-fields"><label class="field"><span>スクリーンセーバー</span><select id="dream-seconds">${[10,20,30,60,120].map(n=>`<option value="${n}" ${(s.dreamSeconds||20)===n?'selected':''}>${n}秒ごと</option>`).join('')}</select></label><label class="field"><span>ウィジェット</span><select id="widget-seconds">${[30,60,120].map(n=>`<option value="${n}" ${(s.widgetSeconds||30)===n?'selected':''}>${n}秒ごと</option>`).join('')}</select></label></div>
 <button class="secondary" id="save-ambient">表示設定を保存</button><div class="ambient-buttons"><button class="secondary" id="pin-widget">ホーム画面にウィジェットを追加</button><button class="secondary" id="dream-preview">スクリーンセーバーを試す</button><button class="textbtn" id="dream-settings">Androidのスクリーンセーバー設定を開く ↗</button></div><p>Android設定で「おもいでクローゼット」を選びます。充電中・ドック接続中など、起動条件や対応は端末によって異なります。ウィジェットは写真を切り替える表示です。↻を押すと並びが変わります。</p></div>
 <div class="setting-card" id="drive-card"><h2>Google Driveで思い出を共有</h2><p>同じフォルダを使う端末の写真と記録を統合します。違うGoogleアカウントで使う場合は、Driveでフォルダを相手に「編集者」として共有してください。</p>
 <div class="drive-account">${s.driveAccount?esc(s.driveAccount):'Googleへの接続は未設定'}</div>
 ${s.driveAccount?`<div class="drive-folder">${s.driveFolder?'同期先：'+esc(s.driveFolderName||'共有フォルダ'):'同期するフォルダを選んでください'}</div>${s.driveFolder?`<label class="field"><span>ほかの端末で使うフォルダURL</span><input readonly id="share-folder" value="https://drive.google.com/drive/folders/${esc(s.driveFolder)}"></label>`:''}<label class="field"><span>共有フォルダのURL・ID</span><input id="drive-folder-input" placeholder="https://drive.google.com/drive/folders/…" autocomplete="off" autocapitalize="none"></label><div class="backup-buttons"><button class="secondary drive-action" id="drive-join">このフォルダを使って統合</button>${s.driveFolder?'':'<button class="secondary drive-action" id="drive-create">新しい同期フォルダを作る</button>'}</div><label class="checkline"><input id="drive-auto" type="checkbox" ${s.driveAuto?'checked':''}><span>アプリを開いた時・記録した時に同期<br><small>表示中は約5分ごとにも確認します。</small></span></label><label class="field"><span>この端末の呼び名</span><input id="device-name" value="${esc(s.deviceName||'スマホ')}" maxlength="60"></label><button class="secondary" id="drive-save">同期設定を保存</button>${s.driveFolder?'<button class="primary drive-action" id="drive-sync">今すぐ同期・統合</button>':''}<button class="textbtn drive-action" id="drive-disconnect">この端末の接続を解除</button>`:'<button class="secondary drive-action" id="drive-connect">Googleに接続する</button>'}
 <p id="sync-status" role="status">${state.syncing?'同期しています…':s.lastSync?'前回の同期：'+esc(new Date(s.lastSync).toLocaleString('ja-JP')):'写真と記録は、同期の設定後に送信します。'}</p><p>同時編集で内容が違う場合は「同時編集の別版」として両方を残します。家族の顔写真・裏面・着用写真も同期します。APIキーや下書きは共有しません。同期する端末はすべて1.3.0以降に更新してください。</p>
 <details class="drive-setup"><summary>初回のGoogle設定</summary><p>個人用APKからGoogleに接続するため、Google Cloudで一度アプリを登録します。</p><ol><li>Google Cloudでプロジェクトを作り、Google Drive APIを有効にします。</li><li>Google Auth Platformで個人用の外部テストアプリを設定し、使うGoogleアカウントをテストユーザーに追加します。</li><li>OAuthクライアントを「Android」で作り、下のパッケージ名とSHA-1を登録します。</li></ol><div class="setup-code">jp.omoide.closet<br>E6:C0:02:3F:71:1E:23:5D:18:97:A5:ED:8E:74:BD:D9:C1:5F:6E:35</div><p>Driveの権限は https://www.googleapis.com/auth/drive を使います。Googleの許可画面はDrive全体へのアクセスとして表示されます。アプリの読み書きは指定したフォルダ内の同期ファイルに限定しています。クライアントシークレットの入力は不要です。</p></details></div>
 <div class="setting-card"><h2>思い出を持ち出す</h2><p>元写真・切り抜き・思い出の記録をZIPにまとめます。ZIPには、スマホと同じ見た目でスワイプ・検索できる「closet.html」も入ります。HTMLには裏面・着用写真・家族の顔写真も埋め込み、ネット接続なしで見られます。渡す相手にこれらの写真が見えることも確認してください。</p><div class="backup-buttons"><button class="secondary" id="backup">${icon('download')}すべての思い出をバックアップ</button><button class="secondary" id="restore-backup">${icon('upload')}バックアップから追加・復元</button></div><p>復元は今ある思い出を残し、未登録の品物を追加します。同じIDの品物は重複登録しません。復元は1ファイル500MBまで。</p></div>
 <div class="setting-card"><h2>ごみ箱 <span style="color:var(--sub);font-size:12px">${trash.length}点</span></h2><p>アルバムから外した品物を元に戻せます。バックアップにも含まれます。</p>${trash.map(x=>`<div class="trash-row"><span>${esc(x.name)}</span><button data-restore="${esc(x.id)}">元に戻す</button></div>`).join('')}</div>
 <div class="version">おもいでクローゼット 1.3.0<br>手放す宝物に、ありがとうを。</div>`;
 $('#settings-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{
  state.settings=await api('settings',{apiKey:$('#api-key').value,consent:$('#ai-consent').checked,model:$('#model-name').value,speed:Number($('#speed').value),autoplay:$('#autoplay').checked});state.playing=state.settings.autoplay;for(const lane of lanes)lane.playing=state.settings.autoplay;render();toast('設定を保存しました');
 }catch(e){toast(e.message);b.disabled=false;}});
 bindFamilySettings();
 $('#save-ambient').onclick=async()=>{try{state.settings=await api('settings',{ambientFilter:$('#ambient-filter').value,dreamSeconds:Number($('#dream-seconds').value),widgetSeconds:Number($('#widget-seconds').value)});toast('飾り方を保存しました');}catch(e){toast(e.message);}};
 $('#pin-widget').onclick=async()=>{try{const r=await api('pinWidget');if(!r.requested)toast('ホーム画面を長押し → ウィジェット → おもいでクローゼットで追加できます');}catch(e){toast(e.message);}};
 $('#dream-preview').onclick=()=>api('dreamPreview').catch(e=>toast(e.message));$('#dream-settings').onclick=()=>api('dreamSettings').catch(e=>toast(e.message));
 $('#drive-connect')?.addEventListener('click',()=>driveAction('driveConnect'));
 $('#drive-create')?.addEventListener('click',()=>driveAction('driveCreate'));
 $('#drive-join')?.addEventListener('click',()=>driveAction('driveJoin',{folder:$('#drive-folder-input').value}));
 $('#drive-sync')?.addEventListener('click',()=>driveAction('driveSync'));
 $('#drive-disconnect')?.addEventListener('click',async()=>{try{state.settings=await api('driveDisconnect');renderSettings();toast('この端末の接続を解除しました');}catch(e){toast(e.message);}});
 $('#drive-save')?.addEventListener('click',async()=>{try{state.settings=await api('settings',{driveAuto:$('#drive-auto').checked,deviceName:$('#device-name').value});toast('同期設定を保存しました');scheduleSync(1000);}catch(e){toast(e.message);}});
 $$('.drive-action').forEach(b=>b.disabled=state.syncing);
 $('#backup').addEventListener('click',()=>backupAction('export'));
 $('#restore-backup').addEventListener('click',()=>confirmSheet('バックアップを復元','今ある思い出を残して、まだ登録されていない服を追加します。ZIPを選択してください。','ZIPを選ぶ',()=>backupAction('import')));
 $('#remove-key')?.addEventListener('click',async()=>{try{state.settings=await api('settings',{removeKey:true,consent:false});renderSettings();toast('キーを削除しました');}catch(e){toast(e.message);}});
}
let autoStarted=false,syncTimer;
function scheduleSync(delay=2500){
 clearTimeout(syncTimer);
 if(portable||state.syncing||!state.settings.driveAuto||!state.settings.driveFolder||!state.settings.driveAccount)return;
 syncTimer=setTimeout(()=>{if(!state.visible||!state.settings.driveAuto||!state.settings.driveFolder||!state.settings.driveAccount)return;if(state.modal||state.processing||state.syncing){scheduleSync(5000);return;}driveAction('driveSync',{silent:true},true);},delay);
}
async function driveAction(op,params={},automatic=false){
 if(state.syncing)return;state.syncing=true;if($('#sync-status'))$('#sync-status').textContent=op==='driveConnect'?'Googleに接続しています…':'写真と記録を同期しています…';$$('.drive-action').forEach(b=>b.disabled=true);
 let result=null;
 try{result=await api(op,params);if(result.cancelled)return;if(result.needsLogin){if($('#sync-status'))$('#sync-status').textContent='Googleへの再接続が必要です。「今すぐ同期」を押してください。';return;}
  const data=await api('bootstrap');state.items=data.items;state.settings=data.settings;state.syncing=false;render();
  if(op==='driveConnect')toast('Googleに接続しました。同期フォルダを指定してください。');
  else if(!automatic||result.added||result.updated||result.conflicts)toast(`同期しました：追加${result.added||0}点・更新${result.updated||0}点${result.conflicts?'（同時編集の別版を'+result.conflicts+'点保存）':''}`);
 }catch(e){try{const fresh=await api('bootstrap');state.settings=fresh.settings;state.items=fresh.items;render();}catch(ignored){}if($('#sync-status'))$('#sync-status').textContent=e.message;if(!automatic)toast(e.message);}
 finally{state.syncing=false;$$('.drive-action').forEach(b=>b.disabled=false);if(result?.cancelled&&$('#sync-status'))$('#sync-status').textContent=state.settings.lastSync?'前回の同期：'+new Date(state.settings.lastSync).toLocaleString('ja-JP'):'写真と記録は、同期の設定後に送信します。';}
}
setInterval(()=>{if(state.visible)scheduleSync(1000);},300000);
function renderPortableSettings(){
 $('#settings-content').innerHTML=`<div class="setting-card"><h2>アルバムの見方</h2><p>このHTMLは閲覧用のアルバムです。横スワイプで服を流し、縦スワイプで裏返せます。関連する品物や着用写真も開けます。検索やお気に入りの絞り込みで思い出を楽しめます。撮影と記録の編集はAndroidアプリで行えます。</p><label class="checkline"><input type="checkbox" id="portable-autoplay" ${lanes.some(l=>l.playing)?'checked':''}>宝物を自動で流す</label><label class="field"><span>ゆっくり <span style="float:right">はやく</span></span><input id="portable-speed" type="range" min="5" max="70" value="${state.settings.speed}"></label><p>作成日：${esc(portable.exported?new Date(portable.exported).toLocaleString('ja-JP'):'')}</p></div>`;
 $('#portable-speed').oninput=e=>state.settings.speed=Number(e.target.value);$('#portable-autoplay').onchange=e=>{for(const lane of lanes)lane.playing=e.target.checked;updatePlay();};
}
function familySettingsHTML(){return `<div class="setting-card" id="family-card"><h2>家族の顔と呼び名</h2><p>顔写真は任意です。登録すると、取り込み時に顔をタップして選べます。</p><div class="family-list">${families().map(p=>`<button class="family-row" data-family="${esc(p.id)}">${faceHTML(p)}<span>${esc(p.name)}<small>${p.avatarId?'顔写真を登録済み':'呼び名だけでも使えます'}</small></span><span>編集 ›</span></button>`).join('')}</div><button class="secondary" id="add-family">＋ 家族を追加</button><p>同じ服を姉妹・兄弟で着た場合は、両方の顔を選んで残せます。</p></div>`;}
function bindFamilySettings(){$$('[data-family]').forEach(b=>b.onclick=()=>editFamily(families().find(p=>p.id===b.dataset.family)));$('#add-family').onclick=()=>editFamily(null);}
async function refreshFamily(){const data=await api('bootstrap');state.settings=data.settings;state.items=data.items;render();scheduleSync(2500);}
function editFamily(person){if(state.syncing){toast('同期が終わると、家族を編集できます。');return;}sheet(person?'家族の顔と呼び名':'家族を追加',`<form id="family-form"><label class="field"><span>名前・呼び名</span><input id="family-name" value="${esc(person?.name||'')}" maxlength="30" placeholder="例：長女" required></label></form>${person?`<div class="family-preview">${faceHTML(person)}</div><button class="capture-option" id="family-photo">${icon('photo')}顔写真を登録・変更</button>${person.avatarId?'<button class="textbtn danger" id="family-remove-photo">顔写真を外す</button>':''}`:'<p class="tip">呼び名を保存してから、顔写真を追加できます。</p>'}`,'<button class="primary" id="family-save">呼び名を保存</button>','family');
 const save=async()=>{const name=$('#family-name').value.trim();if(!name){toast('呼び名を入力してください');return;}$('#family-save').disabled=true;try{const r=await api('familySave',{id:person?.id||'',name});await refreshFamily();editFamily(r);toast('家族を保存しました');}catch(e){toast(e.message);if($('#family-save'))$('#family-save').disabled=false;}};$('#family-save').onclick=save;$('#family-form').onsubmit=e=>{e.preventDefault();save();};
 $('#family-photo')?.addEventListener('click',()=>{const name=$('#family-name').value;chooseFamilyPhoto(person,name);});$('#family-remove-photo')?.addEventListener('click',async()=>{try{const r=await api('familySave',{id:person.id,name:$('#family-name').value,removeAvatar:true});await refreshFamily();editFamily(r);}catch(e){toast(e.message);}});
}
function chooseFamilyPhoto(person,name){sheet('顔写真を選ぶ',`<button class="capture-option" id="face-camera">${icon('camera')}写真を撮る</button><button class="capture-option" id="face-gallery">${icon('photo')}写真から選ぶ</button><p class="tip">選んだ写真は端末に保存します。Drive同期とHTML書き出しにも含まれます。</p>`,'<button class="secondary" id="face-cancel">戻る</button>','family-photo');$('#close-sheet').onclick=$('#face-cancel').onclick=()=>editFamily({...person,name});for(const op of ['camera','gallery'])$('#face-'+op).onclick=async()=>{closeSheet(true);state.processing=true;try{const r=await api(op,{id:person.id,photoKind:'avatar'});state.processing=false;if(r.cancelled){editFamily({...person,name});return;}await refreshFamily();cropFace(r,name);}catch(e){state.processing=false;editFamily({...person,name});toast(e.message);}};}
async function cropFace(person,name){sheet('顔を丸の中央に',`<p class="tip">写真を指で動かして、顔が中央にくるように調整してください。</p><div class="face-crop-wrap"><canvas id="face-canvas" width="480" height="480"></canvas><span class="face-crop-guide"></span></div><label class="field"><span>拡大</span><input id="face-zoom" type="range" min="1" max="3" step=".02" value="1"></label>`,'<button class="secondary" id="face-crop-cancel">戻る</button><button class="primary" id="face-crop-save">この顔写真を使う</button>','family-crop');$('#face-crop-save').disabled=true;$('#close-sheet').onclick=$('#face-crop-cancel').onclick=()=>editFamily({...person,name});try{const image=await loadImage(mediaPhoto(person.avatarId,'.jpg',person._sync?.revision||0)),canvas=$('#face-canvas'),ctx=canvas.getContext('2d');let zoom=1,x=0,y=0,down=null;const draw=()=>{const scale=Math.max(480/image.naturalWidth,480/image.naturalHeight)*zoom,w=image.naturalWidth*scale,h=image.naturalHeight*scale;x=Math.max(-(w-480)/2,Math.min((w-480)/2,x));y=Math.max(-(h-480)/2,Math.min((h-480)/2,y));ctx.drawImage(image,(480-w)/2+x,(480-h)/2+y,w,h);};draw();canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);down={x:e.clientX,y:e.clientY};};canvas.onpointermove=e=>{if(!down)return;const scale=480/canvas.clientWidth;x+=(e.clientX-down.x)*scale;y+=(e.clientY-down.y)*scale;down={x:e.clientX,y:e.clientY};draw();};canvas.onpointerup=canvas.onpointercancel=()=>down=null;$('#face-zoom').oninput=e=>{zoom=Number(e.target.value);draw();};$('#face-crop-save').disabled=false;$('#face-crop-save').onclick=async()=>{const btn=$('#face-crop-save');btn.disabled=true;try{const r=await api('avatarCrop',{id:person.id,png:canvas.toDataURL('image/png')});await refreshFamily();editFamily({...r,name});toast('顔写真を保存しました');}catch(e){toast(e.message);btn.disabled=false;}};}catch(e){toast('顔写真を読み込めませんでした');}}
async function backupAction(op){
 closeSheet(true);try{const r=await api(op);if(r.cancelled)return;if(op==='import'){const data=await api('bootstrap');state.items=data.items;state.settings=data.settings;render();toast(`${r.added}点を復元しました（重複${r.skipped}点）`);}else toast('バックアップを保存しました');}catch(e){toast(e.message);}
}
function sheet(title,body,footer='',modal='generic'){
 state.modal=modal;$('#overlay').innerHTML=`<section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-handle"></div><div class="sheet-header"><h2>${esc(title)}</h2><button class="iconbtn" id="close-sheet" aria-label="閉じる">${icon('close')}</button></div><div class="sheet-body">${body}</div>${footer?`<div class="sheet-footer">${footer}</div>`:''}</section>`;$('#overlay').classList.remove('hidden');document.body.style.overflow='hidden';$('#close-sheet').onclick=()=>closeSheet();
}
function closeSheet(force=false){
 if(state.processing&&!force){toast('処理中です。写真は端末に保存されています。');return;}
 if((state.modal==='edit'||state.modal==='cutout')&&!force){
  if(state.modal==='cutout'){openEditor(editItem);return;}
  confirmSheet('編集を閉じますか？','入力した変更は保存されません。新しい写真は下書きとして残ります。','閉じる',()=>{closeSheet(true);editItem=null;},'edit');return;
 }
 state.modal=null;$('#overlay').classList.add('hidden');$('#overlay').innerHTML='';document.body.style.overflow='';
}
function confirmSheet(title,message,confirm,action,returnTo=null){const old=editItem;
 sheet(title,`<p class="tip">${esc(message)}</p>`,`<button class="secondary" id="confirm-cancel">戻る</button><button class="primary" id="confirm-ok">${esc(confirm)}</button>`,'confirm');
 $('#confirm-cancel').addEventListener('click',()=>returnTo==='edit'?openEditor(old):closeSheet(true));$('#confirm-ok').addEventListener('click',action);
 if(returnTo==='edit')$('#close-sheet').onclick=()=>openEditor(old);
}
function openCapture(){
 if(state.syncing){toast('同期が終わると、写真を追加できます。');return;}
 if(portable){const play=!lanes.every(l=>l.playing);for(const lane of lanes)lane.playing=play;updatePlay();$('#capture-icon').innerHTML=icon(play?'pause':'play');toast(play?'再生しました':'流れる宝物を止めました');return;}
 if(state.draft){confirmSheet('下書きの写真があります','下書きを続ける場合は「下書きを開く」を押してください。新しく撮る場合は、下書きを保存してから追加してください。','下書きを開く',()=>openEditor(state.draft));return;}
 sheet('思い出を1点残す',`<div class="owner-section"><h3>誰の宝物？</h3><p>顔をタップして選択。姉妹・兄弟など複数人も選べます。</p>${ownersHTML(state.child==='all'?[]:[state.child])}</div><button class="capture-option" id="take-photo"><span class="option-icon">${icon('camera')}</span><span><strong>宝物の写真を撮る</strong><small>服・アクセサリー・おもちゃを1点ずつ</small></span></button><button class="capture-option" id="pick-photo"><span class="option-icon">${icon('photo')}</span><span><strong>写真から選ぶ</strong><small>すでに撮った写真も使えます</small></span></button><div class="tip">品物と違う色の無地の背景がおすすめです。<br>品物の端まで入れて、明るい場所で撮るときれいに切り抜けます。</div>${state.settings.hasKey&&state.settings.consent?'':'<div class="notice">Geminiキーを設定すると、品物の種類をAIが自動入力します。背景除去と手動登録は、キーがなくても使えます。</div>'}`);
 $('#take-photo').addEventListener('click',()=>capture('camera'));$('#pick-photo').addEventListener('click',()=>capture('gallery'));
}
async function capture(op){
 const ownerIds=selectedOwners();closeSheet(true);try{const d=await api(op,{ownerIds});if(d.cancelled)return;state.draft=d;openEditor(d);await runAnalysis(d);}catch(e){toast(e.message);}
}
function editorValues(){if(state.modal!=='edit'||!$('#edit-form'))return;for(const key of ['name','category','kind','wardrobeRole','size','period','note','color'])editItem[key]=$('#f-'+key).value;editItem.ownerIds=selectedOwners();editItem.children=editItem.ownerIds.map(id=>families().find(p=>p.id===id)?.name).filter(Boolean);editItem.child=editItem.children[0]||'';editItem.favorite=$('#f-favorite').checked;for(const el of $$('[data-caption]')){const m=editItem.memories?.find(m=>m.id===el.dataset.caption);if(m)m.caption=el.value;}if(state.draft?.id===editItem.id)state.draft={...editItem};}
function openEditor(item){
 if(state.syncing){toast('同期が終わると、記録を編集できます。');return;}
 editItem={...item,kind:itemKind(item),wardrobeRole:itemRole(item)};const x=editItem;
 sheet(state.items.some(q=>q.id===x.id)?'思い出を編集':'新しい宝物を残す',`
 <div class="preview" id="edit-preview">${displayStand(x)}<img src="${photo(x)}" alt="切り抜いた宝物"><button class="image-mode" id="toggle-original">元写真を見る</button></div>
 <div id="status-area">${statusHTML(x)}</div><div class="editor-actions"><button class="secondary" id="adjust-cutout">${icon('edit')}切り抜きを補正</button><button class="secondary" id="retry-ai">${icon('spark')}AIを再実行</button></div>
 <form id="edit-form"><label class="field"><span>宝物の名前</span><input id="f-name" value="${esc(x.name)}" placeholder="例：はじめてのお出かけワンピース" maxlength="200"></label><div class="owner-section"><h3>誰の宝物？ <small>複数選択できます</small></h3>${ownersHTML(ownerIdsFor(x))}</div><div class="two-fields"><label class="field"><span>大きな分類</span><select id="f-kind">${Object.entries(kinds).map(([k,v])=>`<option value="${k}" ${k===x.kind?'selected':''}>${v}</option>`).join('')}</select></label><label class="field"><span>コーディネートの位置</span><select id="f-wardrobeRole">${Object.entries(roles).map(([k,v])=>`<option value="${k}" ${k===x.wardrobeRole?'selected':''}>${v}</option>`).join('')}</select></label></div><label class="field"><span>種類</span><select id="f-category">${categories.map(c=>`<option ${c===x.category?'selected':''}>${esc(c)}</option>`).join('')}</select></label><div class="two-fields"><label class="field"><span>サイズ</span><input id="f-size" value="${esc(x.size)}" placeholder="例：90 / 3T" maxlength="30"></label><label class="field"><span>使っていたころ</span><input id="f-period" value="${esc(x.period)}" placeholder="例：2歳の夏" maxlength="80"></label></div><label class="field"><span>色・柄</span><input id="f-color" value="${esc(x.color)}" placeholder="例：ピンク・花柄" maxlength="100"></label><label class="field"><span>この宝物の思い出</span><textarea id="f-note" placeholder="どんな日に使った？ どんな姿を覚えている？" maxlength="4000">${esc(x.note)}</textarea></label><label class="checkline"><input id="f-favorite" type="checkbox" ${x.favorite?'checked':''}>とくに大切な1点にする</label></form>
 ${attachmentsHTML(x)}
 ${state.items.some(q=>q.id===x.id)?'':'<button class="textbtn danger" id="discard-draft">この下書きを取り消す</button>'}`,
 `<button class="primary" id="save-garment">${icon('hanger')}クローゼットに残す</button>`,'edit');
 const refreshStand=()=>{const kind=$('#f-kind').value;$('#f-wardrobeRole').disabled=kind!=='clothes';if(kind!=='clothes')$('#f-wardrobeRole').value='none';const preview=$('#edit-preview');preview.querySelector('.hanger,.item-plinth')?.remove();preview.insertAdjacentHTML('afterbegin',displayStand({...editItem,kind,wardrobeRole:$('#f-wardrobeRole').value}));};
 $('#f-category').onchange=()=>{$('#f-kind').value=inferKind($('#f-category').value);$('#f-wardrobeRole').value=inferRole($('#f-category').value);refreshStand();};$('#f-kind').onchange=refreshStand;$('#f-wardrobeRole').onchange=refreshStand;refreshStand();
 let original=false;$('#toggle-original').addEventListener('click',()=>{original=!original;$('#edit-preview img').src=photo(x,original?'original':'display');$('#edit-preview').classList.toggle('original',original);$('#edit-preview .hanger')?.classList.toggle('hidden',original);$('#edit-preview .item-plinth')?.classList.toggle('hidden',original);$('#toggle-original').textContent=original?'切り抜きを見る':'元写真を見る';});
 $('#adjust-cutout').addEventListener('click',()=>{editorValues();openCutout(editItem);});
 $('#retry-ai').addEventListener('click',()=>{editorValues();runAnalysis(editItem);});
 $('#save-garment').addEventListener('click',saveEditor);
 $('#edit-form').onsubmit=e=>{e.preventDefault();saveEditor();};bindAttachments();
 $('#discard-draft')?.addEventListener('click',()=>{editorValues();confirmSheet('下書きを取り消しますか？','この写真の登録を取り消します。元の撮影写真は端末の写真アプリには追加されていません。','取り消す',async()=>{try{await api('discard');state.draft=null;closeSheet(true);toast('下書きを取り消しました');}catch(e){toast(e.message);}},'edit');});
}
function statusHTML(x){
 let h=x.segmentation==='ready'||x.segmentation==='manual'?'<div class="notice good">切り抜きができました。形を確認してから残してください。</div>':'';
 if(x.segmentation==='failed')h+=`<div class="notice">${esc(x.segmentError)}</div>`;
 if(x.classification==='unconfigured')h+='<div class="notice">種類は手動で選べます。AI分類を使う場合は設定でGeminiキーを入力してください。</div>';
 if(x.classification==='failed')h+=`<div class="notice">${esc(x.classifyError)}</div>`;
 if(x.classification==='ready')h+='<div class="notice good">AIが種類・名前・色を入力しました。自由に変更できます。</div>';
 return h;
}
async function runAnalysis(item){
 if(state.processing)return;editorValues();const local={...editItem};state.processing=true;
 $('#status-area').innerHTML='<div class="process-status"><span class="spinner"></span><span id="process-text">品物のAI処理を開始しています…</span></div>';
 for(const id of ['save-garment','adjust-cutout','retry-ai','discard-draft'])if($('#'+id))$('#'+id).disabled=true;
 try{
  const result=await api('analyze',{id:item.id});
  editorValues();const form={...editItem};
  const merged=preserveForm(result,form);
  for(const key of ['name','category','kind','wardrobeRole','color'])if(form[key]===local[key])merged[key]=result[key];
  for(const key of ['name','category','kind','wardrobeRole','color'])if(form[key]!==local[key])merged[key]=form[key];
  if(state.draft?.id===result.id)state.draft=merged;else updateItem(result);
  state.processing=false;openEditor(merged);
 }catch(e){state.processing=false;$('#status-area').innerHTML=`<div class="notice">${esc(e.message)}</div>`;for(const id of ['save-garment','adjust-cutout','retry-ai','discard-draft'])if($('#'+id))$('#'+id).disabled=false;}
}
async function saveEditor(){
 editorValues();const btn=$('#save-garment');btn.disabled=true;try{const item=await api('save',editItem);updateItem(item);const fresh=await api('bootstrap');state.items=fresh.items;state.settings=fresh.settings;state.draft=null;closeSheet(true);render();switchTab('closet');toast('思い出をクローゼットに残しました');}catch(e){toast(e.message);btn.disabled=false;}
}
function attachmentsHTML(x){const linked=(x.relatedIds||[]).map(id=>state.items.find(i=>i.id===id)).filter(Boolean);return `<section class="extra-card"><div class="extra-heading"><h3>裏面の写真 <small>任意</small></h3><button class="textbtn" id="add-back">${x.back?'撮り直す':'＋ 写真を追加'}</button></div><p>背中の柄も残したいときに。表だけでも保存できます。</p>${x.back?`<div class="back-photo"><img src="${photo(x,'display','back')}" alt="裏面の写真"><div><small>${x.back.segmentation==='pending'?'背景除去はこれから':x.back.segmentation==='failed'?'手動で切り抜きを補正できます':'裏面を登録済み'}</small><button class="textbtn" id="adjust-back">切り抜きを補正</button><button class="textbtn" id="analyze-back">背景除去をやり直す</button><button class="textbtn danger" id="remove-back">裏面を外す</button></div></div>`:''}</section><section class="extra-card"><div class="extra-heading"><h3>着用写真・関連写真</h3><button class="textbtn" id="add-memory">＋ 写真を追加</button></div><p>着ていた姿や、一緒に遊んだ日の写真を添えられます。</p><div class="memory-edit-list">${(x.memories||[]).map(m=>`<div class="memory-edit"><button class="memory-thumb" data-view-memory="${esc(m.id)}"><img src="${esc(memorySource(x,m))}" alt="${esc(m.caption||'関連する写真')}"></button><label class="field"><span>この写真の思い出</span><textarea data-caption="${esc(m.id)}" maxlength="1000" rows="2" placeholder="例：姉妹で着たお泊まりの日">${esc(m.caption)}</textarea></label><button class="textbtn danger" data-remove-memory="${esc(m.id)}" aria-label="関連写真を外す">${icon('close')}</button></div>`).join('')}</div></section><section class="extra-card"><div class="extra-heading"><h3>セット・関連アイテム</h3><button class="textbtn" id="choose-related">＋ 選んで紐付け</button></div><p>パジャマの上下などを別々に登録して、セットとして紐付けられます。</p><div class="related-tags">${linked.map(i=>`<span>${esc(i.name)}</span>`).join('')||'<small>まだ紐付けていません</small>'}</div></section>`;}
function bindAttachments(){
 $('#add-back').onclick=()=>{editorValues();chooseAttachment('back');};$('#add-memory').onclick=()=>{editorValues();chooseAttachment('memory');};$('#choose-related').onclick=()=>{editorValues();chooseRelated();};
 $('#adjust-back')?.addEventListener('click',()=>{editorValues();openCutout(editItem,'back');});$('#analyze-back')?.addEventListener('click',()=>{editorValues();analyzeBack(editItem);});
 $('#remove-back')?.addEventListener('click',()=>removeAttachment('back'));
 $$('[data-remove-memory]').forEach(b=>b.onclick=()=>removeAttachment('memory',b.dataset.removeMemory));
 $$('[data-view-memory]').forEach(b=>b.onclick=()=>{editorValues();viewMemory(editItem,b.dataset.viewMemory,()=>openEditor(editItem));});
}
function chooseAttachment(kind){const old={...editItem};sheet(kind==='back'?'裏面の写真を追加':'着用写真・関連写真を追加',`<button class="capture-option" id="attachment-camera">${icon('camera')}写真を撮る</button><button class="capture-option" id="attachment-gallery">${icon('photo')}写真から選ぶ</button><p class="tip">${kind==='back'?'服の裏面を1点ずつ撮影します。裏面の背景も切り抜きます。':'この写真はそのまま保存します。品物のAI分類には送りません。'}</p>`,'<button class="secondary" id="attachment-cancel">戻る</button>','attachment');$('#close-sheet').onclick=$('#attachment-cancel').onclick=()=>openEditor(old);
 for(const op of ['camera','gallery'])$('#attachment-'+op).onclick=async()=>{closeSheet(true);state.processing=true;try{const result=await api(op,{id:old.id,photoKind:kind});state.processing=false;if(result.cancelled){openEditor(old);return;}if(state.draft?.id===old.id)state.draft=result;else updateItem(result);const merged=preserveForm(result,old);openEditor(merged);if(kind==='back')await analyzeBack(merged);}catch(e){state.processing=false;openEditor(old);toast(e.message);}};
}
async function analyzeBack(item){if(state.processing)return;state.processing=true;const old={...item};$$('#overlay button').forEach(b=>b.disabled=true);$('#status-area').innerHTML='<div class="process-status"><span class="spinner"></span><span id="process-text">裏面の背景を切り抜いています…</span></div>';try{const result=await api('analyze',{id:item.id,side:'back'});if(state.draft?.id===item.id)state.draft=result;else updateItem(result);state.processing=false;openEditor(preserveForm(result,old));}catch(e){state.processing=false;openEditor(old);toast(e.message);}}
async function removeAttachment(kind,photoId){editorValues();const old={...editItem};confirmSheet('写真を外しますか？','この宝物に添えた写真を外します。宝物の表の写真と記録は残ります。','写真を外す',async()=>{try{const r=await api('removePhoto',{id:old.id,photoKind:kind,photoId});const merged=preserveForm(r,old);if(state.draft?.id===old.id)state.draft=merged;else updateItem(r);openEditor(merged);}catch(e){openEditor(old);toast(e.message);}},'edit');}
function chooseRelated(){const old={...editItem},selected=new Set(old.relatedIds||[]),choices=realItems().filter(i=>i.id!==old.id);sheet('セット・関連アイテムを選ぶ',`<p class="tip">この宝物と一緒に残したいアイテムを選びます。どちらから開いても、相手が見られます。</p><label class="field"><span>名前で探す</span><input id="related-search" placeholder="例：パジャマ"></label><div class="related-list" id="related-list"></div>`,'<button class="secondary" id="related-cancel">戻る</button><button class="primary" id="related-done">選択を反映</button>','related');const draw=()=>{const term=$('#related-search').value.toLowerCase(),shown=choices.filter(i=>i.name.toLowerCase().includes(term));$('#related-list').innerHTML=shown.map(i=>`<label class="related-choice"><input type="checkbox" data-related="${esc(i.id)}" ${selected.has(i.id)?'checked':''}><img src="${photo(i)}" alt=""><span>${esc(i.name)}<small>${esc(ownerNames(i).join('・'))}</small></span></label>`).join('')||'<p class="tip">先に、関連させたい品物を登録してください。</p>';$$('[data-related]').forEach(el=>el.onchange=()=>el.checked?selected.add(el.dataset.related):selected.delete(el.dataset.related));};draw();$('#related-search').oninput=draw;$('#related-cancel').onclick=$('#close-sheet').onclick=()=>openEditor(old);$('#related-done').onclick=()=>openEditor({...old,relatedIds:[...selected]});}
function viewMemory(item,id,back){const m=item.memories.find(m=>m.id===id);sheet('一緒に残した写真',`<img class="memory-full" src="${esc(memorySource(item,m))}" alt="${esc(m.caption||'関連写真')}"><p class="memory">${esc(m.caption)}</p>`,'<button class="primary" id="memory-back">戻る</button>','memory');$('#memory-back').onclick=$('#close-sheet').onclick=back;}
function openDetail(item){
 previousDetail=item;const demo=!!item.asset&&!portable,linked=(item.relatedIds||[]).map(id=>(isDemo()?samples:realItems()).find(i=>i.id===id)).filter(Boolean);
 const body=`<div class="preview detail-preview" id="detail-preview"><div class="detail-turn">${displayStand(item)}<img src="${photo(item)}" alt="${esc(item.name)}・表"></div>${item.back?'<button class="image-mode" id="flip-detail">表 → 裏を見る ↕</button>':''}</div><div class="detail-title">${esc(item.name)}</div><div class="metadata">${[ownerNames(item).join('・'),item.category,sizeLabel(item),item.period,item.color].filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('')}</div><div class="memory ${item.note?'':'empty'}">${esc(item.note||'')}</div>${item.memories?.length?`<section class="extra-card"><h3>一緒に残した写真</h3><div class="memory-gallery">${item.memories.map(m=>`<button data-memory="${esc(m.id)}"><img src="${esc(memorySource(item,m))}" alt="${esc(m.caption||'関連写真')}"><span>${esc(m.caption||'写真を見る')}</span></button>`).join('')}</div></section>`:''}${linked.length?`<section class="extra-card"><h3>セット・関連アイテム</h3><div class="detail-related">${linked.map(i=>`<button data-related-open="${esc(i.id)}"><img src="${photo(i)}" alt=""><span>${esc(i.name)}</span></button>`).join('')}</div></section>`:''}${demo?'<div class="notice">展示用のサンプルです。写真を追加すると、ご自身のクローゼットに切り替わります。</div>':portable?'':'<button class="textbtn danger" id="archive-garment">アルバムから外す（ごみ箱へ）</button>'}`;
 sheet(demo?'サンプルの思い出':'この宝物の思い出',body,portable?'<button class="primary" id="portable-close">クローゼットに戻る</button>':demo?'<button class="primary" id="detail-add">自分の宝物を残す</button>':`<button class="secondary" id="detail-favorite">${icon('heart')}${item.favorite?'大切な1点':'お気に入り'}</button><button class="primary" id="detail-edit">${icon('edit')}記録を編集</button>`,'detail');
 let side='front',flipping=false;const flip=()=>{if(!item.back||flipping)return;flipping=true;const turn=$('#detail-preview .detail-turn');side=side==='front'?'back':'front';turn.classList.add('flipping');setTimeout(()=>{turn.querySelector('img').src=photo(item,'display',side);turn.querySelector('img').alt=item.name+(side==='back'?'・裏':'・表');if($('#flip-detail'))$('#flip-detail').textContent=side==='back'?'裏 → 表を見る ↕':'表 → 裏を見る ↕';},180);setTimeout(()=>{turn.classList.remove('flipping');flipping=false;},400);};
 $('#flip-detail')?.addEventListener('click',flip);let start=null;$('#detail-preview').onpointerdown=e=>{start={x:e.clientX,y:e.clientY};};$('#detail-preview').onpointerup=e=>{if(start&&Math.abs(e.clientY-start.y)>32&&Math.abs(e.clientY-start.y)>Math.abs(e.clientX-start.x))flip();start=null;};
 $$('[data-memory]').forEach(b=>b.onclick=()=>viewMemory(item,b.dataset.memory,()=>openDetail(item)));$$('[data-related-open]').forEach(b=>b.onclick=()=>openDetail(linked.find(i=>i.id===b.dataset.relatedOpen)));
 if(portable){$('#portable-close').onclick=()=>closeSheet(true);return;}if(demo){$('#detail-add').onclick=()=>{closeSheet(true);openCapture();};return;}
 $('#detail-edit').onclick=()=>openEditor(item);
 $('#detail-favorite').onclick=async()=>{try{const x=await api('favorite',{id:item.id,value:!item.favorite});updateItem(x);render();openDetail(x);}catch(e){toast(e.message);}};
 $('#archive-garment').onclick=()=>confirmSheet('アルバムから外しますか？','写真と思い出はごみ箱に残ります。設定画面から元に戻せます。','ごみ箱へ',async()=>{try{const x=await api('archive',{id:item.id});updateItem(x);closeSheet(true);render();toast('ごみ箱に移しました');}catch(e){toast(e.message);}});
}

let cutout=null;
async function openCutout(item,side="front"){
 sheet('切り抜きを補正',`<p class="tip">消す：背景をなぞる　戻す：品物の欠けた部分をなぞる<br>「拡大・移動」でズームと位置を調整できます。</p><div class="cutout-wrap" id="cutout-wrap"><canvas id="cutout-canvas"></canvas></div><div class="cutout-tools"><button data-tool="erase" class="active">消す</button><button data-tool="restore">戻す</button><button data-tool="pan">拡大・移動</button><button id="cutout-undo">1つ戻す</button><button id="cutout-reset">元写真から</button></div><div class="brush-row"><span>筆の太さ</span><input id="brush-size" type="range" min="4" max="100" value="28"><span id="brush-value">28</span></div><div class="brush-row"><span>拡大</span><input id="zoom" type="range" min="1" max="4" step=".1" value="1"></div>`,`<button class="secondary" id="cutout-cancel">戻る</button><button class="primary" id="cutout-save">切り抜きを使う</button>`,'cutout');
 const canvas=$('#cutout-canvas'),wrap=$('#cutout-wrap'),btn=$('#cutout-save');btn.disabled=true;
 try{
  const [original,alpha]=await Promise.all([loadImage(photo(item,'original',side)),loadImage(photo(item,'full',side))]);
  const buffer=document.createElement('canvas');buffer.width=original.naturalWidth;buffer.height=original.naturalHeight;const ctx=buffer.getContext('2d',{willReadFrequently:true});ctx.drawImage(alpha,0,0,buffer.width,buffer.height);
  cutout={canvas,wrap,buffer,ctx,original,tool:'erase',brush:28,zoom:1,panX:0,panY:0,history:[],down:null,item};btn.disabled=false;
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=wrap.clientWidth*dpr;canvas.height=wrap.clientHeight*dpr;drawCutout();
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);cutout.down={x:e.clientX,y:e.clientY};if(cutout.tool!=='pan'){pushUndo();brush(e);}});
  canvas.addEventListener('pointermove',e=>{if(!cutout.down)return;e.preventDefault();if(cutout.tool==='pan'){cutout.panX+=e.clientX-cutout.down.x;cutout.panY+=e.clientY-cutout.down.y;}else brush(e,cutout.down);cutout.down={x:e.clientX,y:e.clientY};drawCutout();});
  canvas.addEventListener('pointerup',()=>cutout.down=null);canvas.addEventListener('pointercancel',()=>cutout.down=null);
  $$('[data-tool]').forEach(b=>b.onclick=()=>{cutout.tool=b.dataset.tool;$$('[data-tool]').forEach(q=>q.classList.toggle('active',q===b));});
  $('#brush-size').oninput=e=>{cutout.brush=Number(e.target.value);$('#brush-value').textContent=cutout.brush;};
  $('#zoom').oninput=e=>{cutout.zoom=Number(e.target.value);if(cutout.zoom===1){cutout.panX=0;cutout.panY=0;}drawCutout();};
  $('#cutout-undo').onclick=()=>{const prev=cutout.history.pop();if(prev){ctx.putImageData(prev,0,0);drawCutout();}};
  $('#cutout-reset').onclick=()=>{pushUndo();ctx.clearRect(0,0,buffer.width,buffer.height);ctx.drawImage(original,0,0);drawCutout();};
  $('#cutout-save').onclick=async()=>{btn.disabled=true;try{const result=await api('cutout',{id:item.id,side,png:buffer.toDataURL('image/png')});const merged=preserveForm(result,item);if(state.draft?.id===item.id)state.draft=merged;else updateItem(result);openEditor(merged);toast('切り抜きを更新しました');}catch(e){toast(e.message);btn.disabled=false;}};
 }catch(e){toast('補正用の写真を読み込めませんでした');}
 $('#cutout-cancel').onclick=()=>openEditor(item);
}
function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});}
function pushUndo(){if(cutout.history.length>=8)cutout.history.shift();cutout.history.push(cutout.ctx.getImageData(0,0,cutout.buffer.width,cutout.buffer.height));}
function imageTransform(){const c=cutout,w=c.wrap.clientWidth,h=c.wrap.clientHeight;const scale=Math.min(w/c.buffer.width,h/c.buffer.height)*c.zoom;return {scale,x:(w-c.buffer.width*scale)/2+c.panX,y:(h-c.buffer.height*scale)/2+c.panY};}
function drawCutout(){if(!cutout)return;const c=cutout,g=c.canvas.getContext('2d'),r=c.canvas.width/c.wrap.clientWidth,t=imageTransform();g.setTransform(r,0,0,r,0,0);g.clearRect(0,0,c.wrap.clientWidth,c.wrap.clientHeight);g.drawImage(c.buffer,t.x,t.y,c.buffer.width*t.scale,c.buffer.height*t.scale);}
function brush(e,from=null){const c=cutout,t=imageTransform(),r=c.canvas.getBoundingClientRect(),x=(e.clientX-r.left-t.x)/t.scale,y=(e.clientY-r.top-t.y)/t.scale;const px=from?(from.x-r.left-t.x)/t.scale:x,py=from?(from.y-r.top-t.y)/t.scale:y,rad=c.brush/(2*t.scale),ctx=c.ctx;
 ctx.save();ctx.lineWidth=rad*2;ctx.lineCap='round';ctx.lineJoin='round';
 if(c.tool==='erase'){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x+.01,y+.01);ctx.stroke();}else{
  const dist=Math.hypot(x-px,y-py),steps=Math.max(1,Math.ceil(dist/(rad*.35)));
  ctx.beginPath();for(let i=0;i<=steps;i++){const xx=px+(x-px)*i/steps,yy=py+(y-py)*i/steps;ctx.moveTo(xx+rad,yy);ctx.arc(xx,yy,rad,0,Math.PI*2);}ctx.clip();ctx.globalCompositeOperation='source-over';ctx.drawImage(c.original,0,0);
 }ctx.restore();drawCutout();
}
window.handleBack=()=>{if(state.modal){closeSheet();return true;}if(state.tab!=='closet'){switchTab('closet');return true;}return false;};
document.addEventListener('click',async e=>{
 const play=e.target.closest('[data-play]');if(play){const lane=lanes.find(l=>l.key===play.dataset.play);lane.playing=!lane.playing;updatePlay();return;}
 const step=e.target.closest('[data-step]');if(step){const [key,amount]=step.dataset.step.split(':');const lane=lanes.find(l=>l.key===key);lane.playing=false;for(const slot of lane.slots)slot.x-=Number(amount)*lane.slotWidth;recycleSlots(lane);positionSlots(lane,performance.now());updatePlay();return;}
 const child=e.target.closest('[data-child]');if(child){state.child=child.dataset.child;renderChildren();renderCloset();renderAlbum();return;}
 const favFilter=e.target.closest('#filter-favorites');if(favFilter){state.favorites=!state.favorites;renderChildren();renderCloset();renderAlbum();return;}
 const cat=e.target.closest('[data-category]');if(cat){state.category=cat.dataset.category;renderAlbum();return;}
 const fav=e.target.closest('[data-favorite]');if(fav){if(portable){e.stopPropagation();toast('記録の変更はAndroidアプリで行えます');return;}e.stopPropagation();const item=state.items.find(x=>x.id===fav.dataset.favorite);try{updateItem(await api('favorite',{id:item.id,value:!item.favorite}));renderAlbum();renderCloset();}catch(e){toast(e.message);}return;}
 const open=e.target.closest('[data-open]');if(open){openDetail(state.items.find(x=>x.id===open.dataset.open));return;}
 const restore=e.target.closest('[data-restore]');if(restore){try{updateItem(await api('restore',{id:restore.dataset.restore}));render();toast('アルバムに戻しました');}catch(e){toast(e.message);}return;}
 if(e.target.closest('#empty-add'))openCapture();
});
document.addEventListener('keydown',e=>{const card=e.target.closest('[data-open]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDetail(state.items.find(x=>x.id===card.dataset.open));}if(e.key==='Escape')window.handleBack();});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('#brand-icon').innerHTML=icon('hanger');$('#search-icon').innerHTML=icon('search');$('#shuffle-button').innerHTML=icon('shuffle');$('#add-album').innerHTML=icon('plus');$('#capture-icon').innerHTML=icon('camera');
const navIcons={closet:'home',album:'search',settings:'settings'};$$('[data-tab]').forEach(b=>b.querySelector('.nav-icon').innerHTML=icon(navIcons[b.dataset.tab]));
$('#add-closet').onclick=openCapture;$('#add-album').onclick=openCapture;$('#sample-add').onclick=openCapture;
$('#keepsake-next').onclick=()=>{keepsakes.elapsed=0;showKeepsake(true);};$('#shuffle-button').onclick=()=>{renderCloset();toast('並びをシャッフルしました');};$('#search').oninput=renderAlbum;
if(portable){$('#add-album').classList.add('hidden');$('#top-empty span').textContent='このアルバムにはトップスがありません';$('#top-empty small')?.classList.add('hidden');$('#bottom-empty span').textContent='このアルバムにはボトムスがありません';$('#add-closet').setAttribute('aria-label','流れる宝物を再生・停止');$('#capture-icon').innerHTML=icon('pause');$('#add-closet small').textContent='再生・停止';document.body.classList.add('portable-album');}
requestAnimationFrame(animate);load();
