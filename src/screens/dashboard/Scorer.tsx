import { useState, useEffect } from "react";
import { F } from "../../config/firebase.ts";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoPlay, IcoEye, IcoBall, IcoCal } from "../../components/Icons.tsx";
import { TeamLogo, Scoreboard, Empty, Modal } from "../../components/UI.tsx";

// ── 🧠 LÓGICA DE BASES INTELIGENTES (CON JUGADORES) ──
function advanceBases(bases: any[], hitType: string, batter: any): { newBases: any[], runnersScored: any[] } {
  const b = [...bases]; let scored: any[] = [];
  if (hitType === "HR") { scored = [b[0], b[1], b[2], batter].filter(x=>x); return { newBases: [null,null,null], runnersScored: scored }; }
  if (hitType === "3B") { scored = [b[0], b[1], b[2]].filter(x=>x); return { newBases: [null,null,batter], runnersScored: scored }; }
  if (hitType === "2B") { scored = [b[1], b[2]].filter(x=>x); return { newBases: [null,batter,b[0]], runnersScored: scored }; }
  scored = [b[2]].filter(x=>x); return { newBases: [batter,b[0],b[1]], runnersScored: scored };
}
function walkBases(bases: any[], batter: any): { newBases: any[], runnersScored: any[] } {
  const nb = [...bases]; let scored: any[] = [];
  if (nb[0]) { if (nb[1]) { if (nb[2]) scored.push(nb[2]); nb[2] = nb[1]; } nb[1] = nb[0]; } nb[0] = batter;
  return { newBases: nb, runnersScored: scored };
}
function advanceAllRunners(bases: any[]): { newBases: any[], runnersScored: any[] } {
  const nb = [...bases]; let scored: any[] = [];
  if (nb[2]) { scored.push(nb[2]); nb[2] = null; } if (nb[1]) { nb[2] = nb[1]; nb[1] = null; } if (nb[0]) { nb[1] = nb[0]; nb[0] = null; }
  return { newBases: nb, runnersScored: scored };
}
const FIELD_POS = ["P(1)","C(2)","1B(3)","2B(4)","3B(5)","SS(6)","LF(7)","CF(8)","RF(9)"];

