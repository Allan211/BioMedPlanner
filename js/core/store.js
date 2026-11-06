/* Store: estado único, assinaturas e ações de domínio. A UI nunca escreve no storage diretamente. */
(function (BP) {
  'use strict';
  const { U, Models, Storage } = BP;

  let state = null;
  let saveTimer = null;
  const listeners = new Set();

  const flush = () => { clearTimeout(saveTimer); saveTimer = null; Storage.save(state); };
  const persist = () => { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 150); };
  const emit = () => listeners.forEach((fn) => fn(state));

  const Store = {
    init() {
      state = Storage.load() || Models.demoState();
      Storage.save(state);
      window.addEventListener('beforeunload', () => { if (saveTimer) flush(); });
    },
    get: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** Único ponto de escrita: muta, persiste e notifica. */
    mutate(fn) { fn(state); persist(); emit(); },
    replace(next) { state = next; flush(); emit(); },

    upsert(collection, item) {
      Store.mutate((s) => {
        const list = s[collection];
        const i = item.id ? list.findIndex((x) => x.id === item.id) : -1;
        if (i >= 0) list[i] = { ...list[i], ...item };
        else list.push({ ...item, id: item.id || U.uid(collection[0]) });
      });
    },
    remove(collection, id) { Store.mutate((s) => { s[collection] = s[collection].filter((x) => x.id !== id); }); },

    findTopic(id) {
      for (const d of state.disciplines) { const t = d.topics.find((x) => x.id === id); if (t) return { topic: t, discipline: d }; }
      return null;
    },
  };

  /** Ações de domínio reutilizadas por várias telas. */
  Store.actions = {
    toggleTask(id) {
      Store.mutate((s) => { const t = s.tasks.find((x) => x.id === id); if (t) t.done = !t.done; });
    },
    setTopicStatus(topicId, status) {
      Store.mutate(() => {
        const f = Store.findTopic(topicId); if (!f) return;
        const t = f.topic;
        if (t.status === status) return;
        t.status = status;
        if (status === 'done') { t.doneAt = U.today(); t.reviews = Models.emptyReviews(); }
        else { t.doneAt = null; t.reviews = Models.emptyReviews(); }
      });
    },
    toggleReview(topicId, key) {
      Store.mutate(() => {
        const f = Store.findTopic(topicId); if (!f) return;
        f.topic.reviews = { ...Models.emptyReviews(), ...f.topic.reviews, [key]: !(f.topic.reviews && f.topic.reviews[key]) };
      });
    },
    addAbsences(disciplineId, delta) {
      Store.mutate((s) => { const d = s.disciplines.find((x) => x.id === disciplineId); if (d) d.absences = Math.max(0, (d.absences || 0) + delta); });
    },
    toggleHabit(date, habitId) {
      Store.mutate((s) => {
        const set = new Set(s.habitLog[date] || []);
        set.has(habitId) ? set.delete(habitId) : set.add(habitId);
        s.habitLog[date] = [...set];
      });
    },
    removeDiscipline(id) {
      Store.mutate((s) => {
        s.disciplines = s.disciplines.filter((d) => d.id !== id);
        s.grades = s.grades.filter((g) => g.disciplineId !== id);
        s.tasks.forEach((t) => { if (t.disciplineId === id) t.disciplineId = ''; });
        s.schedule.forEach((b) => { if (b.disciplineId === id) b.disciplineId = ''; });
      });
    },
    logPomodoro() {
      Store.mutate((s) => { const d = U.today(); s.pomodoro[d] = (s.pomodoro[d] || 0) + 1; });
    },
  };

  BP.Store = Store;
})(window.BP);
