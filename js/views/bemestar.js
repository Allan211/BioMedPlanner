/* Bem-estar: rastreador de hábitos semanal + feedback/ajustes da semana. */
(function (BP) {
  'use strict';
  const { U, Store, UI, Shared, Forms } = BP;
  const { esc } = U;

  let weekStart = null;
  const currentWeek = () => weekStart || (weekStart = U.weekStart(U.today()));

  BP.views.bemestar = {
    title: 'Bem-estar',
    render(state) {
      const ws = currentWeek();
      const days = Array.from({ length: 7 }, (_, i) => U.addDays(ws, i));
      const today = U.today();
      const fb = state.feedback[ws] || {};
      const habitRows = state.habits.map((h) => {
        const count = days.filter((d) => (state.habitLog[d] || []).includes(h.id)).length;
        return `<div><strong>${esc(h.name)}</strong><br><span class="meta">${count}/7 dias</span></div>
          ${days.map((d) => `<input type="checkbox" ${(state.habitLog[d] || []).includes(h.id) ? 'checked' : ''} data-action="toggleHabit" data-id="${h.id}" data-date="${d}" aria-label="${esc(h.name)} em ${U.fmtDate(d)}">`).join('')}`;
      }).join('');

      return `
        ${Shared.pageHead('Hábitos <em>& bem-estar</em>', 'Constância vale mais que intensidade: sono, movimento e leitura sustentam o rendimento.',
          `<button class="btn ghost" data-action="prevWeek" aria-label="Semana anterior">${UI.icon('left')}</button><span class="chip plain" style="align-self:center">${U.fmtDate(ws)} – ${U.fmtDate(days[6])}</span><button class="btn ghost" data-action="nextWeek" aria-label="Próxima semana">${UI.icon('right')}</button><button class="btn primary" data-action="newHabit">${UI.icon('plus')} Hábito</button>`)}
        <section class="card section"><div class="scroll-x"><div class="habit-grid">
          <span></span>${days.map((d, i) => `<span class="dh ${d === today ? 'today' : ''}">${U.DAYS_SHORT[i]}<br><span class="meta">${d.slice(8)}</span></span>`).join('')}
          ${habitRows}
        </div></div>
        ${state.habits.length ? '' : UI.empty('Adicione hábitos para acompanhar.')}
        </section>

        <section class="card">
          <div class="card-head"><h2>Feedback da semana</h2></div>
          <form class="form-grid" data-form="feedback">
            <div class="field"><label for="fb_good">O que deu certo?</label><textarea id="fb_good" name="good" rows="3">${esc(fb.good)}</textarea></div>
            <div class="field"><label for="fb_late">O que atrasou?</label><textarea id="fb_late" name="late" rows="3">${esc(fb.late)}</textarea></div>
            <div class="field full"><label for="fb_adjust">Como recalibrar o cronograma da próxima semana?</label><textarea id="fb_adjust" name="adjust" rows="3">${esc(fb.adjust)}</textarea></div>
          </form>
          <p class="meta" style="margin-top:8px">Salvo automaticamente ao sair do campo.</p>
        </section>`;
    },
    bind(root) {
      root.querySelectorAll('[data-form="feedback"] textarea').forEach((ta) => {
        ta.addEventListener('change', () => {
          const form = ta.form; const ws = currentWeek();
          // grava sem re-renderizar a tela inteira (evita perder o foco)
          const s = Store.get();
          s.feedback[ws] = { good: form.good.value, late: form.late.value, adjust: form.adjust.value };
          BP.Storage.save(s); UI.toast('Feedback salvo');
        });
      });
    },
    actions: {
      toggleHabit: (el) => Store.actions.toggleHabit(el.dataset.date, el.dataset.id),
      newHabit: () => Forms.habit(),
      prevWeek() { weekStart = U.addDays(currentWeek(), -7); BP.render(); },
      nextWeek() { weekStart = U.addDays(currentWeek(), 7); BP.render(); },
    },
  };
})(window.BP);
