// ─── Positions ───
export const POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "BD"];

// ─── Empty stat templates ───
export const EMPTY_BATTING: any = { JJ: 0, VB: 0, H: 0, "2B": 0, "3B": 0, HR: 0, CI: 0, CA: 0, BB: 0, K: 0, BR: 0 };
export const EMPTY_PITCHING: any = { JJ: 0, IL: 0, H: 0, CL: 0, BB: 0, K: 0, G: 0, P: 0, JC: 0 };
export const EMPTY_FIELDING: any = { JJ: 0, PO: 0, A: 0, E: 0, DP: 0 };

// ─── Stat calculators ───
export function calcBatting(s: any) {
  if (!s || !s.VB) return null;
  const avg = s.VB > 0 ? s.H / s.VB : 0;
  const obp = (s.VB + s.BB) > 0 ? (s.H + s.BB) / (s.VB + s.BB) : 0;
  const tb = (s.H - (s["2B"] || 0) - (s["3B"] || 0) - s.HR) + (s["2B"] || 0) * 2 + (s["3B"] || 0) * 3 + s.HR * 4;
  const slg = s.VB > 0 ? tb / s.VB : 0;
  return {
    ...s,
    AVG: avg.toFixed(3),
    OBP: obp.toFixed(3),
    SLG: slg.toFixed(3),
    OPS: (obp + slg).toFixed(3),
  };
}

export function calcPitching(s: any) {
  if (!s || !s.IL) return null;
  const era = s.IL > 0 ? (s.CL * 7) / s.IL : 0;
  const whip = s.IL > 0 ? (s.H + s.BB) / s.IL : 0;
  return {
    ...s,
    ERA: era.toFixed(2),
    WHIP: whip.toFixed(2),
  };
}

export function calcFielding(s: any) {
  if (!s || !s.JJ) return null;
  const total = s.PO + s.A + s.E;
  return {
    ...s,
    PCF: (total > 0 ? (s.PO + s.A) / total : 0).toFixed(3),
  };
}