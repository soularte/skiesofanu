import fs from 'node:fs';import {connect} from '../ui02-validation/browser.mjs';
const b=await connect(),rows=[];
for(const [path,prefix] of [['/','covers'],['/books/aviatory/','cards'],['/books/aviatory/','chars']]){
 await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.navigate('http://127.0.0.1:4324'+path);
 await b.evaluate(`document.getElementById('privacy-banner').style.display='none';document.querySelectorAll('.${prefix}-dot')[1].click()`);
 for(const width of [390,768,320,1440,390]){
  await b.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<640});await new Promise(r=>setTimeout(r,150));
  const data=await b.evaluate(`(()=>{let s=document.getElementById('${prefix}-slider'),im=s.children[1].querySelector('img').getBoundingClientRect(),a=document.getElementById('${prefix}-mobile-next'),r=a.getBoundingClientRect();return{mobile:innerWidth<640,centerError:r.y+r.height/2-im.y-im.height/2,buttonWidth:r.width,buttonHeight:r.height,current:s.style.transform,glyph:a.querySelector('path').getAttribute('d')}})()`);
  const passed=data.current==='translateX(-100%)'&&data.glyph==='M9 5l7 7-7 7'&&(!data.mobile||(Math.abs(data.centerError)<1&&data.buttonWidth===52&&data.buttonHeight===52));
  rows.push({path,prefix,width,...data,passed});
 }
}
fs.writeFileSync(new URL('./resize-results.json',import.meta.url),JSON.stringify(rows,null,2));console.log('Resize and glyph:',rows.filter(r=>r.passed).length,'/',rows.length);b.close();if(rows.some(r=>!r.passed))process.exitCode=1;
