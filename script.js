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
  hctx.lineWidth=.9*DPR;
  for(let ring=0;ring<18;ring++){
    const rr=.15+ring*.047; hctx.beginPath();
    for(let i=0;i<=180;i++){
      const a=i/180*Math.PI*2; const warp=1+.13*Math.sin(3*a+heroT*9); const x=cx+sx*rr*warp*Math.cos(a); const y=cy+sy*rr*Math.sin(a)+18*DPR*Math.sin(a*2+heroT*4)*rr;
      i?hctx.lineTo(x,y):hctx.moveTo(x,y);
    }
    const aLine=0.045+ring*.0065;
    const blueMix=Math.min(1,ring/17);
    const rCol=Math.round(63+(88-63)*blueMix);
    const gCol=Math.round(143+(215-143)*blueMix);
    const bCol=Math.round(232+(244-232)*blueMix);
    hctx.strokeStyle=`rgba(${rCol},${gCol},${bCol},${aLine})`;
    hctx.shadowColor='rgba(88,215,244,.13)';
    hctx.shadowBlur=2.5*DPR;
    hctx.stroke();
    hctx.shadowBlur=0;
  }
  for(let k=0;k<10;k++){
    const a=(k/10)*Math.PI*2+heroT*.5; const r=.68+.18*Math.sin(a*2+heroT);
    const x=cx+sx*r*Math.cos(a),y=cy+sy*r*Math.sin(a);hctx.beginPath();hctx.arc(x,y,1.6*DPR,0,Math.PI*2);hctx.fillStyle='rgba(255,255,255,.78)';hctx.fill();
  }
  requestAnimationFrame(drawHero);
} drawHero();

// Sphere example: upper hemisphere -> disk chart, with linked interaction.
const sphere = document.getElementById('sphereCanvas');
const sctx = sphere.getContext('2d');
const sphere3D = document.getElementById('sphere3DCanvas');
const s3ctx = sphere3D.getContext('2d');

let mouse={x:.5,y:.5,active:true};

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

function chartPointFromMouse(w,h){
  const cx=w/2,cy=h/2,R=Math.min(w,h)*.37;
  let X=(mouse.x*w-cx)/R;
  let Y=-(mouse.y*h-cy)/R;
  const rr=Math.hypot(X,Y);
  // Clamp to the open disk so the point always has a valid lift.
  if(rr>.965){X*=.965/rr;Y*=.965/rr;}
  const Z=Math.sqrt(Math.max(0,1-X*X-Y*Y));
  return {X,Y,Z,cx,cy,R,px:cx+X*R,py:cy-Y*R};
}

