const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of [[1920,1080],[1440,900],[1366,768]]) {
    const p = await b.newPage({ viewport:{width:w,height:h} });
    const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
    await p.goto('file://'+process.cwd()+'/demo/index.html');
    await p.waitForTimeout(400);
    let minGap=1e9, maxSpokeErr=0, minPlaneErr=1e9, phases={}, landings=[], shots=0;
    const t0=Date.now(); let lastPhase='';
    while(Date.now()-t0<20000){
      const r = await p.evaluate(()=>{
        const d=__fc.debug();
        const paths=[...document.querySelectorAll('.fc-spoke')].map(el=>({d:el.getAttribute('d'),op:+el.style.opacity||0,disp:el.style.display}));
        return {d,paths};
      });
      const {d,paths}=r; phases[d.phase]=(phases[d.phase]||0)+1;
      // 1. overlap gap between every pair
      for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
        const a=d.cards[i],c=d.cards[j];
        const gx=Math.abs(a.cx-c.cx)-(a.hw+c.hw), gy=Math.abs(a.cy-c.cy)-(a.hh+c.hh);
        minGap=Math.min(minGap, Math.max(gx,gy));
      }
      // 2. spoke endpoints sit exactly GAP away from card boundary
      paths.forEach((pa,i)=>{ if(pa.disp==='none'||!pa.d) return; const n=pa.d.match(/-?\d+\.?\d*/g).map(Number);
        const A=d.cards[d.hub], B=d.cards[i];
        const dist=(pt,c)=>{const dx=Math.max(Math.abs(pt[0]-c.cx)-c.hw,0),dy=Math.max(Math.abs(pt[1]-c.cy)-c.hh,0);return Math.hypot(dx,dy)};
        if(d.phase!=='fly'){ maxSpokeErr=Math.max(maxSpokeErr,Math.abs(dist([n[0],n[1]],A)-14),Math.abs(dist([n[6],n[7]],B)-14)); }
      });
      // 3. plane while resting is outside the hub card edge by PLANE_GAP
      if(d.phase==='rest'){const c=d.cards[d.hub];const dx=Math.max(Math.abs(d.plane.x-c.cx)-c.hw,0),dy=Math.max(Math.abs(d.plane.y-c.cy)-c.hh,0);minPlaneErr=Math.min(minPlaneErr,Math.abs(Math.hypot(dx,dy)-14));}
      if(d.phase!==lastPhase){ if(d.phase==='settle') landings.push(d.hub); lastPhase=d.phase; }
      if(w===1440 && shots<4 && ((d.phase==='fly'&&shots===1)||(d.phase==='rest'&&shots===0&&Date.now()-t0>1500)||(d.phase==='settle'&&shots===2)||(d.phase==='rest'&&shots===3&&Date.now()-t0>9000))){
        await p.screenshot({path:`shot_${shots}.png`}); shots++; }
      await p.waitForTimeout(60);
    }
    console.log(w+'x'+h,{minGapBetweenCards:+minGap.toFixed(1),maxSpokeEndpointErrPx:+maxSpokeErr.toFixed(2),restPlaneGapErr:+minPlaneErr.toFixed(2),phaseSamples:phases,landedOnHubs:landings.join(','),errors:errs});
    await p.close();
  }
  await b.close();
})();
