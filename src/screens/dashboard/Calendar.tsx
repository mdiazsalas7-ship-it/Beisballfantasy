import { useState, useEffect } from "react";
import { F } from "../../config/firebase.ts";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoBall, IcoCal, IcoPlus, IcoTrash } from "../../components/Icons.tsx";
import { TeamLogo, Empty, Modal } from "../../components/UI.tsx";

export function CalendarPage({ data, nav }: any) {
  const scheduled = data.games.filter((g: any) => g.status === "scheduled").sort((a: any, b: any) => (a.date || "").localeCompare(b.date || ""));
  const finals = data.games.filter((g: any) => g.status === "final").sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  const live = data.games.filter((g: any) => g.status === "live");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ awayTeamId: "", homeTeamId: "", date: "", time: "", location: "", innings: 9 });  
  const findTeam = (id: string) => data.teams.find((t: any) => t.id === id);

  const submit = async () => {
    if (!form.awayTeamId || !form.homeTeamId || form.awayTeamId === form.homeTeamId || !form.date) return;
    await F.add("games", { ...form, awayScore: 0, homeScore: 0, status: "scheduled", inning: 1, half: "top", outs: 0, bases: [false, false, false], totalInnings: form.innings, awayInnings: Array(form.innings).fill(null), homeInnings: Array(form.innings).fill(null), plays: [], awayLineup: [], homeLineup: [], categoryId: data.category.id, leagueId: data.league.id });
    setForm({ awayTeamId: "", homeTeamId: "", date: "", time: "", location: "", innings: 7 }); setShowForm(false);
  };

  // Helper: get game summary stats from plays
  const getGameSummary = (game: any) => {
    const plays = game.plays || [];
    const awHits = plays.filter((p: any) => p.team === "away" && ["1B", "2B", "3B", "HR"].includes(p.result)).length;
    const hmHits = plays.filter((p: any) => p.team === "home" && ["1B", "2B", "3B", "HR"].includes(p.result)).length;
    const awErrors = plays.filter((p: any) => p.result === "E" && p.team === "away").length;
    const hmErrors = plays.filter((p: any) => p.result === "E" && p.team === "home").length;

    // Find winning/losing pitcher
    const winSide = game.awayScore > game.homeScore ? "away" : game.homeScore > game.awayScore ? "home" : null;
    const pitcherStats: Record<string, any> = {};
    plays.forEach((p: any) => {
      if (!p.pitcherId || !p.result) return;
      if (!pitcherStats[p.pitcherId]) {
        const inHome = (game.homeLineup || []).find((x: any) => x.id === p.pitcherId);
        pitcherStats[p.pitcherId] = { name: p.pitcherName || "?", side: inHome ? "home" : "away", outs: 0, cl: 0, h: 0, bb: 0, k: 0 };
      }
      const s = pitcherStats[p.pitcherId];
      if (["OUT", "FLY", "GROUND", "K", "SAC"].includes(p.result)) s.outs++;
      if (p.result === "DP") s.outs += 2;
      if (p.result === "K") s.k++;
      if (["1B", "2B", "3B", "HR", "E"].includes(p.result)) s.h++;
      if (["BB", "HBP"].includes(p.result)) s.bb++;
      s.cl += (p.ci || 0);
    });

    let wp: any = null, lp: any = null;
    if (winSide) {
      const winners = Object.entries(pitcherStats).filter(([_, v]: any) => v.side === winSide).sort((a: any, b: any) => b[1].outs - a[1].outs);
      const losers = Object.entries(pitcherStats).filter(([_, v]: any) => v.side !== winSide).sort((a: any, b: any) => b[1].outs - a[1].outs);
      if (winners[0]) { const [id, s] = winners[0] as any; const ip = (Math.floor(s.outs / 3) + (s.outs % 3) / 10).toFixed(1); const era = parseFloat(ip) > 0 ? ((s.cl * 7) / parseFloat(ip)).toFixed(2) : "0.00"; wp = { name: s.name, ip, era, k: s.k, label: "GANA" }; }
      if (losers[0]) { const [id, s] = losers[0] as any; const ip = (Math.floor(s.outs / 3) + (s.outs % 3) / 10).toFixed(1); const era = parseFloat(ip) > 0 ? ((s.cl * 7) / parseFloat(ip)).toFixed(2) : "0.00"; lp = { name: s.name, ip, era, k: s.k, label: "PIERDE" }; }
    }

    // Best offensive player
    const batStats: Record<string, any> = {};
    plays.forEach((p: any) => {
      if (!p.playerId) return;
      if (!batStats[p.playerId]) batStats[p.playerId] = { name: p.playerName || "?", team: p.team, h: 0, vb: 0, hr: 0, ci: 0 };
      const s = batStats[p.playerId];
      if (["1B", "2B", "3B", "HR"].includes(p.result)) { s.h++; s.vb++; if (p.result === "HR") s.hr++; }
      else if (["OUT", "FLY", "GROUND", "K", "DP", "SAC", "E"].includes(p.result)) s.vb++;
      s.ci += (p.ci || 0);
    });
    const mvp = Object.values(batStats).sort((a: any, b: any) => {
      const scoreA = a.h * 2 + a.hr * 3 + a.ci * 1.5;
      const scoreB = b.h * 2 + b.hr * 3 + b.ci * 1.5;
      return scoreB - scoreA;
    })[0] || null;

    return { awHits, hmHits, awErrors, hmErrors, wp, lp, mvp };
  };

  return (
    <div style={S.sec}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: K.accent }}>📅 Calendario</h2>
        {data.isAdmin && <button onClick={() => setShowForm(true)} style={S.btn("primary")}><span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcoPlus size={14} />Programar</span></button>}
      </div>

      {/* ═══ LIVE ═══ */}
      {live.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={{ fontWeight: 700, fontSize: 13, color: K.live, marginBottom: 10 }}>● En Vivo</h3>
        {live.map((g: any) => { const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId); return (
          <div key={g.id} onClick={() => nav("scorer", "watch", g.id)} style={{ ...S.card, padding: 14, marginBottom: 8, cursor: "pointer", borderLeft: `3px solid ${K.live}`, animation: "glow 3s infinite" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}><TeamLogo team={aw} size={32} /><div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{aw?.abbr}</div></div>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{g.awayScore} - {g.homeScore}</div>
              <div style={{ textAlign: "center" }}><TeamLogo team={hm} size={32} /><div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{hm?.abbr}</div></div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: K.muted, marginTop: 4 }}>Ent {g.inning} {g.half === "top" ? "▲" : "▼"}</div>
          </div>); })}</div>}

      {/* ═══ SCHEDULED ═══ */}
      <div style={{ marginBottom: 24 }}><h3 style={{ fontWeight: 700, fontSize: 13, color: K.blue, marginBottom: 10 }}>📋 Programados ({scheduled.length})</h3>
        {scheduled.map((g: any) => { const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId); return (
          <div key={g.id} style={{ ...S.card, padding: 14, marginBottom: 8, border: `1px solid ${K.blue}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6 }}><span style={S.badge(K.blue)}>{g.date}</span>{g.time && <span style={S.badge(K.accent)}>{g.time}</span>}</div>
              {data.isAdmin && <button onClick={() => F.del("games", g.id)} style={{ background: "none", border: "none", color: K.red, cursor: "pointer" }}><IcoTrash size={14} /></button>}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center", flex: 1 }}><TeamLogo team={aw} size={36} /><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{aw?.name}</div></div>
              <span style={{ fontWeight: 900, color: K.muted }}>VS</span>
              <div style={{ textAlign: "center", flex: 1 }}><TeamLogo team={hm} size={36} /><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{hm?.name}</div></div>
            </div>
            {g.location && <div style={{ textAlign: "center", fontSize: 10, color: K.muted, marginTop: 8 }}>📍 {g.location}</div>}
          </div>); })}
        {scheduled.length === 0 && <div style={{ ...S.card, padding: 20, textAlign: "center" }}><p style={{ color: K.muted, fontSize: 12 }}>No hay juegos programados</p></div>}
      </div>

      {/* ═══ RESULTS — ESPN STYLE ═══ */}
      <h3 style={{ fontWeight: 700, fontSize: 13, color: K.dim, marginBottom: 10 }}>✅ Resultados ({finals.length})</h3>
      {finals.map((g: any) => {
        const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId);
        const d = g.createdAt ? new Date(g.createdAt) : null;
        const summary = getGameSummary(g);
        const awWon = g.awayScore > g.homeScore;
        const hmWon = g.homeScore > g.awayScore;

        return (
          <div key={g.id} onClick={() => nav("scorer", "watch", g.id)}
            style={{ ...S.card, marginBottom: 12, cursor: "pointer", overflow: "hidden" }}>

            {/* Header: status + date */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: K.input, borderBottom: `1px solid ${K.border}` }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: K.accent }}>FINAL</span>
              {d && <span style={{ fontSize: 10, color: K.muted }}>{d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}</span>}
            </div>

            <div style={{ display: "flex" }}>
              {/* LEFT: Teams + RHE */}
              <div style={{ flex: 1, padding: "10px 14px" }}>
                {/* R H E header */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", gap: 0 }}>
                    {["R", "H", "E"].map(h => (
                      <span key={h} style={{ width: 28, textAlign: "center", fontSize: 10, fontWeight: 800, color: K.muted }}>{h}</span>
                    ))}
                  </div>
                </div>

                {/* Away team row */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <TeamLogo team={aw} size={24} />
                    <div>
                      <div style={{ fontWeight: awWon ? 900 : 600, fontSize: 13, color: awWon ? K.text : K.dim }}>{aw?.name || "?"}</div>
                      <div style={{ fontSize: 9, color: K.muted }}>{aw?.wins || 0}-{aw?.losses || 0}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 0 }}>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 900, fontSize: 15, color: awWon ? K.accent : K.dim }}>{g.awayScore}</span>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 700, fontSize: 13, color: K.text }}>{summary.awHits}</span>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 700, fontSize: 13, color: summary.hmErrors > 0 ? K.red : K.text }}>{summary.hmErrors}</span>
                  </div>
                </div>

                {/* Home team row */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <TeamLogo team={hm} size={24} />
                    <div>
                      <div style={{ fontWeight: hmWon ? 900 : 600, fontSize: 13, color: hmWon ? K.text : K.dim }}>{hm?.name || "?"}</div>
                      <div style={{ fontSize: 9, color: K.muted }}>{hm?.wins || 0}-{hm?.losses || 0}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 0 }}>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 900, fontSize: 15, color: hmWon ? K.accent : K.dim }}>{g.homeScore}</span>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 700, fontSize: 13, color: K.text }}>{summary.hmHits}</span>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 700, fontSize: 13, color: summary.awErrors > 0 ? K.red : K.text }}>{summary.awErrors}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Pitchers + MVP */}
              <div style={{ width: 160, borderLeft: `1px solid ${K.border}`, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                {/* Winning pitcher */}
                {summary.wp && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: K.accent, width: 34 }}>{summary.wp.label}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 11, color: K.text }}>{summary.wp.name}</div>
                      <div style={{ fontSize: 9, color: K.muted }}>{summary.wp.ip} IP, {summary.wp.k} K, ERA {summary.wp.era}</div>
                    </div>
                  </div>
                )}

                {/* Losing pitcher */}
                {summary.lp && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: K.red, width: 34 }}>{summary.lp.label}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 11, color: K.text }}>{summary.lp.name}</div>
                      <div style={{ fontSize: 9, color: K.muted }}>{summary.lp.ip} IP, {summary.lp.k} K, ERA {summary.lp.era}</div>
                    </div>
                  </div>
                )}

                {/* MVP */}
                {summary.mvp && (
                  <div style={{ borderTop: `1px solid ${K.border}`, paddingTop: 6, marginTop: 2 }}>
                    <div style={{ fontSize: 8, fontWeight: 900, color: K.yellow, marginBottom: 2 }}>⭐ DESTACADO</div>
                    <div style={{ fontWeight: 800, fontSize: 11, color: K.text }}>{summary.mvp.name}</div>
                    <div style={{ fontSize: 9, color: K.muted }}>
                      {summary.mvp.h}-{summary.mvp.vb}
                      {summary.mvp.hr > 0 ? `, ${summary.mvp.hr} HR` : ""}
                      {summary.mvp.ci > 0 ? `, ${summary.mvp.ci} CI` : ""}
                    </div>
                  </div>
                )}

                {/* Box score link */}
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: K.accent, fontWeight: 700 }}>Box Score →</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {finals.length === 0 && <div style={{ ...S.card, padding: 20, textAlign: "center" }}><p style={{ color: K.muted, fontSize: 12 }}>No hay resultados aún</p></div>}

      {/* ═══ SCHEDULE FORM ═══ */}
      {showForm && data.isAdmin && (
        <Modal title="Programar Juego" onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
              <div><label style={S.label}>Visitante</label><select style={{ ...S.select, width: "100%" }} value={form.awayTeamId} onChange={(e: any) => setForm({ ...form, awayTeamId: e.target.value })}><option value="">Seleccionar</option>{data.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <span style={{ fontWeight: 900, color: K.muted, paddingBottom: 10 }}>VS</span>
              <div><label style={S.label}>Local</label><select style={{ ...S.select, width: "100%" }} value={form.homeTeamId} onChange={(e: any) => setForm({ ...form, homeTeamId: e.target.value })}><option value="">Seleccionar</option>{data.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={S.label}>Fecha</label><input style={S.input} type="date" value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label style={S.label}>Hora</label><input style={S.input} type="time" value={form.time} onChange={(e: any) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div><label style={S.label}>Lugar</label><input style={S.input} placeholder="Estadio..." value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label style={S.label}>Entradas</label><div style={{ display: "flex", gap: 6 }}>{[5, 6, 7, 9, 12].map(n => <button key={n} onClick={() => setForm({ ...form, innings: n })} style={S.tab(form.innings === n)}>{n}</button>)}</div></div>
            <button onClick={submit} style={{ ...S.btn("primary"), width: "100%" }} disabled={!form.awayTeamId || !form.homeTeamId || !form.date}>Programar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}