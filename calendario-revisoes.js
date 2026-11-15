// Melhorias independentes do catálogo e do Firebase: calendário e revisões.
// O estado de estudo continua salvo em users/{uid}/state/main.
(function () {
  const oldExtraSlots = mpExtraSlots;
  let expandedMonth = false;
  const DAY_DIALOG_ID = 'mp-day-expanded';

  // Diferença entre datas do calendário (sem interferência de horário de verão).
  const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);

  // Mantém a sequência D+1/D+7/D+30, mas desloca todas as etapas seguintes
  // quando uma revisão anterior não foi marcada ou foi concluída com atraso.
  mpReviewSlots = function (c) {
    if (!studied(c) || !calendarValidDate(c.started)) return [];
    const done = c.review137Done && typeof c.review137Done === 'object' ? c.review137Done : {};
    const today = D();
    let shift = 0;
    return MP_REVIEW_DAYS.map((day, index) => {
      const originalDue = add(c.started, day);
      const planned = add(originalDue, shift);
      const completedAt = typeof done[day] === 'string' && calendarValidDate(done[day]) ? done[day] : '';
      const completed = !!done[day];
      let due = planned;
      let lateDays = 0;
      if (completed) {
        // Registros antigos contendo apenas true continuam sendo respeitados.
        if (completedAt && completedAt > planned) shift += daysBetween(planned, completedAt);
      } else if (planned < today) {
        lateDays = daysBetween(planned, today);
        shift += lateDays;
        due = today;
      }
      return { day, index: index + 1, originalDue, planned, due,
        done: completed, completedAt, lateDays,
        rescheduled: !completed && due !== originalDue };
    });
  };

  // Reforços por erros são independentes das três etapas principais;
  // pendências vencidas reaparecem hoje, sem concluir-se automaticamente.
  mpExtraSlots = function (c) {
    const today = D();
    return oldExtraSlots(c).map(x => {
      const originalDue = x.due;
      const completedAt = c?.reviewExtraDone?.[x.key];
      return { ...x, originalDue,
        due: !x.done && x.due < today ? today : x.due,
        lateDays: !x.done && originalDue < today ? daysBetween(originalDue, today) : 0,
        rescheduled: !x.done && originalDue < today,
        completedAt: typeof completedAt === 'string' ? completedAt : '' };
    });
  };

  // Não duplicar tarefas de revisão herdadas de versões antigas do MedPath.
  mcVisibleTask = function (t) {
    if (t.p !== 'Revisão' || t.manual || t.done || !t.con) return true;
    const c = con(t.con);
    return !(c && studied(c) && mpReviewSlots(c).some(slot =>
      slot.originalDue === t.date || slot.due === t.date));
  };

  mcAutoRevisions = function () {
    return S.cons.filter(studied).flatMap(c => [
      ...mpReviewSlots(c).map(slot => ({ ...slot, autoReview: true, con: c.id,
        p: 'Revisão', date: slot.due, reviewDay: slot.day, reviewIndex: slot.index,
        txt: (slot.done ? 'Revisão concluída: ' : 'Revisar: ') + c.name + ' (' + slot.index + 'ª revisão)' })),
      ...mpExtraSlots(c).map(slot => ({ ...slot, autoReview: true, extraReview: true,
        extraKey: slot.key, con: c.id, p: 'Revisão', date: slot.due,
        reviewDay: slot.day, txt: (slot.done ? 'Reforço concluído: ' : 'Reforço extra: ') + c.name }))
    ]);
  };

  mcRevisionRow = function (item) {
    const c = con(item.con);
    if (!c) return '';
    const type = item.extraReview ? 'Reforço extra' : item.reviewIndex + 'ª revisão (D+' + item.reviewDay + ')';
    const status = item.done ? 'Feita' : item.due <= D() ? 'Pendente para hoje' : 'Agendada';
    const changed = item.rescheduled
      ? `<small class="mp-rev-replanned">Recalculada · inicialmente ${fmt(item.originalDue)}</small>` : '';
    const complete = item.done
      ? `<span class="mp-rev-done">✓ Feita${item.completedAt ? ' em ' + fmt(item.completedAt) : ''}</span>`
      : item.due <= D()
        ? `<button class="b" onclick="completeReview('${c.id}',${item.extraReview ? JSON.stringify('extra:' + item.extraKey) : item.reviewDay})">✓ Marcar como feita</button>`
        : '<small>Disponível na data prevista</small>';
    return `<div class="row tk mc-auto-review"><span class="gr"><span class="mc-review-label">${type} · ${status}</span><br><b>${mpEscapeHtml(c.name)}</b><br><small>${mpEscapeHtml(sub(c.sub)?.name || 'Sem disciplina')} · ${fmt(item.due)}</small><br>${changed}</span><div class="mc-review-actions">${item.done ? '' : `<button class="b2" onclick="logQuestions(null,'${c.id}')">+ Questões</button>`}${complete}</div></div>`;
  };

  // Não permitir marcar como feita uma etapa futura ou já concluída.
  const originalCompleteReview = completeReview;
  completeReview = function (id, day) {
    const c = con(id);
    if (!c) return;
    const slots = [...mpReviewSlots(c), ...mpExtraSlots(c)];
    const slot = typeof day === 'string' && day.startsWith('extra:')
      ? slots.find(x => x.extra && x.key === day.slice(6))
      : day != null ? slots.find(x => !x.extra && x.day === Number(day))
        : mpAllPending(c)[0];
    if (!slot || slot.done || slot.due > D()) return;
    originalCompleteReview(id, day);
  };

  function eventsByDate() {
    const dates = {};
    [...S.tasks.filter(mcVisibleTask), ...mcAutoRevisions()].forEach(t => {
      if (calendarValidDate(t.date)) (dates[t.date] ??= []).push(t);
    });
    Object.values(dates).forEach(items => items.sort((a, b) =>
      Number(!!b.autoReview) - Number(!!a.autoReview)
      || (a.time || '99:99').localeCompare(b.time || '99:99')
      || String(a.txt).localeCompare(String(b.txt), 'pt-BR')));
    return dates;
  }

  function dayHeading(date) {
    const full = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return full.charAt(0).toUpperCase() + full.slice(1);
  }

  function dayDetailsHtml(date) {
    const items = eventsByDate()[date] || [];
    return `<div class="row mp-day-heading"><h3 class="gr" style="margin:0">${mpEscapeHtml(dayHeading(date))}</h3>
      <button class="b2" onclick="edT(null,'${date}')">+ Tarefa</button></div>
      <p class="mu">${items.length} ${items.length === 1 ? 'atividade' : 'atividades'} neste dia · lista completa</p>
      ${items.length ? items.map(t => t.autoReview ? mcRevisionRow(t) : tk(t)).join('')
        : '<p class="review-empty">Nenhuma atividade neste dia.</p>'}`;
  }

  function updateDayDialog() {
    const dialog = document.getElementById(DAY_DIALOG_ID);
    if (!dialog || !dialog.open) return;
    dialog.querySelector('.mp-day-dialog-content').innerHTML = dayDetailsHtml(dialog.dataset.date);
  }

  window.mcCloseDay = function () {
    const dialog = document.getElementById(DAY_DIALOG_ID);
    if (dialog) { dialog.close(); dialog.remove(); }
  };

  window.mcOpenDay = function (date) {
    if (!calendarValidDate(date)) return;
    MC_SELECTED = date;
    MC_VIEW = date.slice(0, 7);
    go();
    window.mcCloseDay();
    const dialog = document.createElement('dialog');
    dialog.id = DAY_DIALOG_ID;
    dialog.className = 'mp-day-expanded-dialog';
    dialog.dataset.date = date;
    dialog.innerHTML = `<div class="row"><h3 class="gr" style="margin:0">Atividades do dia</h3>
      <button class="b2" aria-label="Fechar atividades do dia" onclick="mcCloseDay()">✕ Fechar</button></div>
      <div class="mp-day-dialog-content"></div>`;
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    updateDayDialog();
  };

  window.mcExpandMonth = function () { expandedMonth = !expandedMonth; go(); };

  mcCalendar = function () {
    const [year, month] = mcView().split('-').map(Number), today = D();
    const first = new Date(year, month - 1, 1, 12);
    const leading = (first.getDay() + 6) % 7;
    const firstCell = new Date(year, month - 1, 1 - leading, 12);
    const length = Math.ceil((leading + new Date(year, month, 0).getDate()) / 7) * 7;
    const byDate = eventsByDate();
    let days = '';
    for (let i = 0; i < length; i++) {
      const date = new Date(firstCell);
      date.setDate(firstCell.getDate() + i);
      const key = localDateKey(date), items = byDate[key] || [];
      const classes = ['mc-day', key.slice(0, 7) !== mcView() ? 'mc-out' : '',
        key === today ? 'mc-today' : '', key === (MC_SELECTED || today) ? 'mc-selected' : ''].filter(Boolean).join(' ');
      const shown = expandedMonth ? items : items.slice(0, 2);
      days += `<button type="button" class="${classes}" onclick="mcOpenDay('${key}')"
        aria-label="Abrir ${mpEscapeHtml(dayHeading(key))}: ${items.length} atividades"
        ${key === today ? 'aria-current="date"' : ''}>
        <span class="mc-num">${date.getDate()}</span>
        ${shown.map(t => `<span class="mc-event ${t.done ? 'mc-done' : ''}" style="--event-color:${PC[t.p] || '#8aa0b8'}" title="${mpEscapeHtml(t.txt)}">${t.time ? mpEscapeHtml(t.time + ' · ') : ''}${mpEscapeHtml(t.txt)}</span>`).join('')}
        ${!expandedMonth && items.length > 2 ? `<span class="mc-more">+${items.length - 2} · abrir dia</span>` : ''}</button>`;
    }
    const taskList = S.tasks.filter(t => mcVisibleTask(t) && (t.date || '').startsWith(mcView()));
    const done = taskList.filter(t => t.done).length;
    const count = mcAutoRevisions().filter(r => r.date.startsWith(mcView()) && !r.done).length;
    const label = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `<section class="card mp-calendar-panel ${expandedMonth ? 'mp-month-expanded' : ''}" aria-label="Calendário mensal">
      <div class="mc-toolbar"><h3>${mpEscapeHtml(label.charAt(0).toUpperCase() + label.slice(1))}</h3>
        <div class="mc-actions"><button class="b2" onclick="mcExpandMonth()" aria-pressed="${expandedMonth}">${expandedMonth ? '↙ Recolher calendário' : '⛶ Expandir calendário'}</button>
        <button class="b2" aria-label="Mês anterior" onclick="mcMove(-1)">‹</button>
        <button class="b2" onclick="mcToday()">Hoje</button>
        <button class="b2" aria-label="Próximo mês" onclick="mcMove(1)">›</button></div></div>
      <p class="mu mp-calendar-hint">Clique em qualquer dia para abrir todas as atividades e marcar revisões como feitas.</p>
      <div class="mc-weekdays">${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(x => `<span>${x}</span>`).join('')}</div>
      <div class="mp-calendar-grid-scroll"><div class="mc-grid">${days}</div></div>
      <div class="mc-review-count">${done}/${taskList.length} tarefas concluídas neste mês · ${count} revisões pendentes agendadas</div></section>`;
  };

  V.revisoes = function () {
    const today = D();
    const all = mcAutoRevisions();
    const pending = all.filter(r => !r.done);
    const todayList = pending.filter(r => r.due <= today).sort((a, b) =>
      (b.lateDays || 0) - (a.lateDays || 0) || String(a.txt).localeCompare(String(b.txt), 'pt-BR'));
    const nextList = pending.filter(r => r.due > today).sort((a, b) =>
      a.due.localeCompare(b.due) || String(a.txt).localeCompare(String(b.txt), 'pt-BR'));
    const rescheduled = todayList.filter(r => r.rescheduled).length;
    const history = (S.hist || []).filter(x => x.ev?.startsWith('Revisão concluída'))
      .slice(-20).reverse();
    return `<div class="row"><h1 class="gr" style="margin:0">Minhas revisões</h1>
      <button class="b2" onclick="to('cronograma')">Ver calendário</button></div>
      <p class="mu">Marque uma revisão apenas depois de realizá-la. Se o dia passar sem confirmação, ela volta para hoje e as próximas datas são recalculadas. Nada é marcado automaticamente.</p>
      <div class="grid mp-revision-stats"><div class="card"><small>Para fazer hoje</small><div class="big">${todayList.length}</div></div>
      <div class="card"><small>Reagendadas</small><div class="big">${rescheduled}</div></div>
      <div class="card"><small>Próximas</small><div class="big">${nextList.length}</div></div></div>
      <div class="card"><h3>Para fazer hoje</h3>${todayList.length ? todayList.map(mcRevisionRow).join('') : '<p class="review-empty">Tudo em dia! Nenhuma revisão pendente para hoje.</p>'}</div>
      <div class="card"><h3>Próximas revisões</h3>${nextList.length ? nextList.map(mcRevisionRow).join('') : '<p class="review-empty">Nenhuma outra revisão agendada.</p>'}</div>
      <div class="card"><h3>Histórico de revisões feitas</h3>${history.length ? history.map(x =>
        `<div class="review-mini mp-review-history">✓ ${fmt(x.d)} · <b>${mpEscapeHtml(con(x.con)?.name || 'Conteúdo removido')}</b> · ${mpEscapeHtml(x.ev)}</div>`).join('')
        : '<p class="review-empty">Nenhuma revisão marcada como feita ainda.</p>'}</div>`;
  };

  // Uma aba principal própria, sem replicar revisões dentro de Questões.
  if (!NAV.some(([id]) => id === 'revisoes')) {
    const calendarIndex = NAV.findIndex(([id]) => id === 'cronograma');
    NAV.splice(calendarIndex < 0 ? NAV.length : calendarIndex + 1, 0, ['revisoes', 'Revisões']);
  }
  // CR é o calendário original; a função continua chamando mcCalendar dinamicamente.
  V.cronograma = () => CR();

  const previousGo = go;
  go = function () { previousGo(); updateDayDialog(); };
  addEventListener('focus', () => { if (location.hash === '#revisoes') go(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && location.hash === '#revisoes') go();
  });
})();
