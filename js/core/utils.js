/* Utilitários puros (sem dependência de estado ou DOM). Namespace global: BP */
window.BP = window.BP || { views: {}, globalActions: {} };

(function (BP) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');

  const U = {
    DAYS: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    DAYS_SHORT: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],

    uid: (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`,

    /** Escapa HTML — TODO conteúdo vindo do usuário passa por aqui antes de ir para innerHTML. */
    esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),

    pad,
    toISO: (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    parse: (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); },
    today: () => U.toISO(new Date()),
    addDays: (iso, n) => { const d = U.parse(iso); d.setDate(d.getDate() + n); return U.toISO(d); },
    daysUntil: (iso) => Math.round((U.parse(iso) - U.parse(U.today())) / 864e5),
    weekStart: (iso) => { const d = U.parse(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return U.toISO(d); },
    /** 0 = segunda … 6 = domingo */
    dow: (date = new Date()) => (date.getDay() + 6) % 7,

    fmtDate: (iso) => iso ? U.parse(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '',
    fmtDateLong: (iso) => U.parse(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
    rel: (iso) => {
      const d = U.daysUntil(iso);
      if (d === 0) return 'hoje';
      if (d === 1) return 'amanhã';
      if (d === -1) return 'ontem';
      return d > 0 ? `em ${d} dias` : `há ${-d} dias`;
    },

    fmtNum: (n, digits = 1) => (n == null || Number.isNaN(n)) ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: digits }),
    pct: (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0),
    clamp: (n, min, max) => Math.min(max, Math.max(min, n)),

    toMinutes: (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; },

    /** Só deixa passar URLs http(s). */
    safeUrl: (raw) => {
      try { const u = new URL(raw.trim()); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; }
    },
    lines: (text) => String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
  };

  BP.U = U;
})(window.BP);
