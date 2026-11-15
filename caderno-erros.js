// Caderno de erros — os totais vêm das questões registradas; os subtópicos
// detalham o motivo do erro, sem acrescentar uma segunda contagem de questões.
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
    return `<div class="mp-review-focus"><b>Foco especial nesta revisão:</b>
      ${items.map(item => `<span class="mp-focus-tag ${item.reason === 'Não sabia' ? 'mp-focus-knowledge' : 'mp-focus-attention'}">${esc(item.topic)} <small>· ${esc(item.reason)}${item.count > 1 ? ' · ' + item.count + ' erros' : ''}</small>${item.note ? `<small class="mp-focus-detail">${esc(item.note)}</small>` : ''}</span>`).join('')}
      <small class="mp-focus-note">Revise o assunto completo e dedique atenção extra a esses pontos.</small>
    </div>`;
  }

  const previousReviewRow = mcRevisionRow;
  mcRevisionRow = function (item) {
    const original = previousReviewRow(item);
    const focus = reviewFocusHtml(con(item.con));
    return focus ? original.replace('<span class="gr">', '<div class="gr">')
      .replace('</span><div class="mc-review-actions">', focus + '</div><div class="mc-review-actions">') : original;
  };

  function editableRow(item = {}) {
    return `<div class="mp-error-editor-row" data-error-row data-id="${esc(item.id || '')}">
      <label class="mp-error-topic">Conteúdo ou subtópico que errou
        <input data-field="topic" maxlength="180" placeholder="Ex.: tratamento da meningite bacteriana" value="${esc(item.topic || '')}"></label>
      <label>Por que errou?
        <select data-field="reason">${O(REASONS, item.reason || 'Não sabia')}</select></label>
      <label>Quantas questões tiveram esse erro?
        <input type="number" data-field="count" min="1" max="9999" step="1" value="${Number(item.count) > 0 ? Number(item.count) : 1}"></label>
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
      <p class="mu">${count?.errors || 0} erros contabilizados nos resultados lançados. Indique em quais pontos você errou e por quê.</p>
      <p class="mu"><small>Essas anotações não aumentam a quantidade de erros: são focos para as próximas revisões.</small></p>
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
      const count = Number(value('count').value);
      const note = value('note').value.trim();
      if (!topic || !REASONS.includes(reason) || !Number.isSafeInteger(count) || count < 1 || count > 9999) {
        d.querySelector('#mp-error-validation').textContent = 'Preencha o subtópico, o motivo e a quantidade (número inteiro a partir de 1).';
        return;
      }
      items.push({id: row.dataset.id || U(), group: d.dataset.group, topic, reason, count,
        note, resolved: value('resolved').checked, updatedAt: D()});
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
        <div class="card"><small>Erros das questões lançadas</small><div class="big">${loggedErrors}</div></div>
        <div class="card"><small>Subtópicos para reforçar</small><div class="big">${active}</div></div>
      </div>
      <div class="card"><h3>Erros por assunto</h3>
        <p class="mu">Os erros dos resultados lançados em <b>Questões feitas</b> entram nesta contagem. Use <b>Editar erros</b> para identificar subtópicos e separar falta de atenção de falta de conhecimento.</p>
        ${all.length ? all.map(g => {
          const items = focusItems().filter(x => x.group === g.key && !x.resolved);
          return `<div class="row mp-error-group"><span class="gr"><b>${esc(g.title)}</b> <small>· ${esc(g.subject)}</small><br>
            <small>${g.errors} ${g.errors === 1 ? 'erro' : 'erros'} de ${g.total} questões · ${g.total ? Math.round(100 * g.correct / g.total) + '%' : '—'} de acertos</small>
            ${items.length ? `<div class="mp-error-summary">${items.map(x => `<span class="mp-focus-tag ${x.reason === 'Não sabia' ? 'mp-focus-knowledge' : 'mp-focus-attention'}">${esc(x.topic)} · ${esc(x.reason)}${x.count > 1 ? ' · ' + x.count + ' erros' : ''}</span>`).join('')}</div>` :
              '<small class="mp-error-unclassified">Subtópicos ainda não identificados</small>'}
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
