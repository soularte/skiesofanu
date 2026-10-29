import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const base=fileURLToPath(new URL('.', import.meta.url));
const site=process.env.UI_BASE_URL ?? 'http://127.0.0.1:4324';
const cdp=process.env.UI_CDP_URL ?? 'http://127.0.0.1:9335';
const pages=[...new Set(JSON.parse(fs.readFileSync(new URL('../measurements.json', import.meta.url))).map(p=>new URL(p.url).pathname))];
const target=await(await fetch(cdp+'/json/new?about:blank',{method:'PUT'})).json();const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();let errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
const key=async(k,shift=false)=>{const code={Tab:9,Escape:27,ArrowRight:39,ArrowLeft:37}[k];for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:k,code:k,windowsVirtualKeyCode:code,modifiers:shift?8:0});};
const out=process.env.UI_RETEST_FAILED ? JSON.parse(fs.readFileSync(base+'/modal-results.json')) : [];const retryKeys=new Set(out.filter(r=>!r.passed).map(r=>r.width+':'+r.path));const check=async(name,expr)=>{const value=await ev(expr);if(!value)throw new Error(name+' failed');return name;};
await send('Page.enable');await send('Runtime.enable');
for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});
 await send('Emulation.setTouchEmulationEnabled',{enabled:width===390,maxTouchPoints:1});
 for(const path of pages){
  if(process.env.UI_RETEST_FAILED&&!retryKeys.has(width+':'+path))continue;
  errors=[];const entry={path,width,checks:[],groups:[]};
  try{
   await send('Page.navigate',{url:site+path});await new Promise(r=>setTimeout(r,500));await ev('document.fonts.ready.then(()=>true)');
   await ev(`localStorage.setItem('privacy-closed','1');document.getElementById('privacy-banner').style.display='none';window.__testInert=document.createElement('div');window.__testInert.inert=true;document.body.append(window.__testInert);document.body.style.overflow='auto'`);
   entry.checks.push(await check('no document overflow','document.documentElement.scrollWidth<=innerWidth'));
   if(width===390)entry.checks.push(await check('mobile menu opens and closes',`(()=>{let b=document.getElementById('menu-toggle');b.click();let open=b.getAttribute('aria-expanded')==='true';b.click();return open&&b.getAttribute('aria-expanded')==='false'})()`));
   const groups=await ev(`Array.from(new Set([...document.querySelectorAll('[data-lightbox-group]')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>e.getAttribute('data-lightbox-group'))))`);
   for(const group of groups){
    const g={name:group,checks:[]};entry.groups.push(g);
    await ev(`window.__trigger=[...document.querySelectorAll('[data-lightbox-group]')].find(e=>e.getAttribute('data-lightbox-group')===${JSON.stringify(group)}&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height);window.__trigger.scrollIntoView({block:'center'});window.__scroll=scrollY;window.__originalTab=window.__trigger.getAttribute('tabindex');window.__trigger.click()`);
    g.checks.push(await check('open, initial focus and scroll lock',`!document.getElementById('lightbox').classList.contains('hidden')&&document.activeElement.id==='lb-close'&&document.body.style.overflow==='hidden'`));
    g.checks.push(await check('background inert',`[...document.body.children].filter(e=>e instanceof HTMLElement&&e.id!=='lightbox').every(e=>e.inert)`));
    const multi=await ev(`document.getElementById('lb-next').getClientRects().length>0`);g.multi=multi;
    await key('Tab',true);g.checks.push(await check('Shift Tab wraps',`document.activeElement.id===${JSON.stringify(multi?'lb-next':'lb-close')}`));
    await key('Tab');g.checks.push(await check('Tab wraps to close',`document.activeElement.id==='lb-close'`));
    for(let i=0;i<5;i++){await key('Tab');g.checks.push(await check('Tab stays in dialog',`!!document.activeElement.closest('#lightbox')`));}
    const initial=await ev(`document.getElementById('lb-counter').textContent`);
    await key('ArrowRight');const after=await ev(`document.getElementById('lb-counter').textContent`);
    if(multi&&after===initial)throw new Error('ArrowRight failed');
    await key('ArrowLeft');g.checks.push(await check('keyboard arrows round trip',`document.getElementById('lb-counter').textContent===${JSON.stringify(initial)}`));
    if(multi){await ev(`document.getElementById('lb-next').click()`);const changed=await ev(`document.getElementById('lb-counter').textContent`);if(changed===initial)throw new Error('next click failed');await ev(`document.getElementById('lb-prev').click()`);g.checks.push(await check('arrow buttons round trip',`document.getElementById('lb-counter').textContent===${JSON.stringify(initial)}`));}
    if(!entry.screenshot){await ev(`Promise.race([document.getElementById('lb-img').decode().catch(()=>{}),new Promise(r=>setTimeout(r,2000))])`);const shot=await send('Page.captureScreenshot',{format:'png'});const file='modal-'+(path.replace(/^\/+|\/+$/g,'').replaceAll('/','__')||'home')+'--'+width+'.png';fs.writeFileSync(base+'/'+file,Buffer.from(shot.data,'base64'));entry.screenshot=file;}
    await key('Escape');
    const closed=`document.getElementById('lightbox').classList.contains('hidden')&&document.body.style.overflow==='auto'&&document.activeElement===window.__trigger&&(window.__trigger.getAttribute('tabindex')===window.__originalTab||(window.__originalTab===null&&window.__trigger.getAttribute('tabindex')==='-1'))&&window.__testInert.inert&&[...document.body.children].filter(e=>e instanceof HTMLElement&&e.id!=='lightbox'&&e!==window.__testInert).every(e=>!e.inert)&&Math.abs(scrollY-window.__scroll)<2`;
    g.checks.push(await check('Escape restores focus, scroll and inert states',closed));
    await ev(`document.querySelector('header a').focus({preventScroll:true})`);g.checks.push(await check('temporary tabindex cleaned on blur',`window.__trigger.getAttribute('tabindex')===window.__originalTab`));await ev(`window.__trigger.click();document.getElementById('lb-close').click()`);g.checks.push(await check('reopen and close button restores state',closed));
    await ev(`window.__trigger.click()`);
    if(width===390){const p=await ev(`(()=>{let r=document.getElementById('lb-close').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,80));g.checks.push(await check('touch close',closed));await ev(`window.__trigger.click()`);}
    for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:2,y:width===390?842:998,button:'left',clickCount:1});
    g.checks.push(await check('backdrop pointer closes and restores state',closed));
   }
   entry.checks.push(await check('sliders still respond after closing',`(()=>{for(const prefix of ['covers','cards','chars']){const slider=document.getElementById(prefix+'-slider');const dots=[...document.querySelectorAll('.'+prefix+'-dot')];const track=document.getElementById(prefix+'-track');if(slider&&slider.getBoundingClientRect().width&&dots.length>1){dots[1].click();if(slider.style.transform!=='translateX(-100%)')return false;dots[0].click();}if(track&&track.getBoundingClientRect().width&&track.scrollWidth>track.clientWidth){track.scrollLeft=0;track.scrollLeft=track.scrollWidth;if(track.scrollLeft===0)return false;track.scrollLeft=0;}}return true})()`));
   entry.checks.push(await check('global API compatibility',`(()=>{window.__openLightbox(['/favicon-48.png'],0);let open=!document.getElementById('lightbox').classList.contains('hidden');document.getElementById('lb-close').click();return open&&document.body.style.overflow==='auto'})()`));
   // Explicit single-image fixture exercises hidden arrows even on grouped pages.
   await ev(`window.__openLightbox(['/favicon-48.png'],0)`);await key('Tab');entry.checks.push(await check('single-image Tab stays on close',`document.activeElement.id==='lb-close'&&document.getElementById('lb-next').getClientRects().length===0`));await key('Tab',true);entry.checks.push(await check('single-image Shift Tab stays on close',`document.activeElement.id==='lb-close'`));await key('Escape');
   if(errors.length)throw new Error(errors.join('\n'));entry.passed=true;
  }catch(e){entry.passed=false;entry.error=String(e);}
  const old=out.findIndex(r=>r.width===width&&r.path===path);if(old>=0)out[old]=entry;else out.push(entry);fs.writeFileSync(base+'/modal-results.json',JSON.stringify(out,null,2));console.log(width,path,entry.passed?'PASS':'FAIL '+entry.error);
 }
}
ws.close();if(out.some(r=>!r.passed))process.exitCode=1;
