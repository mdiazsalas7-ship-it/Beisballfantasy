import { useState } from "react";
import { F } from "../../config/firebase.ts";
import { styles as S, colors as K, leagueIcons } from "../../config/theme.ts";
import { IcoPlus, IcoGlobe } from "../../components/Icons.tsx";
import { LeagueLogo, Empty, Modal, LogoUpload } from "../../components/UI.tsx";

export default function Leagues({ leagues, onSelect, isAdmin }: any) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "⚾", location: "", logo: "" });

  const submit = async () => {
    if (!form.name) return;
    await F.add("leagues", form);
    setForm({ name: "", description: "", icon: "⚾", location: "", logo: "" });
    setShow(false);
  };

  return (
    <div style={{ ...S.sec, animation: "slideUp .4s ease" }}>
      <div style={{ textAlign: "center", padding: "40px 16px 28px" }}>
        {/* ── AQUÍ ESTÁ EL LOGO REEMPLAZANDO A LA PELOTA ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <img 
            src="https://i.postimg.cc/XJr7JyC0/image.png" 
            alt="Logo Béisbol Menor" 
            style={{ width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))' }} 
          />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, background: `linear-gradient(135deg,${K.accent},${K.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Béisbol Menor
        </h2>
        <p style={{ color: K.dim, fontSize: 14, maxWidth: 360, margin: "0 auto" }}>Selecciona tu liga</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={S.secT}>Ligas</h3>
        {isAdmin && (
          <button onClick={() => setShow(true)} style={S.btn("primary")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcoPlus size={14} />Nueva</span>
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {leagues.map((l: any) => (
          <div key={l.id} onClick={() => onSelect(l)} style={{ ...S.card, cursor: "pointer", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <LeagueLogo league={l} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{l.name}</div>
                {l.location && <div style={{ color: K.muted, fontSize: 12, marginTop: 2 }}>📍 {l.location}</div>}
                {l.description && <div style={{ color: K.dim, fontSize: 12, marginTop: 2 }}>{l.description}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {leagues.length === 0 && (
        isAdmin
          ? <Empty icon={IcoGlobe} text="Crea tu primera liga" action={() => setShow(true)} actionLabel="Crear Liga" />
          : <Empty icon={IcoGlobe} text="No hay ligas disponibles aún" />
      )}

      {show && isAdmin && (
        <Modal title="Nueva Liga" onClose={() => setShow(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <LogoUpload current={form.logo} onUpload={(u: string) => setForm({ ...form, logo: u })} size={90} label="Logo de la Liga" />
            <div><label style={S.label}>Nombre</label><input style={S.input} placeholder="Liga Municipal de Béisbol" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={S.label}>Ubicación</label><input style={S.input} placeholder="Maracaibo, Zulia" value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label style={S.label}>Descripción</label><input style={S.input} placeholder="Opcional" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label style={{ ...S.label, marginBottom: 6 }}>Ícono</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {leagueIcons.map(i => (
                  <button key={i} onClick={() => setForm({ ...form, icon: i })} style={{ width: 40, height: 40, borderRadius: 10, border: form.icon === i ? `2px solid ${K.accent}` : `2px solid ${K.border}`, background: K.input, fontSize: 20, cursor: "pointer" }}>{i}</button>
                ))}
              </div>
            </div>
            <button onClick={submit} style={{ ...S.btn("primary"), width: "100%", marginTop: 8 }}>Crear Liga</button>
          </div>
        </Modal>
      )}
    </div>
  );
}