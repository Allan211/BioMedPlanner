/* Horas complementares e estágio. */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI, Shared, Forms } = BP;
  const { esc } = U;

  function goalCard(label, done, goal) {
    const pct = U.pct(done, goal);
    return `<div class="card"><div class="card-head"><h2>${label}</h2><span class="meta">${pct}%</span></div>
      <p style="font-family:var(--font-display);font-size:34px;line-height:1">${U.fmtNum(done, 1)}<small class="muted"> / ${U.fmtNum(goal, 0)} h</small></p>
      <div style="margin:12px 0 6px">${UI.bar(pct, 'lg')}</div>
      <p class="meta">${done >= goal ? 'Meta cumprida!' : `faltam ${U.fmtNum(goal - done, 1)} h`}</p></div>`;
  }

  BP.views.complementares = {
    title: 'Horas',
    render(state) {
      const totals = Models.Calc.hoursTotals(state);
      const sorted = [...state.hours].sort((a, b) => b.date.localeCompare(a.date));
      const byCat = Models.HOUR_CATEGORIES.map((c) => [c, state.hours.filter((h) => h.category === c).reduce((a, h) => a + (h.hours || 0), 0)]).filter(([, v]) => v > 0);
      return `
        ${Shared.pageHead('Horas <em>complementares & estágio</em>', 'Acompanhe o que falta para cumprir as exigências do curso.', `<button class="btn primary" data-action="newHours">${UI.icon('plus')} Registrar horas</button><button class="btn ghost" data-action="settings">Metas</button>`)}
        <div class="grid cols-2" style="margin-bottom:24px">
          ${goalCard('Atividades complementares', totals.complementar, state.settings.goalComplementar)}
          ${goalCard('Estágio', totals.estagio, state.settings.goalEstagio)}
        </div>
        ${byCat.length ? `<p class="meta" style="margin-bottom:18px">${byCat.map(([c, v]) => `${esc(c)}: ${U.fmtNum(v, 1)}h`).join(' · ')}</p>` : ''}
        <div class="section-title"><h2>Registros</h2></div>
        ${sorted.length ? `<ul class="list">${sorted.map((h) => `
          <li class="row"><div class="grow"><div class="title">${esc(h.title)}</div><div class="chips">${UI.chip(h.category, h.category === 'Estágio' ? 'rose' : 'peach')}<span class="meta">${U.fmtDate(h.date)}</span></div></div>
          <strong>${U.fmtNum(h.hours, 1)} h</strong>
          <button class="icon-btn" data-action="editHours" data-id="${h.id}" aria-label="Editar ${esc(h.title)}">${UI.icon('edit')}</button></li>`).join('')}</ul>`
          : UI.empty('Nenhum registro ainda.')}`;
    },
    actions: {
      newHours: () => Forms.hours(null),
      editHours: (el) => Forms.hours(Store.get().hours.find((h) => h.id === el.dataset.id)),
      settings: () => Forms.settings(),
    },
  };
})(window.BP);
