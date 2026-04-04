import { useState, useEffect } from "react";
import { F, Auth } from "./config/firebase.ts";
import { styles as S, colors as K, globalCSS } from "./config/theme.ts";
import { IcoHome, IcoUsers, IcoTrophy, IcoCal, IcoPlay, IcoBack, IcoBall, IcoLogout, IcoLock, IcoUser, IcoBar } from "./components/Icons.tsx";
import { LeagueLogo, Modal } from "./components/UI.tsx";
import Leagues from "./screens/auth/Leagues.tsx";
import Categories from "./screens/auth/Categories.tsx";
import Home from "./screens/dashboard/Home.tsx";
import { TeamsPage, TeamDetail, UpperDeckCard, PlayerForm } from "./screens/dashboard/Teams.tsx";
import StandingsPage from "./screens/dashboard/Standings.tsx";
import StatsPage from "./screens/dashboard/Stats.tsx";
import NewsPage from "./screens/dashboard/News.tsx";
import { CalendarPage } from "./screens/dashboard/Calendar.tsx";
import { ScorerPage, LiveGame, WatchGame } from "./screens/dashboard/Scorer.tsx";
import MetroTicker from "./components/MetroTicker.tsx"; // Importamos el Ticker global

// News icon
const IcoNews = (p: any) => (
  <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
);

