import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {connect} from './browser.mjs';
const dir=fileURLToPath(new URL('.',import.meta.url));
const cases=[['/','covers'],['/books/aviatory/','cards'],['/books/aviatory/','chars'],['/books/danlin/','cards'],['/books/gorod/','cards'],['/books/stirayushchee/','chars']];
const b=await connect();const results=process.env.UI_RETEST_FAILED?JSON.parse(fs.readFileSync(dir+'slider-results.json')):[];const retry=new Set(results.filter(r=>!r.passed).map(r=>r.phase+':'+r.width+':'+r.path+':'+r.prefix));
for(const phase of ['before','after'])for(const width of [390,1440])for(const [path,prefix] of cases){
 if(process.env.UI_RETEST_FAILED&&!retry.has(phase+':'+width+':'+path+':'+prefix))continue;
 const r={phase,width,path,prefix};
 try{
  await b.send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});
  await b.send('Emulation.setTouchEmulationEnabled',{enabled:width===390,maxTouchPoints:1});
  await b.navigate((phase==='before'?'http://127.0.0.1:4323':'http://127.0.0.1:4324')+path);
  await b.evaluate(`document.getElementById('privacy-banner').style.display='none'`);
  if(width===390){
   const pt=await b.evaluate(`(()=>{let slider=document.getElementById('${prefix}-slider'),img=slider.querySelector('img');img.scrollIntoView({block:'center'});let r=img.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await new Promise(r=>setTimeout(r,60));
   await b.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pt.x-60,y:pt.y}]});await new Promise(r=>setTimeout(r,60));
   await b.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pt.x-120,y:pt.y}]});await new Promise(r=>setTimeout(r,60));
   await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,400));
   r.result=await b.evaluate(`({transform:document.getElementById('${prefix}-slider').style.transform,dialogClosed:document.getElementById('lightbox').classList.contains('hidden'),activeSlides:[...document.getElementById('${prefix}-slider').children].map((e,i)=>e.inert?null:i).filter(i=>i!==null)})`);
   if(r.result.transform!=='translateX(-100%)'||!r.result.dialogClosed)throw Error('swipe did not advance cleanly');
   if(phase==='after'&&JSON.stringify(r.result.activeSlides)!=='[1]')throw Error('inactive slides not inert after swipe');
  }else{
   await b.evaluate(`document.getElementById('${prefix}-track').scrollIntoView({block:'center'});document.getElementById('${prefix}-track').scrollLeft=0;document.getElementById('${prefix}-next').click()`);await new Promise(r=>setTimeout(r,700));
   r.result=await b.evaluate(`({canScroll:document.getElementById('${prefix}-track').scrollWidth>document.getElementById('${prefix}-track').clientWidth,scrollLeft:document.getElementById('${prefix}-track').scrollLeft,dialogClosed:document.getElementById('lightbox').classList.contains('hidden')})`);
   if((r.result.canScroll&&!r.result.scrollLeft)||!r.result.dialogClosed)throw Error('desktop next did not advance cleanly');
  }
  r.passed=true;
 }catch(e){r.passed=false;r.error=String(e);}
 const old=results.findIndex(x=>x.phase===phase&&x.width===width&&x.path===path&&x.prefix===prefix);if(old>=0)results[old]=r;else results.push(r);console.log(phase,width,path,prefix,r.passed?'PASS':'FAIL '+r.error);
}
fs.writeFileSync(dir+'slider-results.json',JSON.stringify(results,null,2));b.close();if(results.some(r=>!r.passed))process.exitCode=1;
