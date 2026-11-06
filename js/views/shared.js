/* Pedaços de view compartilhados + ações globais (resolvidas quando a view não define a ação). */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI, Forms } = BP;
  const { esc } = U;
  const { Calc } = Models;

  const disciplineOf = (state, id) => state.disciplines.find((d) => d.id === id);

  const Shared = {
    disciplineOf,

    pageHead(title, subtitle = '', actionsHtml = '') {
      return `<header class="page-head"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div><div class="head-actions">${actionsHtml}</div></header>`;
    },

    /** Cartão no estilo "Painel de disciplinas": status, nome, barra e meta. */
    disciplineCard(state, d) {
      const st = Calc.topicStats(d);
      const status = Calc.disciplineStatus(d);
      const exam = Calc.nextExam(state, d.id);
      const gs = Calc.gradeSummary(state, d.id);
      let meta = st.total ? `${st.pct}% · ${st.done} de ${st.total} tópicos` : 'sem tópicos cadastrados';
      if (exam) meta += ` · prova ${U.rel(exam.due)}`;
      else if (status.label === 'Concluído' && gs.partial != null) meta += ` · nota ${U.fmtNum(gs.partial)}`;
      return `
        <button class="dcard" data-action="openDiscipline" data-id="${d.id}">
          ${UI.chip(status.label, status.tone)}
          <span class="dname">${esc(d.name)}</span>
          ${UI.bar(st.pct)}
          <span class="meta">${esc(meta)}</span>
        </button>`;
    },

    dueBadge(task) {
      if (!task.due) return '<span class="due muted">sem prazo</span>';
      if (task.done) return `<span class="due muted">${U.fmtDate(task.due)}</span>`;
      const d = U.daysUntil(task.due);
      const cls = d < 0 ? 'late' : d <= 2 ? 'soon' : '';
      const txt = d < 0 ? `Atrasada · ${U.fmtDate(task.due)}` : `${U.fmtDate(task.due)} · ${U.rel(task.due)}`;
      return `<span class="due ${cls}">${esc(txt)}</span>`;
    },

    taskRow(state, t, { showEdit = true } = {}) {
      const d = disciplineOf(state, t.disciplineId);
      return `
        <li class="row ${t.done ? 'done' : ''}">
          <input type="checkbox" ${t.done ? 'checked' : ''} data-action="toggleTask" data-id="${t.id}" aria-label="Concluir: ${esc(t.title)}">
          <div class="grow">
            <div class="title">${esc(t.title)}</div>
            <div class="chips">
              ${UI.chip(t.type, t.type === 'Prova' ? 'rose' : 'peach')}
              ${d ? `<span class="chip plain">${esc(d.name)}</span>` : ''}
              ${t.priority === 'alta' && !t.done ? UI.chip('Alta prioridade', 'ink') : ''}
            </div>
          </div>
          ${Shared.dueBadge(t)}
          ${showEdit ? `<button class="icon-btn" data-action="editTask" data-id="${t.id}" aria-label="Editar ${esc(t.title)}">${UI.icon('edit')}</button>` : ''}
        </li>`;
    },
  };

  BP.Shared = Shared;

  BP.globalActions = {
    toggleTask: (el) => Store.actions.toggleTask(el.dataset.id),
    editTask: (el) => Forms.task(Store.get().tasks.find((t) => t.id === el.dataset.id)),
    openDiscipline: (el) => { location.hash = `#/disciplinas/${el.dataset.id}`; },
    toggleReview: (el) => Store.actions.toggleReview(el.dataset.id, el.dataset.key),
    newTask: () => Forms.task(null),
  };
})(window.BP);
