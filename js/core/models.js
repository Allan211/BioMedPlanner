/* Modelos de dados, dados de exemplo e regras de negócio (cálculos). Sem DOM. */
(function (BP) {
  'use strict';
  const { U } = BP;

  const SCHEMA_VERSION = 1;

  const TASK_TYPES = ['Tarefa', 'Trabalho acadêmico', 'Relatório de laboratório', 'Prova', 'Seminário', 'Outro'];
  const BLOCK_TYPES = [{ value: 'aula', label: 'Aula' }, { value: 'estudo', label: 'Estudo' }, { value: 'lab', label: 'Laboratório' }];
  const HOUR_CATEGORIES = ['Atividade complementar', 'Monitoria', 'Iniciação científica', 'Extensão', 'Congresso / evento', 'Estágio'];
  const PRIORITIES = [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Média' }, { value: 'baixa', label: 'Baixa' }];
  const REVIEW_STEPS = [
    { key: 'd1', days: 1, label: '24h' },
    { key: 'd7', days: 7, label: '7 dias' },
    { key: 'd30', days: 30, label: '30 dias' },
  ];
  const TONES = ['pink', 'peach', 'rose', 'plain']; // rotação de cores por disciplina

  const emptyReviews = () => ({ d1: false, d7: false, d30: false });

  function emptyState() {
    return {
      version: SCHEMA_VERSION,
      meta: { demo: false, createdAt: U.today() },
      settings: { passMark: 7, examFloor: 4, examPass: 5, absencePct: 25, goalComplementar: 200, goalEstagio: 300 },
      disciplines: [], schedule: [], tasks: [], grades: [], hours: [],
      habits: [
        { id: 'h1', name: 'Leitura acadêmica' }, { id: 'h2', name: 'Sono (7h+)' },
        { id: 'h3', name: 'Exercício físico' }, { id: 'h4', name: 'Revisão do dia' },
      ],
      habitLog: {},   // { 'YYYY-MM-DD': [habitId, ...] }
      feedback: {},   // { 'YYYY-MM-DD(segunda)': { good, late, adjust } }
      pomodoro: {},   // { 'YYYY-MM-DD': sessões concluídas }
    };
  }

  /* ---------- Fábricas ---------- */
  const newDiscipline = (v, index = 0) => ({
    id: U.uid('d'), name: '', professor: '', email: '', workload: 60, absencePct: 25,
    absences: 0, criteria: '', links: '', tone: index % TONES.length, topics: [], ...v,
  });
  const newTopic = (group, title, status = 'todo') => ({
    id: U.uid('t'), group: group || 'Geral', title, status,
    doneAt: status === 'done' ? U.today() : null, reviews: emptyReviews(),
  });

  /* ---------- Dados de exemplo (Biomedicina) ---------- */
  function demoState() {
    const s = emptyState();
    s.meta.demo = true;
    const t = U.today();
    const mk = (name, professor, groups, tone, extra = {}) => newDiscipline({
      name, professor, tone, email: '', criteria: 'Média ≥ 7,0 aprova direto; entre 4,0 e 6,9 faz exame final.',
      topics: groups.flatMap(([g, items]) => items.map(([title, st]) => newTopic(g, title, st))), ...extra,
    });

    const bioq = mk('Bioquímica', 'Profa. Helena Costa', [
      ['Aminoácidos e proteínas', [['Estrutura dos aminoácidos', 'done'], ['Níveis estruturais', 'done'], ['Enzimas e cinética', 'doing']]],
      ['Metabolismo', [['Glicólise', 'done'], ['Ciclo de Krebs', 'todo'], ['Cadeia respiratória', 'todo']]],
    ], 0, { workload: 90, absences: 4, links: 'https://pubchem.ncbi.nlm.nih.gov' });
    const hema = mk('Hematologia', 'Prof. Rafael Nogueira', [
      ['Hemograma', [['Eritrograma', 'done'], ['Leucograma', 'doing'], ['Plaquetas', 'todo']]],
      ['Anemias', [['Anemia ferropriva', 'todo'], ['Anemias megaloblásticas', 'todo']]],
    ], 1, { workload: 60, absences: 2 });
    const imun = mk('Imunologia', 'Profa. Marina Duarte', [
      ['Imunidade inata', [['Sistema complemento', 'done'], ['Fagocitose', 'done']]],
      ['Imunidade adaptativa', [['Linfócitos T', 'doing'], ['Linfócitos B', 'todo'], ['Anticorpos', 'todo']]],
    ], 2, { workload: 60, absences: 6 });
    const gene = mk('Genética', 'Prof. Caio Mendes', [
      ['Herança', [['Leis de Mendel', 'done'], ['Heredogramas', 'done']]],
      ['Genética molecular', [['Replicação', 'doing'], ['Transcrição', 'todo'], ['Tradução', 'todo']]],
    ], 3, { workload: 60, absences: 0 });
    const micro = mk('Microbiologia', 'Profa. Luísa Prado', [
      ['Bactérias', [['Morfologia e Gram', 'done'], ['Meios de cultura', 'todo']]],
      ['Fungos e vírus', [['Micologia clínica', 'todo'], ['Virologia básica', 'todo']]],
    ], 0, { workload: 90, absences: 8 });

    // marca revisões espaçadas para exemplo
    bioq.topics[0].doneAt = U.addDays(t, -8); bioq.topics[0].reviews = { d1: true, d7: true, d30: false };
    bioq.topics[1].doneAt = U.addDays(t, -2); bioq.topics[1].reviews = { d1: true, d7: false, d30: false };
    bioq.topics[3].doneAt = U.addDays(t, -1);
    s.disciplines = [bioq, hema, imun, gene, micro];

    const b = (day, start, end, type, d, room = '') => ({ id: U.uid('b'), day, start, end, type, disciplineId: d.id, title: '', room });
    s.schedule = [
      b(0, '08:00', '10:00', 'aula', bioq, 'Sala 12'), b(0, '10:00', '12:00', 'aula', hema, 'Sala 12'),
      b(1, '08:00', '10:00', 'aula', imun, 'Sala 8'), b(1, '14:00', '17:00', 'lab', micro, 'Lab. 3'),
      b(2, '08:00', '10:00', 'aula', gene, 'Sala 5'), b(2, '14:00', '16:00', 'estudo', bioq, 'Biblioteca'),
      b(3, '08:00', '10:00', 'aula', bioq, 'Sala 12'), b(3, '16:00', '18:00', 'estudo', imun, 'Biblioteca'),
      b(4, '10:00', '12:00', 'aula', micro, 'Sala 3'), b(4, '14:00', '16:00', 'lab', hema, 'Lab. 1'),
    ];

    const k = (title, type, d, due, priority = 'media', done = false) => ({ id: U.uid('k'), title, type, disciplineId: d.id, due, priority, done, notes: '' });
    s.tasks = [
      k('Prova de Bioquímica — P2', 'Prova', bioq, U.addDays(t, 6), 'alta'),
      k('Relatório da aula prática de coloração de Gram', 'Relatório de laboratório', micro, U.addDays(t, 3), 'alta'),
      k('Lista de exercícios — Mendel', 'Tarefa', gene, U.addDays(t, 1)),
      k('Seminário: resposta imune a vírus', 'Seminário', imun, U.addDays(t, 9)),
      k('Trabalho: morfologia de hemácias', 'Trabalho acadêmico', hema, U.addDays(t, 14), 'baixa'),
      k('Resumo de Glicólise', 'Tarefa', bioq, U.addDays(t, -2), 'media', true),
    ];

    const g = (d, name, grade, weight) => ({ id: U.uid('g'), disciplineId: d.id, name, grade, weight });
    s.grades = [
      g(bioq, 'P1', 8, 35), g(bioq, 'P2', null, 35), g(bioq, 'Relatórios', 9, 30),
      g(hema, 'Prova 1', 6.5, 40), g(hema, 'Prova 2', null, 40), g(hema, 'Seminário', null, 20),
      g(imun, 'Prova 1', 5.5, 50), g(imun, 'Prova 2', null, 50),
      g(gene, 'P1', 9, 50), g(gene, 'P2', 8, 50),
      g(micro, 'Prova prática', 4.5, 50), g(micro, 'Prova teórica', null, 50),
    ];

    s.hours = [
      { id: U.uid('o'), date: U.addDays(t, -40), category: 'Monitoria', title: 'Monitoria de Bioquímica', hours: 20 },
      { id: U.uid('o'), date: U.addDays(t, -25), category: 'Congresso / evento', title: 'Semana de Biomedicina', hours: 12 },
      { id: U.uid('o'), date: U.addDays(t, -10), category: 'Estágio', title: 'Estágio observacional — laboratório clínico', hours: 40 },
    ];
    return s;
  }

  /* ---------- Regras de negócio ---------- */
  const Calc = {
    topicStats(d) {
      const total = d.topics.length;
      const done = d.topics.filter((x) => x.status === 'done').length;
      const doing = d.topics.filter((x) => x.status === 'doing').length;
      return { total, done, doing, pct: U.pct(done, total) };
    },

    disciplineStatus(d) {
      const { total, done, doing } = Calc.topicStats(d);
      if (total > 0 && done === total) return { label: 'Concluído', tone: 'ink' };
      if (done === 0 && doing === 0) return { label: 'A começar', tone: '' };
      return { label: 'Em progresso', tone: 'pink' };
    },

    nextExam(state, disciplineId) {
      return state.tasks
        .filter((k) => k.disciplineId === disciplineId && k.type === 'Prova' && !k.done && k.due && k.due >= U.today())
        .sort((a, b) => a.due.localeCompare(b.due))[0] || null;
    },

    /** Média ponderada, projeção e situação (aprovado / exame / reprovado). Pesos em %. */
    gradeSummary(state, disciplineId) {
      const { passMark, examFloor, examPass } = state.settings;
      const items = state.grades.filter((g) => g.disciplineId === disciplineId);
      const graded = items.filter((g) => g.grade != null);
      const wDone = graded.reduce((a, g) => a + (g.weight || 0), 0);
      const points = graded.reduce((a, g) => a + g.grade * (g.weight || 0) / 100, 0); // contribuição na média final (0–10)
      const partial = wDone > 0 ? points * 100 / wDone : null;
      const out = { items, points, partial, wDone, wRemaining: Math.max(0, 100 - wDone), status: 'Sem notas', tone: '', message: 'Cadastre avaliações com nota e peso.' };
      if (!items.length) return out;
      if (wDone >= 99.99) {
        const final = points * 100 / wDone;
        if (final >= passMark) return { ...out, status: 'Aprovado', tone: 'pink', message: `Média final ${U.fmtNum(final)} ≥ ${U.fmtNum(passMark)}.` };
        if (final >= examFloor) return { ...out, status: 'Exame final', tone: 'peach', message: `Média ${U.fmtNum(final)}. Você precisa de ${U.fmtNum(Math.max(0, 2 * examPass - final))} no exame (média final ≥ ${U.fmtNum(examPass)}).` };
        return { ...out, status: 'Reprovado', tone: 'ink', message: `Média ${U.fmtNum(final)} abaixo do mínimo para exame (${U.fmtNum(examFloor)}).` };
      }
      const need = (passMark - points) / (out.wRemaining / 100);
      if (need <= 0) return { ...out, status: 'Aprovação garantida', tone: 'pink', message: `Você já acumulou ${U.fmtNum(points)} pontos — o suficiente para a média ${U.fmtNum(passMark)}.` };
      if (need > 10) return { ...out, status: 'Exame provável', tone: 'peach', message: `Mesmo com 10 nas ${out.wRemaining}% restantes não alcança ${U.fmtNum(passMark)}; planeje o exame final.` };
      return { ...out, status: 'Em andamento', tone: 'rose', message: `Precisa de média ${U.fmtNum(need)} nas avaliações restantes (${out.wRemaining}% do peso) para passar direto.` };
    },

    absenceInfo(d) {
      const allowed = Math.floor((d.workload || 0) * (d.absencePct || 0) / 100);
      const used = d.absences || 0;
      const pct = allowed > 0 ? Math.round((used / allowed) * 100) : (used > 0 ? 100 : 0);
      let level = 'ok';
      if (pct >= 100) level = 'limit'; else if (pct >= 75) level = 'warn';
      return { allowed, used, left: Math.max(0, allowed - used), pct, level };
    },

    /** Revisões espaçadas (24h / 7 / 30 dias) a partir da data de conclusão do tópico. */
    reviewsDue(state, { includeFuture = false } = {}) {
      const out = [];
      const today = U.today();
      for (const d of state.disciplines) {
        for (const t of d.topics) {
          if (t.status !== 'done' || !t.doneAt) continue;
          for (const step of REVIEW_STEPS) {
            if (t.reviews && t.reviews[step.key]) continue;
            const due = U.addDays(t.doneAt, step.days);
            if (includeFuture || due <= today) out.push({ topic: t, discipline: d, step, due });
          }
        }
      }
      return out.sort((a, b) => a.due.localeCompare(b.due));
    },

    hoursTotals(state) {
      const est = state.hours.filter((h) => h.category === 'Estágio').reduce((a, h) => a + (h.hours || 0), 0);
      const comp = state.hours.filter((h) => h.category !== 'Estágio').reduce((a, h) => a + (h.hours || 0), 0);
      return { estagio: est, complementar: comp };
    },

    overallAverage(state) {
      const vals = state.disciplines.map((d) => Calc.gradeSummary(state, d.id).partial).filter((v) => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    },
  };

  BP.Models = {
    SCHEMA_VERSION, TASK_TYPES, BLOCK_TYPES, HOUR_CATEGORIES, PRIORITIES, REVIEW_STEPS, TONES,
    emptyState, demoState, newDiscipline, newTopic, emptyReviews, Calc,
  };
})(window.BP);