export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState("loading");
  const [sub, setSub] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [league, setLeague] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  // Auth
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    return Auth.onAuth((u: any) => { setUser(u); setIsAdmin(!!u); });
  }, []);

  const handleLogin = async () => {
    setLoginErr(""); setLoginLoading(true);
    try {
      await Auth.login(loginEmail, loginPass);
      setShowLogin(false); setLoginEmail(""); setLoginPass("");
    } catch (e: any) {
      setLoginErr(e.code === "auth/invalid-credential" ? "Email o contraseña incorrecta" : "Error al iniciar sesión");
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => { await Auth.logout(); setIsAdmin(false); };

  // Init + restore
  useEffect(() => {
    const unsubs: any[] = [];
    unsubs.push(F.on("news", setNews));
    unsubs.push(
      F.on("leagues", (ls: any[]) => {
        setLeagues(ls);
        const saved = localStorage.getItem("bb_saved");
        if (saved && !ready) {
          try {
            const { leagueId, categoryId } = JSON.parse(saved);
            const foundLeague = ls.find((l: any) => l.id === leagueId);
            if (foundLeague) {
              setLeague(foundLeague);
              const u = F.where("categories", "leagueId", leagueId, (cats: any[]) => {
                setCategories(cats);
                const foundCat = cats.find((c: any) => c.id === categoryId);
                if (foundCat) { setCategory(foundCat); setScreen("home"); }
                else { setScreen("categories"); }
              });
              unsubs.push(u);
            } else { setScreen("leagues"); }
          } catch { setScreen("leagues"); }
        } else if (!ready) { setScreen("leagues"); }
        setReady(true);
      })
    );
    return () => unsubs.forEach(u => u && u());
  }, []);

  useEffect(() => {
    if (!league) { setCategories([]); return; }
    return F.where("categories", "leagueId", league.id, setCategories);
  }, [league?.id]);

  useEffect(() => {
    if (!category) { setTeams([]); setPlayers([]); setGames([]); return; }
    const u1 = F.where("teams", "categoryId", category.id, setTeams);
    const u2 = F.where("players", "categoryId", category.id, setPlayers);
    const u3 = F.where("games", "categoryId", category.id, setGames);
    return () => { u1(); u2(); u3(); };
  }, [category?.id]);

  const nav = (s: string, sb: string | null = null, id: string | null = null) => { setScreen(s); setSub(sb); setSelId(id); };
  const selectLeague = (l: any) => { setLeague(l); setCategory(null); nav("categories"); };
  const selectCategory = (c: any) => {
    setCategory(c);
    localStorage.setItem("bb_saved", JSON.stringify({ leagueId: league.id, categoryId: c.id }));
    nav("home");
  };
  const switchLeague = () => { localStorage.removeItem("bb_saved"); setLeague(null); setCategory(null); nav("leagues"); };
  const goBack = () => {
    if (sub) { nav(screen); return; }
    if (category && screen !== "home") { nav("home"); return; }
    if (category) { setCategory(null); nav("categories"); return; }
    if (league) { setLeague(null); nav("leagues"); }
  };

  const inDashboard = !!category;
  const data = { teams, players, games, league, category, isAdmin, news };

  if (screen === "loading") return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{globalCSS}</style>
      <IcoBall size={44} color={K.accent} style={{ animation: "spin 1.5s linear infinite" }} />
    </div>
  );

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{globalCSS}</style>

      {/* HEADER + TICKER ENCAPSULADOS EN STICKY */}
      <div style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <header style={S.hdr}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {screen !== "leagues" && (
              <button onClick={goBack} style={{ background: "none", border: "none", color: K.dim, cursor: "pointer", padding: 4 }}>
                <IcoBack size={20} />
              </button>
            )}
            {/* ── AQUÍ ESTÁ EL LOGO REEMPLAZANDO A LA PELOTA ── */}
            {league ? <LeagueLogo league={league} size={28} /> : <img src="https://i.postimg.cc/XJr7JyC0/image.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
            <div>
              <h1 style={{ fontSize: league ? 14 : 17, fontWeight: 900, background: `linear-gradient(135deg,${K.accent},${K.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {league ? league.name : "Béisbol Menor"}
              </h1>
              {category && <div style={{ fontSize: 10, color: K.muted, fontWeight: 600 }}>{category.name}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...S.badge(K.accent), fontSize: 9 }}>ADMIN</span>
                <button onClick={handleLogout} style={{ background: "none", border: "none", color: K.muted, cursor: "pointer", padding: 4 }} title="Cerrar sesión"><IcoLogout size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{ background: "none", border: "none", color: K.muted, cursor: "pointer", padding: 4 }} title="Admin"><IcoLock size={16} /></button>
            )}
            {inDashboard && (
              <button onClick={switchLeague} title="Cambiar liga" style={{ background: "none", border: "none", color: K.muted, cursor: "pointer", padding: 4 }}><IcoLogout size={16} /></button>
            )}
            <div style={{ width: 7, height: 7, borderRadius: 4, background: K.green, animation: "pulse 2s infinite" }} />
          </div>
        </header>

        {/* METRO TICKER APARECE SOLO SI ESTAMOS EN UNA CATEGORÍA Y NO ESTAMOS ANOTANDO */}
        {inDashboard && screen !== "scorer" && <MetroTicker data={data} />}
      </div>

      {/* SCREENS */}
      <main>
        {screen === "leagues" && <Leagues leagues={leagues} onSelect={selectLeague} isAdmin={isAdmin} />}
        {screen === "categories" && league && <Categories league={league} categories={categories} onSelect={selectCategory} isAdmin={isAdmin} />}
        {inDashboard && screen === "home" && !sub && <Home data={data} nav={nav} />}
        {inDashboard && screen === "teams" && !sub && <TeamsPage data={data} nav={nav} />}
        {inDashboard && screen === "teams" && sub === "detail" && <TeamDetail data={data} id={selId} nav={nav} />}
        {inDashboard && screen === "teams" && sub === "playerCard" && <UpperDeckCard data={data} id={selId} nav={nav} />}
        {inDashboard && screen === "teams" && sub === "editPlayer" && isAdmin && <PlayerForm data={data} id={selId} nav={nav} />}
        {inDashboard && screen === "standings" && <StandingsPage data={data} nav={nav} />}
        {inDashboard && screen === "stats" && <StatsPage data={data} nav={nav} />}
        {inDashboard && screen === "news" && <NewsPage data={data} nav={nav} />}
        {inDashboard && screen === "calendar" && !sub && <CalendarPage data={data} nav={nav} />}
        {inDashboard && screen === "calendar" && sub === "boxscore" && <BoxScore data={data} id={selId} nav={nav} />}
        {inDashboard && screen === "scorer" && !sub && isAdmin && <ScorerPage data={data} nav={nav} />}
        {inDashboard && screen === "scorer" && sub === "live" && isAdmin && <LiveGame data={data} id={selId} nav={nav} />}
        {inDashboard && screen === "scorer" && sub === "watch" && <WatchGame data={data} id={selId} nav={nav} />}
      </main>

      {/* BOTTOM NAV */}
      {inDashboard && (
        <nav style={S.nav}>
          {[
            { k: "home", i: IcoHome, l: "Inicio", adminOnly: false },
            { k: "teams", i: IcoUsers, l: "Equipos", adminOnly: false },
            { k: "stats", i: IcoBar, l: "Stats", adminOnly: false },
            { k: "standings", i: IcoTrophy, l: "Tabla", adminOnly: false },
            { k: "news", i: IcoNews, l: "Noticias", adminOnly: false },
            { k: "calendar", i: IcoCal, l: "Calendario", adminOnly: false },
            { k: "scorer", i: IcoPlay, l: "Anotar", adminOnly: true },
          ]
            .filter(n => !n.adminOnly || isAdmin)
            .map(n => (
              <button key={n.k} onClick={() => nav(n.k)} style={S.navBtn(screen === n.k)}>
                <n.i size={21} />
                <span>{n.l}</span>
              </button>
            ))}
        </nav>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <Modal title="Acceso Administrador" onClose={() => setShowLogin(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <IcoUser size={40} color={K.accent} style={{ margin: "0 auto 10px" }} />
              <p style={{ color: K.dim, fontSize: 13 }}>Solo para delegados y anotadores autorizados</p>
            </div>
            <div><label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="admin@liga.com" value={loginEmail} onChange={(e: any) => setLoginEmail(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && handleLogin()} /></div>
            <div><label style={S.label}>Contraseña</label>
              <input style={S.input} type="password" placeholder="••••••••" value={loginPass} onChange={(e: any) => setLoginPass(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && handleLogin()} /></div>
            {loginErr && <div style={{ ...S.badge(K.red), justifyContent: "center", padding: "8px 12px" }}>{loginErr}</div>}
            <button onClick={handleLogin} style={{ ...S.btn("primary"), width: "100%", marginTop: 4 }} disabled={loginLoading || !loginEmail || !loginPass}>
              {loginLoading ? "Entrando..." : "Iniciar Sesión"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}