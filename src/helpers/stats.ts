export const POSITIONS = ["P","C","1B","2B","3B","SS","LF","CF","RF","DH","BD"];

export const EMPTY_BATTING: any = { JJ:0,VB:0,H:0,"2B":0,"3B":0,HR:0,CI:0,CA:0,BB:0,K:0,BR:0 };
export const EMPTY_PITCHING: any = { JJ:0,IL:0,H:0,CL:0,BB:0,K:0,G:0,P:0,JC:0 };
export const EMPTY_FIELDING: any = { JJ:0,PO:0,A:0,E:0,DP:0 };

export function calcBatting(s: any) {
  if (!s) return null;
  const vb = s.VB || 0;
  const h = s.H || 0;
  const bb = s.BB || 0;
  const hr = s.HR || 0;
  const d = s["2B"] || 0;
  const t = s["3B"] || 0;
  const avg = vb > 0 ? h / vb : 0;
  const obp = (vb + bb) > 0 ? (h + bb) / (vb + bb) : 0;
  const tb = (h - d - t - hr) + d * 2 + t * 3 + hr * 4;
  const slg = vb > 0 ? tb / vb : 0;
  return {
    JJ: s.JJ || 0, VB: vb, H: h, "2B": d, "3B": t, HR: hr,
    CI: s.CI || 0, CA: s.CA || 0, BB: bb, K: s.K || 0, BR: s.BR || 0,
    AVG: avg.toFixed(3), OBP: obp.toFixed(3), SLG: slg.toFixed(3),
    OPS: (obp + slg).toFixed(3),
  };
}

export function calcPitching(s: any) {
  if (!s) return null;
  const il = s.IL || 0;
  const era = il > 0 ? (s.CL * 7) / il : 0;
  const whip = il > 0 ? (s.H + s.BB) / il : 0;
  return {
    JJ: s.JJ || 0, IL: il, H: s.H || 0, CL: s.CL || 0,
    BB: s.BB || 0, K: s.K || 0, G: s.G || 0, P: s.P || 0, JC: s.JC || 0,
    ERA: era.toFixed(2), WHIP: whip.toFixed(2),
  };
}

export function calcFielding(s: any) {
  if (!s || !s.JJ) return null;
  const total = (s.PO||0) + (s.A||0) + (s.E||0);
  return { ...s, PCF: (total > 0 ? ((s.PO||0) + (s.A||0)) / total : 0).toFixed(3) };
}