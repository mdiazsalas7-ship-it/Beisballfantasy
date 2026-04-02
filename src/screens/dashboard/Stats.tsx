import { useState } from "react";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoBar } from "../../components/Icons.tsx";
import { TeamLogo, Empty } from "../../components/UI.tsx";

export default function StatsPage({ data, nav }: any) {
  const [tab, setTab] = useState("bateo");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const findTeam = (id: string) => data.teams.find((t: any) => t.id === id);

  // ─── BATTING LEADERS ───
  const batters = [...data.players].filter((p: any) => p.batting?.VB > 0);
  const topAVG = [...batters].sort((a, b) => (b.batting.H / b.batting.VB) - (a.batting.H / a.batting.VB)).slice(0, 10);
  const topHR = [...data.players].filter(p => p.batting?.HR > 0).sort((a, b) => b.batting.HR - a.batting.HR).slice(0, 10);
  const topH = [...data.players].filter(p => p.batting?.H > 0).sort((a, b) => b.batting.H - a.batting.H).slice(0, 10);
  const topCI = [...data.players].filter(p => p.batting?.CI > 0).sort((a, b) => b.batting.CI - a.batting.CI).slice(0, 10);
  const topCA = [...data.players].filter(p => p.batting?.CA > 0).sort((a, b) => b.batting.CA - a.batting.CA).slice(0, 10);
  const topBR = [...data.players].filter(p => p.batting?.BR > 0).sort((a, b) => b.batting.BR - a.batting.BR).slice(0, 10);
  const topBB = [...data.players].filter(p => p.batting?.BB > 0).sort((a, b) => b.batting.BB - a.batting.BB).slice(0, 10);
  const top2B = [...data.players].filter(p => p.batting?.["2B"] > 0).sort((a, b) => b.batting["2B"] - a.batting["2B"]).slice(0, 10);
  const top3B = [...data.players].filter(p => p.batting?.["3B"] > 0).sort((a, b) => b.batting["3B"] - a.batting["3B"]).slice(0, 10);
  const topOBP = [...batters].sort((a, b) => {
    const oa = (a.batting.H + (a.batting.BB||0)) / (a.batting.VB + (a.batting.BB||0));
    const ob = (b.batting.H + (b.batting.BB||0)) / (b.batting.VB + (b.batting.BB||0));
    return ob - oa;
  }).slice(0, 10);
  const topSLG = [...batters].sort((a, b) => {
    const tbA = (a.batting.H-(a.batting["2B"]||0)-(a.batting["3B"]||0)-a.batting.HR)+(a.batting["2B"]||0)*2+(a.batting["3B"]||0)*3+a.batting.HR*4;
    const tbB = (b.batting.H-(b.batting["2B"]||0)-(b.batting["3B"]||0)-b.batting.HR)+(b.batting["2B"]||0)*2+(b.batting["3B"]||0)*3+b.batting.HR*4;
    return (tbB/b.batting.VB)-(tbA/a.batting.VB);
  }).slice(0, 10);

  // ─── PITCHING LEADERS ───
  const pitchers = [...data.players].filter((p: any) => p.pitching?.IL > 0);
  const topERA = [...pitchers].sort((a, b) => ((a.pitching.CL*7)/a.pitching.IL) - ((b.pitching.CL*7)/b.pitching.IL)).slice(0, 10);
  const topK = [...data.players].filter(p => p.pitching?.K > 0).sort((a, b) => b.pitching.K - a.pitching.K).slice(0, 10);
  const topW = [...data.players].filter(p => p.pitching?.G > 0).sort((a, b) => b.pitching.G - a.pitching.G).slice(0, 10);
  const topWHIP = [...pitchers].sort((a, b) => ((a.pitching.H+a.pitching.BB)/a.pitching.IL) - ((b.pitching.H+b.pitching.BB)/b.pitching.IL)).slice(0, 10);
  const topJC = [...data.players].filter(p => p.pitching?.JC > 0).sort((a, b) => b.pitching.JC - a.pitching.JC).slice(0, 10);
  const topIL = [...pitchers].sort((a, b) => b.pitching.IL - a.pitching.IL).slice(0, 10);

  // ─── CATEGORIES ───
  const battingCats = [
    { key: "avg", label: "PROMEDIO", icon: "🔥", color: "#22d3a8", players: topAVG, getStat: (p: any) => (p.batting.H / p.batting.VB).toFixed(3), unit: "AVG" },
    { key: "hr", label: "JONRONES", icon: "💥", color: "#f43f5e", players: topHR, getStat: (p: any) => p.batting.HR, unit: "HR" },
    { key: "h", label: "HITS", icon: "🏏", color: "#f97316", players: topH, getStat: (p: any) => p.batting.H, unit: "H" },
    { key: "ci", label: "CARRERAS EMPUJADAS", icon: "🏅", color: "#eab308", players: topCI, getStat: (p: any) => p.batting.CI, unit: "CI" },
    { key: "ca", label: "CARRERAS ANOTADAS", icon: "🏃", color: "#06b6d4", players: topCA, getStat: (p: any) => p.batting.CA, unit: "CA" },
    { key: "br", label: "BASES ROBADAS", icon: "⚡", color: "#8b5cf6", players: topBR, getStat: (p: any) => p.batting.BR, unit: "BR" },
    { key: "bb", label: "BASES POR BOLAS", icon: "👁", color: "#64748b", players: topBB, getStat: (p: any) => p.batting.BB, unit: "BB" },
    { key: "2b", label: "DOBLES", icon: "✌️", color: "#14b8a6", players: top2B, getStat: (p: any) => p.batting["2B"], unit: "2B" },
    { key: "3b", label: "TRIPLES", icon: "🔱", color: "#6366f1", players: top3B, getStat: (p: any) => p.batting["3B"], unit: "3B" },
    { key: "obp", label: "OBP", icon: "🎯", color: "#10b981", players: topOBP, getStat: (p: any) => ((p.batting.H+(p.batting.BB||0))/(p.batting.VB+(p.batting.BB||0))).toFixed(3), unit: "OBP" },
    { key: "slg", label: "SLUGGING", icon: "💪", color: "#e11d48", players: topSLG, getStat: (p: any) => {
      const tb=(p.batting.H-(p.batting["2B"]||0)-(p.batting["3B"]||0)-p.batting.HR)+(p.batting["2B"]||0)*2+(p.batting["3B"]||0)*3+p.batting.HR*4;
      return (tb/p.batting.VB).toFixed(3);
    }, unit: "SLG" },
  ];

  const pitchingCats = [
    { key: "era", label: "EFECTIVIDAD", icon: "🎯", color: "#60a5fa", players: topERA, getStat: (p: any) => ((p.pitching.CL*7)/p.pitching.IL).toFixed(2), unit: "ERA" },
    { key: "k", label: "PONCHES", icon: "💨", color: "#a78bfa", players: topK, getStat: (p: any) => p.pitching.K, unit: "K" },
    { key: "w", label: "JUEGOS GANADOS", icon: "🏆", color: "#22c55e", players: topW, getStat: (p: any) => p.pitching.G, unit: "G" },
    { key: "whip", label: "WHIP", icon: "📉", color: "#f43f5e", players: topWHIP, getStat: (p: any) => ((p.pitching.H+p.pitching.BB)/p.pitching.IL).toFixed(2), unit: "WHIP" },
    { key: "jc", label: "JUEGOS COMPLETOS", icon: "💎", color: "#eab308", players: topJC, getStat: (p: any) => p.pitching.JC, unit: "JC" },
    { key: "il", label: "INNINGS LANZADOS", icon: "⚾", color: "#06b6d4", players: topIL, getStat: (p: any) => p.pitching.IL, unit: "IL" },
  ];

  const currentCats = tab === "bateo" ? battingCats : pitchingCats;
  const detailCat = currentCats.find(c => c.key === selectedCat);

  return (
    <div style={S.sec}>
      <style>{`
        @keyframes fadeIn2{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-in2{animation:fadeIn2 .3s ease}
        .scroll-cats::-webkit-scrollbar{display:none}.scroll-cats{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: K.accent, textTransform: "uppercase" }}>📊 Estadísticas</h2>
        <p style={{ fontSize: 11, color: K.muted, marginTop: 2 }}>{data.category?.name} — {data.league?.name}</p>
      </div>

      {/* ═══ MVP RACE ═══ */}
      {(() => {
        const mvpList = data.players
          .map((p: any) => {
            const b = p.batting || {};
            const pt = p.pitching || {};
            const vb = b.VB || 0; const h = b.H || 0; const hr = b.HR || 0;
            const ci = b.CI || 0; const ca = b.CA || 0; const br = b.BR || 0;
            const bb = b.BB || 0; const k_bat = b.K || 0; const jj = b.JJ || 0;
            const d = b["2B"] || 0; const t = b["3B"] || 0;
            const il = pt.IL || 0; const k_pit = pt.K || 0; const cl = pt.CL || 0;
            const g = pt.G || 0; const jc = pt.JC || 0;
            if (jj === 0 && il === 0) return null;

            const avg = vb > 0 ? h / vb : 0;
            const obp = (vb + bb) > 0 ? (h + bb) / (vb + bb) : 0;
            const tb = (h - d - t - hr) + d * 2 + t * 3 + hr * 4;
            const slg = vb > 0 ? tb / vb : 0;
            const ops = obp + slg;
            const era = il > 0 ? (cl * 7) / il : 99;

            let score = 0;
            if (vb > 0) { score += ops * 100 + hr * 8 + ci * 3 + ca * 2 + br * 4 + h * 1.5 - k_bat * 0.5 + jj * 2; }
            if (il > 0) { score += Math.max(0, (7 - era)) * 10 + k_pit * 2 + g * 15 + jc * 20 + il * 1.5; }

            const tm = findTeam(p.teamId);
            return {
              ...p, score: Math.round(score * 10) / 10, tm,
              statLine: vb > 0
                ? `${avg.toFixed(3)} AVG · ${hr} HR · ${ci} CI · ${ops.toFixed(3)} OPS`
                : `${era.toFixed(2)} ERA · ${k_pit} K · ${g} G · ${il} IL`,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 10);

        if (mvpList.length === 0) return null;
        const leader = mvpList[0];
        const maxScore = leader.score;

        return (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, color: K.gold, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>🏆 Carrera por el MVP</h2>
              <span style={{ fontSize: 10, color: K.muted, fontWeight: 600 }}>{data.category?.name}</span>
            </div>

            {/* Leader Card */}
            <div style={{ ...S.card, marginBottom: 14, overflow: "hidden", border: `3px solid ${K.gold}`, background: `linear-gradient(135deg, #1a1500, ${K.card})`, boxShadow: `0 8px 30px ${K.gold}22` }}>
              <div style={{ background: `linear-gradient(135deg, ${K.gold}, #b8860b)`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>👑</span>
                <span style={{ fontWeight: 900, fontSize: 14, color: "#000", textTransform: "uppercase", letterSpacing: "1px" }}>LÍDER MVP</span>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `4px solid ${K.gold}`, background: leader.tm?.color || K.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 20px ${K.gold}33` }}>
                  {leader.photoUrl ? <img src={leader.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontWeight: 900, color: "#fff", fontSize: 30 }}>{(leader.name || "?").charAt(0)}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: K.text, lineHeight: 1.1 }}>{leader.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <TeamLogo team={leader.tm} size={18} />
                    <span style={{ fontSize: 11, color: K.muted, fontWeight: 700 }}>{leader.tm?.name}</span>
                    <span style={{ fontSize: 10, color: K.muted }}>· {leader.position} · #{leader.number}</span>
                  </div>
                  <div style={{ fontSize: 11, color: K.dim, marginTop: 6, fontWeight: 600 }}>{leader.statLine}</div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: K.gold, lineHeight: 1 }}>{leader.score}</div>
                  <div style={{ fontSize: 9, color: K.muted, fontWeight: 700, marginTop: 2 }}>MVP PTS</div>
                </div>
              </div>
            </div>

            {/* Race List */}
            <div style={{ ...S.card, overflow: "hidden" }}>
              <div style={{ background: K.accentDk, padding: "8px 14px" }}>
                <span style={{ fontWeight: 900, fontSize: 11, color: K.accent }}>TOP 10 — CANDIDATOS MVP</span>
              </div>
              {mvpList.map((p: any, i: number) => {
                const pct = maxScore > 0 ? (p.score / maxScore) * 100 : 0;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div key={p.id} onClick={() => nav("teams", "playerCard", p.id)}
                    style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: i < mvpList.length - 1 ? `1px solid ${K.border}` : "none", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: i === 0 ? `${K.gold}12` : i < 3 ? `${K.accent}08` : "transparent", transition: "width .5s ease" }} />
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? K.gold : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : K.border, color: i < 3 ? "#fff" : K.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, flexShrink: 0, marginRight: 10, zIndex: 1 }}>
                      {medal || (i + 1)}
                    </div>
                    <div style={{ width: i < 3 ? 38 : 30, height: i < 3 ? 38 : 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0, marginRight: 10, background: p.tm?.color || K.accent, border: `2px solid ${i === 0 ? K.gold : i < 3 ? K.accent : K.border}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                      {p.photoUrl ? <img src={p.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontWeight: 900, color: "#fff", fontSize: i < 3 ? 16 : 12 }}>{(p.name || "?").charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                      <div style={{ fontWeight: i < 3 ? 900 : 700, fontSize: i < 3 ? 14 : 12, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <TeamLogo team={p.tm} size={12} />
                        <span style={{ fontSize: 9, color: K.muted, fontWeight: 600 }}>{p.tm?.abbr} · {p.position}</span>
                      </div>
                      <div style={{ fontSize: 9, color: K.dim, marginTop: 2, fontWeight: 500 }}>{p.statLine}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, zIndex: 1, minWidth: 55 }}>
                      <div style={{ fontSize: i < 3 ? 18 : 14, fontWeight: 900, lineHeight: 1, color: i === 0 ? K.gold : i < 3 ? K.accent : K.text }}>{p.score}</div>
                      <div style={{ fontSize: 8, color: K.muted, fontWeight: 700 }}>PTS</div>
                      <div style={{ width: 50, height: 4, borderRadius: 2, background: K.border, marginTop: 3 }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: i === 0 ? K.gold : i < 3 ? K.accent : K.muted, transition: "width .5s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formula */}
            <div style={{ padding: "10px 14px", marginTop: 8, borderRadius: 12, background: K.input, border: `1px solid ${K.border}` }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: K.muted, textTransform: "uppercase", marginBottom: 4 }}>📐 Cómo se calcula el MVP</div>
              <div style={{ fontSize: 10, color: K.dim, lineHeight: 1.5 }}>
                <span style={{ color: K.accent, fontWeight: 700 }}>Bateo:</span> OPS×100 + HR×8 + CI×3 + CA×2 + BR×4 + H×1.5 + JJ×2 - K×0.5
                <br />
                <span style={{ color: K.blue, fontWeight: 700 }}>Pitcheo:</span> (7-ERA)×10 + K×2 + G×15 + JC×20 + IL×1.5
                <br />
                <span style={{ color: K.muted }}>Se actualiza automáticamente con cada juego.</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs: Bateo / Pitcheo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { k: "bateo", label: "⚾ BATEO", color: K.accent },
          { k: "pitcheo", label: "💪 PITCHEO", color: K.blue },
        ].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setSelectedCat(null); }}
            style={{
              flex: 1, padding: "12px 8px", borderRadius: 16, border: "none", cursor: "pointer",
              background: tab === t.k ? t.color : K.card,
              color: tab === t.k ? "#000" : K.dim,
              fontWeight: 900, fontSize: 13, transition: "all .2s",
              boxShadow: tab === t.k ? `0 4px 15px ${t.color}44` : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── DETAIL VIEW ─── */}
      {detailCat && detailCat.players.length > 0 ? (
        <div className="fade-in2">
          <button onClick={() => setSelectedCat(null)}
            style={{ background: "none", border: "none", color: K.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            ← Volver a categorías
          </button>

          <div style={{ ...S.card, overflow: "hidden", marginBottom: 16, border: `2.5px solid ${detailCat.color}` }}>
            <div style={{ background: detailCat.color, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{detailCat.icon}</span>
              <span style={{ fontWeight: 900, fontSize: 14, color: "#fff", textTransform: "uppercase" }}>TOP 10 — {detailCat.label}</span>
            </div>
            <div style={{ padding: 12 }}>
              {detailCat.players.map((p: any, i: number) => {
                const tm = findTeam(p.teamId);
                const isFirst = i === 0;
                return (
                  <div key={p.id || i} onClick={() => nav("teams", "playerCard", p.id)}
                    style={{ display: "flex", alignItems: "center", padding: isFirst ? "14px 8px" : "10px 8px", borderBottom: i < detailCat.players.length - 1 ? `1px solid ${K.border}` : "none", cursor: "pointer", borderRadius: isFirst ? 12 : 0, background: isFirst ? `${detailCat.color}11` : "transparent" }}>
                    <div style={{ width: isFirst ? 32 : 24, height: isFirst ? 32 : 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: isFirst ? 14 : 11, marginRight: 10, flexShrink: 0, background: i === 0 ? K.gold : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : K.border, color: i < 3 ? "#fff" : K.muted }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: isFirst ? 44 : 32, height: isFirst ? 44 : 32, borderRadius: "50%", overflow: "hidden", background: detailCat.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: isFirst ? 18 : 13, flexShrink: 0, border: isFirst ? `3px solid ${detailCat.color}55` : "none" }}>
                        {p.photoUrl ? <img src={p.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : (p.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: isFirst ? 15 : 13, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <TeamLogo team={tm} size={14} />
                          <span style={{ fontSize: 10, color: K.muted, fontWeight: 600 }}>{tm?.name || ""}</span>
                          <span style={{ fontSize: 9, color: K.muted }}>· {p.position}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: isFirst ? 26 : 18, fontWeight: 900, color: detailCat.color, lineHeight: 1 }}>{detailCat.getStat(p)}</div>
                      <div style={{ fontSize: 9, color: K.muted, fontWeight: 700 }}>{detailCat.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ─── CATEGORIES GRID ─── */
        <div className="fade-in2">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {currentCats.map((cat) => {
              const leader = cat.players[0];
              const tm = leader ? findTeam(leader.teamId) : null;
              const hasData = cat.players.length > 0;
              return (
                <div key={cat.key}
                  onClick={() => hasData && setSelectedCat(cat.key)}
                  style={{ ...S.card, cursor: hasData ? "pointer" : "default", border: `2px solid ${hasData ? cat.color + "44" : K.border}`, opacity: hasData ? 1 : 0.5 }}>
                  <div style={{ background: cat.color, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <span style={{ fontSize: 12 }}>{cat.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: ".5px" }}>{cat.label}</span>
                  </div>
                  <div style={{ padding: "12px 10px", textAlign: "center", background: K.card }}>
                    {leader ? (
                      <>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: cat.color, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 18, border: `2px solid ${cat.color}44` }}>
                          {leader.photoUrl ? <img src={leader.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : (leader.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{leader.name}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 3 }}>
                          <TeamLogo team={tm} size={12} />
                          <span style={{ fontSize: 9, color: K.muted, fontWeight: 600 }}>{tm?.abbr}</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: cat.color, marginTop: 4, lineHeight: 1 }}>
                          {cat.getStat(leader)}<span style={{ fontSize: 9, color: K.muted, marginLeft: 2 }}>{cat.unit}</span>
                        </div>
                        <div style={{ fontSize: 9, color: K.muted, marginTop: 4, fontWeight: 700 }}>Toca para ver TOP 10 →</div>
                      </>
                    ) : <div style={{ padding: 16, color: K.muted, fontSize: 11 }}>Sin datos</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.players.length === 0 && <Empty icon={IcoBar} text="No hay jugadores con estadísticas registradas" />}
    </div>
  );
}