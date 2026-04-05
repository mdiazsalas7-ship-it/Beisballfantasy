import { useState } from 'react';
import { F } from '../../config/firebase.ts';
import {
  styles as S,
  colors as K,
  teamColors as TC,
} from '../../config/theme.ts';
import {
  POSITIONS,
  EMPTY_BATTING,
  EMPTY_PITCHING,
  EMPTY_FIELDING,
  calcBatting,
  calcPitching,
  calcFielding,
} from '../../helpers/stats.ts';
import {
  IcoPlus,
  IcoEdit,
  IcoTrash,
  IcoSave,
  IcoUsers,
} from '../../components/Icons.tsx';
import {
  TeamLogo,
  StatMini,
  Empty,
  Modal,
  LogoUpload,
} from '../../components/UI.tsx';

// ═══ TEAMS LIST ═══
export function TeamsPage({ data, nav }: any) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: '',
    abbr: '',
    color: TC[0],
    logo: '',
  });

  const submit = async () => {
    if (!form.name || !form.abbr) return;
    if (edit) await F.set('teams', edit.id, form);
    else
      await F.add('teams', {
        ...form,
        categoryId: data.category.id,
        leagueId: data.league.id,
        wins: 0,
        losses: 0,
        draws: 0,
      });
    setShow(false);
    setEdit(null);
    setForm({ name: '', abbr: '', color: TC[0], logo: '' });
  };

  return (
    <div style={S.sec}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={S.secT}>Equipos</h2>
        {data.isAdmin && (
          <button
            onClick={() => {
              setEdit(null);
              setForm({
                name: '',
                abbr: '',
                color: TC[Math.floor(Math.random() * TC.length)],
                logo: '',
              });
              setShow(true);
            }}
            style={S.btn('primary')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoPlus size={14} />
              Nuevo
            </span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 12,
        }}
      >
        {data.teams.map((t: any) => {
          const pc = data.players.filter((p: any) => p.teamId === t.id).length;
          return (
            <div
              key={t.id}
              onClick={() => nav('teams', 'detail', t.id)}
              style={{ ...S.card, cursor: 'pointer' }}
            >
              <div style={{ height: 4, background: t.color }} />
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <TeamLogo team={t} size={48} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>
                      {t.name}
                    </div>
                    <div style={{ color: K.muted, fontSize: 11 }}>
                      {pc} jugadores
                    </div>
                  </div>
                  {data.isAdmin && (
                    <button
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setEdit(t);
                        setForm({
                          name: t.name,
                          abbr: t.abbr,
                          color: t.color,
                          logo: t.logo || '',
                        });
                        setShow(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: K.muted,
                        cursor: 'pointer',
                      }}
                    >
                      <IcoEdit size={15} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  <StatMini label="G" value={t.wins || 0} color={K.accent} />
                  <StatMini label="P" value={t.losses || 0} color={K.red} />
                  <StatMini
                    label="PCT"
                    value={
                      (t.wins || 0) + (t.losses || 0) > 0
                        ? (
                            (t.wins || 0) /
                            ((t.wins || 0) + (t.losses || 0))
                          ).toFixed(3)
                        : '.000'
                    }
                    color={K.blue}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.teams.length === 0 &&
        (data.isAdmin ? (
          <Empty
            icon={IcoUsers}
            text="No hay equipos"
            action={() => setShow(true)}
            actionLabel="Crear"
          />
        ) : (
          <Empty icon={IcoUsers} text="No hay equipos registrados aún" />
        ))}

      {show && data.isAdmin && (
        <Modal
          title={`${edit ? 'Editar' : 'Nuevo'} Equipo`}
          onClose={() => setShow(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <LogoUpload
              current={form.logo}
              onUpload={(u: string) => setForm({ ...form, logo: u })}
              size={80}
              label="Logo del Equipo"
            />
            <div>
              <label style={S.label}>Nombre</label>
              <input
                style={S.input}
                value={form.name}
                onChange={(e: any) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div>
              <label style={S.label}>Abreviatura</label>
              <input
                style={S.input}
                maxLength={4}
                value={form.abbr}
                onChange={(e: any) =>
                  setForm({ ...form, abbr: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <label style={{ ...S.label, marginBottom: 6 }}>Color</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TC.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: c,
                      border:
                        form.color === c
                          ? '3px solid #fff'
                          : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={submit}
              style={{ ...S.btn('primary'), width: '100%', marginTop: 8 }}
            >
              {edit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══ TEAM DETAIL (ROSTER) ═══
export function TeamDetail({ data, id, nav }: any) {
  const t = data.teams.find((x: any) => x.id === id);
  const pls = data.players
    .filter((p: any) => p.teamId === id)
    .sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
  if (!t)
    return (
      <div style={S.sec}>
        <p>No encontrado</p>
      </div>
    );

  return (
    <div style={S.sec}>
      <div
        style={{
          ...S.card,
          padding: 24,
          marginBottom: 20,
          borderTop: `4px solid ${t.color}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TeamLogo team={t} size={56} />
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 22 }}>{t.name}</h2>
            <span style={{ color: K.muted, fontSize: 13 }}>
              {pls.length} jugadores
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <StatMini label="G" value={t.wins || 0} color={K.accent} />
          <StatMini label="P" value={t.losses || 0} color={K.red} />
          <StatMini label="E" value={t.draws || 0} color={K.muted} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3 style={S.secT}>Roster</h3>
        {data.isAdmin && (
          <button
            onClick={() => nav('teams', 'editPlayer', 'new-' + id)}
            style={S.btn('primary')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoPlus size={14} />
              Jugador
            </span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
          gap: 10,
        }}
      >
        {pls.map((p: any) => (
          <div
            key={p.id}
            onClick={() => nav('teams', 'playerCard', p.id)}
            style={{ ...S.card, cursor: 'pointer', padding: 0 }}
          >
            <div
              style={{
                background: `linear-gradient(135deg,${t.color}cc,${t.color}44)`,
                padding: '14px 12px 10px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  fontSize: 28,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,.1)',
                }}
              >
                #{p.number || '?'}
              </div>
              {p.photoUrl ? (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,.3)',
                  }}
                >
                  <img
                    src={p.photoUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ) : (
                <TeamLogo team={t} size={24} />
              )}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 10, color: K.muted, fontWeight: 600 }}>
                {p.position} · #{p.number || '—'}
              </div>
              {p.batting?.VB > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <StatMini
                    label="AVG"
                    value={(p.batting.H / p.batting.VB).toFixed(3)}
                    color={K.accent}
                  />
                  {p.batting.HR > 0 && (
                    <StatMini
                      label="HR"
                      value={p.batting.HR}
                      color={K.yellow}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pls.length === 0 &&
        (data.isAdmin ? (
          <Empty
            icon={IcoUsers}
            text="Sin jugadores"
            action={() => nav('teams', 'editPlayer', 'new-' + id)}
            actionLabel="Agregar"
          />
        ) : (
          <Empty icon={IcoUsers} text="No hay jugadores registrados aún" />
        ))}
    </div>
  );
}

// ═══ UPPER DECK CARD (BARAJITA REDISEÑADA) ═══
export function UpperDeckCard({ data, id, nav }: any) {
  const p = data.players.find((x: any) => x.id === id);
  if (!p)
    return (
      <div style={S.sec}>
        <p>No encontrado</p>
      </div>
    );
  const tm = data.teams.find((t: any) => t.id === p.teamId);
  const bat = calcBatting(p.batting);
  const pit = calcPitching(p.pitching);
  const fld = calcFielding(p.fielding);
  const [tab, setTab] = useState('bat');
  const inicial = (p.name || '?').charAt(0).toUpperCase();
  const hasPhoto = !!p.photoUrl;

  const renderStats = (stats: any) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(65px,1fr))',
        gap: 6,
      }}
    >
      {Object.entries(stats).map(([k, v]: any) => (
        <div
          key={k}
          style={{
            textAlign: 'center',
            padding: '6px 2px',
            borderRadius: 8,
            background: K.input,
          }}
        >
          <div style={{ fontSize: 8, fontWeight: 700, color: K.muted }}>
            {k}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{v}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={S.sec}>
      <div
        style={{
          maxWidth: 380,
          margin: '0 auto 20px',
          borderRadius: 20,
          overflow: 'hidden',
          border: `3px solid ${tm?.color || K.accent}`,
          background: K.card,
          boxShadow: `0 20px 60px rgba(0,0,0,.6), 0 0 0 1px ${K.border}`,
          position: 'relative'
        }}
      >
        {/* ── ZONA DE FOTO PROTAGÓNICA (FULL BLEED) ── */}
        <div
          style={{
            position: 'relative',
            height: 320, // Altura gigante para la foto
            background: hasPhoto 
              ? `url(${p.photoUrl}) center 15% / cover no-repeat` 
              : `linear-gradient(135deg,${tm?.color || K.blue},${tm?.color || K.blue}44,${K.card})`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
          }}
        >
          {/* Sombra base para asegurar lectura del texto si la foto es muy clara */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: hasPhoto 
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.95) 100%)' 
              : 'transparent',
            zIndex: 0
          }} />

          {/* Animación Holográfica Brillante */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.08) 45%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.08) 55%,transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'cardShine 4s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Letra inicial gigante si no hay foto */}
          {!hasPhoto && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
               <span style={{ fontWeight: 900, color: 'rgba(255,255,255,0.06)', fontSize: 180, marginTop: 40 }}>{inicial}</span>
            </div>
          )}

          {/* ── HEADER SUPERIOR: Equipo y Número ── */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 8, 
              background: 'rgba(0,0,0,0.6)', padding: '6px 12px', 
              borderRadius: 20, backdropFilter: 'blur(4px)',
              border: `1px solid rgba(255,255,255,0.1)`
            }}>
              <TeamLogo team={tm} size={20} />
              <span style={{ fontSize: 10, color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                {tm?.abbr || tm?.name || 'EQUIPO'}
              </span>
            </div>
            
            <div style={{ 
              fontSize: 54, fontWeight: 900, color: '#fff', 
              lineHeight: 0.8, textShadow: '0 4px 12px rgba(0,0,0,0.8)',
              marginTop: -4, fontStyle: 'italic'
            }}>
              #{p.number || '?'}
            </div>
          </div>

          {/* ── FOOTER INFERIOR: Nombre y Badges ── */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ 
              fontSize: 32, fontWeight: 900, color: '#fff', 
              lineHeight: 1.1, marginBottom: 10, 
              textShadow: '0 2px 8px rgba(0,0,0,0.9)' 
            }}>
              {p.name}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                p.position,
                p.age && `${p.age} años`,
                p.bats && `B:${p.bats} L:${p.throws || 'D'}`,
              ]
                .filter(Boolean)
                .map((badge, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: i === 0 ? tm?.color || K.accent : 'rgba(255,255,255,.15)',
                      backdropFilter: i !== 0 ? 'blur(4px)' : 'none',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {badge}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* ── DATOS RÁPIDOS (QUICK STATS) ── */}
        {bat && bat.VB > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              borderBottom: `1px solid ${K.border}`,
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            {[
              { l: 'AVG', v: bat.AVG },
              { l: 'HR', v: bat.HR },
              { l: 'CI', v: bat.CI },
              { l: 'OPS', v: bat.OPS },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  padding: '12px 0',
                  textAlign: 'center',
                  borderRight: `1px solid ${K.border}`,
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: K.muted }}>
                  {s.l}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: K.accent,
                    marginTop: 2,
                  }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pitcheo quick stats */}
        {pit && pit.IL > 0 && (!bat || bat.VB === 0) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              borderBottom: `1px solid ${K.border}`,
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            {[
              { l: 'ERA', v: pit.ERA },
              { l: 'K', v: pit.K },
              { l: 'IL', v: pit.IL },
              { l: 'WHIP', v: pit.WHIP },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  padding: '12px 0',
                  textAlign: 'center',
                  borderRight: `1px solid ${K.border}`,
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: K.muted }}>
                  {s.l}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: K.blue,
                    marginTop: 2,
                  }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PESTAÑAS DE ESTADÍSTICAS DETALLADAS ── */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { k: 'bat', l: 'Ofensiva' },
              { k: 'pit', l: 'Pitcheo' },
              { k: 'fld', l: 'Defensa' },
            ].map((t) => (
              <button
                key={t.k}
                style={{ ...S.tab(tab === t.k), fontSize: 10 }}
                onClick={() => setTab(t.k)}
              >
                {t.l}
              </button>
            ))}
          </div>
          {tab === 'bat' &&
            (bat && bat.VB > 0 ? (
              renderStats(bat)
            ) : (
              <p style={{ textAlign: 'center', color: K.muted, padding: 10, fontSize: 12, fontWeight: 700 }}>
                Sin turnos oficiales
              </p>
            ))}
          {tab === 'pit' &&
            (pit && pit.IL > 0 ? (
              renderStats(pit)
            ) : (
              <p style={{ textAlign: 'center', color: K.muted, padding: 10, fontSize: 12, fontWeight: 700 }}>
                Sin labor de pitcheo
              </p>
            ))}
          {tab === 'fld' &&
            (fld && fld.JJ > 0 ? (
              renderStats(fld)
            ) : (
              <p style={{ textAlign: 'center', color: K.muted, padding: 10, fontSize: 12, fontWeight: 700 }}>
                Sin datos defensivos
              </p>
            ))}
        </div>
      </div>

      {/* Edit button - solo admins */}
      {data.isAdmin && (
        <div
          style={{ display: 'flex', gap: 8, maxWidth: 380, margin: '0 auto' }}
        >
          <button
            onClick={() => nav('teams', 'editPlayer', id)}
            style={{ ...S.btn('ghost'), flex: 1 }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <IcoEdit size={14} />
              Editar Jugador
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ═══ PLAYER FORM (admin only) ═══
export function PlayerForm({ data, id, nav }: any) {
  const isNew = id?.startsWith('new');
  const preTeam =
    isNew && id!.includes('-') ? id!.split('-').slice(1).join('-') : '';
  const existing = !isNew ? data.players.find((p: any) => p.id === id) : null;

  const [form, setForm] = useState<any>(
    existing || {
      name: '',
      number: '',
      position: POSITIONS[0],
      teamId: preTeam || data.teams[0]?.id || '',
      bats: 'D',
      throws: 'D',
      age: '',
      photoUrl: '',
      batting: { ...EMPTY_BATTING },
      pitching: { ...EMPTY_PITCHING },
      fielding: { ...EMPTY_FIELDING },
    }
  );
  const [tab, setTab] = useState('info');

  const submit = async () => {
    if (!form.name || !form.teamId) return;
    const d = { ...form };
    delete d.id;
    delete d.createdAt;
    d.categoryId = data.category.id;
    d.leagueId = data.league.id;
    if (existing) await F.set('players', existing.id, d);
    else await F.add('players', d);
    nav('teams', 'detail', form.teamId);
  };

  const del = async () => {
    if (confirm('¿Eliminar?')) {
      await F.del('players', existing.id);
      nav('teams');
    }
  };

  const updateField = (section: string, key: string, val: string) => {
    setForm({
      ...form,
      [section]: { ...form[section], [key]: Number(val) || 0 },
    });
  };

  const renderStatInputs = (
    section: string,
    template: any,
    color: string,
    label: string
  ) => (
    <div>
      <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color }}>
        {label}
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(82px,1fr))',
          gap: 10,
        }}
      >
        {Object.keys(template).map((k) => (
          <div key={k}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: K.muted,
                textTransform: 'uppercase',
              }}
            >
              {k}
            </label>
            <input
              style={{
                ...S.input,
                padding: '6px 8px',
                fontSize: 15,
                fontWeight: 700,
                textAlign: 'center',
              }}
              type="number"
              value={form[section]?.[k] || 0}
              onChange={(e: any) => updateField(section, k, e.target.value)}
            />
          </div>
        ))}
      </div>
      {section === 'batting' && form.batting?.VB > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: K.input,
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}
        >
          {['AVG', 'OBP', 'SLG', 'OPS'].map((k) => {
            const c = calcBatting(form.batting);
            return c ? (
              <StatMini key={k} label={k} value={c[k]} color={color} />
            ) : null;
          })}
        </div>
      )}
      {section === 'pitching' && form.pitching?.IL > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: K.input,
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}
        >
          {['ERA', 'WHIP'].map((k) => {
            const c = calcPitching(form.pitching);
            return c ? (
              <StatMini key={k} label={k} value={c[k]} color={color} />
            ) : null;
          })}
        </div>
      )}
    </div>
  );

  return (
    <div style={S.sec}>
      <h2 style={{ ...S.secT, marginBottom: 16 }}>
        {existing ? 'Editar' : 'Nuevo'} Jugador
      </h2>
      <div
        style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}
      >
        {['info', 'ofensiva', 'pitcheo', 'defensa'].map((t) => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ padding: 20 }}>
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <LogoUpload
                current={form.photoUrl || ''}
                onUpload={(u: string) => setForm({ ...form, photoUrl: u })}
                size={70}
                label="Foto del Jugador"
              />
              <div>
                <label style={S.label}>Nombre</label>
                <input
                  style={S.input}
                  value={form.name}
                  onChange={(e: any) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label style={S.label}>#</label>
                  <input
                    style={S.input}
                    type="number"
                    value={form.number}
                    onChange={(e: any) =>
                      setForm({ ...form, number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label style={S.label}>Pos</label>
                  <select
                    style={{ ...S.select, width: '100%' }}
                    value={form.position}
                    onChange={(e: any) =>
                      setForm({ ...form, position: e.target.value })
                    }
                  >
                    {POSITIONS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Edad</label>
                  <input
                    style={S.input}
                    type="number"
                    value={form.age}
                    onChange={(e: any) =>
                      setForm({ ...form, age: e.target.value })
                    }
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label style={S.label}>Equipo</label>
                  <select
                    style={{ ...S.select, width: '100%' }}
                    value={form.teamId}
                    onChange={(e: any) =>
                      setForm({ ...form, teamId: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    {data.teams.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Batea</label>
                  <select
                    style={{ ...S.select, width: '100%' }}
                    value={form.bats}
                    onChange={(e: any) =>
                      setForm({ ...form, bats: e.target.value })
                    }
                  >
                    <option value="D">Der</option>
                    <option value="I">Izq</option>
                    <option value="A">Ambos</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Lanza</label>
                  <select
                    style={{ ...S.select, width: '100%' }}
                    value={form.throws}
                    onChange={(e: any) =>
                      setForm({ ...form, throws: e.target.value })
                    }
                  >
                    <option value="D">Der</option>
                    <option value="I">Izq</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {tab === 'ofensiva' &&
            renderStatInputs('batting', EMPTY_BATTING, K.accent, 'Ofensiva')}
          {tab === 'pitcheo' &&
            renderStatInputs('pitching', EMPTY_PITCHING, K.blue, 'Pitcheo')}
          {tab === 'defensa' &&
            renderStatInputs('fielding', EMPTY_FIELDING, K.purple, 'Defensa')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={submit} style={{ ...S.btn('primary'), flex: 1 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <IcoSave size={14} />
            Guardar
          </span>
        </button>
        {existing && (
          <button onClick={del} style={S.btn('danger')}>
            <IcoTrash size={14} />
          </button>
        )}
      </div>
    </div>
  );
}