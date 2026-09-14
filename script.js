const DPR = Math.min(window.devicePixelRatio || 1, 2);

function fitCanvas(canvas){
  const r=canvas.getBoundingClientRect(); const w=Math.max(1,Math.floor(r.width*DPR)); const h=Math.max(1,Math.floor(r.height*DPR));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;} return {w,h};
}
function arrow(ctx,x,y,dx,dy,color,alpha=1,width=1.3){
  const L=Math.hypot(dx,dy)||1; const ux=dx/L,uy=dy/L; const len=Math.min(20*DPR, L); const ex=x+ux*len, ey=y+uy*len;
  ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width*DPR;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
  const a=4*DPR; ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-ux*a-uy*a*.7,ey-uy*a+ux*a*.7);ctx.lineTo(ex-ux*a+uy*a*.7,ey-uy*a-ux*a*.7);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=1;
}

// Hero: moving manifold-like parametric mesh
const hero=document.getElementById('heroCanvas'), hctx=hero.getContext('2d');
let heroT=0;
function drawHero(){
  const {w,h}=fitCanvas(hero); hctx.clearRect(0,0,w,h); heroT+=.004;
  const cx=w*.73,cy=h*.48, sx=Math.min(w,h)*.34, sy=sx*.62;
  hctx.lineWidth=.7*DPR;
  for(let ring=0;ring<18;ring++){
    const rr=.15+ring*.047; hctx.beginPath();
    for(let i=0;i<=180;i++){
      const a=i/180*Math.PI*2; const warp=1+.13*Math.sin(3*a+heroT*9); const x=cx+sx*rr*warp*Math.cos(a); const y=cy+sy*rr*Math.sin(a)+18*DPR*Math.sin(a*2+heroT*4)*rr;
      i?hctx.lineTo(x,y):hctx.moveTo(x,y);
    }
    hctx.strokeStyle=`rgba(109,229,255,${0.018+ring*.004})`;hctx.stroke();
  }
  for(let k=0;k<10;k++){
    const a=(k/10)*Math.PI*2+heroT*.5; const r=.68+.18*Math.sin(a*2+heroT);
    const x=cx+sx*r*Math.cos(a),y=cy+sy*r*Math.sin(a);hctx.beginPath();hctx.arc(x,y,1.6*DPR,0,Math.PI*2);hctx.fillStyle='rgba(255,255,255,.65)';hctx.fill();
  }
  requestAnimationFrame(drawHero);
} drawHero();

// Sphere projected to disk — interactive local actuation directions
const sphere=document.getElementById('sphereCanvas'), sctx=sphere.getContext('2d');
let mouse={x:.5,y:.5,active:false};

function updateSpherePointer(e){
  const r=sphere.getBoundingClientRect();
  mouse={
    x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),
    y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),
    active:true
  };
}
sphere.addEventListener('pointermove',updateSpherePointer);
sphere.addEventListener('pointerdown',updateSpherePointer);
sphere.addEventListener('pointerenter',updateSpherePointer);
sphere.addEventListener('pointerleave',()=>{mouse.active=false;});

