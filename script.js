const DPR = Math.min(window.devicePixelRatio || 1, 2);

function sizeCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * DPR));
  const h = Math.max(1, Math.round(r.height * DPR));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h };
}

function line(ctx, x1, y1, x2, y2, color, width=1, alpha=1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * DPR;
  ctx.beginPath();
  ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

function arrow(ctx, x, y, dx, dy, color, alpha=1, width=1.4) {
  const ex=x+dx, ey=y+dy;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=width*DPR;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();
  const a=Math.atan2(dy,dx), s=6*DPR;
  ctx.beginPath();
  ctx.moveTo(ex,ey);
  ctx.lineTo(ex-s*Math.cos(a-.55),ey-s*Math.sin(a-.55));
  ctx.lineTo(ex-s*Math.cos(a+.55),ey-s*Math.sin(a+.55));
  ctx.closePath();ctx.fill();
  ctx.restore();
}

// HERO — two families of state-dependent directions flowing on a curved sheet.
const hero = document.getElementById('heroCanvas');
const hctx = hero.getContext('2d');
let heroT = 0;
const particles = Array.from({length:24},(_,i)=>({
  u:(i*.173)%1,
  row:(i%9)-4,
  speed:.00045 + (i%5)*.000055,
  family:i%2
}));

function sheetPoint(u,v,w,h,t){
  const x=w*(.46+.52*u);
  const mid=h*(.48-.10*Math.sin(Math.PI*u));
  const y=mid + v*h*.055*(.5+.5*Math.sin(Math.PI*u))
        + h*.025*Math.sin(5.3*u+t*.4)
        + h*.012*Math.sin(13*u+v*.7-t*.18);
  return {x,y};
}
function drawHero(){
  const {w,h}=sizeCanvas(hero);
  hctx.clearRect(0,0,w,h);
  heroT += 1;

  const glow=hctx.createRadialGradient(w*.77,h*.42,0,w*.77,h*.42,h*.42);
  glow.addColorStop(0,'rgba(108,168,141,.10)');
  glow.addColorStop(.45,'rgba(179,162,231,.045)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  hctx.fillStyle=glow;hctx.fillRect(0,0,w,h);

  for(let r=-5;r<=5;r++){
    const color=r%2===0?'rgba(159,199,181,.18)':'rgba(179,162,231,.12)';
    hctx.strokeStyle=color;hctx.lineWidth=.7*DPR;
    hctx.beginPath();
    for(let k=0;k<=120;k++){
      const u=k/120,p=sheetPoint(u,r,w,h,heroT*.003);
      k?hctx.lineTo(p.x,p.y):hctx.moveTo(p.x,p.y);
    }
    hctx.stroke();
  }
  for(let c=0;c<=11;c++){
    const u=.04+c*.087;
    hctx.strokeStyle='rgba(255,255,255,.035)';
    hctx.lineWidth=.55*DPR;hctx.beginPath();
    for(let r=-5;r<=5;r++){
      const p=sheetPoint(u,r,w,h,heroT*.003);
      r===-5?hctx.moveTo(p.x,p.y):hctx.lineTo(p.x,p.y);
    }
    hctx.stroke();
  }

  particles.forEach((p,i)=>{
    p.u=(p.u+p.speed)%1;
    const P=sheetPoint(p.u,p.row,w,h,heroT*.003);
    const color=p.family===0?'#9fc7b5':'#b3a2e7';
    hctx.shadowColor=color;hctx.shadowBlur=(i%6===0?12:5)*DPR;
    hctx.fillStyle=color;hctx.globalAlpha=i%6===0?.9:.42;
    hctx.beginPath();hctx.arc(P.x,P.y,(i%6===0?2.6:1.2)*DPR,0,Math.PI*2);hctx.fill();
    hctx.shadowBlur=0;hctx.globalAlpha=1;
  });
  requestAnimationFrame(drawHero);
}
drawHero();

// GEOMETRY — linked upper hemisphere and disk chart.
const geometryCanvas=document.getElementById('geometryCanvas');
const gctx=geometryCanvas.getContext('2d');
let geomPointer={x:.73,y:.52};
geometryCanvas.addEventListener('pointermove',e=>{
  const r=geometryCanvas.getBoundingClientRect();
  geomPointer={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
});
geometryCanvas.addEventListener('pointerdown',e=>{
  const r=geometryCanvas.getBoundingClientRect();
  geomPointer={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
});

function projectSphere(p,cx,cy,R){
  const yaw=-.72,pitch=.43;
  const cyaw=Math.cos(yaw),syaw=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const X=cyaw*p.x+syaw*p.z;
  const Z=-syaw*p.x+cyaw*p.z;
  const Y=cp*p.y-sp*Z;
  return {x:cx+X*R,y:cy-Y*R,z:sp*p.y+cp*Z};
}
function drawSphereGrid(ctx,cx,cy,R){
  const grd=ctx.createRadialGradient(cx-R*.3,cy-R*.32,R*.03,cx,cy,R);
  grd.addColorStop(0,'rgba(80,113,100,.22)');
  grd.addColorStop(.75,'rgba(16,24,22,.7)');
  grd.addColorStop(1,'rgba(8,13,12,.94)');
  ctx.fillStyle=grd;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();

  ctx.lineWidth=.7*DPR;
  for(let z=.15;z<=.9;z+=.15){
    const rr=Math.sqrt(1-z*z);
    ctx.strokeStyle='rgba(159,199,181,.16)';
    ctx.beginPath();
    for(let k=0;k<=100;k++){
      const a=2*Math.PI*k/100;
      const p=projectSphere({x:rr*Math.cos(a),y:rr*Math.sin(a),z},cx,cy,R);
      k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
    }
    ctx.stroke();
  }
  for(let m=0;m<10;m++){
    const a=2*Math.PI*m/10;
    ctx.strokeStyle='rgba(255,255,255,.07)';ctx.beginPath();
    for(let k=0;k<=60;k++){
      const th=Math.PI*.5*k/60;
      const p=projectSphere({x:Math.sin(th)*Math.cos(a),y:Math.sin(th)*Math.sin(a),z:Math.cos(th)},cx,cy,R);
      k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
    }
    ctx.stroke();
  }
}
function drawGeometry(){
  const {w,h}=sizeCanvas(geometryCanvas);
  gctx.clearRect(0,0,w,h);
  const mobile = w/DPR < 720;
  const sphereCx=mobile?w*.5:w*.26, sphereCy=mobile?h*.28:h*.55;
  const sphereR=Math.min(w,h)*(mobile?.20:.27);
  const diskCx=mobile?w*.5:w*.75, diskCy=mobile?h*.72:h*.55;
  const diskR=Math.min(w,h)*(mobile?.20:.25);

  drawSphereGrid(gctx,sphereCx,sphereCy,sphereR);

  // map arrow
  if(!mobile){
    line(gctx,w*.44,h*.52,w*.57,h*.52,'rgba(255,255,255,.22)',1);
    arrow(gctx,w*.55,h*.52,w*.025,0,'#9fc7b5',.9,1.2);
    gctx.fillStyle='#7e8985';gctx.font=`${10*DPR}px DM Mono, monospace`;
    gctx.fillText('φ(x)=(x₁,x₂)',w*.455,h*.48);
  } else {
    line(gctx,w*.5,h*.46,w*.5,h*.55,'rgba(255,255,255,.22)',1);
    arrow(gctx,w*.5,h*.525,0,h*.025,'#9fc7b5',.9,1.2);
  }

  // disk
  const dg=gctx.createRadialGradient(diskCx-diskR*.22,diskCy-diskR*.2,0,diskCx,diskCy,diskR);
  dg.addColorStop(0,'rgba(179,162,231,.09)');
  dg.addColorStop(1,'rgba(9,13,15,.92)');
  gctx.fillStyle=dg;gctx.beginPath();gctx.arc(diskCx,diskCy,diskR,0,Math.PI*2);gctx.fill();
  gctx.strokeStyle='rgba(179,162,231,.38)';gctx.lineWidth=1*DPR;gctx.stroke();

  // chart vector field
  for(let iy=-7;iy<=7;iy++)for(let ix=-7;ix<=7;ix++){
    const X=ix/7,Y=iy/7;
    if(X*X+Y*Y>.88)continue;
    const z=Math.sqrt(1-X*X-Y*Y);
    const x=diskCx+X*diskR,y=diskCy-Y*diskR;
    arrow(gctx,x,y,z*10*DPR,0,'#9fc7b5',.32,.8);
    arrow(gctx,x,y,0,-z*10*DPR,'#b3a2e7',.26,.8);
  }

  // pointer only meaningful relative to disk
  const px=geomPointer.x*w, py=geomPointer.y*h;
  let X=(px-diskCx)/diskR, Y=-(py-diskCy)/diskR;
  let rr=Math.hypot(X,Y);
  if(rr>.94){X*=.94/rr;Y*=.94/rr;}
  const Z=Math.sqrt(Math.max(0,1-X*X-Y*Y));
  const dx=diskCx+X*diskR,dy=diskCy-Y*diskR;
  gctx.shadowColor='#f0efe9';gctx.shadowBlur=10*DPR;gctx.fillStyle='#f0efe9';
  gctx.beginPath();gctx.arc(dx,dy,3.7*DPR,0,Math.PI*2);gctx.fill();gctx.shadowBlur=0;
  arrow(gctx,dx,dy,34*DPR,0,'#9fc7b5',1,1.8);
  arrow(gctx,dx,dy,0,-34*DPR,'#b3a2e7',1,1.8);

  const P=projectSphere({x:X,y:Y,z:Z},sphereCx,sphereCy,sphereR);
  gctx.shadowColor='#f0efe9';gctx.shadowBlur=10*DPR;gctx.fillStyle='#f0efe9';
  gctx.beginPath();gctx.arc(P.x,P.y,4*DPR,0,Math.PI*2);gctx.fill();gctx.shadowBlur=0;

  const e1={x:Z,y:0,z:-X},e2={x:0,y:Z,z:-Y};
  const eps=.16;
  const p1=projectSphere({x:X+eps*e1.x,y:Y+eps*e1.y,z:Z+eps*e1.z},sphereCx,sphereCy,sphereR);
  const p2=projectSphere({x:X+eps*e2.x,y:Y+eps*e2.y,z:Z+eps*e2.z},sphereCx,sphereCy,sphereR);
  arrow(gctx,P.x,P.y,(p1.x-P.x)*4,(p1.y-P.y)*4,'#9fc7b5',1,1.8);
  arrow(gctx,P.x,P.y,(p2.x-P.x)*4,(p2.y-P.y)*4,'#b3a2e7',1,1.8);

  gctx.font=`${10*DPR}px DM Mono, monospace`;
  gctx.fillStyle='rgba(240,239,233,.72)';
  gctx.fillText(`x=(${X.toFixed(2)}, ${Y.toFixed(2)}, ${Z.toFixed(2)})`,18*DPR,h-18*DPR);
  requestAnimationFrame(drawGeometry);
}
drawGeometry();

// DECEPTION — nominal vs tilted direction with sphere equilibrium.
const deceptionCanvas=document.getElementById('deceptionCanvas');
const dctx=deceptionCanvas.getContext('2d');
const gammaSlider=document.getElementById('gammaSlider');
const gammaValue=document.getElementById('gammaValue');

function drawDeception(){
  const {w,h}=sizeCanvas(deceptionCanvas);
  dctx.clearRect(0,0,w,h);
  const gamma=parseFloat(gammaSlider.value);
  gammaValue.value=gamma.toFixed(2);

  const split=w*.5;
  line(dctx,split,40*DPR,split,h-30*DPR,'rgba(15,20,22,.14)',1);

  function panel(cx,tilted){
    const R=Math.min(w*.34,h*.68)*.42;
    const cy=h*.55;
    dctx.strokeStyle='rgba(15,20,22,.28)';dctx.lineWidth=1*DPR;
    dctx.beginPath();dctx.arc(cx,cy,R,0,Math.PI*2);dctx.stroke();
    for(let k=1;k<5;k++){
      dctx.strokeStyle='rgba(15,20,22,.08)';
      dctx.beginPath();dctx.ellipse(cx,cy,R,R*k/5,0,0,Math.PI*2);dctx.stroke();
    }

    const eqY=tilted ? gamma/Math.sqrt(1+gamma*gamma) : 0;
    const eqZ=tilted ? 1/Math.sqrt(1+gamma*gamma) : 1;
    const ex=cx, ey=cy-eqY*R*.9;

    // local frame at an illustrative point
    const bx=cx-R*.28,by=cy+R*.20;
    arrow(dctx,bx,by,R*.32,0,'#426e5d',1,2);
    if(tilted){
      arrow(dctx,bx,by,R*.28*gamma/1.5,-R*.32,'#a54f3f',1,2);
    }else{
      arrow(dctx,bx,by,0,-R*.32,'#6a5f8e',1,2);
    }

    // equilibrium and path
    if(tilted){
      dctx.strokeStyle='rgba(165,79,63,.30)';dctx.lineWidth=1.2*DPR;
      dctx.beginPath();
      for(let s=0;s<=60;s++){
        const g=-1.5+3*s/60;
        const yy=g/Math.sqrt(1+g*g);
        const xx=cx+R*.64*Math.sin(g*.62);
        const y=cy-yy*R*.9;
        s?dctx.lineTo(xx,y):dctx.moveTo(xx,y);
      }
      dctx.stroke();
    }
    dctx.shadowColor=tilted?'#a54f3f':'#426e5d';dctx.shadowBlur=12*DPR;
    dctx.fillStyle=tilted?'#a54f3f':'#426e5d';
    dctx.beginPath();dctx.arc(ex,ey,5*DPR,0,Math.PI*2);dctx.fill();dctx.shadowBlur=0;

    dctx.font=`${10*DPR}px DM Mono, monospace`;
    dctx.fillStyle='rgba(15,20,22,.58)';
    if(tilted) dctx.fillText(`X*(γ): y=${eqY.toFixed(2)}, z=${eqZ.toFixed(2)}`,cx-R*.62,cy+R*.72);
    else dctx.fillText('X*(0) = (0,0,1)',cx-R*.48,cy+R*.72);
  }

  panel(w*.25,false);
  panel(w*.75,true);
  requestAnimationFrame(drawDeception);
}
drawDeception();

// Copy BibTeX
const copyBtn=document.getElementById('copyBib');
copyBtn.addEventListener('click',async()=>{
  const text=document.getElementById('bibtex').innerText;
  try{
    await navigator.clipboard.writeText(text);
    copyBtn.textContent='Copied';
    setTimeout(()=>copyBtn.textContent='Copy',1200);
  }catch{
    copyBtn.textContent='Select text';
    setTimeout(()=>copyBtn.textContent='Copy',1200);
  }
});
