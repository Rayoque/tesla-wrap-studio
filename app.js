'use strict';
const S=1024, MAXPX=1600;
const SNAP={"Hood":{"bb":[367,161,659,406],"rot":180},"Front bumper":{"bb":[240,23,789,157],"rot":180},"Left side":{"bb":[11,37,281,960],"rot":90},"Right side":{"bb":[751,36,1018,960],"rot":-90},"Trunk":{"bb":[364,603,663,835],"rot":0},"Rear bumper":{"bb":[253,846,771,1012],"rot":0},"Whole car":{"bb":[11,23,1018,1012],"rot":0}};
const LABELS=[["FRONT (top)",512,14],["Hood: upside down",513,290],["Left side: top of photo faces center",146,500,90],["Right side: top faces center",884,500,-90],["Trunk",513,720],["Rear bumper",512,930]];
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
let layers=[],sel=-1,showTpl=true,bg='#202830',eraseMode=false,brush=60;
let tplImg=new Image(),tplAlpha=null,tplCanvas=null;
tplImg.onload=()=>{tplCanvas=document.createElement('canvas');tplCanvas.width=tplCanvas.height=S;const c=tplCanvas.getContext('2d');c.drawImage(tplImg,0,0);const d=c.getImageData(0,0,S,S).data;tplAlpha=new Uint8Array(S*S);for(let i=0;i<S*S;i++)tplAlpha[i]=d[i*4+3];draw();};
tplImg.src='template.png';
let uid=0;
// ---------- history ----------
let undoS=[],redoS=[];
function snap(){return{layers:layers.map(l=>({...l,mask:l.mask})),sel,bg};}
function cloneMask(m){const c=document.createElement('canvas');c.width=m.width;c.height=m.height;c.getContext('2d').drawImage(m,0,0);return c;}
function push(){undoS.push(snap());if(undoS.length>20)undoS.shift();redoS=[];}
function restore(s){layers=s.layers.map(l=>({...l}));sel=Math.min(s.sel,layers.length-1);bg=s.bg;$('bg').value=bg;ui();draw();}
$('undo').onclick=()=>{if(!undoS.length)return;redoS.push(snap());restore(undoS.pop());};
$('redo').onclick=()=>{if(!redoS.length)return;undoS.push(snap());restore(redoS.pop());};
// ---------- load ----------
$('file').onchange=async e=>{const fs=[...e.target.files];e.target.value='';if(!fs.length)return;push();
 for(const f of fs){try{const img=await loadImg(f);addLayer(img);}catch(err){hint('Could not read '+f.name);}}
 ui();draw();};
async function loadImg(f){let src;
 try{src=await createImageBitmap(f,{imageOrientation:'from-image'});}catch(e){src=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(f);});}
 const w=src.width,h=src.height,k=Math.min(1,MAXPX/Math.max(w,h));
 const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(src,0,0,c.width,c.height);src.close?.();if(src.src)URL.revokeObjectURL(src.src);return c;}
function addLayer(img){const k=600/Math.max(img.width,img.height);const n=layers.length;
 const m=document.createElement('canvas');m.width=img.width;m.height=img.height;
 layers.push({id:++uid,img,mask:m,x:512+(n%4)*30-45,y:512+(n%4)*30-45,s:k,r:0,op:1,fe:0,fd:'none',fa:50});sel=layers.length-1;}
