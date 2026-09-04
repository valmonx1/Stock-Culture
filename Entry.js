'use strict';

// Keep the mockup's existing identification options; these are not clinical rules.
const ENTRY_EXPECTED_RESULTS = {
  'Gram Stain': ['Gram Positive Cocci in Cluster', 'Gram Positive Rod', 'Gram Negative Rod'],
  Catalase: ['Positive (Produce Bubble)', 'Negative (No Produce Bubbles)', 'Not Applicable'],
  Oxidase: ['Positive (Dark Purple)', 'Negative (No Color)', 'Not Applicable'],
  Coagulase: ['Positive (Clotting)', 'Negative (No Clotting)', 'Not Applicable'],
  'PYR Hydrolysis': ['Positive (Red or Pink Color)', 'Negative (No Color)', 'Not Applicable'],
  Malditof: ['Pass', 'Fail'],
  Vitek: ['Pass', 'Fail']
};

function readEntryRows(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return [];
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error('Invalid saved entry data');
  return rows.map(row => {
    // Earlier Save-only records incorrectly used performedAt for their save time.
    if (row.performedAt && !row.savedAt && !row.performedBy && !row.status) {
      const { performedAt, ...savedRow } = row;
      return { ...savedRow, savedAt: performedAt, status: 'Saved' };
    }
    return row;
  });
}

function createEntryRow(recordId, mode, data, rows, now = new Date()) {
  if (!recordId || !['culture', 'weekly', 'subculture'].includes(mode)) throw new Error('Select a QC organism first.');
  const quantity = Number(data.quantity);
  if (!/^V[1-9]\d*$/.test(data.vial || '') || !/^P[1-4]$/.test(data.passage || '') ||
      (mode !== 'weekly' && !(ENTRY_EXPECTED_RESULTS[data.test] || []).includes(data.expected)) || !String(data.lot || '').trim() ||
      !Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Complete the source vial, passage and prepared culture.');
  if (mode === 'weekly' && !/^P[1-4]$/.test(data.weeklyPassage || '')) throw new Error('Select the weekly passage.');
  if (mode === 'weekly' && !String(data.media || '').trim()) throw new Error('Select the weekly culture media.');
  if (mode === 'culture' && !String(data.methodIdentification || '').trim()) throw new Error('Select the monthly identification method.');
  if ((mode !== 'weekly' && !['Pass', 'Fail'].includes(data.performance)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.expiry || '') ||
      !Number.isFinite(Date.parse(data.expiry))) throw new Error('Complete all culture checking fields.');
  if (mode === 'weekly' && (!/^\d{4}-\d{2}-\d{2}$/.test(data.datePrepared || '') ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.dateDiscarded || '') ||
      !Number.isFinite(Date.parse(data.datePrepared)) || !Number.isFinite(Date.parse(data.dateDiscarded)) ||
      data.dateDiscarded < data.datePrepared)) throw new Error('Complete the weekly preparation and discard dates.');
  const prefix = ({ culture: 'MQC-', weekly: 'WQC-', subculture: 'SUB-' }[mode]) + now.getFullYear() + '-';
  const sequence = rows.reduce((max, row) => row.id?.startsWith(prefix) ?
    Math.max(max, Number(row.id.slice(prefix.length)) || 0) : max, 0) + 1;
  return {
    id: prefix + String(sequence).padStart(4, '0'),
    recordId, mode, vial: data.vial, passage: data.passage, weeklyPassage: mode === 'weekly' ? data.weeklyPassage : '', workingSlant: '', quantity,
    media: mode === 'weekly' ? data.media : '',
    observedOrganism: mode === 'culture' ? String(data.observedOrganism || '') : '',
    methodIdentification: mode === 'culture' ? data.methodIdentification : '',
    bioNumber: mode === 'culture' ? String(data.bioNumber || '').trim() : '',
    test: mode === 'weekly' ? '' : data.test,
    expected: mode === 'weekly' ? '' : data.expected,
    performance: mode === 'weekly' ? '' : data.performance,
    lot: data.lot.trim(),
    expiry: data.expiry,
    datePrepared: mode === 'weekly' ? data.datePrepared : '',
    dateDiscarded: mode === 'weekly' ? data.dateDiscarded : '',
    savedAt: now.toISOString(),
    status: 'Saved'
  };
}

