// Organização visual dos blocos por data e visão de questões já realizadas
// em cada disciplina. Não modifica o histórico nem os registros existentes.
(function () {
  const esc = mpEscapeHtml;

  function subjectForSession(log) {
    const linked = con(log.con) || mpContentForTheme(th(log.theme));
    return linked?.sub || log.sub || '';
  }

  function subjectForAnswer(answer) {
    const q = qq(answer.q);
    const linked = con(answer.con) || con(q?.con) || mpContentForTheme(th(q?.theme));
    return linked?.sub || '';
  }

  function subjectQuestions(subject) {
    const sessions = (S.qsessions || []).filter(log => subjectForSession(log) === subject.id);
    const answers = (S.ans || []).filter(answer => subjectForAnswer(answer) === subject.id);
    const total = sessions.reduce((sum, log) => sum + Math.max(0, Number(log.total) || 0), 0) + answers.length;
    const correct = sessions.reduce((sum, log) => sum + Math.min(Math.max(0, Number(log.total) || 0), Math.max(0, Number(log.correct) || 0)), 0)
      + answers.filter(answer => answer.ok).length;
    return {total, correct, errors: total - correct, blocks: sessions.length};
  }

  const originalFaculty = V.faculdade;
  V.faculdade = function () {
    if (!fsel || !sub(fsel)) return originalFaculty();
    const subject = sub(fsel);
    const contents = S.cons.filter(content => content.sub === subject.id);
    const stats = subjectQuestions(subject);
    return `<div class="row"><button class="b2" onclick="fsel='';go()">← Voltar</button>
      <h1 class="gr">${esc(subject.name)}</h1>
      <button class="b2" onclick="edSub('${subject.id}')">Editar</button>
      <button class="b2" onclick="del('subs','${subject.id}')">Excluir</button></div>
      <div class="card"><small>${subject.sem}º semestre</small><p>${esc(subject.desc) || '<span class="mu">Sem descrição.</span>'}</p></div>
      <div class="card"><div class="row"><h3 class="gr">Conteúdos</h3>
        <button class="b" onclick="edCon(0,'${subject.id}')">+ Conteúdo</button></div>
        ${contents.length ? contents.map(crow).join('') : '<p class="mu">Adicione os assuntos desta disciplina.</p>'}</div>
      <div class="card mp-subject-question-card"><div class="row">
        <div class="gr"><h3>Questões relacionadas</h3>
          <div class="mp-subject-question-total">${stats.total} <small>${stats.total === 1 ? 'questão feita' : 'questões feitas'}</small></div>
          <small>${stats.correct} acertos · ${stats.errors} erros · ${stats.blocks} ${stats.blocks === 1 ? 'bloco registrado' : 'blocos registrados'}</small></div>
        <button type="button" class="b2" onclick="to('questoes','questoes','registro')">Ver blocos realizados</button>
      </div></div>`;
  };

  const originalRecords = externalRecords;
  externalRecords = function () {
    const page = originalRecords();
    const marker = '<div class="card"><h3>Registros anteriores</h3>';
    const index = page.indexOf(marker);
    if (index < 0) return page;
    const logs = [...(S.qsessions || [])].sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || '')) || String(a.id || '').localeCompare(String(b.id || '')));
    const byDay = new Map();
    logs.forEach(log => {
      const date = calendarValidDate(log.date) ? log.date : '';
      if (!byDay.has(date)) byDay.set(date, []);
      byDay.get(date).push(log);
    });
    const groups = [...byDay.entries()].map(([date, items]) => {
      const total = items.reduce((sum, log) => sum + Math.max(0, Number(log.total) || 0), 0);
      const correct = items.reduce((sum, log) => sum + Math.max(0, Number(log.correct) || 0), 0);
      return `<section class="mp-question-day">
        <div class="mp-question-day-heading"><strong>${date ? 'Feitas em ' + fmt(date) : 'Data não informada'}</strong>
          <small>${items.length} ${items.length === 1 ? 'bloco' : 'blocos'} · ${total} questões · ${correct} acertos · ${total - correct} erros</small></div>
        ${items.map(log => {
          const content = con(log.con);
          const title = mpLogTheme(log)?.name || content?.name || 'Conteúdo removido';
          const total = Math.max(0, Number(log.total) || 0), correct = Math.max(0, Number(log.correct) || 0);
          return `<div class="row q-log-row mp-question-record"><span class="gr">
            <b>${esc(title)}</b> <small>· ${esc(sub(log.sub || content?.sub)?.name || '')}</small><br>
            <small>${esc(log.source || 'Questões externas')} · ${date ? fmt(date) : 'sem data'}</small><br>
            <small>${total} questões · ${correct} acertos · ${total - correct} erros · ${total ? Math.round(100 * correct / total) + '%' : '—'}</small>
            </span><div class="q-log-actions"><button class="b2" onclick="logQuestions('${log.id}')">Editar</button>
            <button class="b2" onclick="deleteLog('${log.id}')">Excluir</button></div></div>`;
        }).join('')}</section>`;
    });
    return page.slice(0, index) + `<div class="card"><h3>Blocos de questões por data</h3>
      ${groups.length ? groups.join('') : '<div class="q-empty">Nenhum bloco registrado ainda.</div>'}</div>`;
  };
})();