// ---------- render ----------
const cache=new WeakMap();
function layerCanvas(l){const key=[l.id,l.fe,l.fd,l.fa,l.mask.__v||0,l.mask===undefined].join();const c0=cache.get(l);if(c0&&c0.key===key&&c0.mask===l.mask)return c0.c;
 const w=l.img.width,h=l.img.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 g.drawImage(l.img,0,0);g.globalCompositeOperation='destination-out';
 if(l.fe>0){const f=Math.min(w,h)*l.fe/100;const E=[[0,0,f,0,0,0,f,h],[w,0,w-f,0,w-f,0,f,h],[0,0,0,f,0,0,w,f],[0,h,0,h-f,0,h-f,w,f]];
  for(const[x0,y0,x1,y1,rx,ry,rw,rh]of E){const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(rx,ry,rw,rh);}}
 if(l.fd!=='none'){const a=l.fa/100;let gr;
  if(l.fd==='l')gr=g.createLinearGradient(0,0,w*a,0);if(l.fd==='r')gr=g.createLinearGradient(w,0,w-w*a,0);
  if(l.fd==='t')gr=g.createLinearGradient(0,0,0,h*a);if(l.fd==='b')gr=g.createLinearGradient(0,h,0,h-h*a);
  gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}
 g.drawImage(l.mask,0,0);g.globalCompositeOperation='source-over';
 cache.set(l,{key,c,mask:l.mask});return c;}
function composite(g,withBg){g.clearRect(0,0,S,S);if(withBg){g.fillStyle=bg;g.fillRect(0,0,S,S);}
 for(const l of layers){g.save();g.globalAlpha=l.op;g.translate(l.x,l.y);g.rotate(l.r*Math.PI/180);g.scale(l.s,l.s);const c=layerCanvas(l);g.drawImage(c,-c.width/2,-c.height/2);g.restore();}}
let raf=0;function draw(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});}
function render(){composite(ctx,true);
 if(tplCanvas){ctx.save();ctx.globalCompositeOperation='destination-in';ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.restore();
  if(showTpl){ctx.save();ctx.globalAlpha=.55;ctx.globalCompositeOperation='multiply';ctx.drawImage(tplCanvas,0,0);ctx.restore();
   ctx.save();ctx.fillStyle='rgba(255,255,255,.85)';ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=4;ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.textBaseline='top';
   for(const[t,x,y,r]of LABELS){ctx.save();ctx.translate(x,y);if(r)ctx.rotate(r*Math.PI/180);ctx.strokeText(t,0,0);ctx.fillText(t,0,0);ctx.restore();}ctx.restore();}
  else{ // dim outside panels
   ctx.save();ctx.globalCompositeOperation='destination-in';ctx.drawImage(tplCanvas,0,0);ctx.restore();}}
 const l=layers[sel];if(l){const w=l.img.width*l.s,h=l.img.height*l.s;ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.r*Math.PI/180);ctx.strokeStyle=eraseMode?'#f80':'#2f8fff';ctx.lineWidth=4;ctx.setLineDash([16,10]);ctx.strokeRect(-w/2,-h/2,w,h);ctx.restore();}
 $('empty').style.display=layers.length?'none':'block';}
// ---------- UI ----------
for(const k in SNAP){const o=document.createElement('option');o.value=k;o.textContent=k;$('snap').appendChild(o);}
function ui(){const l=layers[sel];if(!l)$('panel').classList.add('hidden');$('layers').classList.toggle('on',!$('panel').classList.contains('hidden'));
 if(!l)return;
 $('op').value=Math.round(l.op*100);$('fe').value=l.fe;$('fd').value=l.fd;$('fa').value=l.fa;$('br').value=brush;
 $('erase').classList.toggle('on',eraseMode);$('brushrow').style.display=eraseMode?'flex':'none';}
