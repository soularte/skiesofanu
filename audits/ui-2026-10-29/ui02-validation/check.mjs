import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { connect } from './browser.mjs';
const dir=fileURLToPath(new URL('.',import.meta.url));
const site=process.env.UI_BASE_URL??'http://127.0.0.1:4324';
const pages=[...new Set(JSON.parse(fs.readFileSync(dir+'after.json')).map(p=>p.path))];
const b=await connect();const results=[];
const check=async(name,expr)=>{if(!await b.evaluate(expr))throw Error(name);return name;};
for(const width of [320,390,768,1440])for(const path of pages){
 const r={path,width,checks:[],groups:[]};
 try{
  await b.send('Emulation.setDeviceMetricsOverride',{width,height:width<768?844:1000,deviceScaleFactor:1,mobile:width<768});
  await b.send('Emulation.setTouchEmulationEnabled',{enabled:width<768,maxTouchPoints:1});
  await b.navigate(site+path);
  await b.evaluate(`localStorage.setItem('privacy-closed','1');document.getElementById('privacy-banner').style.display='none'`);
  r.checks.push(await check('all triggers have semantics and names',`[...document.querySelectorAll('[data-lightbox-group]')].every(e=>e.matches('a[href],button')||(e.getAttribute('role')==='button'&&e.tabIndex===0&&!!e.getAttribute('aria-label')&&e.getAttribute('aria-controls')==='lightbox'&&e.getAttribute('aria-haspopup')==='dialog'))`));
  r.nestedInteractive=await b.evaluate(`[...document.querySelectorAll('[data-lightbox-group][role="button"]')].filter(e=>e.parentElement.closest('a[href],button,[role="button"]')).map(e=>e.outerHTML.slice(0,200))`);
  if(r.nestedInteractive.length)throw Error('nested interactive triggers');
  r.checks.push(await check('no horizontal document overflow','document.documentElement.scrollWidth<=innerWidth'));
  r.checks.push(await check('inactive mobile slides are inert',`['covers','cards','chars'].every(prefix=>{const slider=document.getElementById(prefix+'-slider');return !slider||[...slider.children].every((s,i)=>s.inert===(i!==0))})`));
  const groups=await b.evaluate(`Array.from(new Set([...document.querySelectorAll('[data-lightbox-group]')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('[inert]')).map(e=>e.dataset.lightboxGroup)))`);
  for(const group of groups){
   const g={name:group,checks:[]};r.groups.push(g);
   await b.evaluate(`window.__trigger=[...document.querySelectorAll('[data-lightbox-group]')].find(e=>e.dataset.lightboxGroup===${JSON.stringify(group)}&&e.getBoundingClientRect().width>0&&!e.closest('[inert]'));window.__trigger.scrollIntoView({block:'center'});window.__trigger.focus();window.__startY=scrollY`);
   g.checks.push(await check('trigger accepts focus','document.activeElement===window.__trigger'));
   const native=await b.evaluate(`window.__trigger.matches('a[href],button')`);
   await b.key('Enter');
   g.checks.push(await check('Enter opens','!document.getElementById("lightbox").classList.contains("hidden")&&document.activeElement.id==="lb-close"'));
   await b.key('Tab',true);g.checks.push(await check('Shift Tab stays in modal',`!!document.activeElement.closest('#lightbox')`));
   for(let i=0;i<4;i++)await b.key('Tab');g.checks.push(await check('Tab stays in modal',`!!document.activeElement.closest('#lightbox')`));
   const counter=await b.evaluate(`document.getElementById('lb-counter').textContent`);
   await b.key('ArrowRight');const next=await b.evaluate(`document.getElementById('lb-counter').textContent`);
   if(counter&&counter===next)throw Error('ArrowRight did not change counter');
   await b.key('ArrowLeft');g.checks.push(await check('keyboard arrows round trip',`document.getElementById('lb-counter').textContent===${JSON.stringify(counter)}`));
   await b.key('Escape');g.checks.push(await check('Escape restores focus and scrolling',`document.activeElement===window.__trigger&&document.body.style.overflow===''&&Math.abs(scrollY-window.__startY)<2`));
   if(!native){
    await b.key(' ',false,'keyDown');g.checks.push(await check('Space keydown does not scroll or open early',`document.getElementById('lightbox').classList.contains('hidden')&&Math.abs(scrollY-window.__startY)<2`));
    await b.key(' ',false,'keyUp');g.checks.push(await check('Space keyup opens','!document.getElementById("lightbox").classList.contains("hidden")'));
    await b.evaluate(`document.getElementById('lb-close').click()`);g.checks.push(await check('close restores focus again','document.activeElement===window.__trigger'));
    await b.key('Tab');await b.key('Tab',true);g.checks.push(await check('real Tab traversal reaches trigger','document.activeElement===window.__trigger'));
    if(!r.focusScreenshot){
     const shot=await b.send('Page.captureScreenshot',{format:'png'});const slug=path.replace(/^\/+|\/+$/g,'').replaceAll('/','__');r.focusScreenshot=`focus-${slug}--${width}.png`;fs.writeFileSync(dir+r.focusScreenshot,Buffer.from(shot.data,'base64'));
    }
   }
  }
  // Selecting the next mobile slide must expose its image, and hide the old one from Tab.
  for(const prefix of ['covers','cards','chars']){
   const exists=await b.evaluate(`!!document.getElementById('${prefix}-slider')&&document.getElementById('${prefix}-slider').getBoundingClientRect().width>0`);
   if(!exists)continue;
   r.checks.push(await check(prefix+' slide changes inert state',`(()=>{let s=document.getElementById('${prefix}-slider'),d=[...document.querySelectorAll('.${prefix}-dot')];if(d.length<2)return true;d[1].click();let correct=s.style.transform==='translateX(-100%)'&&[...s.children].every((c,i)=>c.inert===(i!==1));d[0].click();return correct})()`));
  }
  if(b.errors.length)throw Error(b.errors.join('\n'));
  r.passed=true;
 }catch(e){r.passed=false;r.error=String(e);}
 results.push(r);fs.writeFileSync(dir+'keyboard-results.json',JSON.stringify(results,null,2));console.log(width,path,r.passed?'PASS':'FAIL '+r.error);
}
b.close();if(results.some(r=>!r.passed))process.exitCode=1;
