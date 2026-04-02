import { useState, useEffect } from "react";
import { F } from "../../config/firebase.ts";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoPlay, IcoEye, IcoBall, IcoCal } from "../../components/Icons.tsx";
import { TeamLogo, Scoreboard, Empty, Modal } from "../../components/UI.tsx";

// ═══ BASEBALL LOGIC ═══
function advanceBases(bases: boolean[], hitType: string): { newBases: boolean[], runsScored: number } {
  const b = [...bases]; let runs = 0;
  if (hitType === "HR") { runs = 1+(b[0]?1:0)+(b[1]?1:0)+(b[2]?1:0); return { newBases:[false,false,false], runsScored:runs }; }
  if (hitType === "3B") { runs = (b[0]?1:0)+(b[1]?1:0)+(b[2]?1:0); return { newBases:[false,false,true], runsScored:runs }; }
  if (hitType === "2B") { runs = (b[2]?1:0)+(b[1]?1:0); return { newBases:[false,true,b[0]], runsScored:runs }; }
  runs = b[2]?1:0; return { newBases:[true,b[0],b[1]], runsScored:runs };
}
function walkBases(bases: boolean[]): { newBases: boolean[], runsScored: number } {
  const b = [...bases]; let runs = 0;
  if (b[0]) { if (b[1]) { if (b[2]) runs = 1; b[2] = true; } b[1] = true; } b[0] = true;
  return { newBases: b, runsScored: runs };
}
function advanceAllRunners(bases: boolean[]): { newBases: boolean[], runsScored: number } {
  const nb = [...bases]; let runs = 0;
  if (nb[2]) { runs++; nb[2] = false; } if (nb[1]) { nb[2] = true; nb[1] = false; } if (nb[0]) { nb[1] = true; nb[0] = false; }
  return { newBases: nb, runsScored: runs };
}
const POSITIONS_DEF = ["P(1)","C(2)","1B(3)","2B(4)","3B(5)","SS(6)","LF(7)","CF(8)","RF(9)"];

