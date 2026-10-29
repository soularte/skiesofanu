import Cocoa
import WebKit
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let web = WKWebView(frame: NSRect(x:0,y:0,width:1506,height:758))
let window = NSWindow(contentRect: web.frame, styleMask: [.borderless], backing:.buffered, defer:false)
window.contentView = web
let timeout = DispatchWorkItem { print("TIMEOUT"); exit(2) }
DispatchQueue.main.asyncAfter(deadline:.now()+40,execute:timeout)
class Delegate: NSObject, WKNavigationDelegate {
 func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
  DispatchQueue.main.asyncAfter(deadline:.now()+2) {
   webView.evaluateJavaScript("""
   (()=>{document.getElementById('privacy-banner').style.display='none';let t=document.querySelector('[data-lightbox-group="characters"]');t.scrollIntoView({block:'center'});t.click();return true})()
   """) { _,error in
    if let error=error {print(error);exit(1)}
    DispatchQueue.main.asyncAfter(deadline:.now()+2) {
     webView.evaluateJavaScript("""
     (()=>{const im=document.getElementById('lb-img'),r=im.getBoundingClientRect(),p=document.getElementById('lightbox').getBoundingClientRect(),v=visualViewport;return JSON.stringify({ua:navigator.userAgent,width:innerWidth,height:innerHeight,viewport:{w:v.width,h:v.height,x:v.offsetLeft,y:v.offsetTop,scale:v.scale},image:r.toJSON(),overlay:p.toJSON(),natural:[im.naturalWidth,im.naturalHeight],centerError:[r.x+r.width/2-innerWidth/2,r.y+r.height/2-innerHeight/2],fits:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})})()
     """) { value,error in
      if let error=error {print(error);exit(1)}
      print(value ?? "no result");exit(0)
     }
    }
   }
  }
 }
}
let delegate=Delegate();web.navigationDelegate=delegate
web.load(URLRequest(url:URL(string:"http://127.0.0.1:4321/books/aviatory/")!))
app.run()