function drawDiskField(ctx,w,h,tilt=0,eqY=null){
  const cx=w/2,cy=h/2,R=Math.min(w,h)*.38; ctx.save();
  const g=ctx.createRadialGradient(cx-R*.25,cy-R*.35,R*.05,cx,cy,R);g.addColorStop(0,'#173046');g.addColorStop(1,'#081019');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#6de5ff55';ctx.lineWidth=1*DPR;ctx.stroke();
  const N=13;
  for(let iy=-N;iy<=N;iy++)for(let ix=-N;ix<=N;ix++){
    const X=ix/N,Y=iy/N;if(X*X+Y*Y>.92)continue; const z=Math.sqrt(Math.max(0,1-X*X-Y*Y));
    // projected versions of e1=(z,0,-x), e2=(0,z,-y); tilt e2 by gamma e1
    const x=cx+X*R,y=cy-Y*R; const scale=(.6+.55*z)*DPR;
    arrow(ctx,x,y,z*18*scale,0,'#6de5ff',.42,.8);
    arrow(ctx,x,y,tilt*z*15*scale,-z*18*scale,'#ff6aa9',tilt===0?.20:.58,.8);
  }
  if(eqY!==null){const X=0,Y=eqY;const x=cx+X*R,y=cy-Y*R;ctx.shadowColor='#6de5ff';ctx.shadowBlur=18*DPR;ctx.fillStyle='white';ctx.beginPath();ctx.arc(x,y,5.2*DPR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  ctx.restore();
}

function drawSphere(){
  const {w,h}=fitCanvas(sphere); sctx.clearRect(0,0,w,h); drawDiskField(sctx,w,h,0,null);
  const cx=w/2,cy=h/2,R=Math.min(w,h)*.38;
  const X=(mouse.x-.5)*2/.76;  // map canvas pointer to disk coordinates
  const Y=-(mouse.y-.5)*2/.76;
  const r2=X*X+Y*Y;

  if(mouse.active && r2<1){
    const z=Math.sqrt(Math.max(0,1-r2));
    const px=cx+X*R, py=cy-Y*R;

    // pointer location
    sctx.save();
    sctx.shadowColor='rgba(255,255,255,.65)'; sctx.shadowBlur=12*DPR;
    sctx.fillStyle='#ffffff'; sctx.beginPath(); sctx.arc(px,py,4.2*DPR,0,Math.PI*2); sctx.fill();
    sctx.shadowBlur=0;

    // local admissible directions e1 and e2, exaggerated for readability
    const mag=(34+34*z)*DPR;
    arrow(sctx,px,py, mag,0,'#6de5ff',1,2.2);
    arrow(sctx,px,py, 0,-mag,'#ff6aa9',1,2.2);

    // labels attached to the local directions
    sctx.font=`${12*DPR}px system-ui, sans-serif`;
    sctx.fillStyle='#9df1ff'; sctx.fillText('e₁',px+mag+7*DPR,py-5*DPR);
    sctx.fillStyle='#ff9ac7'; sctx.fillText('e₂',px+7*DPR,py-mag-7*DPR);

    // local coordinate readout
    const bx=18*DPR, by=24*DPR;
    sctx.fillStyle='rgba(5,10,16,.80)';
    sctx.strokeStyle='rgba(255,255,255,.12)';
    sctx.lineWidth=1*DPR;
    sctx.beginPath(); sctx.roundRect(bx,by,198*DPR,48*DPR,9*DPR); sctx.fill(); sctx.stroke();
    sctx.fillStyle='rgba(220,232,243,.92)';
    sctx.font=`${11*DPR}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    sctx.fillText(`x = (${X.toFixed(2)}, ${Y.toFixed(2)}, ${z.toFixed(2)})`,bx+12*DPR,by+20*DPR);
    sctx.fillStyle='rgba(150,166,182,.9)';
    sctx.fillText('local admissible directions',bx+12*DPR,by+38*DPR);
    sctx.restore();
  }
  requestAnimationFrame(drawSphere);
}
drawSphere();

// Deception demo
const dc=document.getElementById('deceptionCanvas'),dctx=dc.getContext('2d'),gs=document.getElementById('gammaSlider'),gv=document.getElementById('gammaValue');
function drawDeception(){const {w,h}=fitCanvas(dc);const gamma=+gs.value;gv.value=gamma.toFixed(2);dctx.clearRect(0,0,w,h);const eqY=gamma/Math.sqrt(1+gamma*gamma);drawDiskField(dctx,w,h,gamma,eqY);requestAnimationFrame(drawDeception)}drawDeception();

// Simplex demo
const sc=document.getElementById('simplexCanvas'),xctx=sc.getContext('2d'),sg=document.getElementById('simplexGammaSlider'),sgv=document.getElementById('simplexGammaValue');
function baryToXY(v,A,B,C){return {x:v[0]*A.x+v[1]*B.x+v[2]*C.x,y:v[0]*A.y+v[1]*B.y+v[2]*C.y}}
function drawSimplex(){
  const {w,h}=fitCanvas(sc);xctx.clearRect(0,0,w,h);const pad=70*DPR,A={x:w/2,y:pad},B={x:pad,y:h-pad*.75},C={x:w-pad,y:h-pad*.75};
  xctx.fillStyle='#0c1721';xctx.strokeStyle='#6de5ff55';xctx.lineWidth=1.2*DPR;xctx.beginPath();xctx.moveTo(A.x,A.y);xctx.lineTo(B.x,B.y);xctx.lineTo(C.x,C.y);xctx.closePath();xctx.fill();xctx.stroke();
  xctx.strokeStyle='#ffffff0e'; for(let k=1;k<5;k++){let t=k/5;[[A,B,C],[B,A,C],[C,A,B]].forEach(([P,Q,R])=>{const p1={x:P.x*t+Q.x*(1-t),y:P.y*t+Q.y*(1-t)},p2={x:P.x*t+R.x*(1-t),y:P.y*t+R.y*(1-t)};xctx.beginPath();xctx.moveTo(p1.x,p1.y);xctx.lineTo(p2.x,p2.y);xctx.stroke()})}
  const alpha=4/9,gamma=+sg.value;sgv.value=gamma.toFixed(2);const beta=1-3*alpha;
  const nom=[(2-3*alpha)/3,(2-3*alpha)/3,(6*alpha-1)/3];
  const cur=[((2-3*alpha)+gamma*beta)/3,((2-3*alpha)-2*gamma*beta)/3,((6*alpha-1)+gamma*beta)/3];
  const p0=baryToXY(nom,A,B,C),p=baryToXY(cur,A,B,C);
  xctx.setLineDash([6*DPR,6*DPR]);xctx.strokeStyle='#ffffff55';xctx.beginPath();xctx.moveTo(p0.x,p0.y);xctx.lineTo(p.x,p.y);xctx.stroke();xctx.setLineDash([]);
  xctx.fillStyle='#8190a1';xctx.beginPath();xctx.arc(p0.x,p0.y,4*DPR,0,Math.PI*2);xctx.fill();
  xctx.shadowColor='#ff6aa9';xctx.shadowBlur=18*DPR;xctx.fillStyle='#fff';xctx.beginPath();xctx.arc(p.x,p.y,6*DPR,0,Math.PI*2);xctx.fill();xctx.shadowBlur=0;
  xctx.fillStyle='#8593a3';xctx.font=`${11*DPR}px sans-serif`;xctx.fillText('x₁',A.x-5*DPR,A.y-12*DPR);xctx.fillText('x₂',B.x-22*DPR,B.y+20*DPR);xctx.fillText('x₃',C.x+10*DPR,C.y+20*DPR);
  requestAnimationFrame(drawSimplex)
}drawSimplex();

// Reveal effects
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Copy citation
const btn=document.getElementById('copyBib');btn.addEventListener('click',async()=>{await navigator.clipboard.writeText(document.getElementById('bibtex').innerText);btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy',1400)});
