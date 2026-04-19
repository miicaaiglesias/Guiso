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
  const chatEndRef = useRef(null);

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

  const categories = ['Todas', ...[...new Set(recipes.map(r => r.categoria))].filter(Boolean).sort()];
  const methods = ['Todos', ...[...new Set(recipes.map(r => r.metodo).filter(Boolean))].sort()];

  const filtered = recipes.filter(r => {
    const catOk = activeCat === 'Todas' || r.categoria === activeCat;
    const methodOk = activeMethod === 'Todos' || r.metodo === activeMethod;
    const qOk = !search || r.nombre.toLowerCase().includes(search.toLowerCase()) || (r.ingredientes || '').toLowerCase().includes(search.toLowerCase());
    return catOk && methodOk && qOk;
  });

  const favRecipes = recipes.filter(r => favorites.includes(r.nombre));

  const allIngredients = selected
    ? (selected.ingredientes || '').split(',').map(i => i.trim()).filter(Boolean)
    : [];

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
      const messages = newHistory
        .filter((m, i) => i > 0)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      const reply = await callAI(messages, `Sos el chef de Guiso. Recetario:\n${buildContext()}\nRespondé en español, cálido y práctico.`);
      setChatHistory([...newHistory, { role: 'bot', text: reply }]);
    } catch { setChatHistory([...newHistory, { role: 'bot', text: 'Error al conectar.' }]); }
    setAiLoading(false);
  }

  const font = "'Poppins', sans-serif";
  const red = '#C1170C';
  const redLight = '#FFF0EF';

  const methodIcons = { 'Horno': '🔥', 'Airfryer': '💨', 'Plancha': '♨️', 'Hervido': '♨️', 'Salteado': '🥘', 'Sin cocción': '🥗' };

  if (selected) {
    const ings = (selected.ingredientes || '').split(',').map(i => i.trim()).filter(Boolean);
    const isFav = favorites.includes(selected.nombre);
    return (
      <div style={{ fontFamily: font, maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#fff' }}>
        {/* Hero */}
        <div style={{ background: red, padding: '20px 20px 40px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <button onClick={() => toggleFav(selected.nombre)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🍽️</div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.3 }}>{selected.nombre}</h1>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 12px', borderRadius: 999 }}>{selected.categoria}</span>
            {selected.metodo && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 12px', borderRadius: 999, marginLeft: 6 }}>{methodIcons[selected.metodo] || '🍳'} {selected.metodo}</span>}
          </div>
        </div>

        <div style={{ padding: '0 20px 100px', marginTop: -16 }}>
          {/* Ingredients */}
          {ings.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Ingredientes</h2>
                <button onClick={() => setActiveTab('lista')} style={{ fontSize: 12, color: red, background: redLight, border: 'none', padding: '4px 10px', borderRadius: 999, cursor: 'pointer', fontFamily: font }}>+ Lista de compras</button>
              </div>
              {ings.map((ing, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < ings.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: red, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#333' }}>{ing}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preparation */}
          {selected.preparacion && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>Preparación</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.preparacion}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font, maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f8f8', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 20px 0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍲</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>Guiso</div>
              <div style={{ fontSize: 11, color: '#999' }}>{loading ? 'Cargando...' : `${recipes.length} recetas`}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setActiveTab('favoritos')} style={{ width: 36, height: 36, borderRadius: 10, background: activeTab === 'favoritos' ? redLight : '#f5f5f5', border: 'none', fontSize: 16, cursor: 'pointer', position: 'relative' }}>
              ❤️
              {favorites.length > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: red, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>{favorites.length}</span>}
            </button>
            <button onClick={() => setActiveTab('lista')} style={{ width: 36, height: 36, borderRadius: 10, background: activeTab === 'lista' ? redLight : '#f5f5f5', border: 'none', fontSize: 16, cursor: 'pointer', position: 'relative' }}>
              🛒
              {cart.length > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: red, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>{cart.length}</span>}
            </button>
          </div>
        </div>

        {/* Bottom tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['explorar','🔍','Explorar'],['ingredientes','🥬','Ingredientes'],['chef','🤖','Chef IA']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '8px 4px', background: 'none', border: 'none', borderBottom: activeTab === id ? `3px solid ${red}` : '3px solid transparent', color: activeTab === id ? red : '#999', fontSize: 11, fontWeight: activeTab === id ? 700 : 400, cursor: 'pointer', fontFamily: font }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* EXPLORAR */}
      {activeTab === 'explorar' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar receta o ingrediente..." style={{ width: '100%', padding: '12px 12px 12px 42px', border: 'none', borderRadius: 14, background: '#fff', color: '#1a1a1a', fontSize: 14, fontFamily: font, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{ padding: '6px 14px', borderRadius: 999, border: 'none', background: activeCat === c ? red : '#fff', color: activeCat === c ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: font, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{c}</button>
            ))}
          </div>

          {/* Method filters */}
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

          {/* Recipe cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((r, i) => (
              <div key={i} onClick={() => setSelected(r)} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🍽️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombre}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>{r.categoria}</span>
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

      {/* FAVORITOS */}
      {activeTab === 'favoritos' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Mis favoritos ❤️</h2>
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
                    <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 8px', borderRadius: 999 }}>{r.categoria}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleFav(r.nombre); }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>❤️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LISTA DE COMPRAS */}
      {activeTab === 'lista' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Lista de compras 🛒</h2>
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
                <div key={i} onClick={() => toggleCart(ing)} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${red}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: red }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#1a1a1a' }}>{ing}</span>
                  <button onClick={e => { e.stopPropagation(); toggleCart(ing); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MIS INGREDIENTES */}
      {activeTab === 'ingredientes' && (
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#1a1a1a' }}>¿Qué tenés en casa? 🍴</h2>
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

      {/* CHEF IA */}
      {activeTab === 'chef' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '12px 16px', background: m.role === 'user' ? red : '#fff', color: m.role === 'user' ? '#fff' : '#333', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {m.text}
              </div>
            ))}
            {aiLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: '#fff', borderRadius: '18px 18px 18px 4px', fontSize: 14, color: '#999', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>...</div>
            )}
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