const ENTRY_RESULT_COLUMNS = {
  culture: [
    ['id', 'Monthly QC ID', 'result-id'], ['vial', 'Source Tube', 'result-vial'],
    ['test', 'Identification Test', 'result-test'], ['expected', 'Expected Result', 'result-expected'],
    ['lot', 'Kit Lot Number', 'result-lot'], ['passage', 'Passage (Monthly)', 'result-passage'],
    ['workingSlant', 'Working Slant', 'result-slant'], ['quantity', 'Working Culture Prepared', 'result-quantity'],
    ['performance', 'Status', 'result-performance'], ['expiry', 'Kit Expiry Date', 'result-expiry'],
    ['datePrepared', 'Date Prepared', 'result-expiry'], ['dateDiscarded', 'Date Discarded', 'result-expiry']
  ],
  subculture: [
    ['id', 'Subculture ID', 'result-id'], ['vial', 'Source Tube', 'result-vial'],
    ['quantity', 'Number of Working Culture (Slant)', 'result-quantity'], ['passage', 'Passage (Working)', 'result-passage'],
    ['test', 'Identification Test', 'result-test'], ['lot', 'Kit Lot Number', 'result-lot'],
    ['expiry', 'Kit Expiry Date', 'result-expiry'], ['expected', 'Expected Result', 'result-expected'],
    ['performance', 'Status', 'result-performance']
  ],
  weekly: [
    ['id', 'Weekly QC ID', 'result-id'], ['vial', 'Source Tube', 'result-vial'],
    ['quantity', 'Number of Working Culture (Slant)', 'result-quantity'], ['passage', 'Passage Working', 'result-passage'],
    ['weeklyPassage', 'Passage Weekly', 'result-passage'], ['media', 'Media', 'result-media'],
    ['lot', 'Media Lot Number', 'result-lot'], ['expiry', 'Media Expiry Date', 'result-expiry'],
    ['datePrepared', 'Date Prepared', 'result-expiry'], ['dateDiscarded', 'Date Discarded', 'result-expiry']
  ]
};
const ENTRY_AUDIT_COLUMNS = [
  ['performedBy', 'Performed By', 'result-person'], ['performedAt', 'Performed Date', 'result-timestamp'],
  ['reviewedBy', 'Reviewed By', 'result-person'], ['reviewedAt', 'Reviewed Date', 'result-timestamp'],
  ['endorsedBy', 'Endorsed By', 'result-person'], ['endorsedAt', 'Endorsed Date', 'result-timestamp']
];

function performEntryRow(row, now = new Date()) {
  return applyEntryAction(row, 'performed', now);
}

function applyEntryAction(row, action, now = new Date()) {
  const labels = { performed: 'Performed', reviewed: 'Reviewed', endorsed: 'Endorsed' };
  if (!Object.hasOwn(labels, action)) throw new Error('Unknown action');
  if (row[action + 'At']) return row;
  const updated = { ...row, [action + 'By']: 'Admin', [action + 'At']: now.toISOString() };
  updated.status = updated.endorsedAt ? 'Endorsed' : updated.reviewedAt ? 'Reviewed' : 'Performed';
  return updated;
}

function applyEntryActionToRows(rows, selectedIds, action, now = new Date()) {
  const selected = new Set(selectedIds);
  return rows.map(row => selected.has(row.id) ? applyEntryAction(row, action, now) : row);
}

