/* Bootstrap: roteamento por hash (#/rota/param), render e delegação de eventos. */
(function (BP) {
  'use strict';
  const { U, Store, UI } = BP;

  const ROUTES = [
    ['painel', 'Painel'], ['disciplinas', 'Disciplinas'], ['cronograma', 'Cronograma'], ['tarefas', 'Tarefas'],
    ['estudos', 'Estudos'], ['desempenho', 'Notas & Faltas'], ['complementares', 'Horas'], ['bemestar', 'Bem-estar'], ['dados', 'Dados'],
  ];

  let current = { id: null, param: null };
  const viewEl = () => document.getElementById('view');

  function parseHash() {
    const [id, param] = location.hash.replace(/^#\/?/, '').split('/');
    return { id: BP.views[id] ? id : 'painel', param: param || null };
  }

  function renderNav(activeId) {
    document.getElementById('nav').innerHTML = ROUTES.map(([id, label]) =>
      `<a href="#/${id}" ${id === activeId ? 'aria-current="page"' : ''}><span class="dot"></span>${U.esc(label)}</a>`).join('');
  }

  function render() {
    const route = parseHash();
    const changed = route.id !== current.id || route.param !== current.param;
    const view = BP.views[route.id];
    const y = window.scrollY;
    try {
      viewEl().innerHTML = view.render(Store.get(), route.param);
      if (view.bind) view.bind(viewEl(), Store.get());
    } catch (err) {
      console.error(err);
      viewEl().innerHTML = '<div class="empty"><p>Algo deu errado ao exibir esta tela. Seus dados continuam salvos.</p></div>';
    }
    renderNav(route.id);
    document.title = `${view.title} — BioPlanner`;
    current = route;
    if (changed) { window.scrollTo(0, 0); viewEl().focus({ preventScroll: true }); } else window.scrollTo(0, y);
  }
  BP.render = render;

  function dispatch(el, kind, event) {
    const name = el.dataset[kind];
    const view = BP.views[current.id];
    const fn = (view.actions && view.actions[name]) || BP.globalActions[name];
    if (fn) fn(el, event, Store.get());
  }

  function init() {
    Store.init();
    const root = viewEl();
    root.addEventListener('click', (e) => { const el = e.target.closest('[data-action]'); if (el && root.contains(el)) dispatch(el, 'action', e); });
    root.addEventListener('change', (e) => { const el = e.target.closest('[data-change]'); if (el) dispatch(el, 'change', e); });
    window.addEventListener('hashchange', render);
    Store.subscribe(render);
    BP.Pomodoro.init();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.BP);
