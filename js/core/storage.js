/* Camada de persistência. Hoje: LocalStorage. Para trocar por IndexedDB/Supabase,
   basta reimplementar load/save mantendo a mesma interface (ver README). */
(function (BP) {
  'use strict';
  const { Models } = BP;
  const KEY = 'bioplanner:v1';
  let memory = null; // fallback se o navegador bloquear o LocalStorage

  /** Completa chaves ausentes (migração simples) e valida o formato básico. */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.disciplines)) return null;
    const base = Models.emptyState();
    const s = { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) }, meta: { ...base.meta, ...(raw.meta || {}) } };
    for (const k of ['schedule', 'tasks', 'grades', 'hours', 'habits']) if (!Array.isArray(s[k])) s[k] = base[k];
    for (const k of ['habitLog', 'feedback', 'pomodoro']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    s.disciplines = s.disciplines.map((d) => ({ ...Models.newDiscipline({}), ...d, topics: Array.isArray(d.topics) ? d.topics : [] }));
    s.version = Models.SCHEMA_VERSION;
    return s;
  }

  BP.Storage = {
    normalize,
    load() {
      try {
        const txt = localStorage.getItem(KEY);
        return txt ? normalize(JSON.parse(txt)) : null;
      } catch (e) {
        console.warn('[BioPlanner] LocalStorage indisponível; usando memória.', e);
        return memory ? normalize(memory) : null;
      }
    },
    save(state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { memory = JSON.parse(JSON.stringify(state)); console.warn('[BioPlanner] Não foi possível salvar no LocalStorage.', e); }
    },
    exportJSON(state) {
      return JSON.stringify({ app: 'bioplanner', exportedAt: new Date().toISOString(), ...state }, null, 2);
    },
    parseImport(text) {
      try { return normalize(JSON.parse(text)); } catch { return null; }
    },
    clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } memory = null; },
  };
})(window.BP);
