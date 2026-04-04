import { useState, useEffect } from "react";
import { F } from "../../config/firebase.ts";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoPlay, IcoEye, IcoBall, IcoCal } from "../../components/Icons.tsx";
import { TeamLogo, Empty, Modal } from "../../components/UI.tsx";

// ── 🧠 LÓGICA DE AVANCES Y RUTAS ──
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
const POS_COORDS:any = { 1:{x:90,y:105}, 2:{x:90,y:175}, 3:{x:180,y:70}, 4:{x:135,y:5}, 5:{x:0,y:70}, 6:{x:45,y:5}, 7:{x:-15,y:-35}, 8:{x:90,y:-50}, 9:{x:195,y:-35} };

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

// ═══ SETUP DE ALINEACIONES PRE-JUEGO ═══
function PreGameSetup({ game, data, up, nav }: any) {
  const aw = data.teams.find((t:any) => t.id === game.awayTeamId);
  const hm = data.teams.find((t:any) => t.id === game.homeTeamId);
  const awRoster = data.players.filter((p:any) => p.teamId === game.awayTeamId);
  const hmRoster = data.players.filter((p:any) => p.teamId === game.homeTeamId);

  const [tab, setTab] = useState<"away"|"home">("away");
  const [awLu, setAwLu] = useState<any[]>(game.awayLineup || []);
  const [hmLu, setHmLu] = useState<any[]>(game.homeLineup || []);

  const POS_OPTIONS = ["P(1)","C(2)","1B(3)","2B(4)","3B(5)","SS(6)","LF(7)","CF(8)","RF(9)","BD"];

  const roster = tab === "away" ? awRoster : hmRoster;
  const lu = tab === "away" ? awLu : hmLu;
  const setLu = tab === "away" ? setAwLu : setHmLu;

  const togglePlayer = (p: any) => {
    if (lu.find(x => x.id === p.id)) {
      setLu(lu.filter(x => x.id !== p.id));
    } else {
      if (lu.length >= 9) return alert("La alineación inicial solo puede tener 9 jugadores. El resto entra por sustitución.");
      const unassigned = POS_OPTIONS.find(pos => !lu.find(x=>x.fieldPos === pos)) || "P(1)";
      setLu([...lu, { id: p.id, name: p.name, number: p.number, position: p.position, fieldPos: unassigned }]);
    }
  };

  const move = (idx: number, dir: number) => {
    if (idx + dir < 0 || idx + dir >= lu.length) return;
    const n = [...lu]; [n[idx], n[idx+dir]] = [n[idx+dir], n[idx]]; setLu(n);
  };

  const changePos = (idx: number, pos: string) => { const n = [...lu]; n[idx].fieldPos = pos; setLu(n); };

  const autoFill = () => {
    const needed = roster.filter((p:any) => !lu.find(x => x.id === p.id)).slice(0, Math.max(0, 9 - lu.length));
    const unassigned = POS_OPTIONS.filter(pos => !lu.find(x=>x.fieldPos === pos));
    const n = [...lu, ...needed.map((p:any) => ({ id: p.id, name: p.name, number: p.number, position: p.position, fieldPos: unassigned.shift() || "P(1)" }))];
    setLu(n);
  };

  const start = async () => {
    if (awLu.length !== 9) return alert(`Alineación incompleta: ${aw?.name} debe tener exactamente 9 bateadores.`);
    if (hmLu.length !== 9) return alert(`Alineación incompleta: ${hm?.name} debe tener exactamente 9 bateadores.`);
    if (!awLu.find(p=>p.fieldPos==="P(1)")) return alert(`${aw?.name} necesita asignar a un Lanzador P(1).`);
    if (!hmLu.find(p=>p.fieldPos==="P(1)")) return alert(`${hm?.name} necesita asignar a un Lanzador P(1).`);

    await up({
      status: "live",
      awayLineup: awLu, homeLineup: hmLu,
      awayStartingPitcher: awLu.find(p=>p.fieldPos==="P(1)"),
      homeStartingPitcher: hmLu.find(p=>p.fieldPos==="P(1)"),
      currentPitcher: hmLu.find(p=>p.fieldPos==="P(1)"),
      awayScore:0, homeScore:0, awayInnings:[], homeInnings:[],
      awayHits:0, homeHits:0, awayErrors:0, homeErrors:0, awayE:0, homeE:0,
      inning:1, half:"top", outs:0, bases:[null,null,null], count:{balls:0,strikes:0}, plays:[],
      awayBatterIdx: 0, homeBatterIdx: 0
    });
  };

  return (
    <div style={{...S.sec, maxWidth: 800, margin: "0 auto", paddingBottom: 80}}>
      <div style={{display:"flex", gap:8, marginBottom:16, alignItems:"center"}}>
        <button onClick={()=>nav("home")} style={{...S.btn("ghost"), padding:"6px 12px"}}>← Volver</button>
        <h2 style={{...S.secT, margin:0, flex:1, textAlign:"center"}}>Alineaciones</h2>
      </div>
      
      <div style={{display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${K.border}`, marginBottom:16}}>
        <button onClick={()=>setTab("away")} style={{flex:1, padding:12, fontWeight:900, background:tab==="away"?K.accent:K.input, color:tab==="away"?"#fff":K.muted, border:"none", cursor:"pointer"}}>{aw?.abbr} (Visitante)</button>
        <button onClick={()=>setTab("home")} style={{flex:1, padding:12, fontWeight:900, background:tab==="home"?K.blue:K.input, color:tab==="home"?"#fff":K.muted, border:"none", cursor:"pointer"}}>{hm?.abbr} (Home)</button>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16}}>
        <div style={{...S.card, padding:12}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <h3 style={{fontWeight:900, fontSize:13, color:K.text}}>Orden al Bate ({lu.length}/9)</h3>
            <button onClick={autoFill} style={{fontSize:10, padding:"4px 8px", background:K.input, border:`1px solid ${K.border}`, color:K.accent, borderRadius:6, cursor:"pointer"}}>⚡ Llenado Rápido</button>
          </div>
          <div style={{maxHeight: "50vh", overflowY: "auto", paddingRight:4}}>
            {lu.map((p, i) => (
              <div key={p.id} style={{display:"flex", alignItems:"center", gap:6, padding:"6px 0", borderBottom:`1px solid ${K.border}44`}}>
                <div style={{display:"flex", flexDirection:"column", gap:2}}>
                  <button onClick={()=>move(i, -1)} disabled={i===0} style={{background:"none", border:"none", color:i===0?K.border:K.muted, cursor:i===0?"default":"pointer", padding:2, fontSize:12}}>▲</button>
                  <button onClick={()=>move(i, 1)} disabled={i===lu.length-1} style={{background:"none", border:"none", color:i===lu.length-1?K.border:K.muted, cursor:i===lu.length-1?"default":"pointer", padding:2, fontSize:12}}>▼</button>
                </div>
                <div style={{width:20, fontWeight:900, fontSize:12, color:K.accent, textAlign:"center"}}>{i+1}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:800, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>#{p.number} {p.name}</div>
                </div>
                <select value={p.fieldPos} onChange={(e)=>changePos(i, e.target.value)} style={{background:K.input, border:`1px solid ${K.border}`, color:K.text, borderRadius:6, padding:"4px 2px", fontSize:11, fontWeight:800, outline:"none", cursor:"pointer"}}>
                  {POS_OPTIONS.map(po => <option key={po} value={po}>{po}</option>)}
                </select>
                <button onClick={()=>togglePlayer(p)} style={{background:"none", border:"none", color:K.red, fontSize:14, padding:4, cursor:"pointer"}}>✕</button>
              </div>
            ))}
            {lu.length === 0 && <div style={{textAlign:"center", color:K.muted, fontSize:11, padding:20}}>Toca jugadores del roster para agregar a la alineación</div>}
          </div>
        </div>

        <div style={{...S.card, padding:12}}>
          <h3 style={{fontWeight:900, fontSize:13, color:K.muted, marginBottom:10}}>Roster Disponible (Banca)</h3>
          <div style={{display:"flex", flexDirection:"column", gap:4, maxHeight: "50vh", overflowY: "auto", paddingRight:4}}>
            {roster.filter((p:any) => !lu.find(x => x.id === p.id)).map((p:any) => (
              <button key={p.id} onClick={()=>togglePlayer(p)} style={{display:"flex", alignItems:"center", gap:8, padding:8, background:K.input, border:`1px solid ${K.border}`, borderRadius:8, color:K.text, cursor:"pointer", textAlign:"left"}}>
                <span style={{fontWeight:900, color:K.accent}}>+</span>
                <span style={{fontWeight:800, fontSize:12}}>#{p.number} {p.name}</span>
                <span style={{fontSize:10, color:K.muted}}>{p.position}</span>
              </button>
            ))}
            {roster.length === 0 && <div style={{fontSize:11, color:K.muted}}>No hay jugadores disponibles en el roster</div>}
          </div>
        </div>
      </div>

      <div style={{position:"fixed", bottom:0, left:0, right:0, padding:16, background:K.bg, borderTop:`1px solid ${K.border}`, zIndex:100}}>
        <button onClick={start} style={{...S.btn("primary"), width:"100%", padding:14, fontSize:14}}>🚀 INICIAR JUEGO (Play Ball)</button>
      </div>
    </div>
  );
}

// ═══ MOTOR PRINCIPAL DEL ANOTADOR EN VIVO ═══
export function LiveGame({ data, id, nav }: any) {
  const [game,setGame] = useState<any>(null);
  const [showComplex,setShowComplex] = useState(false);
  const [showPitcher,setShowPitcher] = useState(false);
  const [showTraditional,setShowTraditional] = useState(false);
  const [showSub,setShowSub] = useState<{side:"away"|"home",idx:number}|null>(null);
  const [showConfirm,setShowConfirm] = useState<any>(null);
  const [showRunnerAction,setShowRunnerAction] = useState<{type:"SB"|"CS"|"PK"}|null>(null);

  const [showBatazo, setShowBatazo] = useState(false);
  const [fieldRoute, setFieldRoute] = useState<number[]>([]);

  useEffect(() => { const u = F.onDoc("games", id!, setGame); return () => u && u(); }, [id]);

  if (!game) return <div style={{...S.sec,textAlign:"center",padding:40}}><IcoBall size={40} color={K.accent} style={{animation:"spin 1.5s linear infinite",margin:"0 auto"}}/></div>;

  if (game.status === "scheduled" || !game.awayLineup || game.awayLineup.length === 0) {
    return <PreGameSetup game={game} data={data} up={async (u:any)=>await F.set("games",id!,u)} nav={nav} />;
  }

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
  
  const up = async (u:any) => {
    const np = u.plays || plays;
    if (np && np.length > 0) {
      u.awayHits = np.filter((p:any)=>p.team==="away"&&["1B","2B","3B","HR"].includes(p.result)).length;
      u.homeHits = np.filter((p:any)=>p.team==="home"&&["1B","2B","3B","HR"].includes(p.result)).length;
      u.awayErrors = np.filter((p:any)=>p.result==="E"&&p.team==="home").length;
      u.homeErrors = np.filter((p:any)=>p.result==="E"&&p.team==="away").length;
      u.awayE = u.awayErrors; 
      u.homeE = u.homeErrors;
    }
    await F.set("games",id!,u);
  };
  
  const noPitcher = !pitcher;

  const batIdx = isTop ? (game.awayBatterIdx||0) : (game.homeBatterIdx||0);
  const batIdxKey = isTop ? "awayBatterIdx" : "homeBatterIdx";
  const currentBatter = batLineup[batIdx % batLineup.length] || null;
  const batterObj = currentBatter ? {id: currentBatter.id, name: currentBatter.name} : {id:"ghost", name:"Bateador"};
  const pitcherPitchCount = pitcher ? plays.filter((p:any) => p.pitcherId === pitcher.id && p.isPitch).length : 0;

  const rawBases = game.bases || [null, null, null];
  const bases = rawBases.map((b: any) => b === true ? {id: "ghost", name: "Corredor"} : (b === false ? null : b));

  const getAvailSubs = (side: "away" | "home") => {
    const r = data.players.filter((p:any) => p.teamId === (side==="away"?game.awayTeamId:game.homeTeamId));
    const lu = side === "away" ? (game.awayLineup||[]) : (game.homeLineup||[]);
    return r.filter((p:any) => !lu.find((x:any) => x.id === p.id));
  };

  const doSub = async (side: "away" | "home", idx: number, newPlayer: any) => {
    const key = side === "away" ? "awayLineup" : "homeLineup";
    const lu = [...(game[key]||[])];
    const oldPos = lu[idx].fieldPos;
    lu[idx] = { id: newPlayer.id, name: newPlayer.name, number: newPlayer.number, position: newPlayer.position, fieldPos: oldPos };
    await up({ [key]: lu });
    setShowSub(null);
  };

  const buildDefenseMap = () => {
    const map:Record<number,string> = {};
    pitchLineup.forEach((p:any) => { if(p.fieldPos){ const num = parseInt(p.fieldPos.match(/\((\d)\)/)?.[1]||"0"); if(num) map[num] = p.id; } });
    return map;
  };

  // Motor Estadístico Mejorado (Suma Juego + Temporada para AVG real)
  const getStats = (pid:string) => {
    let vb=0,h=0,hr=0,ci=0,ca=0,bb=0,k=0,db=0,tb=0,sb=0,pa=0,e=0;
    plays.forEach((p:any) => { 
      if (p.errorPlayerId === pid) e++; 
      if (p.playerId !== pid) return; 
      if (p.result !== "RUN" && p.result !== "SB" && p.result !== "CS" && p.result !== "PK") pa++; 
      if (["1B","2B","3B","HR"].includes(p.result)) { vb++; h++; if(p.result==="2B")db++; if(p.result==="3B")tb++; if(p.result==="HR")hr++; }
      else if (["BB","IBB","HBP"].includes(p.result)) bb++;
      else if (["OUT","FLY","GROUND","K","DP","FC"].includes(p.result)) { vb++; if(p.result==="K")k++; }
      else if (p.result === "E") vb++;
      ci += (p.ci||0); ca += (p.ca||0); if(p.result==="SB")sb++;
    });
    
    const player = data.players.find((p:any) => p.id === pid);
    const hist = player?.batting || {};
    const tVB = (hist.VB || 0) + vb;
    const tH = (hist.H || 0) + h;
    const avgStr = tVB > 0 ? (tH/tVB).toFixed(3) : ".000";
    const avg = avgStr.startsWith("0.") ? avgStr.substring(1) : avgStr;

    return { vb,h,hr,ci,ca,bb,k,db,tb,sb,pa,e, avg, summary: `${h}-${vb}${hr>0?`, ${hr}HR`:""}${ci>0?`, ${ci}CI`:""}` };
  };

  const getPitStats = (pid:string) => {
    let h=0,bb=0,k=0,cl=0,outs=0,pitches=0;
    plays.forEach((p:any) => { if(p.pitcherId!==pid) return; if(p.isPitch) pitches++; if(!p.result) return;
      if(["1B","2B","3B","HR","E"].includes(p.result)) h++;
      if(["BB","IBB","HBP"].includes(p.result)) bb++;
      if(p.result==="K") k++;
      if(["OUT","FLY","GROUND","K","SAC","FC"].includes(p.result)) outs++;
      if(p.result==="DP") outs+=2;
      if(p.isEarned!==false) cl+=(p.ci||0);
    });

    const player = data.players.find((p:any) => p.id === pid);
    const hist = player?.pitching || {};
    const tIP = (hist.IL || 0) + (outs / 3);
    const tCL = (hist.CL || 0) + cl;
    const era = tIP > 0 ? ((tCL * 7) / tIP).toFixed(2) : "0.00";

    return { h,bb,K:k,cl,outs,pitches, ip:(Math.floor(outs/3)+(outs%3)/10).toFixed(1), hld:h, bba:bb, era };
  };

  const getDefName = (pos: string) => { const p = pitchLineup.find((x:any) => x.fieldPos === pos); if (!p) return ""; const n = p.name.split(" "); return n.length > 1 ? `${n[0].charAt(0)}. ${n[n.length-1]}` : n[0]; };

  const resetCount = () => ({balls:0,strikes:0});
  const nextBatter = () => batLineup.length===0 ? batIdx : (batIdx+1)%batLineup.length;
  
  const scoreRuns = (runs:number) => { 
    if(runs<=0) return {}; 
    const k=isTop?"awayScore":"homeScore"; 
    const ik=isTop?"awayInnings":"homeInnings"; 
    const ni=[...(game[ik]||[])]; 
    for(let i=0; i<game.inning; i++) { if(ni[i] == null) ni[i] = 0; }
    ni[game.inning-1] = ni[game.inning-1] + runs; 
    return {[k]:(game[k]||0)+runs,[ik]:ni}; 
  };

  const changeHalf = (u:any) => {
    u.outs=0; u.bases=[null,null,null]; u.count=resetCount();
    if(isTop) {
      u.half="bottom";
      const ai=[...(u.awayInnings || game.awayInnings || [])]; 
      for(let i=0; i<game.inning; i++) { if(ai[i] == null) ai[i]=0; }
      u.awayInnings=ai;
      const asp=game.awayStartingPitcher; if(asp) u.currentPitcher={id:asp.id,name:asp.name,number:asp.number};
    } else {
      const hi=[...(u.homeInnings || game.homeInnings || [])]; 
      for(let i=0; i<game.inning; i++) { if(hi[i] == null) hi[i]=0; }
      u.homeInnings=hi; 
      u.inning=game.inning+1; 
      u.half="top";
      const hsp=game.homeStartingPitcher; if(hsp) u.currentPitcher={id:hsp.id,name:hsp.name,number:hsp.number};
    }
  };

  const makePlay = (result:string, extra:any={}) => ({
    playerId:currentBatter?.id, playerName:currentBatter?.name||"?",
    teamId:isTop?game.awayTeamId:game.homeTeamId, team:isTop?"away":"home", result,
    ci:0, ca:0, isEarned:true,
    pitcherId:pitcher?.id||null, pitcherName:pitcher?.name||null,
    isPitch:true, inning:game.inning, half:game.half, timestamp:Date.now(), 
    defenseMap: buildDefenseMap(), ...extra,
  });

  const processPlayAndCheckGameOver = async (u: any, numOutsToAdd: number = 0) => {
    let o = (game.outs || 0) + numOutsToAdd;
    const totInn = game.totalInnings || 9;
    const awScore = u.awayScore !== undefined ? u.awayScore : (game.awayScore || 0);
    const hmScore = u.homeScore !== undefined ? u.homeScore : (game.homeScore || 0);
    const inn = game.inning;

    if (!isTop && inn >= totInn && hmScore > awScore) {
      u.outs = Math.min(o, 3);
      await up(u);
      await finishGame(u.plays || plays);
      return;
    }

    if (o >= 3) {
      u.outs = 3; 
      if (isTop && inn >= totInn && hmScore > awScore) {
        await up(u);
        await finishGame(u.plays || plays);
        return;
      }
      if (!isTop && inn >= totInn && hmScore !== awScore) {
        await up(u);
        await finishGame(u.plays || plays);
        return;
      }
      changeHalf(u);
      await up(u);
    } else {
      u.outs = o;
      await up(u);
    }
  };

  const prepareHit = (type:string) => {
    if(noPitcher){setShowPitcher(true);return;}
    const{newBases,runnersScored}=advanceBases(bases, type, batterObj);
    setShowConfirm({type,suggestedRuns:runnersScored.length,runs:runnersScored.length,newBases,runnersScored,ca:type==="HR"?1:0, extra: type==="E" ? {isEarned:false} : {}});
  };
  
  const confirmHit = async () => {
    try {
      if(!showConfirm) return; 
      // Validación Estricta de Error ("E")
      if (showConfirm.type === "E" && !showConfirm.extra?.errorPlayerId) return alert("⚠️ Debes seleccionar al fildeador que cometió el Error.");
      
      const { type, runs, newBases, runnersScored } = showConfirm;
      let rbi = (type === "DP" || type === "E") ? 0 : runs;
      
      const play = makePlay(type, { ci: rbi, ca: type === "HR" ? 1 : 0, runsScoredOnPlay: runs, ...(showConfirm.extra || {}) });
      
      let realRunners = [...(runnersScored || [])];
      if (realRunners.length < runs) {
         for(let i=realRunners.length; i<runs; i++) realRunners.push({id:"ghost", name:"Corredor"});
      }
      
      const runPlays = realRunners.slice(0, runs)
         .filter((r:any) => r && r.id !== currentBatter?.id)
         .map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      
      let outsToAdd = 0;
      if (["GROUND", "FLY", "FC", "SAC"].includes(type)) outsToAdd = 1;
      else if (type === "DP") outsToAdd = 2;

      const u: any = {
         plays: [...plays, play, ...runPlays],
         bases: newBases,
         count: resetCount(),
         [batIdxKey]: nextBatter(),
         ...scoreRuns(runs)
      };
      
      await processPlayAndCheckGameOver(u, outsToAdd);
      setShowConfirm(null);
    } catch (err) {
      console.error("Error crítico guardando jugada:", err);
      alert("Ocurrió un error guardando la jugada. Revisa tu conexión.");
    }
  };

  const addBall = async (isIBB:boolean = false) => {
    if(noPitcher){setShowPitcher(true);return;}
    const b = isIBB ? 4 : (count.balls||0)+1;
    if(b>=4){ 
      const{newBases,runnersScored}=walkBases(bases, batterObj);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      const u = {plays:[...plays,makePlay(isIBB?"IBB":"BB",{ci:runnersScored.length, runsScoredOnPlay: runnersScored.length}), ...runPlays],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runnersScored.length)};
      await processPlayAndCheckGameOver(u, 0);
    } else await up({plays:[...plays,{pitcherId:pitcher?.id,pitcherName:pitcher?.name,isPitch:true,timestamp:Date.now(),inning:game.inning,half:game.half}],count:{...count,balls:b}});
  };

  const addStrike = async (type:"called"|"swinging"|"foul") => {
    if(noPitcher){setShowPitcher(true);return;}
    const s=(count.strikes||0)+1;
    const pp={pitcherId:pitcher?.id,pitcherName:pitcher?.name,isPitch:true,pitchType:type,timestamp:Date.now(),inning:game.inning,half:game.half};
    if(type==="foul"&&s>=3){await up({plays:[...plays,pp]});return;}
    if(s>=3){ 
      const play=makePlay("K"); const np=[...plays,play]; 
      const u:any={plays:np,count:resetCount(),[batIdxKey]:nextBatter()};
      await processPlayAndCheckGameOver(u, 1);
    } else await up({plays:[...plays,pp],count:{...count,strikes:s}});
  };

  const registerOut = async (type: string) => {
    if(noPitcher){setShowPitcher(true);return;}
    const play=makePlay(type); const np=[...plays,play]; 
    const u:any={plays:np,count:resetCount(),[batIdxKey]:nextBatter()};
    await processPlayAndCheckGameOver(u, 1);
  };

  const toggleRouteNode = (num:number) => {
    if(fieldRoute.includes(num)) setFieldRoute(fieldRoute.filter(x=>x!==num));
    else setFieldRoute([...fieldRoute, num]);
  };

  const executeFielding = async (type: "OUT" | "FLY" | "DP" | "FC" | "E" | "SAC") => {
    const realType = type === "OUT" ? "GROUND" : type;
    const lastPos = fieldRoute[fieldRoute.length-1] || 6;
    const defPlayer = pitchLineup.find((p:any) => p.fieldPos?.includes(`(${lastPos})`));
    
    let initialBases = [...bases];
    let rScored: any[] = [];
    let cRuns = 0;
    
    if (realType === "E") {
       const adv = advanceBases(bases,"E", batterObj); 
       initialBases = adv.newBases; 
       rScored = adv.runnersScored; 
       cRuns = rScored.length;
    } else if (realType === "FC") {
       initialBases[0] = batterObj; 
    } else if (realType === "DP") {
       if (initialBases[0]) initialBases[0] = null;
       else if (initialBases[1]) initialBases[1] = null;
       else if (initialBases[2]) initialBases[2] = null;
    }

    const extraData: any = { route: fieldRoute };
    if (realType === "E") {
      extraData.errorPosition = lastPos;
      extraData.errorPlayerId = defPlayer?.id || null;
      extraData.errorPlayerName = defPlayer?.name || null;
      extraData.isEarned = false;
    } else if (realType === "SAC") {
      extraData.isSacrifice = true;
    }

    setShowBatazo(false);
    setShowConfirm({
      type: realType, suggestedRuns: cRuns, runs: cRuns, newBases: initialBases, runnersScored: rScored, ca: 0,
      extra: extraData
    });
  };

  const executeRunnerAction = async (type:"SB"|"CS"|"PK", baseIdx:number, runner:any) => {
    const nb=[...bases]; nb[baseIdx]=null;
    if(type==="SB"){ 
      let runs=0; let scored = []; 
      if(baseIdx===2){ runs=1; scored.push(runner); } else { nb[baseIdx+1]=runner; }
      const runPlays = scored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      const u = {plays:[...plays,{...makePlay("SB",{ci:0,isPitch:false, runsScoredOnPlay: runs}),playerId:runner.id,playerName:runner.name}, ...runPlays],bases:nb,...(runs>0?scoreRuns(runs):{})};
      await processPlayAndCheckGameOver(u, 0);
    } else { 
      const route = type==="PK" ? [1, baseIdx===0?3:baseIdx===1?4:5] : [2, baseIdx===0?3:baseIdx===1?4:5];
      const play={...makePlay(type,{isPitch:false, route}),playerId:runner.id,playerName:runner.name};
      const np=[...plays,play]; const u:any={plays:np,bases:nb}; 
      await processPlayAndCheckGameOver(u, 1);
    }
    setShowRunnerAction(null); setShowComplex(false);
  };

  const registerComplex = async (type:string) => {
    if(noPitcher&&type!=="SB"&&type!=="CS"){setShowPitcher(true);return;}
    if(type==="IBB"){ addBall(true); }
    else if(type==="HBP"){ const{newBases,runnersScored}=walkBases(bases, batterObj);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      const u = {plays:[...plays,makePlay("HBP",{ci:runnersScored.length, runsScoredOnPlay: runnersScored.length}), ...runPlays],bases:newBases,count:resetCount(),[batIdxKey]:nextBatter(),...scoreRuns(runnersScored.length)};
      await processPlayAndCheckGameOver(u, 0);
    } else if(type==="SB"||type==="CS"||type==="PK"){ 
      const rOn=bases.map((b:any,i:number)=>({idx:i,runner:b})).filter((r:any)=>r.runner !== null);
      if(rOn.length===0){setShowComplex(false);return;}
      if(rOn.length===1) executeRunnerAction(type,rOn[0].idx, rOn[0].runner);
      else setShowRunnerAction({type});
    } else if(type==="WP" || type==="PB" || type==="BALK"){ const{newBases,runnersScored}=advanceAllRunners(bases);
      const runPlays = runnersScored.map((r:any) => ({...makePlay("RUN", {ca:1, isPitch:false}), playerId: r.id, playerName: r.name}));
      const isEarned = type !== "PB";
      const u = {plays:[...plays,{...makePlay(type,{ci:0,isEarned,isPitch:false, runsScoredOnPlay: runnersScored.length}),playerId:null,playerName:type==="PB"?"Receptor":pitcher?.name||"Pitcher"}, ...runPlays],bases:newBases,...scoreRuns(runnersScored.length)};
      await processPlayAndCheckGameOver(u, 0);
    }
    setShowComplex(false);
  };

  const undoLastPlay = async () => {
    if(plays.length===0)return; if(!confirm("¿Deshacer?"))return;
    const rm=plays[plays.length-1]; const np=plays.slice(0,-1); const u:any={plays:np};
    if(rm.result&&rm.playerId){ const runs=(rm.ci||0)+(rm.ca||0);
      if(runs>0){const k=rm.team==="away"?"awayScore":"homeScore";const ik=rm.team==="away"?"awayInnings":"homeInnings";
        u[k]=Math.max(0,(game[k]||0)-runs);const ni=[...(game[ik]||[])];
        if (ni[rm.inning-1] != null) ni[rm.inning-1]=Math.max(0,ni[rm.inning-1]-runs);
        u[ik]=ni;}
      const bk=rm.team==="away"?"awayBatterIdx":"homeBatterIdx";const ln=rm.team==="away"?(game.awayLineup||[]):(game.homeLineup||[]);
      u[bk]=(game[bk]||0)>0?(game[bk]||0)-1:ln.length-1;
    } await up(u);
  };

  const finishGame = async (gp:any[]) => {
    await up({status:"final"});
    if(aw){const u=game.awayScore>game.homeScore?{wins:(aw.wins||0)+1}:game.awayScore<game.homeScore?{losses:(aw.losses||0)+1}:{draws:(aw.draws||0)+1};await F.set("teams",aw.id,u);}
    if(hm){const u=game.homeScore>game.awayScore?{wins:(hm.wins||0)+1}:game.homeScore<game.awayScore?{losses:(hm.losses||0)+1}:{draws:(hm.draws||0)+1};await F.set("teams",hm.id,u);}
    
    const ba:Record<string,any>={}; 
    const pa:Record<string,any>={}; 
    const fa:Record<string,any>={}; 

    gp.forEach((p:any)=>{
      if(p.defenseMap && p.route && p.route.length > 0) {
        if (p.result === "E") {
          const errId = p.errorPlayerId || p.defenseMap[p.route[p.route.length - 1]];
          if (errId) { if(!fa[errId]) fa[errId]={PO:0,A:0,E:0,DP:0}; fa[errId].E++; }
        } else {
          const poId = p.defenseMap[p.route[p.route.length - 1]];
          if (poId) { if(!fa[poId]) fa[poId]={PO:0,A:0,E:0,DP:0}; fa[poId].PO++; }
          for (let i = 0; i < p.route.length - 1; i++) {
            const aId = p.defenseMap[p.route[i]];
            if (aId) { if(!fa[aId]) fa[aId]={PO:0,A:0,E:0,DP:0}; fa[aId].A++; }
          }
          if (p.result === "DP") {
             p.route.forEach((pos:number) => { const dpId = p.defenseMap[pos]; if (dpId) { if(!fa[dpId]) fa[dpId]={PO:0,A:0,E:0,DP:0}; fa[dpId].DP++; }});
          }
        }
      } else if (p.result === "E" && p.errorPlayerId) { 
        if(!fa[p.errorPlayerId]) fa[p.errorPlayerId]={PO:0,A:0,E:0,DP:0}; fa[p.errorPlayerId].E++;
      }

      if(p.playerId){
        if(!ba[p.playerId])ba[p.playerId]={VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0,E:0}; const s=ba[p.playerId];
        if(["1B","2B","3B","HR"].includes(p.result)){s.VB++;s.H++;if(p.result==="2B")s["2B"]++;if(p.result==="3B")s["3B"]++;if(p.result==="HR")s.HR++;}
        else if(["BB","IBB","HBP"].includes(p.result))s.BB++; 
        else if(["OUT","FLY","GROUND","K","DP","E","FC"].includes(p.result)){s.VB++;if(p.result==="K")s.K++;}
        s.CI+=(p.ci||0);s.CA+=(p.ca||0);if(p.result==="SB")s.BR++;
      }
      
      if(p.pitcherId && p.result){
        if(!pa[p.pitcherId])pa[p.pitcherId]={H:0,BB:0,K:0,CL:0,outs:0,ts:""}; const s=pa[p.pitcherId];
        if(["1B","2B","3B","HR","E"].includes(p.result))s.H++; if(["BB","IBB","HBP"].includes(p.result))s.BB++; if(p.result==="K")s.K++;
        if(["OUT","FLY","GROUND","K","SAC","FC"].includes(p.result))s.outs++; if(p.result==="DP")s.outs+=2; if(p.isEarned!==false)s.CL+=(p.ci||0);
        if(!s.ts)s.ts=(game.homeLineup||[]).find((x:any)=>x.id===p.pitcherId)?"home":"away";
      }
    });

    const allPids = new Set([...Object.keys(ba), ...Object.keys(fa)]);
    for(const pid of allPids) {
      const pl = data.players.find((p:any)=>p.id===pid); if(!pl) continue;
      const b=pl.batting||{JJ:0,VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0}; const gs = ba[pid]||{};
      const f=pl.fielding||{JJ:0,PO:0,A:0,E:0,DP:0,TC:0}; const fs = fa[pid]||{};
      const tc = (fs.PO||0) + (fs.A||0) + (fs.E||0);
      
      const payload:any = { 
        batting: gs.VB !== undefined ? {JJ:(b.JJ||0)+1,VB:(b.VB||0)+gs.VB,H:(b.H||0)+gs.H,"2B":(b["2B"]||0)+gs["2B"],"3B":(b["3B"]||0)+gs["3B"],HR:(b.HR||0)+gs.HR,CI:(b.CI||0)+gs.CI,CA:(b.CA||0)+gs.CA,BB:(b.BB||0)+gs.BB,K:(b.K||0)+gs.K,BR:(b.BR||0)+gs.BR} : b,
        fielding: fs.PO !== undefined ? {JJ:(f.JJ||0)+1, PO:(f.PO||0)+fs.PO, A:(f.A||0)+fs.A, E:(f.E||0)+fs.E, DP:(f.DP||0)+fs.DP, TC:(f.TC||0)+tc} : f
      };
      await F.set("players",pid, payload);
    }

    const ws=game.awayScore>game.homeScore?"away":game.homeScore>game.awayScore?"home":null;
    const wps=ws?Object.entries(pa).filter(([_,v]:any)=>v.ts===ws).sort((a:any,b:any)=>b[1].outs-a[1].outs):[];
    const lps=ws?Object.entries(pa).filter(([_,v]:any)=>v.ts!==ws).sort((a:any,b:any)=>b[1].outs-a[1].outs):[];
    const wpId=wps[0]?.[0]||null; const lpId=lps[0]?.[0]||null;
    
    for(const[pid,gs]of Object.entries(pa)as any){const pl=data.players.find((p:any)=>p.id===pid);if(!pl)continue;
      const pt=pl.pitching||{JJ:0,IL:0,H:0,CL:0,BB:0,K:0,G:0,P:0,JC:0};const il=Math.floor(gs.outs/3)+(gs.outs%3)/10;
      const tto=Object.entries(pa).filter(([_,v]:any)=>v.ts===gs.ts).reduce((s:number,[_,v]:any)=>s+v.outs,0);
      const isJC=gs.outs===tto&&gs.outs>=(game.totalInnings||9)*3/2;
      await F.set("players",pid,{pitching:{JJ:(pt.JJ||0)+1,IL:parseFloat(((pt.IL||0)+il).toFixed(1)),H:(pt.H||0)+gs.H,CL:(pt.CL||0)+gs.CL,BB:(pt.BB||0)+gs.BB,K:(pt.K||0)+gs.K,G:(pt.G||0)+(pid===wpId?1:0),P:(pt.P||0)+(pid===lpId?1:0),JC:(pt.JC||0)+(isJC?1:0)}});
    }
    nav("home");
  };

  const rp=[...plays].filter((p:any)=>p.result).reverse().slice(0,6);
  const awH=game.awayHits || 0;
  const hmH=game.homeHits || 0;
  const awE=game.awayErrors || game.awayE || 0; 
  const hmE=game.homeErrors || game.homeE || 0; 
  const totalCols = Math.max(game.totalInnings||9, Math.max((game.awayInnings||[]).length, (game.homeInnings||[]).length));

  const Btn=({label,icon,color,bg,onClick,size="md",disabled=false}:any)=>(
    <button onClick={onClick} disabled={disabled} style={{padding:size==="lg"?"8px 4px":"6px 4px",borderRadius:10,border:`2px solid ${color}44`,background:bg||`${color}15`,color:disabled?K.muted:color,fontWeight:900,fontSize:size==="lg"?12:10,cursor:disabled?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,width:"100%",minHeight:size==="lg"?46:36,opacity:disabled?.4:1}}>
      <span style={{fontSize:size==="lg"?16:14}}>{icon}</span><span>{label}</span></button>);
      
  const modalTitles:any = { "1B":"Confirmar Sencillo", "2B":"Confirmar Doble", "3B":"Confirmar Triple", "HR":"Confirmar Jonrón", "E":"Confirmar Error", "SAC":"Confirmar Sacrificio", "GROUND":"Confirmar Rodado (Out)", "FLY":"Confirmar Elevado", "DP":"Confirmar Doble Play", "FC":"Confirmar Jugada Selección" };
  const modalIcons:any = { "1B":"🏏","2B":"✌️","3B":"🔱","HR":"💥","E":"🫣","SAC":"🎯", "GROUND":"⬇️", "FLY":"🔼", "DP":"✖️", "FC":"⚖️" };
  const modalDescs:any = {
    "GROUND": "Bateador es OUT (1 Out). Toca las bases para colocar dónde quedaron los corredores (si avanzaron).",
    "FLY": "Bateador es OUT (1 Out). Mueve los corredores si hicieron pisa y corre.",
    "DP": "2 Outs. Bateador es OUT. Retira de base al otro corredor tocando su base.",
    "FC": "Jugada Selección (1 Out). Bateador se embasó. Retira al corredor forzado tocando su base.",
    "SAC": "Bateador es OUT (1 Out). Mueve a los corredores libremente.",
    "E": "Bateador embasado. Selecciona a quién se le carga el Error y ajusta las bases."
  };

  return (
    <div style={{background:K.bg,color:K.text,fontFamily:"'Outfit',system-ui,sans-serif",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`.sg{display:grid;grid-template-columns:200px 1fr 240px;grid-template-rows:auto 1fr auto;height:100vh;gap:0}@media(max-width:800px){.sg{grid-template-columns:1fr;grid-template-rows:auto auto auto auto auto}}.sx::-webkit-scrollbar{display:none}.sx{-ms-overflow-style:none;scrollbar-width:none}
      .node-btn { width:24px; height:24px; border-radius:12px; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; cursor:pointer; position:absolute; transform:translate(-50%,-50%); z-index:10; transition:all 0.2s; }
      `}</style>
      <div className="sg">
        {/* TOP BAR CON LINE SCORE R-H-E NATIVO Y PERFECTO */}
        <div style={{gridColumn:"1/-1",background:"#0a0e1a",borderBottom:`2px solid ${K.border}`,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <table style={{borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{color:K.muted}}>
              <th style={{padding:"2px 8px",textAlign:"left",fontSize:9}}>EQ</th>
              {Array.from({length: totalCols}).map((_:any,i:number)=><th key={i} style={{padding:"2px 4px",textAlign:"center",fontSize:9,color:game.inning===i+1?K.accent:K.muted}}>{i+1}</th>)}
              <th style={{padding:"2px 6px",textAlign:"center",fontSize:9,color:K.accent}}>R</th>
              <th style={{padding:"2px 6px",textAlign:"center",fontSize:9}}>H</th>
              <th style={{padding:"2px 6px",textAlign:"center",fontSize:9}}>E</th>
            </tr></thead>
            <tbody>{[{t:aw,inn:game.awayInnings,s:game.awayScore,h:awH,e:awE},{t:hm,inn:game.homeInnings,s:game.homeScore,h:hmH,e:hmE}].map((x,i)=>(
              <tr key={i}><td style={{padding:"3px 8px",fontWeight:800,fontSize:11,color:(i===0&&isTop)||(i===1&&!isTop)?K.accent:K.text}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}><TeamLogo team={x.t} size={14}/>{x.t?.abbr}</div></td>
                {Array.from({length: totalCols}).map((_,j:number)=>{
                  const r = (x.inn||[])[j];
                  return <td key={j} style={{padding:"3px 4px",textAlign:"center",fontWeight:700,fontSize:11,color:r!==undefined&&r!==null?K.text:K.muted}}>{r!==undefined&&r!==null?r:"—"}</td>
                })}
                <td style={{padding:"3px 6px",textAlign:"center",fontWeight:900,fontSize:14,color:K.accent}}>{x.s}</td>
                <td style={{padding:"3px 6px",textAlign:"center",fontWeight:700}}>{x.h}</td>
                <td style={{padding:"3px 6px",textAlign:"center",fontWeight:700,color:K.red}}>{x.e}</td></tr>))}
            </tbody>
          </table>
          
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>ENTRADA</div><div style={{fontSize:24,fontWeight:900,color:K.accent}}>{isTop?"▲":"▼"} {game.inning}°</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>OUTS</div><div style={{display:"flex",gap:4,marginTop:3}}>{[0,1,2].map(i=><div key={i} style={{width:16,height:16,borderRadius:8,background:i<(game.outs||0)?K.red:K.border}}/>)}</div></div></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>CONTEO</div><div style={{display:"flex",gap:8,marginTop:2}}><span style={{fontSize:20,fontWeight:900,color:K.green}}>B:{count.balls||0}</span><span style={{fontSize:20,fontWeight:900,color:K.red}}>S:{count.strikes||0}</span></div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:9,fontWeight:700,color:K.muted}}>LANZ</div><div style={{fontSize:18,fontWeight:900,color:K.blue}}>{pitcherPitchCount}</div></div>
            <button onClick={()=>setShowPitcher(true)} style={{padding:"6px 10px",borderRadius:8,background:noPitcher?K.red:K.border,border:"none",color:noPitcher?"#fff":K.dim,fontSize:10,fontWeight:700,cursor:"pointer"}}>{noPitcher?"⚠️":"🔄"} Pitcher</button>
            <button onClick={()=>{if(confirm("¿Seguro que deseas forzar el FINAL del juego?"))finishGame(plays);}} style={{padding:"6px 10px",borderRadius:8,background:K.red,border:"none",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>🏁 FIN</button></div></div>

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

        {/* CENTER DIAMOND */}
        <div style={{background:"#080c16",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:12}}>
          {noPitcher&&<div style={{padding:"8px 14px",borderRadius:10,background:`${K.red}22`,border:`1px solid ${K.red}`,marginBottom:12,textAlign:"center"}}><span style={{fontSize:11,fontWeight:700,color:K.red}}>⚠️ Asigna pitcher</span></div>}
          
          <div style={{textAlign:"center",marginBottom:45}}> 
            <div style={{fontSize:10,color:K.muted,fontWeight:700,marginBottom:4}}>DUELO</div>
            <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}><span style={{fontWeight:900,fontSize:13,color:noPitcher?K.red:K.blue}}>{pitcher?.name||"⚠️"}</span><span style={{fontSize:10,color:K.muted}}>🆚</span><span style={{fontWeight:900,fontSize:13,color:K.accent}}>{currentBatter?.name||"?"}</span></div>
          </div>
          
          <div style={{position:"relative",width:180,height:180, marginTop:15, marginBottom:20}}>
            <svg width={180} height={180} viewBox="0 0 180 180"><polygon points="90,15 165,90 90,165 15,90" fill="none" stroke={K.border} strokeWidth="2"/><line x1="90" y1="165" x2="165" y2="90" stroke={K.border} strokeWidth="1" opacity=".3"/><line x1="90" y1="165" x2="15" y2="90" stroke={K.border} strokeWidth="1" opacity=".3"/></svg>
            
            {/* DEFENSIVOS */}
            {[ {p:"C(2)",...POS_COORDS[2]}, {p:"P(1)",...POS_COORDS[1]}, {p:"1B(3)",...POS_COORDS[3]}, {p:"2B(4)",...POS_COORDS[4]}, {p:"3B(5)",...POS_COORDS[5]}, {p:"SS(6)",...POS_COORDS[6]}, {p:"LF(7)",...POS_COORDS[7]}, {p:"CF(8)",...POS_COORDS[8]}, {p:"RF(9)",...POS_COORDS[9]} ].map(d => {
              const name = getDefName(d.p); if (!name) return null;
              return <div key={d.p} style={{position:"absolute", left:d.x, top:d.y, transform:"translate(-50%,-50%)", fontSize:8, fontWeight:800, color:K.blue, background:"rgba(13, 31, 74, 0.85)", border:`1px solid ${K.blue}55`, padding:"3px 5px", borderRadius:6, zIndex:5, whiteSpace:"nowrap", textShadow:"0 1px 2px #000"}}>{d.p.split("(")[0]} {name}</div>
            })}

            <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%) rotate(45deg)",width:18,height:18,background:K.muted,borderRadius:2}}/>
            {[{idx:0,s:{right:4,top:"50%",transform:"translateY(-50%) rotate(45deg)"}},{idx:1,s:{left:"50%",top:2,transform:"translateX(-50%) rotate(45deg)"}},{idx:2,s:{left:4,top:"50%",transform:"translateY(-50%) rotate(45deg)"}}].map(b=>(
              <div key={b.idx} style={{position:"absolute",...b.s}}>
                <div onClick={async()=>{const bs=[...bases];bs[b.idx]=bs[b.idx]?null:{id:"ghost",name:"Corredor"};await up({bases:bs});}}
                     style={{width:22,height:22,borderRadius:3,cursor:"pointer",background:bases[b.idx]?K.yellow:K.border,border:`2px solid ${bases[b.idx]?K.yellow:K.muted}`,boxShadow:bases[b.idx]?`0 0 12px ${K.yellow}66`:"none",transition:"all .2s"}}/></div>))}
            
            {bases[0] && <div style={{position:"absolute", right: -40, top: "65%", transform:"translateY(-50%)", fontSize:9, fontWeight:900, color:"#000", background:K.yellow, padding:"2px 6px", borderRadius:4, zIndex:10, boxShadow:`0 2px 5px ${K.yellow}55`}}>{bases[0].name.split(" ")[0]}</div>}
            {bases[1] && <div style={{position:"absolute", left: "50%", top: -25, transform:"translateX(-50%)", fontSize:9, fontWeight:900, color:"#000", background:K.yellow, padding:"2px 6px", borderRadius:4, zIndex:10, boxShadow:`0 2px 5px ${K.yellow}55`}}>{bases[1].name.split(" ")[0]}</div>}
            {bases[2] && <div style={{position:"absolute", left: -40, top: "65%", transform:"translateY(-50%)", fontSize:9, fontWeight:900, color:"#000", background:K.yellow, padding:"2px 6px", borderRadius:4, zIndex:10, boxShadow:`0 2px 5px ${K.yellow}55`}}>{bases[2].name.split(" ")[0]}</div>}
          </div>
          <div style={{display:"flex",gap:16,marginTop:20}}>{["1ra","2da","3ra"].map((l,i)=><span key={i} style={{fontSize:10,fontWeight:700,color:bases[i]?K.yellow:K.muted}}>{l} {bases[i]?"●":"○"}</span>)}</div></div>

        {/* RIGHT ACTIONS */}
        <div style={{background:"#0d1220",borderLeft:`1px solid ${K.border}`,overflow:"auto",padding:8,display:"flex",flexDirection:"column",gap:8}}>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>PITCHEOS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <Btn label="BOLA" icon="🟢" color={K.green} onClick={()=>addBall(false)} disabled={noPitcher}/>
              <Btn label="STRIKE" icon="🔴" color={K.red} onClick={()=>addStrike("called")} disabled={noPitcher}/>
              <Btn label="SWING" icon="💨" color="#f97316" onClick={()=>addStrike("swinging")} disabled={noPitcher}/>
              <Btn label="FOUL" icon="📐" color={K.yellow} onClick={()=>addStrike("foul")} disabled={noPitcher}/></div></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>HITS Y ERROR</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <Btn label="1B" icon="🏏" color={K.accent} onClick={()=>prepareHit("1B")} size="lg" disabled={noPitcher}/>
              <Btn label="2B" icon="✌️" color="#14b8a6" onClick={()=>prepareHit("2B")} size="lg" disabled={noPitcher}/>
              <Btn label="3B" icon="🔱" color="#6366f1" onClick={()=>prepareHit("3B")} size="lg" disabled={noPitcher}/>
              <Btn label="HR" icon="💥" color={K.red} bg={`${K.red}22`} onClick={()=>prepareHit("HR")} size="lg" disabled={noPitcher}/>
              <Btn label="ERROR" icon="🫣" color="#f97316" onClick={()=>executeFielding("E")} size="lg" disabled={noPitcher}/>
            </div></div>
          <div><div style={{fontSize:9,fontWeight:900,color:K.muted,marginBottom:4,paddingLeft:4}}>OUTS DE BATAZO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              <Btn label="K (PONCHE)" icon="💨" color="#a78bfa" onClick={()=>registerOut("K")} disabled={noPitcher} size="lg"/>
              <Btn label="EN JUEGO / BATAZO" icon="⚾" color={K.blue} bg={`${K.blue}22`} onClick={()=>{if(!noPitcher){setFieldRoute([]);setShowBatazo(true);}}} disabled={noPitcher} size="lg"/>
              </div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:5}}>
            <button onClick={()=>{if(noPitcher){setShowPitcher(true);return;}setShowComplex(true);}} style={{padding:"8px 6px",borderRadius:10,border:`2px solid ${K.purple}44`,background:`${K.purple}15`,color:K.purple,fontWeight:900,fontSize:11,cursor:"pointer",textAlign:"center",minHeight:36}}>⚙️ MENÚ JUGADA COMPLEJA (Robos, Balks...)</button></div>
        </div>

        {/* BOTTOM LOG */}
        <div style={{gridColumn:"1/-1",background:"#0a0e1a",borderTop:`2px solid ${K.border}`,padding:"6px 12px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={undoLastPlay} style={{padding:"8px 14px",borderRadius:10,background:K.red+"22",border:`2px solid ${K.red}`,color:K.red,fontWeight:900,fontSize:11,cursor:"pointer",flexShrink:0}}>↩️ DESHACER</button>
          <div style={{flex:1,display:"flex",gap:6,overflow:"auto"}} className="sx">
            {rp.map((p:any,i:number)=>{const ic:any={"1B":"🏏","2B":"✌️","3B":"🔱","HR":"💥","BB":"👁","IBB":"🤫","K":"💨","OUT":"❌","GROUND":"⬇️","FLY":"🔼","DP":"✖️","SAC":"🎯","HBP":"😤","E":"🫣","WP":"🤷","SB":"🏃","CS":"🚔","PK":"🎯","PB":"🧤","BALK":"🚫","RUN":"🏃‍♂️","FC":"⚖️"};
              const rutText = p.route?.length > 0 ? `(${p.route.join("-")})` : "";
              return<div key={i} style={{flexShrink:0,padding:"4px 10px",borderRadius:8,background:K.input,border:`1px solid ${K.border}`,display:"flex",alignItems:"center",gap:4,fontSize:10}}>
                <span>{ic[p.result]||"⚾"}</span><span style={{fontWeight:700}}>{p.playerName}</span>
                <span style={{color:K.muted}}>{p.result} {rutText} {p.errorPosition?`(${p.errorPosition})`:""}</span>
                {p.ci>0&&<span style={{color:K.accent,fontWeight:700}}>+{p.ci}CI</span>}
                {p.isEarned===false&&<span style={{color:K.yellow,fontSize:8}}>UER</span>}</div>})}</div>
        </div>
      </div>

      {/* ── MODALES DEL TRAZADOR Y JUGADAS ── */}
      {showBatazo && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{...S.card, padding:20, maxWidth:380, width:"90%", textAlign:"center", position:"relative"}}>
          <button onClick={()=>setShowBatazo(false)} style={{position:"absolute",top:10,right:10,background:"none",border:"none",color:K.muted,fontSize:20,cursor:"pointer"}}>✕</button>
          <h3 style={{fontWeight:900,fontSize:18,marginBottom:4}}>Trazar Jugada (Ruta)</h3>
          <p style={{fontSize:12,color:K.muted,marginBottom:20}}>Toca en orden a los jugadores que participaron en el fildeo/tiro.</p>
          <div style={{position:"relative", width:240, height:240, margin:"0 auto 20px"}}>
            <svg width={240} height={240} style={{position:"absolute",inset:0}}>
              <polygon points="120,40 200,120 120,200 40,120" fill="none" stroke={K.border} strokeWidth="2"/>
              {fieldRoute.length > 1 && fieldRoute.map((node, i) => {
                if(i===0) return null;
                const prev = POS_COORDS[fieldRoute[i-1]]; const curr = POS_COORDS[node];
                return <line key={i} x1={prev.x+20} y1={prev.y+40} x2={curr.x+20} y2={curr.y+40} stroke={K.accent} strokeWidth="3" strokeDasharray="4"/>
              })}
            </svg>
            {[1,2,3,4,5,6,7,8,9].map(num => {
              const isActive = fieldRoute.includes(num);
              const stepNum = fieldRoute.indexOf(num) + 1;
              return (
                <div key={num} onClick={()=>toggleRouteNode(num)} className="node-btn"
                     style={{left:POS_COORDS[num].x+20, top:POS_COORDS[num].y+40, 
                             background: isActive ? K.accent : K.card, 
                             border: `2px solid ${isActive?K.accent:K.muted}`, color:isActive?"#000":K.text}}>
                  {isActive ? stepNum : num}
                </div>)
            })}
          </div>
          <div style={{fontSize:24, fontWeight:900, color:K.accent, letterSpacing:4, minHeight:34, marginBottom:16}}>
            {fieldRoute.length > 0 ? fieldRoute.join(" - ") : "..."}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>executeFielding("OUT")} disabled={fieldRoute.length===0} style={{...S.btn("primary"), opacity:fieldRoute.length?1:0.5}}>⬇️ Rodado (Out)</button>
            <button onClick={()=>executeFielding("FLY")} disabled={fieldRoute.length===0} style={{...S.btn("ghost"), border:`1px solid ${K.border}`, opacity:fieldRoute.length?1:0.5}}>🔼 Elevado (Fly)</button>
            <button onClick={()=>executeFielding("DP")} disabled={fieldRoute.length<2} style={{...S.btn("danger"), background:`${K.red}22`, opacity:fieldRoute.length>1?1:0.5}}>✖️✖️ Doble Play</button>
            <button onClick={()=>executeFielding("FC")} disabled={fieldRoute.length===0} style={{...S.btn("ghost"), border:`1px solid ${K.blue}44`, color:K.blue, opacity:fieldRoute.length?1:0.5}}>⚖️ Jugada Selección</button>
            <button onClick={()=>executeFielding("SAC")} disabled={fieldRoute.length===0} style={{gridColumn:"1/-1", padding:12, borderRadius:8, background:"#262626", border:"1px solid #a3a3a3", color:"#a3a3a3", fontWeight:900, cursor:"pointer", opacity:fieldRoute.length?1:0.5}}>🎯 Sacrificio (Fly / Toque)</button>
          </div>
        </div>
      </div>}

      {showConfirm&&<Modal title={modalTitles[showConfirm.type] || `Confirmar ${showConfirm.type}`} onClose={()=>setShowConfirm(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{textAlign:"center",padding:10,background:K.input,borderRadius:12}}>
            <span style={{fontSize:28}}>{modalIcons[showConfirm.type] || "⚾"}</span>
            <div style={{fontWeight:900,fontSize:16,color:K.text,marginTop:4}}>{currentBatter?.name}</div>
            <div style={{fontSize:10, color:K.muted, marginTop:2}}>{modalDescs[showConfirm.type] || ""}</div>
          </div>
          
          {showConfirm.type === "E" && (
            <div style={{marginTop:8, background:`${K.red}11`, padding:12, borderRadius:10, border:`1px solid ${K.red}44`}}>
              <label style={{...S.label, color:K.red}}>¿Quién cometió el error?</label>
              <select style={{...S.input, marginTop:6, width:"100%"}} value={showConfirm.extra?.errorPlayerId || ""} onChange={(e)=>{
                  const sel = pitchLineup.find((p:any)=>p.id===e.target.value);
                  setShowConfirm({...showConfirm, extra: {...showConfirm.extra, errorPlayerId: sel?.id, errorPlayerName: sel?.name, errorPosition: sel?.fieldPos?.match(/\((\d)\)/)?.[1] || 6}}); }}>
                <option value="">Selecciona al fildeador...</option>
                {pitchLineup.map((p:any) => <option key={p.id} value={p.id}>{p.fieldPos} - {p.name}</option>)}
              </select>
            </div>
          )}

          <div><label style={S.label}>Carreras que anotan en la jugada</label>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>{[0,1,2,3,4].map(n=><button key={n} onClick={()=>setShowConfirm({...showConfirm,runs:n})} style={{width:44,height:44,borderRadius:12,border:`2px solid ${showConfirm.runs===n?K.accent:K.border}`,background:showConfirm.runs===n?`${K.accent}22`:K.input,color:showConfirm.runs===n?K.accent:K.text,fontWeight:900,fontSize:18,cursor:"pointer"}}>{n}</button>)}</div></div>
          
          <div><label style={S.label}>Ajuste Manual de Bases</label>
            <div style={{display:"flex",gap:12,justifyContent:"center",padding:10}}>{["1ra","2da","3ra"].map((l,i)=><button key={i} onClick={()=>{const nb=[...showConfirm.newBases];nb[i]=nb[i]?null:(bases[i]||{id:"ghost",name:"Corredor"});setShowConfirm({...showConfirm,newBases:nb});}} style={{padding:"10px 18px",borderRadius:10,border:`2px solid ${showConfirm.newBases[i]?K.yellow:K.border}`,background:showConfirm.newBases[i]?K.yellow+"22":"transparent",color:showConfirm.newBases[i]?K.yellow:K.muted,fontWeight:700,fontSize:13,cursor:"pointer"}}>{l} {showConfirm.newBases[i]?"●":"○"}</button>)}</div></div>
          
          <button onClick={confirmHit} style={{...S.btn("primary"),width:"100%",padding:14,fontSize:14}}>✅ Confirmar Jugada</button></div></Modal>}

      {showRunnerAction&&<Modal title={showRunnerAction.type==="SB"?"🏃 ¿Quién se robó la base?":showRunnerAction.type==="PK"?"🎯 Revirada (Pickoff) a:":"🚔 ¿Quién fue atrapado?"} onClose={()=>setShowRunnerAction(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bases.map((runner:any,i:number)=>{if(!runner)return null;const c=[K.accent,"#6366f1",K.yellow];return<button key={i} onClick={()=>executeRunnerAction(showRunnerAction.type!,i, runner)} style={{padding:16,borderRadius:14,border:`2px solid ${c[i]}44`,background:`${c[i]}15`,color:c[i],fontWeight:800,fontSize:14,cursor:"pointer",textAlign:"center"}}>🏃 {runner.name} en {["1ra","2da","3ra"][i]} Base</button>})}</div></Modal>}

      {showComplex&&<Modal title="Jugadas Especiales y de Corredores" onClose={()=>setShowComplex(false)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{k:"IBB",l:"Boleto Intencional",i:"🤫",c:K.blue,d:"No suma bolas"},{k:"HBP",l:"Golpeado",i:"😤",c:"#eab308",d:"Fuerza si full"},{k:"SB",l:"Base Robada",i:"🏃",c:"#8b5cf6",d:""},{k:"CS",l:"Atrapado",i:"🚔",c:"#dc2626",d:"1 out"},{k:"PK",l:"Pickoff (Revirada)",i:"🎯",c:"#dc2626",d:"1 out, A para Pitcher"},{k:"WP",l:"Wild Pitch",i:"🤷",c:"#64748b",d:"ER, sin RBI"},{k:"PB",l:"Passed Ball",i:"🧤",c:"#64748b",d:"UER"},{k:"BALK",l:"Balk",i:"🚫",c:"#f43f5e",d:"ER, sin RBI"}].map(a=>
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

    </div>
  );
}

// ═══ WATCH GAME (Visualizador Estilo ESPN - Box Score Definitivo) ═══

const POS_NAMES:any = { 1:"lanzador", 2:"receptor", 3:"primera base", 4:"segunda base", 5:"tercera base", 6:"campocorto", 7:"jardín izquierdo", 8:"jardín central", 9:"jardín derecho" };

const getPlayNarrative = (p: any) => {
  const n = p.playerName || "Bateador";
  const r = p.route && p.route.length > 0 ? p.route : null;
  const lastPos = r ? POS_NAMES[r[r.length-1]] : "";
  const rStr = r ? ` (${r.join("-")})` : "";

  switch(p.result) {
    case "1B": return `${n} bateó un sencillo${lastPos ? ` al ${lastPos}` : ""}.`;
    case "2B": return `${n} bateó un doble${lastPos ? ` al ${lastPos}` : ""}.`;
    case "3B": return `${n} bateó un triple${lastPos ? ` al ${lastPos}` : ""}.`;
    case "HR": return `${n} bateó un jonrón.`;
    case "BB": return `${n} se embasó por base por bolas.`;
    case "IBB": return `${n} recibió boleto intencional.`;
    case "K": return `${n} se ponchó.`;
    case "GROUND": return `${n} falló con rodado${lastPos ? ` a ${lastPos}` : ""}${rStr}.`;
    case "FLY": return `${n} falló con elevado${lastPos ? ` al ${lastPos}` : ""}.`;
    case "DP": return `${n} bateó para doble play${rStr}.`;
    case "E": return `${n} se embasó por error del ${POS_NAMES[p.errorPosition] || "fildeador"}.`;
    case "FC": return `${n} llegó a primera en jugada de selección.`;
    case "SAC": return `${n} se sacrificó (Fly/Toque)${rStr}.`;
    case "HBP": return `${n} fue golpeado por el lanzamiento.`;
    case "SB": return `${n} se robó la base.`;
    case "CS": return `${n} fue atrapado robando.`;
    case "PK": return `${n} fue sorprendido en base (Pickoff).`;
    case "WP": return `Lanzamiento descontrolado (Wild Pitch).`;
    case "PB": return `Passed ball del receptor.`;
    case "BALK": return `Balk del lanzador.`;
    case "RUN": return `${n} anotó carrera.`;
    default: return `${n} - Jugada: ${p.result}`;
  }
};

export function WatchGame({ data, id, nav }: any) {
  const [game,setGame]=useState<any>(null);
  const [expandedAbs, setExpandedAbs] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"pbp" | "box">("box"); 

  useEffect(()=>{const u=F.onDoc("games",id!,setGame);return()=>u&&u();},[id]);
  
  if(!game)return<div style={{...S.sec,textAlign:"center",padding:40}}><IcoBall size={40} color={K.accent} style={{animation:"spin 1.5s linear infinite",margin:"0 auto 12px"}}/></div>;
  
  const aw=data.teams.find((t:any)=>t.id===game.awayTeamId);
  const hm=data.teams.find((t:any)=>t.id===game.homeTeamId);
  const isTop=game.half==="top";
  const batTm=isTop?aw:hm;
  const isFinal = game.status === "final";

  // Motor Estadístico (Combina datos históricos con los del juego en vivo, si no ha finalizado)
  const getStats = (pid:string) => {
    let vb=0,h=0,hr=0,ci=0,ca=0,bb=0,k=0,db=0,tb=0,sb=0,pa=0,e=0;
    (game.plays||[]).forEach((p:any) => { 
      if (p.errorPlayerId === pid) e++; 
      if (p.playerId !== pid) return; 
      if (p.result !== "RUN" && p.result !== "SB" && p.result !== "CS" && p.result !== "PK") pa++; 
      if (["1B","2B","3B","HR"].includes(p.result)) { vb++; h++; if(p.result==="2B")db++; if(p.result==="3B")tb++; if(p.result==="HR")hr++; }
      else if (["BB","IBB","HBP"].includes(p.result)) bb++;
      else if (["OUT","FLY","GROUND","K","DP","FC"].includes(p.result)) { vb++; if(p.result==="K")k++; }
      else if (p.result === "E") vb++;
      ci += (p.ci||0); ca += (p.ca||0); if(p.result==="SB")sb++;
    });

    const player = data.players.find((p:any) => p.id === pid);
    const hist = player?.batting || {};
    
    // Si el juego es Final, la data ya está en hist. No la sumamos dos veces.
    const tVB = isFinal ? (hist.VB || 0) : (hist.VB || 0) + vb;
    const tH = isFinal ? (hist.H || 0) : (hist.H || 0) + h;
    const avgStr = tVB > 0 ? (tH/tVB).toFixed(3) : ".000";
    const avg = avgStr.startsWith("0.") ? avgStr.substring(1) : avgStr;

    return { vb,h,hr,ci,ca,bb,k,db,tb,sb,pa,e, avg };
  };

  const getPitStats = (pid:string) => {
    let h=0,bb=0,k=0,cl=0,outs=0,pitches=0;
    (game.plays||[]).forEach((p:any) => { if(p.pitcherId!==pid) return; if(p.isPitch) pitches++; if(!p.result) return;
      if(["1B","2B","3B","HR","E"].includes(p.result)) h++;
      if(["BB","IBB","HBP"].includes(p.result)) bb++;
      if(p.result==="K") k++;
      if(["OUT","FLY","GROUND","K","SAC","FC"].includes(p.result)) outs++;
      if(p.result==="DP") outs+=2;
      if(p.isEarned!==false) cl+=(p.ci||0);
    });

    const player = data.players.find((p:any) => p.id === pid);
    const hist = player?.pitching || {};
    
    const tIP = isFinal ? (hist.IL || 0) : (hist.IL || 0) + (outs / 3);
    const tCL = isFinal ? (hist.CL || 0) : (hist.CL || 0) + cl;
    const era = tIP > 0 ? ((tCL * 7) / tIP).toFixed(2) : "0.00";

    return { h,bb,K:k,cl,outs,pitches, ip:(Math.floor(outs/3)+(outs%3)/10).toFixed(1), hld:h, bba:bb, era };
  };

  const getTeamSummary = (teamStr: "away" | "home") => {
    const p = (game.plays || []);
    const batPlays = p.filter((x:any) => x.team === teamStr);
    const fieldPlays = p.filter((x:any) => x.team !== teamStr); 

    const countEvts = (playsArr:any[], type:string) => {
      const evts = playsArr.filter(x => x.result === type);
      if(evts.length === 0) return null;
      const counts:any = {};
      evts.forEach(e => { counts[e.playerName] = (counts[e.playerName]||0) + 1; });
      return Object.entries(counts).map(([name, qty]) => `${name}${qty>1?` (${qty})`:''}`).join(", ");
    };

    const rbis:any = {};
    batPlays.filter((x:any) => (x.ci||0) > 0).forEach((e:any) => { rbis[e.playerName] = (rbis[e.playerName]||0) + e.ci; });
    const ciStr = Object.keys(rbis).length > 0 ? Object.entries(rbis).map(([n, q]) => `${n}${q>1?` (${q})`:''}`).join(", ") : null;

    const errCounts:any = {};
    p.filter((x:any) => x.result === "E" && (teamStr === "home" ? x.team==="away" : x.team==="home")).forEach((e:any) => { 
      const n = e.errorPlayerName || "Fildeador"; errCounts[n] = (errCounts[n]||0) + 1; 
    });
    const errStr = Object.keys(errCounts).length > 0 ? Object.entries(errCounts).map(([n, q]) => `${n}${q>1?` (${q})`:''}`).join(", ") : null;

    return {
      "2B": countEvts(batPlays, "2B"), "3B": countEvts(batPlays, "3B"), "HR": countEvts(batPlays, "HR"),
      "CI": ciStr, "BR": countEvts(batPlays, "SB"), "CS": countEvts(batPlays, "CS"),
      "DP": countEvts(fieldPlays, "DP"), "E": errStr
    };
  };

  const inningsList: any[] = [];
  let currentInning: any = null;
  let currentEvent: any = null; 

  (game.plays||[]).forEach((p:any, idx:number) => {
    const iKey = `${p.inning}-${p.half}`;
    if (!currentInning || currentInning.key !== iKey) {
      currentInning = {
        key: iKey, inning: p.inning, half: p.half,
        batTm: p.half === "top" ? aw : hm, pitchTm: p.half === "top" ? hm : aw,
        pitcherName: p.pitcherName || "Lanzador",
        events: [], R: 0, H: 0, E: 0
      };
      inningsList.unshift(currentInning);
      currentEvent = { id: `ev-${idx}`, pitches: [], resultPlay: null };
    }
    if (["1B","2B","3B","HR"].includes(p.result)) currentInning.H++;
    if (p.result === "E") currentInning.E++;
    if (p.result === "RUN" || p.ca > 0) currentInning.R += (p.ca || 1);

    if (p.isPitch && !p.result) {
      if (!currentEvent) currentEvent = { id: `ev-${idx}`, pitches: [], resultPlay: null };
      currentEvent.pitches.push(p);
    } else if (p.result) {
      if (!currentEvent) currentEvent = { id: `ev-${idx}`, pitches: [], resultPlay: null };
      currentEvent.resultPlay = p;
      currentInning.events.unshift(currentEvent);
      currentEvent = null; 
    }
  });

  const toggleAb = (eventId: string) => setExpandedAbs(prev => ({...prev, [eventId]: !prev[eventId]}));

  // Filtro de Anotaciones Exclusivas (solo jugadas productoras)
  const scoringPlays = (game.plays||[]).filter((p:any) => p.runsScoredOnPlay > 0 || p.ci > 0 || p.result === "HR");

  const batLU_W = isTop ? (game.awayLineup||[]) : (game.homeLineup||[]);
  const bIdx_W = isTop ? (game.awayBatterIdx||0) : (game.homeBatterIdx||0);
  const currBat_W = batLU_W[bIdx_W % batLU_W.length] || null;
  const pitch_W = game.currentPitcher; 

  const fullBat = currBat_W ? data.players.find((p:any) => p.id === currBat_W.id) : null;
  const fullPit = pitch_W ? data.players.find((p:any) => p.id === pitch_W.id) : null;
  const cBatStats = currBat_W ? getStats(currBat_W.id) : null;
  const cPitStats = pitch_W ? getPitStats(pitch_W.id) : null;
  // Render variables para Line Score (R-H-E)
  const awH = game.awayHits || 0;
  const hmH = game.homeHits || 0;
  const awE = game.awayErrors || game.awayE || 0; 
  const hmE = game.homeErrors || game.homeE || 0; 
  const totalCols = Math.max(game.totalInnings||9, Math.max((game.awayInnings||[]).length, (game.homeInnings||[]).length));

  return(
    <div style={{...S.sec, maxWidth: 1000, margin: "0 auto", paddingBottom: 40}}>
      {/* HEADER DE MARCADOR PRINCIPAL */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14, position:"relative"}}>
        <button onClick={()=>nav("home")} style={{position:"absolute", left:0, padding:"6px 12px", borderRadius:8, background:K.input, border:`1px solid ${K.border}`, color:K.text, cursor:"pointer", fontSize:11, fontWeight:700}}>← Volver</button>
        <span style={{...S.badge(game.status==="final"?K.muted:K.live),animation:game.status==="final"?"none":"pulse 2s infinite"}}>{game.status==="final"?"FINALIZADO":"● EN VIVO"}</span>
      </div>
      
      {/* ── CUSTOM SCOREBOARD (LINE SCORE R-H-E PERFECTO) ── */}
      <div style={{background:"#0a0e1a", borderRadius: 12, border:`1px solid ${K.border}`, padding:"12px", overflowX:"auto", marginBottom: 20}}>
        <table style={{width:"100%", borderCollapse:"collapse",fontSize:12, minWidth: 400}}>
          <thead>
            <tr style={{color:K.muted, borderBottom:`1px solid ${K.border}44`}}>
              <th style={{padding:"6px 8px",textAlign:"left",fontWeight:800}}>EQUIPO</th>
              {Array.from({length: totalCols}).map((_:any,i:number)=><th key={i} style={{padding:"6px",textAlign:"center",fontWeight:800,color:game.inning===i+1?K.accent:K.muted}}>{i+1}</th>)}
              <th style={{padding:"6px 10px",textAlign:"center",fontWeight:900,color:K.text}}>R</th>
              <th style={{padding:"6px 10px",textAlign:"center",fontWeight:900,color:K.text}}>H</th>
              <th style={{padding:"6px 10px",textAlign:"center",fontWeight:900,color:K.text}}>E</th>
            </tr>
          </thead>
          <tbody>
            {[{t:aw,inn:game.awayInnings,s:game.awayScore,h:awH,e:awE},{t:hm,inn:game.homeInnings,s:game.homeScore,h:hmH,e:hmE}].map((x,i)=>(
            <tr key={i} style={{borderBottom: i===0 ? `1px solid ${K.border}22` : 'none'}}>
              <td style={{padding:"8px",fontWeight:800,color:(i===0&&isTop)||(i===1&&!isTop)?K.accent:K.text}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <TeamLogo team={x.t} size={18}/> {x.t?.abbr || (i===0?"VIS":"LOC")}
                </div>
              </td>
              {Array.from({length: totalCols}).map((_,j:number)=>{
                const r = (x.inn||[])[j];
                return <td key={j} style={{padding:"8px 6px",textAlign:"center",fontWeight:700,color:r!==undefined&&r!==null?K.text:K.muted}}>{r!==undefined&&r!==null?r:"—"}</td>
              })}
              <td style={{padding:"8px 10px",textAlign:"center",fontWeight:900,fontSize:14,color:K.accent}}>{x.s}</td>
              <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700}}>{x.h}</td>
              <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700,color:K.red}}>{x.e}</td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── PANEL DUELO ULTRALIMPIO ESTILO ESPN ── */}
      {game.status !== "final" && (
        <div style={{...S.card, padding:"16px 20px", marginBottom:16, border:`1px solid ${K.border}`}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:20}}>
            <div style={{display:"flex", alignItems:"center", gap:12, flex:1, justifyContent:"flex-end"}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:10, fontWeight:700, color:K.muted}}>LANZADOR</div>
                <div style={{fontWeight:900, fontSize:14, color:K.blue}}>#{pitch_W?.number} {pitch_W?.name}</div>
                <div style={{fontSize:11, fontWeight:700, color:K.dim, marginTop:2}}>
                  {cPitStats ? `${cPitStats.ip} IP, ${cPitStats.h} H, ${cPitStats.cl} CL, ${cPitStats.K} K` : "0.0 IP, 0 H, 0 CL"}
                </div>
              </div>
              <div style={{width:46, height:46, borderRadius:23, background:`${K.blue}15`, border:`2px solid ${K.blue}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden"}}>
                {(fullPit?.photo || fullPit?.photoUrl) ? (
                  <img src={fullPit.photo || fullPit.photoUrl} alt="Pitcher" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                ) : (
                  <IcoBall size={24} color={K.blue}/>
                )}
              </div>
            </div>
            
            <div style={{textAlign:"center", minWidth:120, borderLeft:`1px solid ${K.border}66`, borderRight:`1px solid ${K.border}66`, padding:"0 20px"}}>
              <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:4}}>
                <div style={{fontSize:16, fontWeight:900, color:K.green, width:18, textAlign:"right"}}>B:</div>
                <div style={{display:"flex", gap:4}}>
                  {[0,1,2,3].map(i=><div key={i} style={{width:12, height:12, borderRadius:6, background:i<(game.count?.balls||0)?K.green:K.border}}/>)}
                </div>
              </div>
              <div style={{display:"flex", justifyContent:"center", alignItems:"center", gap:4, marginTop:8}}>
                <div style={{fontSize:16, fontWeight:900, color:K.red, width:18, textAlign:"right"}}>S:</div>
                <div style={{display:"flex", gap:4}}>
                  {[0,1,2].map(i=><div key={i} style={{width:12, height:12, borderRadius:6, background:i<(game.count?.strikes||0)?K.red:K.border}}/>)}
                </div>
              </div>
            </div>
            
            <div style={{display:"flex", alignItems:"center", gap:12, flex:1, justifyContent:"flex-start"}}>
              <div style={{width:46, height:46, borderRadius:23, background:`${K.accent}15`, border:`2px solid ${K.accent}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden"}}>
                {(fullBat?.photo || fullBat?.photoUrl) ? (
                  <img src={fullBat.photo || fullBat.photoUrl} alt="Bateador" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                ) : (
                  <IcoPlay size={24} color={K.accent}/>
                )}
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:10, fontWeight:700, color:K.muted}}>AL BATE</div>
                <div style={{fontWeight:900, fontSize:14, color:K.accent}}>#{currBat_W?.number} {currBat_W?.name}</div>
                <div style={{fontSize:11, fontWeight:700, color:K.dim, marginTop:2}}>
                  {cBatStats ? `${cBatStats.h}-${cBatStats.vb}${cBatStats.hr>0?`, ${cBatStats.hr} HR`:""}${cBatStats.ci>0?`, ${cBatStats.ci} CI`:""}` : "0-0"}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PESTAÑAS */}
      <div style={{display:"flex", gap:10, marginTop: 24, marginBottom:16, borderBottom:`2px solid ${K.border}`}}>
        <div onClick={()=>setActiveTab("box")} style={{padding:"8px 16px", fontWeight:900, fontSize:13, color:activeTab==="box"?K.accent:K.muted, borderBottom:activeTab==="box"?`3px solid ${K.accent}`:"none", cursor:"pointer", marginBottom:-2}}>Ficha (Box Score)</div>
        <div onClick={()=>setActiveTab("pbp")} style={{padding:"8px 16px", fontWeight:900, fontSize:13, color:activeTab==="pbp"?K.accent:K.muted, borderBottom:activeTab==="pbp"?`3px solid ${K.accent}`:"none", cursor:"pointer", marginBottom:-2}}>Jugadas</div>
      </div>

      {/* VISTA 1: BOX SCORE (ESTILO ESPN) */}
      {activeTab === "box" && (
        <div style={{display:"flex", flexDirection:"column", gap:24}}>
          
          {/* TABLAS DE BATEO Y RESÚMENES (GRILLA) */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16}}>
            {[{label:aw?.name, logo:aw, lineup:game.awayLineup||[], team:"away"},{label:hm?.name, logo:hm, lineup:game.homeLineup||[], team:"home"}].map(({label,logo,lineup,team})=>(
              <div key={team} style={{background:K.card, borderRadius:12, overflow:"hidden", border:`1px solid ${K.border}`}}>
                <div style={{background:K.input, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${K.border}`}}>
                  <TeamLogo team={logo} size={20}/>
                  <span style={{fontWeight:900, fontSize:13, color:K.text}}>Bateo de {label}</span>
                </div>
                <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{color:K.muted, borderBottom:`1px solid ${K.border}`}}>
                    <th style={{textAlign:"left",padding:"8px 14px",fontSize:9,fontWeight:800}}>BATEADORES</th>
                    {["VB","C","H","CI","BB","K","AVG"].map(c=><th key={c} style={{textAlign:"center",padding:"8px 4px",fontSize:9,fontWeight:800}}>{c}</th>)}
                  </tr></thead>
                  <tbody>{lineup.map((p:any)=>{const s=getStats(p.id);return(
                    <tr key={p.id} style={{borderBottom:`1px solid ${K.border}44`}}>
                      <td style={{padding:"8px 14px",fontWeight:700,color:K.text}}>{p.name.split(" ")[0].charAt(0)}. {p.name.split(" ")[p.name.split(" ").length-1]} <span style={{fontSize:9,color:K.muted,fontWeight:400}}>{p.fieldPos?.replace(/\(\d\)/,'')}</span></td>
                      <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{s.vb}</td>
                      <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{s.ca}</td>
                      <td style={{textAlign:"center",padding:"8px 4px",fontWeight:700,color:K.text}}>{s.h}</td>
                      <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{s.ci}</td>
                      <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{s.bb}</td>
                      <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{s.k}</td>
                      <td style={{textAlign:"center",padding:"8px 4px",fontWeight:800,color:K.text}}>{s.avg}</td>
                    </tr>)})}
                  </tbody>
                </table></div>
                
                {/* ── BLOQUE DE TEXTO: RESUMEN DE EQUIPO ── */}
                <div style={{padding:"12px 14px", fontSize:11, color:K.dim, lineHeight:1.5}}>
                  {(()=>{ const sum = getTeamSummary(team as "away"|"home"); return (
                    <>
                      <div style={{fontWeight:800, color:K.text, marginBottom:4, fontSize:10, textTransform:"uppercase"}}>Bateo</div>
                      {sum["2B"] && <div><span style={{fontWeight:800,color:K.muted}}>2B:</span> {sum["2B"]}</div>}
                      {sum["3B"] && <div><span style={{fontWeight:800,color:K.muted}}>3B:</span> {sum["3B"]}</div>}
                      {sum["HR"] && <div><span style={{fontWeight:800,color:K.muted}}>HR:</span> {sum["HR"]}</div>}
                      {sum["CI"] && <div><span style={{fontWeight:800,color:K.muted}}>CI:</span> {sum["CI"]}</div>}
                      
                      <div style={{fontWeight:800, color:K.text, marginTop:8, marginBottom:4, fontSize:10, textTransform:"uppercase"}}>Corrido de Bases</div>
                      {sum["BR"] && <div><span style={{fontWeight:800,color:K.muted}}>BR:</span> {sum["BR"]}</div>}
                      {sum["CS"] && <div><span style={{fontWeight:800,color:K.muted}}>Atrapado:</span> {sum["CS"]}</div>}
                      {!sum["BR"] && !sum["CS"] && <div style={{color:K.muted}}>-</div>}

                      <div style={{fontWeight:800, color:K.text, marginTop:8, marginBottom:4, fontSize:10, textTransform:"uppercase"}}>Fildeo</div>
                      {sum["DP"] && <div><span style={{fontWeight:800,color:K.muted}}>DP:</span> {sum["DP"]}</div>}
                      {sum["E"] && <div><span style={{fontWeight:800,color:K.muted}}>E:</span> {sum["E"]}</div>}
                      {!sum["DP"] && !sum["E"] && <div style={{color:K.muted}}>-</div>}
                    </>
                  )})()}
                </div>
              </div>
            ))}
          </div>

          {/* TABLAS DE PITCHEO (GRILLA) */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16}}>
            {[{label:aw?.name, logo:aw, team:"away"},{label:hm?.name, logo:hm, team:"home"}].map(({label,logo,team})=>(
              <div key={team} style={{background:K.card, borderRadius:12, overflow:"hidden", border:`1px solid ${K.border}`}}>
                <div style={{background:K.input, padding:"10px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${K.border}`}}>
                  <TeamLogo team={logo} size={20}/>
                  <span style={{fontWeight:900, fontSize:13, color:K.text}}>Pitcheo de {label}</span>
                </div>
                <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{color:K.muted, borderBottom:`1px solid ${K.border}`}}>
                    <th style={{textAlign:"left",padding:"8px 14px",fontSize:9,fontWeight:800}}>LANZADORES</th>
                    {["IP","H","C","CL","BB","K","ERA"].map(c=><th key={c} style={{textAlign:"center",padding:"8px 4px",fontSize:9,fontWeight:800}}>{c}</th>)}
                  </tr></thead>
                  <tbody>
                    {(()=>{
                      const pids=[...new Set((game.plays||[]).filter((p:any)=>p.pitcherId&&p.result).map((p:any)=>p.pitcherId))].filter(pid=>{
                        const ih=(game.homeLineup||[]).find((x:any)=>x.id===pid);return team==="home"?!!ih:!ih;});
                      if(!pids.length) return <tr><td colSpan={8} style={{padding:14,textAlign:"center",color:K.muted}}>Sin registros</td></tr>;
                      
                      return pids.map(pid=>{
                        const ps=getPitStats(pid as string);
                        const nm=(game.plays||[]).find((p:any)=>p.pitcherId===pid)?.pitcherName||"?";
                        return (
                          <tr key={pid as string} style={{borderBottom:`1px solid ${K.border}44`}}>
                            <td style={{padding:"8px 14px",fontWeight:700,color:K.text}}>{nm}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",fontWeight:800,color:K.text}}>{ps.ip}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{ps.hld}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{ps.cl}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{ps.cl}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",color:K.dim}}>{ps.bba}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",fontWeight:700,color:K.text}}>{ps.K}</td>
                            <td style={{textAlign:"center",padding:"8px 4px",fontWeight:800,color:K.blue}}>{ps.era}</td>
                          </tr>
                        )
                      });
                    })()}
                  </tbody>
                </table></div>
              </div>
            ))}
          </div>

          {/* ANOTACIONES (RESUMEN DE CARRERAS) */}
          <div style={{background:K.card, borderRadius:12, overflow:"hidden", border:`1px solid ${K.border}`, marginTop: 8}}>
            <div style={{background:K.input, padding:"10px 14px", borderBottom:`1px solid ${K.border}`}}>
              <h3 style={{fontWeight:900, fontSize:14, color:K.text, margin:0}}>Anotaciones</h3>
            </div>
            <div style={{padding:0}}>
              {scoringPlays.length === 0 ? (
                <div style={{padding:20, textAlign:"center", color:K.muted, fontSize:12}}>Aún no hay carreras en el juego.</div>
              ) : (
                <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
                  <thead><tr style={{color:K.muted, borderBottom:`1px solid ${K.border}44`}}>
                    <th style={{textAlign:"left",padding:"8px 14px",fontSize:9,fontWeight:800,width:80}}>ENTRADA</th>
                    <th style={{textAlign:"left",padding:"8px 14px",fontSize:9,fontWeight:800}}>JUGADA</th>
                  </tr></thead>
                  <tbody>
                    {scoringPlays.map((sp:any, idx:number) => {
                      const runs = sp.runsScoredOnPlay || sp.ca || (sp.ci>0?sp.ci:1);
                      return (
                      <tr key={idx} style={{borderBottom:`1px solid ${K.border}22`}}>
                        <td style={{padding:"12px 14px", fontWeight:800, color:K.dim, verticalAlign:"top"}}>
                          {sp.half==="top"?"▲":"▼"} {sp.inning}°
                        </td>
                        <td style={{padding:"12px 14px", color:K.text, lineHeight:1.4}}>
                          <span style={{fontWeight:800, color:sp.team==="away"?K.accent:K.blue}}>{sp.playerName}</span> {getPlayNarrative(sp).replace(sp.playerName,"")} 
                          <span style={{fontWeight:700, color:K.green}}> ({runs} {runs>1?"Carreras":"Carrera"})</span>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VISTA 2: PLAY BY PLAY */}
      {activeTab === "pbp" && (
        <div style={{display:"flex", flexDirection:"column", gap:16}}>
          {inningsList.length === 0 && <div style={{textAlign:"center", padding:40, color:K.muted}}>Esperando el primer lanzamiento...</div>}
          
          {inningsList.map((inn: any) => (
            <div key={inn.key} style={{...S.card, overflow:"hidden", border:`1px solid ${K.border}`}}>
              <div style={{background:K.input, padding:"8px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${K.border}`}}>
                <TeamLogo team={inn.batTm} size={20}/>
                <span style={{fontWeight:900, fontSize:13, color:K.text}}>{inn.batTm?.name} - {inn.half==="top"?"Alta":"Baja"} {inn.inning}°</span>
              </div>
              
              <div style={{fontSize:10, fontWeight:900, color:K.muted, padding:"6px 14px", borderBottom:`1px solid ${K.border}`, textTransform:"uppercase"}}>
                {inn.pitcherName} LANZA PARA {inn.pitchTm?.abbr}
              </div>

              <div>
                {inn.events.map((ev: any) => {
                  const isExp = expandedAbs[ev.id];
                  const hasPitches = ev.pitches && ev.pitches.length > 0;
                  
                  return (
                    <div key={ev.id} style={{borderBottom:`1px solid ${K.border}44`}}>
                      <div onClick={() => hasPitches && toggleAb(ev.id)} style={{display:"flex", alignItems:"center", padding:"10px 14px", cursor: hasPitches ? "pointer" : "default", transition:"background 0.2s", background: isExp ? "rgba(255,255,255,0.02)" : "transparent"}}>
                        <div style={{width:24, color:K.accent, fontWeight:900, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center"}}>
                          {hasPitches ? (isExp ? "▲" : "▼") : "•"}
                        </div>
                        <div style={{flex:1, fontWeight:700, fontSize:12, color:K.text}}>
                          {getPlayNarrative(ev.resultPlay)}
                        </div>
                      </div>

                      {isExp && (
                        <div style={{background: "rgba(0,0,0,0.2)", padding:"4px 0", borderTop:`1px solid ${K.border}22`}}>
                          {ev.pitches.map((pt: any, i: number) => {
                            let pLabel = "Bola", pColor = K.green;
                            if(pt.pitchType === "called") { pLabel = "Strike cantado"; pColor = K.red; }
                            if(pt.pitchType === "swinging") { pLabel = "Strike tirándole"; pColor = K.red; }
                            if(pt.pitchType === "foul") { pLabel = "Foul"; pColor = K.yellow; }
                            return (
                              <div key={i} style={{display:"flex", alignItems:"center", padding:"6px 14px", fontSize:11, color:K.muted}}>
                                <div style={{width:24}}></div><div style={{width:30, fontWeight:900, color:K.dim}}>{i+1}</div>
                                <div style={{flex:1}}>{pLabel}</div>
                                <div style={{width:40, display:"flex", justifyContent:"center"}}><div style={{width:10, height:10, borderRadius:5, background:pColor, boxShadow:`0 0 6px ${pColor}88`}}></div></div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{background:K.input, padding:"8px 14px", textAlign:"right", fontSize:10, fontWeight:900, color:K.muted, textTransform:"uppercase"}}>
                {inn.R} CARRERAS, {inn.H} HIT{inn.H!==1?"S":""}, {inn.E} ERRORES
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}