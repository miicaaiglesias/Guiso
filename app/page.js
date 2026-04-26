'use client';
import { useState, useEffect, useRef } from 'react';

const POPPINS = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('Todas');
  const [activeMethod, setActiveMethod] = useState('Todos');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('explorar');
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [ingInput, setIngInput] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([{ role: 'bot', text: '¡Hola! 👋 Soy el chef de Guiso. Conozco todas tus recetas. ¿Qué necesitás?' }]);
  const [chatInput, setChatInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = POPPINS;
    document.head.appendChild(link);
    const favs = JSON.parse(localStorage.getItem('guiso_favs') || '[]');
    setFavorites(favs);
    fetch('/api/recipes')
      .then(r => r.json())
      .then(d => { setRecipes(d.recipes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, aiLoading]);

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false);
      setTimerFinished(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timerSeconds]);

  function parseMinutes(tiempoStr) {
    if (!tiempoStr) return 0;
    const match = tiempoStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function startTimer(mins) {
    setTimerSeconds(mins * 60);
    setTimerRunning(true);
    setTimerFinished(false);
  }

  function stopTimer() {
    setTimerRunning(false);
    clearTimeout(timerRef.current);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerFinished(false);
    clearTimeout(timerRef.current);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function toggleFav(nombre) {
    const newFavs = favorites.includes(nombre)
      ? favorites.filter(f => f !== nombre)
      : [...favorites, nombre];
    setFavorites(newFavs);
    localStorage.setItem('guiso_favs', JSON.stringify(newFavs));
  }

  function toggleCart(ing) {
    setCart(prev => prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]);
  }

  function searchByIngredient(ing) {
    setSelected(null);
    setSearch(ing);
    setActiveCat('Todas');
    setActiveMethod('Todos');
    setActiveTab('explorar');
    resetTimer();
  }

  const categories = ['Todas', ...[...new Set(recipes.map(r => r.categoria))].filter(Boolean).sort()];
  const methods = ['Todos', ...[...new Set(recipes.map(r => r.metodo).filter(Boolean))].sort()];

  const filtered = recipes.filter(r => {
    const catOk = activeCat === 'Todas' || r.categoria === activeCat;
    const methodOk = activeMethod === 'Todos' || r.metodo === activeMethod;
    const qOk = !search || r.nombre.toLowerCase().includes(search.toLowerCase()) || (r.ingredientes || '').toLowerCase().includes(search.toLowerCase());
    return catOk && methodOk && qOk;
  });

  const favRecipes = recipes.filter((r, i, arr) => favorites.includes(r.nombre) && arr.findIndex(x => x.nombre === r.nombre) === i);

  async function callAI(messages, system) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system })
    });
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  function buildContext() {
    return recipes.slice(0, 80).map(r => `- ${r.nombre} (${r.categoria}): ${r.ingredientes}`).join('\n');
  }

  async function getRecommendation() {
    if (!ingInput.trim() || aiLoading) return;
    setAiLoading(true); setAiResult('');
    try {
      const text = await callAI(
        [{ role: 'user', content: `Tengo estos ingredientes: ${ingInput}. ¿Qué puedo cocinar? Prioriza recetas del recetario.` }],
        `Sos el chef de Guiso, app de recetas saludables. Recetario:\n${buildContext()}\nRespondé en español, de forma práctica y amigable.`
      );
      setAiResult(text);
    } catch { setAiResult('Error al conectar. Intentá de nuevo.'); }
    setAiLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || aiLoading) return;
    const msg = chatInput; setChatInput(''); setAiLoading(true);
    const newHistory = [...chatHistory, { role: 'user', text: msg }];
    setChatHistory(newHistory);
    try {
      const messages = newHistory.filter((m, i) => i > 0).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      const reply = await callAI(messages, `Sos el chef de Guiso. Recetario:\n${buildContext()}\nRespondé en español, cálido y práctico.`);
      setChatHistory([...newHistory, { role: 'bot', text: reply }]);
    } catch { setChatHistory([...newHistory, { role: 'bot', text: 'Error al conectar.' }]); }
    setAiLoading(false);
  }

  const font = "'Poppins', sans-serif";
  const red = '#C1170C';
  const redLight = '#FFF0EF';
  const methodIcons = { 'Horno': '🔥', 'Airfryer': '💨', 'Plancha': '♨️', 'Hervido': '🫕', 'Salteado': '🥘', 'Sin cocción': '🥗' };
  const diffColors = { 'Fácil': '#16a34a', 'Media': '#d97706', 'Alta': '#dc2626' };

  if (selected) {
    const ings = (selected.ingredientes || '').split(',').map(i => i.trim()).filter(Boolean);
    const isFav = favorites.includes(selected.nombre);
    const mins = parseMinutes(selected.tiempo);
    const steps = (selected.preparacion || '').split(/\n|\. /).map(s => s.trim()).filter(s => s.length > 3);

    return (
      <div style={{ fontFamily: font, maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f8f8' }}>
        {/* Hero */}
        <div style={{ background: red, padding: '20px 20px 50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => { setSelected(null); resetTimer(); }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <button onClick={() => toggleFav(selected.nombre)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isFav ? '❤️' : '🤍'}</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🍽️</div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>{selected.nombre}</h1>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>{selected.categoria}</span>
              {selected.tiempo && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>⏱️ {selected.tiempo}</span>}
              {selected.metodo && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>{methodIcons[selected.metodo] || '🍳'} {selected.metodo}</span>}
              {selected.dificultad && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>📊 {selected.dificultad}</span>}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 100px', marginTop: -24 }}>

          {/* Temporizador */}
          {mins > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 12, textAlign: 'center' }}>
              {timerFinished ? (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: red, marginBottom: 10 }}>¡Listo! El tiempo terminó</div>
                  <button onClick={resetTimer} style={{ padding: '8px 20px', background: red, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>Reiniciar</button>
                </div>
              ) : timerRunning || timerSeconds > 0 ? (
                <div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: red, letterSpacing: 2, marginBottom: 8 }}>{formatTime(timerSeconds)}</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => timerRunning ? stopTimer() : setTimerRunning(true)} style={{ padding: '8px 20px', background: timerRunning ? '#f5f5f5' : red, border: 'none', borderRadius: 10, color: timerRunning ? '#333' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>{timerRunning ? '⏸ Pausar' : '▶ Continuar'}</button>
                    <button onClick={resetTimer} style={{ padding: '8px 20px', background: '#f5f5f5', border: 'none', borderRadius: 10, color: '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>✕ Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, color: '#999', marginBottom: 10 }}>⏱️ Tiempo estimado: <strong style={{ color: '#1a1a1a' }}>{selected.tiempo}</strong></div>
                  <button onClick={() => startTimer(mins)} style={{ padding: '10px 24px', background: red, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>▶ Iniciar temporizador</button>
                </div>
              )}
            </div>
          )}

          {/* Ingredientes */}
          {ings.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🧾 Ingredientes</h2>
                <button onClick={() => {
                  const allIngs = (selected.ingredientes || '').split(',').map(i => i.trim()).filter(Boolean);
                  setCart(prev => { const newCart = [...prev]; allIngs.forEach(ing => { if (!newCart.includes(ing)) newCart.push(ing); }); return newCart; });
                  setSelected(null); setActiveTab('lista');
                }} style={{ fontSize: 12, color: red, background: redLight, border: 'none', padding: '4px 10px', borderRadius: 999, cursor: 'pointer', fontFamily: font }}>+ Lista de compras</button>
              </div>
              {ings.map((ing, i) => (
                <div key={i} onClick={() => searchByIngredient(ing)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < ings.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: red, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: red, fontWeight: 600, textDecoration: 'underline' }}>{ing}</span>
                  <span style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>ver recetas →</span>
                </div>
              ))}
            </div>
          )}

          {/* Preparación */}
          {selected.preparacion && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>👩‍🍳 Preparación</h2>
              {steps.length > 1 ? steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: red, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{step.replace(/^\d+\.\s*/, '')}</span>
                </div>
              )) : (
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.preparacion}</p>
              )}
            </div>
          )}

          {/* Tip */}
          {selected.tip && (
            <div style={{ background: '#fffbeb', borderRadius: 20, padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 12, borderLeft: '4px solid #f59e0b' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#92400e' }}>💡 Tip</h2>
              <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6, margin: 0 }}>{selected.tip}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font, maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <div style={{ background: '#fff', padding: '16px 20px 0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, position: 'relative' }}>
          <img src="/logo.png" alt="Guiso" onClick={() => { setActiveTab('explorar'); setSearch(''); setActiveCat('Todas'); setActiveMethod('Todos'); setMenuOpen(false); }} style={{ height: 90, width: 'auto', cursor: 'pointer' }} />
          <button onClick={() => setMenuOpen(prev => !prev)} style={{ position: 'absolute', right: 0, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#1a1a1a', padding: '4px 8px' }}>☰</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginBottom: 10 }}>{loading ? 'Cargando...' : `${recipes.length} recetas`}</div>

        {menuOpen && (
          <div style={{ position: 'absolute', top: 110, right: 20, background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 200, overflow: 'hidden' }}>
            <div onClick={() => { setActiveTab('favoritos'); setMenuOpen(false); }} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#1a1a1a', borderBottom: '1px solid #f5f5f5' }}>
              ❤️ <span>Favoritos</span>
              {favorites.length > 0 && <span style={{ marginLeft: 'auto', background: red, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{favorites.length}</span>}
            </div>
            <div onClick={() => { setActiveTab('lista'); setMenuOpen(false); }} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#1a1a1a' }}>
              🛒 <span>Lista de compras</span>
              {cart.length > 0 && <span style={{ marginLeft: 'auto', background: red, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{cart.length}</span>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4 }}>
          {[['explorar','🔍','Explorar'],['ingredientes','🥬','Ingredientes'],['chef','🤖','Chef IA']].map(([id, icon, label]) => (
            <button key={id} onClick={() => { setActiveTab(id); setMenuOpen(false); }} style={{ flex: 1, padding: '8px 4px', background: 'none', border: 'none', borderBottom: activeTab === id ? `3px solid ${red}` : '3px solid transparent', color: activeTab === id ? red : '#999', fontSize: 11, fontWeight: activeTab === id ? 700 : 400, cursor: 'pointer', fontFamily: font }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'explorar' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f8f8f8' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar receta o ingrediente..." style={{ width: '100%', padding: '12px 12px 12px 42px', border: 'none', borderRadius: 14, background: '#fff', color: '#1a1a1a', fontSize: 14, fontFamily: font, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{ padding: '6px 14px', borderRadius: 999, border: 'none', background: activeCat === c ? red : '#fff', color: activeCat === c ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: font, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{c}</button>
            ))}
          </div>
          {methods.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
              {methods.map(m => (
                <button key={m} onClick={() => setActiveMethod(m)} style={{ padding: '4px 12px', borderRadius: 999, border: `1.5px solid ${activeMethod === m ? red : '#e0e0e0'}`, background: activeMethod === m ? redLight : '#fff', color: activeMethod === m ? red : '#777', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: font }}>
                  {methodIcons[m] || ''} {m}
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999', marginBottom: 12, fontWeight: 500 }}>{filtered.length} recetas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((r, i) => (
              <div key={i} onClick={() => setSelected(r)} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🍽️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>{r.categoria}</span>
                    {r.tiempo && <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>⏱️ {r.tiempo}</span>}
                    {r.dificultad && <span style={{ fontSize: 11, color: diffColors[r.dificultad] || '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>📊 {r.dificultad}</span>}
                    {r.metodo && <span style={{ fontSize: 11, color: red, background: redLight, padding: '2px 8px', borderRadius: 999 }}>{methodIcons[r.metodo] || ''} {r.metodo}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); toggleFav(r.nombre); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 0 }}>{favorites.includes(r.nombre) ? '❤️' : '🤍'}</button>
                  <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'favoritos' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f8f8f8' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#1a1a1a' }}>Mis favoritos ❤️</h2>
          <p style={{ fontSize: 13, color: '#999', margin: '0 0 16px' }}>{favRecipes.length} recetas guardadas</p>
          {favRecipes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤍</div>
              <p style={{ color: '#999', fontSize: 14 }}>Todavía no guardaste favoritos.<br />Tocá el corazón en cualquier receta.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {favRecipes.map((r, i) => (
                <div key={i} onClick={() => setSelected(r)} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🍽️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{r.nombre}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>{r.categoria}</span>
                      {r.tiempo && <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>⏱️ {r.tiempo}</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleFav(r.nombre); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>❤️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lista' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f8f8f8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#1a1a1a' }}>Lista de compras 🛒</h2>
            {cart.length > 0 && <button onClick={() => setCart([])} style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Limpiar</button>}
          </div>
          <p style={{ fontSize: 13, color: '#999', margin: '0 0 16px' }}>Agregá ingredientes desde cualquier receta</p>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ color: '#999', fontSize: 14 }}>Tu lista está vacía.<br />Abrí una receta y tocá "+ Lista de compras".</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cart.map((ing, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${red}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: red }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#1a1a1a' }}>{ing}</span>
                  <button onClick={() => toggleCart(ing)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ingredientes' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f8f8f8' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#1a1a1a' }}>¿Qué tenés en casa? 🥬</h2>
          <p style={{ fontSize: 13, color: '#999', margin: '0 0 16px', lineHeight: 1.6 }}>Escribí los ingredientes y te sugiero qué cocinar con tu recetario.</p>
          <textarea value={ingInput} onChange={e => setIngInput(e.target.value)} placeholder="ej: pollo, zucchini, huevo, cebolla..." style={{ width: '100%', minHeight: 100, padding: '14px', border: 'none', borderRadius: 16, background: '#fff', color: '#1a1a1a', fontSize: 14, fontFamily: font, resize: 'vertical', boxSizing: 'border-box', outline: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }} />
          <button onClick={getRecommendation} disabled={aiLoading || !ingInput.trim()} style={{ width: '100%', marginTop: 12, padding: '14px', background: aiLoading || !ingInput.trim() ? '#f0c4c0' : red, border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', fontFamily: font }}>
            {aiLoading ? 'Consultando al chef...' : 'Ver qué puedo cocinar ✨'}
          </button>
          {aiResult && (
            <div style={{ marginTop: 16, background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', fontSize: 14, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-wrap', borderLeft: `4px solid ${red}` }}>
              {aiResult}
            </div>
          )}
        </div>
      )}

      {activeTab === 'chef' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8f8f8' }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '12px 16px', background: m.role === 'user' ? red : '#fff', color: m.role === 'user' ? '#fff' : '#333', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {m.text}
              </div>
            ))}
            {aiLoading && <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: '#fff', borderRadius: '18px 18px 18px 4px', fontSize: 14, color: '#999', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '12px 20px 20px', background: '#fff', boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Preguntá al chef..." style={{ flex: 1, height: 46, padding: '0 16px', border: 'none', borderRadius: 14, background: '#f5f5f5', color: '#1a1a1a', fontSize: 14, fontFamily: font, outline: 'none' }} />
              <button onClick={sendChat} disabled={aiLoading || !chatInput.trim()} style={{ width: 46, height: 46, borderRadius: 14, background: aiLoading ? '#f0c4c0' : red, border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}