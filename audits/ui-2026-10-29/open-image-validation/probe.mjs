import fs from 'node:fs';
import {connect} from '../ui02-validation/browser.mjs';
const b=await connect();const results=[];
for(const [width,height] of [[1506,758],[1440,900],[1024,600],[390,844],[390,500],[320,400]]){
 await b.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
 await b.navigate('http://127.0.0.1:4321/books/aviatory/');
 await b.evaluate(`document.getElementById('privacy-banner').style.display='none';let t=[...document.querySelectorAll('[data-lightbox-group]')].find(e=>e.dataset.lightboxGroup==='${width<600?'characters-mobile':'characters'}'&&!e.closest('[inert]'));t.scrollIntoView({block:'center'});t.click()`);
 for(let i=0;i<3;i++){
  await b.evaluate(`document.getElementById('lb-img').decode().catch(()=>{})`);
  results.push(await b.evaluate(`(()=>{let im=document.getElementById('lb-img'),box=document.getElementById('lightbox'),r=im.getBoundingClientRect(),p=box.getBoundingClientRect(),vv=visualViewport;return {width:innerWidth,height:innerHeight,index:document.getElementById('lb-counter').textContent,image:r.toJSON(),overlay:p.toJSON(),natural:[im.naturalWidth,im.naturalHeight],viewport:vv?{x:vv.offsetLeft,y:vv.offsetTop,w:vv.width,h:vv.height,scale:vv.scale}:null,centerError:[r.x+r.width/2-innerWidth/2,r.y+r.height/2-innerHeight/2],fits:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}})()`));
  await b.key('ArrowRight');
 }
}
fs.writeFileSync(new URL('./chrome-'+(process.argv[2]??'before')+'.json',import.meta.url),JSON.stringify(results,null,2));console.log(results.map(r=>({size:[r.width,r.height],index:r.index,center:r.centerError,fits:r.fits})));b.close();