export function ScorerPage({ data, nav }: any) {
  const scheduled = data.games.filter((g:any) => g.status === "scheduled").sort((a:any,b:any) => (a.date||"").localeCompare(b.date||""));
  const live = data.games.filter((g:any) => g.status === "live");
  const ft = (id:string) => data.teams.find((t:any) => t.id === id);
  return (
    <div style={S.sec}><h2 style={S.secT}>⚾ Anotador</h2>
      {live.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={{ fontWeight: 700, fontSize: 13, color: K.live, marginBottom: 10 }}>● En Curso</h3>
        {live.map((g:any) => { const aw = ft(g.awayTeamId), hm = ft(g.homeTeamId); return (
          <div key={g.id} style={{ ...S.card, padding: 14, marginBottom: 8, borderLeft: `3px solid ${K.live}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{aw?.name} {g.awayScore}-{g.homeScore} {hm?.name}</div><span style={{ fontSize: 11, color: K.muted }}>Ent {g.inning} {g.half === "top" ? "▲" : "▼"}</span></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => nav("scorer","live",g.id)} style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: 11 }}>Anotar</button>
              <button onClick={() => nav("scorer","watch",g.id)} style={{ ...S.btn("ghost"), padding: "6px 12px", fontSize: 11 }}><IcoEye size={14}/></button></div></div>); })}</div>}
      <h3 style={{ fontWeight: 700, fontSize: 13, color: K.blue, marginBottom: 10 }}>📋 Programados</h3>
      {scheduled.length > 0 ? scheduled.map((g:any) => { const aw = ft(g.awayTeamId), hm = ft(g.homeTeamId); return (
        <div key={g.id} style={{ ...S.card, padding: 14, marginBottom: 8, border: `1px solid ${K.blue}33` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6 }}><span style={S.badge(K.blue)}>{g.date}</span>{g.time && <span style={S.badge(K.accent)}>{g.time}</span>}</div>
            <button onClick={() => nav("scorer","live",g.id)} style={{ ...S.btn("primary"), padding: "6px 14px", fontSize: 11 }}><span style={{ display: "flex", alignItems: "center", gap: 4 }}><IcoPlay size={12}/>Iniciar</span></button></div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: 1 }}><TeamLogo team={aw} size={36}/><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{aw?.name}</div></div>
            <span style={{ fontWeight: 900, color: K.muted }}>VS</span>
            <div style={{ textAlign: "center", flex: 1 }}><TeamLogo team={hm} size={36}/><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{hm?.name}</div></div></div></div>); })
      : <Empty icon={IcoCal} text="No hay juegos programados." action={() => nav("calendar")} actionLabel="Ir a Calendario"/>}
    </div>);
}

export function LiveGame({ data, id, nav }: any) {
  const [game,setGame] = useState<any>(null);
  const [showComplex,setShowComplex] = useState(false);
  const [showPitcher,setShowPitcher] = useState(false);
  const [showTraditional,setShowTraditional] = useState(false);
  const [showSub,setShowSub] = useState<{side:"away"|"home",idx:number}|null>(null);
  const [showConfirm,setShowConfirm] = useState<any>(null);
  const [showError,setShowError] = useState(false);
  const [showRunnerAction,setShowRunnerAction] = useState<{type:"SB"|"CS"}|null>(null);
  
  const [awSP, setAwSP] = useState<any>(null);
  const [hmSP, setHmSP] = useState<any>(null);
  const [showAssignRun, setShowAssignRun] = useState(false);
  const [addTeamRun, setAddTeamRun] = useState(false);

  useEffect(() => { 
    const u = F.onDoc("games", id!, (docData: any) => {
      setGame(docData);
      if (docData && docData.status === "scheduled") {
        setAwSP((prev: any) => prev || docData.awayStartingPitcher || null);
        setHmSP((prev: any) => prev || docData.homeStartingPitcher || null);
      }
    }); 
    return () => u && u(); 
  }, [id]);

  if (!game) return <div style={{...S.sec,textAlign:"center",padding:40}}><IcoBall size={40} color={K.accent} style={{animation:"spin 1.5s linear infinite",margin:"0 auto"}}/></div>;

  const aw = data.teams.find((t:any) => t.id === game.awayTeamId);
  const hm = data.teams.find((t:any) => t.id === game.homeTeamId);
  const isTop = game.half === "top";
  const batTm = isTop ? aw : hm;
  const pitchTm = isTop ? hm : aw;
  const batLineup = isTop ? (game.awayLineup||[]) : (game.homeLineup||[]);
  const pitchLineup = isTop ? (game.homeLineup||[]) : (game.awayLineup||[]);
  const pitcher = game.currentPitcher || null;
  const count = game.count || { balls: 0, strikes: 0 };
  const plays = game.plays || [];
  const up = async (u:any) => await F.set("games",id!,u);
  const noPitcher = !pitcher;

  const awBatIdx = game.awayBatterIdx || 0;
  const hmBatIdx = game.homeBatterIdx || 0;
  const batIdx = isTop ? awBatIdx : hmBatIdx;
  const batIdxKey = isTop ? "awayBatterIdx" : "homeBatterIdx";
  const currentBatter = batLineup[batIdx % batLineup.length] || null;
  const batterObj = currentBatter ? {id: currentBatter.id, name: currentBatter.name} : {id:"ghost", name:"Bateador"};
  const pitcherPitchCount = pitcher ? plays.filter((p:any) => p.pitcherId === pitcher.id && p.isPitch).length : 0;

  const rawBases = game.bases || [null, null, null];
  const bases = rawBases.map((b: any) => b === true ? {id: "ghost", name: "Corredor"} : (b === false ? null : b));

  const getStats = (pid:string) => {
    let vb=0,h=0,hr=0,ci=0,ca=0,bb=0,k=0,db=0,tb=0,sb=0,pa=0,e=0;
    plays.forEach((p:any) => { 
      if (p.errorPlayerId === pid) e++; 
      if (p.playerId !== pid) return; 
      if (p.result !== "RUN" && p.result !== "SB" && p.result !== "CS") pa++; 
      if (["1B","2B","3B","HR"].includes(p.result)) { vb++; h++; if(p.result==="2B")db++; if(p.result==="3B")tb++; if(p.result==="HR")hr++; }
      else if (["BB","HBP"].includes(p.result)) bb++;
      else if (p.result === "SAC") {}
      else if (["OUT","FLY","GROUND","K","DP"].includes(p.result)) { vb++; if(p.result==="K")k++; }
      else if (p.result === "E") vb++;
      ci += (p.ci||0); ca += (p.ca||0); if(p.result==="SB")sb++;
    });
    return { vb,h,hr,ci,ca,bb,k,db,tb,sb,pa,e, avg: vb>0?(h/vb).toFixed(3):".000", summary: `${h}-${vb}${hr>0?`, ${hr}HR`:""}${ci>0?`, ${ci}CI`:""}` };
  };

  const getPitStats = (pid:string) => {
    let h=0,bb=0,k=0,cl=0,outs=0,pitches=0;
    plays.forEach((p:any) => { if(p.pitcherId!==pid) return; if(p.isPitch) pitches++; if(!p.result) return;
      if(["1B","2B","3B","HR","E"].includes(p.result)) h++;
      if(["BB","HBP"].includes(p.result)) bb++;
      if(p.result==="K") k++;
      if(["OUT","FLY","GROUND","K","SAC"].includes(p.result)) outs++;
      if(p.result==="DP") outs+=2;
      if(p.isEarned!==false) cl+=(p.ci||0);
    });
    return { h,bb,K:k,cl,outs,pitches, ip:(Math.floor(outs/3)+(outs%3)/10).toFixed(1) };
  };

  const getDefName = (pos: string) => {
    const p = pitchLineup.find((x:any) => x.fieldPos === pos);
    if (!p) return "";
    const n = p.name.split(" ");
    return n.length > 1 ? `${n[0].charAt(0)}. ${n[n.length-1]}` : n[0]; 
  };

  // ── LINEUP SETUP ──
  if (game.status === "scheduled") {
    const awP = data.players.filter((p:any) => p.teamId === game.awayTeamId);
    const hmP = data.players.filter((p:any) => p.teamId === game.homeTeamId);

    const toggle = async (pid:string, side:"away"|"home") => {
      const key = side==="away"?"awayLineup":"homeLineup"; const cur = game[key]||[];
      const pl = data.players.find((p:any) => p.id===pid); if(!pl) return;
      const entry = { id:pid, name:pl.name, number:pl.number, position:pl.position, fieldPos:"" };
      const ex = cur.find((p:any) => p.id===pid);
      if(ex) await up({[key]:cur.filter((p:any)=>p.id!==pid)});
      else await up({[key]:[...cur,entry]});
    };

    const awLU = game.awayLineup||[]; const hmLU = game.homeLineup||[];
    const awAllPos = awLU.length>0 && awLU.every((p:any)=>p.fieldPos);
    const hmAllPos = hmLU.length>0 && hmLU.every((p:any)=>p.fieldPos);
    const canStart = awLU.length>0 && hmLU.length>0 && awSP && hmSP && awAllPos && hmAllPos;

    return (
      <div style={S.sec}><h2 style={S.secT}>Preparar Juego</h2>
        <div style={{...S.card,padding:16,marginBottom:16,background:`linear-gradient(135deg,${K.accentDk},${K.card})`}}>
          <div style={{display:"flex",justifyContent:"center",gap:20,alignItems:"center"}}>
            <div style={{textAlign:"center"}}><TeamLogo team={aw} size={44}/><div style={{fontSize:11,fontWeight:700,color:K.text,marginTop:4}}>{aw?.name}</div></div>
            <span style={{fontWeight:900,fontSize:18,color:K.muted}}>VS</span>
            <div style={{textAlign:"center"}}><TeamLogo team={hm} size={44}/><div style={{fontSize:11,fontWeight:700,color:K.text,marginTop:4}}>{hm?.name}</div></div></div></div>

        {[{label:"Visitante",team:aw,players:awP,lineup:awLU,side:"away" as const,sp:awSP,setSP:setAwSP},
          {label:"Local",team:hm,players:hmP,lineup:hmLU,side:"home" as const,sp:hmSP,setSP:setHmSP}].map(({label,team,players,lineup,side,sp,setSP})=>(
          <div key={side} style={{...S.card,marginBottom:12,overflow:"hidden"}}>
            <div style={{background:team?.color||K.accent,padding:"8px 14px",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:900,fontSize:12,color:"#fff"}}>{label}: {team?.name}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700}}>{lineup.length}</span></div>
            <div style={{padding:10}}>
              {players.map((p:any) => { const inL = lineup.find((l:any)=>l.id===p.id); return (
                <div key={p.id} style={{display:"flex",alignItems:"center",padding:"8px 6px",borderBottom:`1px solid ${K.border}`,background:inL?`${K.accent}11`:"transparent",borderRadius:8,marginBottom:2}}>
                  <div onClick={()=>toggle(p.id,side)} style={{width:20,height:20,borderRadius:6,border:`2px solid ${inL?K.accent:K.border}`,background:inL?K.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginRight:10,fontSize:12,color:"#fff",fontWeight:900,cursor:"pointer",flexShrink:0}}>{inL?"✓":""}</div>
                  <span style={{fontWeight:800,fontSize:13,color:K.muted,width:28}}>#{p.number||"—"}</span>
                  <span style={{fontWeight:700,fontSize:13,flex:1}}>{p.name}</span>
                  {inL ? <select value={inL.fieldPos||""} onClick={(e:any)=>e.stopPropagation()} onChange={async(e:any)=>{
                    const key=side==="away"?"awayLineup":"homeLineup";const lu=[...(game[key]||[])];
                    const idx=lu.findIndex((l:any)=>l.id===p.id);if(idx>=0){lu[idx]={...lu[idx],fieldPos:e.target.value};await up({[key]:lu});}
                  }} style={{...S.select,padding:"4px 6px",fontSize:10,width:64,flexShrink:0}}>
                    <option value="">Pos</option>{FIELD_POS.map(fp=><option key={fp} value={fp}>{fp}</option>)}
                  </select> : <span style={{fontSize:10,color:K.muted}}>{p.position}</span>}
                </div>); })}
            </div>
            <div style={{padding:"8px 10px",borderTop:`2px solid ${K.blue}33`,background:K.input}}>
              <div style={{fontSize:10,fontWeight:900,color:K.blue,marginBottom:6}}>⚾ PITCHER ABRIDOR</div>
              {sp ? <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontWeight:800,fontSize:13}}>#{sp.number} {sp.name}</span>
                <button onClick={()=>setSP(null)} style={{background:"none",border:"none",color:K.red,fontSize:10,cursor:"pointer",fontWeight:700}}>Cambiar</button></div>
              : <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:100,overflow:"auto"}}>
                {lineup.map((p:any) => (
                  <button key={p.id} onClick={()=>setSP(p)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:8,border:`1px solid ${K.border}`,background:K.card,cursor:"pointer",textAlign:"left",fontSize:11}}>
                    <span style={{fontWeight:800,color:K.muted}}>#{p.number}</span>
                    <span style={{fontWeight:700,flex:1}}>{p.name}</span></button>))}
                {lineup.length===0&&<span style={{fontSize:10,color:K.red}}>Agrega jugadores primero</span>}
              </div>}
            </div>
          </div>))}

        {!canStart&&<div style={{padding:"10px 14px",borderRadius:12,background:`${K.red}15`,border:`1px solid ${K.red}33`,marginBottom:12,textAlign:"center"}}>
          <span style={{fontSize:11,fontWeight:700,color:K.red}}>⚠️ Lineup completo + posiciones de campo (1-9) + pitcher abridor para ambos equipos</span></div>}

        <button onClick={async()=>{if(!canStart)return;
          await up({status:"live",count:{balls:0,strikes:0},awayBatterIdx:0,homeBatterIdx:0,
            currentPitcher:{id:hmSP.id,name:hmSP.name,number:hmSP.number},
            awayStartingPitcher:awSP,homeStartingPitcher:hmSP, bases:[null,null,null]});
        }} style={{...S.btn(canStart?"primary":"ghost"),width:"100%",padding:16,fontSize:15,opacity:canStart?1:0.5}} disabled={!canStart}>
          <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><IcoPlay size={18}/>INICIAR JUEGO</span></button>
      </div>);
  }

  // ══════════════════════════════════════
  // LIVE LOGIC
  // ══════════════════════════════════════
  const resetCount = () => ({balls:0,strikes:0});
  const nextBatter = () => batLineup.length===0 ? batIdx : (batIdx+1)%batLineup.length;
  const scoreRuns = (runs:number) => { if(runs<=0) return {}; const k=isTop?"awayScore":"homeScore"; const ik=isTop?"awayInnings":"homeInnings"; const ni=[...(game[ik]||[])]; ni[game.inning-1]=(ni[game.inning-1]||0)+runs; return {[k]:(game[k]||0)+runs,[ik]:ni}; };

  const changeHalf = (u:any) => {
    u.outs=0; u.bases=[null,null,null]; u.count=resetCount();
    if(isTop) { u.half="bottom"; const ai=[...(game.awayInnings||[])]; if(ai[game.inning-1]===null)ai[game.inning-1]=0; u.awayInnings=ai;
      const asp=game.awayStartingPitcher; if(asp) u.currentPitcher={id:asp.id,name:asp.name,number:asp.number};
    } else { const hi=[...(game.homeInnings||[])]; if(hi[game.inning-1]===null)hi[game.inning-1]=0; u.homeInnings=hi; u.inning=game.inning+1; u.half="top";
      const hsp=game.homeStartingPitcher; if(hsp) u.currentPitcher={id:hsp.id,name:hsp.name,number:hsp.number};
    }
  };

  const isGameOver = (newPlays:any[]) => !isTop && game.inning+1>(game.totalInnings||9) && game.awayScore!==game.homeScore;

  const makePlay = (result:string, extra:any={}) => ({
    playerId:currentBatter?.id, playerName:currentBatter?.name||"?",
    teamId:isTop?game.awayTeamId:game.homeTeamId, team:isTop?"away":"home", result,
    ci:0, ca:0, isEarned:true,
    pitcherId:pitcher?.id||null, pitcherName:pitcher?.name||null,
    isPitch:true, inning:game.inning, half:game.half, timestamp:Date.now(), ...extra,
  });

  const prepareHit = (type:string) => {
    if(noPitcher){setShowPitcher(true);return;}
    const{newBases,runnersScored}=advanceBases(bases, type, batterObj);
    setShowConfirm({type,suggestedRuns:runnersScored.length,runs:runnersScored.length,newBases,runnersScored,ca:type==="HR"?1:0});
  };
  
  const confirmHit = async () => {
    if(!showConfirm) return; const{type,runs,newBases,runnersScored}=showConfirm;
    const play=makePlay(type,{ci:runs,ca:type==="HR"?1:0, ...(showConfirm.extra||{})});
    
    const runPlays = (runnersScored || [])
      .filter((r:any) => r.id !== currentBatter?.id) 
      .slice(0, runs)
      .map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));

    await up({plays:[...plays, play, ...runPlays],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runs)});
    setShowConfirm(null);
  };

  const addBall = async () => {
    if(noPitcher){setShowPitcher(true);return;}
    const b=(count.balls||0)+1;
    if(b>=4){ 
      const{newBases,runnersScored}=walkBases(bases, batterObj);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      await up({plays:[...plays,makePlay("BB",{ci:runnersScored.length}), ...runPlays],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runnersScored.length)});
    } else await up({plays:[...plays,{pitcherId:pitcher?.id,pitcherName:pitcher?.name,isPitch:true,timestamp:Date.now(),inning:game.inning,half:game.half}],count:{...count,balls:b}});
  };

  const addStrike = async (type:"called"|"swinging"|"foul") => {
    if(noPitcher){setShowPitcher(true);return;}
    const s=(count.strikes||0)+1;
    const pp={pitcherId:pitcher?.id,pitcherName:pitcher?.name,isPitch:true,pitchType:type,timestamp:Date.now(),inning:game.inning,half:game.half};
    if(type==="foul"&&s>=3){await up({plays:[...plays,pp]});return;}
    if(s>=3){ const play=makePlay("K"); const np=[...plays,play]; const u:any={plays:np,count:resetCount(),[batIdxKey]:nextBatter()};
      const o=(game.outs||0)+1; if(o>=3){changeHalf(u);if(isGameOver(np)){await finishGame(np);return;}} else u.outs=o; await up(u);
    } else await up({plays:[...plays,pp],count:{...count,strikes:s}});
  };

  const registerOut = async (type:string) => {
    if(noPitcher){setShowPitcher(true);return;}
    const numOuts=type==="DP"?2:1; let nb=[...bases];
    if(type==="DP"){if(nb[0])nb[0]=null;else if(nb[1])nb[1]=null;else if(nb[2])nb[2]=null;}
    const play=makePlay(type); const np=[...plays,play]; const u:any={plays:np,count:resetCount(),[batIdxKey]:nextBatter(),bases:nb};
    const o=(game.outs||0)+numOuts; if(o>=3){changeHalf(u);if(isGameOver(np)){await finishGame(np);return;}} else u.outs=o; await up(u);
  };

  const registerError = async (pos:string) => {
    const{newBases,runnersScored}=advanceBases(bases,"E", batterObj); setShowError(false);
    const defPlayer = pitchLineup.find((p:any) => p.fieldPos === pos); 
    setShowConfirm({type:"E",suggestedRuns:runnersScored.length,runs:runnersScored.length,newBases,runnersScored,ca:0,extra:{errorPosition:pos, errorPlayerId:defPlayer?.id, errorPlayerName:defPlayer?.name, isEarned:false}});
  };

  const executeRunnerAction = async (type:"SB"|"CS", baseIdx:number, runner:any) => {
    const nb=[...bases]; nb[baseIdx]=null;
    if(type==="SB"){ 
      let runs=0; let scored = []; 
      if(baseIdx===2){ runs=1; scored.push(runner); } else { nb[baseIdx+1]=runner; }
      
      const runPlays = scored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      await up({plays:[...plays,{...makePlay("SB",{ci:0,isPitch:false}),playerId:runner.id,playerName:runner.name}, ...runPlays],bases:nb,...(runs>0?scoreRuns(runs):{})});
    } else { 
      const play={...makePlay("CS",{isPitch:false}),playerId:runner.id,playerName:runner.name};
      const np=[...plays,play]; const u:any={plays:np,bases:nb}; const o=(game.outs||0)+1;
      if(o>=3){changeHalf(u);if(isGameOver(np)){await finishGame(np);return;}} else u.outs=o; await up(u);
    }
    setShowRunnerAction(null); setShowComplex(false);
  };

  const registerComplex = async (type:string) => {
    if(noPitcher&&type!=="SB"&&type!=="CS"){setShowPitcher(true);return;}
    if(type==="HBP"){ const{newBases,runnersScored}=walkBases(bases, batterObj);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      await up({plays:[...plays,makePlay("HBP",{ci:runnersScored.length}), ...runPlays],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runnersScored.length)});
    } else if(type==="SAC"){ const{newBases,runnersScored}=advanceAllRunners(bases);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      const np=[...plays,makePlay("SAC",{ci:runnersScored.length,isSacrifice:true}), ...runPlays]; const u:any={plays:np,bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runnersScored.length)};
      const o=(game.outs||0)+1; if(o>=3)changeHalf(u); else u.outs=o; await up(u);
    } else if(type==="SB"||type==="CS"){ 
      const rOn=bases.map((b:any,i:number)=>({idx:i,runner:b})).filter((r:any)=>r.runner !== null);
      if(rOn.length===0){setShowComplex(false);return;}
      if(rOn.length===1) executeRunnerAction(type,rOn[0].idx, rOn[0].runner);
      else setShowRunnerAction({type});
    } else if(type==="WP" || type==="PB" || type==="BALK"){ const{newBases,runnersScored}=advanceAllRunners(bases);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      const isEarned = type !== "PB";
      await up({plays:[...plays,{...makePlay(type,{ci:0,isEarned,isPitch:false}),playerId:null,playerName:type==="PB"?"Receptor":pitcher?.name||"Pitcher"}, ...runPlays],bases:newBases,...scoreRuns(runnersScored.length)});
    } else if(type==="DP"){ await registerOut("DP"); }
    setShowComplex(false);
  };

  const doSub = async (side:"away"|"home",idx:number,np:any) => {
    const key=side==="away"?"awayLineup":"homeLineup"; const lu=[...(game[key]||[])];
    lu[idx]={id:np.id,name:np.name,number:np.number,position:np.position,fieldPos:lu[idx]?.fieldPos||""};
    await up({[key]:lu}); setShowSub(null);
  };
  const getAvailSubs = (side:"away"|"home") => {
    const tid=side==="away"?game.awayTeamId:game.homeTeamId; const lu=side==="away"?(game.awayLineup||[]):(game.homeLineup||[]);
    const ids=new Set(lu.map((p:any)=>p.id)); return data.players.filter((p:any)=>p.teamId===tid&&!ids.has(p.id));
  };

  const undoLastPlay = async () => {
    if(plays.length===0)return; if(!confirm("¿Deshacer?"))return;
    const rm=plays[plays.length-1]; const np=plays.slice(0,-1); const u:any={plays:np};
    if(rm.result&&rm.playerId){ const runs=(rm.ci||0)+(rm.ca||0);
      if(runs>0){const k=rm.team==="away"?"awayScore":"homeScore";const ik=rm.team==="away"?"awayInnings":"homeInnings";
        u[k]=Math.max(0,(game[k]||0)-runs);const ni=[...(game[ik]||[])];ni[rm.inning-1]=Math.max(0,(ni[rm.inning-1]||0)-runs);u[ik]=ni;}
      const bk=rm.team==="away"?"awayBatterIdx":"homeBatterIdx";const ln=rm.team==="away"?(game.awayLineup||[]):(game.homeLineup||[]);
      u[bk]=(game[bk]||0)>0?(game[bk]||0)-1:ln.length-1;
    } await up(u);
  };

  const finishGame = async (gp:any[]) => {
    await up({status:"final"});
    if(aw){const u=game.awayScore>game.homeScore?{wins:(aw.wins||0)+1}:game.awayScore<game.homeScore?{losses:(aw.losses||0)+1}:{draws:(aw.draws||0)+1};await F.set("teams",aw.id,u);}
    if(hm){const u=game.homeScore>game.awayScore?{wins:(hm.wins||0)+1}:game.homeScore<game.awayScore?{losses:(hm.losses||0)+1}:{draws:(hm.draws||0)+1};await F.set("teams",hm.id,u);}
    
    const ba:Record<string,any>={};
    gp.forEach((p:any)=>{
      if (p.result === "E" && p.errorPlayerId) {
        if(!ba[p.errorPlayerId]) ba[p.errorPlayerId]={VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0,E:0};
        ba[p.errorPlayerId].E = (ba[p.errorPlayerId].E||0) + 1; 
      }

      if(!p.playerId)return;
      if(!ba[p.playerId])ba[p.playerId]={VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0,E:0};
      const s=ba[p.playerId];
      if(["1B","2B","3B","HR"].includes(p.result)){s.VB++;s.H++;if(p.result==="2B")s["2B"]++;if(p.result==="3B")s["3B"]++;if(p.result==="HR")s.HR++;}
      else if(["BB","HBP"].includes(p.result))s.BB++; 
      else if(p.result==="SAC"){} 
      else if(["OUT","FLY","GROUND","K","DP","E"].includes(p.result)){s.VB++;if(p.result==="K")s.K++;}
      else if(p.result==="RUN"){} 
      
      s.CI+=(p.ci||0);s.CA+=(p.ca||0);if(p.result==="SB")s.BR++;
    });

    for(const[pid,gs]of Object.entries(ba)as any){const pl=data.players.find((p:any)=>p.id===pid);if(!pl)continue;
      const b=pl.batting||{JJ:0,VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0,E:0};
      await F.set("players",pid,{batting:{JJ:(b.JJ||0)+1,VB:(b.VB||0)+gs.VB,H:(b.H||0)+gs.H,"2B":(b["2B"]||0)+gs["2B"],"3B":(b["3B"]||0)+gs["3B"],HR:(b.HR||0)+gs.HR,CI:(b.CI||0)+gs.CI,CA:(b.CA||0)+gs.CA,BB:(b.BB||0)+gs.BB,K:(b.K||0)+gs.K,BR:(b.BR||0)+gs.BR,E:(b.E||0)+(gs.E||0)}});
    }

    const pa:Record<string,any>={};
    gp.forEach((p:any)=>{if(!p.pitcherId||!p.result)return;if(!pa[p.pitcherId])pa[p.pitcherId]={H:0,BB:0,K:0,CL:0,outs:0,ts:""};const s=pa[p.pitcherId];
      if(["1B","2B","3B","HR","E"].includes(p.result))s.H++;if(["BB","HBP"].includes(p.result))s.BB++;if(p.result==="K")s.K++;
      if(["OUT","FLY","GROUND","K","SAC"].includes(p.result))s.outs++;if(p.result==="DP")s.outs+=2;if(p.isEarned!==false)s.CL+=(p.ci||0);
      if(!s.ts){s.ts=(game.homeLineup||[]).find((x:any)=>x.id===p.pitcherId)?"home":"away";}});
    const ws=game.awayScore>game.homeScore?"away":game.homeScore>game.awayScore?"home":null;
    const wps=ws?Object.entries(pa).filter(([_,v]:any)=>v.ts===ws).sort((a:any,b:any)=>b[1].outs-a[1].outs):[];
    const lps=ws?Object.entries(pa).filter(([_,v]:any)=>v.ts!==ws).sort((a:any,b:any)=>b[1].outs-a[1].outs):[];
    const wpId=wps[0]?.[0]||null;const lpId=lps[0]?.[0]||null;
    for(const[pid,gs]of Object.entries(pa)as any){const pl=data.players.find((p:any)=>p.id===pid);if(!pl)continue;
      const pt=pl.pitching||{JJ:0,IL:0,H:0,CL:0,BB:0,K:0,G:0,P:0,JC:0};const il=Math.floor(gs.outs/3)+(gs.outs%3)/10;
      const tto=Object.entries(pa).filter(([_,v]:any)=>v.ts===gs.ts).reduce((s:number,[_,v]:any)=>s+v.outs,0);
      const isJC=gs.outs===tto&&gs.outs>=(game.totalInnings||9)*3/2;
      await F.set("players",pid,{pitching:{JJ:(pt.JJ||0)+1,IL:parseFloat(((pt.IL||0)+il).toFixed(1)),H:(pt.H||0)+gs.H,CL:(pt.CL||0)+gs.CL,BB:(pt.BB||0)+gs.BB,K:(pt.K||0)+gs.K,G:(pt.G||0)+(pid===wpId?1:0),P:(pt.P||0)+(pid===lpId?1:0),JC:(pt.JC||0)+(isJC?1:0)}});}
    nav("home");
  };

  const rp=[...plays].filter((p:any)=>p.result).reverse().slice(0,6);
  const awH=plays.filter((p:any)=>p.team==="away"&&["1B","2B","3B","HR"].includes(p.result)).length;
  const hmH=plays.filter((p:any)=>p.team==="home"&&["1B","2B","3B","HR"].includes(p.result)).length;
  const awE=plays.filter((p:any)=>p.result==="E"&&p.team==="away").length;
  const hmE=plays.filter((p:any)=>p.result==="E"&&p.team==="home").length;

  const Btn=({label,icon,color,bg,onClick,size="md",disabled=false}:any)=>(
    <button onClick={onClick} disabled={disabled} style={{padding:size==="lg"?"8px 4px":"6px 4px",borderRadius:10,border:`2px solid ${color}44`,background:bg||`${color}15`,color:disabled?K.muted:color,fontWeight:900,fontSize:size==="lg"?12:10,cursor:disabled?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,width:"100%",minHeight:size==="lg"?46:36,opacity:disabled?.4:1}}>
      <span style={{fontSize:size==="lg"?16:14}}>{icon}</span><span>{label}</span></button>);
      
  return (
    <div style={{background:K.bg,color:K.text,fontFamily:"'Outfit',system-ui,sans-serif",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`.sg{display:grid;grid-template-columns:200px 1fr 240px;grid-template-rows:auto 1fr auto;height:100vh;gap:0}@media(max-width:800px){.sg{grid-template-columns:1fr;grid-template-rows:auto auto auto auto auto}}.sx::-webkit-scrollbar{display:none}.sx{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="sg">
        {/* TOP BAR */}
        <div style={{gridColumn:"1/-1",background:"#0a0e1a",borderBottom:`2px solid ${K.border}`,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <table style={{borderCollapse:"collapse",fontSize:11}}><thead><tr style={{color:K.muted}}>
            <th style={{padding:"2px 8px",textAlign:"left",fontSize:9}}>EQ</th>
            {Array.from({length:game.totalInnings||9}).map((_:any,i:number)=><th key={i} style={{padding:"2px 4px",textAlign:"center",fontSize:9,color:game.inning===i+1?K.accent:K.muted}}>{i+1}</th>)}
            <th style={{padding:"2px 6px",textAlign:"center",fontSize:9,color:K.accent}}>R</th><th style={{padding:"2px 6px",textAlign:"center",fontSize:9}}>H</th><th style={{padding:"2px 6px",textAlign:"center",fontSize:9}}>E</th>
          </tr></thead><tbody>{[{t:aw,inn:game.awayInnings,s:game.awayScore,h:awH,e:hmE},{t:hm,inn:game.homeInnings,s:game.homeScore,h:hmH,e:awE}].map((x,i)=>(
            <tr key={i}><td style={{padding:"3px 8px",fontWeight:800,fontSize:11,color:(i===0&&isTop)||(i===1&&!isTop)?K.accent:K.text}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><TeamLogo team={x.t} size={14}/>{x.t?.abbr}</div></td>
              {(x.inn||[]).map((r:any,j:number)=><td key={j} style={{padding:"3px 4px",textAlign:"center",fontWeight:700,fontSize:11,color:r!==null?K.text:K.muted}}>{r!==null?r:"—"}</td>)}
              <td style={{padding:"3px 6px",textAlign:"center",fontWeight:900,fontSize:14,color:K.accent}}>{x.s}</td>
              <td style={{padding:"3px 6px",textAlign:"center",fontWeight:700}}>{x.h}</td>
              <td style={{padding:"3px 6px",textAlign:"center",fontWeight:700,color:K.red}}>{x.e}</td></tr>))}</tbody></table>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>ENTRADA</div><div style={{fontSize:24,fontWeight:900,color:K.accent}}>{isTop?"▲":"▼"} {game.inning}°</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>OUTS</div><div style={{display:"flex",gap:4,marginTop:3}}>{[0,1,2].map(i=><div key={i} style={{width:16,height:16,borderRadius:8,background:i<(game.outs||0)?K.red:K.border}}/>)}</div></div></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>CONTEO</div><div style={{display:"flex",gap:8,marginTop:2}}><span style={{fontSize:20,fontWeight:900,color:K.green}}>B:{count.balls||0}</span><span style={{fontSize:20,fontWeight:900,color:K.red}}>S:{count.strikes||0}</span></div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>LANZ</div><div style={{fontSize:18,fontWeight:900,color:K.blue}}>{pitcherPitchCount}</div></div>
            <button onClick={()=>setShowPitcher(true)} style={{padding:"6px 10px",borderRadius:8,background:noPitcher?K.red:K.border,border:"none",color:noPitcher?"#fff":K.dim,fontSize:10,fontWeight:700,cursor:"pointer"}}>{noPitcher?"⚠️":"🔄"} Pitcher</button>
            <button onClick={()=>{if(confirm("¿Finalizar?"))finishGame(plays);}} style={{padding:"6px 10px",borderRadius:8,background:K.red,border:"none",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>🏁 FIN</button></div></div>

        {/* LEFT LINEUP */}
        <div style={{background:"#0d1220",borderRight:`1px solid ${K.border}`,overflow:"auto",padding:"8px 6px"}}>
          <div style={{fontSize:9,fontWeight:900,color:K.muted,textTransform:"uppercase",padding:"4px 6px",marginBottom:4}}>AL BATE: {batTm?.name}</div>
          {batLineup.map((p:any,i:number)=>{const a=i===(batIdx%batLineup.length);const s=getStats(p.id);const sd=isTop?"away":"home";return(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 6px",borderRadius:10,marginBottom:2,background:a?`${K.accent}22`:"transparent",border:a?`2px solid ${K.accent}`:"2px solid transparent"}}>
              <span style={{fontWeight:900,fontSize:10,color:a?K.accent:K.muted,width:14}}>{i+1}</span>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:a?900:700,fontSize:11,color:a?K.accent:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>#{p.number} {p.name}</div>
                <div style={{fontSize:9,color:K.muted}}>{p.fieldPos||p.position} · {s.summary}</div></div>
              {a&&<span style={{fontSize:12}}>🏏</span>}
              <button onClick={(e:any)=>{e.stopPropagation();setShowSub({side:sd as any,idx:i});}} style={{background:"none",border:"none",color:K.muted,cursor:"pointer",fontSize:10,padding:2}}>🔄</button></div>);})}
          <div style={{marginTop:10,padding:8,borderRadius:10,background:K.input,borderTop:`2px solid ${noPitcher?K.red:K.blue}33`}}>
            <div style={{fontSize:9,fontWeight:900,color:noPitcher?K.red:K.blue,textTransform:"uppercase",marginBottom:4}}>{noPitcher?"⚠️":"⚾"} LANZADOR ({pitchTm?.abbr})</div>
            {pitcher?<div><div style={{fontWeight:800,fontSize:12}}>#{pitcher.number} {pitcher.name}</div><div style={{fontSize:9,color:K.muted,marginTop:2}}>Lanz: {pitcherPitchCount}</div></div>
            :<button onClick={()=>setShowPitcher(true)} style={{...S.btn("danger"),padding:"6px 10px",fontSize:10,width:"100%"}}>⚠️ Asignar</button>}
          </div></div>

        {/* CENTER DIAMOND INTELIGENTE */}
        <div style={{background:"#080c16",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:12}}>
          {noPitcher&&<div style={{padding:"8px 14px",borderRadius:10,background:`${K.red}22`,border:`1px solid ${K.red}`,marginBottom:12,textAlign:"center"}}><span style={{fontSize:11,fontWeight:700,color:K.red}}>⚠️ Asigna pitcher</span></div>}
          
          <div style={{textAlign:"center",marginBottom:45}}> {/* ── MARGEN AUMENTADO PARA ALEJAR EL DUELO ── */}
            <div style={{fontSize:10,color:K.muted,fontWeight:700,marginBottom:4}}>DUELO</div>
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}><span style={{fontWeight:900,fontSize:13,color:noPitcher?K.red:K.blue}}>{pitcher?.name||"⚠️"}</span><span style={{fontSize:10,color:K.muted}}>🆚</span><span style={{fontWeight:900,fontSize:13,color:K.accent}}>{currentBatter?.name||"?"}</span></div>
          </div>
          
          <div style={{position:"relative",width:180,height:180, marginTop:15, marginBottom:20}}>
            <svg width={180} height={180} viewBox="0 0 180 180"><polygon points="90,15 165,90 90,165 15,90" fill="none" stroke={K.border} strokeWidth="2"/><line x1="90" y1="165" x2="165" y2="90" stroke={K.border} strokeWidth="1" opacity=".3"/><line x1="90" y1="165" x2="15" y2="90" stroke={K.border} strokeWidth="1" opacity=".3"/></svg>
            
            {/* ── NOMBRES DEFENSIVOS (RADAR) REDISTRIBUIDOS ── */}
            {[
              {p:"C(2)", x:90, y:185}, 
              {p:"P(1)", x:90, y:105}, 
              {p:"1B(3)", x:180, y:70},
              {p:"2B(4)", x:135, y:-5}, 
              {p:"3B(5)", x:0, y:70}, 
              {p:"SS(6)", x:45, y:-5},
              {p:"LF(7)", x:-15, y:-35}, 
              {p:"CF(8)", x:90, y:-50}, 
              {p:"RF(9)", x:195, y:-35}
            ].map(d => {
              const name = getDefName(d.p);
              if (!name) return null;
              return <div key={d.p} style={{position:"absolute", left:d.x, top:d.y, transform:"translate(-50%,-50%)", fontSize:8, fontWeight:800, color:K.blue, background:"rgba(13, 31, 74, 0.85)", border:`1px solid ${K.blue}55`, padding:"3px 5px", borderRadius:6, zIndex:5, whiteSpace:"nowrap", textShadow:"0 1px 2px #000"}}>{d.p.split("(")[0]} {name}</div>
            })}

            <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%) rotate(45deg)",width:18,height:18,background:K.muted,borderRadius:2}}/>
            
            {/* BOTONES INTERACTIVOS DE BASES */}
            {[{idx:0,s:{right:4,top:"50%",transform:"translateY(-50%) rotate(45deg)"}},{idx:1,s:{left:"50%",top:2,transform:"translateX(-50%) rotate(45deg)"}},{idx:2,s:{left:4,top:"50%",transform:"translateY(-50%) rotate(45deg)"}}].map(b=>(
              <div key={b.idx} style={{position:"absolute",...b.s}}>
                <div onClick={async()=>{const bs=[...bases];bs[b.idx]=bs[b.idx]?null:{id:"ghost",name:"Corredor"};await up({bases:bs});}}
                     style={{width:22,height:22,borderRadius:3,cursor:"pointer",background:bases[b.idx]?K.yellow:K.border,border:`2px solid ${bases[b.idx]?K.yellow:K.muted}`,boxShadow:bases[b.idx]?`0 0 12px ${K.yellow}66`:"none",transition:"all .2s"}}/>
              </div>
            ))}
            
            {/* ── ETIQUETAS DE CORREDORES DESPLAZADAS PARA NO CHOCAR ── */}
            {bases[0] && <div style={{position:"absolute", right: -40, top: "65%", transform:"translateY(-50%)", fontSize:9, fontWeight:900, color:"#000", background:K.yellow, padding:"2px 6px", borderRadius:4, zIndex:10, boxShadow:`0 2px 5px ${K.yellow}55`}}>{bases[0].name.split(" ")[0]}</div>}
            {bases[1] && <div style={{position:"absolute", left: "50%", top: -25, transform:"translateX(-50%)", fontSize:9, fontWeight:900, color:"#000", background:K.yellow, padding:"2px 6px", borderRadius:4, zIndex:10, boxShadow:`0 2px 5px ${K.yellow}55`}}>{bases[1].name.split(" ")[0]}</div>}
            {bases[2] && <div style={{position:"absolute", left: -40, top: "65%", transform:"translateY(-50%)", fontSize:9, fontWeight:900, color:"#000", background:K.yellow, padding:"2px 6px", borderRadius:4, zIndex:10, boxShadow:`0 2px 5px ${K.yellow}55`}}>{bases[2].name.split(" ")[0]}</div>}
          </div>
          <div style={{display:"flex",gap:16,marginTop:20}}>{["1ra","2da","3ra"].map((l,i)=><span key={i} style={{fontSize:10,fontWeight:700,color:bases[i]?K.yellow:K.muted}}>{l} {bases[i]?"●":"○"}</span>)}</div></div>

        {/* RIGHT ACTIONS */}
        <div style={{background:"#0d1220",borderLeft:`1px solid ${K.border}`,overflow:"auto",padding:8,display:"flex",flexDirection:"column",gap:8}}>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>PITCHEOS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <Btn label="BOLA" icon="🟢" color={K.green} onClick={addBall} disabled={noPitcher}/>
              <Btn label="STRIKE" icon="🔴" color={K.red} onClick={()=>addStrike("called")} disabled={noPitcher}/>
              <Btn label="SWING" icon="💨" color="#f97316" onClick={()=>addStrike("swinging")} disabled={noPitcher}/>
              <Btn label="FOUL" icon="📐" color={K.yellow} onClick={()=>addStrike("foul")} disabled={noPitcher}/></div></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>HITS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <Btn label="1B" icon="🏏" color={K.accent} onClick={()=>prepareHit("1B")} size="lg" disabled={noPitcher}/>
              <Btn label="2B" icon="✌️" color="#14b8a6" onClick={()=>prepareHit("2B")} size="lg" disabled={noPitcher}/>
              <Btn label="3B" icon="🔱" color="#6366f1" onClick={()=>prepareHit("3B")} size="lg" disabled={noPitcher}/>
              <Btn label="HR" icon="💥" color={K.red} bg={`${K.red}22`} onClick={()=>prepareHit("HR")} size="lg" disabled={noPitcher}/></div></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>OUTS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
              <Btn label="K" icon="💨" color="#a78bfa" onClick={()=>registerOut("K")} disabled={noPitcher}/>
              <Btn label="FLY" icon="🔼" color="#64748b" onClick={()=>registerOut("FLY")} disabled={noPitcher}/>
              <Btn label="GROUND" icon="⬇️" color="#64748b" onClick={()=>registerOut("GROUND")} disabled={noPitcher}/></div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            <button onClick={()=>{if(noPitcher){setShowPitcher(true);return;}setShowError(true);}} style={{padding:"8px 6px",borderRadius:10,border:"2px solid #f9731644",background:"#f9731615",color:"#f97316",fontWeight:900,fontSize:11,cursor:"pointer",textAlign:"center",minHeight:36}}>🫣 ERROR</button>
            <button onClick={()=>{if(noPitcher){setShowPitcher(true);return;}setShowComplex(true);}} style={{padding:"8px 6px",borderRadius:10,border:`2px solid ${K.purple}44`,background:`${K.purple}15`,color:K.purple,fontWeight:900,fontSize:11,cursor:"pointer",textAlign:"center",minHeight:36}}>⚙️ COMPLEJA</button></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>+ CARRERAS EQUIPO / JUGADOR</div>
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>setShowAssignRun(true)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1px solid ${K.accent}`,background:`${K.accent}22`,color:K.accent,fontWeight:900,fontSize:11,cursor:"pointer"}} title="Anotar a un jugador">🏃 +CA</button>
              {[1,2,3].map(n=><button key={n} onClick={async()=>{const k=isTop?"awayScore":"homeScore";const ik=isTop?"awayInnings":"homeInnings";const ni=[...(game[ik]||[])];ni[game.inning-1]=(ni[game.inning-1]||0)+n;await up({[k]:(game[k]||0)+n,[ik]:ni});}} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1px solid ${K.accent}44`,background:K.input,color:K.accent,fontWeight:900,fontSize:13,cursor:"pointer"}} title="Anotar al equipo">+{n}</button>)}</div></div></div>

        {/* BOTTOM LOG */}
        <div style={{gridColumn:"1/-1",background:"#0a0e1a",borderTop:`2px solid ${K.border}`,padding:"6px 12px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={undoLastPlay} style={{padding:"8px 14px",borderRadius:10,background:K.red+"22",border:`2px solid ${K.red}`,color:K.red,fontWeight:900,fontSize:11,cursor:"pointer",flexShrink:0}}>↩️ DESHACER</button>
          <div style={{flex:1,display:"flex",gap:6,overflow:"auto"}} className="sx">
            {rp.map((p:any,i:number)=>{const ic:any={"1B":"🏏","2B":"✌️","3B":"🔱","HR":"💥","BB":"👁","K":"💨","OUT":"❌","FLY":"🔼","GROUND":"⬇️","DP":"✖️","SAC":"🎯","HBP":"😤","E":"🫣","WP":"🤷","SB":"🏃","CS":"🚔","PB":"🧤","BALK":"🚫","RUN":"🏃‍♂️"};
              return<div key={i} style={{flexShrink:0,padding:"4px 10px",borderRadius:8,background:K.input,border:`1px solid ${K.border}`,display:"flex",alignItems:"center",gap:4,fontSize:10}}>
                <span>{ic[p.result]||"⚾"}</span><span style={{fontWeight:700}}>{p.playerName}</span>
                <span style={{color:K.muted}}>{p.result} {p.errorPosition?`(${p.errorPosition})`:""}</span>
                {p.ci>0&&<span style={{color:K.accent,fontWeight:700}}>+{p.ci}CI</span>}
                {p.isEarned===false&&<span style={{color:K.yellow,fontSize:8}}>UER</span>}</div>})}</div>
          <button onClick={()=>setShowTraditional(!showTraditional)} style={{padding:"8px 14px",borderRadius:10,background:K.border,border:"none",color:K.dim,fontWeight:700,fontSize:10,cursor:"pointer",flexShrink:0}}>📋 Hoja</button></div>
      </div>

      {/* MODALS REESCRITOS PARA SOPORTAR OBJETOS EN BASES */}
      {showConfirm&&<Modal title={`Confirmar ${showConfirm.type}`} onClose={()=>setShowConfirm(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{textAlign:"center",padding:10,background:K.input,borderRadius:12}}>
            <span style={{fontSize:28}}>{{"1B":"🏏","2B":"✌️","3B":"🔱","HR":"💥","E":"🫣"}[showConfirm.type as string]}</span>
            <div style={{fontWeight:900,fontSize:16,color:K.text,marginTop:4}}>{currentBatter?.name}</div></div>
          <div><label style={S.label}>Carreras que anotan</label>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>{[0,1,2,3,4].map(n=><button key={n} onClick={()=>setShowConfirm({...showConfirm,runs:n})} style={{width:44,height:44,borderRadius:12,border:`2px solid ${showConfirm.runs===n?K.accent:K.border}`,background:showConfirm.runs===n?`${K.accent}22`:K.input,color:showConfirm.runs===n?K.accent:K.text,fontWeight:900,fontSize:18,cursor:"pointer"}}>{n}</button>)}</div></div>
          <div><label style={S.label}>Bases (toca para ajustar)</label>
            <div style={{display:"flex",gap:12,justifyContent:"center",padding:10}}>{["1ra","2da","3ra"].map((l,i)=><button key={i} onClick={()=>{const nb=[...showConfirm.newBases];nb[i]=nb[i]?null:(bases[i]||{id:"ghost",name:"Corredor"});setShowConfirm({...showConfirm,newBases:nb});}} style={{padding:"10px 18px",borderRadius:10,border:`2px solid ${showConfirm.newBases[i]?K.yellow:K.border}`,background:showConfirm.newBases[i]?K.yellow+"22":"transparent",color:showConfirm.newBases[i]?K.yellow:K.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>{l} {showConfirm.newBases[i]?"●":"○"}</button>)}</div></div>
          <button onClick={confirmHit} style={{...S.btn("primary"),width:"100%",padding:14,fontSize:14}}>✅ Confirmar {showConfirm.runs>0?`(+${showConfirm.runs})`:""}
          </button></div></Modal>}

      {showError&&<Modal title="🫣 Error Defensivo" onClose={()=>setShowError(false)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {FIELD_POS.map(pos=><button key={pos} onClick={()=>registerError(pos)} style={{padding:14,borderRadius:12,border:"2px solid #f9731644",background:"#f9731615",color:"#f97316",fontWeight:800,fontSize:12,cursor:"pointer",textAlign:"center"}}>{pos}</button>)}</div></Modal>}

      {showAssignRun && <Modal title="¿Quién anotó la carrera?" onClose={()=>setShowAssignRun(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {batLineup.map((p:any) => (
             <button key={p.id} onClick={async()=>{
                const play = {...makePlay("RUN",{ca:1,isPitch:false}), playerId:p.id, playerName:p.name};
                await up({plays:[...plays,play], ...(addTeamRun ? scoreRuns(1) : {})});
                setShowAssignRun(false); setAddTeamRun(false);
             }} style={{padding:12,borderRadius:10,border:`1px solid ${K.border}`,background:K.input,color:K.text,fontWeight:700,fontSize:14,cursor:"pointer",textAlign:"left"}}>
               #{p.number} {p.name}
             </button>
          ))}
          <label style={{display:"flex", alignItems:"center", gap:8, marginTop:12}}>
             <input type="checkbox" checked={addTeamRun} onChange={(e)=>setAddTeamRun(e.target.checked)} />
             <span style={{fontSize:12, color:K.muted}}>Sumar también al marcador general del equipo</span>
          </label>
        </div>
      </Modal>}

      {showRunnerAction&&<Modal title={showRunnerAction.type==="SB"?"🏃 ¿Quién se robó la base?":"🚔 ¿Quién fue atrapado?"} onClose={()=>setShowRunnerAction(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bases.map((runner:any,i:number)=>{if(!runner)return null;const c=[K.accent,"#6366f1",K.yellow];return<button key={i} onClick={()=>executeRunnerAction(showRunnerAction.type!,i, runner)} style={{padding:16,borderRadius:14,border:`2px solid ${c[i]}44`,background:`${c[i]}15`,color:c[i],fontWeight:800,fontSize:14,cursor:"pointer",textAlign:"center"}}>🏃 {runner.name} en {["1ra","2da","3ra"][i]} Base</button>})}</div></Modal>}

      {showComplex&&<Modal title="Jugada Compleja" onClose={()=>setShowComplex(false)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{k:"HBP",l:"Golpeado",i:"😤",c:"#eab308",d:"Fuerza si full"},{k:"SAC",l:"Sacrificio",i:"🎯",c:"#a3a3a3",d:"No cuenta AB"},{k:"DP",l:"Doble Play",i:"✖️✖️",c:"#dc2626",d:"Limpia líder"},{k:"WP",l:"Wild Pitch",i:"🤷",c:"#64748b",d:"ER, sin RBI"},{k:"PB",l:"Passed Ball",i:"🧤",c:"#64748b",d:"UER"},{k:"BALK",l:"Balk",i:"🚫",c:"#f43f5e",d:"ER, sin RBI"},{k:"SB",l:"Base Robada",i:"🏃",c:"#8b5cf6",d:""},{k:"CS",l:"Atrapado",i:"🚔",c:"#dc2626",d:"1 out"}].map(a=>
            <button key={a.k} onClick={()=>registerComplex(a.k)} style={{padding:12,borderRadius:14,border:`2px solid ${a.c}44`,background:`${a.c}15`,color:a.c,fontWeight:800,fontSize:11,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:2}}>{a.i}</div>{a.l}{a.d&&<div style={{fontSize:8,color:K.muted,marginTop:2}}>{a.d}</div>}</button>)}</div></Modal>}

      {showPitcher&&<Modal title={`Lanzador (${pitchTm?.name})`} onClose={()=>setShowPitcher(false)}>
        {pitchLineup.map((p:any)=>{const ps=getPitStats(p.id);return(
          <button key={p.id} onClick={async()=>{await up({currentPitcher:{id:p.id,name:p.name,number:p.number}});setShowPitcher(false);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:`2px solid ${pitcher?.id===p.id?K.accent:K.border}`,background:pitcher?.id===p.id?`${K.accent}11`:K.input,cursor:"pointer",textAlign:"left",width:"100%",marginBottom:6}}>
            <span style={{fontWeight:800,fontSize:12,color:K.muted}}>#{p.number}</span>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{p.name}</div>{ps.pitches>0&&<div style={{fontSize:9,color:K.muted}}>IP:{ps.ip} K:{ps.K} H:{ps.h} BB:{ps.bb} CL:{ps.cl}</div>}</div>
            {pitcher?.id===p.id&&<span style={S.badge(K.accent)}>Actual</span>}</button>)})}</Modal>}

      {showSub&&<Modal title="Sustitución" onClose={()=>setShowSub(null)}>
        <div style={{marginBottom:12,padding:10,background:K.input,borderRadius:10}}>
          <div style={{fontSize:10,color:K.muted}}>SALE:</div>
          <div style={{fontWeight:800,fontSize:14,color:K.red,marginTop:2}}>#{(showSub.side==="away"?(game.awayLineup||[]):(game.homeLineup||[]))[showSub.idx]?.number} {(showSub.side==="away"?(game.awayLineup||[]):(game.homeLineup||[]))[showSub.idx]?.name}</div></div>
        <div style={{fontSize:10,color:K.muted,marginBottom:8}}>ENTRA:</div>
        {getAvailSubs(showSub.side).map((p:any)=><button key={p.id} onClick={()=>doSub(showSub.side,showSub.idx,p)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:`2px solid ${K.border}`,background:K.input,cursor:"pointer",width:"100%",marginBottom:6,textAlign:"left"}}>
          <span style={{fontWeight:800,color:K.accent}}>#{p.number||"—"}</span><span style={{fontWeight:700,fontSize:14,flex:1}}>{p.name}</span><span style={{fontSize:10,color:K.muted}}>{p.position}</span></button>)}
      </Modal>}

      {showTraditional&&<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.9)",overflow:"auto",padding:16}} onClick={()=>setShowTraditional(false)}>
        <div onClick={(e:any)=>e.stopPropagation()} style={{maxWidth:700,margin:"0 auto",background:K.card,borderRadius:16,padding:16,border:`1px solid ${K.border}`}}>
          <h3 style={{fontWeight:900,fontSize:16,color:K.accent,marginBottom:12}}>📋 Hoja Tradicional</h3>
          {[{label:aw?.name,lineup:game.awayLineup||[],team:"away"},{label:hm?.name,lineup:game.homeLineup||[],team:"home"}].map(({label,lineup,team})=>(
            <div key={team} style={{marginBottom:16}}>
              <h4 style={{fontWeight:800,fontSize:13,color:K.text,marginBottom:6}}>{label} — BATEADORES</h4>
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:420}}>
                <thead><tr style={{color:K.muted,borderBottom:`1px solid ${K.border}`}}>
                  {["JUGADOR","PA","VB","H","2B","3B","HR","CI","CA","BB","K","BR","E","AVG"].map(c=><th key={c} style={{textAlign:c==="JUGADOR"?"left":"center",padding:4,fontSize:9}}>{c}</th>)}</tr></thead>
                <tbody>{lineup.map((p:any)=>{const s=getStats(p.id);return(
                  <tr key={p.id} style={{borderBottom:`1px solid ${K.border}`}}>
                    <td style={{padding:4,fontWeight:700}}>#{p.number} {p.name} <span style={{fontSize:8,color:K.muted}}>{p.fieldPos}</span></td>
                    <td style={{textAlign:"center",padding:4}}>{s.pa}</td><td style={{textAlign:"center",padding:4}}>{s.vb}</td>
                    <td style={{textAlign:"center",padding:4,fontWeight:700}}>{s.h}</td><td style={{textAlign:"center",padding:4}}>{s.db}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.tb}</td><td style={{textAlign:"center",padding:4,color:s.hr>0?K.red:K.text}}>{s.hr}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.ci}</td><td style={{textAlign:"center",padding:4}}>{s.ca}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.bb}</td><td style={{textAlign:"center",padding:4}}>{s.k}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.sb}</td><td style={{textAlign:"center",padding:4,color:s.e>0?K.red:K.text,fontWeight:s.e>0?900:400}}>{s.e}</td>
                    <td style={{textAlign:"center",padding:4,fontWeight:900,color:K.accent}}>{s.avg}</td></tr>)})}</tbody>
              </table></div>
              {(()=>{const pids=[...new Set(plays.filter((p:any)=>p.pitcherId&&p.result).map((p:any)=>p.pitcherId))].filter(pid=>{
                const ih=(game.homeLineup||[]).find((x:any)=>x.id===pid);return team==="home"?!!ih:!ih;});
                if(!pids.length)return null;return<div style={{marginTop:8}}>
                  <h4 style={{fontWeight:800,fontSize:11,color:K.blue,marginBottom:4}}>⚾ PITCHERS — {label}</h4>
                  <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:350}}>
                    <thead><tr style={{color:K.muted,borderBottom:`1px solid ${K.border}`}}>
                      {["PITCHER","IP","H","CL","BB","K","LANZ","ERA"].map(c=><th key={c} style={{textAlign:c==="PITCHER"?"left":"center",padding:4,fontSize:9}}>{c}</th>)}</tr></thead>
                    <tbody>{pids.map(pid=>{const ps=getPitStats(pid as string);const nm=plays.find((p:any)=>p.pitcherId===pid)?.pitcherName||"?";
                      const era=parseFloat(ps.ip)>0?((ps.cl*7)/parseFloat(ps.ip)).toFixed(2):"0.00";
                      return<tr key={pid as string} style={{borderBottom:`1px solid ${K.border}`}}>
                        <td style={{padding:4,fontWeight:700}}>{nm}</td><td style={{textAlign:"center",padding:4,fontWeight:700,color:K.accent}}>{ps.ip}</td>
                        <td style={{textAlign:"center",padding:4}}>{ps.h}</td><td style={{textAlign:"center",padding:4,color:K.red}}>{ps.cl}</td>
                        <td style={{textAlign:"center",padding:4}}>{ps.bb}</td><td style={{textAlign:"center",padding:4,fontWeight:700}}>{ps.K}</td>
                        <td style={{textAlign:"center",padding:4}}>{ps.pitches}</td><td style={{textAlign:"center",padding:4,fontWeight:900,color:K.blue}}>{era}</td></tr>})}</tbody>
                  </table></div></div>})()}
            </div>))}
          <button onClick={()=>setShowTraditional(false)} style={{...S.btn("ghost"),width:"100%",marginTop:12}}>Cerrar</button></div></div>}
    </div>);
}

// ═══ WATCH GAME ═══
export function WatchGame({ data, id, nav }: any) {
  const [game,setGame]=useState<any>(null);
  useEffect(()=>{const u=F.onDoc("games",id!,setGame);return()=>u&&u();},[id]);
  if(!game)return<div style={{...S.sec,textAlign:"center",padding:40}}><IcoBall size={40} color={K.accent} style={{animation:"spin 1.5s linear infinite",margin:"0 auto 12px"}}/></div>;
  const aw=data.teams.find((t:any)=>t.id===game.awayTeamId);const hm=data.teams.find((t:any)=>t.id===game.homeTeamId);
  const isTop=game.half==="top";const batTm=isTop?aw:hm;
  const rp=[...(game.plays||[])].filter((p:any)=>p.result).reverse().slice(0,12);
  const R:any={"1B":{l:"Sencillo",i:"🏏"},"2B":{l:"Doble",i:"✌️"},"3B":{l:"Triple",i:"🔱"},HR:{l:"Jonrón",i:"💥"},BB:{l:"BB",i:"👁"},K:{l:"K",i:"💨"},OUT:{l:"Out",i:"❌"},FLY:{l:"Fly",i:"🔼"},GROUND:{l:"Rodado",i:"⬇️"},DP:{l:"DP",i:"✖️"},SAC:{l:"SAC",i:"🎯"},HBP:{l:"HBP",i:"😤"},E:{l:"Error",i:"🫣"},WP:{l:"WP",i:"🤷"},SB:{l:"BR",i:"🏃"},CS:{l:"CS",i:"🚔"},PB:{l:"PB",i:"🧤"},BALK:{l:"Balk",i:"🚫"},RUN:{l:"Anotó",i:"🏃‍♂️"}};
  if(game.status==="final")return(
    <div style={S.sec}><div style={{...S.card,padding:24,textAlign:"center"}}><span style={{fontSize:40,display:"block",marginBottom:12}}>🏆</span><h2 style={{fontWeight:900,fontSize:22,marginBottom:8}}>Juego Finalizado</h2>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:16}}>{[{t:aw,s:game.awayScore,o:game.homeScore},{t:hm,s:game.homeScore,o:game.awayScore}].map((x,i)=>(
        <div key={i} style={{textAlign:"center"}}><TeamLogo team={x.t} size={48}/><div style={{fontWeight:700,fontSize:13,marginTop:4}}>{x.t?.name}</div><div style={{fontWeight:900,fontSize:32,color:x.s>x.o?K.accent:K.dim}}>{x.s}</div></div>))}</div>
      <button onClick={()=>nav("calendar","boxscore",id)} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>Box Score</button>
      <button onClick={()=>nav("home")} style={S.btn("primary")}>Volver</button></div></div>);
  return(
    <div style={S.sec}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14}}><span style={{...S.badge(K.live),animation:"pulse 2s infinite"}}>● EN VIVO</span></div>
      <Scoreboard game={game} aw={aw} hm={hm} isTop={isTop} batTm={batTm}/>
      {rp.length>0&&<div style={{...S.card}}><div style={{background:K.accentDk,padding:"8px 14px"}}><span style={{fontWeight:900,fontSize:11,color:K.accent}}>📋 JUGADA A JUGADA</span></div>
        <div style={{padding:8}}>{rp.map((p:any,i:number)=>{const r=R[p.result]||{l:p.result,i:"⚾"};return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 4px",borderBottom:i<rp.length-1?`1px solid ${K.border}`:"none"}}>
            <span>{r.i}</span><span style={{fontWeight:700,fontSize:12,flex:1}}>{p.playerName}</span>
            <span style={{...S.badge(K.muted),fontSize:9}}>{r.l} {p.errorPosition?`(${p.errorPosition})`:""}</span>
            {p.ci>0&&<span style={{fontSize:10,color:K.accent,fontWeight:700}}>+{p.ci}CI</span>}
            {p.isEarned===false&&<span style={{fontSize:8,color:K.yellow}}>UER</span>}
            <span style={{fontSize:9,color:K.muted}}>E{p.inning}{p.half==="top"?"▲":"▼"}</span></div>)})}</div></div>}
      <div style={{...S.card,padding:20,textAlign:"center",marginTop:14}}><IcoEye size={28} color={K.accent} style={{margin:"0 auto 10px"}}/><p style={{color:K.dim,fontSize:14}}>Se actualiza automáticamente</p></div>
    </div>);
}