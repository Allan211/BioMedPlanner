/* Timer Pomodoro (25/5). Vive fora do #view para não ser reiniciado ao trocar de tela. */
(function (BP) {
  'use strict';
  const { Store, U } = BP;
  const MODES = { focus: { label: 'Foco', secs: 25 * 60 }, break: { label: 'Pausa', secs: 5 * 60 } };
  let mode = 'focus', remaining = MODES.focus.secs, timer = null, endAt = 0, root;

  const fmt = (s) => `${U.pad(Math.floor(s / 60))}:${U.pad(s % 60)}`;

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.frequency.value = 660; g.gain.value = 0.08;
      o.start(); o.stop(ctx.currentTime + 0.35);
    } catch { /* sem áudio — tudo bem */ }
  }

  function draw() {
    const sessions = Store.get().pomodoro[U.today()] || 0;
    root.innerHTML = `
      <div class="mode"><span>Pomodoro · ${MODES[mode].label}</span><span title="Sessões de foco hoje">🍅 ${sessions}</span></div>
      <div class="time" role="timer" aria-live="off">${fmt(remaining)}</div>
      <div class="controls">
        <button class="btn sm primary" data-pomo="toggle">${timer ? 'Pausar' : 'Iniciar'}</button>
        <button class="btn sm ghost" data-pomo="reset">Zerar</button>
        <button class="btn sm ghost" data-pomo="switch" aria-label="Alternar foco/pausa">⇄</button>
      </div>`;
    document.title = timer ? `${fmt(remaining)} · ${MODES[mode].label} — BioPlanner` : document.title.replace(/^\d\d:\d\d · \w+ — /, '');
  }

  function stop() { clearInterval(timer); timer = null; }
  function tick() {
    remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    if (remaining === 0) {
      stop(); beep();
      if (mode === 'focus') Store.actions.logPomodoro();
      mode = mode === 'focus' ? 'break' : 'focus'; remaining = MODES[mode].secs;
    }
    draw();
  }
  function setMode(m) { stop(); mode = m; remaining = MODES[m].secs; draw(); }

  BP.Pomodoro = {
    init() {
      root = document.getElementById('pomodoro');
      root.addEventListener('click', (e) => {
        const a = e.target.closest('[data-pomo]'); if (!a) return;
        const act = a.dataset.pomo;
        if (act === 'toggle') {
          if (timer) { stop(); draw(); } else { endAt = Date.now() + remaining * 1000; timer = setInterval(tick, 500); draw(); }
        } else if (act === 'reset') setMode(mode);
        else setMode(mode === 'focus' ? 'break' : 'focus');
      });
      Store.subscribe(() => { if (!timer) draw(); }); // atualiza o contador ao registrar sessão
      draw();
    },
  };
})(window.BP);