// ═══ SCORER PAGE ═══
export function ScorerPage({ data, nav }: any) {
  const scheduled = data.games.filter((g:any)=>g.status==="scheduled").sort((a:any,b:any)=>(a.date||"").localeCompare(b.date||""));
  const live = data.games.filter((g:any)=>g.status==="live");
  const findTeam = (id:string)=>data.teams.find((t:any)=>t.id===id);
  return (
    <div style={S.sec}>
      <h2 style={S.secT}>⚾ Anotador</h2>
      {live.length>0&&<div style={{marginBottom:20}}><h3 style={{fontWeight:700,fontSize:13,color:K.live,marginBottom:10}}>● En Curso</h3>
        {live.map((g:any)=>{const aw=findTeam(g.awayTeamId),hm=findTeam(g.homeTeamId);return(
          <div key={g.id} style={{...S.card,padding:14,marginBottom:8,borderLeft:`3px solid ${K.live}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:13}}>{aw?.name} {g.awayScore}-{g.homeScore} {hm?.name}</div><span style={{fontSize:11,color:K.muted}}>Ent {g.inning} {g.half==="top"?"▲":"▼"}</span></div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>nav("scorer","live",g.id)} style={{...S.btn("primary"),padding:"6px 12px",fontSize:11}}>Anotar</button>
              <button onClick={()=>nav("scorer","watch",g.id)} style={{...S.btn("ghost"),padding:"6px 12px",fontSize:11}}><IcoEye size={14}/></button></div></div>)})}</div>}
      <h3 style={{fontWeight:700,fontSize:13,color:K.blue,marginBottom:10}}>📋 Juegos Programados</h3>
      {scheduled.length>0?scheduled.map((g:any)=>{const aw=findTeam(g.awayTeamId),hm=findTeam(g.homeTeamId);return(
        <div key={g.id} style={{...S.card,padding:14,marginBottom:8,border:`1px solid ${K.blue}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:6}}><span style={S.badge(K.blue)}>{g.date}</span>{g.time&&<span style={S.badge(K.accent)}>{g.time}</span>}</div>
            <button onClick={()=>nav("scorer","live",g.id)} style={{...S.btn("primary"),padding:"6px 14px",fontSize:11}}><span style={{display:"flex",alignItems:"center",gap:4}}><IcoPlay size={12}/>Iniciar</span></button></div>
          <div style={{display:"flex",justifyContent:"center",gap:16,alignItems:"center"}}>
            <div style={{textAlign:"center",flex:1}}><TeamLogo team={aw} size={36}/><div style={{fontSize:11,fontWeight:700,marginTop:4}}>{aw?.name}</div></div>
            <span style={{fontWeight:900,color:K.muted}}>VS</span>
            <div style={{textAlign:"center",flex:1}}><TeamLogo team={hm} size={36}/><div style={{fontSize:11,fontWeight:700,marginTop:4}}>{hm?.name}</div></div></div></div>)})
      :<Empty icon={IcoCal} text="No hay juegos programados." action={()=>nav("calendar")} actionLabel="Ir a Calendario"/>}
    </div>);
}

// ═══ LIVE GAME ═══
export function LiveGame({ data, id, nav }: any) {
  const [game,setGame] = useState<any>(null);
  const [showComplex,setShowComplex] = useState(false);
  const [showPitcher,setShowPitcher] = useState(false);
  const [showTraditional,setShowTraditional] = useState(false);
  const [showSub,setShowSub] = useState<{side:"away"|"home",idx:number}|null>(null);
  const [showConfirm,setShowConfirm] = useState<any>(null);
  const [showError,setShowError] = useState(false);

  useEffect(()=>{const u=F.onDoc("games",id!,setGame);return()=>u&&u();},[id]);
  if(!game) return <div style={{...S.sec,textAlign:"center",padding:40}}><IcoBall size={40} color={K.accent} style={{animation:"spin 1.5s linear infinite",margin:"0 auto"}}/></div>;

  const aw=data.teams.find((t:any)=>t.id===game.awayTeamId);
  const hm=data.teams.find((t:any)=>t.id===game.homeTeamId);
  const isTop=game.half==="top";
  const batTm=isTop?aw:hm;
  const pitchTm=isTop?hm:aw;
  const batLineup=isTop?(game.awayLineup||[]):(game.homeLineup||[]);
  const pitchLineup=isTop?(game.homeLineup||[]):(game.awayLineup||[]);
  const pitcher=game.currentPitcher||null;
  const count=game.count||{balls:0,strikes:0};
  const bases=game.bases||[false,false,false];
  const plays=game.plays||[];
  const up=async(u:any)=>await F.set("games",id!,u);

  const awBatIdx=game.awayBatterIdx||0;
  const hmBatIdx=game.homeBatterIdx||0;
  const batIdx=isTop?awBatIdx:hmBatIdx;
  const batIdxKey=isTop?"awayBatterIdx":"homeBatterIdx";
  const currentBatter=batLineup[batIdx%batLineup.length]||null;
  const pitcherPitchCount=pitcher?plays.filter((p:any)=>p.pitcherId===pitcher.id&&p.isPitch).length:0;
  // Pitcher is REQUIRED
  const noPitcher = !pitcher;

  const getPlayerGameStats=(pid:string)=>{
    let vb=0,h=0,hr=0,ci=0,ca=0,bb=0,k=0,db=0,tb=0,sb=0,pa=0;
    plays.forEach((p:any)=>{if(p.playerId!==pid)return;
      pa++;
      if(["1B","2B","3B","HR"].includes(p.result)){vb++;h++;if(p.result==="2B")db++;if(p.result==="3B")tb++;if(p.result==="HR")hr++;}
      else if(["BB","HBP"].includes(p.result))bb++;
      // SAC does NOT count as AB
      else if(p.result==="SAC"){/* pa already counted, no VB */}
      else if(["OUT","FLY","GROUND","K","DP"].includes(p.result)){vb++;if(p.result==="K")k++;}
      else if(p.result==="E"){vb++;}
      ci+=(p.ci||0);ca+=(p.ca||0);if(p.result==="SB")sb++;
    });
    const avg=vb>0?(h/vb).toFixed(3):".000";
    return {vb,h,hr,ci,ca,bb,k,db,tb,sb,pa,avg,summary:`${h}-${vb}${hr>0?`, ${hr}HR`:""}${ci>0?`, ${ci}CI`:""}`};
  };

  const getPitcherGameStats=(pid:string)=>{
    let h=0,bb=0,k=0,cl=0,outs=0,pitches=0;
    plays.forEach((p:any)=>{if(p.pitcherId!==pid)return;
      if(p.isPitch)pitches++;if(!p.result)return;
      if(["1B","2B","3B","HR","E"].includes(p.result))h++;
      if(["BB","HBP"].includes(p.result))bb++;
      if(p.result==="K")k++;
      if(["OUT","FLY","GROUND","K","SAC"].includes(p.result))outs++;
      if(p.result==="DP")outs+=2;
      // PB runs are UNEARNED — don't add to CL
      if(p.isEarned!==false) cl+=(p.ci||0);
    });
    const ip=Math.floor(outs/3)+(outs%3)/10;
    return {h,bb,K:k,cl,outs,pitches,ip:ip.toFixed(1)};
  };

  // ── LINEUP SETUP ──
  if(game.status==="scheduled"){
    const awP=data.players.filter((p:any)=>p.teamId===game.awayTeamId);
    const hmP=data.players.filter((p:any)=>p.teamId===game.homeTeamId);
    const toggle=async(pid:string,side:"away"|"home")=>{
      const key=side==="away"?"awayLineup":"homeLineup";const cur=game[key]||[];
      const pl=data.players.find((p:any)=>p.id===pid);if(!pl)return;
      const entry={id:pid,name:pl.name,number:pl.number,position:pl.position};
      const ex=cur.find((p:any)=>p.id===pid);
      if(ex)await up({[key]:cur.filter((p:any)=>p.id!==pid)});
      else await up({[key]:[...cur,entry]});
    };

    // Starting pitcher selection
    const [awPitcher,setAwPitcher]=useState<any>(game.awayStartingPitcher||null);
    const [hmPitcher,setHmPitcher]=useState<any>(game.homeStartingPitcher||null);
    const canStart=(game.awayLineup||[]).length>0&&(game.homeLineup||[]).length>0&&awPitcher&&hmPitcher;

    return(
      <div style={S.sec}>
        <h2 style={S.secT}>Preparar Juego</h2>
        <div style={{...S.card,padding:16,marginBottom:16,background:`linear-gradient(135deg,${K.accentDk},${K.card})`}}>
          <div style={{display:"flex",justifyContent:"center",gap:20,alignItems:"center"}}>
            <div style={{textAlign:"center"}}><TeamLogo team={aw} size={44}/><div style={{fontSize:11,fontWeight:700,color:K.text,marginTop:4}}>{aw?.name}</div></div>
            <span style={{fontWeight:900,fontSize:18,color:K.muted}}>VS</span>
            <div style={{textAlign:"center"}}><TeamLogo team={hm} size={44}/><div style={{fontSize:11,fontWeight:700,color:K.text,marginTop:4}}>{hm?.name}</div></div></div></div>

        {[{label:"Visitante",team:aw,players:awP,lineup:game.awayLineup||[],side:"away" as const,pitcher:awPitcher,setPitcher:setAwPitcher},
          {label:"Local",team:hm,players:hmP,lineup:game.homeLineup||[],side:"home" as const,pitcher:hmPitcher,setPitcher:setHmPitcher}].map(({label,team,players,lineup,side,pitcher:sp,setPitcher:setSP})=>(
          <div key={side} style={{...S.card,marginBottom:12,overflow:"hidden"}}>
            <div style={{background:team?.color||K.accent,padding:"8px 14px",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:900,fontSize:12,color:"#fff"}}>{label}: {team?.name}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700}}>{lineup.length}</span></div>
            <div style={{padding:10}}>
              {players.map((p:any)=>{const inL=lineup.find((l:any)=>l.id===p.id);return(
                <div key={p.id} onClick={()=>toggle(p.id,side)} style={{display:"flex",alignItems:"center",padding:"8px 6px",borderBottom:`1px solid ${K.border}`,cursor:"pointer",background:inL?`${K.accent}11`:"transparent",borderRadius:8,marginBottom:2}}>
                  <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${inL?K.accent:K.border}`,background:inL?K.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginRight:10,fontSize:12,color:"#fff",fontWeight:900}}>{inL?"✓":""}</div>
                  <span style={{fontWeight:800,fontSize:13,color:K.muted,width:28}}>#{p.number||"—"}</span>
                  <span style={{fontWeight:700,fontSize:13,flex:1}}>{p.name}</span>
                  <span style={{fontSize:10,color:K.muted}}>{p.position}</span></div>)})}
            </div>
            {/* Starting Pitcher Selection */}
            <div style={{padding:"8px 10px",borderTop:`2px solid ${K.blue}33`,background:K.input}}>
              <div style={{fontSize:10,fontWeight:900,color:K.blue,marginBottom:6}}>⚾ PITCHER ABRIDOR</div>
              {sp?<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontWeight:800,fontSize:13}}>#{sp.number} {sp.name}</span>
                <button onClick={()=>setSP(null)} style={{background:"none",border:"none",color:K.red,fontSize:10,cursor:"pointer",fontWeight:700}}>Cambiar</button></div>
              :<div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:100,overflow:"auto"}}>
                {lineup.filter((p:any)=>p.position==="P"||true).map((p:any)=>(
                  <button key={p.id} onClick={()=>setSP(p)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:8,border:`1px solid ${K.border}`,background:K.card,cursor:"pointer",textAlign:"left",fontSize:11}}>
                    <span style={{fontWeight:800,color:K.muted}}>#{p.number}</span>
                    <span style={{fontWeight:700,flex:1}}>{p.name}</span>
                    <span style={{fontSize:9,color:K.muted}}>{p.position}</span></button>))}
                {lineup.length===0&&<span style={{fontSize:10,color:K.red}}>Agrega jugadores al lineup primero</span>}
              </div>}
            </div>
          </div>))}

        {!canStart&&<div style={{padding:"10px 14px",borderRadius:12,background:`${K.red}15`,border:`1px solid ${K.red}33`,marginBottom:12,textAlign:"center"}}>
          <span style={{fontSize:11,fontWeight:700,color:K.red}}>⚠️ Selecciona jugadores y pitcher abridor para ambos equipos</span></div>}

        <button onClick={async()=>{
          if(!canStart)return;
          await up({status:"live",count:{balls:0,strikes:0},awayBatterIdx:0,homeBatterIdx:0,
            currentPitcher:{id:hmPitcher.id,name:hmPitcher.name,number:hmPitcher.number},
            awayStartingPitcher:awPitcher,homeStartingPitcher:hmPitcher});
        }} style={{...S.btn(canStart?"primary":"ghost"),width:"100%",padding:16,fontSize:15,opacity:canStart?1:0.5}} disabled={!canStart}>
          <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><IcoPlay size={18}/>INICIAR JUEGO</span></button>
      </div>);
  }

  // ══════════════════════════════════════
  // LIVE SCORING LOGIC
  // ══════════════════════════════════════
  const resetCount=()=>({balls:0,strikes:0});
  const nextBatter=()=>batLineup.length===0?batIdx:(batIdx+1)%batLineup.length;

  const scoreRuns=(runs:number)=>{
    if(runs<=0)return{};
    const k=isTop?"awayScore":"homeScore";const ik=isTop?"awayInnings":"homeInnings";
    const ni=[...(game[ik]||[])];ni[game.inning-1]=(ni[game.inning-1]||0)+runs;
    return{[k]:(game[k]||0)+runs,[ik]:ni};
  };

  const changeHalf=(updates:any)=>{
    updates.outs=0;updates.bases=[false,false,false];updates.count=resetCount();
    if(isTop){updates.half="bottom";const ai=[...(game.awayInnings||[])];if(ai[game.inning-1]===null)ai[game.inning-1]=0;updates.awayInnings=ai;
      // Switch pitcher to away's pitcher
      const awSP=game.awayStartingPitcher;
      if(awSP&&(!game.currentPitcher||game.currentPitcher.id!==awSP.id)){
        // Only auto-switch if there's a starting pitcher set for away
        const awPitchers=plays.filter((p:any)=>p.pitcherId&&(game.awayLineup||[]).find((l:any)=>l.id===p.pitcherId));
        if(awPitchers.length===0&&awSP) updates.currentPitcher={id:awSP.id,name:awSP.name,number:awSP.number};
      }
    } else {
      const hi=[...(game.homeInnings||[])];if(hi[game.inning-1]===null)hi[game.inning-1]=0;updates.homeInnings=hi;
      updates.inning=game.inning+1;updates.half="top";
      // Switch pitcher back to home's pitcher
      const hmSP=game.homeStartingPitcher;
      if(hmSP) updates.currentPitcher={id:hmSP.id,name:hmSP.name,number:hmSP.number};
    }
  };

  const makePlay=(result:string,extra:any={})=>({
    playerId:currentBatter?.id,playerName:currentBatter?.name||"?",
    teamId:isTop?game.awayTeamId:game.homeTeamId,team:isTop?"away":"home",result,
    ci:0,ca:0,isEarned:true, // default: earned run
    pitcherId:pitcher?.id||null,pitcherName:pitcher?.name||null,
    isPitch:true,inning:game.inning,half:game.half,timestamp:Date.now(),...extra,
  });

  // ── HITS with confirmation ──
  const prepareHit=(type:string)=>{
    const{newBases,runsScored}=advanceBases(bases,type);
    setShowConfirm({type,suggestedRuns:runsScored,runs:runsScored,newBases,ca:type==="HR"?1:0});
  };
  const confirmHit=async()=>{
    if(!showConfirm)return;
    const{type,runs,newBases,ca}=showConfirm;
    const totalRuns=runs;
    const play=makePlay(type,{ci:totalRuns,ca});
    const u:any={plays:[...plays,play],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(totalRuns)};
    await up(u);setShowConfirm(null);
  };

  // ── PITCHES ──
  const addBall=async()=>{
    if(noPitcher){setShowPitcher(true);return;}
    const b=(count.balls||0)+1;
    const pp={pitcherId:pitcher?.id,pitcherName:pitcher?.name,isPitch:true,timestamp:Date.now(),inning:game.inning,half:game.half};
    if(b>=4){
      const{newBases,runsScored}=walkBases(bases);
      const play=makePlay("BB",{ci:runsScored,isPitch:true});
      await up({plays:[...plays,play],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runsScored)});
    } else await up({plays:[...plays,pp],count:{...count,balls:b}});
  };

  const addStrike=async(type:"called"|"swinging"|"foul")=>{
    if(noPitcher){setShowPitcher(true);return;}
    const s=(count.strikes||0)+1;
    const pp={pitcherId:pitcher?.id,pitcherName:pitcher?.name,isPitch:true,pitchType:type,timestamp:Date.now(),inning:game.inning,half:game.half};
    if(type==="foul"&&s>=3){await up({plays:[...plays,pp]});return;}
    if(s>=3){
      const play=makePlay("K",{isPitch:true});
      const newPlays=[...plays,play];const u:any={plays:newPlays,count:resetCount(),[batIdxKey]:nextBatter()};
      const o=(game.outs||0)+1;
      if(o>=3){changeHalf(u);if(!isTop&&game.inning+1>(game.totalInnings||7)){await finishGame(newPlays);return;}}
      else u.outs=o;await up(u);
    } else await up({plays:[...plays,pp],count:{...count,strikes:s}});
  };

  // ── OUTS ──
  const registerOut=async(type:string)=>{
    if(noPitcher){setShowPitcher(true);return;}
    const numOuts=type==="DP"?2:1;
    // DP also clears lead runner
    let nb=[...bases];
    if(type==="DP"){if(nb[0])nb[0]=false;else if(nb[1])nb[1]=false;else if(nb[2])nb[2]=false;}
    const play=makePlay(type,{isPitch:true});
    const newPlays=[...plays,play];const u:any={plays:newPlays,count:resetCount(),[batIdxKey]:nextBatter(),bases:nb};
    const o=(game.outs||0)+numOuts;
    if(o>=3){changeHalf(u);if(!isTop&&game.inning+1>(game.totalInnings||7)){await finishGame(newPlays);return;}}
    else u.outs=o;await up(u);
  };

  // ── ERRORS ──
  const registerError=async(fielderPos:string)=>{
    const{newBases,runsScored}=advanceBases(bases,"E");
    setShowError(false);
    setShowConfirm({type:"E",suggestedRuns:runsScored,runs:runsScored,newBases,ca:0,extra:{errorPosition:fielderPos,isPitch:true,isEarned:false}});
  };

  // ── COMPLEX ──
  const registerComplex=async(type:string)=>{
    if(noPitcher&&type!=="SB"&&type!=="CS"){setShowPitcher(true);return;}

    if(type==="HBP"){
      // MLB: HBP with bases loaded = 1 RBI for batter, earned run
      const{newBases,runsScored}=walkBases(bases);
      const play=makePlay("HBP",{ci:runsScored,isPitch:true,isEarned:true});
      await up({plays:[...plays,play],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runsScored)});
    }
    else if(type==="SAC"){
      // MLB: SAC does NOT count as AB. Runners advance. If run scores = RBI for batter.
      const{newBases,runsScored}=advanceAllRunners(bases);
      const play=makePlay("SAC",{ci:runsScored,isPitch:true,isSacrifice:true});
      const newPlays=[...plays,play];const u:any={plays:newPlays,bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runsScored)};
      const o=(game.outs||0)+1;
      if(o>=3){changeHalf(u);}else u.outs=o;await up(u);
    }
    else if(type==="SB"){
      const play={...makePlay("SB",{isPitch:false}),playerId:null,playerName:"Corredor"};
      await up({plays:[...plays,play]});
    }
    else if(type==="CS"){
      const play={...makePlay("CS",{isPitch:false}),playerId:null,playerName:"Corredor"};
      const newPlays=[...plays,play];const u:any={plays:newPlays};
      const o=(game.outs||0)+1;if(o>=3)changeHalf(u);else u.outs=o;await up(u);
    }
    else if(type==="WP"){
      // WP = pitcher's fault = earned runs
      const{newBases,runsScored}=advanceAllRunners(bases);
      const play={...makePlay(type,{ci:runsScored,isPitch:false,isEarned:true}),playerId:null,playerName:pitcher?.name||"Pitcher"};
      await up({plays:[...plays,play],bases:newBases,...scoreRuns(runsScored)});
    }
    else if(type==="PB"){
      // PB = catcher's fault = UNEARNED runs (not charged to pitcher ERA)
      const{newBases,runsScored}=advanceAllRunners(bases);
      const play={...makePlay(type,{ci:runsScored,isPitch:false,isEarned:false}),playerId:null,playerName:"Receptor"};
      await up({plays:[...plays,play],bases:newBases,...scoreRuns(runsScored)});
    }
    else if(type==="BALK"){
      // Balk = pitcher's fault = earned runs
      const{newBases,runsScored}=advanceAllRunners(bases);
      const play={...makePlay(type,{ci:runsScored,isPitch:false,isEarned:true}),playerId:null,playerName:pitcher?.name||"Pitcher"};
      await up({plays:[...plays,play],bases:newBases,...scoreRuns(runsScored)});
    }
    else if(type==="DP"){await registerOut("DP");}
    setShowComplex(false);
  };

  // ── SUBSTITUTION ──
  const doSub=async(side:"away"|"home",idx:number,newPlayer:any)=>{
    const key=side==="away"?"awayLineup":"homeLineup";
    const lineup=[...(game[key]||[])];
    lineup[idx]={id:newPlayer.id,name:newPlayer.name,number:newPlayer.number,position:newPlayer.position};
    await up({[key]:lineup});setShowSub(null);
  };
  const getAvailableSubs=(side:"away"|"home")=>{
    const teamId=side==="away"?game.awayTeamId:game.homeTeamId;
    const lineup=side==="away"?(game.awayLineup||[]):(game.homeLineup||[]);
    const ids=new Set(lineup.map((p:any)=>p.id));
    return data.players.filter((p:any)=>p.teamId===teamId&&!ids.has(p.id));
  };

  // ── UNDO ──
  const undoLastPlay=async()=>{
    if(plays.length===0)return;if(!confirm("¿Deshacer última jugada?"))return;
    const removed=plays[plays.length-1];const newPlays=plays.slice(0,-1);const u:any={plays:newPlays};
    if(removed.result&&removed.playerId){
      const runs=(removed.ci||0)+(removed.ca||0);
      if(runs>0){const k=removed.team==="away"?"awayScore":"homeScore";const ik=removed.team==="away"?"awayInnings":"homeInnings";
        u[k]=Math.max(0,(game[k]||0)-runs);const ni=[...(game[ik]||[])];ni[removed.inning-1]=Math.max(0,(ni[removed.inning-1]||0)-runs);u[ik]=ni;}
      const bKey=removed.team==="away"?"awayBatterIdx":"homeBatterIdx";
      const ln=removed.team==="away"?(game.awayLineup||[]):(game.homeLineup||[]);
      u[bKey]=(game[bKey]||0)>0?(game[bKey]||0)-1:ln.length-1;
    }
    await up(u);
  };

  // ── FINISH GAME ──
  const finishGame=async(gamePlays:any[])=>{
    await up({status:"final"});
    if(aw){const u=game.awayScore>game.homeScore?{wins:(aw.wins||0)+1}:game.awayScore<game.homeScore?{losses:(aw.losses||0)+1}:{draws:(aw.draws||0)+1};await F.set("teams",aw.id,u);}
    if(hm){const u=game.homeScore>game.awayScore?{wins:(hm.wins||0)+1}:game.homeScore<game.awayScore?{losses:(hm.losses||0)+1}:{draws:(hm.draws||0)+1};await F.set("teams",hm.id,u);}

    // ── BATTING STATS (MLB rules) ──
    const batAgg:Record<string,any>={};
    gamePlays.forEach((p:any)=>{if(!p.playerId)return;
      if(!batAgg[p.playerId])batAgg[p.playerId]={VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0,PA:0};
      const s=batAgg[p.playerId]; s.PA++;
      if(["1B","2B","3B","HR"].includes(p.result)){s.VB++;s.H++;if(p.result==="2B")s["2B"]++;if(p.result==="3B")s["3B"]++;if(p.result==="HR")s.HR++;}
      else if(["BB","HBP"].includes(p.result))s.BB++;
      // SAC: NO AB increment (MLB rule). PA already counted above.
      else if(p.result==="SAC"){/* no VB increment */}
      else if(["OUT","FLY","GROUND","K","DP"].includes(p.result)){s.VB++;if(p.result==="K")s.K++;}
      else if(p.result==="E"){s.VB++;}
      // SAC with run scored = RBI for batter (already in p.ci)
      s.CI+=(p.ci||0);s.CA+=(p.ca||0);if(p.result==="SB")s.BR++;
    });
    for(const[pid,gs]of Object.entries(batAgg)as any){
      const pl=data.players.find((p:any)=>p.id===pid);if(!pl)continue;
      const b=pl.batting||{JJ:0,VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0};
      await F.set("players",pid,{batting:{JJ:(b.JJ||0)+1,VB:(b.VB||0)+gs.VB,H:(b.H||0)+gs.H,"2B":(b["2B"]||0)+gs["2B"],"3B":(b["3B"]||0)+gs["3B"],HR:(b.HR||0)+gs.HR,CI:(b.CI||0)+gs.CI,CA:(b.CA||0)+gs.CA,BB:(b.BB||0)+gs.BB,K:(b.K||0)+gs.K,BR:(b.BR||0)+gs.BR}});
    }

    // ── PITCHING STATS (MLB rules: PB runs = unearned) ──
    const pitAgg:Record<string,any>={};
    gamePlays.forEach((p:any)=>{if(!p.pitcherId||!p.result)return;
      if(!pitAgg[p.pitcherId])pitAgg[p.pitcherId]={H:0,BB:0,K:0,CL:0,outs:0,teamSide:""};
      const s=pitAgg[p.pitcherId];
      if(["1B","2B","3B","HR","E"].includes(p.result))s.H++;
      if(["BB","HBP"].includes(p.result))s.BB++;
      if(p.result==="K")s.K++;
      if(["OUT","FLY","GROUND","K","SAC"].includes(p.result))s.outs++;
      if(p.result==="DP")s.outs+=2;
      // Only count EARNED runs for ERA
      if(p.isEarned!==false) s.CL+=(p.ci||0);
      if(!s.teamSide){const inHome=(game.homeLineup||[]).find((x:any)=>x.id===p.pitcherId);s.teamSide=inHome?"home":"away";}
    });

    const winSide=game.awayScore>game.homeScore?"away":game.homeScore>game.awayScore?"home":null;
    const winPs=winSide?Object.entries(pitAgg).filter(([_,v]:any)=>v.teamSide===winSide).sort((a:any,b:any)=>b[1].outs-a[1].outs):[];
    const losePs=winSide?Object.entries(pitAgg).filter(([_,v]:any)=>v.teamSide!==winSide).sort((a:any,b:any)=>b[1].outs-a[1].outs):[];
    const wpId=winPs[0]?.[0]||null;const lpId=losePs[0]?.[0]||null;

    for(const[pid,gs]of Object.entries(pitAgg)as any){
      const pl=data.players.find((p:any)=>p.id===pid);if(!pl)continue;
      const pt=pl.pitching||{JJ:0,IL:0,H:0,CL:0,BB:0,K:0,G:0,P:0,JC:0};
      const il=Math.floor(gs.outs/3)+(gs.outs%3)/10;
      const isWin=pid===wpId;const isLoss=pid===lpId;
      const teamTotalOuts=Object.entries(pitAgg).filter(([_,v]:any)=>v.teamSide===gs.teamSide).reduce((sum:number,[_,v]:any)=>sum+v.outs,0);
      const isJC=gs.outs===teamTotalOuts&&gs.outs>=(game.totalInnings||7)*3/2;
      await F.set("players",pid,{pitching:{JJ:(pt.JJ||0)+1,IL:parseFloat(((pt.IL||0)+il).toFixed(1)),H:(pt.H||0)+gs.H,CL:(pt.CL||0)+gs.CL,BB:(pt.BB||0)+gs.BB,K:(pt.K||0)+gs.K,G:(pt.G||0)+(isWin?1:0),P:(pt.P||0)+(isLoss?1:0),JC:(pt.JC||0)+(isJC?1:0)}});
    }
    nav("home");
  };

  const recentPlays=[...plays].filter((p:any)=>p.result).reverse().slice(0,6);
  const awHits=plays.filter((p:any)=>p.team==="away"&&["1B","2B","3B","HR"].includes(p.result)).length;
  const hmHits=plays.filter((p:any)=>p.team==="home"&&["1B","2B","3B","HR"].includes(p.result)).length;
  const awErrors=plays.filter((p:any)=>p.result==="E"&&p.team==="away").length;
  const hmErrors=plays.filter((p:any)=>p.result==="E"&&p.team==="home").length;

  const BtnAction=({label,icon,color,bg,onClick,size="md",disabled=false}:any)=>(
    <button onClick={onClick} disabled={disabled} style={{
      padding:size==="lg"?"14px 8px":size==="sm"?"8px 6px":"10px 8px",
      borderRadius:12,border:`2px solid ${color}44`,background:bg||`${color}15`,
      color:disabled?K.muted:color,fontWeight:900,fontSize:size==="lg"?13:size==="sm"?10:11,
      cursor:disabled?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,width:"100%",
      minHeight:size==="lg"?56:40,opacity:disabled?0.4:1,
    }}><span style={{fontSize:size==="lg"?20:16}}>{icon}</span><span>{label}</span></button>
  );

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <div style={{background:K.bg,color:K.text,fontFamily:"'Outfit',system-ui,sans-serif",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`
        .scorer-grid{display:grid;grid-template-columns:200px 1fr 240px;grid-template-rows:auto 1fr auto;height:calc(100vh - 0px);gap:0}
        @media(max-width:800px){.scorer-grid{grid-template-columns:1fr;grid-template-rows:auto auto auto auto auto}}
        .scroll-x::-webkit-scrollbar{display:none}.scroll-x{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <div className="scorer-grid">
        {/* ═══ 1. TOP BAR ═══ */}
        <div style={{gridColumn:"1/-1",background:"#0a0e1a",borderBottom:`2px solid ${K.border}`,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <table style={{borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{color:K.muted}}>
              <th style={{padding:"2px 8px",textAlign:"left",fontSize:9}}>EQ</th>
              {Array.from({length:game.totalInnings||7}).map((_:any,i:number)=><th key={i} style={{padding:"2px 4px",textAlign:"center",fontSize:9,color:game.inning===i+1?K.accent:K.muted}}>{i+1}</th>)}
              <th style={{padding:"2px 6px",textAlign:"center",fontSize:9,color:K.accent}}>R</th><th style={{padding:"2px 6px",textAlign:"center",fontSize:9}}>H</th><th style={{padding:"2px 6px",textAlign:"center",fontSize:9}}>E</th>
            </tr></thead>
            <tbody>{[{t:aw,inn:game.awayInnings,s:game.awayScore,h:awHits,e:hmErrors},{t:hm,inn:game.homeInnings,s:game.homeScore,h:hmHits,e:awErrors}].map((x,i)=>(
              <tr key={i}><td style={{padding:"3px 8px",fontWeight:800,fontSize:11,color:(i===0&&isTop)||(i===1&&!isTop)?K.accent:K.text}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}><TeamLogo team={x.t} size={14}/>{x.t?.abbr}</div></td>
                {(x.inn||[]).map((r:any,j:number)=><td key={j} style={{padding:"3px 4px",textAlign:"center",fontWeight:700,fontSize:11,color:r!==null?K.text:K.muted}}>{r!==null?r:"—"}</td>)}
                <td style={{padding:"3px 6px",textAlign:"center",fontWeight:900,fontSize:14,color:K.accent}}>{x.s}</td>
                <td style={{padding:"3px 6px",textAlign:"center",fontWeight:700}}>{x.h}</td>
                <td style={{padding:"3px 6px",textAlign:"center",fontWeight:700,color:K.red}}>{x.e}</td></tr>))}</tbody>
          </table>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>ENTRADA</div><div style={{fontSize:24,fontWeight:900,color:K.accent}}>{isTop?"▲":"▼"} {game.inning}°</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>OUTS</div><div style={{display:"flex",gap:4,marginTop:3}}>{[0,1,2].map(i=><div key={i} style={{width:16,height:16,borderRadius:8,background:i<(game.outs||0)?K.red:K.border}}/>)}</div></div></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>CONTEO</div><div style={{display:"flex",gap:8,marginTop:2}}><span style={{fontSize:20,fontWeight:900,color:K.green}}>B:{count.balls||0}</span><span style={{fontSize:20,fontWeight:900,color:K.red}}>S:{count.strikes||0}</span></div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>LANZ</div><div style={{fontSize:18,fontWeight:900,color:K.blue}}>{pitcherPitchCount}</div></div>
            <button onClick={()=>setShowPitcher(true)} style={{padding:"6px 10px",borderRadius:8,background:noPitcher?K.red:K.border,border:"none",color:noPitcher?"#fff":K.dim,fontSize:10,fontWeight:700,cursor:"pointer"}}>{noPitcher?"⚠️ Asignar":"🔄"} Pitcher</button>
            <button onClick={()=>{if(confirm("¿Finalizar?"))finishGame(plays);}} style={{padding:"6px 10px",borderRadius:8,background:K.red,border:"none",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>🏁 FIN</button></div></div>

        {/* ═══ 2. LEFT — LINEUP ═══ */}
        <div style={{background:"#0d1220",borderRight:`1px solid ${K.border}`,overflow:"auto",padding:"8px 6px"}}>
          <div style={{fontSize:9,fontWeight:900,color:K.muted,textTransform:"uppercase",padding:"4px 6px",marginBottom:4}}>AL BATE: {batTm?.name}</div>
          {batLineup.map((p:any,i:number)=>{
            const isActive=i===(batIdx%batLineup.length);const stats=getPlayerGameStats(p.id);const side=isTop?"away" as const:"home" as const;
            return(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 6px",borderRadius:10,marginBottom:2,background:isActive?`${K.accent}22`:"transparent",border:isActive?`2px solid ${K.accent}`:"2px solid transparent"}}>
                <span style={{fontWeight:900,fontSize:10,color:isActive?K.accent:K.muted,width:14}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:isActive?900:700,fontSize:11,color:isActive?K.accent:K.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>#{p.number} {p.name}</div>
                  <div style={{fontSize:9,color:K.muted}}>{p.position} · {stats.summary}</div></div>
                {isActive&&<span style={{fontSize:12}}>🏏</span>}
                <button onClick={(e)=>{e.stopPropagation();setShowSub({side,idx:i});}} style={{background:"none",border:"none",color:K.muted,cursor:"pointer",fontSize:10,padding:2}}>🔄</button>
              </div>);})}
          <div style={{marginTop:10,padding:8,borderRadius:10,background:K.input,borderTop:`2px solid ${noPitcher?K.red:K.blue}33`}}>
            <div style={{fontSize:9,fontWeight:900,color:noPitcher?K.red:K.blue,textTransform:"uppercase",marginBottom:4}}>{noPitcher?"⚠️":"⚾"} LANZADOR ({pitchTm?.abbr})</div>
            {pitcher?(<div><div style={{fontWeight:800,fontSize:12}}>#{pitcher.number} {pitcher.name}</div><div style={{fontSize:9,color:K.muted,marginTop:2}}>Lanz: {pitcherPitchCount}</div></div>)
            :<button onClick={()=>setShowPitcher(true)} style={{...S.btn("danger"),padding:"6px 10px",fontSize:10,width:"100%"}}>⚠️ Asignar Pitcher</button>}
          </div></div>

        {/* ═══ 3. CENTER — DIAMOND ═══ */}
        <div style={{background:"#080c16",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:12}}>
          {noPitcher&&<div style={{padding:"8px 14px",borderRadius:10,background:`${K.red}22`,border:`1px solid ${K.red}`,marginBottom:12,textAlign:"center"}}>
            <span style={{fontSize:11,fontWeight:700,color:K.red}}>⚠️ Asigna un pitcher para continuar</span></div>}
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:10,color:K.muted,fontWeight:700,marginBottom:4}}>DUELO</div>
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
              <span style={{fontWeight:900,fontSize:13,color:noPitcher?K.red:K.blue}}>{pitcher?.name||"⚠️ SIN PITCHER"}</span>
              <span style={{fontSize:10,color:K.muted,fontWeight:800}}>🆚</span>
              <span style={{fontWeight:900,fontSize:13,color:K.accent}}>{currentBatter?.name||"?"}</span></div></div>
          <div style={{position:"relative",width:180,height:180}}>
            <svg width={180} height={180} viewBox="0 0 180 180"><polygon points="90,15 165,90 90,165 15,90" fill="none" stroke={K.border} strokeWidth="2"/><line x1="90" y1="165" x2="165" y2="90" stroke={K.border} strokeWidth="1" opacity=".3"/><line x1="90" y1="165" x2="15" y2="90" stroke={K.border} strokeWidth="1" opacity=".3"/></svg>
            <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%) rotate(45deg)",width:18,height:18,background:K.muted,borderRadius:2}}/>
            {[{idx:0,style:{right:4,top:"50%",transform:"translateY(-50%) rotate(45deg)"}},{idx:1,style:{left:"50%",top:2,transform:"translateX(-50%) rotate(45deg)"}},{idx:2,style:{left:4,top:"50%",transform:"translateY(-50%) rotate(45deg)"}}].map(b=>(
              <div key={b.idx} onClick={async()=>{const bs=[...bases];bs[b.idx]=!bs[b.idx];await up({bases:bs});}}
                style={{position:"absolute",...b.style,width:22,height:22,borderRadius:3,cursor:"pointer",background:bases[b.idx]?K.yellow:K.border,border:`2px solid ${bases[b.idx]?K.yellow:K.muted}`,boxShadow:bases[b.idx]?`0 0 12px ${K.yellow}66`:"none",transition:"all .2s"}}/>))}
          </div>
          <div style={{display:"flex",gap:16,marginTop:10}}>{["1ra","2da","3ra"].map((l,i)=><span key={i} style={{fontSize:10,fontWeight:700,color:bases[i]?K.yellow:K.muted}}>{l} {bases[i]?"●":"○"}</span>)}</div></div>

        {/* ═══ 4. RIGHT — ACTIONS ═══ */}
        <div style={{background:"#0d1220",borderLeft:`1px solid ${K.border}`,overflow:"auto",padding:8,display:"flex",flexDirection:"column",gap:8}}>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,textTransform:"uppercase",marginBottom:4,paddingLeft:4}}>PITCHEOS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <BtnAction label="BOLA" icon="🟢" color={K.green} onClick={addBall} disabled={noPitcher}/>
              <BtnAction label="STRIKE" icon="🔴" color={K.red} onClick={()=>addStrike("called")} disabled={noPitcher}/>
              <BtnAction label="SWING" icon="💨" color="#f97316" onClick={()=>addStrike("swinging")} disabled={noPitcher}/>
              <BtnAction label="FOUL" icon="📐" color={K.yellow} onClick={()=>addStrike("foul")} disabled={noPitcher}/></div></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,textTransform:"uppercase",marginBottom:4,paddingLeft:4}}>HITS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <BtnAction label="1B" icon="🏏" color={K.accent} onClick={()=>prepareHit("1B")} size="lg" disabled={noPitcher}/>
              <BtnAction label="2B" icon="✌️" color="#14b8a6" onClick={()=>prepareHit("2B")} size="lg" disabled={noPitcher}/>
              <BtnAction label="3B" icon="🔱" color="#6366f1" onClick={()=>prepareHit("3B")} size="lg" disabled={noPitcher}/>
              <BtnAction label="HR" icon="💥" color={K.red} bg={`${K.red}22`} onClick={()=>prepareHit("HR")} size="lg" disabled={noPitcher}/></div></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,textTransform:"uppercase",marginBottom:4,paddingLeft:4}}>OUTS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
              <BtnAction label="K" icon="💨" color="#a78bfa" onClick={()=>registerOut("K")} disabled={noPitcher}/>
              <BtnAction label="FLY" icon="🔼" color="#64748b" onClick={()=>registerOut("FLY")} disabled={noPitcher}/>
              <BtnAction label="GROUND" icon="⬇️" color="#64748b" onClick={()=>registerOut("GROUND")} disabled={noPitcher}/></div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            <button onClick={()=>{if(noPitcher){setShowPitcher(true);return;}setShowError(true);}} style={{padding:"10px 8px",borderRadius:12,border:"2px solid #f9731644",background:"#f9731615",color:"#f97316",fontWeight:900,fontSize:11,cursor:"pointer",textAlign:"center"}}>🫣 ERROR</button>
            <button onClick={()=>{if(noPitcher){setShowPitcher(true);return;}setShowComplex(true);}} style={{padding:"10px 8px",borderRadius:12,border:`2px solid ${K.purple}44`,background:`${K.purple}15`,color:K.purple,fontWeight:900,fontSize:11,cursor:"pointer",textAlign:"center"}}>⚙️ COMPLEJA</button></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,textTransform:"uppercase",marginBottom:4,paddingLeft:4}}>+ CARRERAS</div>
            <div style={{display:"flex",gap:4}}>{[1,2,3,4].map(n=>(
              <button key={n} onClick={async()=>{const k=isTop?"awayScore":"homeScore";const ik=isTop?"awayInnings":"homeInnings";const ni=[...(game[ik]||[])];ni[game.inning-1]=(ni[game.inning-1]||0)+n;await up({[k]:(game[k]||0)+n,[ik]:ni});}}
                style={{flex:1,padding:"8px 4px",borderRadius:8,border:`1px solid ${K.accent}44`,background:K.input,color:K.accent,fontWeight:900,fontSize:13,cursor:"pointer"}}>+{n}</button>))}</div></div></div>

        {/* ═══ 5. BOTTOM — LOG + UNDO ═══ */}
        <div style={{gridColumn:"1/-1",background:"#0a0e1a",borderTop:`2px solid ${K.border}`,padding:"6px 12px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={undoLastPlay} style={{padding:"8px 14px",borderRadius:10,background:K.red+"22",border:`2px solid ${K.red}`,color:K.red,fontWeight:900,fontSize:11,cursor:"pointer",flexShrink:0}}>↩️ DESHACER</button>
          <div style={{flex:1,display:"flex",gap:6,overflow:"auto"}} className="scroll-x">
            {recentPlays.map((p:any,i:number)=>{
              const icons:any={"1B":"🏏","2B":"✌️","3B":"🔱","HR":"💥","BB":"👁","K":"💨","OUT":"❌","FLY":"🔼","GROUND":"⬇️","DP":"✖️","SAC":"🎯","HBP":"😤","E":"🫣","WP":"🤷","SB":"🏃","CS":"🚔","PB":"🧤","BALK":"🚫"};
              return<div key={i} style={{flexShrink:0,padding:"4px 10px",borderRadius:8,background:K.input,border:`1px solid ${K.border}`,display:"flex",alignItems:"center",gap:4,fontSize:10}}>
                <span>{icons[p.result]||"⚾"}</span><span style={{fontWeight:700}}>{p.playerName}</span><span style={{color:K.muted}}>{p.result}</span>
                {p.ci>0&&<span style={{color:K.accent,fontWeight:700}}>+{p.ci}CI</span>}
                {p.isEarned===false&&<span style={{color:K.yellow,fontSize:8}}>UER</span>}
                {p.errorPosition&&<span style={{color:K.red,fontSize:9}}>E{p.errorPosition}</span>}</div>;})}
          </div>
          <button onClick={()=>setShowTraditional(!showTraditional)} style={{padding:"8px 14px",borderRadius:10,background:K.border,border:"none",color:K.dim,fontWeight:700,fontSize:10,cursor:"pointer",flexShrink:0}}>📋 Hoja</button></div>
      </div>

      {/* ═══ MODALS ═══ */}

      {showConfirm&&<Modal title={`Confirmar ${showConfirm.type}`} onClose={()=>setShowConfirm(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{textAlign:"center",padding:10,background:K.input,borderRadius:12}}>
            <span style={{fontSize:28}}>{{"1B":"🏏","2B":"✌️","3B":"🔱","HR":"💥","E":"🫣"}[showConfirm.type as string]}</span>
            <div style={{fontWeight:900,fontSize:16,color:K.text,marginTop:4}}>{currentBatter?.name}</div></div>
          <div><label style={S.label}>Carreras que anotan</label>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>{[0,1,2,3,4].map(n=>(
              <button key={n} onClick={()=>setShowConfirm({...showConfirm,runs:n})}
                style={{width:44,height:44,borderRadius:12,border:`2px solid ${showConfirm.runs===n?K.accent:K.border}`,background:showConfirm.runs===n?`${K.accent}22`:K.input,color:showConfirm.runs===n?K.accent:K.text,fontWeight:900,fontSize:18,cursor:"pointer"}}>{n}</button>))}</div>
            {showConfirm.runs!==showConfirm.suggestedRuns&&<div style={{textAlign:"center",marginTop:6,fontSize:10,color:K.yellow}}>⚠️ Sugerido: {showConfirm.suggestedRuns}</div>}</div>
          <div><label style={S.label}>Bases (toca para ajustar)</label>
            <div style={{display:"flex",gap:12,justifyContent:"center",padding:10}}>{["1ra","2da","3ra"].map((l,i)=>(
              <button key={i} onClick={()=>{const nb=[...showConfirm.newBases];nb[i]=!nb[i];setShowConfirm({...showConfirm,newBases:nb});}}
                style={{padding:"10px 18px",borderRadius:10,border:`2px solid ${showConfirm.newBases[i]?K.yellow:K.border}`,background:showConfirm.newBases[i]?K.yellow+"22":"transparent",color:showConfirm.newBases[i]?K.yellow:K.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>{l} {showConfirm.newBases[i]?"●":"○"}</button>))}</div></div>
          <button onClick={confirmHit} style={{...S.btn("primary"),width:"100%",padding:14,fontSize:14}}>✅ Confirmar {showConfirm.runs>0?`(+${showConfirm.runs} carreras)`:""}</button>
        </div></Modal>}

      {showError&&<Modal title="🫣 Error Defensivo" onClose={()=>setShowError(false)}>
        <p style={{color:K.dim,fontSize:12,marginBottom:12}}>¿Qué posición cometió el error?</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {POSITIONS_DEF.map(pos=>(
            <button key={pos} onClick={()=>registerError(pos)} style={{padding:14,borderRadius:12,border:"2px solid #f9731644",background:"#f9731615",color:"#f97316",fontWeight:800,fontSize:12,cursor:"pointer",textAlign:"center"}}>{pos}</button>))}
        </div></Modal>}

      {showComplex&&<Modal title="Jugada Compleja" onClose={()=>setShowComplex(false)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{key:"HBP",label:"Golpeado (HBP)",icon:"😤",color:"#eab308",desc:"Bases/bolas forzado si full"},
            {key:"SAC",label:"Sacrificio",icon:"🎯",color:"#a3a3a3",desc:"No cuenta como AB"},
            {key:"DP",label:"Doble Play",icon:"✖️✖️",color:"#dc2626",desc:"Limpia corredor líder"},
            {key:"WP",label:"Wild Pitch",icon:"🤷",color:"#64748b",desc:"Carrera limpia (ER)"},
            {key:"PB",label:"Passed Ball",icon:"🧤",color:"#64748b",desc:"Carrera sucia (UER)"},
            {key:"BALK",label:"Balk",icon:"🚫",color:"#f43f5e",desc:"Carrera limpia (ER)"},
            {key:"SB",label:"Base Robada",icon:"🏃",color:"#8b5cf6",desc:""},
            {key:"CS",label:"Atrapado Robando",icon:"🚔",color:"#dc2626",desc:"1 out"}].map(a=>(
            <button key={a.key} onClick={()=>registerComplex(a.key)} style={{padding:12,borderRadius:14,border:`2px solid ${a.color}44`,background:`${a.color}15`,color:a.color,fontWeight:800,fontSize:11,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:2}}>{a.icon}</div>{a.label}
              {a.desc&&<div style={{fontSize:8,color:K.muted,marginTop:2}}>{a.desc}</div>}
            </button>))}
        </div></Modal>}

      {showPitcher&&<Modal title={`Lanzador (${pitchTm?.name})`} onClose={()=>setShowPitcher(false)}>
        {pitchLineup.length>0?pitchLineup.map((p:any)=>{const ps=getPitcherGameStats(p.id);return(
          <button key={p.id} onClick={async()=>{await up({currentPitcher:{id:p.id,name:p.name,number:p.number}});setShowPitcher(false);}}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:`2px solid ${pitcher?.id===p.id?K.accent:K.border}`,background:pitcher?.id===p.id?`${K.accent}11`:K.input,cursor:"pointer",textAlign:"left",width:"100%",marginBottom:6}}>
            <span style={{fontWeight:800,fontSize:12,color:K.muted}}>#{p.number}</span>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
              {ps.pitches>0&&<div style={{fontSize:9,color:K.muted}}>IP:{ps.ip} K:{ps.K} H:{ps.h} BB:{ps.bb} Lanz:{ps.pitches} CL:{ps.cl}</div>}</div>
            {pitcher?.id===p.id&&<span style={S.badge(K.accent)}>Actual</span>}
          </button>)})
        :<p style={{color:K.muted,textAlign:"center",padding:10}}>Sin jugadores en lineup</p>}
      </Modal>}

      {showSub&&<Modal title="Sustitución" onClose={()=>setShowSub(null)}>
        <div style={{marginBottom:12,padding:10,background:K.input,borderRadius:10}}>
          <div style={{fontSize:10,color:K.muted,fontWeight:700}}>SALE:</div>
          <div style={{fontWeight:800,fontSize:14,color:K.red,marginTop:2}}>
            #{(showSub.side==="away"?(game.awayLineup||[]):(game.homeLineup||[]))[showSub.idx]?.number} {(showSub.side==="away"?(game.awayLineup||[]):(game.homeLineup||[]))[showSub.idx]?.name}</div></div>
        <div style={{fontSize:10,color:K.muted,fontWeight:700,marginBottom:8}}>ENTRA:</div>
        {getAvailableSubs(showSub.side).length>0?getAvailableSubs(showSub.side).map((p:any)=>(
          <button key={p.id} onClick={()=>doSub(showSub.side,showSub.idx,p)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,border:`2px solid ${K.border}`,background:K.input,cursor:"pointer",width:"100%",marginBottom:6,textAlign:"left"}}>
            <span style={{fontWeight:800,fontSize:12,color:K.accent}}>#{p.number||"—"}</span>
            <span style={{fontWeight:700,fontSize:14,flex:1}}>{p.name}</span>
            <span style={{fontSize:10,color:K.muted}}>{p.position}</span></button>
        )):<p style={{color:K.muted,textAlign:"center",padding:10,fontSize:12}}>No hay jugadores disponibles</p>}
      </Modal>}

      {showTraditional&&<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.9)",overflow:"auto",padding:16}} onClick={()=>setShowTraditional(false)}>
        <div onClick={(e)=>e.stopPropagation()} style={{maxWidth:700,margin:"0 auto",background:K.card,borderRadius:16,padding:16,border:`1px solid ${K.border}`}}>
          <h3 style={{fontWeight:900,fontSize:16,color:K.accent,marginBottom:12}}>📋 Hoja Tradicional</h3>
          {[{label:aw?.name,lineup:game.awayLineup||[],team:"away",tmObj:aw},{label:hm?.name,lineup:game.homeLineup||[],team:"home",tmObj:hm}].map(({label,lineup,team,tmObj})=>(
            <div key={team} style={{marginBottom:16}}>
              <h4 style={{fontWeight:800,fontSize:13,color:K.text,marginBottom:6}}>{label} — BATEADORES</h4>
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:400}}>
                <thead><tr style={{color:K.muted,borderBottom:`1px solid ${K.border}`}}>
                  {["JUGADOR","PA","VB","H","2B","3B","HR","CI","CA","BB","K","BR","AVG"].map(c=><th key={c} style={{textAlign:c==="JUGADOR"?"left":"center",padding:4,fontSize:9}}>{c}</th>)}
                </tr></thead>
                <tbody>{lineup.map((p:any)=>{const s=getPlayerGameStats(p.id);return(
                  <tr key={p.id} style={{borderBottom:`1px solid ${K.border}`}}>
                    <td style={{padding:4,fontWeight:700}}>#{p.number} {p.name}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.pa}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.vb}</td>
                    <td style={{textAlign:"center",padding:4,fontWeight:700}}>{s.h}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.db}</td><td style={{textAlign:"center",padding:4}}>{s.tb}</td>
                    <td style={{textAlign:"center",padding:4,color:s.hr>0?K.red:K.text}}>{s.hr}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.ci}</td><td style={{textAlign:"center",padding:4}}>{s.ca}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.bb}</td><td style={{textAlign:"center",padding:4}}>{s.k}</td>
                    <td style={{textAlign:"center",padding:4}}>{s.sb}</td>
                    <td style={{textAlign:"center",padding:4,fontWeight:900,color:K.accent}}>{s.avg}</td></tr>);})}</tbody>
              </table></div>

              {/* Pitchers for this team */}
              {(()=>{
                const tPids=[...new Set(plays.filter((p:any)=>p.pitcherId&&p.result).map((p:any)=>p.pitcherId))].filter(pid=>{
                  const inHome=(game.homeLineup||[]).find((x:any)=>x.id===pid);
                  return team==="home"?!!inHome:!inHome;
                });
                if(tPids.length===0)return null;
                return <div style={{marginTop:8}}>
                  <h4 style={{fontWeight:800,fontSize:11,color:K.blue,marginBottom:4}}>⚾ PITCHERS — {label}</h4>
                  <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:350}}>
                    <thead><tr style={{color:K.muted,borderBottom:`1px solid ${K.border}`}}>
                      {["PITCHER","IP","H","CL","BB","K","LANZ","ERA"].map(c=><th key={c} style={{textAlign:c==="PITCHER"?"left":"center",padding:4,fontSize:9}}>{c}</th>)}
                    </tr></thead>
                    <tbody>{tPids.map(pid=>{
                      const ps=getPitcherGameStats(pid as string);const pName=plays.find((p:any)=>p.pitcherId===pid)?.pitcherName||"?";
                      const era=parseFloat(ps.ip)>0?((ps.cl*7)/parseFloat(ps.ip)).toFixed(2):"0.00";
                      return<tr key={pid as string} style={{borderBottom:`1px solid ${K.border}`}}>
                        <td style={{padding:4,fontWeight:700}}>{pName}</td>
                        <td style={{textAlign:"center",padding:4,fontWeight:700,color:K.accent}}>{ps.ip}</td>
                        <td style={{textAlign:"center",padding:4}}>{ps.h}</td>
                        <td style={{textAlign:"center",padding:4,color:K.red}}>{ps.cl}</td>
                        <td style={{textAlign:"center",padding:4}}>{ps.bb}</td>
                        <td style={{textAlign:"center",padding:4,fontWeight:700}}>{ps.K}</td>
                        <td style={{textAlign:"center",padding:4}}>{ps.pitches}</td>
                        <td style={{textAlign:"center",padding:4,fontWeight:900,color:K.blue}}>{era}</td></tr>;})}</tbody>
                  </table></div></div>;
              })()}
            </div>))}
          <button onClick={()=>setShowTraditional(false)} style={{...S.btn("ghost"),width:"100%",marginTop:12}}>Cerrar</button>
        </div></div>}
    </div>);
}

