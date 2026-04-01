import { styles as S, colors as K } from "../../config/theme.ts";
import { TeamLogo } from "../../components/UI.tsx";

export default function StandingsPage({ data, nav }: any) {
  const teams = data.teams
    .map((t: any) => {
      const total = (t.wins || 0) + (t.losses || 0);
      return { ...t, pct: total > 0 ? (t.wins || 0) / total : 0, total };
    })
    .sort((a: any, b: any) => b.pct - a.pct || b.wins - a.wins);

  const leader = teams[0];

  return (
    <div style={S.sec}>
      <h2 style={S.secT}>Tabla de Posiciones</h2>
      <div style={{ ...S.card, overflowX: "auto" }}>
        <table style={S.tbl}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 36 }}>#</th>
              <th style={S.th}>Equipo</th>
              <th style={{ ...S.th, textAlign: "center" }}>G</th>
              <th style={{ ...S.th, textAlign: "center" }}>P</th>
              <th style={{ ...S.th, textAlign: "center" }}>E</th>
              <th style={{ ...S.th, textAlign: "center" }}>PCT</th>
              <th style={{ ...S.th, textAlign: "center" }}>DIF</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t: any, i: number) => {
              const gb = leader && leader.total > 0 ? ((leader.wins - t.wins + t.losses - leader.losses) / 2) : 0;
              return (
                <tr key={t.id} onClick={() => nav("teams", "detail", t.id)} style={{ cursor: "pointer" }}>
                  <td style={{ ...S.td, fontWeight: 800, color: i === 0 ? K.gold : i < 3 ? K.accent : K.muted }}>{i + 1}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <TeamLogo team={t} size={28} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: K.accent }}>{t.wins || 0}</td>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 700, color: K.red }}>{t.losses || 0}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{t.draws || 0}</td>
                  <td style={{ ...S.td, textAlign: "center", fontWeight: 800, color: K.blue }}>{t.pct.toFixed(3)}</td>
                  <td style={{ ...S.td, textAlign: "center", color: K.muted }}>{i === 0 ? "—" : gb.toFixed(1)}</td>
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: K.muted, padding: 30 }}>Sin equipos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}