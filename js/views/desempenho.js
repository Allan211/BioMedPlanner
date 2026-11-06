/* Notas & Faltas: rastreador de avaliações, calculadora de média e controle de frequência. */
(function (BP) {
  'use strict';
  const { U, Models, Store, UI, Shared, Forms } = BP;
  const { esc } = U;
  const { Calc } = Models;

  function disciplineBlock(state, d) {
    const gs = Calc.gradeSummary(state, d.id);
    const ab = Calc.absenceInfo(d);
    const rows = gs.items.map((g) => `
      <tr><td>${esc(g.name)}</td><td class="num">${g.grade == null ? '<span class="muted">—</span>' : U.fmtNum(g.grade)}</td><td class="num">${U.fmtNum(g.weight, 0)}%</td>
      <td class="num"><button class="icon-btn" data-action="editGrade" data-id="${g.id}" aria-label="Editar ${esc(g.name)}">${UI.icon('edit')}</button></td></tr>`).join('');
    const abMsg = ab.level === 'limit' ? 'Limite de faltas atingido!' : ab.level === 'warn' ? `Atenção: restam ${ab.left}h de faltas.` : `Restam ${ab.left}h de faltas.`;

    return `
      <article class="card">
        <div class="card-head"><h2>${esc(d.name)}</h2>${UI.chip(gs.status, gs.tone)}</div>
        ${gs.items.length ? `<table class="tbl"><thead><tr><th>Avaliação</th><th class="num">Nota</th><th class="num">Peso</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : UI.empty('Sem avaliações cadastradas.')}
        <p style="margin:12px 0 4px"><strong>Média parcial: ${U.fmtNum(gs.partial)}</strong> <span class="meta">· ${U.fmtNum(gs.points, 2)} pts acumulados · ${U.fmtNum(gs.wDone, 0)}% do peso avaliado</span></p>
        <p class="muted" style="font-size:13.5px">${esc(gs.message)}</p>
        <button class="btn sm" style="margin-top:10px" data-action="newGrade" data-id="${d.id}">${UI.icon('plus')} Avaliação</button>

        <hr style="border:0;border-top:1.5px solid var(--line);margin:18px 0">
        <h3 style="margin-bottom:8px">Frequência</h3>
        ${UI.bar(ab.pct, ab.level)}
        <p class="meta" style="margin:8px 0">${ab.used}h de ${ab.allowed}h permitidas (${d.absencePct}% de ${d.workload}h) · ${esc(abMsg)}</p>
        <div class="head-actions">
          <button class="btn sm ghost" data-action="absence" data-id="${d.id}" data-delta="-1" aria-label="Remover 1 falta de ${esc(d.name)}">−1</button>
          <button class="btn sm" data-action="absence" data-id="${d.id}" data-delta="1" aria-label="Adicionar 1 falta em ${esc(d.name)}">+1 falta</button>
          <button class="btn sm" data-action="absence" data-id="${d.id}" data-delta="2" aria-label="Adicionar 2 faltas em ${esc(d.name)}">+2 (aula dupla)</button>
        </div>
      </article>`;
  }

  BP.views.desempenho = {
    title: 'Notas & Faltas',
    render(state) {
      const s = state.settings;
      return `
        ${Shared.pageHead('Notas <em>& frequência</em>', `Aprovação direta com média ≥ ${U.fmtNum(s.passMark)}; exame a partir de ${U.fmtNum(s.examFloor)}. Faltas contadas em horas-aula.`, `<button class="btn ghost" data-action="settings">Regras da universidade</button>`)}
        ${state.disciplines.length ? `<div class="grid cols-2">${state.disciplines.map((d) => disciplineBlock(state, d)).join('')}</div>` : UI.empty('Cadastre disciplinas para registrar notas e faltas.')}`;
    },
    actions: {
      settings: () => Forms.settings(),
      newGrade: (el) => Forms.grade(null, el.dataset.id),
      editGrade: (el) => Forms.grade(Store.get().grades.find((g) => g.id === el.dataset.id)),
      absence: (el) => Store.actions.addAbsences(el.dataset.id, Number(el.dataset.delta)),
    },
  };
})(window.BP);
