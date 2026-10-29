import fs from 'node:fs';import sharp from 'sharp';import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('.',import.meta.url));
const before=JSON.parse(fs.readFileSync(dir+'before.json')),after=JSON.parse(fs.readFileSync(dir+'after.json'));
const geometry=after.map(a=>{const b=before.find(b=>b.path===a.path&&b.width===a.width);const changes=[];if(a.rects.length!==b.rects.length)changes.push({counts:[b.rects.length,a.rects.length]});for(let i=0;i<Math.min(a.rects.length,b.rects.length);i++)if(JSON.stringify(a.rects[i])!==JSON.stringify(b.rects[i]))changes.push({i,before:b.rects[i],after:a.rects[i]});return{path:a.path,width:a.width,documentHeight:[b.height,a.height],scrollWidth:[b.scrollWidth,a.scrollWidth],changes,controls:a.controls};});
const pixels=[];
for(const file of fs.readdirSync(dir+'before').filter(f=>f.endsWith('.png'))){
 const width=Number(file.match(/--(\d+)\.png/)[1]),slug=file.split('--')[0];const arow=after.find(r=>r.width===width&&(r.path.replace(/^\/+|\/+$/g,'').replaceAll('/','__')||'home')===slug);
 const masks=arow.controls.map(r=>({l:Math.max(0,Math.floor(r.x-4)),t:Math.max(0,Math.floor(r.y-4)),r:Math.ceil(r.right+4),b:Math.ceil(r.bottom+4)}));
 const a=await sharp(dir+'after/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(dir+'before/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let changed=0,outside=0;
 if(a.info.width!==b.info.width||a.info.height!==b.info.height){changed=-1;outside=-1;}else for(let i=0;i<a.data.length;i+=4){if(a.data[i]===b.data[i]&&a.data[i+1]===b.data[i+1]&&a.data[i+2]===b.data[i+2])continue;changed++;const x=i/4%a.info.width,y=Math.floor(i/4/a.info.width);if(!masks.some(r=>x>=r.l&&x<r.r&&y>=r.t&&y<r.b))outside++;}
 pixels.push({file,changedPixels:changed,changedOutsideButtons:outside});
}
fs.writeFileSync(dir+'comparison.json',JSON.stringify({geometry,pixels},null,2));console.log(JSON.stringify({states:geometry.length,layoutDifferences:geometry.filter(r=>r.changes.length),screenshots:pixels.length,outsideDifferences:pixels.filter(r=>r.changedOutsideButtons!==0)},null,2));
