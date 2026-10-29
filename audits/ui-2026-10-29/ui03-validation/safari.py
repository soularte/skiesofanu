import urllib.request,json,time,base64,os
from pathlib import Path
base=Path(__file__).parent
sid=json.loads(Path('/tmp/skies-ui03-safari-session.json').read_text())['value']['sessionId']
root='http://127.0.0.1:4444/session/'+sid

def req(path,data=None,method=None):
 r=urllib.request.urlopen(urllib.request.Request(root+path,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json'},method=method or ('POST' if data is not None else 'GET')),timeout=30)
 v=json.load(r)['value']
 if isinstance(v,dict) and 'error' in v:raise RuntimeError(v)
 return v

def js(s):return req('/execute/sync',{'script':s,'args':[]})
def click(x,y):return req('/actions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerMove','x':int(x),'y':int(y),'duration':0},{'type':'pointerDown','button':0},{'type':'pointerUp','button':0}]}]})
rows=json.loads((base/'before.json').read_text());pages=list(dict.fromkeys(r['path'] for r in rows if r['width']==390 and r['controls']))
results=json.loads((base/'safari-results.json').read_text()) if os.getenv('UI_SINGLE_ONLY') else []
if os.getenv('UI_SINGLE_ONLY'):pages=[p for p in pages if p=='/paths/detyam/']
for width,height in [(600,850),(1440,1000)]:
 req('/window/rect',{'x':0,'y':0,'width':width,'height':height})
 for path in pages:
  req('/url',{'url':'http://127.0.0.1:4324'+path})
  for i in range(100):
   if js("return document.readyState==='complete'&&typeof window.__openLightbox==='function'"):break
   time.sleep(.05)
  js("document.getElementById('privacy-banner').style.display='none'")
  prefixes=js("return ['covers','cards','chars'].filter(p=>document.getElementById(p+'-slider'))")
  row={'path':path,'width':js('return innerWidth'),'galleries':[]}
  for p in prefixes:
   print('case',width,path,p,flush=True)
   g={'prefix':p};row['galleries'].append(g)
   if width<640:
    total=js("return document.getElementById('"+p+"-slider').children.length")
    if total<2:
     assert js("return !document.getElementById('"+p+"-mobile-prev')&&!document.getElementById('"+p+"-mobile-next')")
     g['singleSlideNoArrows']=True;g['passed']=True;continue
    pos=js("window.__s=document.getElementById('"+p+"-slider');window.__im=window.__s.querySelector('img');window.__im.scrollIntoView({block:'center'});var r=document.getElementById('"+p+"-mobile-next').getBoundingClientRect();return r.toJSON()")
    assert pos['width']==52 and pos['height']==52
    click(pos['x']+3,pos['y']+26);time.sleep(.35)
    assert js("return window.__s.style.transform==='translateX(-100%)'")
    js("document.getElementById('"+p+"-mobile-prev').click()")
    time.sleep(.35)
    g['geometry']=js("var im=window.__im.getBoundingClientRect(),r=document.getElementById('"+p+"-mobile-next').getBoundingClientRect(),hit=document.elementFromPoint(im.right-8,im.y+im.height*.25);return {centerError:r.y+r.height/2-im.y-im.height/2,imageEdgeHitsButton:!!hit.closest('button[id$=\"-mobile-next\"],button[id$=\"-mobile-prev\"]'),hitArea:r.toJSON()}")
    assert abs(g['geometry']['centerError'])<1 and not g['geometry']['imageEdgeHitsButton']
    js("document.querySelectorAll('."+p+"-dot')[1].click()")
    assert js("return window.__s.style.transform==='translateX(-100%)'&&window.__s.children[0].inert&&!window.__s.children[1].inert")
    js("document.querySelectorAll('."+p+"-dot')[0].click()")
    g['paddingClick']=True;g['dots']=True
   else:
    js("window.__t=document.getElementById('"+p+"-track');window.__t.scrollIntoView({block:'center'})")
    rect=js("return document.getElementById('"+p+"-next').getBoundingClientRect().toJSON()")
    assert rect['width']==52 and rect['height']==52
    click(rect['x']+3,rect['y']+26);time.sleep(.7)
    g['scroll']=js("return {canScroll:window.__t.scrollWidth>window.__t.clientWidth,position:window.__t.scrollLeft}")
    assert not g['scroll']['canScroll'] or g['scroll']['position']>0, (width,path,p,rect,g['scroll'])
   g['passed']=True
  row['passed']=True;results=[r for r in results if not(r['path']==row['path'] and r['width']==row['width'])];results.append(row)
  print(width,path,'PASS',flush=True)
(base/'safari-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
req('',method='DELETE')