function drawDiskField(ctx,w,h,tilt=0,eqY=null,selected=null){
  const cx=w/2,cy=h/2,R=Math.min(w,h)*.37;
  ctx.save();

  const g=ctx.createRadialGradient(cx-R*.24,cy-R*.28,R*.05,cx,cy,R);
  g.addColorStop(0,'#163349');
  g.addColorStop(.65,'#0b1824');
  g.addColorStop(1,'#071018');
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();

  // Coordinate grid: this is explicitly a chart of the upper hemisphere.
  ctx.strokeStyle='rgba(255,255,255,.075)';
  ctx.lineWidth=.8*DPR;
  for(let k=-3;k<=3;k++){
    const q=k/4;
    const lim=Math.sqrt(Math.max(0,1-q*q));
    ctx.beginPath();
    ctx.moveTo(cx+q*R,cy-lim*R);
    ctx.lineTo(cx+q*R,cy+lim*R);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx-lim*R,cy-q*R);
    ctx.lineTo(cx+lim*R,cy-q*R);
    ctx.stroke();
  }

  ctx.strokeStyle='#6de5ff70';
  ctx.lineWidth=1.1*DPR;
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();

  const N=10;
  for(let iy=-N;iy<=N;iy++)for(let ix=-N;ix<=N;ix++){
    const X=ix/N,Y=iy/N;
    if(X*X+Y*Y>.90)continue;
    const z=Math.sqrt(Math.max(0,1-X*X-Y*Y));

    // In chart coordinates phi(x)=(x1,x2):
    // e1=(z,0,-x1) -> Dphi e1=(z,0)
    // e2=(0,z,-x2) -> Dphi e2=(0,z)
    const x=cx+X*R,y=cy-Y*R;
    const scale=(.55+.5*z)*DPR;
    arrow(ctx,x,y,z*15*scale,0,'#6de5ff',.34,.75);
    arrow(ctx,x,y,tilt*z*13*scale,-z*15*scale,'#ff6aa9',tilt===0?.18:.48,.75);
  }

  if(eqY!==null){
    const x=cx,y=cy-eqY*R;
    ctx.shadowColor='#6de5ff';
    ctx.shadowBlur=18*DPR;
    ctx.fillStyle='white';
    ctx.beginPath();ctx.arc(x,y,5.2*DPR,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }

  if(selected){
    const {X,Y,Z,px,py}=selected;
    ctx.shadowColor='rgba(255,255,255,.55)';
    ctx.shadowBlur=11*DPR;
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(px,py,4.5*DPR,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;

    const mag=(31+27*Z)*DPR;
    arrow(ctx,px,py, mag,0,'#6de5ff',1,2.15);
    arrow(ctx,px,py, 0,-mag,'#ff6aa9',1,2.15);

    ctx.font=`${11*DPR}px system-ui, sans-serif`;
    ctx.fillStyle='#a5f2ff';ctx.fillText('Dφ·e₁',px+mag+5*DPR,py-4*DPR);
    ctx.fillStyle='#ff9bc8';ctx.fillText('Dφ·e₂',px+6*DPR,py-mag-6*DPR);

    const bx=13*DPR, by=15*DPR, bw=190*DPR, bh=61*DPR;
    ctx.fillStyle='rgba(5,10,16,.84)';
    ctx.strokeStyle='rgba(255,255,255,.12)';
    ctx.lineWidth=1*DPR;
    ctx.beginPath();ctx.roundRect(bx,by,bw,bh,9*DPR);ctx.fill();ctx.stroke();
    ctx.font=`${10.2*DPR}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillStyle='#dce8f2';
    ctx.fillText(`ξ = (${X.toFixed(2)}, ${Y.toFixed(2)})`,bx+10*DPR,by+19*DPR);
    ctx.fillStyle='#8fa0b1';
    ctx.fillText(`x₃ = √(1-‖ξ‖²) = ${Z.toFixed(2)}`,bx+10*DPR,by+38*DPR);
    ctx.fillText(`x = (${X.toFixed(2)}, ${Y.toFixed(2)}, ${Z.toFixed(2)})`,bx+10*DPR,by+55*DPR);
  }

  ctx.restore();
}

function project3(v,w,h){
  // Fixed camera: yaw + pitch, then orthographic projection.
  const yaw=-0.72, pitch=0.48;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const x1=cy*v.x+sy*v.z;
  const z1=-sy*v.x+cy*v.z;
  const y2=cp*v.y-sp*z1;
  const z2=sp*v.y+cp*z1;
  const S=Math.min(w,h)*.34;
  return {x:w*.50+x1*S,y:h*.55-y2*S,z:z2,S};
}
function projectVecAt(p,v,w,h){
  const a=project3(p,w,h);
  const eps=.17;
  const b=project3({x:p.x+eps*v.x,y:p.y+eps*v.y,z:p.z+eps*v.z},w,h);
  return {dx:(b.x-a.x)/eps,dy:(b.y-a.y)/eps};
}
function drawSphereManifold(ctx,w,h,sel){
  ctx.clearRect(0,0,w,h);

  // Soft sphere body.
  const C=project3({x:0,y:0,z:0},w,h);
  const R=Math.min(w,h)*.34;
  const grad=ctx.createRadialGradient(C.x-R*.28,C.y-R*.33,R*.08,C.x,C.y,R);
  grad.addColorStop(0,'#244960');
  grad.addColorStop(.6,'#102333');
  grad.addColorStop(1,'#071018');
  ctx.fillStyle=grad;
  ctx.beginPath();ctx.arc(C.x,C.y,R,0,Math.PI*2);ctx.fill();

  // Upper-hemisphere latitude circles and meridians.
  ctx.lineWidth=.75*DPR;
  ctx.strokeStyle='rgba(109,229,255,.22)';
  for(let z=.18;z<=.9;z+=.18){
    const rr=Math.sqrt(1-z*z);
    ctx.beginPath();
    for(let k=0;k<=100;k++){
      const a=2*Math.PI*k/100;
      const p=project3({x:rr*Math.cos(a),y:rr*Math.sin(a),z:z},w,h);
      k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,255,255,.11)';
  for(let m=0;m<10;m++){
    const a=2*Math.PI*m/10;
    ctx.beginPath();
    for(let k=0;k<=70;k++){
      const th=(Math.PI/2)*k/70;
      const p=project3({x:Math.sin(th)*Math.cos(a),y:Math.sin(th)*Math.sin(a),z:Math.cos(th)},w,h);
      k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
    }
    ctx.stroke();
  }

  // Equator / chart boundary.
  ctx.strokeStyle='rgba(109,229,255,.55)';
  ctx.lineWidth=1.1*DPR;
  ctx.beginPath();
  for(let k=0;k<=120;k++){
    const a=2*Math.PI*k/120;
    const p=project3({x:Math.cos(a),y:Math.sin(a),z:0},w,h);
    k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
  }
  ctx.stroke();

  // Selected state and the actual tangent vector fields from Example 1.
  const p3={x:sel.X,y:sel.Y,z:sel.Z};
  const P=project3(p3,w,h);
  ctx.shadowColor='rgba(255,255,255,.6)';
  ctx.shadowBlur=12*DPR;
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(P.x,P.y,4.8*DPR,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // e1=(x3,0,-x1), e2=(0,x3,-x2)
  const e1={x:sel.Z,y:0,z:-sel.X};
  const e2={x:0,y:sel.Z,z:-sel.Y};
  const v1=projectVecAt(p3,e1,w,h), v2=projectVecAt(p3,e2,w,h);
  const gain=.55;
  arrow(ctx,P.x,P.y,v1.dx*gain,v1.dy*gain,'#6de5ff',1,2.35);
  arrow(ctx,P.x,P.y,v2.dx*gain,v2.dy*gain,'#ff6aa9',1,2.35);

  ctx.font=`${11*DPR}px system-ui, sans-serif`;
  ctx.fillStyle='#a5f2ff';ctx.fillText('e₁',P.x+v1.dx*gain*.55+7*DPR,P.y+v1.dy*gain*.55);
  ctx.fillStyle='#ff9bc8';ctx.fillText('e₂',P.x+v2.dx*gain*.55+7*DPR,P.y+v2.dy*gain*.55);

  // Explain the manifold state.
  const bx=12*DPR,by=15*DPR,bw=195*DPR,bh=56*DPR;
  ctx.fillStyle='rgba(5,10,16,.84)';
  ctx.strokeStyle='rgba(255,255,255,.12)';
  ctx.beginPath();ctx.roundRect(bx,by,bw,bh,9*DPR);ctx.fill();ctx.stroke();
  ctx.font=`${10.2*DPR}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillStyle='#dce8f2';
  ctx.fillText(`x = (${sel.X.toFixed(2)}, ${sel.Y.toFixed(2)}, ${sel.Z.toFixed(2)})`,bx+10*DPR,by+20*DPR);
  ctx.fillStyle='#8fa0b1';
  ctx.fillText('x ∈ S²,  x₃ > 0',bx+10*DPR,by+40*DPR);
}

function drawSphere(){
  const sw=fitCanvas(sphere);
  const s3w=fitCanvas(sphere3D);

  const selected=chartPointFromMouse(sw.w,sw.h);
  drawDiskField(sctx,sw.w,sw.h,0,null,selected);
  drawSphereManifold(s3ctx,s3w.w,s3w.h,selected);

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
