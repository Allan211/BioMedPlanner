/* Componentes de UI reutilizáveis: modal, formulário genérico, confirmação, toast, chips, barras. */
(function (BP) {
  'use strict';
  const { U } = BP;
  const { esc } = U;

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const chip = (text, tone = '') => `<span class="chip ${tone}">${esc(text)}</span>`;
  const bar = (pct, mod = '') => `<div class="bar ${pct >= 100 ? 'full' : ''} ${mod}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${U.clamp(pct, 0, 100)}"><i style="width:${U.clamp(pct, 0, 100)}%"></i></div>`;
  const empty = (msg, actionHtml = '') => `<div class="empty"><p>${msg}</p>${actionHtml}</div>`;

  /* ---------- Modal ---------- */
  function modal({ title, html, wide = false }) {
    const root = document.getElementById('modal-root');
    const previous = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><h2 id="modal-title">${esc(title)}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Fechar">×</button></header>
        <div class="modal-body">${html}</div>
      </div>`;
    root.appendChild(wrap);
    document.body.classList.add('no-scroll');

    function close() {
      document.removeEventListener('keydown', onKey);
      wrap.remove();
      if (!root.children.length) document.body.classList.remove('no-scroll');
      if (previous && previous.focus && document.contains(previous)) previous.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape' && root.lastElementChild === wrap) close();
      if (e.key === 'Tab') { // prende o foco dentro do modal
        const f = [...wrap.querySelectorAll('button, input, select, textarea, a[href]')].filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    const first = wrap.querySelector('input:not([type=hidden]), select, textarea, button.primary');
    if (first) first.focus();
    return { el: wrap.querySelector('.modal-body'), close };
  }

  /* ---------- Formulário genérico baseado em descrição de campos ---------- */
  function fieldHtml(f, value) {
    const id = `f_${f.name}`;
    const v = value ?? '';
    const req = f.required ? 'required' : '';
    let ctl;
    if (f.type === 'select') {
      ctl = `<select id="${id}" name="${f.name}" ${req}>${f.options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      ctl = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(v)}</textarea>`;
    } else {
      const attrs = ['min', 'max', 'step', 'maxlength'].filter((a) => f[a] != null).map((a) => `${a}="${f[a]}"`).join(' ');
      ctl = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${attrs} ${req} ${f.type === 'number' && !f.step ? 'step="any"' : ''}>`;
    }
    return `<div class="field ${f.full ? 'full' : ''}"><label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>${ctl}${f.hint ? `<p class="hint">${esc(f.hint)}</p>` : ''}</div>`;
  }

  function form({ title, fields, values = {}, submitLabel = 'Salvar', onSubmit, onDelete, wide = false }) {
    const html = `
      <form class="form-grid" autocomplete="off">
        ${fields.map((f) => fieldHtml(f, values[f.name])).join('')}
        <div class="form-actions full">
          ${onDelete ? '<button type="button" class="btn danger" data-delete>Excluir</button>' : ''}
          <span class="spacer"></span>
          <button type="button" class="btn ghost" data-close-form>Cancelar</button>
          <button type="submit" class="btn primary">${esc(submitLabel)}</button>
        </div>
      </form>`;
    const m = modal({ title, html, wide });
    const formEl = m.el.querySelector('form');
    m.el.querySelector('[data-close-form]').addEventListener('click', m.close);
    if (onDelete) m.el.querySelector('[data-delete]').addEventListener('click', async () => { if (await confirmBox('Excluir este item? Essa ação não pode ser desfeita.')) { onDelete(); m.close(); } });
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const out = {};
      for (const f of fields) {
        const raw = formEl.elements[f.name].value;
        out[f.name] = f.type === 'number' ? (raw === '' ? null : Number(String(raw).replace(',', '.'))) : raw.trim();
      }
      if (onSubmit(out) !== false) m.close();
    });
    return m;
  }

  function confirmBox(message, { okLabel = 'Confirmar' } = {}) {
    return new Promise((resolve) => {
      const m = modal({ title: 'Confirmação', html: `<p>${esc(message)}</p><div class="form-actions"><button class="btn ghost" data-no>Cancelar</button><button class="btn primary" data-yes>${esc(okLabel)}</button></div>` });
      m.el.querySelector('[data-no]').addEventListener('click', () => { m.close(); resolve(false); });
      m.el.querySelector('[data-yes]').addEventListener('click', () => { m.close(); resolve(true); });
      m.el.querySelector('[data-yes]').focus();
    });
  }

  function toast(msg) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  BP.UI = { icon, chip, bar, empty, modal, form, confirm: confirmBox, toast };
})(window.BP);
