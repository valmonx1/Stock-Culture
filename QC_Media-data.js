'use strict';
(function () {
  const KEY = 'qc-media-records-v1';
  const seeds = [
    { id:'MED-2026-001', media:'Blood Agar Plate', lot:'BAP-26041', manufacturer:'Company A', dateReceived:'2026-08-18', checkedBy:'Admin', checkedAt:'2026-08-18T09:20:00+08:00', status:'Pass' },
    { id:'MED-2026-002', media:'Mueller-Hinton Agar', lot:'MHA-26052', manufacturer:'Company B', dateReceived:'2026-08-19', checkedBy:'Admin', checkedAt:'2026-08-19T10:10:00+08:00', status:'Pass' },
    { id:'MED-2026-003', media:'MacConkey Agar', lot:'MAC-26018', manufacturer:'Company A', dateReceived:'2026-08-21', checkedBy:'Admin', checkedAt:'2026-08-21T11:30:00+08:00', status:'Pending' }
  ];
  function read() { try { const value = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(value) ? value : seeds; } catch { return seeds; } }
  function write(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); return rows; }
  function nextId(rows) { const year = new Date().getFullYear(); const max = rows.reduce((n,r) => Math.max(n, Number(String(r.id||'').split('-').pop())||0), 0); return `MED-${year}-${String(max+1).padStart(3,'0')}`; }
  function find(id) { return read().find(row => row.id === id); }
  function update(id, changes) { const rows = read().map(row => row.id === id ? {...row,...changes} : row); write(rows); return rows.find(row => row.id === id); }
  window.QCMediaStore = { read, write, nextId, find, update };
})();
