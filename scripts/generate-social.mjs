// Compose social-only layouts from existing artwork. Originals are never overwritten.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import sharp from 'sharp';

const root = process.cwd();
const out = path.join(root, 'public/social');
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const read = async file => matter(await fs.readFile(file, 'utf8')).data;
const authors = await read('src/data/authors.md');
const site = await read('src/data/site.md');
const byline = [authors.ksenia.name, authors.vasily.name];
const overrides = JSON.parse(await fs.readFile('src/data/social.json', 'utf8'));
async function files(dir) {
 const entries = await fs.readdir(dir, {withFileTypes:true});
 return (await Promise.all(entries.map(e => e.isDirectory() ? files(path.join(dir,e.name)) : path.join(dir,e.name)))).flat();
}
const assets = await files('src/assets/images');
function artwork(key) {
 if (key.startsWith('/')) return path.join('public',key.slice(1));
 const exact = assets.find(f => f === path.join('src/assets/images',key));
 const matches = assets.filter(f => path.basename(f) === key);
 if (exact) return exact;
 if (matches.length !== 1) throw new Error(`Missing or ambiguous artwork: ${key}`);
 return matches[0];
}
const cards = [
 {route:'/',title:site.siteName,label:'АВТОРСКИЙ САЙТ',source:artwork('authors/favi.jpg')},
 {route:'/books/',title:'Книги',label:site.siteName,source:artwork('authors/favi.jpg')},
 {route:'/about/',title:'Об авторах',label:site.siteName,source:artwork('authors/favi.jpg')},
 {route:'/blog/',title:'Блог',label:site.siteName,source:artwork('authors/favi.jpg')},
];
for (const group of ['books','blog','lore','authors']) {
 for (const file of (await files(`src/content/${group}`)).filter(f => f.endsWith('.md')).sort()) {
  const d = await read(file); if (d.draft) continue;
  const slug = d.slug ?? path.basename(file,'.md');
  let route, label, source;
  if (group === 'books') {route=`/books/${slug}/`; label=d.series ? `ЦИКЛ «${d.series}»` : 'КНИГА'; source=artwork(d.cover);}
  if (group === 'blog') {route=`/blog/${slug}/`; label='БЛОГ · СТАТЬЯ'; source=artwork(d.cover ?? 'authors/favi.jpg');}
  if (group === 'lore') {route=`/books/${d.book}/lore/${slug}/`; label='МИР КНИГИ'; source=artwork(d.cover ?? 'authors/favi.jpg');}
  if (group === 'authors') {route=`/about/${slug}/`; label='ОБ АВТОРЕ'; source=artwork(`authors/${authors[slug]?.photo ?? 'favi.jpg'}`);}
  cards.push({route,title:d.title,label,source,description:group==='books' ? d.shortDescription : d.excerpt,byline:group==='authors' ? [] : byline});
 }
}
// Conservative wrapping leaves room for wide Cyrillic glyphs; shrink long titles.
function wrap(text, max) {
 const lines=[]; let line='';
 for (const word of text.split(/\s+/)) {
  if (word.length > max) throw new Error(`Word too long for card: ${word}`);
  if (line && (line+' '+word).length>max) {lines.push(line);line=word;} else line += (line?' ':'')+word;
 }
 if(line) lines.push(line); return lines;
}
await fs.mkdir(out,{recursive:true});
const manifest={}; const keep=new Set();
for (const card of cards) {
 const override = overrides[card.route];
 if (override?.title) card.title = override.title;
 if (override?.description) card.description = override.description;
 if (override?.authors) card.byline = override.authors.map(key => {
  if (!authors[key]?.name) throw new Error(`Unknown author: ${key}`);
  return authors[key].name;
 });
 let font=54, lines;
 do {lines=wrap(card.title,Math.floor(620/(font*.59))); if(lines.length<=3)break; font-=2;} while(font>=32);
 if(lines.length>3)throw new Error(`Title exceeds card: ${card.title}`);
 const art=await sharp(card.source).rotate().resize(348,510,{fit:'inside'}).png().toBuffer({resolveWithObject:true});
 const x=Math.round(62+(348-art.info.width)/2), y=Math.round((630-art.info.height)/2);
 const top=155;
 const descriptionLines=wrap(card.description ?? '', 43);
 if(descriptionLines.length>4) throw new Error(`Description exceeds card: ${card.route}`);
 const descriptionTop=top+(lines.length-1)*(font+10)+48;
 if(descriptionTop+(descriptionLines.length-1)*32>425) throw new Error(`Text overlaps byline: ${card.route}`);
 const names=card.byline ?? byline;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
 <rect width="1200" height="630" fill="#FAF6F0"/>
 <rect x="20" y="20" width="1160" height="590" rx="2" fill="none" stroke="#D4C5A9"/>
 <path d="M460 83 H1118 M460 524 H1118" stroke="#C9A84C" stroke-width="2"/>
 <text x="460" y="64" font-family="Georgia,DejaVu Serif,serif" font-size="18" fill="#7A5E1A">${escape(card.label)}</text>
 <rect x="${x+5}" y="${y+6}" width="${art.info.width}" height="${art.info.height}" fill="#D4C5A9"/>
 ${lines.map((line,i)=>`<text x="460" y="${top+i*(font+10)}" font-family="Georgia,DejaVu Serif,serif" font-size="${font}" fill="#1A1A2E">${escape(line)}</text>`).join('')}
 ${descriptionLines.map((line,i)=>`<text x="462" y="${descriptionTop+i*32}" font-family="Georgia,DejaVu Serif,serif" font-size="25" fill="#6B6660">${escape(line)}</text>`).join('')}
 ${names.map((name,i)=>`<text x="462" y="${465+i*33}" font-family="Georgia,DejaVu Serif,serif" font-size="26" fill="#2C2C2C">${escape(name)}</text>`).join('')}
 <text x="462" y="562" font-family="Georgia,DejaVu Serif,serif" font-size="20" fill="#7A5E1A">${escape(site.siteName)} · skiesofanu.ru</text>
 </svg>`;
 const canvas=await sharp(Buffer.from(svg)).png().toBuffer();
 let jpeg;
 for (const quality of [88,82,76,70]) {
  jpeg=await sharp(canvas).composite([{input:art.data,left:x,top:y}]).jpeg({quality,mozjpeg:true}).toBuffer();
  if(jpeg.length<=300000)break;
 }
 if(jpeg.length>300000)throw new Error(`Card exceeds 300 KB: ${card.route}`);
 const hash=crypto.createHash('sha256').update(jpeg).digest('hex').slice(0,10);
 const name=(card.route==='/'?'home':card.route.split('/').filter(Boolean).join('-'))+`-${hash}.jpg`;
 await fs.writeFile(path.join(out,name),jpeg);keep.add(name);
 manifest[card.route]={src:`/social/${name}`,width:1200,height:630,type:'image/jpeg',alt:`${card.title} — ${names.length ? names.join(', ') : site.siteName}`};
 console.log(`${card.route} → ${name} (${Math.round(jpeg.length/1024)} KB)`);
}
// Only remove prior generated JPEGs, never unrelated files.
for(const f of await fs.readdir(out))if(/-[a-f0-9]{10}\.jpg$/.test(f)&&!keep.has(f))await fs.unlink(path.join(out,f));
await fs.writeFile('src/generated/social.json',JSON.stringify(manifest,null,2)+'\n');
