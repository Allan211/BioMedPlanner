/* Painel: visão geral do dia e do semestre. */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI, Shared, Forms, Storage } = BP;
  const { esc } = U;
  const { Calc } = Models;

  BP.views.painel = {
    title: 'Painel',
    render(state) {
      const today = U.today();
      const dow = U.dow();
      const pending = state.tasks.filter((t) => !t.done);
      const overdue = pending.filter((t) => t.due && t.due < today);
      const todayTasks = pending.filter((t) => t.due === today);
      const upcoming = pending.filter((t) => t.due && t.due > today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
      const classes = state.schedule.filter((b) => b.day === dow).sort((a, b) => a.start.localeCompare(b.start));
      const reviews = Calc.reviewsDue(state);
      const hours = Calc.hoursTotals(state);
      const avg = Calc.overallAverage(state);
      const nextDeadline = pending.filter((t) => t.due && t.due >= today).sort((a, b) => a.due.localeCompare(b.due))[0];
      const nowH = new Date().getHours();
      const greet = nowH < 12 ? 'Bom dia' : nowH < 18 ? 'Boa tarde' : 'Boa noite';

      const classHtml = classes.length
        ? classes.map((b) => {
          const d = Shared.disciplineOf(state, b.disciplineId);
          return `<li class="row"><span class="meta">${b.start}–${b.end}</span><div class="grow"><div class="title">${esc(b.title || (d && d.name) || 'Bloco')}</div>${b.room ? `<span class="meta">${esc(b.room)}</span>` : ''}</div>${UI.chip(b.type === 'lab' ? 'Lab' : b.type, b.type === 'aula' ? 'peach' : b.type === 'lab' ? 'rose' : 'pink')}</li>`;
        }).join('')
        : UI.empty('Sem aulas ou blocos de estudo hoje.');

      const todoItems = [...overdue, ...todayTasks];
      const todoHtml = todoItems.length
        ? `<ul class="list">${todoItems.map((t) => Shared.taskRow(state, t)).join('')}</ul>`
        : UI.empty('Nada vencendo hoje. 🎉');

      const reviewHtml = reviews.length
        ? `<ul class="list">${reviews.slice(0, 6).map((r) => `
            <li class="row"><input type="checkbox" data-action="toggleReview" data-id="${r.topic.id}" data-key="${r.step.key}" aria-label="Marcar revisão de ${esc(r.topic.title)}">
              <div class="grow"><div class="title">${esc(r.topic.title)}</div><span class="chip plain">${esc(r.discipline.name)}</span></div>
              ${UI.chip('Revisão ' + r.step.label, 'pink')}</li>`).join('')}</ul>`
        : UI.empty('Nenhuma revisão pendente. As revisões de 24h, 7 e 30 dias aparecem aqui.');

      return `
        ${state.meta.demo ? `<div class="banner" role="status"><span>Você está vendo dados de exemplo.</span><span class="head-actions"><button class="btn sm" data-action="clearDemo">Começar do zero</button><button class="btn sm ghost" data-action="dismissDemo">Manter e ocultar aviso</button></span></div>` : ''}
        ${Shared.pageHead(`${greet}, <em>futura(o) biomédica(o)</em>`, esc(U.fmtDateLong(today)), `<button class="btn primary" data-action="newTask">${UI.icon('plus')} Nova tarefa</button>`)}

        <section class="section grid stats" aria-label="Resumo">
          <div class="stat accent"><b>${pending.length}</b><span>tarefas pendentes${overdue.length ? ` · ${overdue.length} atrasada(s)` : ''}</span></div>
          <div class="stat"><b>${nextDeadline ? U.rel(nextDeadline.due) : '—'}</b><span>${nextDeadline ? esc(nextDeadline.title) : 'nenhum prazo à vista'}</span></div>
          <div class="stat accent-2"><b>${U.fmtNum(avg)}</b><span>média parcial geral</span></div>
          <div class="stat"><b>${U.fmtNum(hours.complementar, 0)}<small>/${state.settings.goalComplementar}h</small></b><span>horas complementares</span></div>
        </section>

        <section class="section">
          <div class="section-title"><h2>Painel de disciplinas</h2><a href="#/disciplinas">ver todas →</a></div>
          ${state.disciplines.length
            ? `<div class="grid cols-3">${state.disciplines.map((d) => Shared.disciplineCard(state, d)).join('')}</div>`
            : UI.empty('Você ainda não cadastrou disciplinas.', '<br><button class="btn" data-action="newDiscipline">Cadastrar primeira disciplina</button>')}
        </section>

        <div class="split">
          <div>
            <section class="section"><div class="section-title"><h2>Hoje</h2></div>
              <div class="group-label">Aulas e blocos</div><ul class="list">${classHtml}</ul>
              <div class="group-label">Para entregar${overdue.length ? ' (inclui atrasadas)' : ''}</div>${todoHtml}
            </section>
          </div>
          <div>
            <section class="section"><div class="section-title"><h2>Próximos prazos</h2><a href="#/tarefas">tudo →</a></div>
              ${upcoming.length ? `<ul class="list">${upcoming.map((t) => Shared.taskRow(state, t, { showEdit: false })).join('')}</ul>` : UI.empty('Sem prazos futuros.')}
            </section>
            <section class="section"><div class="section-title"><h2>Revisões de hoje</h2></div>${reviewHtml}</section>
          </div>
        </div>`;
    },
    actions: {
      newDiscipline: () => Forms.discipline(null),
      async clearDemo() {
        if (!(await UI.confirm('Apagar os dados de exemplo e começar com o planner vazio?', { okLabel: 'Apagar exemplos' }))) return;
        const s = Models.emptyState(); Store.replace(s); UI.toast('Planner vazio — bons estudos!');
      },
      dismissDemo: () => Store.mutate((s) => { s.meta.demo = false; }),
    },
  };
})(window.BP);
