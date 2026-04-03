import { useState, useEffect, useMemo } from "react";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoBall } from "../../components/Icons.tsx";
import { TeamLogo, Diamond, Empty } from "../../components/UI.tsx";

// ─────────────────────────────────────────────
// COMPONENTES AUXILIARES Y FUNCIONES
// ─────────────────────────────────────────────
const formatDate = (ts: number) => {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString("es", { day: "numeric", month: "short" });
};

const RoundLogo = ({ team, size = 44 }: any) => (
  <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "#fff", border: `2px solid ${K.border || '#eee'}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {team?.logo
      ? <img src={team.logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={team?.name || "Logo"} />
      : <div style={{ width: "100%", height: "100%", background: team?.color || K.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: size * 0.35, color: "#fff" }}>{team?.abbr || "?"}</div>
    }
  </div>
);

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL HOME
// ─────────────────────────────────────────────
export default function Home({ data, nav }: any) {
  const [resultIdx, setResultIdx] = useState(0);
  const [leaderIdx, setLeaderIdx] = useState(0);
  const [newsIdx, setNewsIdx] = useState(0);

  const findTeam = (id: string) => data.teams.find((t: any) => t.id === id);

  // ── OPTIMIZACIONES DE RENDIMIENTO (useMemo) ──
  const live = useMemo(() => data.games.filter((g: any) => g.status === "live"), [data.games]);
  
  const recent = useMemo(() => 
    data.games.filter((g: any) => g.status === "final")
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5)
  , [data.games]);

  const scheduled = useMemo(() => 
    data.games.filter((g: any) => g.status === "scheduled")
      .sort((a: any, b: any) => (a.date || "").localeCompare(b.date || "") || (a.time || "00:00").localeCompare(b.time || "00:00"))
      .slice(0, 4)
  , [data.games]);
  
  const standings = useMemo(() => 
    data.teams.map((t: any) => { 
      const tot = (t.wins || 0) + (t.losses || 0); 
      return { ...t, pct: tot > 0 ? (t.wins || 0) / tot : 0 }; 
    }).sort((a: any, b: any) => b.pct - a.pct)
  , [data.teams]);

  const latestNews = useMemo(() => 
    (data.news || []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5)
  , [data.news]);

  const leaders = useMemo(() => {
    const ldrArray: any[] = [];
    const addLeader = (label: string, unit: string, icon: string, color: string, list: any[], getStat: (p: any) => any) => {
      if (list[0]) ldrArray.push({ label, unit, icon, color, p: list[0], val: getStat(list[0]) });
    };
    
    const batters = [...data.players].filter((p: any) => p.batting?.VB > 9);
    const pitchers = [...data.players].filter((p: any) => p.pitching?.IL > 0);

    addLeader("PROMEDIO", "AVG", "🔥", "#22d3a8", [...batters].sort((a, b) => (b.batting.H / b.batting.VB) - (a.batting.H / a.batting.VB)), p => (p.batting.H / p.batting.VB).toFixed(3));
    addLeader("JONRONES", "HR", "💥", "#f43f5e", [...data.players].filter(p => p.batting?.HR > 0).sort((a, b) => b.batting.HR - a.batting.HR), p => p.batting.HR);
    addLeader("EMPUJADAS", "CI", "🏅", "#eab308", [...data.players].filter(p => p.batting?.CI > 0).sort((a, b) => b.batting.CI - a.batting.CI), p => p.batting.CI);
    addLeader("EFECTIVIDAD", "ERA", "🎯", "#60a5fa", [...pitchers].sort((a, b) => { const ae = (a.pitching.CL * 7) / a.pitching.IL; const be = (b.pitching.CL * 7) / b.pitching.IL; return ae - be; }), p => ((p.pitching.CL * 7) / p.pitching.IL).toFixed(2));
    addLeader("PONCHES", "K", "💨", "#a78bfa", [...data.players].filter(p => p.pitching?.K > 0).sort((a, b) => b.pitching.K - a.pitching.K), p => p.pitching.K);

    return ldrArray;
  }, [data.players]);

  // ── CARRUSEL AUTOMÁTICO ──
  useEffect(() => {
    const t = setInterval(() => {
      setResultIdx(p => (p + 1) % (recent.length || 1));
      setLeaderIdx(p => (p + 1) % (leaders.length || 1));
      setNewsIdx(p => (p + 1) % (latestNews.length || 1));
    }, 5500);
    return () => clearInterval(t);
  }, [recent.length, leaders.length, latestNews.length]);

  return (
    <div style={{ paddingBottom: 90, animation: "fadeIn .4s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .5s ease}
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main style={{ padding: "16px 16px 0", maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ═══ 1. JUEGOS EN VIVO (Hero) ═══ */}
        {live.length > 0 && live.map((g: any) => {
          const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId);
          return (
            <div key={g.id} onClick={() => nav("scorer", "watch", g.id)}
              style={{ background: `linear-gradient(135deg, ${K.live || '#e11d48'}, #881337)`, borderRadius: 24, padding: 20, cursor: "pointer", border: `2px solid ${K.live || '#f43f5e'}`, position: "relative", boxShadow: `0 10px 25px ${K.live || '#e11d48'}40` }}>
              <div style={{ position: "absolute", top: 12, right: 16 }}>
                <span style={{ background: "#fff", color: K.live || '#e11d48', padding: "4px 12px", borderRadius: 14, fontSize: 10, fontWeight: 900, animation: "pulse 2s infinite", letterSpacing: 1 }}>● EN VIVO</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{display:'flex', justifyContent:'center'}}><RoundLogo team={aw} size={50} /></div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", marginTop: 8 }} className="text-truncate">{aw?.abbr || aw?.name}</div>
                </div>
                <div style={{ textAlign: "center", flex: 1.2 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", letterSpacing: 2 }}>{g.awayScore}-{g.homeScore}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.8)", fontWeight: 700, marginTop: 2 }}>Ent {g.inning || 1} {g.half === "top" ? "▲" : "▼"} · {g.outs || 0} outs</div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Diamond bases={g.bases || [false, false, false]} size={40} /></div>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{display:'flex', justifyContent:'center'}}><RoundLogo team={hm} size={50} /></div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", marginTop: 8 }} className="text-truncate">{hm?.abbr || hm?.name}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ═══ 2. RESULTADOS RECIENTES ═══ */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 900, color: K.accent || '#1e3a8a', marginBottom: 12, textTransform: "uppercase" }}>⚾ Resultados Recientes</h2>
          <div style={{ position: "relative", height: 160, borderRadius: 24, overflow: "hidden", boxShadow: `0 10px 30px ${K.accent || '#1e3a8a'}20` }}>
            {recent.length > 0 ? (() => {
              const g = recent[resultIdx]; if (!g) return null;
              const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId);
              return (
                <div key={resultIdx} className="fade-in" style={{ height: "100%", background: `linear-gradient(135deg, ${K.accent || '#1e3a8a'}, ${K.accentDk || '#1e40af'})`, color: "white", padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{display:'flex', justifyContent:'center'}}><RoundLogo team={aw} size={44} /></div>
                      <p style={{ fontSize: 10, fontWeight: 900, marginTop: 6 }} className="text-truncate">{aw?.name}</p>
                    </div>
                    <div style={{ textAlign: "center", flex: 1.2 }}>
                      <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{g.awayScore} - {g.homeScore}</p>
                      <span style={{ background: "rgba(255,255,255,.2)", padding: "2px 10px", borderRadius: 10, fontSize: 9, fontWeight: 800 }}>FINAL</span>
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{display:'flex', justifyContent:'center'}}><RoundLogo team={hm} size={44} /></div>
                      <p style={{ fontSize: 10, fontWeight: 900, marginTop: 6 }} className="text-truncate">{hm?.name}</p>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div style={{ height: "100%", background: K.card || '#f8fafc', borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: K.muted || '#94a3b8' }}>No hay resultados recientes</div>
            )}
          </div>
        </section>

        {/* ═══ 3. GRID: NOTICIAS Y LÍDERES ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div onClick={() => nav("news")} style={{ height: 210, background: K.card || "white", borderRadius: 24, border: `2.5px solid ${K.accent || '#1e3a8a'}`, cursor: "pointer", overflow: "hidden", boxShadow: `0 8px 25px ${K.accent || '#1e3a8a'}15`, display: "flex", flexDirection: "column" }}>
            <div style={{ background: K.accent || '#1e3a8a', padding: "6px 12px" }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: "white", margin: 0, textAlign: "center" }}>📰 PRENSA LIGA</p>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", overflow: "hidden", position: "relative" }}>
              {latestNews.length > 0 && latestNews[newsIdx] ? (
                 <img key={newsIdx} src={latestNews[newsIdx].imageUrl} className="fade-in" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              ) : <IcoBall size={30} color={K.muted}/>}
            </div>
            <div style={{ padding: "10px 12px", height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textAlign: "center", color: K.text || '#1e293b', margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {latestNews[newsIdx]?.title?.toUpperCase() || "SIN NOTICIAS RECIENTES"}
              </p>
            </div>
          </div>

          <div onClick={() => nav("stats")} style={{ height: 210, background: K.card || "#ffffff", borderRadius: 24, border: `2.5px solid ${leaders[leaderIdx]?.color || K.border || '#eee'}`, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 8px 25px ${leaders[leaderIdx]?.color || '#eee'}25` }}>
            {leaders.length > 0 ? (() => {
              const ldr = leaders[leaderIdx];
              const tm = findTeam(ldr.p?.teamId);
              const inicial = (ldr.p?.name || "?").charAt(0).toUpperCase();
              return (
                <div key={leaderIdx} className="fade-in" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ background: ldr.color, padding: "6px 10px", color: "white", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {ldr.icon} LÍDER EN {ldr.label}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "12px 10px", gap: 6 }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: `3px solid ${ldr.color}`, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {ldr.p?.photoUrl 
                        ? <img src={ldr.p.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : <span style={{ fontSize: 24, fontWeight: 900, color: ldr.color }}>{inicial}</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: K.text || '#1e293b', lineHeight: 1.1, textAlign: "center" }} className="text-truncate">{ldr.p?.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <TeamLogo team={tm} size={14} />
                      <span style={{ fontSize: 9, color: K.muted || '#64748b', fontWeight: 800, textTransform: "uppercase" }}>{tm?.abbr || tm?.name}</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: ldr.color, lineHeight: 1, marginTop: 4 }}>
                      {ldr.val} <span style={{ fontSize: 10, color: K.muted || '#94a3b8', marginLeft: 2 }}>{ldr.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: K.muted || '#94a3b8' }}>Cargando líderes...</div>
            )}
          </div>
        </div>

        {/* ═══ 4. TABLA RESUMEN COMPACTA ═══ */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, color: K.accent || '#1e3a8a', margin: 0 }}>🏆 Tabla de Posiciones</h2>
            <button onClick={() => nav("standings")} style={{ fontSize: 10, fontWeight: 900, color: K.muted || '#94a3b8', background: "#f1f5f9", padding: "4px 12px", borderRadius: 12, border: "none" }}>VER COMPLETA</button>
          </div>
          <div style={{ background: K.card || "white", borderRadius: 24, overflow: "hidden", border: `2.5px solid ${K.accent || '#1e3a8a'}`, boxShadow: `0 8px 20px ${K.accent || '#1e3a8a'}15` }}>
            <div style={{ background: K.accent || '#1e3a8a', padding: 8, textAlign: "center" }}>
              <h4 style={{ fontSize: 10, color: "white", margin: 0, fontWeight: 900, textTransform: "uppercase" }}>{data.category?.name || "Clasificación General"}</h4>
            </div>
            <div style={{ padding: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ color: K.muted || '#94a3b8', borderBottom: `1px solid ${K.border || '#f1f5f9'}` }}>
                    <th style={{ textAlign: "left", paddingBottom: 6 }}>EQUIPO</th>
                    <th style={{ textAlign: "center", paddingBottom: 6 }}>JG</th>
                    <th style={{ textAlign: "center", paddingBottom: 6 }}>JP</th>
                    <th style={{ textAlign: "center", paddingBottom: 6, color: K.accent || '#1e3a8a' }}>PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.length > 0 ? standings.slice(0, 4).map((t: any, i: number) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${K.border || '#f8fafc'}` }}>
                      <td style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 10 }}>
                         <span style={{ fontWeight: 900, fontSize: 10, color: i === 0 ? "#eab308" : K.muted, width: 12 }}>{i + 1}</span>
                         <RoundLogo team={t} size={26} />
                         <span style={{ fontWeight: 800, color: K.text || '#1e293b', fontSize: 11 }} className="text-truncate">{t.name.toUpperCase()}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold" }}>{t.wins || 0}</td>
                      <td style={{ textAlign: "center", fontWeight: "bold", color: "#ef4444" }}>{t.losses || 0}</td>
                      <td style={{ textAlign: "center", fontWeight: 900, color: K.accent || '#1e3a8a' }}>{t.pct.toFixed(3)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: 10, color: K.muted || '#94a3b8' }}>Registrando equipos...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ═══ 5. PRÓXIMOS JUEGOS ═══ */}
        <section>
          <div style={{ background: K.card || "white", borderRadius: 24, border: `2.5px solid ${K.blue || '#3b82f6'}`, overflow: "hidden", boxShadow: `0 10px 30px ${K.blue || '#3b82f6'}15` }}>
            <div style={{ background: K.blue || '#3b82f6', padding: "12px 16px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: "white", margin: 0, textTransform: "uppercase" }}>📅 Próxima Jornada</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", padding: 12, gap: 12 }}>
              {scheduled.length > 0 ? scheduled.map((j: any) => {
                const aw = findTeam(j.awayTeamId), hm = findTeam(j.homeTeamId);
                return (
                  <div key={j.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: K.input || '#f8fafc', borderRadius: 18, border: `1px solid ${K.border || '#e2e8f0'}` }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, textAlign: "right", lineHeight: 1.1 }} className="text-truncate">{aw?.name.toUpperCase()}</span>
                      <RoundLogo team={aw} size={32} />
                    </div>
                    <div style={{ flex: 0.8, textAlign: "center", margin: "0 5px" }}>
                      <span style={{ background: K.blue || '#3b82f6', color: "white", padding: "4px 12px", borderRadius: 12, fontSize: 10, fontWeight: 900 }}>
                        {j.time || "VS"}
                      </span>
                      <p style={{ fontSize: 9, color: K.muted || '#94a3b8', marginTop: 4, fontWeight: "bold" }}>{j.date}</p>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
                      <RoundLogo team={hm} size={32} />
                      <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.1 }} className="text-truncate">{hm?.name.toUpperCase()}</span>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: K.muted || '#94a3b8' }}>Sin juegos programados</div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ EMPTY STATE GLOBAL ═══ */}
        {data.teams.length === 0 && (
          <Empty icon={IcoBall} text="¡Comienza creando equipos!" action={data.isAdmin ? () => nav("teams") : undefined} actionLabel="Crear Equipo" />
        )}
      </main> 
    </div>
  );
}