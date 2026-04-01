import { useState, useRef } from "react";
import { F } from "../../config/firebase.ts";
import { uploadLogo } from "../../config/firebase.ts";
import { styles as S, colors as K } from "../../config/theme.ts";
import { IcoPlus, IcoTrash, IcoEdit, IcoSave, IcoBall } from "../../components/Icons.tsx";
import { Empty, Modal } from "../../components/UI.tsx";

export default function NewsPage({ data, nav }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editNews, setEditNews] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [form, setForm] = useState({ title: "", body: "", imageUrl: "", source: "", league: "" });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // News comes from data.news (global collection)
  const news = (data.news || []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

  const resetForm = () => {
    setForm({ title: "", body: "", imageUrl: "", source: "", league: "" });
    setPreview(null);
    setEditNews(null);
    setShowForm(false);
  };

  const handleImage = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const url = await uploadLogo(file, `news/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`);
      setForm({ ...form, imageUrl: url });
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.title || !form.body) return;
    if (editNews) {
      await F.set("news", editNews.id, form);
    } else {
      await F.add("news", form);
    }
    resetForm();
  };

  const deleteNews = async (id: string) => {
    if (confirm("¿Eliminar esta noticia?")) await F.del("news", id);
  };

  const openEdit = (n: any) => {
    setEditNews(n);
    setForm({ title: n.title || "", body: n.body || "", imageUrl: n.imageUrl || "", source: n.source || "", league: n.league || "" });
    setPreview(n.imageUrl || null);
    setShowForm(true);
  };

  const formatDate = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={S.sec}>
      <style>{`
        @keyframes fadeNews{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-news{animation:fadeNews .3s ease}
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: K.accent, textTransform: "uppercase" }}>📰 Noticias</h2>
          <p style={{ fontSize: 11, color: K.muted, marginTop: 2 }}>Béisbol Menor — Todas las ligas</p>
        </div>
        {data.isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true); }} style={S.btn("primary")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcoPlus size={14} />Publicar</span>
          </button>
        )}
      </div>

      {/* Featured news (first one big) */}
      {news.length > 0 && (
        <div onClick={() => setSelectedNews(news[0])} className="fade-news"
          style={{ ...S.card, marginBottom: 20, cursor: "pointer", overflow: "hidden", border: `2px solid ${K.accent}33` }}>
          {news[0].imageUrl && (
            <div style={{ width: "100%", height: 200, overflow: "hidden", background: "#000" }}>
              <img src={news[0].imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
            </div>
          )}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ ...S.badge(K.accent), fontSize: 9 }}>⚡ DESTACADA</span>
              <span style={{ fontSize: 10, color: K.muted }}>{formatDate(news[0].createdAt)}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: K.text, lineHeight: 1.2, marginBottom: 6 }}>{news[0].title}</h3>
            <p style={{ fontSize: 12, color: K.dim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
              {news[0].body}
            </p>
            {news[0].source && <p style={{ fontSize: 10, color: K.muted, marginTop: 8, fontWeight: 600 }}>📍 {news[0].source}</p>}
            {data.isAdmin && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(news[0])} style={{ background: "none", border: "none", color: K.accent, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><IcoEdit size={14} />Editar</button>
                <button onClick={() => deleteNews(news[0].id)} style={{ background: "none", border: "none", color: K.red, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><IcoTrash size={14} />Eliminar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* News list */}
      {news.slice(1).map((n: any, idx: number) => (
        <div key={n.id} onClick={() => setSelectedNews(n)} className="fade-news"
          style={{ ...S.card, marginBottom: 10, cursor: "pointer", display: "flex", overflow: "hidden", animationDelay: `${idx * 0.05}s` }}>
          {/* Thumbnail */}
          {n.imageUrl ? (
            <div style={{ width: 100, minHeight: 90, flexShrink: 0, overflow: "hidden", background: "#000" }}>
              <img src={n.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{ width: 100, minHeight: 90, flexShrink: 0, background: `linear-gradient(135deg, ${K.accentDk}, ${K.card})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28 }}>⚾</span>
            </div>
          )}
          {/* Content */}
          <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                {n.league && <span style={{ ...S.badge(K.blue), fontSize: 8 }}>{n.league}</span>}
                <span style={{ fontSize: 9, color: K.muted }}>{formatDate(n.createdAt)}</span>
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: K.text, lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                {n.title}
              </h4>
              <p style={{ fontSize: 11, color: K.dim, marginTop: 3, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                {n.body}
              </p>
            </div>
            {data.isAdmin && (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(n)} style={{ background: "none", border: "none", color: K.accent, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Editar</button>
                <button onClick={() => deleteNews(n.id)} style={{ background: "none", border: "none", color: K.red, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Eliminar</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {news.length === 0 && (
        <Empty icon={IcoBall} text={data.isAdmin ? "Publica la primera noticia" : "No hay noticias publicadas aún"} action={data.isAdmin ? () => setShowForm(true) : undefined} actionLabel="Publicar" />
      )}

      {/* ═══ NEWS DETAIL MODAL ═══ */}
      {selectedNews && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.85)", backdropFilter: "blur(10px)", overflow: "auto" }}
          onClick={() => setSelectedNews(null)}>
          <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 16px", minHeight: "100vh" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setSelectedNews(null)}
              style={{ position: "fixed", top: 16, right: 16, zIndex: 210, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>

            {/* Image */}
            {selectedNews.imageUrl && (
              <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
                <img src={selectedNews.imageUrl} style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />
              </div>
            )}

            {/* Meta */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {selectedNews.league && <span style={{ ...S.badge(K.blue), fontSize: 10 }}>{selectedNews.league}</span>}
              {selectedNews.source && <span style={{ ...S.badge(K.accent), fontSize: 10 }}>📍 {selectedNews.source}</span>}
              <span style={{ ...S.badge(K.muted), fontSize: 10 }}>{formatDate(selectedNews.createdAt)}</span>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
              {selectedNews.title}
            </h2>

            {/* Body */}
            <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {selectedNews.body}
            </div>

            {/* Back button */}
            <button onClick={() => setSelectedNews(null)}
              style={{ ...S.btn("ghost"), width: "100%", marginTop: 24 }}>
              ← Volver a noticias
            </button>
          </div>
        </div>
      )}

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      {showForm && data.isAdmin && (
        <Modal title={editNews ? "Editar Noticia" : "Nueva Noticia"} onClose={resetForm}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Image upload */}
            <div>
              <label style={S.label}>Imagen</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div onClick={() => fileRef.current?.click()}
                  style={{ width: 100, height: 70, borderRadius: 12, border: `2px dashed ${preview ? "transparent" : K.border}`, background: preview ? "transparent" : K.input, cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {preview ? (
                    <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
                  ) : (
                    <span style={{ color: K.muted, fontSize: 24 }}>📷</span>
                  )}
                  {uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
                      <IcoBall size={18} color={K.accent} style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <button onClick={() => fileRef.current?.click()} style={{ ...S.btn("ghost"), fontSize: 11, padding: "6px 12px" }} disabled={uploading}>
                    {uploading ? "Subiendo..." : preview ? "Cambiar" : "Subir imagen"}
                  </button>
                  {preview && <button onClick={() => { setPreview(null); setForm({ ...form, imageUrl: "" }); }} style={{ background: "none", border: "none", color: K.red, fontSize: 10, cursor: "pointer", marginLeft: 6, fontWeight: 600 }}>Quitar</button>}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
            </div>

            {/* Title */}
            <div>
              <label style={S.label}>Título</label>
              <input style={S.input} placeholder="Título de la noticia" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} />
            </div>

            {/* Body */}
            <div>
              <label style={S.label}>Contenido</label>
              <textarea
                style={{ ...S.input, minHeight: 120, resize: "vertical", fontFamily: "inherit" }}
                placeholder="Escribe la noticia completa aquí..."
                value={form.body}
                onChange={(e: any) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            {/* Source + League */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={S.label}>Fuente / Autor</label>
                <input style={S.input} placeholder="Ej: Prensa Liga Norte" value={form.source} onChange={(e: any) => setForm({ ...form, source: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Liga (etiqueta)</label>
                <input style={S.input} placeholder="Ej: Liga del Zulia" value={form.league} onChange={(e: any) => setForm({ ...form, league: e.target.value })} />
              </div>
            </div>

            {/* Submit */}
            <button onClick={submit} style={{ ...S.btn("primary"), width: "100%", marginTop: 4 }} disabled={!form.title || !form.body || uploading}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IcoSave size={14} />{editNews ? "Guardar Cambios" : "Publicar Noticia"}
              </span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}