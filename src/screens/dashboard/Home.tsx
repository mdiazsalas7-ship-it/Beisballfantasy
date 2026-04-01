import { useState, useEffect } from "react";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoBall } from "../../components/Icons.tsx";
import { LeagueLogo, TeamLogo, Diamond, Empty } from "../../components/UI.tsx";

export default function Home({ data, nav }: any) {
  const live = data.games.filter((g: any) => g.status === "live");
  const recent = data.games.filter((g: any) => g.status === "final").sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);
  const standings = data.teams.map((t: any) => { const tot = (t.wins || 0) + (t.losses || 0); return { ...t, pct: tot > 0 ? (t.wins || 0) / tot : 0 }; }).sort((a: any, b: any) => b.pct - a.pct);

  const leaders: any[] = [];
  const addLeader = (label: string, unit: string, icon: string, color: string, list: any[], getStat: (p: any) => any) => {
    if (list[0]) leaders.push({ label, unit, icon, color, p: list[0], val: getStat(list[0]) });
  };
  const batters = [...data.players].filter((p: any) => p.batting?.VB > 9);
  const pitchers = [...data.players].filter((p: any) => p.pitching?.IL > 0);

  addLeader("PROMEDIO", "AVG", "🔥", "#22d3a8", [...batters].sort((a, b) => (b.batting.H / b.batting.VB) - (a.batting.H / a.batting.VB)), p => (p.batting.H / p.batting.VB).toFixed(3));
  addLeader("JONRONES", "HR", "💥", "#f43f5e", [...data.players].filter(p => p.batting?.HR > 0).sort((a, b) => b.batting.HR - a.batting.HR), p => p.batting.HR);
  addLeader("HITS", "H", "🏏", "#f97316", [...data.players].filter(p => p.batting?.H > 0).sort((a, b) => b.batting.H - a.batting.H), p => p.batting.H);
  addLeader("EMPUJADAS", "CI", "🏅", "#eab308", [...data.players].filter(p => p.batting?.CI > 0).sort((a, b) => b.batting.CI - a.batting.CI), p => p.batting.CI);
  addLeader("CARRERAS", "CA", "🏃", "#06b6d4", [...data.players].filter(p => p.batting?.CA > 0).sort((a, b) => b.batting.CA - a.batting.CA), p => p.batting.CA);
  addLeader("BASES ROBADAS", "BR", "⚡", "#8b5cf6", [...data.players].filter(p => p.batting?.BR > 0).sort((a, b) => b.batting.BR - a.batting.BR), p => p.batting.BR);
  addLeader("EFECTIVIDAD", "ERA", "🎯", "#60a5fa", [...pitchers].sort((a, b) => { const ae = (a.pitching.CL * 7) / a.pitching.IL; const be = (b.pitching.CL * 7) / b.pitching.IL; return ae - be; }), p => ((p.pitching.CL * 7) / p.pitching.IL).toFixed(2));
  addLeader("PONCHES", "K", "💨", "#a78bfa", [...data.players].filter(p => p.pitching?.K > 0).sort((a, b) => b.pitching.K - a.pitching.K), p => p.pitching.K);

  const latestNews = (data.news || []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3);

  const [resultIdx, setResultIdx] = useState(0);
  const [leaderIdx, setLeaderIdx] = useState(0);
  const [newsIdx, setNewsIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setResultIdx(p => (p + 1) % (recent.length || 1));
      setLeaderIdx(p => (p + 1) % (leaders.length || 1));
      setNewsIdx(p => (p + 1) % (latestNews.length || 1));
    }, 4500);
    return () => clearInterval(t);
  }, [recent.length, leaders.length, latestNews.length]);

  const findTeam = (id: string) => data.teams.find((t: any) => t.id === id);

  const RoundLogo = ({ team, size = 44 }: any) => (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "#fff", border: `2px solid ${K.border}`, flexShrink: 0 }}>
      {team?.logo
        ? <img src={team.logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: team?.color || K.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: size * 0.35, color: "#fff" }}>{team?.abbr || "?"}</div>
      }
    </div>
  );

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

  return (
    <div style={{ ...S.sec, animation: "slideUp .4s ease" }}>
      <style>{`
        @keyframes fadeCard{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-card{animation:fadeCard .4s ease}
        .scroll-x::-webkit-scrollbar{display:none}.scroll-x{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* ═══ LIVE GAMES ═══ */}
      {live.length > 0 && live.map((g: any) => {
        const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId);
        return (
          <div key={g.id} onClick={() => nav("scorer", "watch", g.id)}
            style={{ background: `linear-gradient(135deg, #7f1d1d, ${K.card})`, borderRadius: 24, padding: 16, cursor: "pointer", marginBottom: 16, border: `2px solid ${K.live}`, animation: "glow 3s infinite", position: "relative" }}>
            <div style={{ position: "absolute", top: 10, right: 14 }}>
              <span style={{ background: K.live, color: "#fff", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 900, animation: "pulse 2s infinite" }}>● EN VIVO</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <RoundLogo team={aw} size={48} />
                <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", marginTop: 6 }}>{aw?.name}</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>{g.awayScore} - {g.homeScore}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontWeight: 700 }}>Ent {g.inning || 1} {g.half === "top" ? "▲" : "▼"} · {g.outs || 0} outs</div>
                <div style={{ marginTop: 6 }}><Diamond bases={g.bases || [false, false, false]} size={44} /></div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <RoundLogo team={hm} size={48} />
                <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", marginTop: 6 }}>{hm?.name}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ═══ RESULTS CAROUSEL ═══ */}
      {recent.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 12, fontWeight: 900, color: K.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>⚾ Resultados</h2>
          <div style={{ height: 160, borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
            {(() => {
              const g = recent[resultIdx]; if (!g) return null;
              const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId);
              const d = g.createdAt ? new Date(g.createdAt) : null;
              return (
                <div key={resultIdx} className="fade-card" style={{ height: "100%", background: `linear-gradient(135deg, ${K.accentDk}, #0c1220)`, color: "#fff", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {d && <div style={{ textAlign: "center", marginBottom: 6 }}><span style={{ fontSize: 9, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>{d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ textAlign: "center", flex: 1 }}><RoundLogo team={aw} size={40} /><div style={{ fontSize: 10, fontWeight: 900, marginTop: 4 }}>{aw?.name}</div></div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontSize: 32, fontWeight: 900 }}>
                        <span style={{ color: g.awayScore > g.homeScore ? K.accent : "rgba(255,255,255,.4)" }}>{g.awayScore}</span>
                        <span style={{ color: "rgba(255,255,255,.2)", margin: "0 6px" }}>-</span>
                        <span style={{ color: g.homeScore > g.awayScore ? K.accent : "rgba(255,255,255,.4)" }}>{g.homeScore}</span>
                      </div>
                      <span style={{ background: "rgba(255,255,255,.12)", padding: "2px 10px", borderRadius: 10, fontSize: 9, fontWeight: 800 }}>FINAL</span>
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}><RoundLogo team={hm} size={40} /><div style={{ fontSize: 10, fontWeight: 900, marginTop: 4 }}>{hm?.name}</div></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10 }}>
                    {recent.map((_: any, i: number) => <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: i === resultIdx ? K.accent : "rgba(255,255,255,.2)" }} />)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ NEWS CAROUSEL ═══ */}
      {latestNews.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 12, fontWeight: 900, color: K.accent, textTransform: "uppercase", letterSpacing: 1 }}>📰 Últimas Noticias</h2>
            <button onClick={() => nav("news")} style={{ fontSize: 11, color: K.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Ver todas →</button>
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", border: `2px solid ${K.blue}33`, boxShadow: `0 8px 25px ${K.blue}15` }}>
            {(() => {
              const n = latestNews[newsIdx]; if (!n) return null;
              return (
                <div key={newsIdx} className="fade-card" onClick={() => nav("news")} style={{ cursor: "pointer", background: K.card }}>
                  {n.imageUrl && (
                    <div style={{ width: "100%", height: 140, overflow: "hidden", background: "#000" }}>
                      <img src={n.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                    </div>
                  )}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {n.league && <span style={{ ...S.badge(K.blue), fontSize: 8 }}>{n.league}</span>}
                        <span style={{ ...S.badge(K.accent), fontSize: 8 }}>⚡ NUEVA</span>
                      </div>
                      <span style={{ fontSize: 9, color: K.muted }}>{formatDate(n.createdAt)}</span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: K.text, lineHeight: 1.2, marginBottom: 4 }}>{n.title}</h3>
                    <p style={{ fontSize: 11, color: K.dim, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{n.body}</p>
                    {n.source && <p style={{ fontSize: 9, color: K.muted, marginTop: 6, fontWeight: 600 }}>📍 {n.source}</p>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, paddingBottom: 10 }}>
                    {latestNews.map((_: any, i: number) => <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: i === newsIdx ? K.blue : K.border }} />)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ LEADERS CAROUSEL ═══ */}
      {leaders.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 12, fontWeight: 900, color: K.accent, textTransform: "uppercase", letterSpacing: 1 }}>⭐ Líderes de la Categoría</h2>
            <button onClick={() => nav("stats")} style={{ fontSize: 11, color: K.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Ver más →</button>
          </div>

          <div style={{ borderRadius: 24, overflow: "hidden", border: `2.5px solid ${leaders[leaderIdx]?.color || K.border}`, marginBottom: 12, boxShadow: `0 8px 25px ${leaders[leaderIdx]?.color || K.border}20` }}>
            {(() => {
              const ldr = leaders[leaderIdx];
              const tm = findTeam(ldr.p?.teamId);
              const inicial = (ldr.p?.name || "?").charAt(0).toUpperCase();
              return (
                <div key={leaderIdx} className="fade-card" style={{ background: K.card }}>
                  <div style={{ background: ldr.color, padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {ldr.icon} LÍDER EN {ldr.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: ldr.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 24, flexShrink: 0, border: `3px solid ${ldr.color}55` }}>
                      {ldr.p?.photoUrl
                        ? <img src={ldr.p.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : inicial
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: K.text }}>{ldr.p?.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <TeamLogo team={tm} size={16} />
                        <span style={{ fontSize: 10, color: K.muted, fontWeight: 700 }}>{tm?.name}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 30, fontWeight: 900, color: ldr.color, lineHeight: 1 }}>{ldr.val}</div>
                      <div style={{ fontSize: 10, color: K.muted, fontWeight: 700 }}>{ldr.unit}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, paddingBottom: 10 }}>
                    {leaders.map((_: any, i: number) => <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: i === leaderIdx ? ldr.color : K.border }} />)}
                  </div>
                </div>
              );
            })()}
          </div>

          <div style={{ display: "flex", overflowX: "auto", gap: 10, paddingBottom: 6 }} className="scroll-x">
            {leaders.map((ldr: any, i: number) => {
              const tm = findTeam(ldr.p?.teamId);
              return (
                <div key={i} onClick={() => nav("teams", "playerCard", ldr.p?.id)}
                  style={{ minWidth: 110, background: K.card, borderRadius: 14, border: `2px solid ${i === leaderIdx ? ldr.color : K.border}`, padding: 10, cursor: "pointer", flexShrink: 0, textAlign: "center", transition: "border-color .3s" }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: ldr.color, textTransform: "uppercase", marginBottom: 4 }}>{ldr.icon} {ldr.label}</div>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: ldr.color, margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14 }}>
                    {ldr.p?.photoUrl
                      ? <img src={ldr.p.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (ldr.p?.name || "?").charAt(0)
                    }
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ldr.p?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 3 }}>
                    <TeamLogo team={tm} size={12} />
                    <span style={{ fontSize: 9, color: K.muted }}>{tm?.abbr}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: ldr.color, marginTop: 2 }}>{ldr.val}<span style={{ fontSize: 8, color: K.muted, marginLeft: 2 }}>{ldr.unit}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ STANDINGS SUMMARY ═══ */}
      {standings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 12, fontWeight: 900, color: K.accent, textTransform: "uppercase", letterSpacing: 1 }}>🏆 Posiciones</h2>
            <button onClick={() => nav("standings")} style={{ fontSize: 11, color: K.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Ver tabla →</button>
          </div>
          <div style={{ ...S.card, overflow: "hidden", border: `2.5px solid ${K.accent}` }}>
            <div style={{ background: K.accent, padding: "7px 14px", textAlign: "center" }}>
              <span style={{ fontWeight: 900, fontSize: 11, color: "#000", textTransform: "uppercase" }}>{data.category?.name} — TABLA OFICIAL</span>
            </div>
            <div style={{ padding: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ color: K.muted, borderBottom: `1px solid ${K.border}` }}>
                    <th style={{ textAlign: "left", paddingBottom: 5, fontSize: 9 }}>EQUIPO</th>
                    <th style={{ textAlign: "center", fontSize: 9 }}>JG</th>
                    <th style={{ textAlign: "center", fontSize: 9 }}>JP</th>
                    <th style={{ textAlign: "center", fontSize: 9, color: K.accent }}>PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.slice(0, 5).map((t: any, i: number) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${K.border}` }}>
                      <td style={{ padding: "7px 0", display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontWeight: 900, fontSize: 11, color: i === 0 ? K.gold : i < 3 ? K.accent : K.muted, width: 14 }}>{i + 1}</span>
                        <TeamLogo team={t} size={22} />
                        <span style={{ fontWeight: 800, fontSize: 11, color: K.text }}>{t.name}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: K.accent }}>{t.wins || 0}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: K.red }}>{t.losses || 0}</td>
                      <td style={{ textAlign: "center", fontWeight: 900, color: K.accent }}>{t.pct.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMPTY ═══ */}
      {data.teams.length === 0 && (
        <Empty icon={IcoBall} text="¡Comienza creando equipos!" action={data.isAdmin ? () => nav("teams") : undefined} actionLabel="Crear Equipo" />
      )}
    </div>
  );
}