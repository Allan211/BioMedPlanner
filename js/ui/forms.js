/* Formulários de cada entidade. Conectam UI.form ↔ Store. */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI } = BP;

  const disciplineOptions = (state, blankLabel = '— Sem disciplina —') => [
    { value: '', label: blankLabel },
    ...state.disciplines.map((d) => ({ value: d.id, label: d.name })),
  ];

  const Forms = {
    discipline(d) {
      const state = Store.get();
      const edit = !!d;
      UI.form({
        title: edit ? 'Editar disciplina' : 'Nova disciplina',
        values: d || { workload: 60, absencePct: state.settings.absencePct },
        fields: [
          { name: 'name', label: 'Nome da disciplina', required: true, full: true, maxlength: 80 },
          { name: 'professor', label: 'Professor(a)' },
          { name: 'email', label: 'E-mail de contato', type: 'email' },
          { name: 'workload', label: 'Carga horária (h)', type: 'number', min: 0 },
          { name: 'absencePct', label: 'Limite de faltas (%)', type: 'number', min: 0, max: 100 },
          { name: 'criteria', label: 'Critérios de aprovação', type: 'textarea', full: true, placeholder: 'Ex.: média 7,0; exame final com mínimo 5,0' },
          { name: 'links', label: 'Links importantes (um por linha)', type: 'textarea', full: true, placeholder: 'https://…' },
        ],
        onSubmit(v) {
          Store.mutate((s) => {
            if (edit) Object.assign(s.disciplines.find((x) => x.id === d.id), v);
            else s.disciplines.push(Models.newDiscipline(v, s.disciplines.length));
          });
          UI.toast(edit ? 'Disciplina atualizada' : 'Disciplina criada');
        },
        onDelete: edit ? () => { Store.actions.removeDiscipline(d.id); if (location.hash.includes(d.id)) location.hash = '#/disciplinas'; UI.toast('Disciplina excluída'); } : null,
      });
    },

    /** Adiciona vários tópicos de uma vez (um por linha) — ótimo para colar a ementa. */
    topics(disciplineId) {
      const state = Store.get();
      if (!state.disciplines.length) { UI.toast('Crie uma disciplina primeiro'); return; }
      UI.form({
        title: 'Adicionar tópicos da ementa',
        values: { disciplineId: disciplineId || state.disciplines[0].id },
        fields: [
          { name: 'disciplineId', label: 'Disciplina', type: 'select', options: disciplineOptions(state).slice(1), full: true },
          { name: 'group', label: 'Grupo / unidade', required: true, placeholder: 'Ex.: Metabolismo', full: true },
          { name: 'items', label: 'Tópicos (um por linha)', type: 'textarea', rows: 6, required: true, full: true, placeholder: 'Glicólise\nCiclo de Krebs\nCadeia respiratória' },
        ],
        onSubmit(v) {
          const lines = U.lines(v.items);
          Store.mutate((s) => { const d = s.disciplines.find((x) => x.id === v.disciplineId); lines.forEach((l) => d.topics.push(Models.newTopic(v.group, l))); });
          UI.toast(`${lines.length} tópico(s) adicionados`);
        },
      });
    },

    topic(topicId) {
      const f = Store.findTopic(topicId); if (!f) return;
      UI.form({
        title: 'Editar tópico', values: { title: f.topic.title, group: f.topic.group },
        fields: [{ name: 'title', label: 'Tópico', required: true, full: true }, { name: 'group', label: 'Grupo / unidade', required: true, full: true }],
        onSubmit(v) { Store.mutate(() => { f.topic.title = v.title; f.topic.group = v.group; }); },
        onDelete() { Store.mutate(() => { f.discipline.topics = f.discipline.topics.filter((t) => t.id !== topicId); }); },
      });
    },

    block(block, preset = {}) {
      const state = Store.get();
      const edit = !!(block && block.id);
      UI.form({
        title: edit ? 'Editar bloco' : 'Novo bloco no cronograma',
        values: block || { day: 0, start: '08:00', end: '10:00', type: 'aula', ...preset },
        fields: [
          { name: 'type', label: 'Tipo', type: 'select', options: Models.BLOCK_TYPES },
          { name: 'disciplineId', label: 'Disciplina', type: 'select', options: disciplineOptions(state) },
          { name: 'day', label: 'Dia', type: 'select', options: U.DAYS.map((d, i) => ({ value: i, label: d })) },
          { name: 'room', label: 'Sala / local' },
          { name: 'start', label: 'Início', type: 'time', required: true },
          { name: 'end', label: 'Fim', type: 'time', required: true },
          { name: 'title', label: 'Título (opcional)', full: true, placeholder: 'Se vazio, usa o nome da disciplina' },
        ],
        onSubmit(v) {
          if (U.toMinutes(v.end) <= U.toMinutes(v.start)) { UI.toast('O horário final deve ser depois do início'); return false; }
          Store.upsert('schedule', { ...(block || {}), ...v, day: Number(v.day) });
        },
        onDelete: edit ? () => Store.remove('schedule', block.id) : null,
      });
    },

    task(task, preset = {}) {
      const state = Store.get();
      const edit = !!(task && task.id);
      UI.form({
        title: edit ? 'Editar tarefa' : 'Nova tarefa / prazo',
        values: task || { type: 'Tarefa', priority: 'media', due: U.addDays(U.today(), 7), ...preset },
        fields: [
          { name: 'title', label: 'Título', required: true, full: true },
          { name: 'type', label: 'Tipo', type: 'select', options: Models.TASK_TYPES.map((t) => ({ value: t, label: t })) },
          { name: 'disciplineId', label: 'Disciplina', type: 'select', options: disciplineOptions(state) },
          { name: 'due', label: 'Prazo', type: 'date' },
          { name: 'priority', label: 'Prioridade', type: 'select', options: Models.PRIORITIES },
          { name: 'notes', label: 'Observações', type: 'textarea', full: true },
        ],
        onSubmit(v) { Store.upsert('tasks', { done: false, ...(task || {}), ...v }); UI.toast('Tarefa salva'); },
        onDelete: edit ? () => Store.remove('tasks', task.id) : null,
      });
    },

    grade(grade, disciplineId) {
      const state = Store.get();
      const edit = !!(grade && grade.id);
      UI.form({
        title: edit ? 'Editar avaliação' : 'Nova avaliação',
        values: grade || { disciplineId, weight: 30 },
        fields: [
          { name: 'disciplineId', label: 'Disciplina', type: 'select', options: disciplineOptions(state).slice(1), full: true },
          { name: 'name', label: 'Avaliação', required: true, placeholder: 'P1, Relatório, Seminário…' },
          { name: 'weight', label: 'Peso na média (%)', type: 'number', min: 0, max: 100, required: true },
          { name: 'grade', label: 'Nota (0–10)', type: 'number', min: 0, max: 10, full: true, hint: 'Deixe em branco se a avaliação ainda não aconteceu.' },
        ],
        onSubmit(v) {
          const total = state.grades.filter((g) => g.disciplineId === v.disciplineId && g.id !== (grade && grade.id)).reduce((a, g) => a + (g.weight || 0), 0) + v.weight;
          if (total > 100.01) UI.toast(`Atenção: os pesos somam ${U.fmtNum(total, 0)}%`);
          Store.upsert('grades', { ...(grade || {}), ...v });
        },
        onDelete: edit ? () => Store.remove('grades', grade.id) : null,
      });
    },

    hours(entry) {
      const edit = !!(entry && entry.id);
      UI.form({
        title: edit ? 'Editar registro' : 'Registrar horas',
        values: entry || { date: U.today(), category: Models.HOUR_CATEGORIES[0] },
        fields: [
          { name: 'title', label: 'Descrição', required: true, full: true, placeholder: 'Ex.: Monitoria de Bioquímica' },
          { name: 'category', label: 'Categoria', type: 'select', options: Models.HOUR_CATEGORIES.map((c) => ({ value: c, label: c })) },
          { name: 'date', label: 'Data', type: 'date', required: true },
          { name: 'hours', label: 'Horas', type: 'number', min: 0, required: true, full: true },
        ],
        onSubmit(v) { Store.upsert('hours', { ...(entry || {}), ...v }); UI.toast('Horas registradas'); },
        onDelete: edit ? () => Store.remove('hours', entry.id) : null,
      });
    },

    settings() {
      const st = Store.get().settings;
      UI.form({
        title: 'Regras da sua universidade', values: st,
        fields: [
          { name: 'passMark', label: 'Média para aprovação direta', type: 'number', min: 0, max: 10 },
          { name: 'examFloor', label: 'Média mínima para fazer exame', type: 'number', min: 0, max: 10 },
          { name: 'examPass', label: 'Média final após o exame', type: 'number', min: 0, max: 10, hint: 'Usada no cálculo da nota necessária no exame: (média + exame) / 2.' },
          { name: 'absencePct', label: 'Limite de faltas padrão (%)', type: 'number', min: 0, max: 100 },
          { name: 'goalComplementar', label: 'Meta de horas complementares', type: 'number', min: 0 },
          { name: 'goalEstagio', label: 'Meta de horas de estágio', type: 'number', min: 0 },
        ],
        onSubmit(v) { Store.mutate((s) => { for (const k in v) if (v[k] != null) s.settings[k] = v[k]; }); UI.toast('Regras atualizadas'); },
      });
    },

    habit() {
      UI.form({
        title: 'Novo hábito', fields: [{ name: 'name', label: 'Nome do hábito', required: true, full: true, maxlength: 40 }],
        onSubmit(v) { Store.mutate((s) => s.habits.push({ id: U.uid('h'), name: v.name })); },
      });
    },
  };

  BP.Forms = Forms;
})(window.BP);
