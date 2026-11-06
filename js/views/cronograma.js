/* Cronograma semanal: aulas fixas, laboratórios e blocos de estudo. */
(function (BP) {
  'use strict';
  const { U, Store, UI, Shared, Forms } = BP;
  const { esc } = U;

  const START_H = 7, END_H = 22, HH = 48; // faixa visível e altura (px) de cada hora

  BP.views.cronograma = {
    title: 'Cronograma',
    render(state) {
      const todayIdx = U.dow();
      const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
      const times = hours.map((h, i) => `<span style="top:${i * HH}px">${U.pad(h)}:00</span>`).join('');

      const cols = U.DAYS.map((_, day) => {
        const blocks = state.schedule.filter((b) => b.day === day).map((b) => {
          const top = Math.max(0, (U.toMinutes(b.start) - START_H * 60) / 60 * HH);
          const height = Math.max(24, (U.toMinutes(b.end) - U.toMinutes(b.start)) / 60 * HH - 2);
          const d = Shared.disciplineOf(state, b.disciplineId);
          const label = b.title || (d && d.name) || 'Bloco';
          return `<button class="block ${b.type}" style="top:${top}px;height:${height}px" data-action="editBlock" data-id="${b.id}" aria-label="${esc(label)}, ${b.start} às ${b.end}. Editar">
            <b>${esc(label)}</b>${b.start}–${b.end}${b.room ? ` · ${esc(b.room)}` : ''}</button>`;
        }).join('');
        return `<div class="col ${day === todayIdx ? 'today' : ''}" style="--hh:${HH}px;height:${hours.length * HH}px">${blocks}</div>`;
      }).join('');

      const freeLabel = (() => { // horas livres de estudo: total de horas da semana dentro de 08–18h sem bloco (estimativa)
        const used = state.schedule.reduce((a, b) => a + (U.toMinutes(b.end) - U.toMinutes(b.start)) / 60, 0);
        const study = state.schedule.filter((b) => b.type === 'estudo').reduce((a, b) => a + (U.toMinutes(b.end) - U.toMinutes(b.start)) / 60, 0);
        return `${U.fmtNum(used)} h de compromissos · ${U.fmtNum(study)} h reservadas para estudo`;
      })();

      return `
        ${Shared.pageHead('Cronograma <em>semanal</em>', esc(freeLabel), `<button class="btn primary" data-action="newBlock">${UI.icon('plus')} Novo bloco</button>`)}
        <div class="legend" aria-label="Legenda"><span><i style="background:var(--peach)"></i>Aula</span><span><i style="background:var(--pink)"></i>Estudo</span><span><i style="background:var(--rose)"></i>Laboratório</span></div>
        <div class="week-wrap"><div class="week">
          <div class="corner"></div>
          ${U.DAYS.map((d, i) => `<div class="dayhead ${i === todayIdx ? 'today' : ''}">${U.DAYS_SHORT[i]}<small>${d}</small></div>`).join('')}
          <div class="times" style="height:${hours.length * HH}px">${times}</div>
          ${cols}
        </div></div>
        <p class="meta" style="margin-top:12px">Dica: reserve blocos de “Estudo” nas janelas livres entre as aulas — o app mostra quantas horas você planejou.</p>`;
    },
    actions: {
      newBlock: () => Forms.block(null),
      editBlock: (el) => Forms.block(Store.get().schedule.find((b) => b.id === el.dataset.id)),
    },
  };
})(window.BP);