function hint(t){const h=$('hint');h.textContent=t;h.style.opacity=1;clearTimeout(hint.t);hint.t=setTimeout(()=>h.style.opacity=0,1400);}
$('layers').onclick=()=>{if(!layers.length){hint('Load a photo first');return;}if(sel<0)sel=layers.length-1;$('panel').classList.toggle('hidden');ui();draw();};
$('tpl').onclick=()=>{showTpl=!showTpl;$('tpl').classList.toggle('on',showTpl);draw();};$('tpl').classList.add('on');
let bgP=false;$('bg').oninput=e=>{if(!bgP){push();bgP=true;}bg=e.target.value;draw();};$('bg').onchange=()=>bgP=false;
let lastSl=0,lastId='';function slider(id,fn){const el=$(id);el.oninput=()=>{const l=layers[sel];if(!l)return;const t=Date.now();if(t-lastSl>700||lastId!==id)push();lastSl=t;lastId=id;fn(l,+el.value);draw();};}
slider('op',(l,v)=>l.op=v/100);slider('fe',(l,v)=>l.fe=v);slider('fa',(l,v)=>l.fa=v);
$('fd').onchange=()=>{const l=layers[sel];if(l){push();l.fd=$('fd').value;draw();}};
$('br').oninput=()=>brush=+$('br').value;
$('snap').onchange=()=>{const k=$('snap').value,l=layers[sel],p=SNAP[k];$('snap').value='';if(!l||!p)return;push();
 const[x0,y0,x1,y1]=p.bb,bw=x1-x0,bh=y1-y0,rot=Math.abs(p.rot)===90;const iw=rot?l.img.height:l.img.width,ih=rot?l.img.width:l.img.height;
 l.s=Math.max(bw/iw,bh/ih);l.r=p.rot;l.x=(x0+x1)/2;l.y=(y0+y1)/2;hint('Snapped to '+k);draw();};
$('up').onclick=()=>{if(sel<layers.length-1){push();[layers[sel],layers[sel+1]]=[layers[sel+1],layers[sel]];sel++;draw();}};
$('down').onclick=()=>{if(sel>0){push();[layers[sel],layers[sel-1]]=[layers[sel-1],layers[sel]];sel--;draw();}};
$('dup').onclick=()=>{const l=layers[sel];if(!l)return;push();layers.splice(sel+1,0,{...l,id:++uid,mask:cloneMask(l.mask),x:l.x+30,y:l.y+30});sel++;draw();};
$('del').onclick=()=>{if(sel<0)return;push();layers.splice(sel,1);sel=layers.length-1;eraseMode=false;ui();draw();};
$('erase').onclick=()=>{eraseMode=!eraseMode;hint(eraseMode?'Eraser: paint to soften away':'Move mode');ui();draw();};
// ---------- gestures ----------
const pts=new Map();let g0=null;
function toCanvas(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*S/r.width,y:(e.clientY-r.top)*S/r.height};}
function toLocal(l,p){const a=-l.r*Math.PI/180,dx=p.x-l.x,dy=p.y-l.y;return{x:(dx*Math.cos(a)-dy*Math.sin(a))/l.s+l.img.width/2,y:(dx*Math.sin(a)+dy*Math.cos(a))/l.s+l.img.height/2};}
function hit(p){for(let i=layers.length-1;i>=0;i--){const q=toLocal(layers[i],p);if(q.x>=0&&q.y>=0&&q.x<=layers[i].img.width&&q.y<=layers[i].img.height)return i;}return -1;}
function eraseAt(l,p){const q=toLocal(l,p),m=l.mask,g=m.getContext('2d'),r=brush/l.s/2;const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,r);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(q.x,q.y,r,0,7);g.fill();m.__v=(m.__v||0)+1;draw();}
function startGesture(){const l=layers[sel];const a=[...pts.values()];if(!l||!a.length){g0=null;return;}
 if(a.length===1)g0={n:1,p:a[0],x:l.x,y:l.y};
 else{const[p,q]=a;g0={n:2,d:Math.hypot(q.x-p.x,q.y-p.y),ang:Math.atan2(q.y-p.y,q.x-p.x),mx:(p.x+q.x)/2,my:(p.y+q.y)/2,x:l.x,y:l.y,s:l.s,r:l.r};}}
cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.setPointerCapture?.(e.pointerId);const p=toCanvas(e);
 if(pts.size===0){if(eraseMode&&layers[sel]){push();const l=layers[sel];l.mask=cloneMask(l.mask);pts.set(e.pointerId,p);eraseAt(l,p);return;}
  const h=hit(p);if(h>=0&&h!==sel){sel=h;ui();}if(sel<0&&h<0)return;push();}
 pts.set(e.pointerId,p);startGesture();draw();});
cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;e.preventDefault();const p=toCanvas(e);pts.set(e.pointerId,p);const l=layers[sel];if(!l)return;
 if(eraseMode&&pts.size===1){eraseAt(l,p);return;}if(!g0)return;const a=[...pts.values()];
 if(g0.n===1&&a.length===1){l.x=g0.x+p.x-g0.p.x;l.y=g0.y+p.y-g0.p.y;}
 else if(g0.n===2&&a.length>=2){const[p1,q]=a,d=Math.hypot(q.x-p1.x,q.y-p1.y),an=Math.atan2(q.y-p1.y,q.x-p1.x);
  l.s=Math.max(.02,g0.s*d/g0.d);l.r=g0.r+(an-g0.ang)*180/Math.PI;l.x=g0.x+(p1.x+q.x)/2-g0.mx;l.y=g0.y+(p1.y+q.y)/2-g0.my;}
 draw();});
function up(e){if(!pts.delete(e.pointerId))return;startGesture();}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{const l=layers[sel];if(!l)return;e.preventDefault();if(e.shiftKey)l.r+=e.deltaY>0?3:-3;else l.s*=e.deltaY>0?.95:1.05;draw();},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());document.addEventListener('touchmove',e=>{if(!e.target.closest('section')&&e.target.type!=='range')e.preventDefault();},{passive:false});
// ---------- export ----------
function safeName(n){n=(n||'').replace(/[^A-Za-z0-9_]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30);return n||'my_wrap';}
function buildPNG(){const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');composite(g,true);
 const d=g.getImageData(0,0,S,S),px=d.data;for(let i=0;i<S*S;i++){const a=tplAlpha[i];px[i*4+3]=a;if(!a){px[i*4]=px[i*4+1]=px[i*4+2]=0;}}
 let buf,how='lossless';for(const cnum of [0,256,128,64,32]){buf=UPNG.encode([px.buffer.slice(0)],S,S,cnum);if(cnum)how=cnum+' colors';if(buf.byteLength<1000000)break;}
 return{buf,how,px};}
let last=null;
$('exp').onclick=()=>{if(!tplAlpha)return;last=buildPNG();const pc=$('pv').getContext('2d');pc.putImageData(new ImageData(new Uint8ClampedArray(UPNG.toRGBA8(UPNG.decode(last.buf))[0]),S,S),0,0);
 $('fn').value=safeName($('fn').value);$('info').textContent=`1024x1024 PNG, ${(last.buf.byteLength/1024).toFixed(0)} KB (${last.how})`;$('exportp').classList.remove('hidden');};
$('closex').onclick=()=>$('exportp').classList.add('hidden');
$('fn').oninput=()=>{const v=$('fn').value,s=v.replace(/[^A-Za-z0-9_]/g,'_').slice(0,30);if(s!==v)$('fn').value=s;};
$('save').onclick=async()=>{const name=safeName($('fn').value)+'.png';$('fn').value=name.slice(0,-4);const blob=new Blob([last.buf],{type:'image/png'});window.__lastExport={name,size:blob.size};
 const file=new File([blob],name,{type:'image/png'});
 if(navigator.canShare&&navigator.canShare({files:[file]})&&!window.__noShare){try{await navigator.share({files:[file],title:name});return;}catch(e){if(e.name==='AbortError')return;}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);};
window.addEventListener('resize',draw);
window.__ws={get layers(){return layers.map(({x,y,s,r,op,fe,fd,fa})=>({x,y,s,r,op,fe,fd,fa}));},get sel(){return sel;},undo:()=>$('undo').click()};
ui();draw();
