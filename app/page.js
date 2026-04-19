'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('Todas');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('explorar');
  const [selected, setSelected] = useState(null);
  const [ingInput, setIngInput] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([{ role: 'bot', text: 'Hola! Soy el chef de Guiso. Conociendo tu recetario completo. ¿Qué necesitás?' }]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetch('/api/recipes')
      .then(r => r.json())
      .then(d => { setRecipes(d.recipes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['Todas', ...[...new Set(recipes.map(r => r.categoria))].sort()];
  const filtered = recipes.filter(r => {
    const catOk = activeCat === 'Todas' || r.categoria === activeCat;
    const qOk = !search || r.nombre.toLowerCase().includes(search.toLowerCase()) || r.ingredientes.toLowerCase().includes(search.toLowerCase());
    return catOk && qOk;
  });

  async function callAI(messages, system) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system })
    });
    const data = await res.json();
    return data.content?.map(b => b.text || '').join('') || 'Sin respuesta.';
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
        `Sos el chef de Guiso, app de recetas saludables. Recetario:\n${buildContext()}\nRespondé en español, de forma práctica.`
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
      const messages = newHistory.filter(m => m.role !== 'bot' || newHistory.indexOf(m) > 0)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
        .filter(m => m.role === 'user' || m.role === 'assistant');
      const reply = await callAI(messages, `Sos el chef de Guiso. Recetario:\n${buildContext()}\nRespondé en español, cálido y práctico.`);
      setChatHistory([...newHistory, { role: 'bot', text: reply }]);
    } catch { setChatHistory([...newHistory, { role: 'bot', text: 'Error al conectar.' }]); }
    setAiLoading(false);
  }

  const s = {
    app: { maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui, sans-serif', paddingBottom: 32 },
    header: { padding: '20px 20px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 },
    logo: { width: 30, height: 30, borderRadius: '50%', background: '#C1440E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 },
    h1: { fontSize: 18, fontWeight: 600, margin: 0, color: '#1a1a1a' },
    sub: { fontSize: 12, color: '#888', margin: '2px 0 0' },
    tabs: { display: 'flex', borderBottom: '1px solid #eee' },
    tab: (active) => ({ flex: 1, padding: '10px 4px', background: 'none', border: 'none', borderBottom: active ? '2px solid #C1440E' : '2px solid transparent', color: active ? '#C1440E' : '#888', fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400 }),
    panel: { padding: '16px 20px' },
    searchBox: { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
    filters: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
    chip: (active) => ({ padding: '3px 11px', borderRadius: 999, border: '1px solid', borderColor: active ? '#C1440E' : '#ddd', background: active ? '#C1440E' : 'none', color: active ? '#fff' : '#666', fontSize: 12, cursor: 'pointer' }),
    count: { fontSize: 12, color: '#999', marginBottom: 10 },
    row: { background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
    rowCat: { fontSize: 11, padding: '2px 7px', borderRadius: 999, background: '#f5f5f5', color: '#666', whiteSpace: 'nowrap' },
    rowName: { fontSize: 14, color: '#1a1a1a', flex: 1 },
    backBtn: { display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontSize: 13, color: '#888', cursor: 'pointer', marginBottom: 14, padding: 0 },
    detailName: { fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 },
    detailCat: { fontSize: 12, color: '#999', marginBottom: 16 },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
    sectionBox: { background: '#fafafa', borderRadius: 8, padding: '12px 14px', marginBottom: 12 },
    ingChip: { display: 'inline-block', fontSize: 13, padding: '3px 10px', borderRadius: 999, background: '#fff', border: '1px solid #eee', color: '#333', margin: 3 },
    prepText: { fontSize: 14, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
    textarea: { width: '100%', minHeight: 80, padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'system-ui' },
    btn: (disabled) => ({ width: '100%', marginTop: 9, padding: '10px', background: disabled ? '#e0c4bb' : '#C1440E', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' }),
    aiBox: { marginTop: 14, background: '#fdf6f4', borderRadius: 8, padding: 14, fontSize: 14, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap', borderLeft: '3px solid #C1440E' },
    chatWrap: { display: 'flex', flexDirection: 'column', gap: 8, minHeight: 180, maxHeight: 320, overflowY: 'auto', marginBottom: 12 },
    msgUser: { alignSelf: 'flex-end', maxWidth: '85%', padding: '8px 12px', background: '#C1440E', color: '#fff', borderRadius: '14px 14px 3px 14px', fontSize: 14, lineHeight: 1.6 },
    msgBot: { alignSelf: 'flex-start', maxWidth: '85%', padding: '8px 12px', background: '#f5f5f5', color: '#333', borderRadius: '14px 14px 14px 3px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
    chatRow: { display: 'flex', gap: 7 },
    chatInput: { flex: 1, height: 38, padding: '0 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'system-ui' },
    sendBtn: (disabled) => ({ width: 38, height: 38, borderRadius: 8, background: disabled ? '#e0c4bb' : '#C1440E', border: 'none', color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 16 }),
  };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>G</div>
        <div>
          <h1 style={s.h1}>Guiso</h1>
          <p style={s.sub}>{loading ? 'Cargando recetas...' : `${recipes.length} recetas`}</p>
        </div>
      </div>

      <div style={s.tabs}>
        {['explorar','ingredientes','chef'].map(t => (
          <button key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
            {t === 'explorar' ? 'Explorar' : t === 'ingredientes' ? 'Mis ingredientes' : 'Chef IA'}
          </button>
        ))}
      </div>

      {activeTab === 'explorar' && (
        <div style={s.panel}>
          {selected ? (
            <>
              <button style={s.backBtn} onClick={() => setSelected(null)}>← Volver</button>
              <div style={s.detailName}>{selected.nombre}</div>
              <div style={s.detailCat}>{selected.categoria}</div>
              {selected.ingredientes && (
                <div style={s.sectionBox}>
                  <div style={s.sectionLabel}>Ingredientes</div>
                  <div>{selected.ingredientes.split(',').map((i, idx) => <span key={idx} style={s.ingChip}>{i.trim()}</span>)}</div>
                </div>
              )}
              {selected.preparacion && (
                <div style={s.sectionBox}>
                  <div style={s.sectionLabel}>Preparación</div>
                  <p style={s.prepText}>{selected.preparacion}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <input style={s.searchBox} placeholder="Buscar receta o ingrediente..." value={search} onChange={e => setSearch(e.target.value)} />
              <div style={s.filters}>
                {categories.map(c => <button key={c} style={s.chip(activeCat === c)} onClick={() => setActiveCat(c)}>{c}</button>)}
              </div>
              <div style={s.count}>{filtered.length} recetas</div>
              {filtered.map((r, i) => (
                <div key={i} style={s.row} onClick={() => setSelected(r)}>
                  <span style={s.rowCat}>{r.categoria}</span>
                  <span style={s.rowName}>{r.nombre}</span>
                  <span style={{ color: '#ccc', fontSize: 12 }}>›</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'ingredientes' && (
        <div style={s.panel}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12, lineHeight: 1.6 }}>Escribí lo que tenés en casa y te sugiero qué cocinar.</p>
          <textarea style={s.textarea} placeholder="ej: pollo, zucchini, huevo, cebolla..." value={ingInput} onChange={e => setIngInput(e.target.value)} />
          <button style={s.btn(aiLoading || !ingInput.trim())} onClick={getRecommendation} disabled={aiLoading || !ingInput.trim()}>
            {aiLoading ? 'Consultando...' : 'Ver qué puedo cocinar'}
          </button>
          {aiResult && <div style={s.aiBox}>{aiResult}</div>}
        </div>
      )}

      {activeTab === 'chef' && (
        <div style={s.panel}>
          <div style={s.chatWrap}>
            {chatHistory.map((m, i) => <div key={i} style={m.role === 'user' ? s.msgUser : s.msgBot}>{m.text}</div>)}
            {aiLoading && <div style={s.msgBot}>...</div>}
          </div>
          <div style={s.chatRow}>
            <input style={s.chatInput} placeholder="Preguntá al chef..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
            <button style={s.sendBtn(aiLoading)} onClick={sendChat} disabled={aiLoading}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}