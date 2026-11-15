// Organização visual dos blocos por matéria e visão de questões já realizadas
// em cada disciplina. Não modifica o histórico nem os registros existentes.
(function () {
  const esc = mpEscapeHtml;
  const expandedSubjects = new Set();

  window.mpRememberQuestionSubject = function (details) {
    const key = details?.dataset?.subject;
    if (!key) return;
    if (details.open) expandedSubjects.add(key);
    else expandedSubjects.delete(key);
  };

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
    const bySubject = new Map();
    logs.forEach(log => {
      const content = con(log.con), theme = mpLogTheme(log);
      const linked = content || mpContentForTheme(theme);
      const subject = sub(linked?.sub || log.sub)?.name || theme?.esp || theme?.area || 'Outros assuntos';
      const subjectKey = mpTopicKey(subject) || 'outros';
      if (!bySubject.has(subjectKey)) bySubject.set(subjectKey, {name: subject, content: new Map(), logs: []});
      const group = bySubject.get(subjectKey);
      group.logs.push(log);
      const title = theme?.name || content?.name || 'Conteúdo não identificado';
      const topicKey = mpTopicKey(title) || title;
      if (!group.content.has(topicKey)) group.content.set(topicKey, {name: title, logs: []});
      group.content.get(topicKey).logs.push(log);
    });
    const groups = [...bySubject.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, 'pt-BR')).map(([key, group]) => {
      const topics = [...group.content.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      return `<details class="mp-question-subject" data-subject="${esc(key)}" ontoggle="mpRememberQuestionSubject(this)" ${expandedSubjects.has(key) ? 'open' : ''}>
        <summary><strong>${esc(group.name)}</strong></summary>
        <div class="mp-question-subject-content">${topics.map(topic => `<section class="mp-question-topic">
          <h4>${esc(topic.name)}</h4>
          ${topic.logs.map(log => {
            const n = Math.max(0, Number(log.total) || 0);
            const ok = Math.min(n, Math.max(0, Number(log.correct) || 0));
            return `<div class="row mp-question-entry"><div class="gr">
              <span class="mp-question-date">${calendarValidDate(log.date) ? fmt(log.date) : 'Data não informada'}</span>
              <small> · ${n} questões · ${ok} acertos · ${n - ok} erros</small>
              ${log.source ? `<small class="mp-question-source"> · ${esc(log.source)}</small>` : ''}
              </div><div class="q-log-actions"><button class="b2" onclick="logQuestions('${log.id}')">Editar</button>
              <button class="b2" onclick="deleteLog('${log.id}')">Excluir</button></div></div>`;
          }).join('')}</section>`).join('')}</div></details>`;
    });
    return page.slice(0, index) + `<div class="card"><h3>Questões por matéria</h3>
      ${groups.length ? groups.join('') : '<div class="q-empty">As matérias aparecerão aqui quando você lançar um bloco de questões.</div>'}</div>`;
  };
})();
