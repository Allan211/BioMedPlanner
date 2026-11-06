/* Dados & Ajustes: backup/restauração, exemplos, regras e reset. */
(function (BP) {
  'use strict';
  const { U, Models, Store, Storage, UI, Shared, Forms } = BP;

  function download(name, text, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  BP.views.dados = {
    title: 'Dados',
    render(state) {
      return `
        ${Shared.pageHead('Dados <em>& ajustes</em>', 'Tudo fica salvo apenas neste navegador. Faça backups regulares.')}
        <div class="grid cols-2">
          <section class="card"><div class="card-head"><h2>Backup</h2></div>
            <p class="muted" style="margin-bottom:14px">Exporte um arquivo .json com todo o seu planner e restaure em qualquer navegador ou computador.</p>
            <div class="head-actions">
              <button class="btn primary" data-action="export">Exportar backup</button>
              <label class="btn" tabindex="0" for="import-file">Importar backup</label>
              <input id="import-file" class="visually-hidden" type="file" accept="application/json,.json" data-change="import">
            </div>
          </section>
          <section class="card"><div class="card-head"><h2>Regras & metas</h2></div>
            <p class="muted" style="margin-bottom:14px">Média de aprovação, exame, limite de faltas e metas de horas — ajuste conforme o regulamento da sua instituição.</p>
            <button class="btn" data-action="settings">Editar regras</button>
          </section>
          <section class="card"><div class="card-head"><h2>Começar</h2></div>
            <p class="muted" style="margin-bottom:14px">Carregue dados de exemplo de Biomedicina para explorar, ou deixe o planner vazio para começar o seu semestre.</p>
            <div class="head-actions"><button class="btn" data-action="demo">Carregar exemplo</button><button class="btn danger" data-action="reset">Apagar tudo</button></div>
          </section>
          <section class="card"><div class="card-head"><h2>Sobre o armazenamento</h2></div>
            <p class="muted">Os dados ficam no LocalStorage do navegador (chave <code>bioplanner:v1</code>). Limpar dados do site, usar janela anônima ou trocar de navegador/dispositivo faz o planner “sumir” — por isso o backup.</p>
            <p class="meta" style="margin-top:10px">${state.disciplines.length} disciplinas · ${state.tasks.length} tarefas · ${state.grades.length} avaliações</p>
          </section>
        </div>`;
    },
    actions: {
      settings: () => Forms.settings(),
      export() { download(`bioplanner-backup-${U.today()}.json`, Storage.exportJSON(Store.get())); UI.toast('Backup exportado'); },
      import(el) {
        const file = el.files && el.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const next = Storage.parseImport(String(reader.result));
          el.value = '';
          if (!next) { UI.toast('Arquivo inválido'); return; }
          if (await UI.confirm('Substituir TODOS os dados atuais pelo conteúdo do backup?', { okLabel: 'Restaurar' })) { Store.replace(next); UI.toast('Backup restaurado'); }
        };
        reader.readAsText(file);
      },
      async demo() { if (await UI.confirm('Substituir os dados atuais por dados de exemplo?', { okLabel: 'Carregar exemplo' })) { Store.replace(Models.demoState()); UI.toast('Exemplo carregado'); } },
      async reset() { if (await UI.confirm('Apagar TODOS os dados? Faça um backup antes se quiser guardá-los.', { okLabel: 'Apagar tudo' })) { Store.replace(Models.emptyState()); UI.toast('Planner zerado'); } },
    },
  };
})(window.BP);
