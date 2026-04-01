import { useState } from "react";
import { F } from "../../config/firebase.ts";
import { styles as S, colors as K, teamColors as TC } from "../../config/theme.ts";
import { IcoPlus, IcoBar } from "../../components/Icons.tsx";
import { LeagueLogo, Empty, Modal } from "../../components/UI.tsx";

const PRESETS = ["Pre-Infantil", "Infantil", "Pre-Junior", "Junior", "Juvenil", "Sub-8", "Sub-10", "Sub-12", "Sub-14", "Sub-16", "Sub-18"];

export default function Categories({ league, categories, onSelect, isAdmin }: any) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", ageRange: "" });

  const submit = async () => {
    if (!form.name) return;
    await F.add("categories", { ...form, leagueId: league.id });
    setForm({ name: "", ageRange: "" });
    setShow(false);
  };

  return (
    <div style={{ ...S.sec, animation: "slideUp .4s ease" }}>
      <div style={{ ...S.card, padding: 20, marginBottom: 20, background: `linear-gradient(135deg,${K.accentDk},${K.card})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LeagueLogo league={league} size={56} />
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 22 }}>{league.name}</h2>
            {league.location && <div style={{ color: K.dim, fontSize: 13 }}>📍 {league.location}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={S.secT}>Categorías</h3>
        {isAdmin && (
          <button onClick={() => setShow(true)} style={S.btn("primary")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcoPlus size={14} />Nueva</span>
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {categories.map((c: any, i: number) => (
          <div key={c.id} onClick={() => onSelect(c)} style={{ ...S.card, cursor: "pointer", padding: 20, borderTop: `4px solid ${TC[i % TC.length]}` }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{c.name}</div>
            {c.ageRange && <div style={{ color: K.muted, fontSize: 12, marginTop: 2 }}>{c.ageRange}</div>}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        isAdmin
          ? <Empty icon={IcoBar} text="Crea la primera categoría" action={() => setShow(true)} actionLabel="Crear" />
          : <Empty icon={IcoBar} text="No hay categorías disponibles aún" />
      )}

      {show && isAdmin && (
        <Modal title="Nueva Categoría" onClose={() => setShow(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ ...S.label, marginBottom: 6 }}>Selección rápida</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PRESETS.map(p => <button key={p} onClick={() => setForm({ ...form, name: p })} style={{ ...S.tab(form.name === p), fontSize: 11 }}>{p}</button>)}
              </div>
            </div>
            <div><label style={S.label}>Nombre</label><input style={S.input} value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={S.label}>Rango de edad</label><input style={S.input} placeholder="10-12 años" value={form.ageRange} onChange={(e: any) => setForm({ ...form, ageRange: e.target.value })} /></div>
            <button onClick={submit} style={{ ...S.btn("primary"), width: "100%", marginTop: 8 }}>Crear</button>
          </div>
        </Modal>
      )}
    </div>
  );
}