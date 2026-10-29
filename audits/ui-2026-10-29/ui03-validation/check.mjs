import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {connect} from '../ui02-validation/browser.mjs';
const dir=fileURLToPath(new URL('.',import.meta.url)),site=process.env.UI_BASE_URL??'http://127.0.0.1:4324';
const snapshots=JSON.parse(fs.readFileSync(dir+'before.json'));
const pages=[...new Set(snapshots.filter(r=>r.width===390&&r.controls.length).map(r=>r.path))];
const b=await connect(),results=process.env.UI_RETEST_FAILED?JSON.parse(fs.readFileSync(dir+'results.json')):[];const retry=new Set(results.filter(r=>!r.passed).map(r=>r.width+':'+r.path));
const check=async(name,expr)=>{if(!await b.evaluate(expr))throw Error(name);return name;};
const pause=()=>new Promise(r=>setTimeout(r,350));
async function click(x,y){for(const type of ['mousePressed','mouseReleased'])await b.send('Input.dispatchMouseEvent',{type,x,y,button:'left',clickCount:1});}
async function swipe(from,to){await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let i=1;i<=3;i++){await b.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/3,y:from.y+(to.y-from.y)*i/3}]});await new Promise(r=>setTimeout(r,50));}await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause();}
for(const width of [320,390,640,768,1440])for(const path of pages){
 if(process.env.UI_RETEST_FAILED&&!retry.has(width+':'+path))continue;
 const r={width,path,checks:[],galleries:[]};
 try{
  await b.send('Emulation.setDeviceMetricsOverride',{width,height:width<640?844:1000,deviceScaleFactor:1,mobile:width<640});await b.send('Emulation.setTouchEmulationEnabled',{enabled:width<640,maxTouchPoints:1});
  await b.navigate(site+path);await b.evaluate(`document.getElementById('privacy-banner').style.display='none'`);
  r.checks.push(await check('no duplicate slider IDs',`(()=>{const ids=[...document.querySelectorAll('[id$="-slider"]')].map(e=>e.id);return new Set(ids).size===ids.length})()`));
  r.checks.push(await check('no document overflow','document.documentElement.scrollWidth<=innerWidth'));
  const prefixes=await b.evaluate(`['covers','cards','chars'].filter(p=>document.getElementById(p+'-slider'))`);
  for(const prefix of prefixes){
   const g={prefix,checks:[]};r.galleries.push(g);
   if(width<640){
    const total=await b.evaluate(`document.getElementById('${prefix}-slider').children.length`);
    if(total<2){g.checks.push(await check('single slide has no mobile arrows',`!document.getElementById('${prefix}-mobile-prev')&&!document.getElementById('${prefix}-mobile-next')`));continue;}
    await b.evaluate(`window.__slider=document.getElementById('${prefix}-slider');window.__image=window.__slider.children[0].querySelector('img');window.__image.scrollIntoView({block:'center'});`);await pause();
    const positions=await b.evaluate(`(()=>{let im=window.__image.getBoundingClientRect(),p=document.getElementById('${prefix}-mobile-prev').getBoundingClientRect(),n=document.getElementById('${prefix}-mobile-next').getBoundingClientRect();return{image:im.toJSON(),prev:p.toJSON(),next:n.toJSON()}})()`);
    g.positions=positions;
    g.checks.push(await check('52px hit area, 36px icon and image-centered arrows',`(()=>{let im=window.__image.getBoundingClientRect();return ['prev','next'].every(d=>{let e=document.getElementById('${prefix}-mobile-'+d),r=e.getBoundingClientRect(),icon=e.querySelector('span').getBoundingClientRect();return r.width===52&&r.height===52&&icon.width===36&&icon.height===36&&Math.abs(r.y+r.height/2-im.y-im.height/2)<1})})()`));
    // The click is outside the 36px icon, in its eight-pixel allowance.
    await click(positions.next.x+3,positions.next.y+26);await pause();
    g.checks.push(await check('button padding advances slide',`window.__slider.style.transform==='translateX(-100%)'&&document.getElementById('lightbox').classList.contains('hidden')`));
    const prev=await b.evaluate(`document.getElementById('${prefix}-mobile-prev').getBoundingClientRect().toJSON()`);await click(prev.x+26,prev.y+26);await pause();
    g.checks.push(await check('previous arrow returns to first slide',`window.__slider.style.transform==='translateX(0%)'`));
    // Start near the right edge, above the small middle button.
    const start=await b.evaluate(`(()=>{let r=window.__image.getBoundingClientRect();return{x:r.right-8,y:r.y+r.height*.25}})()`);
    g.checks.push(await check('image edge is not a scroll button',`!document.elementFromPoint(${start.x},${start.y}).closest('button[id$="-mobile-prev"],button[id$="-mobile-next"]')`));
    await swipe(start,{x:start.x-120,y:start.y});
    g.checks.push(await check('edge swipe advances without opening or navigation',`location.pathname===${JSON.stringify(path)}&&window.__slider.style.transform==='translateX(-100%)'&&document.getElementById('lightbox').classList.contains('hidden')`));
    const reverse=await b.evaluate(`(()=>{let r=window.__slider.children[1].querySelector('img').getBoundingClientRect();return{x:r.left+8,y:r.y+r.height*.25}})()`);
    await swipe(reverse,{x:reverse.x+120,y:reverse.y});g.checks.push(await check('reverse swipe returns',`window.__slider.style.transform==='translateX(0%)'`));
    await b.evaluate(`document.querySelectorAll('.${prefix}-dot')[1].click()`);await pause();g.checks.push(await check('dots and active slide accessibility preserved',`window.__slider.style.transform==='translateX(-100%)'&&window.__slider.children[0].inert&&!window.__slider.children[1].inert`));
    await b.evaluate(`document.querySelectorAll('.${prefix}-dot')[0].click()`);await pause();
    // An edge tap must open the image / book, not turn the gallery.
    const edge=await b.evaluate(`(()=>{let r=window.__image.getBoundingClientRect();return{x:r.right-8,y:r.y+r.height*.25}})()`);
    if(prefix==='covers'){
     const href=await b.evaluate(`window.__image.closest('a').href`);await click(edge.x,edge.y);await new Promise(r=>setTimeout(r,250));
     g.checks.push(await check('cover edge follows book link',`location.pathname.replace(/[/]$/,'')===new URL(${JSON.stringify(href)}).pathname.replace(/[/]$/,'')`));
     await b.navigate(site+path);await b.evaluate(`document.getElementById('privacy-banner').style.display='none'`);
    }else{
     await click(edge.x,edge.y);g.checks.push(await check('image edge opens Lightbox','!document.getElementById("lightbox").classList.contains("hidden")'));await b.key('Escape');g.checks.push(await check('Escape closes and restores focus',`document.getElementById('lightbox').classList.contains('hidden')&&!!document.activeElement.closest('[data-lightbox-group]')`));
    }
   }else{
    await b.evaluate(`window.__track=document.getElementById('${prefix}-track');window.__track.scrollIntoView({block:'center'})`);
    g.checks.push(await check('desktop button hit area is compact',`['prev','next'].every(d=>{let r=document.getElementById('${prefix}-'+d).getBoundingClientRect();return r.width===52&&r.height===52})`));
    await b.key('Tab');await b.evaluate(`document.getElementById('${prefix}-next').focus()`);await pause();g.checks.push(await check('desktop arrows visible on keyboard focus',`getComputedStyle(document.getElementById('${prefix}-next')).opacity==='1'`));
    const canScroll=await b.evaluate(`window.__track.scrollWidth>window.__track.clientWidth`);
    await b.evaluate(`document.getElementById('${prefix}-next').click()`);await new Promise(r=>setTimeout(r,650));
    if(canScroll)g.checks.push(await check('desktop arrow advances gallery','window.__track.scrollLeft>0'));
   }
  }
  if(b.errors.length)throw Error(b.errors.join('\n'));r.passed=true;
 }catch(e){r.passed=false;r.error=String(e);}
 const old=results.findIndex(x=>x.width===width&&x.path===path);if(old>=0)results[old]=r;else results.push(r);fs.writeFileSync(dir+'results.json',JSON.stringify(results,null,2));console.log(width,path,r.passed?'PASS':'FAIL '+r.error);
}
b.close();if(results.some(r=>!r.passed))process.exitCode=1;
