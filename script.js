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

// HERO — evolving tangent vector field over a rotating sphere.
const hero = document.getElementById('heroCanvas');
const hctx = hero.getContext('2d');
let heroT = 0;

function rot3(p, yaw, pitch){
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const x1=cy*p.x+sy*p.z;
  const z1=-sy*p.x+cy*p.z;
  return {x:x1,y:cp*p.y-sp*z1,z:sp*p.y+cp*z1};
}
function heroProj(p,cx,cy,R,yaw,pitch){
  const q=rot3(p,yaw,pitch);
  return {x:cx+q.x*R,y:cy-q.y*R,z:q.z};
}
function tangentBasis(p){
  // two smooth tangent fields on most of the visible sphere
  const e1={x:-p.y,y:p.x,z:0};
  const n1=Math.hypot(e1.x,e1.y,e1.z)||1;
  e1.x/=n1;e1.y/=n1;e1.z/=n1;
  const e2={
    x:p.y*e1.z-p.z*e1.y,
    y:p.z*e1.x-p.x*e1.z,
    z:p.x*e1.y-p.y*e1.x
  };
  const n2=Math.hypot(e2.x,e2.y,e2.z)||1;
  e2.x/=n2;e2.y/=n2;e2.z/=n2;
  return {e1,e2};
}
function drawHero(){
  const {w,h}=sizeCanvas(hero);
  hctx.clearRect(0,0,w,h);
  heroT += .0075;

  const cx=w*.76, cy=h*.47, R=Math.min(w,h)*.33;
  const yaw=-.9+heroT*.18, pitch=.36+.05*Math.sin(heroT*.4);

  const glow=hctx.createRadialGradient(cx,cy,0,cx,cy,R*1.35);
  glow.addColorStop(0,'rgba(108,168,141,.105)');
  glow.addColorStop(.45,'rgba(179,162,231,.035)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  hctx.fillStyle=glow;hctx.beginPath();hctx.arc(cx,cy,R*1.35,0,Math.PI*2);hctx.fill();

  // sphere silhouette
  const sg=hctx.createRadialGradient(cx-R*.28,cy-R*.30,R*.05,cx,cy,R);
  sg.addColorStop(0,'rgba(36,55,49,.18)');
  sg.addColorStop(.75,'rgba(10,15,15,.48)');
  sg.addColorStop(1,'rgba(7,10,11,.06)');
  hctx.fillStyle=sg;hctx.beginPath();hctx.arc(cx,cy,R,0,Math.PI*2);hctx.fill();
  hctx.strokeStyle='rgba(159,199,181,.18)';hctx.lineWidth=.9*DPR;hctx.stroke();

  // latitude/longitude
  hctx.lineWidth=.55*DPR;
  for(let lat=-3;lat<=3;lat++){
    const th=(lat/4)*(Math.PI/2);
    const z=Math.sin(th), rr=Math.cos(th);
    hctx.strokeStyle='rgba(255,255,255,.032)';
    hctx.beginPath();
    for(let k=0;k<=90;k++){
      const a=2*Math.PI*k/90;
      const P=heroProj({x:rr*Math.cos(a),y:rr*Math.sin(a),z},cx,cy,R,yaw,pitch);
      k?hctx.lineTo(P.x,P.y):hctx.moveTo(P.x,P.y);
    }
    hctx.stroke();
  }
  for(let m=0;m<10;m++){
    const a=2*Math.PI*m/10;
    hctx.strokeStyle='rgba(255,255,255,.026)';
    hctx.beginPath();
    for(let k=0;k<=80;k++){
      const th=-Math.PI/2+Math.PI*k/80;
      const p={x:Math.cos(th)*Math.cos(a),y:Math.cos(th)*Math.sin(a),z:Math.sin(th)};
      const P=heroProj(p,cx,cy,R,yaw,pitch);
      k?hctx.lineTo(P.x,P.y):hctx.moveTo(P.x,P.y);
    }
    hctx.stroke();
  }

  // tangent vector field on visible hemisphere
  for(let lat=-4;lat<=4;lat++){
    const th=(lat/5)*(Math.PI/2*.82);
    for(let m=0;m<16;m++){
      const a=2*Math.PI*m/16 + .18*Math.sin(heroT*.7+lat*.4);
      const p={x:Math.cos(th)*Math.cos(a),y:Math.cos(th)*Math.sin(a),z:Math.sin(th)};
      const P=heroProj(p,cx,cy,R,yaw,pitch);
      if(P.z<-.12) continue;
      const {e1,e2}=tangentBasis(p);
      // evolving combination
      const q=.72*Math.sin(a*2+heroT*1.4)+.32*Math.cos(th*3-heroT*.8);
      const v={x:e1.x+q*e2.x,y:e1.y+q*e2.y,z:e1.z+q*e2.z};
      const eps=.055;
      const Q=heroProj({x:p.x+eps*v.x,y:p.y+eps*v.y,z:p.z+eps*v.z},cx,cy,R,yaw,pitch);
      const col=(m+lat)%2===0?'#9fc7b5':'#b3a2e7';
      arrow(hctx,P.x,P.y,(Q.x-P.x)*1.25,(Q.y-P.y)*1.25,col,.24+.34*Math.max(0,P.z),.75);
    }
  }

  // moving trajectory on the sphere
  const th=.35+.22*Math.sin(heroT*.7), ph=heroT*1.35;
  const p={x:Math.cos(th)*Math.cos(ph),y:Math.cos(th)*Math.sin(ph),z:Math.sin(th)};
  const P=heroProj(p,cx,cy,R,yaw,pitch);
  hctx.shadowColor='#f0efe9';hctx.shadowBlur=12*DPR;hctx.fillStyle='#f0efe9';
  hctx.beginPath();hctx.arc(P.x,P.y,4.2*DPR,0,Math.PI*2);hctx.fill();hctx.shadowBlur=0;

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



// SECTION 01 — payoff gradient projected into an admissible direction.
const mainObjectCanvas=document.getElementById('mainObjectCanvas');
const moc=mainObjectCanvas.getContext('2d');
let mot=0;
function drawMainObject(){
  const {w,h}=sizeCanvas(mainObjectCanvas);moc.clearRect(0,0,w,h);mot+=.012;
  const cx=w*.54,cy=h*.55;
  // curved manifold arc
  moc.strokeStyle='rgba(255,255,255,.10)';moc.lineWidth=1*DPR;
  moc.beginPath();
  for(let k=0;k<=100;k++){
    const u=k/100,x=w*.06+u*w*.88,y=cy+Math.sin((u-.1)*Math.PI*1.35)*h*.19;
    k?moc.lineTo(x,y):moc.moveTo(x,y);
  }moc.stroke();
  const u=.52+.18*Math.sin(mot*.65),x=w*.06+u*w*.88,y=cy+Math.sin((u-.1)*Math.PI*1.35)*h*.19;
  const slope=Math.cos((u-.1)*Math.PI*1.35)*Math.PI*1.35*h*.19/(w*.88);
  const ang=Math.atan(slope);
  // full payoff gradient
  arrow(moc,x,y,42*DPR*Math.cos(ang-.85),42*DPR*Math.sin(ang-.85),'#b3a2e7',.85,1.8);
  // admissible tangent direction
  arrow(moc,x,y,58*DPR*Math.cos(ang),58*DPR*Math.sin(ang),'#9fc7b5',1,2.0);
  moc.fillStyle='#f0efe9';moc.beginPath();moc.arc(x,y,3.8*DPR,0,Math.PI*2);moc.fill();
  requestAnimationFrame(drawMainObject);
}
drawMainObject();

// SECTION 03 — a moving frame whose curvature affects the intrinsic linearization.
const stabilityCanvas=document.getElementById('stabilityCanvas');
const stc=stabilityCanvas.getContext('2d');
let stt=0;
function drawStabilityMini(){
  const {w,h}=sizeCanvas(stabilityCanvas);stc.clearRect(0,0,w,h);stt+=.01;
  const cx=w*.53,cy=h*.52,R=Math.min(w,h)*.28;
  stc.strokeStyle='rgba(255,255,255,.09)';stc.lineWidth=1*DPR;
  stc.beginPath();stc.ellipse(cx,cy,R*1.7,R*.78,-.18,0,Math.PI*2);stc.stroke();
  for(let i=0;i<9;i++){
    const a=2*Math.PI*i/9+stt*.18;
    const x=cx+Math.cos(a)*R*1.5,y=cy+Math.sin(a)*R*.68;
    const frameAng=a+.72*Math.sin(a*2+stt);
    arrow(stc,x,y,25*DPR*Math.cos(frameAng),25*DPR*Math.sin(frameAng),'#9fc7b5',.55,1.15);
    arrow(stc,x,y,20*DPR*Math.cos(frameAng+Math.PI/2),20*DPR*Math.sin(frameAng+Math.PI/2),'#b3a2e7',.45,1.0);
  }
  requestAnimationFrame(drawStabilityMini);
}
drawStabilityMini();

// SECTION 04 intro — nominal vs tilted direction.
const tiltIntroCanvas=document.getElementById('tiltIntroCanvas');
const tic=tiltIntroCanvas.getContext('2d');
let tit=0;
function drawTiltIntro(){
  const {w,h}=sizeCanvas(tiltIntroCanvas);tic.clearRect(0,0,w,h);tit+=.012;
  const x=w*.28,y=h*.58;
  line(tic,w*.06,h*.73,w*.94,h*.73,'rgba(15,20,22,.12)',1);
  arrow(tic,x,y,70*DPR,0,'#426e5d',.9,2);
  arrow(tic,x,y,0,-62*DPR,'#6a5f8e',.75,2);
  const g=.75+.45*Math.sin(tit*.8);
  arrow(tic,w*.64,y,42*g*DPR,-62*DPR,'#a54f3f',.95,2.2);
  tic.fillStyle='rgba(15,20,22,.56)';tic.font=`${9*DPR}px DM Mono, monospace`;
  tic.fillText('nominal e₂',x-8*DPR,h*.20);
  tic.fillText('tilted e₂ + γe₁',w*.60,h*.20);
  requestAnimationFrame(drawTiltIntro);
}
drawTiltIntro();

// RUNNING EXAMPLE A — animated sphere with state-dependent actuation directions.
const sphereExampleCanvas=document.getElementById('sphereExampleCanvas');
const sex=sphereExampleCanvas.getContext('2d');
let exT=0;

function sphereProject(p,cx,cy,R){
  const yaw=-.68,pitch=.38;
  const cyw=Math.cos(yaw),syw=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const X=cyw*p.x+syw*p.z;
  const Z=-syw*p.x+cyw*p.z;
  const Y=cp*p.y-sp*Z;
  return {x:cx+X*R,y:cy-Y*R,z:sp*p.y+cp*Z};
}
function drawSphereExample(){
  const {w,h}=sizeCanvas(sphereExampleCanvas);
  sex.clearRect(0,0,w,h);
  exT+=.012;

  const cx=w*.48,cy=h*.47,R=Math.min(w,h)*.35;

  // sphere
  const grd=sex.createRadialGradient(cx-R*.28,cy-R*.32,R*.05,cx,cy,R);
  grd.addColorStop(0,'rgba(66,105,88,.20)');
  grd.addColorStop(.7,'rgba(13,20,18,.82)');
  grd.addColorStop(1,'rgba(7,10,11,.97)');
  sex.fillStyle=grd;sex.beginPath();sex.arc(cx,cy,R,0,Math.PI*2);sex.fill();

  sex.lineWidth=.65*DPR;
  for(let z=.18;z<=.9;z+=.18){
    const rr=Math.sqrt(1-z*z);
    sex.strokeStyle='rgba(159,199,181,.14)';
    sex.beginPath();
    for(let k=0;k<=90;k++){
      const a=2*Math.PI*k/90;
      const q=sphereProject({x:rr*Math.cos(a),y:rr*Math.sin(a),z},cx,cy,R);
      k?sex.lineTo(q.x,q.y):sex.moveTo(q.x,q.y);
    }
    sex.stroke();
  }
  for(let m=0;m<9;m++){
    const a=2*Math.PI*m/9;
    sex.strokeStyle='rgba(255,255,255,.055)';
    sex.beginPath();
    for(let k=0;k<=55;k++){
      const th=(Math.PI/2)*k/55;
      const q=sphereProject({x:Math.sin(th)*Math.cos(a),y:Math.sin(th)*Math.sin(a),z:Math.cos(th)},cx,cy,R);
      k?sex.lineTo(q.x,q.y):sex.moveTo(q.x,q.y);
    }
    sex.stroke();
  }

  // animated state on upper hemisphere
  const th=.62 + .18*Math.sin(exT*.7);
  const ph=exT;
  const p3={x:Math.sin(th)*Math.cos(ph),y:Math.sin(th)*Math.sin(ph),z:Math.cos(th)};
  const P=sphereProject(p3,cx,cy,R);

  const e1={x:p3.z,y:0,z:-p3.x};
  const e2={x:0,y:p3.z,z:-p3.y};
  const eps=.16;
  const E1=sphereProject({x:p3.x+eps*e1.x,y:p3.y+eps*e1.y,z:p3.z+eps*e1.z},cx,cy,R);
  const E2=sphereProject({x:p3.x+eps*e2.x,y:p3.y+eps*e2.y,z:p3.z+eps*e2.z},cx,cy,R);

  sex.shadowColor='#f0efe9';sex.shadowBlur=9*DPR;sex.fillStyle='#f0efe9';
  sex.beginPath();sex.arc(P.x,P.y,4.2*DPR,0,Math.PI*2);sex.fill();sex.shadowBlur=0;
  arrow(sex,P.x,P.y,(E1.x-P.x)*3.6,(E1.y-P.y)*3.6,'#9fc7b5',1,1.9);
  arrow(sex,P.x,P.y,(E2.x-P.x)*3.6,(E2.y-P.y)*3.6,'#b3a2e7',1,1.9);

  sex.font=`${9*DPR}px DM Mono, monospace`;
  sex.fillStyle='#9fc7b5';sex.fillText('e₁',P.x+(E1.x-P.x)*2.2+5*DPR,P.y+(E1.y-P.y)*2.2);
  sex.fillStyle='#b3a2e7';sex.fillText('e₂',P.x+(E2.x-P.x)*2.2+5*DPR,P.y+(E2.y-P.y)*2.2);

  requestAnimationFrame(drawSphereExample);
}
drawSphereExample();


// RUNNING EXAMPLE B — simplex and exact linear equilibrium displacement.
const simplexExampleCanvas=document.getElementById('simplexExampleCanvas');
const six=simplexExampleCanvas.getContext('2d');
let simplexT=0;

function baryToXY(x1,x2,x3,A,B,C){
  return {
    x:x1*A.x+x2*B.x+x3*C.x,
    y:x1*A.y+x2*B.y+x3*C.y
  };
}
function drawSimplexExample(){
  const {w,h}=sizeCanvas(simplexExampleCanvas);
  six.clearRect(0,0,w,h);
  simplexT+=.012;

  const A={x:w*.16,y:h*.76},B={x:w*.84,y:h*.76},C={x:w*.50,y:h*.16};

  // simplex fill and boundary
  const g=six.createLinearGradient(A.x,A.y,C.x,C.y);
  g.addColorStop(0,'rgba(159,199,181,.025)');
  g.addColorStop(1,'rgba(179,162,231,.06)');
  six.fillStyle=g;
  six.beginPath();six.moveTo(A.x,A.y);six.lineTo(B.x,B.y);six.lineTo(C.x,C.y);six.closePath();six.fill();
  six.strokeStyle='rgba(255,255,255,.20)';six.lineWidth=1*DPR;six.stroke();

  // barycentric grid
  six.strokeStyle='rgba(255,255,255,.045)';six.lineWidth=.6*DPR;
  for(let q=.2;q<1;q+=.2){
    let p1=baryToXY(q,0,1-q,A,B,C),p2=baryToXY(q,1-q,0,A,B,C);
    line(six,p1.x,p1.y,p2.x,p2.y,'rgba(255,255,255,.045)',.6);
    p1=baryToXY(0,q,1-q,A,B,C);p2=baryToXY(1-q,q,0,A,B,C);
    line(six,p1.x,p1.y,p2.x,p2.y,'rgba(255,255,255,.045)',.6);
    p1=baryToXY(0,1-q,q,A,B,C);p2=baryToXY(1-q,0,q,A,B,C);
    line(six,p1.x,p1.y,p2.x,p2.y,'rgba(255,255,255,.045)',.6);
  }

  // Example 7 with alpha=0.25, safely inside admissible range for a visual sweep.
  const alpha=.25, beta=1-3*alpha;
  const gamma=.85*Math.sin(simplexT*.55);

  function Xstar(gam){
    return [
      ((2-3*alpha)+gam*beta)/3,
      ((2-3*alpha)-2*gam*beta)/3,
      ((6*alpha-1)+gam*beta)/3
    ];
  }

  // path over gamma sweep
  six.strokeStyle='rgba(231,119,93,.34)';six.lineWidth=1.5*DPR;six.beginPath();
  for(let k=0;k<=100;k++){
    const gam=-.9+1.8*k/100;
    const x=Xstar(gam),P=baryToXY(x[0],x[1],x[2],A,B,C);
    k?six.lineTo(P.x,P.y):six.moveTo(P.x,P.y);
  }
  six.stroke();

  const x0=Xstar(0),P0=baryToXY(x0[0],x0[1],x0[2],A,B,C);
  const x=Xstar(gamma),P=baryToXY(x[0],x[1],x[2],A,B,C);

  six.fillStyle='#9fc7b5';six.beginPath();six.arc(P0.x,P0.y,3.8*DPR,0,Math.PI*2);six.fill();
  six.shadowColor='#e7775d';six.shadowBlur=10*DPR;six.fillStyle='#e7775d';
  six.beginPath();six.arc(P.x,P.y,5*DPR,0,Math.PI*2);six.fill();six.shadowBlur=0;

  // displacement vector
  arrow(six,P0.x,P0.y,P.x-P0.x,P.y-P0.y,'#e7775d',.85,1.3);

  six.font=`${9*DPR}px DM Mono, monospace`;
  six.fillStyle='rgba(240,239,233,.60)';
  six.fillText('x₁',A.x-2*DPR,A.y+16*DPR);
  six.fillText('x₂',B.x-8*DPR,B.y+16*DPR);
  six.fillText('x₃',C.x-4*DPR,C.y-8*DPR);
  six.fillStyle='#e7775d';
  six.fillText(`γ = ${gamma.toFixed(2)}`,14*DPR,18*DPR);

  requestAnimationFrame(drawSimplexExample);
}
drawSimplexExample();
