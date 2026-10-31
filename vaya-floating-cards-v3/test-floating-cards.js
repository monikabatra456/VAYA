const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of [[1920,1080],[1440,900],[1366,768]]) {
    const p = await b.newPage({ viewport:{width:w,height:h} });
    const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
    await p.goto('file://'+process.cwd()+'/demo/index.html');
    await p.waitForTimeout(400);
    let minGap=1e9, maxPortErr=0, planeInsideCard=0, maxHop=0, phases={}, landings=[], shots=0, lastPhase='', prevPl=null, stageW=0, stageH=0, ghosts=0, fit=1;
    const t0=Date.now();
    while(Date.now()-t0<24000){
      const r = await p.evaluate(()=>{const d=__fc.debug();const paths=[...document.querySelectorAll('.fc-spoke')].map(el=>el.getAttribute('d'));return {d,paths};});
      const {d,paths}=r; phases[d.phase]=(phases[d.phase]||0)+1; stageW=d.stage.W; stageH=d.stage.H; ghosts=d.ghosts; fit=d.fit;
      for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=d.cards[i],c=d.cards[j];minGap=Math.min(minGap,Math.max(Math.abs(a.cx-c.cx)-(a.hw+c.hw),Math.abs(a.cy-c.cy)-(a.hh+c.hh)));}
      // route endpoints sit exactly on the ports (14px outside the inner edge, middle of the card)
      paths.forEach((pd,i)=>{const n=pd.match(/-?\d+\.?\d*/g).map(Number);const j=(i+1)%6;
        const dx=(pt,c)=>c.col===0? pt[0]-(c.cx+c.hw) : (c.cx-c.hw)-pt[0];
        maxPortErr=Math.max(maxPortErr,Math.abs(dx([n[0],n[1]],d.cards[i])-14),Math.abs(dx([n[6],n[7]],d.cards[j])-14),Math.abs(n[1]-d.cards[i].cy),Math.abs(n[7]-d.cards[j].cy));});
      // plane never over a card face
      const pl=d.plane; d.cards.forEach(c=>{if(Math.abs(pl.x-c.cx)<c.hw-2&&Math.abs(pl.y-c.cy)<c.hh-2)planeInsideCard++;});
      if(prevPl&&d.phase==='fly'){} prevPl=pl;
      if(d.phase!==lastPhase){ if(d.phase==='settle')landings.push(d.hub); lastPhase=d.phase; }
      if(w===1440&&shots<4&&((d.phase==='rest'&&shots===0&&Date.now()-t0>1500)||(d.phase==='fly'&&shots===1&&Date.now()-t0>4000)||(d.phase==='settle'&&shots===2)||(d.phase==='rest'&&shots===3&&Date.now()-t0>12000))){await p.screenshot({path:`shot_${shots}.png`});shots++;}
      await p.waitForTimeout(60);
    }
    // hop length: distance between consecutive ports (what the plane flies each step)
    const hop=await p.evaluate(()=>{const d=__fc.debug();let m=0;for(let i=0;i<6;i++){const a=d.ports[i],c=d.ports[(i+1)%6];m=Math.max(m,Math.hypot(a.x-c.x,a.y-c.y));}return m;});
    console.log(w+'x'+h,{stage:Math.round(stageW)+'x'+Math.round(stageH),fit:+fit.toFixed(2),ghosts,minGapBetweenCards:+minGap.toFixed(1),maxPortErrPx:+maxPortErr.toFixed(2),planeOverCardSamples:planeInsideCard,longestHopPx:Math.round(hop),longestHopVsStageH:+(hop/stageH).toFixed(2),landedOnHubs:landings.join(','),errors:errs});
    await p.close();
  }
  await b.close();
})();
