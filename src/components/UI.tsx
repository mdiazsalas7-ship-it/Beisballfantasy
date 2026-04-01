import { useState, useEffect, useRef } from "react";
import { colors as K, styles as S } from "../config/theme.ts";
import { IcoX, IcoCamera, IcoBall } from "./Icons.tsx";
import { uploadLogo } from "../config/firebase.ts";

// ─── Small stat display ───
export function StatMini({ label, value, color }: any) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: K.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ─── Team logo (shows uploaded image or abbreviation fallback) ───
export function TeamLogo({ team: t, size = 42 }: any) {
  if (t?.logo) {
    return <img src={t.logo} alt="" style={{ width: size, height: size, borderRadius: size > 30 ? 12 : 8, objectFit: "cover", border: `2px solid ${K.border}` }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: size > 30 ? 12 : 8, background: t?.color || K.muted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: Math.max(9, size * 0.38), color: "#fff" }}>
      {t?.abbr || "?"}
    </div>
  );
}

// ─── League logo (shows uploaded image or emoji fallback) ───
export function LeagueLogo({ league: l, size = 52 }: any) {
  if (l?.logo) {
    return <img src={l.logo} alt="" style={{ width: size, height: size, borderRadius: 16, objectFit: "cover", border: `2px solid ${K.border}` }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 16, background: `linear-gradient(135deg,${K.accentDk},${K.card})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
      {l?.icon || "⚾"}
    </div>
  );
}

// ─── Baseball diamond ───
export function Diamond({ bases = [false, false, false], size = 80 }: any) {
  const h = size / 2;
  const b = Math.max(8, size / 7);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute" }}>
        <polygon points={`${h},3 ${size - 3},${h} ${h},${size - 3} 3,${h}`} fill="none" stroke={K.border} strokeWidth="1.5" />
      </svg>
      <div style={{ position: "absolute", bottom: 0, left: h - b / 2, width: b, height: b, background: K.muted, transform: "rotate(45deg)", borderRadius: 1 }} />
      <div style={{ ...S.baseI(bases[0]), width: b, height: b, position: "absolute", right: 0, top: h - b / 2 }} />
      <div style={{ ...S.baseI(bases[1]), width: b, height: b, position: "absolute", top: 0, left: h - b / 2 }} />
      <div style={{ ...S.baseI(bases[2]), width: b, height: b, position: "absolute", left: 0, top: h - b / 2 }} />
    </div>
  );
}

// ─── Empty state ───
export function Empty({ icon: Ico, text, action, actionLabel }: any) {
  return (
    <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
      <Ico size={44} color={K.muted} style={{ margin: "0 auto 14px" }} />
      <p style={{ color: K.dim, marginBottom: action ? 16 : 0, fontSize: 14 }}>{text}</p>
      {action && <button onClick={action} style={S.btn("primary")}>{actionLabel}</button>}
    </div>
  );
}

// ─── Modal wrapper ───
export function Modal({ title, onClose, children }: any) {
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalC} onClick={(e: any) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, cursor: "pointer" }}>
            <IcoX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Logo upload with preview ───
export function LogoUpload({ current, onUpload, size = 80, label = "Logo" }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(current || null);

  useEffect(() => { if (current) setPreview(current); }, [current]);

  const handleFile = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    setUploading(true);
    try {
      const path = `logos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const url = await uploadLogo(file, path);
      onUpload(url);
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: size, height: size, borderRadius: 16,
            border: `2px dashed ${preview ? "transparent" : K.border}`,
            background: preview ? "transparent" : K.input,
            cursor: "pointer", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          {preview ? (
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} />
          ) : (
            <div style={{ textAlign: "center", color: K.muted }}>
              <IcoCamera size={24} />
              <div style={{ fontSize: 9, marginTop: 4, fontWeight: 600 }}>Subir</div>
            </div>
          )}
          {uploading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14 }}>
              <IcoBall size={20} color={K.accent} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <button onClick={() => fileRef.current?.click()} style={{ ...S.btn("ghost"), fontSize: 12, padding: "8px 14px" }} disabled={uploading}>
            {uploading ? "Subiendo..." : preview ? "Cambiar" : "Seleccionar"}
          </button>
          {preview && (
            <button onClick={() => { setPreview(null); onUpload(""); }} style={{ background: "none", border: "none", color: K.red, fontSize: 11, cursor: "pointer", marginLeft: 8, fontWeight: 600 }}>
              Quitar
            </button>
          )}
          <div style={{ fontSize: 10, color: K.muted, marginTop: 4 }}>JPG, PNG · Máx 5MB</div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ─── Scoreboard (used in LiveGame and WatchGame) ───
export function Scoreboard({ game, aw, hm, isTop, batTm }: any) {
  return (
    <div style={{ ...S.card, marginBottom: 14 }}>
      <div style={{ overflowX: "auto", padding: "10px 14px 0" }}>
        <table style={{ ...S.tbl, fontSize: 12, minWidth: 280 }}>
          <thead>
            <tr>
              <th style={{ ...S.th, fontSize: 10 }}>Eq</th>
              {Array.from({ length: game.totalInnings || 7 }).map((_: any, i: number) => (
                <th key={i} style={{ ...S.th, textAlign: "center", fontSize: 10, color: game.inning === i + 1 ? K.accent : K.muted }}>{i + 1}</th>
              ))}
              <th style={{ ...S.th, textAlign: "center", fontWeight: 900, fontSize: 10 }}>R</th>
            </tr>
          </thead>
          <tbody>
            {[{ t: aw, inn: game.awayInnings, s: game.awayScore }, { t: hm, inn: game.homeInnings, s: game.homeScore }].map((x, i) => (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight: 700, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TeamLogo team={x.t} size={16} />{x.t?.abbr || "?"}
                  </div>
                </td>
                {(x.inn || []).map((r: any, j: number) => (
                  <td key={j} style={{ ...S.td, textAlign: "center", fontWeight: 700, color: r !== null ? K.text : K.muted }}>{r !== null ? r : "—"}</td>
                ))}
                <td style={{ ...S.td, textAlign: "center", fontWeight: 900, fontSize: 16, color: K.accent }}>{x.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-around", borderTop: `1px solid ${K.border}` }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: K.muted }}>ENTRADA</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: K.accent }}>{game.inning}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: isTop ? K.text : K.dim }}>{isTop ? "▲ Alta" : "▼ Baja"}</div>
        </div>
        <Diamond bases={game.bases || [false, false, false]} size={70} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: K.muted }}>OUTS</div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: i < (game.outs || 0) ? K.red : K.border }} />)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3 }}>{game.outs || 0}</div>
        </div>
      </div>

      <div style={{ padding: "6px 20px 10px", background: K.input, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: K.dim }}>Al bate: </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: batTm?.color || K.text }}>{batTm?.name || "?"}</span>
      </div>
    </div>
  );
}