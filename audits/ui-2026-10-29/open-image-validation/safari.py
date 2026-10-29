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
phase=sys.argv[1]
req('/window/rect',{'x':0,'y':0,'width':1440,'height':1000})
req('/url',{'url':'http://127.0.0.1:4321/books/aviatory/'})
for i in range(100):
 if js("return document.readyState==='complete'&&typeof window.__openLightbox==='function'"):break
 time.sleep(.1)
js("document.getElementById('privacy-banner').style.display='none';var t=[...document.querySelectorAll('[data-lightbox-group=characters]')].find(e=>!e.closest('[inert]'));t.scrollIntoView({block:'center'});t.click()")
results=[]
for i in range(3):
 for j in range(100):
  if js("return document.getElementById('lb-img').complete && document.getElementById('lb-img').naturalWidth>0"):break
  time.sleep(.1)
 results.append(js("var im=document.getElementById('lb-img'),r=im.getBoundingClientRect(),b=document.getElementById('lightbox').getBoundingClientRect();return {browser:navigator.userAgent,width:innerWidth,height:innerHeight,image:r.toJSON(),overlay:b.toJSON(),counter:document.getElementById('lb-counter').textContent,centerError:[r.x+r.width/2-innerWidth/2,r.y+r.height/2-innerHeight/2],fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,ratio:r.height/innerHeight}"))
 if i==0:(base/('safari-'+phase+'.png')).write_bytes(base64.b64decode(req('/screenshot')))
 js("document.getElementById('lb-next').click()")
(base/('safari-'+phase+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps(results,ensure_ascii=False,indent=2))
