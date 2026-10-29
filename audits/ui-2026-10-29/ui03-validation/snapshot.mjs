import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { connect } from '../ui02-validation/browser.mjs';
const dir = fileURLToPath(new URL('.', import.meta.url));
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw Error('Use snapshot.mjs before|after');
const site = process.env.UI_BASE_URL ?? (phase === 'before' ? 'http://127.0.0.1:4325' : 'http://127.0.0.1:4324');
const pages = [...new Set(JSON.parse(fs.readFileSync(new URL('../measurements.json', import.meta.url))).map(p => new URL(p.url).pathname)), '/paths/detyam/', '/paths/mir-anu/', '/paths/fantasy/', '/paths/romantika/'];
const sizes = [[320,740],[390,844],[768,1024],[1440,1000],[720,500],[360,250]];
fs.mkdirSync(dir + phase, { recursive: true });
const b = await connect();
const results = [];
for (const path of pages) for (const [width,height] of sizes) {
  await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width === 320 || width === 390 });
  await b.navigate(site + path);
  await b.evaluate(`(async()=>{localStorage.setItem('privacy-closed','1');document.getElementById('privacy-banner').style.display='none';document.activeElement?.blur();let style=document.createElement('style');style.dataset.test=true;style.textContent='*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';document.head.append(style);for(const img of document.images){if(img.getAttribute('src'))img.loading='eager';}await Promise.all([...document.images].filter(e=>e.getAttribute('src')).map(e=>Promise.race([e.decode().catch(()=>{}),new Promise(r=>setTimeout(r,4000))])));scrollTo(0,0)})()`);
  const result = await b.evaluate(`(()=>{const round=x=>Math.round(x*100)/100;return {controls:[...document.querySelectorAll('button[id$="-prev"],button[id$="-next"]')].filter(e=>e.getBoundingClientRect().width).map(e=>({id:e.id,...e.getBoundingClientRect().toJSON()})),height:document.documentElement.scrollHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rects:[...document.querySelectorAll('main img, main h1, main h2, main h3, main p, main a, [id$="-slider"], [id$="-track"], footer')].filter(e=>!['SCRIPT','STYLE'].includes(e.tagName)).map(e=>{let r=e.getBoundingClientRect();return {tag:e.tagName,x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height)}})}})()`);
  const slug = path.replace(/^\/+|\/+$/g,'').replaceAll('/','__') || 'home';
  if(width === 390 || width === 1440) {
    const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.min(result.height,24000),scale:1}});
    fs.writeFileSync(`${dir}${phase}/${slug}--${width}.png`,Buffer.from(shot.data,'base64'));
  }
  results.push({path,width,viewportHeight:height,...result,errors:[...b.errors]});
  fs.writeFileSync(`${dir}${phase}.json`,JSON.stringify(results));
  console.log(phase,width,path,result.scrollWidth>width?'OVERFLOW':'ok');
}
b.close();
