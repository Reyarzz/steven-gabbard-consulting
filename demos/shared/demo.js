/** Shared demo utilities — one-shot runs, persisted completion state */
window.DemoRunner = {
  storageKey: '',

  init(key) {
    this.storageKey = 'itaky-demo-' + key;
    return this.isComplete();
  },

  isComplete() {
    try {
      return !!sessionStorage.getItem(this.storageKey);
    } catch {
      return false;
    }
  },

  getRecord() {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  markComplete(record) {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify({
        ...record,
        completedAt: new Date().toISOString(),
      }));
    } catch { /* private browsing */ }
  },

  reset() {
    try { sessionStorage.removeItem(this.storageKey); } catch { /* noop */ }
    location.reload();
  },

  ts() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  },

  refId(prefix) {
    const n = Math.floor(10000 + Math.random() * 89999);
    return prefix + '-' + n;
  },

  lockForm(root) {
    root.querySelectorAll('input, select, button[data-action]').forEach(el => {
      el.disabled = true;
    });
    const runBtn = root.querySelector('[data-run]');
    if (runBtn) {
      runBtn.textContent = 'Workflow complete';
      runBtn.disabled = true;
    }
    root.classList.add('locked');
  },

  setStatus(pill, state) {
    if (!pill) return;
    pill.className = 'status-pill ' + state;
    const labels = {
      running: 'Running',
      complete: 'Complete',
      awaiting: 'Awaiting approval',
    };
    pill.textContent = labels[state] || 'Ready';
  },

  showApproval(card) {
    if (!card) return;
    card.classList.add('show', 'attention');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => card.classList.remove('attention'), 2800);
  },

  async animateSteps(steps, onStep, delayMs = 450) {
    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add('active');
      if (onStep) await onStep(i, steps[i]);
      await new Promise(r => setTimeout(r, delayMs));
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
    }
  },

  addLog(logEl, msg, type) {
    const line = document.createElement('div');
    if (type) line.className = type;
    line.textContent = '[' + this.ts() + '] ' + msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  },

  addLogRow(tableBody, msg, status) {
    if (!tableBody) return;
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="ts">' + this.ts() + '</td>' +
      '<td class="msg">' + msg + '</td>' +
      '<td class="st ' + (status || 'info') + '">' + (status === 'ok' ? 'OK' : status === 'warn' ? 'WARN' : '—') + '</td>';
    tableBody.appendChild(tr);
    const wrap = tableBody.closest('.log-scroll');
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  },

  setChecklistItem(list, index, state, meta) {
    const li = list.querySelectorAll('li')[index];
    if (!li) return;
    li.classList.remove('active', 'done');
    if (state) li.classList.add(state);
    const metaEl = li.querySelector('.meta');
    if (metaEl && meta) metaEl.textContent = meta;
  },

  showCompletion(card, record, html) {
    card.classList.add('show');
    const dl = card.querySelector('dl');
    if (dl && record) {
      dl.innerHTML = Object.entries(record)
        .filter(([k]) => k !== 'completedAt' && k !== 'decision' && k !== 'stepsDone')
        .map(([k, v]) => '<dt>' + k + '</dt><dd>' + v + '</dd>')
        .join('');
    }
    const body = card.querySelector('[data-completion-body]');
    if (body && html) body.innerHTML = html;
  },

  bindReset(btn) {
    if (btn) btn.addEventListener('click', () => this.reset());
  },

  restoreCompleted(root, card, record, summaryHtml) {
    this.lockForm(root);
    root.querySelectorAll('.checklist li, .step').forEach(s => s.classList.add('done'));
    const pill = document.querySelector('[data-status]');
    this.setStatus(pill, 'complete');
    const log = document.querySelector('#log');
    if (log && log.tagName === 'TBODY') {
      log.innerHTML = '';
      this.addLogRow(log, (record.Reference || record.refId || 'Record') + ' · complete', 'ok');
    } else if (log) {
      log.innerHTML = '';
      this.addLog(log, (record.Reference || 'Record') + ' · complete', 'ok');
    }
    this.showCompletion(card, record, summaryHtml);
  },
};