function filterEntryRows(rows, recordId, mode, status = 'all') {
  return rows.filter(row => {
    const currentStatus = row.endorsedAt ? 'Endorsed' : row.reviewedAt ? 'Reviewed' : row.performedAt ? 'Performed' : 'Saved';
    return row.recordId === recordId && row.mode === mode && (status === 'all' || currentStatus === status);
  });
}

function filterPendingEndorsementRows(rows, recordId, mode, status = 'all') {
  return filterEntryRows(rows, recordId, mode, status).filter(row => !row.endorsedAt);
}

function formatEntryTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function initEntry() {
  const key = 'qc-entry-results-v2';
  const id = new URLSearchParams(location.search).get('record');
  const form = document.getElementById('entry-form');
  const fields = document.getElementById('entry-fields');
  const resultsCard = document.querySelector('.entry-results');
  const resultsToggle = document.getElementById('entry-results-toggle');
  function toggleResultsCard() {
    const expanded = resultsCard.classList.toggle('is-collapsed') === false;
    resultsToggle.textContent = expanded ? '−' : '+';
    resultsToggle.setAttribute('aria-expanded', String(expanded));
    resultsToggle.setAttribute('aria-label', expanded ? 'Collapse recorded results' : 'Expand recorded results');
    resultsToggle.title = expanded ? 'Collapse recorded results' : 'Expand recorded results';
  }
  resultsToggle.addEventListener('click', toggleResultsCard);
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.repeat || !document.getElementById('entry-action-modal').hidden) return;
    const target = event.target;
    if (target.closest?.('input, select, textarea, button, a, [contenteditable="true"]')) return;
    event.preventDefault();
    toggleResultsCard();
  });
  const error = document.getElementById('entry-error');
  let record = null;
  let mode = 'culture';
  let timer;
  function report(message) { error.textContent = message; error.hidden = false; }
  function notify(message) {
    const notice = document.getElementById('entry-notice');
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { notice.hidden = true; }, 4500);
  }
  try {
    const records = JSON.parse(localStorage.getItem('stock-culture-records') || '[]');
    if (Array.isArray(records)) record = records.find(item => item.id === id) || null;
    const selected = JSON.parse(sessionStorage.getItem('qc-entry-selected-record') || 'null');
    if (selected?.id === id) record = selected;
  } catch (e) { report('Unable to read the selected record. Return to the Master List and select it again.'); }
  if (!record) {
    report('QC organism not found. Open Entry from the QC Organism action in the Master List.');
  } else {
    const registeredAtcc = String(record.registration?.atcc || '').trim();
    const baseName = String(record.name || '').trim();
    const fullName = /\bATCC\s+\d+/i.test(baseName) || !registeredAtcc
      ? baseName
      : `${baseName} ${registeredAtcc}`;
    document.getElementById('qc-name').textContent = fullName || 'Not specified';
    document.getElementById('qc-id').textContent = record.id;
    document.getElementById('qc-batch').textContent = record.registration?.batch || record.batch || '—';
    fields.disabled = false;
  }
  // Retain the existing mockup's V1–V12 labels when no batch quantity is recorded.
  const rawCount = record?.registration?.tubeCount || String(record?.tubes || '').split('/')[1];
  const count = Number(rawCount);
  const vialCount = Number.isSafeInteger(count) && count > 0 && count <= 10000 ? count : 12;
  for (let n = 1; n <= vialCount; n++) form.elements.vial.add(new Option('V' + n, 'V' + n));
  Object.keys(ENTRY_EXPECTED_RESULTS).forEach(test => form.elements.test.add(new Option(test, test)));
  function updateExpected() {
    const expected = form.elements.expected;
    expected.replaceChildren(new Option(form.elements.test.value ? 'Select expected result' : 'Select identification test first', ''));
    (ENTRY_EXPECTED_RESULTS[form.elements.test.value] || []).forEach(value => expected.add(new Option(value, value)));
    expected.disabled = mode === 'weekly' || !form.elements.test.value;
  }
  form.elements.test.addEventListener('change', updateExpected);
  function renderRows() {
    const tbody = document.getElementById('entry-rows');
    tbody.replaceChildren();
    const columns = [...ENTRY_RESULT_COLUMNS[mode], ...ENTRY_AUDIT_COLUMNS];
    const heading = document.getElementById('entry-results-head');
    heading.replaceChildren(...columns.map(([, label]) => {
      const th = document.createElement('th');
      th.textContent = label;
      return th;
    }));
    let rows;
    try { rows = filterEntryRows(readEntryRows(localStorage, key), id, mode, document.getElementById('entry-status-filter').value); }
    catch (e) { report('Saved results cannot be read. No existing data has been overwritten.'); return; }
    document.getElementById('entry-count').textContent = rows.length + (rows.length === 1 ? ' record' : ' records');
    if (!rows.length) {
      const cell = tbody.insertRow().insertCell();
      cell.colSpan = columns.length;
      cell.className = 'entry-empty';
      cell.textContent = document.getElementById('entry-status-filter').value === 'all' ? 'No records yet. Complete the form and select Save to add a result.' : 'No records match this status. Select All statuses to view the full list.';
      return;
    }
    rows.forEach(row => {
      const tr = tbody.insertRow();
      columns.forEach(([keyName, , className]) => {
        const rawValue = row[keyName];
        const value = keyName.endsWith('At') ? formatEntryTimestamp(rawValue) : rawValue;
        const td = tr.insertCell();
        td.className = className;
        if (keyName === 'performance' && value) {
          const badge = document.createElement('span');
          badge.className = 'entry-performance' + (value === 'Fail' ? ' is-fail' : '');
          badge.textContent = value;
          td.appendChild(badge);
        } else if (['vial', 'passage', 'weeklyPassage', 'workingSlant', 'quantity'].includes(keyName) && value !== '' && value != null) {
          const badge = document.createElement('span');
          badge.className = 'entry-value-badge';
          badge.textContent = String(value);
          td.appendChild(badge);
        } else td.textContent = value === '' || value == null ? '—' : String(value);
      });
    });
  }
  const actionModal = document.getElementById('entry-action-modal');
  const actionRows = document.getElementById('entry-action-rows');
  const checkAll = document.getElementById('entry-action-check-all');
  function actionSelection() {
    const checked = [...actionRows.querySelectorAll('[data-entry-select]:checked')];
    document.getElementById('entry-action-selection').textContent = checked.length + ' selected';
    const all = actionRows.querySelectorAll('[data-entry-select]');
    checkAll.checked = Boolean(all.length) && checked.length === all.length;
    checkAll.indeterminate = checked.length > 0 && checked.length < all.length;
    return checked.map(input => input.value);
  }
  function openActionModal() {
    let rows;
    try { rows = filterPendingEndorsementRows(readEntryRows(localStorage, key), id, mode, document.getElementById('entry-status-filter').value); }
    catch (e) { report('Unable to read saved records.'); return; }
    actionRows.replaceChildren();
    rows.forEach(row => {
      const tr = actionRows.insertRow();
      const checkCell = tr.insertCell();
      checkCell.className = 'entry-check-column';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.value = row.id; checkbox.dataset.entrySelect = '';
      checkbox.setAttribute('aria-label', 'Select ' + row.id);
      checkbox.addEventListener('change', actionSelection);
      checkCell.appendChild(checkbox);
      [row.id, row.vial, row.test, row.expected].forEach(value => { tr.insertCell().textContent = value || '—'; });
      const performanceCell = tr.insertCell();
      if (row.performance) {
        const badge = document.createElement('span');
        badge.className = 'entry-performance' + (row.performance === 'Fail' ? ' is-fail' : '');
        badge.textContent = row.performance;
        performanceCell.appendChild(badge);
      } else performanceCell.textContent = '—';
    });
    if (!rows.length) {
      const cell = actionRows.insertRow().insertCell(); cell.colSpan = 6; cell.className = 'entry-action-empty'; cell.textContent = 'No records available for the current status filter.';
    }
    document.getElementById('entry-action-id-heading').textContent = mode === 'culture' ? 'Monthly QC ID' : mode === 'weekly' ? 'Weekly QC ID' : 'Subculture ID';
    checkAll.checked = false; checkAll.indeterminate = false; checkAll.disabled = !rows.length;
    document.getElementById('entry-action-selection').textContent = '0 selected';
    actionModal.hidden = false;
    document.getElementById('entry-action-close').focus();
  }
  function closeActionModal() { actionModal.hidden = true; }
  document.getElementById('entry-list-action').addEventListener('click', openActionModal);
  document.getElementById('entry-action-close').addEventListener('click', closeActionModal);
  actionModal.addEventListener('click', event => { if (event.target === actionModal) closeActionModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !actionModal.hidden) closeActionModal(); });
  checkAll.addEventListener('change', () => { actionRows.querySelectorAll('[data-entry-select]').forEach(input => { input.checked = checkAll.checked; }); actionSelection(); });
  actionModal.querySelectorAll('[data-bulk-action]').forEach(button => button.addEventListener('click', () => {
    const selectedIds = actionSelection();
    if (!selectedIds.length) { notify('Select at least one record.'); return; }
    const action = button.dataset.bulkAction;
    try {
      const rows = readEntryRows(localStorage, key);
      const selectedSet = new Set(selectedIds);
      const scopedIds = rows.filter(row => row.recordId === id && row.mode === mode && selectedSet.has(row.id)).map(row => row.id);
      const updated = applyEntryActionToRows(rows, scopedIds, action);
      localStorage.setItem(key, JSON.stringify(updated));
      error.hidden = true;
      closeActionModal();
      renderRows();
      notify(scopedIds.length + ' record' + (scopedIds.length === 1 ? '' : 's') + ' successfully ' + action + ' by Admin.');
    } catch (e) { report('Unable to update the selected records. Please try again.'); }
  }));
  document.getElementById('entry-status-filter').addEventListener('change', renderRows);
  document.getElementById('entry-export').addEventListener('click', () => {
    if (!record) { report('Select a QC organism before downloading.'); return; }
    try {
      const rows = filterEntryRows(readEntryRows(localStorage, key), id, mode, document.getElementById('entry-status-filter').value);
      if (!rows.length) { notify('No saved records to download.'); return; }
      const bytes = buildEntryWorkbook(record, rows, mode);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = (record.id + '-' + mode + '-list.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify('Excel download started · ' + rows.length + ' records');
    } catch (e) { report('Unable to export the list. Please try again.'); }
  });
  const tabs = [...document.querySelectorAll('[data-mode]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
      document.getElementById('entry-panel').setAttribute('aria-labelledby', tab.id);
      document.getElementById('results-title').textContent = tab.textContent;
      const passageLabel = mode === 'culture' ? 'Passage (Monthly)' : mode === 'weekly' ? 'Passage Working' : 'Passage (Working)';
      document.getElementById('entry-passage-label').firstChild.textContent = passageLabel + ' ';
      const sourceGroup = document.querySelector('.entry-field-group-source');
      const sourceGrid = document.getElementById('entry-source-group-grid');
      const preparedGroup = document.querySelector('.entry-field-group-prepared');
      const preparedGrid = document.getElementById('entry-prepared-group-grid');
      const sourceField = document.querySelector('[data-source-field]');
      const passageField = document.querySelector('[data-passage-field]');
      const weeklyPassageField = document.querySelector('[data-weekly-passage-field]');
      const preparedField = document.querySelector('[data-prepared-field]');
      const usesWorkingSourceLayout = mode === 'subculture' || mode === 'weekly';
      sourceGroup.classList.toggle('is-working', usesWorkingSourceLayout);
      sourceGroup.classList.toggle('is-weekly', mode === 'weekly');
      document.getElementById('entry-prepared-label').firstChild.textContent = (usesWorkingSourceLayout ? 'Number of Working Culture (Slant)' : 'Number of Working Culture Prepared (Slant)') + ' ';
      if (mode === 'weekly') sourceGrid.append(sourceField, preparedField, passageField, weeklyPassageField);
      else if (mode === 'subculture') sourceGrid.append(sourceField, preparedField, passageField);
      else {
        sourceGrid.append(passageField, sourceField);
        preparedGrid.prepend(preparedField);
      }
      weeklyPassageField.hidden = mode !== 'weekly';
      weeklyPassageField.querySelector('select').disabled = mode !== 'weekly';
      preparedGroup.hidden = mode !== 'culture';
      document.getElementById('entry-group-test').lastChild.textContent = mode === 'weekly' ? 'Subculture Preparation' : 'Identification test';
      document.getElementById('entry-group-test-number').textContent = mode === 'culture' ? '03' : '02';
      document.getElementById('entry-group-prepared-number').textContent = mode === 'culture' ? '04' : '03';
      const usesMedia = mode === 'weekly';
      document.getElementById('entry-lot-label').firstChild.textContent = usesMedia ? 'Media Lot Number ' : 'Kit Lot Number ';
      document.getElementById('entry-expiry-label').firstChild.textContent = usesMedia ? 'Media Expiry Date ' : 'Kit Expiry Date ';
      form.elements.lot.placeholder = usesMedia ? 'Enter media lot number' : 'Enter kit lot number';
      document.querySelectorAll('[data-identification-field]').forEach(label => {
        label.hidden = mode === 'weekly';
        label.querySelector('select').disabled = mode === 'weekly';
      });
      const monthlyConfirmation = document.querySelector('[data-monthly-confirmation]');
      monthlyConfirmation.hidden = mode !== 'culture';
      monthlyConfirmation.querySelectorAll('input, select').forEach(field => { field.disabled = mode !== 'culture'; });
      const weeklyMediaField = document.querySelector('[data-weekly-media-field]');
      weeklyMediaField.hidden = mode !== 'weekly';
      weeklyMediaField.querySelector('select').disabled = mode !== 'weekly';
      const statusField = document.querySelector('[data-status-field]');
      statusField.hidden = mode === 'weekly';
      statusField.querySelector('select').disabled = mode === 'weekly';
      document.querySelectorAll('[data-culture-field]').forEach(label => {
        label.hidden = mode === 'subculture';
        label.querySelector('input, select').disabled = mode === 'subculture';
      });
      preparedField.hidden = false;
      preparedField.querySelector('input').disabled = false;
      document.querySelectorAll('[data-weekly-field]').forEach(label => {
        label.hidden = mode !== 'weekly';
        label.querySelector('input').disabled = mode !== 'weekly';
      });
      updateExpected();
      renderRows();
    });
    tab.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % tabs.length :
        event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length :
        event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (target >= 0) { event.preventDefault(); tabs[target].focus(); tabs[target].click(); }
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!record || !form.reportValidity()) return;
    try {
      const rows = readEntryRows(localStorage, key);
      const data = Object.fromEntries(new FormData(form));
      const row = createEntryRow(record.id, mode, data, rows);
      localStorage.setItem(key, JSON.stringify([...rows, row]));
      error.hidden = true;
      renderRows();
      form.reset();
      updateExpected();
      notify('Successfully saved · ' + row.id);
    } catch (e) {
      report('Unable to save this entry. Check the fields and browser storage. Your input has been kept.');
    }
  });
  renderRows();
}

if (typeof module !== 'undefined' && module.exports) module.exports = { ENTRY_EXPECTED_RESULTS, readEntryRows, createEntryRow, performEntryRow, applyEntryAction, applyEntryActionToRows, filterEntryRows, filterPendingEndorsementRows };
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initEntry);
