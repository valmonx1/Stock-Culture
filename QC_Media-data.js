'use strict';
(function () {
  const KEY = 'qc-media-records-v1';
  const baseSeeds = [
    { id:'MED-2026-001', media:'Blood Agar Plate', lot:'BAP-26041', manufacturer:'Company A', dateReceived:'2026-08-18', checkedBy:'Admin', checkedAt:'2026-08-18T09:20:00+08:00', status:'Pass' },
    { id:'MED-2026-002', media:'Mueller-Hinton Agar', lot:'MHA-26052', manufacturer:'Company B', dateReceived:'2026-08-19', checkedBy:'Admin', checkedAt:'2026-08-19T10:10:00+08:00', status:'Pass' },
    { id:'MED-2026-003', media:'MacConkey Agar', lot:'MAC-26018', manufacturer:'Company A', dateReceived:'2026-08-21', checkedBy:'Admin', checkedAt:'2026-08-21T11:30:00+08:00', status:'Pending' }
  ];
  const mediaTypes = ['Blood Agar Plate','Mueller-Hinton Agar','MacConkey Agar','Sabouraud Dextrose Agar','Chocolate Agar','CLED Agar'];
  const manufacturers = ['Company A','Company B','Company C'];
  const seeds = [...baseSeeds];
  for (let n = 4; n <= 50; n++) {
    const media = mediaTypes[(n - 1) % mediaTypes.length], manufacturer = manufacturers[(n - 1) % manufacturers.length];
    const day = String(((n - 1) % 28) + 1).padStart(2, '0'), month = String(7 + (Math.floor((n - 1) / 28) % 2)).padStart(2, '0');
    const code = media.split(/\s+/).map(word => word[0]).join('').slice(0, 3).toUpperCase();
    seeds.push({ id:`MED-2026-${String(n).padStart(3,'0')}`, media, lot:`${code}-26${String(40+n).padStart(3,'0')}`, manufacturer, dateReceived:`2026-${month}-${day}`, checkedBy:'Admin', checkedAt:`2026-${month}-${day}T${String(8+(n%9)).padStart(2,'0')}:${n%2?'15':'40'}:00+08:00`, status:n%7===0?'Fail':n%3===0?'Pending':'Pass' });
  }
  function read() { try { const value = JSON.parse(localStorage.getItem(KEY)); if (!Array.isArray(value)) return seeds; const oldDemoOnly = value.length === 3 && value.every((row,index) => row.id === baseSeeds[index].id); return oldDemoOnly ? [...value,...seeds.slice(3)] : value; } catch { return seeds; } }
  function write(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); return rows; }
  function nextId(rows) { const year = new Date().getFullYear(); const max = rows.reduce((n,r) => Math.max(n, Number(String(r.id||'').split('-').pop())||0), 0); return `MED-${year}-${String(max+1).padStart(3,'0')}`; }
  function find(id) { return read().find(row => row.id === id); }
  function update(id, changes) { const rows = read().map(row => row.id === id ? {...row,...changes} : row); write(rows); return rows.find(row => row.id === id); }
  window.QCMediaStore = { read, write, nextId, find, update };
})();
