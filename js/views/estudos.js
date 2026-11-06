/* Estudos: quadro Kanban de tópicos + revisões espaçadas (24h, 7 e 30 dias). */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI, Shared, Forms } = BP;
  const { esc } = U;
  const { Calc } = Models;

  const COLS = [['todo', 'A fazer'], ['doing', 'Estudando'], ['done', 'Concluído']];
  let filterDisc = '';

  function card(state, d, t) {
    const idx = COLS.findIndex((c) => c[0] === t.status);
    const today = U.today();
    const reviews = t.status === 'done' && t.doneAt ? `<div class="reviews">${Models.REVIEW_STEPS.map((s) => {
      const done = t.reviews && t.reviews[s.key];
      const due = U.addDays(t.doneAt, s.days);
      const isDue = !done && due <= today;
      return `<label class="rev ${done ? 'ok' : isDue ? 'due' : ''}"><input type="checkbox" ${done ? 'checked' : ''} data-action="toggleReview" data-id="${t.id}" data-key="${s.key}"> ${s.label}${done ? '' : ` · ${isDue ? 'agora' : U.fmtDate(due)}`}</label>`;
    }).join('')}</div>` : '';
    return `
      <article class="kcard" draggable="true" data-id="${t.id}">
        <span class="chip ${['pink', 'peach', 'rose', 'plain'][d.tone % 4]}">${esc(d.name)}</span>
        <div class="t">${esc(t.title)}</div>
        <span class="meta">${esc(t.group)}</span>
        ${reviews}
        <div class="foot">
          <button class="icon-btn" data-action="move" data-id="${t.id}" data-dir="-1" aria-label="Mover para a esquerda" ${idx === 0 ? 'disabled style="visibility:hidden"' : ''}>${UI.icon('left')}</button>
          <button class="icon-btn" data-action="editTopic" data-id="${t.id}" aria-label="Editar tópico">${UI.icon('edit')}</button>
          <button class="icon-btn" data-action="move" data-id="${t.id}" data-dir="1" aria-label="Mover para a direita" ${idx === COLS.length - 1 ? 'disabled style="visibility:hidden"' : ''}>${UI.icon('right')}</button>
        </div>
      </article>`;
  }

  BP.views.estudos = {
    title: 'Estudos',
    render(state) {
      const discs = state.disciplines.filter((d) => !filterDisc || d.id === filterDisc);
      const all = discs.flatMap((d) => d.topics.map((t) => ({ d, t })));
      const due = Calc.reviewsDue(state).length;
      const cols = COLS.map(([key, label]) => {
        const items = all.filter((x) => x.t.status === key);
        return `<section class="kcol" data-col="${key}" aria-label="${label}"><h2><span>${label}</span><span class="meta">${items.length}</span></h2>
          ${items.map((x) => card(state, x.d, x.t)).join('') || '<p class="meta">Arraste cartões para cá.</p>'}</section>`;
      }).join('');
      return `
        ${Shared.pageHead('Cronograma <em>de estudos</em>', `Quadro por tópico com revisões espaçadas. ${due ? `<strong>${due} revisão(ões) pendente(s).</strong>` : 'Revisões em dia.'}`,
          `<button class="btn primary" data-action="addTopics">${UI.icon('plus')} Adicionar tópicos</button>`)}
        <div class="filters"><select name="disc" data-change="filter" aria-label="Filtrar por disciplina"><option value="">Todas as disciplinas</option>${state.disciplines.map((d) => `<option value="${d.id}" ${d.id === filterDisc ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
        ${all.length ? `<div class="kanban">${cols}</div>` : UI.empty('Cadastre os tópicos (ementa) das disciplinas para montar seu quadro.', '<br><button class="btn" data-action="addTopics">Adicionar tópicos</button>')}
        <p class="meta" style="margin-top:14px">Ao concluir um tópico, as revisões de 24h, 7 e 30 dias são agendadas automaticamente e aparecem no Painel.</p>`;
    },
    bind(root) {
      let dragId = null;
      root.querySelectorAll('.kcard').forEach((el) => {
        el.addEventListener('dragstart', (e) => { dragId = el.dataset.id; el.classList.add('dragging'); e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
      });
      root.querySelectorAll('.kcol').forEach((col) => {
        col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
        col.addEventListener('dragleave', () => col.classList.remove('over'));
        col.addEventListener('drop', (e) => {
          e.preventDefault(); col.classList.remove('over');
          const id = e.dataTransfer.getData('text/plain') || dragId;
          if (id) Store.actions.setTopicStatus(id, col.dataset.col);
        });
      });
    },
    actions: {
      filter(el) { filterDisc = el.value; BP.render(); },
      addTopics: () => Forms.topics(filterDisc || null),
      editTopic: (el) => Forms.topic(el.dataset.id),
      move(el) {
        const f = Store.findTopic(el.dataset.id); if (!f) return;
        const i = COLS.findIndex((c) => c[0] === f.topic.status) + Number(el.dataset.dir);
        if (COLS[i]) Store.actions.setTopicStatus(f.topic.id, COLS[i][0]);
      },
    },
  };
})(window.BP);
