/* Tarefas, trabalhos, relatórios de laboratório e provas — com prazos. */
(function (BP) {
  'use strict';
  const { U, Models, UI, Shared, Forms } = BP;
  const { esc } = U;

  const filters = { status: 'pendentes', type: '', disc: '' };

  BP.views.tarefas = {
    title: 'Tarefas',
    render(state) {
      const today = U.today();
      let items = state.tasks.filter((t) =>
        (filters.status === 'todas' || (filters.status === 'pendentes' ? !t.done : t.done)) &&
        (!filters.type || t.type === filters.type) && (!filters.disc || t.disciplineId === filters.disc));
      const byDue = (a, b) => (a.due || '9999').localeCompare(b.due || '9999');
      items = items.sort(byDue);

      const groups = [
        ['Atrasadas', items.filter((t) => !t.done && t.due && t.due < today)],
        ['Esta semana', items.filter((t) => !t.done && t.due && t.due >= today && U.daysUntil(t.due) <= 7)],
        ['Mais adiante', items.filter((t) => !t.done && t.due && U.daysUntil(t.due) > 7)],
        ['Sem prazo', items.filter((t) => !t.done && !t.due)],
        ['Concluídas', items.filter((t) => t.done).reverse()],
      ].filter(([, g]) => g.length);

      const opt = (v, l, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`;
      return `
        ${Shared.pageHead('Tarefas <em>& prazos</em>', 'Trabalhos, relatórios de laboratório, seminários e provas em um lugar só.', `<button class="btn primary" data-action="newTask">${UI.icon('plus')} Nova tarefa</button>`)}
        <div class="filters">
          <select name="status" data-change="filter" aria-label="Situação">${opt('pendentes', 'Pendentes', filters.status)}${opt('concluidas', 'Concluídas', filters.status)}${opt('todas', 'Todas', filters.status)}</select>
          <select name="type" data-change="filter" aria-label="Tipo">${opt('', 'Todos os tipos', filters.type)}${Models.TASK_TYPES.map((t) => opt(t, t, filters.type)).join('')}</select>
          <select name="disc" data-change="filter" aria-label="Disciplina">${opt('', 'Todas as disciplinas', filters.disc)}${state.disciplines.map((d) => opt(d.id, d.name, filters.disc)).join('')}</select>
        </div>
        ${groups.length
          ? groups.map(([label, g]) => `<div class="group-label">${label} · ${g.length}</div><ul class="list">${g.map((t) => Shared.taskRow(state, t)).join('')}</ul>`).join('')
          : UI.empty('Nenhuma tarefa nesse filtro.', '<br><button class="btn" data-action="newTask">Adicionar tarefa</button>')}`;
    },
    actions: {
      filter(el) { filters[el.name] = el.value; BP.render(); },
    },
  };
})(window.BP);
