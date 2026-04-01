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
  const [form, setForm] = useState({ awayTeamId: "", homeTeamId: "", date: "", time: "", location: "", innings: 7 });
  const findTeam = (id: string) => data.teams.find((t: any) => t.id === id);

  const submit = async () => {
    if (!form.awayTeamId || !form.homeTeamId || form.awayTeamId === form.homeTeamId || !form.date) return;
    await F.add("games", { ...form, awayScore: 0, homeScore: 0, status: "scheduled", inning: 1, half: "top", outs: 0, bases: [false, false, false], totalInnings: form.innings, awayInnings: Array(form.innings).fill(null), homeInnings: Array(form.innings).fill(null), plays: [], awayLineup: [], homeLineup: [], categoryId: data.category.id, leagueId: data.league.id });
    setForm({ awayTeamId: "", homeTeamId: "", date: "", time: "", location: "", innings: 7 }); setShowForm(false);
  };

  return (
    <div style={S.sec}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: K.accent }}>📅 Calendario</h2>
        {data.isAdmin && <button onClick={() => setShowForm(true)} style={S.btn("primary")}><span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcoPlus size={14} />Programar</span></button>}
      </div>

      {live.length > 0 && <div style={{ marginBottom: 20 }}><h3 style={{ fontWeight: 700, fontSize: 13, color: K.live, marginBottom: 10 }}>● En Vivo</h3>
        {live.map((g: any) => { const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId); return (
          <div key={g.id} onClick={() => nav("scorer", "watch", g.id)} style={{ ...S.card, padding: 14, marginBottom: 8, cursor: "pointer", borderLeft: `3px solid ${K.live}` }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}><TeamLogo team={aw} size={32} /><div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{aw?.abbr}</div></div>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{g.awayScore} - {g.homeScore}</div>
              <div style={{ textAlign: "center" }}><TeamLogo team={hm} size={32} /><div style={{ fontSize: 10, fontWeight: 700, marginTop: 4 }}>{hm?.abbr}</div></div>
            </div></div>); })}</div>}

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

      <h3 style={{ fontWeight: 700, fontSize: 13, color: K.dim, marginBottom: 10 }}>✅ Resultados ({finals.length})</h3>
      {finals.map((g: any) => { const aw = findTeam(g.awayTeamId), hm = findTeam(g.homeTeamId); const d = g.createdAt ? new Date(g.createdAt) : null; return (
        <div key={g.id} onClick={() => nav("calendar", "boxscore", g.id)} style={{ ...S.card, padding: 14, marginBottom: 8, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={S.badge(K.muted)}>FINAL</span>{d && <span style={{ fontSize: 10, color: K.muted }}>{d.toLocaleDateString("es", { day: "numeric", month: "short" })}</span>}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: 1 }}><TeamLogo team={aw} size={32} /><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{aw?.name}</div></div>
            <div style={{ fontWeight: 900, fontSize: 24 }}><span style={{ color: g.awayScore > g.homeScore ? K.accent : K.dim }}>{g.awayScore}</span><span style={{ color: K.muted, margin: "0 4px" }}>-</span><span style={{ color: g.homeScore > g.awayScore ? K.accent : K.dim }}>{g.homeScore}</span></div>
            <div style={{ textAlign: "center", flex: 1 }}><TeamLogo team={hm} size={32} /><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{hm?.name}</div></div>
          </div><div style={{ textAlign: "center", marginTop: 6 }}><span style={{ fontSize: 10, color: K.accent }}>Ver Box Score →</span></div>
        </div>); })}

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
            <div><label style={S.label}>Entradas</label><div style={{ display: "flex", gap: 6 }}>{[5, 6, 7, 9].map(n => <button key={n} onClick={() => setForm({ ...form, innings: n })} style={S.tab(form.innings === n)}>{n}</button>)}</div></div>
            <button onClick={submit} style={{ ...S.btn("primary"), width: "100%" }} disabled={!form.awayTeamId || !form.homeTeamId || !form.date}>Programar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══ BOX SCORE — both teams ═══
