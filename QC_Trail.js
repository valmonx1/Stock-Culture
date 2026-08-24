const params = new URLSearchParams(location.search);
const recordId = params.get('record');
let record = null;
try { record = (JSON.parse(localStorage.getItem('stock-culture-records') || '[]')).find(item => item.id === recordId) || null; } catch (error) {}

const organismMatch = String(record?.name || '').match(/^(.*?)\s+ATCC\s+(\d+)/i);
const organismName = organismMatch ? organismMatch[1] : (record?.name || 'QC organism');
const atcc = organismMatch ? `ATCC ${organismMatch[2]}` : '';
document.getElementById('trail-organism').textContent = organismName;
document.getElementById('trail-reference').textContent = `${record?.id || recordId || 'QC record'} · ${atcc || record?.code || ''}`;
document.getElementById('trail-avatar').textContent = organismName.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();

const fallbackEvents = [
  { process: 'Acceptance Testing', status: 'Passed', date: record?.received || '20 Jun 2026', user: 'Sarah A.', update: 'Acceptance result recorded.', details: ['Plate / media: Blood agar plate', 'Method: MALDI-TOF'] },
  { process: 'Culture Checking', status: 'Pass', date: '30 Jun 2026', user: 'Dr. Amir R.', update: 'Monthly checking completed.', details: ['Identification: Gram Stain', 'Performance: Pass'] },
  { process: 'Process Subculture', status: 'Completed', date: '01 Jul 2026', user: 'Sarah A.', update: 'Working stock prepared.', details: ['Source vial: V1', 'Passage number: 2'] },
  { process: 'Storage', status: 'Stored', date: record?.received || '01 Jul 2026', user: 'Sarah A.', update: 'Culture assigned to controlled storage.', details: ['Freezer: Freezer 01 · −80 °C', 'Rack / box: Rack A · Box 04'] }
];
let savedEvents = [];
try { savedEvents = JSON.parse(localStorage.getItem('qc-trail-events') || '[]').filter(event => !recordId || event.recordId === recordId); } catch (error) {}
const latestByProcess = new Map(savedEvents.map(event => [event.process, event]));
const events = fallbackEvents.map(event => latestByProcess.get(event.process) || event);
savedEvents.filter(event => !fallbackEvents.some(base => base.process === event.process)).forEach(event => events.push(event));

const trailList = document.querySelector('.trail-list');
trailList.innerHTML = events.map((event, index) => `<article class="trail-item"><div class="trail-marker marker-${['blue','purple','teal','green'][index % 4]}">${String(index + 1).padStart(2, '0')}</div><div class="trail-content"><div class="trail-title"><h3>${event.process}</h3><span class="status-badge status-active">${event.status}</span></div><p>${event.update || 'Update recorded.'}</p><div class="trail-meta">${(event.details || []).map(detail => `<span>${detail}</span>`).join('')}<span>Updated by: <strong>${event.user || '—'}</strong></span><time>${event.date || '—'}</time></div></div></article>`).join('');
document.querySelector('.trail-count').textContent = `${events.length} update${events.length === 1 ? '' : 's'}`;
document.getElementById('back-to-qc').addEventListener('click', () => { location.href = 'index.html'; });
