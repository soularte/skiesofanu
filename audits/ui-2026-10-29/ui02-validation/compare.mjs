import fs from 'node:fs';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
const before=JSON.parse(fs.readFileSync(dir+'before.json'));
const after=JSON.parse(fs.readFileSync(dir+'after.json'));
const geometry=[];
for(const a of after){
 const b=before.find(b=>b.path===a.path&&b.width===a.width&&b.viewportHeight===a.viewportHeight);
 const changed=[];
 if(a.rects.length!==b.rects.length)changed.push({nodeCount:[b.rects.length,a.rects.length]});
 for(let i=0;i<Math.min(a.rects.length,b.rects.length);i++){
  if(JSON.stringify(a.rects[i])!==JSON.stringify(b.rects[i]))changed.push({index:i,before:b.rects[i],after:a.rects[i]});
 }
 geometry.push({path:a.path,width:a.width,viewportHeight:a.viewportHeight,nodeCount:a.rects.length,changedCount:changed.length,changes:changed.slice(0,10),documentHeight:[b.height,a.height],scrollWidth:[b.scrollWidth,a.scrollWidth],errors:a.errors});
}
const pixels=[];
for(const f of fs.readdirSync(dir+'before').filter(f=>f.endsWith('.png'))){
 const b=await sharp(dir+'before/'+f).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const a=await sharp(dir+'after/'+f).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let changed=0;
 if(b.info.width===a.info.width&&b.info.height===a.info.height){
  for(let i=0;i<b.data.length;i+=4)if(b.data[i]!==a.data[i]||b.data[i+1]!==a.data[i+1]||b.data[i+2]!==a.data[i+2])changed++;
 }else changed=-1;
 pixels.push({file:f,before:[b.info.width,b.info.height],after:[a.info.width,a.info.height],changedPixels:changed,percentage:changed<0?null:100*changed/(a.info.width*a.info.height)});
}
const result={geometry,pixels};fs.writeFileSync(dir+'comparison.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({viewports:geometry.length,layoutDifferences:geometry.filter(g=>g.changedCount),screenshots:pixels.length,pixelDifferences:pixels.filter(p=>p.changedPixels!==0)},null,2));
