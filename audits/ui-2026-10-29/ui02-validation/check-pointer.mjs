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
const out=[];const check=async(name,expr)=>{const value=await ev(expr);if(!value)throw new Error(name+' failed');return name;};
await send('Page.enable');await send('Runtime.enable');

for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});await send('Emulation.setTouchEmulationEnabled',{enabled:width===390,maxTouchPoints:1});
 await send('Page.navigate',{url:site+'/books/aviatory/'});await new Promise(r=>setTimeout(r,1000));await ev(`document.getElementById('privacy-banner').style.display='none';window.__cover=document.querySelector('[data-lightbox-group="book-cover"]');window.__cover.scrollIntoView({block:'center'})`);
 const pt=await ev(`(()=>{let r=window.__cover.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 if(width===390){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,...pt,button:'left',clickCount:1});
 await new Promise(r=>setTimeout(r,200));
 const result={width,checks:[]};result.checks.push(await check('real pointer opens cover',`!document.getElementById('lightbox').classList.contains('hidden')&&document.activeElement.id==='lb-close'`));
 const before=await ev('scrollY');await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:10,y:150,deltaX:0,deltaY:400});await new Promise(r=>setTimeout(r,200));result.checks.push(await check('wheel cannot scroll background',`scrollY===${before}`));
 await key('Escape');result.checks.push(await check('focus returns to pointer opener',`document.activeElement===window.__cover`));
 await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:10,y:150,deltaX:0,deltaY:400});await new Promise(r=>setTimeout(r,250));result.checks.push(await check('wheel scroll restored after close',`scrollY>${before}`));out.push(result);
}
fs.writeFileSync(base+'/pointer-results.json',JSON.stringify(out,null,2));console.log(out);ws.close();
