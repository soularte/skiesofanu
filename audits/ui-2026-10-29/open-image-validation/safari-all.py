import urllib.request,json,time,base64,sys
from pathlib import Path
base=Path(__file__).parent
sid='157BB289-C2E2-4E1A-9924-9F84457EFC87'
root='http://127.0.0.1:4444/session/'+sid

def req(path,data=None,method=None):
 raw=None if data is None else json.dumps(data).encode()
 r=urllib.request.urlopen(urllib.request.Request(root+path,data=raw,headers={'Content-Type':'application/json'},method=method or ('POST' if data is not None else 'GET')),timeout=30)
 value=json.load(r)['value']
 if isinstance(value,dict) and 'error' in value:raise RuntimeError(value)
 return value

def js(script):return req('/execute/sync',{'script':script,'args':[]})

results=[]
pages=list(dict.fromkeys(r['path'] for r in json.loads((base.parent/'ui02-validation'/'after.json').read_text())))
for w,h in [(1440,1000),(600,700)]:
 req('/window/rect',{'x':0,'y':0,'width':w,'height':h})
 for path in pages:
  req('/url',{'url':'http://127.0.0.1:4321'+path})
  for i in range(100):
   if js("return document.readyState==='complete'&&typeof window.__openLightbox==='function'"):break
   time.sleep(.05)
  js("document.getElementById('privacy-banner').style.display='none'")
  groups=js("return [...new Set([...document.querySelectorAll('[data-lightbox-group]')].filter(e=>e.getBoundingClientRect().width&&!e.closest('[inert]')).map(e=>e.dataset.lightboxGroup))]")
  for group in groups:
   js("window.__trigger=[...document.querySelectorAll('[data-lightbox-group]')].find(e=>e.dataset.lightboxGroup==="+json.dumps(group)+"&&e.getBoundingClientRect().width&&!e.closest('[inert]'));window.__trigger.scrollIntoView({block:'center'});window.__trigger.click()")
   count=js("return Number(document.getElementById('lb-counter').textContent.split('/')[1])||1")
   for index in range(count):
    for i in range(100):
     if js("return document.getElementById('lb-img').complete&&document.getElementById('lb-img').naturalWidth>0"):break
     time.sleep(.05)
    r=js("var im=document.getElementById('lb-img'),r=im.getBoundingClientRect();return {width:innerWidth,height:innerHeight,image:r.toJSON(),centerError:[r.x+r.width/2-innerWidth/2,r.y+r.height/2-innerHeight/2],fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,ratio:r.height/innerHeight,widthRatio:r.width/innerWidth}")
    r.update(path=path,group=group,index=index)
    r['passed']=r['fits'] and abs(r['centerError'][0])<1 and abs(r['centerError'][1])<1 and r['ratio']<=.751 and r['widthRatio']<=.801
    results.append(r)
    js("document.getElementById('lb-next').click()")
   js("document.getElementById('lb-close').click()")
   if not js("return document.activeElement===window.__trigger&&document.body.style.overflow===''"):raise RuntimeError('focus/scroll restore: '+path)
  print(w,path,'checked',len(groups),'groups',flush=True)
# Resize the same open portrait without navigating, both directions.
req('/url',{'url':'http://127.0.0.1:4321/books/aviatory/'})
time.sleep(.3)
js("document.querySelector('[data-lightbox-group=characters]').click()")
for w,h in [(1200,650),(600,500),(1440,1000)]:
 req('/window/rect',{'width':w,'height':h});time.sleep(.1)
 r=js("var r=document.getElementById('lb-img').getBoundingClientRect();return {width:innerWidth,height:innerHeight,centerError:[r.x+r.width/2-innerWidth/2,r.y+r.height/2-innerHeight/2],fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,ratio:r.height/innerHeight,widthRatio:r.width/innerWidth}")
 r.update(test='resize-open',passed=r['fits'] and max(abs(v) for v in r['centerError'])<1 and r['ratio']<=.751 and r['widthRatio']<=.801)
 results.append(r)
js("document.getElementById('lb-close').click()")
(base/'safari-all-images.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS',sum(r['passed'] for r in results),'/',len(results))
if not all(r['passed'] for r in results):raise RuntimeError('Geometry failed')
