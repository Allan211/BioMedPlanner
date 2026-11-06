/* Disciplinas: lista + ficha da matéria com plano de estudo por tópicos. */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI, Shared, Forms } = BP;
  const { esc } = U;
  const { Calc } = Models;

  function list(state) {
    return `
      ${Shared.pageHead('Disciplinas', 'Cada matéria com sua ficha, ementa em tópicos e progresso.', `<button class="btn primary" data-action="newDiscipline">${UI.icon('plus')} Nova disciplina</button>`)}
      ${state.disciplines.length
        ? `<div class="grid cols-3">${state.disciplines.map((d) => Shared.disciplineCard(state, d)).join('')}</div>`
        : UI.empty('Nenhuma disciplina cadastrada ainda.', '<br><button class="btn" data-action="newDiscipline">Cadastrar disciplina</button>')}`;
  }

  function detail(state, d) {
    const st = Calc.topicStats(d);
    const status = Calc.disciplineStatus(d);
    const gs = Calc.gradeSummary(state, d.id);
    const ab = Calc.absenceInfo(d);
    const groups = [];
    d.topics.forEach((t) => {
      let g = groups.find((x) => x.name === t.group);
      if (!g) { g = { name: t.group, items: [] }; groups.push(g); }
      g.items.push(t);
    });
    const links = U.lines(d.links).map((l) => { const u = U.safeUrl(l); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${UI.icon('link')} ${esc(new URL(u).hostname)}</a>` : ''; }).filter(Boolean);

    const plan = groups.length ? `<div class="plan">${groups.map((g) => {
      const done = g.items.filter((t) => t.status === 'done').length;
      return `<div class="plan-col"><h3><span>${esc(g.name)}</span><span class="meta">${done}/${g.items.length}</span></h3>
        ${UI.bar(U.pct(done, g.items.length))}
        <div style="margin-top:8px">${g.items.map((t) => `
          <div class="topic ${t.status === 'done' ? 'done' : ''}">
            <input type="checkbox" id="tp_${t.id}" ${t.status === 'done' ? 'checked' : ''} data-action="toggleTopic" data-id="${t.id}">
            <label for="tp_${t.id}">${esc(t.title)}${t.status === 'doing' ? ' <span class="chip peach">estudando</span>' : ''}</label>
            <button class="icon-btn" data-action="editTopic" data-id="${t.id}" aria-label="Editar ${esc(t.title)}">${UI.icon('edit')}</button>
          </div>`).join('')}</div></div>`;
    }).join('')}</div>` : UI.empty('Nenhum tópico ainda. Cole a ementa da matéria para transformar em metas pequenas.', `<br><button class="btn" data-action="addTopics" data-id="${d.id}">Adicionar tópicos</button>`);

    return `
      <p class="eyebrow"><a href="#/disciplinas">← Disciplinas</a></p>
      ${Shared.pageHead(esc(d.name), d.professor ? `Prof(a): ${esc(d.professor)}` : '', `
        <button class="btn" data-action="addTopics" data-id="${d.id}">${UI.icon('plus')} Tópicos</button>
        <button class="btn ghost" data-action="editDiscipline" data-id="${d.id}">${UI.icon('edit')} Editar ficha</button>`)}

      <section class="section grid stats">
        <div class="stat accent"><b>${st.pct}%</b><span>${st.done} de ${st.total} tópicos · ${esc(status.label)}</span></div>
        <div class="stat"><b>${U.fmtNum(gs.partial)}</b><span>média parcial · ${esc(gs.status)}</span></div>
        <div class="stat accent-2"><b>${ab.used}<small>/${ab.allowed}h</small></b><span>faltas (limite ${d.absencePct}% de ${d.workload}h)</span></div>
      </section>

      <section class="section">
        <div class="section-title"><h2>Plano de estudo</h2></div>${plan}
      </section>

      <section class="card">
        <div class="card-head"><h2>Ficha da matéria</h2></div>
        <dl style="margin:0;display:grid;grid-template-columns:max-content 1fr;gap:8px 18px">
          <dt class="meta">Professor(a)</dt><dd style="margin:0">${esc(d.professor) || '—'}</dd>
          <dt class="meta">E-mail</dt><dd style="margin:0">${d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : '—'}</dd>
          <dt class="meta">Carga horária</dt><dd style="margin:0">${d.workload ? d.workload + ' h' : '—'}</dd>
          <dt class="meta">Aprovação</dt><dd style="margin:0">${esc(d.criteria) || '—'}</dd>
          <dt class="meta">Links</dt><dd style="margin:0;display:flex;flex-wrap:wrap;gap:12px">${links.join('') || '—'}</dd>
        </dl>
      </section>`;
  }

  BP.views.disciplinas = {
    title: 'Disciplinas',
    render(state, param) {
      const d = param && state.disciplines.find((x) => x.id === param);
      return d ? detail(state, d) : list(state);
    },
    actions: {
      newDiscipline: () => Forms.discipline(null),
      editDiscipline: (el) => Forms.discipline(Store.get().disciplines.find((d) => d.id === el.dataset.id)),
      addTopics: (el) => Forms.topics(el.dataset.id),
      editTopic: (el) => Forms.topic(el.dataset.id),
      toggleTopic: (el) => Store.actions.setTopicStatus(el.dataset.id, el.checked ? 'done' : 'todo'),
    },
  };
})(window.BP);