export function BoxScore({ data, id, nav }: any) {
  const [game, setGame] = useState<any>(null);
  useEffect(() => { const u = F.onDoc("games", id!, setGame); return () => u && u(); }, [id]);
  if (!game) return <div style={{ ...S.sec, textAlign: "center", padding: 40 }}><IcoBall size={40} color={K.accent} style={{ animation: "spin 1.5s linear infinite" }} /></div>;

  const aw = data.teams.find((t: any) => t.id === game.awayTeamId);
  const hm = data.teams.find((t: any) => t.id === game.homeTeamId);
  const plays = game.plays || [];

  // Aggregate by team
  const agg = (teamFilter: string) => {
    const stats: Record<string, any> = {};
    plays.forEach((p: any) => {
      if (!p.playerId || p.team !== teamFilter) return;
      if (!stats[p.playerId]) stats[p.playerId] = { name: p.playerName || "?", VB: 0, H: 0, HR: 0, CI: 0, CA: 0, BB: 0, K: 0, "2B": 0, "3B": 0 };
      const s = stats[p.playerId];
      if (["1B", "2B", "3B", "HR", "E"].includes(p.result)) { s.VB++; s.H++; if (p.result === "2B") s["2B"]++; if (p.result === "3B") s["3B"]++; if (p.result === "HR") s.HR++; }
      else if (["BB", "HBP"].includes(p.result)) { s.BB++; }
      else if (["OUT", "FLY", "GROUND", "K", "DP", "SAC"].includes(p.result)) { s.VB++; if (p.result === "K") s.K++; }
      s.CI += (p.ci || 0); s.CA += (p.ca || 0);
    });
    return Object.values(stats);
  };

  const awayStats = agg("away");
  const homeStats = agg("home");

  const StatsTable = ({ title, team, stats, color }: any) => (
    <div style={{ ...S.card, marginBottom: 14, overflow: "hidden" }}>
      <div style={{ background: color || K.accent, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <TeamLogo team={team} size={20} />
        <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>{title}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ ...S.tbl, fontSize: 11, minWidth: 400 }}>
          <thead><tr>
            <th style={{ ...S.th, fontSize: 9 }}>JUGADOR</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>VB</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>H</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>2B</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>3B</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>HR</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>CI</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>CA</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>BB</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>K</th>
            <th style={{ ...S.th, textAlign: "center", fontSize: 9 }}>AVG</th>
          </tr></thead>
          <tbody>
            {stats.length > 0 ? stats.map((p: any, i: number) => {
              const avg = p.VB > 0 ? (p.H / p.VB).toFixed(3) : ".000";
              return (
                <tr key={i}><td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{p.VB}</td>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{p.H}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{p["2B"]}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{p["3B"]}</td>
                  <td style={{ ...S.td, textAlign: "center", color: p.HR > 0 ? K.red : K.text, fontWeight: p.HR > 0 ? 700 : 400 }}>{p.HR}</td>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>{p.CI}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{p.CA}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{p.BB}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{p.K}</td>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 900, color: K.accent }}>{avg}</td>
                </tr>
              );
            }) : <tr><td colSpan={11} style={{ ...S.td, textAlign: "center", color: K.muted }}>Sin datos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={S.sec}>
      <h2 style={S.secT}>Box Score</h2>
      {/* Score */}
      <div style={{ ...S.card, padding: 20, marginBottom: 16, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, alignItems: "center", marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}><TeamLogo team={aw} size={44} /><div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>{aw?.name}</div></div>
          <div><div style={{ fontWeight: 900, fontSize: 36 }}>
            <span style={{ color: game.awayScore > game.homeScore ? K.accent : K.dim }}>{game.awayScore}</span>
            <span style={{ color: K.muted, margin: "0 6px" }}>-</span>
            <span style={{ color: game.homeScore > game.awayScore ? K.accent : K.dim }}>{game.homeScore}</span>
          </div><span style={S.badge(game.status === "live" ? K.live : K.muted)}>{game.status === "live" ? "EN VIVO" : "FINAL"}</span></div>
          <div style={{ textAlign: "center" }}><TeamLogo team={hm} size={44} /><div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>{hm?.name}</div></div>
        </div>
      </div>

      {/* Linescore */}
      <div style={{ ...S.card, overflowX: "auto", marginBottom: 16 }}>
        <table style={{ ...S.tbl, fontSize: 12 }}>
          <thead><tr><th style={{ ...S.th, fontSize: 10 }}>Eq</th>
            {Array.from({ length: game.totalInnings || 7 }).map((_: any, i: number) => <th key={i} style={{ ...S.th, textAlign: "center", fontSize: 10 }}>{i + 1}</th>)}
            <th style={{ ...S.th, textAlign: "center", fontWeight: 900 }}>R</th></tr></thead>
          <tbody>
            {[{ t: aw, inn: game.awayInnings, s: game.awayScore }, { t: hm, inn: game.homeInnings, s: game.homeScore }].map((x, i) => (
              <tr key={i}><td style={{ ...S.td, fontWeight: 700 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><TeamLogo team={x.t} size={16} />{x.t?.abbr}</div></td>
                {(x.inn || []).map((r: any, j: number) => <td key={j} style={{ ...S.td, textAlign: "center", fontWeight: 700, color: r !== null ? K.text : K.muted }}>{r !== null ? r : "—"}</td>)}
                <td style={{ ...S.td, textAlign: "center", fontWeight: 900, fontSize: 16, color: K.accent }}>{x.s}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team stats */}
      <StatsTable title={aw?.name || "Visitante"} team={aw} stats={awayStats} color={aw?.color || K.accent} />
      <StatsTable title={hm?.name || "Local"} team={hm} stats={homeStats} color={hm?.color || K.blue} />
    </div>
  );
}