import React, { useEffect, useRef, memo, useMemo } from 'react';

const LIGA_LOGO = 'https://i.postimg.cc/XJr7JyC0/image.png';
const SPEED = 0.6;
const PAUSE_TIME_AFTER_TOUCH = 2000;

interface TickerItem {
    type: 'noticia' | 'lider' | 'resultado' | 'proximo' | 'tabla';
    text: string;
    icon: string;
}

const itemColor = (type: TickerItem['type']) => {
    switch (type) {
        case 'noticia': return '#60a5fa'; 
        case 'resultado': return '#22d3ee'; 
        case 'proximo': return '#a78bfa'; 
        case 'tabla': return '#facc15'; 
        case 'lider': return '#fb923c'; 
    }
};

const MetroTicker: React.FC<{ data: any }> = memo(({ data }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const posRef = useRef(0);
    const rafRef = useRef(0);
    const pauseRef = useRef(false);

    const combinedItems = useMemo(() => {
        if (!data) return [];
        const result: TickerItem[] = [];

        const getTeamAbbr = (id: string) => {
            const team = (data.teams || []).find((t: any) => t.id === id);
            return team ? (team.abbr || team.name).toUpperCase() : "?";
        };

        // 1. Noticias (Últimas 3)
        const news = [...(data.news || [])].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3);
        news.forEach((n: any) => {
            if (n.title) result.push({ type: 'noticia', icon: '📢', text: `PRENSA: ${n.title}` });
        });

        // 2. Resultados Recientes (Últimos 3)
        const recent = [...(data.games || [])].filter((g: any) => g.status === 'final').sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3);
        recent.forEach((g: any) => {
            const aw = getTeamAbbr(g.awayTeamId);
            const hm = getTeamAbbr(g.homeTeamId);
            const hmGana = (g.homeScore || 0) > (g.awayScore || 0);
            result.push({ type: 'resultado', icon: '⚾', text: `FINAL: ${aw} ${g.awayScore || 0} - ${g.homeScore || 0} ${hm} ${hmGana ? '🏆' : ''}`.trim() });
        });

        // 3. Próximos Juegos (Próximos 2)
        const sched = [...(data.games || [])].filter((g: any) => g.status === 'scheduled').sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '')).slice(0, 2);
        sched.forEach((g: any) => {
            const aw = getTeamAbbr(g.awayTeamId);
            const hm = getTeamAbbr(g.homeTeamId);
            result.push({ type: 'proximo', icon: '📅', text: `PRÓXIMO: ${aw} vs ${hm} · ${g.date || ''} ${g.time || ''}`.trim() });
        });

        // 4. Tabla Posiciones (G-P)
        const standings = [...(data.teams || [])].map((t: any) => ({ ...t, w: t.wins || 0, l: t.losses || 0 })).sort((a: any, b: any) => b.w - a.w || a.l - b.l).slice(0, 5);
        if (standings.length > 0) {
            const posStr = standings.map((t: any, i: number) => `${i + 1}.${(t.abbr || t.name).split(' ')[0].toUpperCase()} (${t.w}-${t.l})`).join(' · ');
            result.push({ type: 'tabla', icon: '🏆', text: `POSICIONES: ${posStr}` });
        }

        // 5. Líderes (AVG y HR)
        const batters = [...(data.players || [])].filter((p: any) => p.batting?.VB > 9);
        if (batters.length > 0) {
            const topAvg = batters.sort((a, b) => (b.batting.H / b.batting.VB) - (a.batting.H / a.batting.VB))[0];
            if (topAvg) result.push({ type: 'lider', icon: '🔥', text: `LÍDER AVG: ${topAvg.name.toUpperCase()} · ${(topAvg.batting.H / topAvg.batting.VB).toFixed(3)}` });
        }

        const hrHitters = [...(data.players || [])].filter((p: any) => p.batting?.HR > 0);
        if (hrHitters.length > 0) {
            const topHR = hrHitters.sort((a, b) => b.batting.HR - a.batting.HR)[0];
            if (topHR) result.push({ type: 'lider', icon: '💥', text: `LÍDER HR: ${topHR.name.toUpperCase()} · ${topHR.batting.HR}` });
        }

        if (result.length === 0) {
            result.push({ type: 'noticia', icon: '⚾', text: 'BIENVENIDOS A LA TEMPORADA OFICIAL' });
        }

        return [...result, ...result]; 
    }, [data]);

    useEffect(() => {
        if (combinedItems.length < 2) return;

        const tid = setTimeout(() => {
            const track = trackRef.current;
            if (!track) return;
            const halfW = track.scrollWidth / 2;
            posRef.current = 0;

            const step = () => {
                if (!pauseRef.current && track) {
                    posRef.current += SPEED;
                    if (posRef.current >= halfW) posRef.current -= halfW;
                    track.style.transform = `translateX(-${posRef.current}px)`;
                }
                rafRef.current = requestAnimationFrame(step);
            };
            rafRef.current = requestAnimationFrame(step);
        }, 100);

        return () => { clearTimeout(tid); cancelAnimationFrame(rafRef.current); };
    }, [combinedItems]);

    if (combinedItems.length === 0) return null;

    return (
        <div style={{
            width: '100%',
            background: 'linear-gradient(90deg, #020c1b 0%, #0d1f4a 50%, #020c1b 100%)',
            borderBottom: '2.5px solid #22c55e', 
            display: 'flex', alignItems: 'center',
            height: 38, overflow: 'hidden', zIndex: 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
            <div style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.1)',
                height: '100%', background: 'rgba(255,255,255,0.03)',
            }}>
                <img src={LIGA_LOGO} alt="Liga"
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid white' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: 'white', letterSpacing: '2px', whiteSpace: 'nowrap', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    NEWS
                </span>
            </div>

            <div
                style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
                onMouseEnter={() => { pauseRef.current = true; }}
                onMouseLeave={() => { pauseRef.current = false; }}
                onTouchStart={() => { pauseRef.current = true; }}
                onTouchEnd={() => { setTimeout(() => { pauseRef.current = false; }, PAUSE_TIME_AFTER_TOUCH); }}
            >
                <div ref={trackRef} style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', willChange: 'transform' }}>
                    {combinedItems.map((item, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingRight: 40 }}>
                            <span style={{ color: 'white', fontSize: '0.6rem', marginRight: 4, opacity: 0.2 }}>◆</span>
                            <span style={{ fontSize: '0.75rem' }}>{item.icon}</span>
                            <span style={{
                                fontSize: '0.68rem', fontWeight: 700,
                                color: itemColor(item.type),
                                letterSpacing: '0.3px',
                                textTransform: 'uppercase'
                            }}>
                                {item.text}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default MetroTicker;