// ═══ WATCH GAME ═══
export function WatchGame({ data, id, nav }: any) {
  const [game,setGame]=useState<any>(null);
  useEffect(()=>{const u=F.onDoc("games",id!,setGame);return()=>u&&u();},[id]);
  if(!game)return<div style={{...S.sec,textAlign:"center",padding:40}}><IcoBall size={40} color={K.accent} style={{animation:"spin 1.5s linear infinite",margin:"0 auto 12px"}}/></div>;
  const aw=data.teams.find((t:any)=>t.id===game.awayTeamId);const hm=data.teams.find((t:any)=>t.id===game.homeTeamId);
  const isTop=game.half==="top";const batTm=isTop?aw:hm;
  const recentPlays=[...(game.plays||[])].filter((p:any)=>p.result).reverse().slice(0,12);
  const R:any={"1B":{l:"Sencillo",i:"🏏"},"2B":{l:"Doble",i:"✌️"},"3B":{l:"Triple",i:"🔱"},HR:{l:"Jonrón",i:"💥"},BB:{l:"Base/Bolas",i:"👁"},K:{l:"Ponche",i:"💨"},OUT:{l:"Out",i:"❌"},FLY:{l:"Fly",i:"🔼"},GROUND:{l:"Rodado",i:"⬇️"},DP:{l:"Doble Play",i:"✖️"},SAC:{l:"Sacrificio",i:"🎯"},HBP:{l:"Golpeado",i:"😤"},E:{l:"Error",i:"🫣"},WP:{l:"Wild Pitch",i:"🤷"},SB:{l:"BR",i:"🏃"},CS:{l:"Atrapado",i:"🚔"},PB:{l:"Passed Ball",i:"🧤"},BALK:{l:"Balk",i:"🚫"}};
  if(game.status==="final")return(
    <div style={S.sec}><div style={{...S.card,padding:24,textAlign:"center"}}>
      <span style={{fontSize:40,display:"block",marginBottom:12}}>🏆</span><h2 style={{fontWeight:900,fontSize:22,marginBottom:8}}>Juego Finalizado</h2>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:16}}>
        {[{t:aw,s:game.awayScore,o:game.homeScore},{t:hm,s:game.homeScore,o:game.awayScore}].map((x,i)=>(
          <div key={i} style={{textAlign:"center"}}><TeamLogo team={x.t} size={48}/><div style={{fontWeight:700,fontSize:13,marginTop:4}}>{x.t?.name}</div>
            <div style={{fontWeight:900,fontSize:32,color:x.s>x.o?K.accent:K.dim}}>{x.s}</div></div>))}
      </div>
      <button onClick={()=>nav("calendar","boxscore",id)} style={{...S.btn("ghost"),width:"100%",marginBottom:8}}>Ver Box Score</button>
      <button onClick={()=>nav("home")} style={S.btn("primary")}>Volver</button></div></div>);
  return(
    <div style={S.sec}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14}}><span style={{...S.badge(K.live),animation:"pulse 2s infinite"}}>● EN VIVO</span></div>
      <Scoreboard game={game} aw={aw} hm={hm} isTop={isTop} batTm={batTm}/>
      {recentPlays.length>0&&<div style={{...S.card}}>
        <div style={{background:K.accentDk,padding:"8px 14px"}}><span style={{fontWeight:900,fontSize:11,color:K.accent}}>📋 JUGADA A JUGADA</span></div>
        <div style={{padding:8}}>{recentPlays.map((p:any,i:number)=>{const r=R[p.result]||{l:p.result,i:"⚾"};return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 4px",borderBottom:i<recentPlays.length-1?`1px solid ${K.border}`:"none"}}>
            <span>{r.i}</span><span style={{fontWeight:700,fontSize:12,flex:1}}>{p.playerName}</span>
            <span style={{...S.badge(K.muted),fontSize:9}}>{r.l}</span>
            {p.ci>0&&<span style={{fontSize:10,color:K.accent,fontWeight:700}}>+{p.ci}CI</span>}
            {p.isEarned===false&&<span style={{fontSize:8,color:K.yellow}}>UER</span>}
            <span style={{fontSize:9,color:K.muted}}>E{p.inning}{p.half==="top"?"▲":"▼"}</span></div>);})}</div></div>}
      <div style={{...S.card,padding:20,textAlign:"center",marginTop:14}}>
        <IcoEye size={28} color={K.accent} style={{margin:"0 auto 10px"}}/><p style={{color:K.dim,fontSize:14}}>Se actualiza automáticamente</p></div>
    </div>);
}