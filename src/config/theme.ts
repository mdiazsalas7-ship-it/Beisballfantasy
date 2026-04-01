// ─── Color palette ───
export const colors = {
  bg: "#060b14",
  card: "#111a2e",
  accent: "#22d3a8",
  accentDk: "#0d5c4a",
  red: "#f43f5e",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  purple: "#a78bfa",
  text: "#f1f5f9",
  dim: "#8b9dc3",
  muted: "#4a5c7a",
  border: "#1b2a45",
  input: "#0a1628",
  live: "#f43f5e",
  green: "#22c55e",
  gold: "#d4a017",
};

export const teamColors = [
  "#f43f5e", "#3b82f6", "#22d3a8", "#fbbf24", "#a78bfa", "#ec4899",
  "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4", "#e11d48",
];

export const leagueIcons = ["⚾", "🏆", "🥇", "⭐", "🏟️", "🎯", "💎", "🔥"];

// ─── Reusable styles ───
const K = colors;

export const styles: any = {
  page: { minHeight: "100vh", background: K.bg, color: K.text, fontFamily: "'Outfit',system-ui,sans-serif", paddingBottom: 82 },

  nav: { position: "fixed" as const, bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(12,18,32,.96)", backdropFilter: "blur(20px)", borderTop: `1px solid ${K.border}`, display: "flex", justifyContent: "space-around", padding: "4px 0 env(safe-area-inset-bottom,10px)" },

  navBtn: (active: boolean) => ({
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
    padding: "8px 10px", border: "none", background: "none",
    color: active ? K.accent : K.muted, cursor: "pointer",
    fontSize: 9, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" as const,
  }),

  hdr: { position: "sticky" as const, top: 0, zIndex: 40, background: "rgba(12,18,32,.94)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${K.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" },

  card: { background: K.card, borderRadius: 16, border: `1px solid ${K.border}`, overflow: "hidden" },

  btn: (variant = "primary") => ({
    padding: "10px 20px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
    ...(variant === "primary" ? { background: K.accent, color: "#000" }
      : variant === "danger" ? { background: K.red, color: "#fff" }
      : { background: K.border, color: K.text }),
  }),

  input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${K.border}`, background: K.input, color: K.text, fontSize: 14, outline: "none" },

  select: { padding: "10px 14px", borderRadius: 10, border: `1px solid ${K.border}`, background: K.input, color: K.text, fontSize: 14, outline: "none" },

  badge: (color: string) => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: color + "22", color,
  }),

  sec: { padding: "16px", maxWidth: 920, margin: "0 auto" },
  secT: { fontSize: 16, fontWeight: 800, marginBottom: 12, textTransform: "uppercase" as const },

  tbl: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { padding: "10px 6px", textAlign: "left" as const, fontWeight: 700, fontSize: 10, color: K.muted, textTransform: "uppercase" as const, borderBottom: `2px solid ${K.border}` },
  td: { padding: "10px 6px", borderBottom: `1px solid ${K.border}` },

  modal: { position: "fixed" as const, inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)" },
  modalC: { background: K.card, borderRadius: 20, border: `1px solid ${K.border}`, width: "95%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", padding: 24 },

  tab: (active: boolean) => ({
    padding: "8px 16px", borderRadius: 20, border: "none",
    background: active ? K.accent : "transparent",
    color: active ? "#000" : K.dim,
    fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "uppercase" as const,
  }),

  baseI: (active: boolean) => ({
    width: 14, height: 14, transform: "rotate(45deg)", borderRadius: 2,
    border: `2px solid ${active ? K.yellow : K.muted}`,
    background: active ? K.yellow : "transparent",
  }),

  label: { fontSize: 12, fontWeight: 600, color: K.dim, display: "block", marginBottom: 4 },
};

// ─── Global CSS (inject once) ───
export const globalCSS = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes glow { 0%,100% { box-shadow:0 0 8px ${K.live}44 } 50% { box-shadow:0 0 20px ${K.live}88 } }
  @keyframes cardShine { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
  * { box-sizing:border-box; margin:0; padding:0 }
  input:focus, select:focus { border-color:${K.accent}!important }
  ::-webkit-scrollbar { width:5px; height:5px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:${K.border}; border-radius:3px }
  button:active { transform:scale(.97) }
`;