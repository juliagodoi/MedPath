// Cada subtópico detalhado corresponde a uma questão errada. Se a questão já
// entrou por um resultado lançado, não a contabilizamos uma segunda vez.
(function () {
  const REASONS = ['Falta de atenção', 'Não sabia'];
  const esc = mpEscapeHtml;
  const focusItems = () => Array.isArray(S.errorFocus) ? S.errorFocus : [];
  const focusKey = (type, id) => type + ':' + id;

  function groupForLog(log) {
    if (con(log.con)) return focusKey('con', log.con);
    const t = th(log.theme);
    if (!t) return null;
    const c = mpContentForTheme(t);
    return c ? focusKey('con', c.id) : focusKey('theme', t.id);
  }

  function groupForAnswer(answer) {
    if (con(answer.con)) return focusKey('con', answer.con);
    const q = qq(answer.q);
    if (con(q?.con)) return focusKey('con', q.con);
    const t = th(q?.theme);
    if (!t) return null;
    const c = mpContentForTheme(t);
    return c ? focusKey('con', c.id) : focusKey('theme', t.id);
  }

  function groupInfo(key) {
    const idx = String(key).indexOf(':');
    const kind = String(key).slice(0, idx), id = String(key).slice(idx + 1);
    if (kind === 'con') {
      const c = con(id);
      if (!c) return null;
      return { key, title: c.name, subject: sub(c.sub)?.name || 'Sem disciplina' };
    }
    const t = th(id);
    return t ? { key, title: t.name, subject: t.esp || t.area || 'Biblioteca' } : null;
  }

  function groups() {
    const map = new Map();
    const ensure = key => {
      const info = key && groupInfo(key);
      if (!info) return null;
      if (!map.has(key)) map.set(key, { ...info, total: 0, correct: 0, errors: 0 });
      return map.get(key);
    };
    (S.qsessions || []).forEach(log => {
      const group = ensure(groupForLog(log));
      if (!group) return;
      const total = Math.max(0, Number(log.total) || 0);
      const correct = Math.min(total, Math.max(0, Number(log.correct) || 0));
      group.total += total;
      group.correct += correct;
      group.errors += total - correct;
    });
    // O banco interno usa S.ans; S.errs é o detalhe dessas respostas, não
    // uma segunda fonte de acertos/erros para evitar contagem duplicada.
    (S.ans || []).forEach(answer => {
      const group = ensure(groupForAnswer(answer));
      if (!group) return;
      group.total += 1;
      if (answer.ok) group.correct += 1;
      else group.errors += 1;
    });
    focusItems().forEach(item => ensure(item.group));
    // Os resultados lançados já contêm o número de erros; as anotações detalham
    // essas questões. Se houver mais anotações do que erros lançados, o excedente
    // representa questões erradas ainda não registradas em Questões feitas.
    for (const group of map.values()) {
      const detailed = focusItems().filter(item => item.group === group.key).length;
      const unlogged = Math.max(0, detailed - group.errors);
      group.total += unlogged;
      group.errors += unlogged;
    }
    return [...map.values()]
      .filter(g => g.errors > 0 || focusItems().some(x => x.group === g.key))
      .sort((a, b) => b.errors - a.errors || a.title.localeCompare(b.title, 'pt-BR'));
  }

  function linkedFocusKeys(content) {
    const result = [focusKey('con', content.id)];
    const theme = mpThemeForContent(content);
    if (theme) result.push(focusKey('theme', theme.id));
    return result;
  }

  function reviewFocusHtml(content) {
    if (!content) return '';
    const keys = linkedFocusKeys(content);
    const items = focusItems().filter(item => keys.includes(item.group) && !item.resolved);
    if (!items.length) return '';
    return `<details class="mp-review-focus"><summary>Focos desta revisão (${items.length})</summary><div class="mp-review-focus-content">
      ${items.map(item => `<span class="mp-focus-tag ${item.reason === 'Não sabia' ? 'mp-focus-knowledge' : 'mp-focus-attention'}">${esc(item.topic)} <small>· ${esc(item.reason)}${calendarValidDate(item.date) ? ' · ' + fmt(item.date) : ''}</small>${item.note ? `<small class="mp-focus-detail">${esc(item.note)}</small>` : ''}</span>`).join('')}
      <small class="mp-focus-note">Revise o assunto completo e dedique atenção extra a esses pontos.</small>
    </div></details>`;
  }

  const previousReviewRow = mcRevisionRow;
  mcRevisionRow = function (item) {
    const original = previousReviewRow(item);
    const focus = reviewFocusHtml(con(item.con));
    return focus ? original.replace('<span class="gr">', '<div class="gr">')
      .replace('</span><div class="mc-review-actions">', focus + '</div><div class="mc-review-actions">') : original;
  };

  function editableRow(item = {}) {
    const date = calendarValidDate(item.date) ? item.date : item.id ? '' : D();
    return `<div class="mp-error-editor-row" data-error-row data-id="${esc(item.id || '')}">
      <label class="mp-error-topic">Conteúdo ou subtópico que errou
        <input data-field="topic" maxlength="180" placeholder="Ex.: tratamento da meningite bacteriana" value="${esc(item.topic || '')}"></label>
      <label>Por que errou?
        <select data-field="reason">${O(REASONS, item.reason || 'Não sabia')}</select></label>
      <label class="mp-error-date">Data em que fez a questão
        <input data-field="date" type="date" value="${esc(date)}"></label>
      <label class="mp-error-note">Observação (opcional)
        <textarea data-field="note" rows="2" maxlength="350" placeholder="O que vale lembrar na próxima revisão">${esc(item.note || '')}</textarea></label>
      <label class="mp-error-resolved"><input data-field="resolved" type="checkbox" ${item.resolved ? 'checked' : ''}> Já superei esta dificuldade</label>
      <button class="b2 mp-error-remove" type="button" onclick="this.closest('[data-error-row]').remove()">Remover</button>
    </div>`;
  }

  window.mpErrorAddRow = function () {
    const container = document.getElementById('mp-error-rows');
    if (container) container.insertAdjacentHTML('beforeend', editableRow());
  };

  window.mpErrorOpen = function (key) {
    const info = groupInfo(key);
    if (!info) return;
    document.getElementById('mp-error-dialog')?.remove();
    const count = groups().find(x => x.key === key);
    const current = focusItems().filter(x => x.group === key);
    const d = document.createElement('dialog');
    d.id = 'mp-error-dialog';
    d.className = 'mp-error-dialog';
    d.dataset.group = key;
    d.innerHTML = `<h3>Editar erros — ${esc(info.title)}</h3>
      <p class="mu">${count?.errors || 0} erros registrados neste assunto · ${current.length} ${current.length === 1 ? 'questão detalhada' : 'questões detalhadas'}.</p>
      <p class="mu"><small>Cada subtópico adicionado representa uma questão errada. Se ela já foi contabilizada nos resultados lançados, não será contada novamente.</small></p>
      <div id="mp-error-rows">${current.map(editableRow).join('')}</div>
      <button type="button" class="b2" id="mp-error-add">+ Adicionar subtópico</button>
      <p id="mp-error-validation" class="err" role="alert"></p>
      <div class="row"><button class="b2" type="button" id="mp-error-cancel">Cancelar</button>
      <span class="gr"></span><button class="b" type="button" id="mp-error-save">Salvar alterações</button></div>`;
    document.body.append(d);
    d.showModal();
    d.querySelector('#mp-error-add').onclick = window.mpErrorAddRow;
    d.querySelector('#mp-error-cancel').onclick = () => d.close();
    d.querySelector('#mp-error-save').onclick = () => window.mpErrorSave();
    d.addEventListener('close', () => d.remove());
  };

  window.mpErrorSave = function () {
    const d = document.getElementById('mp-error-dialog');
    if (!d) return;
    const rows = [...d.querySelectorAll('[data-error-row]')], items = [];
    for (const row of rows) {
      const value = field => row.querySelector(`[data-field="${field}"]`);
      const topic = value('topic').value.trim();
      const reason = value('reason').value;
      const date = value('date').value;
      const note = value('note').value.trim();
      if (!topic || !REASONS.includes(reason) || date && !calendarValidDate(date)) {
        d.querySelector('#mp-error-validation').textContent = 'Preencha o subtópico, o motivo e uma data válida (se informada).';
        return;
      }
      items.push({id: row.dataset.id || U(), group: d.dataset.group, topic, reason, count: 1,
        date, note, resolved: value('resolved').checked, updatedAt: D()});
    }
    S.errorFocus = [...focusItems().filter(x => x.group !== d.dataset.group), ...items];
    d.close();
    save();
    go();
  };

  V.erros = function () {
    const all = groups();
    const loggedErrors = all.reduce((sum, g) => sum + g.errors, 0);
    const active = focusItems().filter(x => !x.resolved && groupInfo(x.group)).length;
    return `<h1>Caderno de erros</h1>
      <div class="grid mp-error-stats">
        <div class="card"><small>Erros registrados</small><div class="big">${loggedErrors}</div></div>
        <div class="card"><small>Subtópicos para reforçar</small><div class="big">${active}</div></div>
      </div>
      <div class="card"><h3>Erros por assunto</h3>
        ${all.length ? all.map(g => {
          const items = focusItems().filter(x => x.group === g.key && !x.resolved);
          const detailed = focusItems().filter(x => x.group === g.key).length;
          const logs = (S.qsessions || []).filter(x => groupForLog(x) === g.key)
            .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
          return `<div class="row mp-error-group"><span class="gr"><b>${esc(g.title)}</b> <small>· ${esc(g.subject)}</small><br>
            <small>${g.errors} ${g.errors === 1 ? 'erro' : 'erros'} de ${g.total} ${g.total === 1 ? 'questão' : 'questões'} · ${g.total ? Math.round(100 * g.correct / g.total) + '%' : '—'} de acertos</small>
            <small class="mp-error-detailed">${detailed} de ${g.errors} ${g.errors === 1 ? 'questão detalhada' : 'questões detalhadas'}</small>
            ${logs.length ? `<details class="mp-error-dates"><summary>Blocos realizados: ${logs.length} · mais recente ${calendarValidDate(logs[0].date) ? fmt(logs[0].date) : 'sem data'}</summary>
              ${logs.map(x => `<div class="mp-error-date-line"><time datetime="${esc(x.date || '')}">${calendarValidDate(x.date) ? fmt(x.date) : 'Data não informada'}</time> · ${Math.max(0, Number(x.total) - Number(x.correct))} erros em ${Number(x.total) || 0} questões${x.source ? ' · ' + esc(x.source) : ''}</div>`).join('')}</details>` : ''}
            ${items.length ? `<div class="mp-error-summary">${items.map(x => `<span class="mp-focus-tag ${x.reason === 'Não sabia' ? 'mp-focus-knowledge' : 'mp-focus-attention'}">${esc(x.topic)} · ${esc(x.reason)} <small>· ${calendarValidDate(x.date) ? fmt(x.date) : 'Data não informada'}</small></span>`).join('')}</div>` :
              detailed ? '<small class="mp-error-unclassified">Dificuldades sinalizadas como superadas</small>' : '<small class="mp-error-unclassified">Subtópicos ainda não identificados</small>'}
          </span><button type="button" class="b2" onclick="mpErrorOpen('${esc(g.key)}')">Editar erros</button></div>`;
        }).join('') : '<p class="review-empty">Nenhum erro lançado ainda. Os erros aparecerão quando você registrar um resultado em Questões feitas ou errar uma questão do banco.</p>'}
      </div>
      ${S.errs?.length ? `<div class="card"><h3>Questões individuais erradas no banco manual</h3>
        ${[...S.errs].reverse().map(entry => {
          const q = qq(entry.q);
          return q ? `<div class="mp-error-individual"><small>${fmt(entry.d)} · ${esc(con(entry.con)?.name || 'Conteúdo removido')}</small>
            <p>${esc(q.text)}</p><small>Marcada: ${'ABCD'[entry.pick] || '—'} · Correta: ${'ABCD'[q.ans] || '—'}</small><br>
            <select aria-label="Motivo do erro" onchange="S.errs.find(x=>x.id==='${entry.id}').reason=this.value;save();go()">${O([['','Motivo do erro…'],...ERR],entry.reason)}</select>
            <button class="b2" onclick="del('errs','${entry.id}')">Excluir anotação</button></div>` : '';
        }).join('')}</div>` : ''}`;
  };
})();
